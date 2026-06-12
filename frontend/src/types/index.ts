export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  used: number;
}

export interface HealthScore {
  score: number;
  activityScore: number;
  popularityScore: number;
  maintenanceScore: number;
  documentationScore: number;
  riskScore: number;
  summary: 'Healthy' | 'Stable' | 'Needs Attention' | 'High Risk';
  recommendedAction: string;
}

export interface SearchResultItem {
  id: number;
  owner: string;
  name: string;
  fullName: string;
  description: string | null;
  htmlUrl: string;
  stars: number;
  forks: number;
  openIssues: number;
  language: string | null;
  updatedAt: string;
  pushedAt: string | null;
  license: string | null;
  riskHint: string;
}

export interface LanguageBreakdown {
  language: string;
  bytes: number;
  percentage: number;
}

export interface IssueSummary {
  openIssues: number;
  highActivityEstimate: boolean;
  recentIssueCount: number;
  staleIssueCount: number;
  issueRiskLevel: 'low' | 'medium' | 'high';
}

export interface RepositoryInsights {
  repository: {
    id: number;
    name: string;
    full_name: string;
    owner: { login: string };
    description: string | null;
    html_url: string;
    stargazers_count: number;
    forks_count: number;
    watchers_count: number;
    open_issues_count: number;
    default_branch: string;
    license: { spdx_id: string; name: string } | null;
    created_at: string;
    updated_at: string;
    pushed_at: string | null;
    language: string | null;
    size?: number;
  };
  languages: LanguageBreakdown[];
  healthScore: HealthScore;
  issueSummary: IssueSummary;
  dataSource: string;
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
  pushed_at: string | null;
  last_analyzed_at: string | null;
  created_at: string;
}

export interface DashboardData {
  savedCount: number;
  recentSearches: Array<{ query: string; result_count: number; created_at: string }>;
  topRepos: SavedRepository[];
  rateLimit: RateLimitInfo | null;
  hasGitHubToken: boolean;
  databaseAvailable: boolean;
  database: { configured: boolean; connected: boolean };
}

export interface ComparisonResult {
  repositories: Array<{
    owner: string;
    name: string;
    fullName: string;
    healthScore: HealthScore;
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
  databaseAvailable?: boolean;
}

export interface RiskCenterData {
  highRisk: Array<SavedRepository & { health: HealthScore }>;
  stale: Array<SavedRepository & { health: HealthScore }>;
  missingLicense: Array<SavedRepository & { health: HealthScore }>;
  highIssueRatio: Array<SavedRepository & { health: HealthScore }>;
  lowActivity: Array<SavedRepository & { health: HealthScore }>;
  databaseAvailable: boolean;
}

export type ApiConnectionStatus = 'checking' | 'connected' | 'unavailable';
export type DatabaseConnectionStatus = 'checking' | 'connected' | 'not_configured' | 'unavailable';

export interface ApiStatus {
  apiConnection: ApiConnectionStatus;
  databaseConnection: DatabaseConnectionStatus;
  apiAvailable: boolean;
  databaseAvailable: boolean;
  databaseConnected: boolean;
  rateLimit: RateLimitInfo | null;
  hasGitHubToken: boolean;
}

export interface MonitorData {
  apiStatus: string;
  databaseStatus: 'connected' | 'not_configured' | 'unavailable';
  githubRateLimit: {
    remaining: number;
    limit: number;
    used: number;
    resetAt: string;
  } | null;
  cache: {
    ttlHours: number;
    strategy: string;
    freshLabel: string;
    cachedLabel: string;
    fallbackNote: string;
  };
  githubToken: {
    configured: boolean;
  };
  lastCheckedAt: string;
}
