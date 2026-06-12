export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  owner: { login: string; avatar_url?: string };
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  open_issues_count: number;
  default_branch: string;
  license: { spdx_id: string; name: string } | null;
  visibility?: string;
  created_at: string;
  updated_at: string;
  pushed_at: string | null;
  size: number;
  network_count?: number;
  subscribers_count?: number;
  language: string | null;
  topics?: string[];
}

export interface GitHubSearchResult {
  total_count: number;
  incomplete_results: boolean;
  items: GitHubRepository[];
}

export interface LanguageMap {
  [language: string]: number;
}

export interface GitHubIssue {
  id: number;
  state: string;
  created_at: string;
  updated_at: string;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  used: number;
}

export interface HealthScoreResult {
  score: number;
  activityScore: number;
  popularityScore: number;
  maintenanceScore: number;
  documentationScore: number;
  riskScore: number;
  summary: 'Healthy' | 'Stable' | 'Needs Attention' | 'High Risk';
  recommendedAction: string;
}

export interface IssueSummary {
  openIssues: number;
  highActivityEstimate: boolean;
  recentIssueCount: number;
  staleIssueCount: number;
  issueRiskLevel: 'low' | 'medium' | 'high';
}

export interface LanguageBreakdown {
  language: string;
  bytes: number;
  percentage: number;
}

export interface RepositoryInsights {
  repository: GitHubRepository;
  languages: LanguageBreakdown[];
  healthScore: HealthScoreResult;
  issueSummary: IssueSummary;
  dataSource: 'GitHub API';
  cached: boolean;
  lastAnalyzedAt: string;
  maintenanceSignals: string[];
  documentationSignals: string[];
  riskSignals: string[];
}

export interface SavedRepository {
  id: number;
  github_id: number;
  owner: string;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stars: number;
  forks: number;
  watchers: number;
  open_issues: number;
  default_branch: string | null;
  license: string | null;
  visibility: string | null;
  created_at_github: string | null;
  updated_at_github: string | null;
  pushed_at: string | null;
  last_analyzed_at: string | null;
  created_at: string;
}

export interface ComparisonResult {
  repositories: Array<{
    id?: number;
    owner: string;
    name: string;
    fullName: string;
    healthScore: HealthScoreResult;
    stars: number;
    forks: number;
    openIssues: number;
    primaryLanguage: string | null;
    pushedAt: string | null;
  }>;
  winner: string;
  summary: string;
  labels: {
    bestMaintained: string;
    bestForLearning: string;
    highestCommunity: string;
    highestRisk: string;
  };
}
