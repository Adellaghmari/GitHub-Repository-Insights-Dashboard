import { PoolClient } from 'pg';
import * as github from './github.service';
import {
  calculateHealthScore,
  buildIssueSummary,
  buildSignals,
} from './healthScore.service';
import { query, withTransaction } from '../config/database';
import { isDatabaseConfigured } from '../config/env';
import {
  GitHubRepository,
  LanguageBreakdown,
  RepositoryInsights,
  SavedRepository,
  ComparisonResult,
} from '../types';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const parseLanguages = (langMap: Record<string, number>): LanguageBreakdown[] => {
  const total = Object.values(langMap).reduce((a, b) => a + b, 0);
  return Object.entries(langMap)
    .map(([language, bytes]) => ({
      language,
      bytes,
      percentage: total > 0 ? Math.round((bytes / total) * 10000) / 100 : 0,
    }))
    .sort((a, b) => b.bytes - a.bytes);
};

const isCacheValid = (lastAnalyzedAt: string | null): boolean => {
  if (!lastAnalyzedAt) return false;
  return Date.now() - new Date(lastAnalyzedAt).getTime() < CACHE_TTL_MS;
};

const mapSavedToGitHub = (saved: SavedRepository): GitHubRepository => ({
  id: saved.github_id,
  name: saved.name,
  full_name: saved.full_name,
  owner: { login: saved.owner },
  description: saved.description,
  html_url: saved.html_url,
  stargazers_count: saved.stars,
  forks_count: saved.forks,
  watchers_count: saved.watchers,
  open_issues_count: saved.open_issues,
  default_branch: saved.default_branch || 'main',
  license: saved.license ? { spdx_id: saved.license, name: saved.license } : null,
  created_at: saved.created_at_github || '',
  updated_at: saved.updated_at_github || '',
  pushed_at: saved.pushed_at,
  size: 0,
  language: null,
});

export const fetchLiveInsights = async (
  owner: string,
  repo: string
): Promise<RepositoryInsights> => {
  const [repository, langMap, issues] = await Promise.all([
    github.getRepository(owner, repo),
    github.getRepositoryLanguages(owner, repo),
    github.getRepositoryIssues(owner, repo, 'open', 30),
  ]);

  const languages = parseLanguages(langMap);
  const issueSummary = buildIssueSummary(repository, issues);
  const healthScore = calculateHealthScore(repository, issueSummary, languages);
  const signals = buildSignals(repository, issueSummary, healthScore);

  return {
    repository,
    languages,
    healthScore,
    issueSummary,
    dataSource: 'GitHub API',
    cached: false,
    lastAnalyzedAt: new Date().toISOString(),
    ...signals,
  };
};

