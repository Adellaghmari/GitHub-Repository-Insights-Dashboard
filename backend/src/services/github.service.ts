import { env } from '../config/env';
import { AppError } from '../middleware/errorHandler';
import {
  GitHubRepository,
  GitHubSearchResult,
  GitHubIssue,
  LanguageMap,
  RateLimitInfo,
} from '../types';

const GITHUB_API = 'https://api.github.com';

let lastRateLimit: RateLimitInfo | null = null;

const getHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'GitHub-Repository-Insights',
  };
  if (env.githubToken) {
    headers.Authorization = `Bearer ${env.githubToken}`;
  }
  return headers;
};

const parseRateLimit = (response: Response): RateLimitInfo => {
  const info: RateLimitInfo = {
    limit: parseInt(response.headers.get('x-ratelimit-limit') || '60', 10),
    remaining: parseInt(response.headers.get('x-ratelimit-remaining') || '0', 10),
    reset: parseInt(response.headers.get('x-ratelimit-reset') || '0', 10),
    used: 0,
  };
  info.used = info.limit - info.remaining;
  lastRateLimit = info;
  return info;
};

export const getRateLimitStatus = (): RateLimitInfo | null => lastRateLimit;

export const fetchRateLimit = async (): Promise<RateLimitInfo | null> => {
  try {
    const response = await fetch(`${GITHUB_API}/rate_limit`, {
      headers: getHeaders(),
    });
    if (!response.ok) return lastRateLimit;

    const data = await response.json() as {
      resources: { core: { limit: number; remaining: number; reset: number; used: number } };
    };

    const core = data.resources.core;
    const info: RateLimitInfo = {
      limit: core.limit,
      remaining: core.remaining,
      reset: core.reset,
      used: core.used,
    };
    lastRateLimit = info;
    return info;
  } catch {
    return lastRateLimit;
  }
};

const handleGitHubResponse = async <T>(response: Response): Promise<T> => {
  parseRateLimit(response);

  if (response.status === 404) {
    throw new AppError('Repository not found', 404, 'NOT_FOUND');
  }

  if (response.status === 403) {
    const remaining = parseInt(response.headers.get('x-ratelimit-remaining') || '0', 10);
    if (remaining === 0) {
      const reset = parseInt(response.headers.get('x-ratelimit-reset') || '0', 10);
      throw new AppError(
        `GitHub API rate limit reached. Resets at ${new Date(reset * 1000).toISOString()}`,
        429,
        'RATE_LIMIT'
      );
    }
    throw new AppError('GitHub API access forbidden', 403, 'FORBIDDEN');
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new AppError(
      `GitHub API error: ${response.status} ${body.slice(0, 200)}`,
      response.status,
      'GITHUB_ERROR'
    );
  }

  return response.json() as Promise<T>;
};

export const searchRepositories = async (
  query: string,
  page = 1,
  perPage = 20,
  sort = 'stars',
  order = 'desc'
): Promise<GitHubSearchResult> => {
  const params = new URLSearchParams({
    q: query,
    page: String(page),
    per_page: String(perPage),
    sort,
    order,
  });

  const response = await fetch(`${GITHUB_API}/search/repositories?${params}`, {
    headers: getHeaders(),
  });

  return handleGitHubResponse<GitHubSearchResult>(response);
};

export const getRepository = async (
  owner: string,
  repo: string
): Promise<GitHubRepository> => {
  const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}`, {
    headers: getHeaders(),
  });
  return handleGitHubResponse<GitHubRepository>(response);
};

export const getRepositoryLanguages = async (
  owner: string,
  repo: string
): Promise<LanguageMap> => {
  const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/languages`, {
    headers: getHeaders(),
  });
  return handleGitHubResponse<LanguageMap>(response);
};

export const getRepositoryIssues = async (
  owner: string,
  repo: string,
  state: 'open' | 'closed' | 'all' = 'open',
  perPage = 30
): Promise<GitHubIssue[]> => {
  const params = new URLSearchParams({
    state,
    per_page: String(perPage),
    sort: 'updated',
  });
  const response = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/issues?${params}`,
    { headers: getHeaders() }
  );
  const issues = await handleGitHubResponse<GitHubIssue[]>(response);
  return issues.filter((i) => !('pull_request' in (i as object)));
};

export const getContributors = async (
  owner: string,
  repo: string
): Promise<Array<{ login: string; contributions: number }>> => {
  try {
    const response = await fetch(
      `${GITHUB_API}/repos/${owner}/${repo}/contributors?per_page=5`,
      { headers: getHeaders() }
    );
    if (!response.ok) return [];
    return response.json() as Promise<Array<{ login: string; contributions: number }>>;
  } catch {
    return [];
  }
};
