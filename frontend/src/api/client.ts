const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_URL}/api${path}`;
  let response: Response;

  try {
    response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
  } catch {
    throw new ApiError('API connection unavailable', 0, 'NETWORK_ERROR');
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new ApiError(body.error || 'Request failed', response.status, body.code);
  }

  return response.json();
}

export const api = {
  health: () => request<{ status: string; database: { configured: boolean; connected: boolean }; github: { tokenConfigured: boolean; rateLimit: unknown } }>('/health'),

  monitor: () => request<import('../types').MonitorData>('/monitor'),

  dashboard: () => request<import('../types').DashboardData>('/dashboard'),

  searchRepositories: (q: string, params?: { sort?: string; order?: string; page?: number }) => {
    const searchParams = new URLSearchParams({ q });
    if (params?.sort) searchParams.set('sort', params.sort);
    if (params?.order) searchParams.set('order', params.order);
    if (params?.page) searchParams.set('page', String(params.page));
    return request<{ total_count: number; items: import('../types').SearchResultItem[]; rateLimit: import('../types').RateLimitInfo | null }>(
      `/search/repositories?${searchParams}`
    );
  },

  getRepositoryInsights: (owner: string, repo: string) =>
    request<import('../types').RepositoryInsights>(`/repositories/${owner}/${repo}/insights`),

  saveRepository: (owner: string, repo: string) =>
    request<{ id: number }>(`/repositories/${owner}/${repo}/save`, { method: 'POST' }),

  getSavedRepositories: (params?: { sort?: string; order?: string; filter?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.sort) searchParams.set('sort', params.sort);
    if (params?.order) searchParams.set('order', params.order);
    if (params?.filter) searchParams.set('filter', params.filter);
    const qs = searchParams.toString();
    return request<{ items: import('../types').SavedRepository[]; databaseAvailable: boolean }>(
      `/saved-repositories${qs ? `?${qs}` : ''}`
    );
  },

  deleteSavedRepository: (id: number) =>
    request<{ success: boolean }>(`/saved-repositories/${id}`, { method: 'DELETE' }),

  compare: (repositories: Array<{ owner: string; name: string }>) =>
    request<import('../types').ComparisonResult>('/compare', {
      method: 'POST',
      body: JSON.stringify({ repositories }),
    }),

  riskCenter: () => request<import('../types').RiskCenterData>('/risk-center'),

  searchHistory: () =>
    request<{ items: Array<{ query: string; result_count: number; created_at: string }>; databaseAvailable: boolean }>(
      '/search-history'
    ),
};

export { API_URL };
