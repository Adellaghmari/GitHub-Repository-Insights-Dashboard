import type { HealthScore, RepositoryInsights, ComparisonResult } from '../types';

export interface ExecutiveSummary {
  recommendation: string;
  whyItMatters: string;
  watchOutFor: string;
  bestUseCase: string;
}

export function getHealthExplanation(health: HealthScore): string {
  switch (health.summary) {
    case 'Healthy':
      return 'Strong activity, community signal and documentation. Technical risk is low.';
    case 'Stable':
      return 'Repository shows solid maintenance patterns with acceptable risk levels.';
    case 'Needs Attention':
      return 'Some metrics suggest caution. Review activity, issues and documentation before adopting.';
    case 'High Risk':
      return 'Multiple risk signals detected. Evaluate maintenance commitment before production use.';
    default:
      return 'Score calculated from activity, popularity, maintenance, documentation and risk factors.';
  }
}

export function splitRecommendedActions(text: string): string[] {
  return text
    .split(/(?<=\.)\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function formatRepoSize(kb: number | undefined): string {
  if (!kb) return 'Not available';
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`;
  return `${kb} KB`;
}

const daysSince = (dateStr: string | null): number => {
  if (!dateStr) return 9999;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
};

export function buildExecutiveSummary(insights: RepositoryInsights): ExecutiveSummary {
  const { repository: r, healthScore, issueSummary } = insights;

  let recommendation: string;
  if (healthScore.summary === 'Healthy' || healthScore.summary === 'Stable') {
    recommendation = 'Safe to evaluate';
  } else if (healthScore.summary === 'Needs Attention') {
    recommendation = 'Evaluate with caution';
  } else {
    recommendation = 'High caution advised';
  }

  const parts: string[] = [];
  if (r.stargazers_count >= 10000) {
    parts.push('Strong community signal');
  } else if (r.stargazers_count >= 1000) {
    parts.push('Solid community adoption');
  } else if (r.stargazers_count >= 100) {
    parts.push('Moderate community presence');
  }

  const pushDays = daysSince(r.pushed_at);
  if (pushDays <= 30) {
    parts.push('recent maintenance activity');
  } else if (pushDays <= 90) {
    parts.push('reasonably recent updates');
  } else if (pushDays > 180) {
    parts.push('limited recent activity');
  }

  if (healthScore.maintenanceScore >= 70) {
    parts.push('healthy maintenance patterns');
  }

  const whyItMatters = parts.length > 0
    ? parts.join(', ').replace(/^./, (c) => c.toUpperCase()) + '.'
    : 'Health score reflects current activity and maintenance signals from GitHub.';

  const watchParts: string[] = [];
  if (issueSummary.openIssues > 100 || issueSummary.issueRiskLevel !== 'low') {
    watchParts.push('High issue volume can indicate active maintenance load');
  } else if (issueSummary.openIssues > 30) {
    watchParts.push('Open issue count worth reviewing before production use');
  }
  if (!r.license) {
    watchParts.push('No license declared for commercial use');
  }
  if (pushDays > 180) {
    watchParts.push('Repository has not been updated recently');
  }
  if (issueSummary.staleIssueCount > 10) {
    watchParts.push(`${issueSummary.staleIssueCount} stale open issues detected`);
  }

  const watchOutFor = watchParts.length > 0
    ? watchParts.join('. ') + '.'
    : 'No major risk flags in the current analysis.';

  let bestUseCase: string;
  if (healthScore.popularityScore >= 70 && healthScore.activityScore >= 60) {
    bestUseCase = 'Learning, reference or production evaluation';
  } else if (healthScore.popularityScore >= 50) {
    bestUseCase = 'Learning and technical reference';
  } else if (healthScore.riskScore >= 60) {
    bestUseCase = 'Careful evaluation only, not recommended for production';
  } else {
    bestUseCase = 'Exploration and technical assessment';
  }

  return { recommendation, whyItMatters, watchOutFor, bestUseCase };
}

export function buildStakeholderSummary(insights: RepositoryInsights): string {
  const { repository: r, healthScore, issueSummary } = insights;
  const parts: string[] = [];

  if (r.stargazers_count >= 10000) {
    parts.push('This repository has strong adoption');
  } else if (r.stargazers_count >= 1000) {
    parts.push('This repository has solid adoption');
  } else {
    parts.push('This repository has a smaller community footprint');
  }

  const pushDays = daysSince(r.pushed_at);
  if (pushDays <= 30) {
    parts.push('recent development activity');
  } else if (pushDays <= 90) {
    parts.push('ongoing maintenance');
  } else {
    parts.push('limited recent updates');
  }

  let tone: string;
  if (healthScore.summary === 'Healthy' || healthScore.summary === 'Stable') {
    tone = 'It looks safe to evaluate';
  } else if (healthScore.summary === 'Needs Attention') {
    tone = 'It warrants a closer review before adoption';
  } else {
    tone = 'It carries elevated technical risk';
  }

  let issueNote = '';
  if (issueSummary.openIssues > 50 || issueSummary.issueRiskLevel === 'high') {
    issueNote = ', but the open issue volume should be reviewed before production use';
  } else if (issueSummary.openIssues > 20) {
    issueNote = '. Review open issues before committing to production use';
  } else {
    issueNote = '';
  }

  return `${parts.join(' and ')}. ${tone}${issueNote}.`;
}

export interface DecisionSummary {
  recommendedChoice: string;
  whyItWins: string;
  tradeoff: string;
  bestUseCase: string;
}

export function resolveRepoFullName(repo: {
  owner: string;
  name: string;
  fullName?: string;
}): string {
  if (repo.fullName && repo.fullName.includes('/')) {
    return repo.fullName;
  }
  return `${repo.owner}/${repo.name}`;
}

export function buildDecisionSummary(result: ComparisonResult): DecisionSummary {
  const sorted = [...result.repositories].sort(
    (a, b) => b.healthScore.score - a.healthScore.score
  );
  const winner = sorted[0];
  const runnerUp = sorted[1];
  const recommendedChoice = resolveRepoFullName(winner);

  const scoreGap = runnerUp
    ? winner.healthScore.score - runnerUp.healthScore.score
    : 100;
  const scoresClose = runnerUp !== undefined && scoreGap <= 5;

  let whyItWins: string;
  if (scoresClose) {
    whyItWins =
      'Both repositories are strong. The recommendation is based on the highest overall health score.';
  } else {
    const reasons: string[] = [];
    if (runnerUp && winner.healthScore.maintenanceScore > runnerUp.healthScore.maintenanceScore) {
      reasons.push('higher maintenance score');
    }
    if (runnerUp && winner.healthScore.documentationScore > runnerUp.healthScore.documentationScore) {
      reasons.push('stronger documentation signal');
    }
    if (runnerUp && winner.healthScore.activityScore > runnerUp.healthScore.activityScore) {
      reasons.push('better activity score');
    }
    whyItWins = reasons.length > 0
      ? `Stronger overall health score with ${reasons.join(' and ')}.`
      : 'Stronger overall health score and community signal.';
  }

  let tradeoff: string;
  if (winner.openIssues > 100 || winner.healthScore.riskScore >= 50) {
    tradeoff = 'Compare issue volume and risk score before production use.';
  } else if (winner.openIssues > 30) {
    tradeoff = 'High issue volume should be reviewed before production use.';
  } else {
    tradeoff = 'Review license and issue backlog before committing to production.';
  }

  let bestUseCase: string;
  if (winner.healthScore.popularityScore >= 70 && winner.healthScore.activityScore >= 60) {
    bestUseCase = 'Learning, reference and production evaluation';
  } else if (winner.healthScore.popularityScore >= 50) {
    bestUseCase = 'Learning and technical reference';
  } else {
    bestUseCase = 'Technical evaluation and exploration';
  }

  return { recommendedChoice, whyItWins, tradeoff, bestUseCase };
}

export function formatApiErrorMessage(message?: string, code?: string): string {
  if (code === 'RATE_LIMIT' || message?.toLowerCase().includes('rate limit')) {
    return 'GitHub API rate limit reached. Try again after reset or use cached reports where available.';
  }
  return message || 'Request failed.';
}

export function formatRepositoryNotFoundError(message?: string, code?: string): string {
  if (
    code === 'NOT_FOUND' ||
    message?.toLowerCase().includes('not found')
  ) {
    return 'Repository not found. Check that owner and repository are in the correct fields.';
  }
  return message || 'Request failed.';
}
