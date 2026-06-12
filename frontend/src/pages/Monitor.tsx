import { useState, useEffect, useCallback } from 'react';
import {
  Server, Github, Database, Key, ArrowRight, RefreshCw,
  Activity, HardDrive,
} from 'lucide-react';
import { api, ApiError } from '../api/client';
import { useApiStatus } from '../hooks/useApiStatus';
import { isApiChecking, isApiConnected, shouldShowApiError } from '../utils/connectionStatus';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { formatDate } from '../utils/format';
import type { MonitorData } from '../types';

function StatusBadge({ status }: { status: 'ok' | 'warn' | 'error' | 'neutral' }) {
  const styles = {
    ok: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warn: 'bg-amber-50 text-amber-700 border-amber-200',
    error: 'bg-red-50 text-red-700 border-red-200',
    neutral: 'bg-graphite-100 text-graphite-600 border-graphite-200',
  };
  const labels = {
    ok: 'Healthy',
    warn: 'Warning',
    error: 'Unavailable',
    neutral: 'Not configured',
  };
  return (
    <span className={`inline-flex px-2 py-0.5 text-xs font-mono font-medium rounded border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function ConnectionCard({
  title,
  icon: Icon,
  status,
  statusType,
  detail,
}: {
  title: string;
  icon: typeof Server;
  status: string;
  statusType: 'ok' | 'warn' | 'error' | 'neutral';
  detail: string;
}) {
  return (
    <div className="card shadow-card card-interactive h-full">
      <div className="card-body">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-graphite-50 border border-graphite-100">
              <Icon size={16} className="text-graphite-500" />
            </div>
            <h3 className="section-title">{title}</h3>
          </div>
          <StatusBadge status={statusType} />
        </div>
        <p className="text-sm font-mono font-medium text-graphite-800">{status}</p>
        <p className="text-xs text-graphite-500 mt-2 leading-relaxed">{detail}</p>
      </div>
    </div>
  );
}

const flowSteps = [
  { label: 'Frontend', sub: 'React SPA', endpoint: 'Vite :5173' },
  { label: 'Backend API', sub: 'Express REST', endpoint: 'GET /api/*' },
  { label: 'GitHub REST API', sub: 'External data', endpoint: 'api.github.com' },
  { label: 'PostgreSQL Cache', sub: 'Optional persistence', endpoint: '24h TTL' },
];

export function Monitor() {
  const { status: apiStatus } = useApiStatus();
  const [data, setData] = useState<MonitorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMonitor = useCallback(async () => {
    if (!isApiConnected(apiStatus)) {
      if (shouldShowApiError(apiStatus)) {
        setLoading(false);
        setData(null);
      }
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await api.monitor();
      setData(result);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError('Failed to load monitor data.');
    } finally {
      setLoading(false);
    }
  }, [apiStatus.apiConnection]);

  useEffect(() => {
    loadMonitor();
    const interval = setInterval(loadMonitor, 30000);
    return () => clearInterval(interval);
  }, [loadMonitor]);

  const ratePercent = data?.githubRateLimit
    ? Math.round((data.githubRateLimit.used / data.githubRateLimit.limit) * 100)
    : 0;

  const rateBarColor = ratePercent > 80 ? 'bg-red-500' : ratePercent > 50 ? 'bg-amber-risk' : 'bg-emerald-accent';

  const dbStatusType = (s: MonitorData['databaseStatus']): 'ok' | 'warn' | 'error' | 'neutral' => {
    if (s === 'connected') return 'ok';
    if (s === 'unavailable') return 'error';
    return 'neutral';
  };

  const dbStatusLabel = (s: MonitorData['databaseStatus']) => {
    if (s === 'connected') return 'Connected';
    if (s === 'unavailable') return 'Unavailable';
    return 'Not configured';
  };

  return (
    <div className="page-stack">
      <div className="flex items-start justify-between gap-4">
        <div className="page-header">
          <p className="page-eyebrow">Developer Operations</p>
          <h2 className="page-title">API Monitor</h2>
          <div className="page-header-accent" />
          <p className="page-desc">
            Live status for backend connections, GitHub rate limits and cache behavior.
          </p>
        </div>
        <button
          onClick={loadMonitor}
          disabled={loading || !isApiConnected(apiStatus)}
          className="btn-secondary text-xs shrink-0"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {isApiChecking(apiStatus) && (
        <div className="card">
          <div className="card-body py-8 text-center">
            <p className="text-sm text-graphite-500">Checking backend status</p>
          </div>
        </div>
      )}

      {shouldShowApiError(apiStatus) && (
        <div className="alert-error">
          <Server size={18} className="text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Backend API unavailable</p>
            <p className="text-xs text-red-700/90 mt-0.5">Start the backend or check the API URL to load monitor data.</p>
          </div>
        </div>
      )}

      {error && isApiConnected(apiStatus) && (
        <div className={error.toLowerCase().includes('rate limit') ? 'alert-warn' : 'alert-error'}>
          <p>{error}</p>
        </div>
      )}

      {loading && isApiConnected(apiStatus) && <LoadingSpinner text="Fetching monitor data..." />}

      {!loading && data && (
        <>
          <section>
            <h3 className="section-title mb-4">Connection status</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <ConnectionCard
                title="Backend API"
                icon={Server}
                status="connected"
                statusType="ok"
                detail="Express server responding on /api/monitor"
              />
              <ConnectionCard
                title="GitHub API"
                icon={Github}
                status={data.githubRateLimit ? 'reachable' : 'awaiting first request'}
                statusType={data.githubRateLimit ? 'ok' : 'warn'}
                detail={
                  data.githubRateLimit
                    ? `${data.githubRateLimit.remaining} requests remaining`
                    : 'Rate limit data loads after first GitHub call'
                }
              />
              <ConnectionCard
                title="Database"
                icon={Database}
                status={dbStatusLabel(data.databaseStatus)}
                statusType={dbStatusType(data.databaseStatus)}
                detail={
                  data.databaseStatus === 'not_configured'
                    ? 'Set DATABASE_URL to enable persistence'
                    : data.databaseStatus === 'connected'
                      ? 'PostgreSQL connected and ready'
                      : 'Connection string set but connection failed'
                }
              />
              <ConnectionCard
                title="GitHub Token"
                icon={Key}
                status={data.githubToken.configured ? 'configured' : 'Not set'}
                statusType={data.githubToken.configured ? 'ok' : 'neutral'}
                detail={
                  data.githubToken.configured
                    ? 'Authenticated requests with higher rate limits'
                    : 'Unauthenticated mode, 60 req/hour limit'
                }
              />
            </div>
          </section>

          <section className="card shadow-card-md">
            <div className="card-header flex items-center gap-2.5">
              <Activity size={16} className="text-emerald-accent" />
              <h3 className="section-title">Rate limit</h3>
              {data.lastCheckedAt && (
                <span className="ml-auto text-xs font-mono text-graphite-400">
                  Last checked {formatDate(data.lastCheckedAt)}
                </span>
              )}
            </div>
            <div className="card-body">
              {data.githubRateLimit ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-end gap-4 mb-4">
                      <div>
                        <p className="metric-label">Remaining</p>
                        <p className="text-3xl font-mono font-bold text-graphite-900">
                          {data.githubRateLimit.remaining}
                        </p>
                      </div>
                      <div>
                        <p className="metric-label">Limit</p>
                        <p className="text-xl font-mono font-semibold text-graphite-600">
                          {data.githubRateLimit.limit}
                        </p>
                      </div>
                      <div>
                        <p className="metric-label">Used</p>
                        <p className="text-xl font-mono font-semibold text-graphite-600">
                          {ratePercent}%
                        </p>
                      </div>
                    </div>
                    <div className="h-3 bg-graphite-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${rateBarColor}`}
                        style={{ width: `${ratePercent}%` }}
                      />
                    </div>
                    <p className="text-xs font-mono text-graphite-500 mt-2">
                      Resets at {new Date(data.githubRateLimit.resetAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="relative w-32 h-32">
                      <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="#e8e8ea" strokeWidth="8" />
                        <circle
                          cx="50" cy="50" r="42" fill="none"
                          stroke={ratePercent > 80 ? '#ef4444' : ratePercent > 50 ? '#f59e0b' : '#10b981'}
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={`${(data.githubRateLimit.remaining / data.githubRateLimit.limit) * 264} 264`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-mono font-bold text-graphite-900">
                          {data.githubRateLimit.remaining}
                        </span>
                        <span className="text-xs text-graphite-500">left</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-graphite-500">
                  Rate limit data will appear after the backend makes a GitHub API request.
                  Click Refresh or run a search to populate this section.
                </p>
              )}
            </div>
          </section>

          <section className="card shadow-card">
            <div className="card-header flex items-center gap-2.5">
              <HardDrive size={16} className="text-cyan-accent" />
              <h3 className="section-title">Cache and data freshness</h3>
            </div>
            <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="metric-label">Cache TTL</p>
                <p className="text-xl font-mono font-semibold text-graphite-900 mt-1">
                  {data.cache.ttlHours}h
                </p>
                <p className="text-sm text-graphite-500 mt-2">{data.cache.strategy}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-xs font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                    {data.cache.freshLabel}
                  </span>
                  <span className="text-xs text-graphite-500">Live GitHub fetch, database updated</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-xs font-mono bg-cyan-50 text-cyan-700 border border-cyan-200 rounded">
                    {data.cache.cachedLabel}
                  </span>
                  <span className="text-xs text-graphite-500">Served from PostgreSQL within TTL</span>
                </div>
                {data.databaseStatus === 'not_configured' && (
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-xs font-mono bg-amber-50 text-amber-700 border border-amber-200 rounded">
                      Fallback
                    </span>
                    <span className="text-xs text-graphite-500">{data.cache.fallbackNote}</span>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="card shadow-card">
            <div className="card-header">
              <h3 className="section-title">API workflow</h3>
            </div>
            <div className="card-body">
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-0">
                {flowSteps.map((step, i) => (
                  <div key={step.label} className="flex items-center flex-1 min-w-0">
                    <div className="flex-1 min-w-0 rounded-xl border border-graphite-100 bg-graphite-50/60 p-4 shadow-sm">
                      <p className="text-sm font-semibold text-graphite-800">{step.label}</p>
                      <p className="text-xs text-graphite-500">{step.sub}</p>
                      <p className="text-xs font-mono text-emerald-accent mt-1.5 truncate">{step.endpoint}</p>
                    </div>
                    {i < flowSteps.length - 1 && (
                      <ArrowRight size={16} className="text-graphite-400 mx-2 shrink-0 hidden md:block" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="card border-graphite-200/80 bg-graphite-50/20 shadow-card">
            <div className="card-header">
              <h3 className="section-title">Developer notes</h3>
            </div>
            <div className="card-body space-y-1.5 text-sm text-graphite-600">
              <p>Frontend never calls GitHub directly. Backend proxies all external requests.</p>
              <p>Rate limits, errors and 24h cache logic are handled server side.</p>
              <p className="inline-code-row">
                GET /api/monitor · GET /api/health · GET /api/search/repositories
              </p>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
