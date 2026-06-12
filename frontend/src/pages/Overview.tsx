import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search, Activity, GitCompareArrows, Code, Bookmark, AlertTriangle,
  BarChart3, Shield, Clock, ChevronRight,
} from 'lucide-react';
import { api } from '../api/client';
import { useApiStatus } from '../hooks/useApiStatus';
import { ApiCompactNotice, DatabaseCompactNotice } from '../components/StatusCards';
import { isApiConnected, shouldShowApiError, shouldShowDatabaseNotice } from '../utils/connectionStatus';
import { SuggestedRepoCard } from '../components/SuggestedRepoCard';
import { MetricCard } from '../components/MetricCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { SUGGESTED_REPOS } from '../utils/format';
import type { DashboardData } from '../types';

const insightCards = [
  { icon: Activity, title: 'Repository health scoring', desc: 'Activity, maintenance and documentation scored from live GitHub data.' },
  { icon: GitCompareArrows, title: 'Side by side comparison', desc: 'Compare health scores and risk labels across multiple repositories.' },
  { icon: Code, title: 'Language breakdown', desc: 'See tech stack distribution with percentage based charts.' },
  { icon: Bookmark, title: 'Saved analyses', desc: 'Persist reports in PostgreSQL with 24 hour cache refresh.' },
  { icon: AlertTriangle, title: 'Risk monitoring', desc: 'Flag stale projects, missing licenses and high issue ratios.' },
];

const analysisFeatures = [
  'Repository health scoring (0 to 100)',
  'Activity and maintenance signals',
  'Language distribution charts',
  'Issue risk assessment',
  'Documentation and license checks',
  'Cached analysis with freshness indicators',
];

export function Overview() {
  const navigate = useNavigate();
  const { status } = useApiStatus();
  const [searchQuery, setSearchQuery] = useState('');
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isApiConnected(status)) {
      if (shouldShowApiError(status)) {
        setLoading(false);
      }
      return;
    }
    setLoading(true);
    api.dashboard()
      .then(setDashboard)
      .catch(() => setDashboard(null))
      .finally(() => setLoading(false));
  }, [status.apiConnection]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="page-stack">
      {shouldShowApiError(status) && <ApiCompactNotice />}

      <section className="hero-card">
        <div className="hero-card-glow" />
        <div className="hero-card-glow-secondary" />
        <div className="hero-card-body">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="live-badge">
                <span className="live-dot" />
                Live analytics
              </span>
              <span className="hero-eyebrow">Developer Analytics</span>
            </div>
            <h2 className="hero-title">
              GitHub Repository Insights
            </h2>
            <p className="hero-desc">
              Analyze repository activity, health and technical risk using live GitHub data.
              Search any public repository and get a scored report with language breakdown and risk signals.
            </p>
          </div>

          <form onSubmit={handleSearch} className="mt-8 flex flex-col sm:flex-row gap-3 max-w-xl">
            <div className="relative flex-1 min-w-0">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-graphite-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search repositories on GitHub..."
                className="input-search-hero pl-11"
              />
            </div>
            <button type="submit" className="btn-primary shrink-0 px-6">Search</button>
          </form>
        </div>
      </section>

      {shouldShowDatabaseNotice(status) && (
        <DatabaseCompactNotice />
      )}

      {isApiConnected(status) && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              label="Saved Repositories"
              value={dashboard?.savedCount ?? 0}
              icon={Bookmark}
            />
            <MetricCard
              label="API Requests Left"
              value={dashboard?.rateLimit ? `${dashboard.rateLimit.remaining}/${dashboard.rateLimit.limit}` : 'Not available'}
              icon={BarChart3}
              subtext={dashboard?.hasGitHubToken ? 'Authenticated' : 'Unauthenticated'}
            />
            <MetricCard
              label="Data Source"
              value="GitHub API"
              icon={Activity}
              subtext="Live repository data"
            />
            <MetricCard
              label="Cache TTL"
              value="24h"
              icon={Clock}
              subtext="PostgreSQL backed"
            />
          </div>

          <Link to="/monitor" className="monitor-link group">
            <div className="flex items-center gap-3">
              <div className="metric-icon-wrap w-9 h-9">
                <Activity size={16} className="text-emerald-accent group-hover:text-emerald-600 transition-colors" />
              </div>
              <div>
                <p className="text-sm font-medium text-graphite-800">View API status</p>
                <p className="text-xs text-graphite-500 mt-0.5">Rate limits, cache and backend health</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-graphite-400 group-hover:text-emerald-accent transition-colors shrink-0" />
          </Link>
        </>
      )}

      <section>
        <h3 className="section-title">Core capabilities</h3>
        <p className="section-desc mb-4">What you can do with live GitHub data and cached analysis.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {insightCards.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="capability-card">
              <div className="card-body">
                <div className="capability-icon">
                  <Icon size={20} className="text-emerald-accent" />
                </div>
                <h4 className="text-sm font-semibold text-graphite-900">{title}</h4>
                <p className="text-xs text-graphite-500 mt-2.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="section-title">Start with a known repository</h3>
        <p className="section-desc mb-4">Open a full health report for a well known open source project.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {SUGGESTED_REPOS.map((repo) => (
            <SuggestedRepoCard
              key={repo.label}
              repo={repo}
              onSave={status.databaseConnected ? () => api.saveRepository(repo.owner, repo.name) : undefined}
              saveDisabled={!status.databaseConnected}
            />
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="card card-interactive">
          <div className="card-header">
            <h3 className="section-title">Analysis capabilities</h3>
          </div>
          <ul className="card-body space-y-2">
            {analysisFeatures.map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-sm text-graphite-600">
                <Shield size={14} className="text-emerald-accent shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </section>

        <section className="card card-interactive">
          <div className="card-header">
            <h3 className="section-title">Example insights</h3>
          </div>
          <div className="card-body space-y-3">
            <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200">
              <p className="text-xs font-mono text-emerald-800">facebook/react</p>
              <p className="text-sm text-emerald-700 mt-1">Active and maintained. Strong candidate for learning or reference.</p>
            </div>
            <div className="p-3 rounded-md bg-amber-50 border border-amber-200">
              <p className="text-xs font-mono text-amber-800">unmaintained/lib</p>
              <p className="text-sm text-amber-700 mt-1">Repository has not been updated recently. Check license before commercial use.</p>
            </div>
            <div className="p-3 rounded-md bg-cyan-50 border border-cyan-200">
              <p className="text-xs font-mono text-cyan-800">vercel/next.js</p>
              <p className="text-sm text-cyan-700 mt-1">High community signal with strong documentation and active maintenance.</p>
            </div>
          </div>
        </section>
      </div>

      {loading && isApiConnected(status) && <LoadingSpinner text="Loading dashboard data..." />}

      {!loading && dashboard && dashboard.recentSearches.length > 0 && (
        <section className="card card-interactive">
          <div className="card-header">
            <h3 className="section-title">Recent searches</h3>
          </div>
          <div className="card-body">
            <div className="flex flex-wrap gap-2">
              {dashboard.recentSearches.map((s, i) => (
                <Link
                  key={i}
                  to={`/search?q=${encodeURIComponent(s.query)}`}
                  className="lang-chip hover:bg-graphite-200 transition-colors"
                >
                  {s.query} ({s.result_count})
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
