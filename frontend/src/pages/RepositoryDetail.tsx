import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Star, GitFork, Eye, AlertCircle, ExternalLink, Bookmark,
  Clock, RefreshCw, GitBranch, HardDrive, Scale,
  FileText, ShieldAlert, CheckCircle2,
} from 'lucide-react';
import { api, ApiError } from '../api/client';
import { useApiStatus } from '../hooks/useApiStatus';
import { isApiConnected, isApiChecking, shouldShowApiError } from '../utils/connectionStatus';
import { HealthScoreRing } from '../components/HealthScoreRing';
import { LanguageChart } from '../components/LanguageChart';
import { ScoreBar } from '../components/ScoreBar';
import { LoadingSpinner } from '../components/LoadingSpinner';
import {
  formatNumber, formatDate, formatRelative, getHealthBg, getHealthColor,
} from '../utils/format';
import {
  getHealthExplanation, splitRecommendedActions, formatRepoSize,
  buildExecutiveSummary, buildStakeholderSummary, formatRepositoryNotFoundError, formatApiErrorMessage,
} from '../utils/healthExplain';
import { ExecutiveSummaryCard } from '../components/ExecutiveSummaryCard';
import { StakeholderSummaryCard } from '../components/StakeholderSummaryCard';
import type { RepositoryInsights } from '../types';

function ReportSection({
  title,
  children,
  className = '',
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`card shadow-card ${className}`}>
      <div className="card-header">
        <h3 className="section-title">{title}</h3>
      </div>
      <div className="card-body">{children}</div>
    </section>
  );
}

function MetaBadge({ children, variant = 'neutral' }: {
  children: React.ReactNode;
  variant?: 'fresh' | 'cached' | 'neutral' | 'ok' | 'warn';
}) {
  const styles = {
    fresh: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    cached: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    neutral: 'bg-graphite-50 text-graphite-600 border-graphite-200',
    ok: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warn: 'bg-amber-50 text-amber-700 border-amber-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-mono rounded border ${styles[variant]}`}>
      {children}
    </span>
  );
}