const loadCachedInsights = async (
  owner: string,
  name: string
): Promise<RepositoryInsights | null> => {
  const savedResult = await query<SavedRepository>(
    `SELECT * FROM saved_repositories WHERE owner = $1 AND name = $2`,
    [owner, name]
  );
  if (!savedResult || savedResult.rows.length === 0) return null;

  const saved = savedResult.rows[0];
  if (!isCacheValid(saved.last_analyzed_at)) return null;

  const [langs, issuesSum, health] = await Promise.all([
    query<{ language: string; bytes: number; percentage: string }>(
      `SELECT language, bytes, percentage FROM repository_languages
       WHERE repository_id = $1 ORDER BY bytes DESC`,
      [saved.id]
    ),
    query<{
      open_issues: number;
      high_activity_estimate: boolean;
      recent_issue_count: number;
      stale_issue_count: number;
      issue_risk_level: string;
    }>(
      `SELECT * FROM repository_issues_summary
       WHERE repository_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [saved.id]
    ),
    query<{
      score: number;
      activity_score: number;
      popularity_score: number;
      maintenance_score: number;
      documentation_score: number;
      risk_score: number;
      summary: string;
      recommended_action: string;
    }>(
      `SELECT * FROM repository_health_scores
       WHERE repository_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [saved.id]
    ),
  ]);

  if (!health || health.rows.length === 0) return null;

  const h = health.rows[0];
  const iss = issuesSum?.rows[0];

  return {
    repository: mapSavedToGitHub(saved),
    languages: (langs?.rows || []).map((l) => ({
      language: l.language,
      bytes: Number(l.bytes),
      percentage: Number(l.percentage),
    })),
    healthScore: {
      score: h.score,
      activityScore: h.activity_score,
      popularityScore: h.popularity_score,
      maintenanceScore: h.maintenance_score,
      documentationScore: h.documentation_score,
      riskScore: h.risk_score,
      summary: h.summary as RepositoryInsights['healthScore']['summary'],
      recommendedAction: h.recommended_action,
    },
    issueSummary: {
      openIssues: iss?.open_issues ?? saved.open_issues,
      highActivityEstimate: iss?.high_activity_estimate ?? false,
      recentIssueCount: iss?.recent_issue_count ?? 0,
      staleIssueCount: iss?.stale_issue_count ?? 0,
      issueRiskLevel: (iss?.issue_risk_level as 'low' | 'medium' | 'high') ?? 'low',
    },
    dataSource: 'GitHub API',
    cached: true,
    lastAnalyzedAt: saved.last_analyzed_at!,
    ...buildSignals(
      mapSavedToGitHub(saved),
      {
        openIssues: iss?.open_issues ?? saved.open_issues,
        highActivityEstimate: iss?.high_activity_estimate ?? false,
        recentIssueCount: iss?.recent_issue_count ?? 0,
        staleIssueCount: iss?.stale_issue_count ?? 0,
        issueRiskLevel: (iss?.issue_risk_level as 'low' | 'medium' | 'high') ?? 'low',
      },
      {
        score: h.score,
        activityScore: h.activity_score,
        popularityScore: h.popularity_score,
        maintenanceScore: h.maintenance_score,
        documentationScore: h.documentation_score,
        riskScore: h.risk_score,
        summary: h.summary as RepositoryInsights['healthScore']['summary'],
        recommendedAction: h.recommended_action,
      }
    ),
  };
};

