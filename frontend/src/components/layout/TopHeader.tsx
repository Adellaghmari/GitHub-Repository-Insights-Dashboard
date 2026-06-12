import { Link } from 'react-router-dom';
import { useApiStatus } from '../../hooks/useApiStatus';
import { isApiChecking, isApiConnected, normalizeApiStatus, shouldShowApiError } from '../../utils/connectionStatus';

export function TopHeader() {
  const { status: rawStatus } = useApiStatus();
  const status = normalizeApiStatus(rawStatus);

  const apiLabel = isApiChecking(status)
    ? 'Checking API'
    : isApiConnected(status)
      ? 'API Connected'
      : 'API Unavailable';

  const apiVariant = isApiChecking(status)
    ? 'neutral'
    : isApiConnected(status)
      ? 'ok'
      : 'error';

  const dbLabel = status.databaseConnection === 'checking'
    ? 'Checking database'
    : status.databaseConnection === 'connected'
      ? 'Database Connected'
      : status.databaseConnection === 'unavailable'
        ? 'Database Unavailable'
        : 'Database Not Configured';

  const dbVariant = status.databaseConnection === 'checking'
    ? 'neutral'
    : status.databaseConnection === 'connected'
      ? 'ok'
      : status.databaseConnection === 'unavailable'
        ? 'warn'
        : 'neutral';

  return (
    <header className="sticky top-0 z-30 h-[3.25rem] bg-graphite-950/90 backdrop-blur-md border-b border-graphite-800/80 shrink-0">
      <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3 shrink-0 min-w-0 group">
          <div
            className="w-8 h-8 rounded-lg bg-graphite-900 border border-emerald-500/40 flex items-center justify-center shrink-0 transition-all group-hover:border-emerald-500/60"
            style={{ boxShadow: '0 0 16px -6px rgba(16, 185, 129, 0.3)' }}
          >
            <div className="w-2.5 h-2.5 rounded-full border-2 border-emerald-glow bg-emerald-accent/20" />
          </div>
          <div className="min-w-0 leading-tight">
            <span className="text-white font-semibold text-sm tracking-tight block truncate">GitHub Repository Insights</span>
            <span className="hidden sm:block text-graphite-500 text-[11px]">Repository Analytics Dashboard</span>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <StatusPill label={apiLabel} variant={apiVariant} />
          {!shouldShowApiError(status) && (
            <StatusPill label={dbLabel} variant={dbVariant} />
          )}
          {isApiConnected(status) && status.rateLimit && (
            <RateLimitPill remaining={status.rateLimit.remaining} limit={status.rateLimit.limit} />
          )}
        </div>
      </div>
    </header>
  );
}

function RateLimitPill({ remaining, limit }: { remaining: number; limit: number }) {
  const variant =
    remaining > 30 ? 'ok' : remaining >= 10 ? 'warn' : 'error';

  const pillClass = {
    ok: 'status-pill-header-ok',
    warn: 'status-pill-header-warn',
    error: 'status-pill-header-error',
  }[variant];

  return (
    <span className={`${pillClass} hidden lg:inline-flex`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-90" />
      <span>{remaining}/{limit} left</span>
    </span>
  );
}

function StatusPill({
  label,
  variant,
}: {
  label: string;
  variant: 'ok' | 'warn' | 'error' | 'neutral';
}) {
  const pillClass = {
    ok: 'status-pill-header-ok',
    warn: 'status-pill-header-warn',
    error: 'status-pill-header-error',
    neutral: 'status-pill-header-neutral',
  }[variant];

  return (
    <span className={pillClass}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-90" />
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden">{label.split(' ')[0]}</span>
    </span>
  );
}