export function RepositoryDetail() {
  const { owner, repo } = useParams<{ owner: string; repo: string }>();
  const { status } = useApiStatus();
  const [insights, setInsights] = useState<RepositoryInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const loadInsights = async () => {
    if (!owner || !repo || !isApiConnected(status)) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getRepositoryInsights(owner, repo);
      setInsights(data);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'NOT_FOUND' || err.message?.toLowerCase().includes('not found')) {
          setError(formatRepositoryNotFoundError(err.message, err.code));
        } else {
          setError(formatApiErrorMessage(err.message, err.code));
        }
      } else {
        setError('Failed to load repository analysis.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInsights();
  }, [owner, repo, status.apiConnection]);

  const handleSave = async () => {
    if (!owner || !repo) return;
    setSaving(true);
    try {
      await api.saveRepository(owner, repo);
      setSaveMsg('Repository saved and analysis cached.');
    } catch (err) {
      if (err instanceof ApiError) setSaveMsg(err.message);
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 4000);
    }
  };

  if (isApiChecking(status) || (loading && !error)) {
    return <LoadingSpinner text="Building health report..." />;
  }

  if (shouldShowApiError(status)) {
    return (
      <div className="alert-error">
        <p>API connection unavailable. Start the backend to analyze repositories.</p>
      </div>
    );
  }

  if (loading) return <LoadingSpinner text="Building health report..." />;

  if (error) {
    return (
      <div className="space-y-4">
        <Link to="/search" className="btn-ghost text-sm">&larr; Back to search</Link>
        <div className={error.toLowerCase().includes('rate limit') ? 'alert-warn' : 'alert-error'}>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!insights) return null;

  const { repository: r, healthScore, issueSummary } = insights;
  const primaryLang = insights.languages[0]?.language || r.language;
  const actions = splitRecommendedActions(healthScore.recommendedAction);
  const scoreExplanation = getHealthExplanation(healthScore);
  const executiveSummary = buildExecutiveSummary(insights);
  const stakeholderSummary = buildStakeholderSummary(insights);

  const riskItems = [
    {
      label: 'Recent activity',
      value: formatRelative(r.pushed_at),
      ok: r.pushed_at && (Date.now() - new Date(r.pushed_at).getTime()) < 90 * 24 * 60 * 60 * 1000,
    },
    {
      label: 'Issue volume',
      value: `${issueSummary.openIssues} open (${issueSummary.issueRiskLevel} risk)`,
      ok: issueSummary.issueRiskLevel === 'low',
    },
    {
      label: 'License status',
      value: r.license ? r.license.spdx_id : 'No license declared',
      ok: Boolean(r.license),
    },
    {
      label: 'Documentation',
      value: r.description ? 'Description provided' : 'Missing description',
      ok: Boolean(r.description && r.description.length > 10),
    },
    {
      label: 'Dependency risk',
      value: issueSummary.staleIssueCount > 10
        ? `${issueSummary.staleIssueCount} stale issues`
        : 'No significant stale issue signal',
      ok: issueSummary.staleIssueCount <= 10,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-emerald-accent font-mono">Health Report</p>
          <Link to="/search" className="btn-ghost text-xs mt-1 px-0">&larr; Back to search</Link>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadInsights} className="btn-secondary text-xs" disabled={loading}>
            <RefreshCw size={14} />
            Refresh
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !status.databaseConnected}
            className="btn-primary text-xs"
            title={!status.databaseConnected ? 'Database required' : undefined}
          >
            <Bookmark size={14} />
            {saving ? 'Saving...' : 'Save Analysis'}
          </button>
        </div>
      </div>

      {saveMsg && (
        <div className="alert-success">{saveMsg}</div>
      )}

      <ExecutiveSummaryCard summary={executiveSummary} />
      <StakeholderSummaryCard text={stakeholderSummary} />

      <section className="card card-interactive shadow-card-md border-graphite-200/90 relative overflow-hidden">
        <div className="metric-widget-accent" />
        <div className="card-body">
          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-mono text-graphite-400">{r.owner.login}</p>
              <div className="flex items-center gap-3 mt-1">
                <h1 className="text-2xl font-bold text-graphite-900 font-mono">{r.name}</h1>
                <a href={r.html_url} target="_blank" rel="noopener noreferrer" className="text-graphite-400 hover:text-emerald-accent">
                  <ExternalLink size={18} />
                </a>
              </div>
              {r.description ? (
                <p className="text-graphite-600 mt-3 leading-relaxed">{r.description}</p>
              ) : (
                <p className="text-graphite-400 mt-3 text-sm italic">No repository description provided.</p>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-4">
                {primaryLang && <MetaBadge>{primaryLang}</MetaBadge>}
                {r.license ? (
                  <MetaBadge variant="ok"><Scale size={10} className="mr-1" />{r.license.spdx_id}</MetaBadge>
                ) : (
                  <MetaBadge variant="warn">No license</MetaBadge>
                )}
                <MetaBadge><GitBranch size={10} className="mr-1" />{r.default_branch}</MetaBadge>
                <MetaBadge variant="neutral">
                  <Clock size={10} className="mr-1" />
                  Pushed {formatRelative(r.pushed_at)}
                </MetaBadge>
                <MetaBadge variant="neutral">{insights.dataSource}</MetaBadge>
                <MetaBadge variant={insights.cached ? 'cached' : 'fresh'}>
                  {insights.cached ? 'Cached result' : 'Fresh result'}
                </MetaBadge>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={`card shadow-card-md ${getHealthBg(healthScore.summary)}`}>
        <div className="card-body">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <HealthScoreRing score={healthScore.score} summary={healthScore.summary} />
            <div className="flex-1 text-center md:text-left">
              <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${getHealthColor(healthScore.summary)} bg-white/60 border border-current/20`}>
                {healthScore.summary}
              </span>
              <p className="text-sm text-graphite-700 mt-3 leading-relaxed max-w-lg">
                {scoreExplanation}
              </p>
              <p className="text-xs font-mono text-graphite-500 mt-2">
                Composite score from activity, popularity, maintenance, documentation and risk.
              </p>
            </div>
          </div>
        </div>
      </section>

      <ReportSection title="Score breakdown">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
          {[
            { label: 'Activity', score: healthScore.activityScore, color: 'text-emerald-accent' },
            { label: 'Popularity', score: healthScore.popularityScore, color: 'text-cyan-accent' },
            { label: 'Maintenance', score: healthScore.maintenanceScore, color: 'text-emerald-accent' },
            { label: 'Documentation', score: healthScore.documentationScore, color: 'text-cyan-accent' },
            { label: 'Risk', score: healthScore.riskScore, color: 'text-amber-risk', invert: true },
          ].map((item) => (
            <div key={item.label} className="p-3 rounded-lg border border-graphite-200 bg-graphite-50/50 text-center">
              <p className="metric-label">{item.label}</p>
              <p className={`font-mono text-xl font-bold mt-1 ${item.color}`}>
                {item.invert ? item.score : item.score}
              </p>
              {!item.invert && (
                <div className="h-1 bg-graphite-200 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-emerald-accent rounded-full" style={{ width: `${item.score}%` }} />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="space-y-3">
          <ScoreBar label="Activity" score={healthScore.activityScore} />
          <ScoreBar label="Popularity" score={healthScore.popularityScore} color="bg-cyan-accent" />
          <ScoreBar label="Maintenance" score={healthScore.maintenanceScore} />
          <ScoreBar label="Documentation" score={healthScore.documentationScore} color="bg-cyan-400" />
          <ScoreBar label="Safety margin" score={100 - healthScore.riskScore} color="bg-amber-risk" />
        </div>
      </ReportSection>

      <ReportSection title="Technical metrics">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Stars', value: formatNumber(r.stargazers_count), icon: Star },
            { label: 'Forks', value: formatNumber(r.forks_count), icon: GitFork },
            { label: 'Watchers', value: formatNumber(r.watchers_count), icon: Eye },
            { label: 'Open issues', value: formatNumber(r.open_issues_count), icon: AlertCircle },
            { label: 'Repo size', value: formatRepoSize(r.size), icon: HardDrive },
            { label: 'Default branch', value: r.default_branch, icon: GitBranch },
            { label: 'Created', value: formatDate(r.created_at), icon: Clock },
            { label: 'Last updated', value: formatDate(r.updated_at), icon: Clock },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="p-3 rounded-lg border border-graphite-100">
              <div className="flex items-center gap-1.5">
                <Icon size={12} className="text-graphite-400" />
                <p className="metric-label">{label}</p>
              </div>
              <p className="font-mono text-sm font-semibold text-graphite-900 mt-1 truncate">{value}</p>
            </div>
          ))}
        </div>
      </ReportSection>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ReportSection title="Language breakdown">
          <LanguageChart languages={insights.languages} />
        </ReportSection>

        <ReportSection title="Risk signals">
          <ul className="space-y-3">
            {riskItems.map((item) => (
              <li key={item.label} className="flex items-start justify-between gap-3 text-sm">
                <div className="flex items-start gap-2">
                  {item.ok ? (
                    <CheckCircle2 size={14} className="text-emerald-accent mt-0.5 shrink-0" />
                  ) : (
                    <ShieldAlert size={14} className="text-amber-risk mt-0.5 shrink-0" />
                  )}
                  <span className="text-graphite-600">{item.label}</span>
                </div>
                <span className={`font-mono text-xs text-right ${item.ok ? 'text-graphite-700' : 'text-amber-risk'}`}>
                  {item.value}
                </span>
              </li>
            ))}
          </ul>
          {insights.riskSignals.length > 0 && (
            <div className="mt-4 pt-4 border-t border-graphite-100">
              <p className="text-xs text-graphite-500 mb-2">Additional signals</p>
              <ul className="space-y-1">
                {insights.riskSignals.map((s, i) => (
                  <li key={i} className="text-xs text-red-600 font-mono">{s}</li>
                ))}
              </ul>
            </div>
          )}
        </ReportSection>
      </div>

      <section className="card border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white">
        <div className="card-header border-emerald-100">
          <h3 className="text-sm font-semibold text-graphite-800">Recommended technical action</h3>
        </div>
        <div className="card-body">
          <ul className="space-y-2">
            {actions.map((action, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-graphite-700">
                <FileText size={14} className="text-emerald-accent mt-0.5 shrink-0" />
                {action}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="card bg-graphite-50/50">
        <div className="card-body">
          <p className="text-xs uppercase tracking-wider text-graphite-400 font-mono mb-3">Analysis metadata</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="metric-label">Last analyzed</p>
              <p className="font-mono text-graphite-800 mt-0.5">{formatDate(insights.lastAnalyzedAt)}</p>
            </div>
            <div>
              <p className="metric-label">Data source</p>
              <p className="font-mono text-graphite-800 mt-0.5">{insights.dataSource}</p>
            </div>
            <div>
              <p className="metric-label">Cache status</p>
              <p className="font-mono text-graphite-800 mt-0.5">
                {insights.cached ? 'Cached (24h TTL)' : 'Fresh from API'}
              </p>
            </div>
            <div>
              <p className="metric-label">Database</p>
              <p className="font-mono text-graphite-800 mt-0.5">
                {status.databaseConnected ? 'Connected' : 'Not configured'}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