const persistInsights = async (
  insights: RepositoryInsights
): Promise<number | null> => {
  if (!isDatabaseConfigured()) return null;

  const repo = insights.repository;

  return withTransaction(async (client: PoolClient) => {
    const upsert = await client.query<SavedRepository>(
      `INSERT INTO saved_repositories (
        github_id, owner, name, full_name, description, html_url,
        stars, forks, watchers, open_issues, default_branch, license,
        visibility, created_at_github, updated_at_github, pushed_at, last_analyzed_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
      ON CONFLICT (github_id) DO UPDATE SET
        description = EXCLUDED.description,
        stars = EXCLUDED.stars,
        forks = EXCLUDED.forks,
        watchers = EXCLUDED.watchers,
        open_issues = EXCLUDED.open_issues,
        pushed_at = EXCLUDED.pushed_at,
        last_analyzed_at = EXCLUDED.last_analyzed_at,
        updated_at_github = EXCLUDED.updated_at_github
      RETURNING *`,
      [
        repo.id,
        repo.owner.login,
        repo.name,
        repo.full_name,
        repo.description,
        repo.html_url,
        repo.stargazers_count,
        repo.forks_count,
        repo.watchers_count,
        repo.open_issues_count,
        repo.default_branch,
        repo.license?.spdx_id || null,
        repo.visibility || 'public',
        repo.created_at,
        repo.updated_at,
        repo.pushed_at,
        insights.lastAnalyzedAt,
      ]
    );

    const saved = upsert.rows[0];
    const repoId = saved.id;

    await client.query(
      `INSERT INTO repository_snapshots (
        repository_id, stars, forks, watchers, open_issues, size,
        network_count, subscribers_count, pushed_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        repoId,
        repo.stargazers_count,
        repo.forks_count,
        repo.watchers_count,
        repo.open_issues_count,
        repo.size,
        repo.network_count || 0,
        repo.subscribers_count || 0,
        repo.pushed_at,
      ]
    );

    await client.query(
      `DELETE FROM repository_languages WHERE repository_id = $1`,
      [repoId]
    );
    for (const lang of insights.languages) {
      await client.query(
        `INSERT INTO repository_languages (repository_id, language, bytes, percentage)
         VALUES ($1, $2, $3, $4)`,
        [repoId, lang.language, lang.bytes, lang.percentage]
      );
    }

    await client.query(
      `INSERT INTO repository_issues_summary (
        repository_id, open_issues, high_activity_estimate,
        recent_issue_count, stale_issue_count, issue_risk_level
      ) VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        repoId,
        insights.issueSummary.openIssues,
        insights.issueSummary.highActivityEstimate,
        insights.issueSummary.recentIssueCount,
        insights.issueSummary.staleIssueCount,
        insights.issueSummary.issueRiskLevel,
      ]
    );

    await client.query(
      `INSERT INTO repository_health_scores (
        repository_id, score, activity_score, popularity_score,
        maintenance_score, documentation_score, risk_score,
        summary, recommended_action
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        repoId,
        insights.healthScore.score,
        insights.healthScore.activityScore,
        insights.healthScore.popularityScore,
        insights.healthScore.maintenanceScore,
        insights.healthScore.documentationScore,
        insights.healthScore.riskScore,
        insights.healthScore.summary,
        insights.healthScore.recommendedAction,
      ]
    );

    return repoId;
  });
};

export const getRepositoryInsights = async (
  owner: string,
  repo: string
): Promise<RepositoryInsights> => {
  if (isDatabaseConfigured()) {
    const cached = await loadCachedInsights(owner, repo);
    if (cached) return cached;
  }

  const insights = await fetchLiveInsights(owner, repo);
  await persistInsights(insights);
  return insights;
};

export const saveRepository = async (
  owner: string,
  repo: string
): Promise<{ id: number; insights: RepositoryInsights }> => {
  const insights = await fetchLiveInsights(owner, repo);
  const id = await persistInsights(insights);
  if (id === null) {
    throw new Error('DATABASE_UNAVAILABLE');
  }
  return { id, insights };
};

export const getSavedRepositories = async (
  sort = 'last_analyzed_at',
  order: 'asc' | 'desc' = 'desc',
  filter?: string
): Promise<SavedRepository[]> => {
  const allowedSorts = ['stars', 'forks', 'open_issues', 'last_analyzed_at', 'name', 'created_at'];
  const sortCol = allowedSorts.includes(sort) ? sort : 'last_analyzed_at';
  const sortOrder = order === 'asc' ? 'ASC' : 'DESC';

  let sql = `SELECT * FROM saved_repositories`;
  const params: unknown[] = [];

  if (filter) {
    sql += ` WHERE full_name ILIKE $1 OR description ILIKE $1`;
    params.push(`%${filter}%`);
  }

  sql += ` ORDER BY ${sortCol} ${sortOrder}`;

  const result = await query<SavedRepository>(sql, params);
  return result?.rows || [];
};

export const getSavedRepositoryById = async (
  id: number
): Promise<SavedRepository | null> => {
  const result = await query<SavedRepository>(
    `SELECT * FROM saved_repositories WHERE id = $1`,
    [id]
  );
  return result?.rows[0] || null;
};

export const deleteSavedRepository = async (id: number): Promise<boolean> => {
  const result = await query(`DELETE FROM saved_repositories WHERE id = $1`, [id]);
  return (result?.rowCount ?? 0) > 0;
};

export const compareRepositories = async (
  repos: Array<{ owner: string; name: string }>
): Promise<ComparisonResult> => {
  const results = await Promise.all(
    repos.map(async (r) => {
      const insights = await getRepositoryInsights(r.owner, r.name);
      return {
        owner: r.owner,
        name: r.name,
        fullName: insights.repository.full_name,
        healthScore: insights.healthScore,
        stars: insights.repository.stargazers_count,
        forks: insights.repository.forks_count,
        openIssues: insights.repository.open_issues_count,
        primaryLanguage: insights.languages[0]?.language || insights.repository.language,
        pushedAt: insights.repository.pushed_at,
      };
    })
  );

  const bestMaintained = [...results].sort(
    (a, b) => b.healthScore.maintenanceScore - a.healthScore.maintenanceScore
  )[0];

  const bestForLearning = [...results].sort(
    (a, b) => b.healthScore.popularityScore - a.healthScore.popularityScore
  )[0];

  const highestCommunity = [...results].sort((a, b) => b.stars - a.stars)[0];

  const highestRisk = [...results].sort(
    (a, b) => b.healthScore.riskScore - a.healthScore.riskScore
  )[0];

  const overallWinner = [...results].sort(
    (a, b) => b.healthScore.score - a.healthScore.score
  )[0];

  const summary = `Compared ${results.length} repositories. ${overallWinner.fullName} leads with a health score of ${overallWinner.healthScore.score}.`;

  return {
    repositories: results,
    winner: overallWinner.fullName,
    summary,
    labels: {
      bestMaintained: bestMaintained.fullName,
      bestForLearning: bestForLearning.fullName,
      highestCommunity: highestCommunity.fullName,
      highestRisk: highestRisk.fullName,
    },
  };
};

export const recordSearch = async (queryStr: string, resultCount: number): Promise<void> => {
  if (!isDatabaseConfigured()) return;
  await query(
    `INSERT INTO search_history (query, result_count) VALUES ($1, $2)`,
    [queryStr, resultCount]
  );
};

export const getSearchHistory = async (limit = 20) => {
  const result = await query<{ id: number; query: string; result_count: number; created_at: string }>(
    `SELECT * FROM search_history ORDER BY created_at DESC LIMIT $1`,
    [limit]
  );
  return result?.rows || [];
};

export const getRiskCenterData = async () => {
  if (!isDatabaseConfigured()) {
    return {
      highRisk: [],
      stale: [],
      missingLicense: [],
      highIssueRatio: [],
      lowActivity: [],
    };
  }

  const saved = await getSavedRepositories();
  if (saved.length === 0) {
    return {
      highRisk: [],
      stale: [],
      missingLicense: [],
      highIssueRatio: [],
      lowActivity: [],
    };
  }

  const enriched = await Promise.all(
    saved.map(async (s) => {
      const insights = await loadCachedInsights(s.owner, s.name);
      return { saved: s, insights };
    })
  );

  const valid = enriched.filter((e) => e.insights);

  return {
    highRisk: valid
      .filter((e) => e.insights!.healthScore.summary === 'High Risk' || e.insights!.healthScore.riskScore >= 60)
      .map((e) => ({ ...e.saved, health: e.insights!.healthScore })),
    stale: valid
      .filter((e) => {
        if (!e.saved.pushed_at) return true;
        const days = (Date.now() - new Date(e.saved.pushed_at).getTime()) / (1000 * 60 * 60 * 24);
        return days > 180;
      })
      .map((e) => ({ ...e.saved, health: e.insights!.healthScore })),
    missingLicense: valid
      .filter((e) => !e.saved.license)
      .map((e) => ({ ...e.saved, health: e.insights!.healthScore })),
    highIssueRatio: valid
      .filter((e) => e.saved.stars > 0 && e.saved.open_issues / e.saved.stars > 0.05)
      .map((e) => ({ ...e.saved, health: e.insights!.healthScore })),
    lowActivity: valid
      .filter((e) => e.insights!.healthScore.activityScore < 40)
      .map((e) => ({ ...e.saved, health: e.insights!.healthScore })),
  };
};

export const getDashboardData = async () => {
  const rateLimit = github.getRateLimitStatus();
  const dbStatus = isDatabaseConfigured();

  let savedCount = 0;
  let recentSearches: Array<{ query: string; result_count: number; created_at: string }> = [];
  let topRepos: SavedRepository[] = [];

  if (dbStatus) {
    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM saved_repositories`
    );
    savedCount = parseInt(countResult?.rows[0]?.count || '0', 10);
    recentSearches = await getSearchHistory(5);
    topRepos = (await getSavedRepositories('stars', 'desc')).slice(0, 5);
  }

  return {
    savedCount,
    recentSearches,
    topRepos,
    rateLimit,
    hasGitHubToken: Boolean(process.env.GITHUB_TOKEN),
    databaseAvailable: dbStatus,
  };
};
