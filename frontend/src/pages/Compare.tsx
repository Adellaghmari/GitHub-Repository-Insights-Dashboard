import { useState } from 'react';
import { Link } from 'react-router-dom';
import { GitCompareArrows, Plus, X } from 'lucide-react';
import { api, ApiError } from '../api/client';
import { useApiStatus } from '../hooks/useApiStatus';
import { isApiConnected, shouldShowApiError, shouldShowDatabaseNotice } from '../utils/connectionStatus';
import { DatabaseCompactNotice } from '../components/StatusCards';
import { HealthScoreRing } from '../components/HealthScoreRing';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { SUGGESTED_REPOS, formatNumber } from '../utils/format';
import { buildDecisionSummary, resolveRepoFullName, formatRepositoryNotFoundError, formatApiErrorMessage } from '../utils/healthExplain';
import { DecisionSummaryCard } from '../components/DecisionSummaryCard';
import type { ComparisonResult } from '../types';
import type { SuggestedRepo } from '../utils/format';

interface RepoSlot {
  owner: string;
  name: string;
}

export function Compare() {
  const { status } = useApiStatus();
  const [repos, setRepos] = useState<RepoSlot[]>([
    { owner: '', name: '' },
    { owner: '', name: '' },
  ]);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateRepo = (index: number, field: 'owner' | 'name', value: string) => {
    setRepos((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addSlot = () => {
    if (repos.length < 4) {
      setRepos((prev) => [...prev, { owner: '', name: '' }]);
    }
  };

  const removeSlot = (index: number) => {
    if (repos.length > 2) {
      setRepos((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const fillSuggested = (index: number, suggested: SuggestedRepo) => {
    setRepos((prev) => {
      const next = [...prev];
      next[index] = { owner: suggested.owner, name: suggested.name };
      return next;
    });
  };

  const handleCompare = async () => {
    const valid = repos.filter((r) => r.owner && r.name);
    if (valid.length < 2) {
      setError('Add at least two repositories to compare.');
      return;
    }

    if (!isApiConnected(status)) {
      if (shouldShowApiError(status)) {
        setError('API connection unavailable.');
      }
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await api.compare(valid);
      setResult(data);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'NOT_FOUND' || err.message?.toLowerCase().includes('not found')) {
          setError(formatRepositoryNotFoundError(err.message, err.code));
        } else {
          setError(formatApiErrorMessage(err.message, err.code));
        }
      } else {
        setError('Comparison failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const decisionSummary = result ? buildDecisionSummary(result) : null;

  const labelFullName = (fullName: string) => {
    const repo = result?.repositories.find(
      (r) => r.fullName === fullName || resolveRepoFullName(r) === fullName
    );
    return repo ? resolveRepoFullName(repo) : fullName;
  };

  const isRateLimitError = error?.toLowerCase().includes('rate limit');

  return (
    <div className="page-stack">
      <div className="page-header">
        <p className="page-eyebrow">Technical comparison</p>
        <h2 className="page-title">Compare Repositories</h2>
        <div className="page-header-accent" />
        <p className="page-desc">
          Side by side comparison with health scores, risk labels and a recommended choice.
        </p>
      </div>

      {shouldShowDatabaseNotice(status) && <DatabaseCompactNotice />}

      <section className="card shadow-card-md">
        <div className="card-header">
          <h3 className="section-title">Repository selector</h3>
        </div>
        <div className="card-body space-y-4">
          {repos.map((repo, i) => (
            <div key={i} className="flex items-end gap-3">
              <span className="text-xs font-mono text-graphite-400 w-6 pb-2">#{i + 1}</span>
              <div className="w-36">
                <label className="metric-label block mb-1">Owner</label>
                <input
                  type="text"
                  value={repo.owner}
                  onChange={(e) => updateRepo(i, 'owner', e.target.value)}
                  placeholder="owner"
                  className="select-input w-full font-mono"
                />
              </div>
              <span className="text-graphite-400 pb-2">/</span>
              <div className="flex-1 min-w-0">
                <label className="metric-label block mb-1">Repository</label>
                <input
                  type="text"
                  value={repo.name}
                  onChange={(e) => updateRepo(i, 'name', e.target.value)}
                  placeholder="repository"
                  className="select-input w-full font-mono"
                />
              </div>
              {repos.length > 2 && (
                <button onClick={() => removeSlot(i)} className="text-graphite-400 hover:text-red-500 pb-2">
                  <X size={16} />
                </button>
              )}
            </div>
          ))}

          <p className="text-xs text-graphite-500">
            Example: github.com/facebook/react means owner is <span className="font-mono">facebook</span> and repository is <span className="font-mono">react</span>.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            {repos.length < 4 && (
              <button onClick={addSlot} className="btn-secondary text-xs">
                <Plus size={14} /> Add repository
              </button>
            )}
            <button onClick={handleCompare} className="btn-primary" disabled={loading || !isApiConnected(status)}>
              <GitCompareArrows size={14} />
              {loading ? 'Comparing...' : 'Compare'}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-graphite-500">Quick fill:</span>
            {SUGGESTED_REPOS.slice(0, 4).map((s) => (
              <button
                key={s.label}
                onClick={() => {
                  const emptyIdx = repos.findIndex((r) => !r.owner && !r.name);
                  const idx = emptyIdx >= 0 ? emptyIdx : 0;
                  fillSuggested(idx, s);
                }}
                className="lang-chip hover:bg-graphite-200 cursor-pointer"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {error && (
        <div className={isRateLimitError ? 'alert-warn' : 'alert-error'}>
          <p className="leading-relaxed">{error}</p>
        </div>
      )}

      {loading && <LoadingSpinner text="Running comparison..." />}

      {result && decisionSummary && (
        <>
          <DecisionSummaryCard summary={decisionSummary} />

          <p className="text-sm text-graphite-500">{result.summary}</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card shadow-card">
              <div className="card-body">
                <p className="metric-label">Best maintained</p>
                <p className="text-sm font-mono font-medium mt-1">{labelFullName(result.labels.bestMaintained)}</p>
              </div>
            </div>
            <div className="card shadow-card">
              <div className="card-body">
                <p className="metric-label">Best for learning</p>
                <p className="text-sm font-mono font-medium mt-1">{labelFullName(result.labels.bestForLearning)}</p>
              </div>
            </div>
            <div className="card shadow-card">
              <div className="card-body">
                <p className="metric-label">Highest community signal</p>
                <p className="text-sm font-mono font-medium mt-1">{labelFullName(result.labels.highestCommunity)}</p>
              </div>
            </div>
            <div className="card shadow-card">
              <div className="card-body">
                <p className="metric-label">Highest risk</p>
                <p className="text-sm font-mono font-medium mt-1 text-red-500">{labelFullName(result.labels.highestRisk)}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.repositories.map((repo) => (
              <div key={resolveRepoFullName(repo)} className="card shadow-card-md">
                <div className="card-body">
                  <div className="flex items-start justify-between">
                    <div>
                      <Link
                        to={`/repo/${repo.owner}/${repo.name}`}
                        className="font-mono font-semibold text-graphite-900 hover:text-emerald-accent"
                      >
                        {resolveRepoFullName(repo)}
                      </Link>
                      {repo.primaryLanguage && (
                        <span className="lang-chip ml-2">{repo.primaryLanguage}</span>
                      )}
                    </div>
                    <HealthScoreRing
                      score={repo.healthScore.score}
                      summary={repo.healthScore.summary}
                      size="sm"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-4 text-center">
                    <div>
                      <p className="metric-label">Stars</p>
                      <p className="font-mono text-sm font-semibold">{formatNumber(repo.stars)}</p>
                    </div>
                    <div>
                      <p className="metric-label">Forks</p>
                      <p className="font-mono text-sm font-semibold">{formatNumber(repo.forks)}</p>
                    </div>
                    <div>
                      <p className="metric-label">Issues</p>
                      <p className="font-mono text-sm font-semibold">{repo.openIssues}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="card overflow-hidden shadow-card-md">
            <div className="card-header">
              <h3 className="section-title">Comparison table</h3>
            </div>
            <div className="table-scroll">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-graphite-200 bg-graphite-50">
                  <th className="text-left px-5 py-3 metric-label">Metric</th>
                  {result.repositories.map((r) => (
                    <th key={resolveRepoFullName(r)} className="text-left px-5 py-3 metric-label font-mono">
                      {resolveRepoFullName(r)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { key: 'score', label: 'Overall score' },
                  { key: 'activityScore', label: 'Activity' },
                  { key: 'popularityScore', label: 'Popularity' },
                  { key: 'maintenanceScore', label: 'Maintenance' },
                  { key: 'documentationScore', label: 'Documentation' },
                  { key: 'riskScore', label: 'Risk' },
                ].map(({ key, label }) => (
                  <tr key={key} className="border-b border-graphite-100">
                    <td className="px-5 py-3 text-graphite-600">{label}</td>
                    {result.repositories.map((r) => (
                      <td key={resolveRepoFullName(r)} className="px-5 py-3 font-mono">
                        {r.healthScore[key as keyof typeof r.healthScore] as number}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </>
      )}

      {!result && !loading && (
        <div className="space-y-4">
          <div className="card shadow-card-md">
            <div className="py-12 px-6 text-center max-w-lg mx-auto">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-graphite-50 border border-graphite-100">
                <GitCompareArrows size={28} className="text-graphite-400" />
              </div>
              <h3 className="text-lg font-semibold text-graphite-900">Compare repository health</h3>
              <p className="text-sm text-graphite-500 mt-2 leading-relaxed">
                Add two to four repositories and get a side by side breakdown of health scores,
                maintenance signals and risk labels.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Best maintained', example: 'vercel/next.js', color: 'border-emerald-200 bg-emerald-50/50' },
              { label: 'Highest community signal', example: 'facebook/react', color: 'border-cyan-200 bg-cyan-50/50' },
              { label: 'Highest risk', example: 'stale/lib', color: 'border-red-200 bg-red-50/50' },
              { label: 'Best for learning', example: 'expressjs/express', color: 'border-graphite-200 bg-graphite-50/50' },
            ].map((item) => (
              <div key={item.label} className={`card ${item.color}`}>
                <div className="p-3">
                  <p className="metric-label">{item.label}</p>
                  <p className="font-mono text-xs text-graphite-700 mt-1">{item.example}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="inline-helper">
            Use quick fill above or enter owner and repository manually, then click Compare.
          </p>
        </div>
      )}
    </div>
  );
}
