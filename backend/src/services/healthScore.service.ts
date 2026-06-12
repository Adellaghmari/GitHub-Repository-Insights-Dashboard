import {
  GitHubRepository,
  HealthScoreResult,
  IssueSummary,
  LanguageBreakdown,
} from '../types';

const daysSince = (dateStr: string | null): number => {
  if (!dateStr) return 9999;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

const clamp = (val: number, min = 0, max = 100): number =>
  Math.max(min, Math.min(max, Math.round(val)));

export const calculateActivityScore = (repo: GitHubRepository): number => {
  const days = daysSince(repo.pushed_at);
  if (days <= 7) return 95;
  if (days <= 30) return 80;
  if (days <= 90) return 60;
  if (days <= 180) return 40;
  if (days <= 365) return 25;
  return 10;
};

export const calculatePopularityScore = (repo: GitHubRepository): number => {
  const stars = repo.stargazers_count;
  const forks = repo.forks_count;
  const watchers = repo.watchers_count;

  let score = 0;
  if (stars >= 50000) score += 50;
  else if (stars >= 10000) score += 40;
  else if (stars >= 1000) score += 30;
  else if (stars >= 100) score += 20;
  else if (stars >= 10) score += 10;
  else score += 5;

  if (forks >= 5000) score += 25;
  else if (forks >= 500) score += 20;
  else if (forks >= 50) score += 15;
  else if (forks >= 5) score += 10;
  else score += 3;

  if (watchers >= 1000) score += 25;
  else if (watchers >= 100) score += 15;
  else score += 5;

  return clamp(score);
};

export const calculateMaintenanceScore = (
  repo: GitHubRepository,
  issueSummary: IssueSummary
): number => {
  let score = 70;

  const issueRatio = repo.stargazers_count > 0
    ? repo.open_issues_count / repo.stargazers_count
    : repo.open_issues_count > 50 ? 1 : 0;

  if (issueRatio > 0.1) score -= 30;
  else if (issueRatio > 0.05) score -= 20;
  else if (issueRatio > 0.02) score -= 10;

  if (issueSummary.staleIssueCount > 20) score -= 20;
  else if (issueSummary.staleIssueCount > 10) score -= 10;

  if (daysSince(repo.pushed_at) > 180) score -= 25;
  else if (daysSince(repo.pushed_at) > 90) score -= 15;

  if (repo.default_branch) score += 5;

  return clamp(score);
};

export const calculateDocumentationScore = (repo: GitHubRepository): number => {
  let score = 50;

  if (repo.description && repo.description.length > 20) score += 25;
  else if (repo.description) score += 10;
  else score -= 20;

  if (repo.license) score += 25;
  else score -= 15;

  if (repo.topics && repo.topics.length > 0) score += 10;

  return clamp(score);
};

export const calculateRiskScore = (
  repo: GitHubRepository,
  issueSummary: IssueSummary
): number => {
  let risk = 10;

  if (daysSince(repo.pushed_at) > 365) risk += 35;
  else if (daysSince(repo.pushed_at) > 180) risk += 25;
  else if (daysSince(repo.pushed_at) > 90) risk += 15;

  if (!repo.license) risk += 15;
  if (!repo.description) risk += 10;

  const issueRatio = repo.stargazers_count > 0
    ? repo.open_issues_count / repo.stargazers_count
    : repo.open_issues_count / 10;

  if (issueRatio > 0.1) risk += 25;
  else if (issueRatio > 0.05) risk += 15;
  else if (issueRatio > 0.02) risk += 8;

  if (issueSummary.issueRiskLevel === 'high') risk += 20;
  else if (issueSummary.issueRiskLevel === 'medium') risk += 10;

  return clamp(risk);
};

export const buildIssueSummary = (
  repo: GitHubRepository,
  issues: Array<{ created_at: string; updated_at: string }>
): IssueSummary => {
  const now = Date.now();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  const ninetyDays = 90 * 24 * 60 * 60 * 1000;

  let recentCount = 0;
  let staleCount = 0;

  for (const issue of issues) {
    const updated = new Date(issue.updated_at).getTime();
    const created = new Date(issue.created_at).getTime();
    if (now - created < thirtyDays) recentCount++;
    if (now - updated > ninetyDays) staleCount++;
  }

  const openIssues = repo.open_issues_count;
  const ratio = repo.stargazers_count > 0
    ? openIssues / repo.stargazers_count
    : openIssues / 50;

  let issueRiskLevel: 'low' | 'medium' | 'high' = 'low';
  if (ratio > 0.08 || staleCount > 15) issueRiskLevel = 'high';
  else if (ratio > 0.03 || staleCount > 5) issueRiskLevel = 'medium';

  return {
    openIssues,
    highActivityEstimate: recentCount > 5,
    recentIssueCount: recentCount,
    staleIssueCount: staleCount,
    issueRiskLevel,
  };
};

export const getRecommendedAction = (
  repo: GitHubRepository,
  health: Omit<HealthScoreResult, 'recommendedAction'>
): string => {
  const actions: string[] = [];

  if (daysSince(repo.pushed_at) > 180) {
    actions.push('Repository has not been updated recently.');
  } else if (daysSince(repo.pushed_at) <= 30) {
    actions.push('Repository looks active and maintained.');
  }

  if (repo.open_issues_count > 100 && repo.stargazers_count < 1000) {
    actions.push('High issue count suggests maintenance risk.');
  } else if (repo.open_issues_count > 50) {
    actions.push('Review open issues before depending on this repository.');
  }

  if (!repo.license) {
    actions.push('Check license before using this project commercially.');
  }

  if (health.popularityScore >= 70 && health.activityScore >= 60) {
    actions.push('Good candidate for learning or reference.');
  }

  if (health.riskScore >= 60) {
    actions.push('Evaluate maintenance commitment before production use.');
  }

  return actions.length > 0
    ? actions.join(' ')
    : 'Repository metrics look balanced for typical use cases.';
};

export const calculateHealthScore = (
  repo: GitHubRepository,
  issueSummary: IssueSummary,
  languages: LanguageBreakdown[]
): HealthScoreResult => {
  const activityScore = calculateActivityScore(repo);
  const popularityScore = calculatePopularityScore(repo);
  const maintenanceScore = calculateMaintenanceScore(repo, issueSummary);
  const documentationScore = calculateDocumentationScore(repo);
  const riskScore = calculateRiskScore(repo, issueSummary);

  const languageBonus = languages.length >= 3 ? 3 : languages.length >= 2 ? 1 : 0;

  const score = clamp(
    activityScore * 0.25 +
    popularityScore * 0.2 +
    maintenanceScore * 0.25 +
    documentationScore * 0.15 +
    (100 - riskScore) * 0.15 +
    languageBonus
  );

  let summary: HealthScoreResult['summary'];
  if (score >= 75) summary = 'Healthy';
  else if (score >= 55) summary = 'Stable';
  else if (score >= 35) summary = 'Needs Attention';
  else summary = 'High Risk';

  const partial = { score, activityScore, popularityScore, maintenanceScore, documentationScore, riskScore, summary };
  const recommendedAction = getRecommendedAction(repo, partial);

  return { ...partial, recommendedAction };
};

export const buildSignals = (
  repo: GitHubRepository,
  issueSummary: IssueSummary,
  health: HealthScoreResult
): {
  maintenanceSignals: string[];
  documentationSignals: string[];
  riskSignals: string[];
} => {
  const maintenanceSignals: string[] = [];
  const documentationSignals: string[] = [];
  const riskSignals: string[] = [];

  const pushDays = daysSince(repo.pushed_at);
  if (pushDays <= 7) maintenanceSignals.push('Pushed within the last week');
  else if (pushDays <= 30) maintenanceSignals.push('Updated within 30 days');
  else if (pushDays > 180) maintenanceSignals.push('No push activity in 6+ months');

  if (issueSummary.highActivityEstimate) {
    maintenanceSignals.push('Recent issue activity detected');
  }
  if (issueSummary.staleIssueCount > 10) {
    maintenanceSignals.push(`${issueSummary.staleIssueCount} stale open issues`);
  }

  if (repo.description) documentationSignals.push('Description provided');
  else documentationSignals.push('Missing repository description');

  if (repo.license) documentationSignals.push(`License: ${repo.license.spdx_id || repo.license.name}`);
  else documentationSignals.push('No license declared');

  if (repo.default_branch) documentationSignals.push(`Default branch: ${repo.default_branch}`);

  if (health.riskScore >= 60) riskSignals.push('Elevated technical risk score');
  if (!repo.license) riskSignals.push('License gap for commercial use');
  if (pushDays > 365) riskSignals.push('Project may be abandoned');
  if (issueSummary.issueRiskLevel === 'high') riskSignals.push('High open issue ratio');

  return { maintenanceSignals, documentationSignals, riskSignals };
};
