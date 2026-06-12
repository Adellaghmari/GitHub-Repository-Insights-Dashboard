import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Trash2, Search, Star } from 'lucide-react';
import { api, ApiError } from '../api/client';
import { useApiStatus } from '../hooks/useApiStatus';
import { isDatabaseChecking } from '../utils/connectionStatus';
import { StatusCards, DatabaseCompactNotice } from '../components/StatusCards';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { formatNumber, formatDate, formatRelative } from '../utils/format';
import type { SavedRepository } from '../types';

const savedFields = [
  'Health score',
  'Language breakdown',
  'Risk signals',
  'Last analyzed',
  'Recommended action',
];

function SavedPreviewCard() {
  return (
    <div className="card shadow-card-md">
      <div className="p-5">
        <p className="text-xs font-mono text-graphite-400 mb-1">Example saved report</p>
        <p className="font-mono text-sm font-semibold text-graphite-800">facebook/react</p>
        <p className="text-xs text-graphite-500 mt-1 line-clamp-2">The library for web and native user interfaces.</p>
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <span className="lang-chip">JavaScript</span>
          <span className="flex items-center gap-1 text-xs font-mono text-graphite-600">
            <Star size={10} className="text-amber-risk" />230k
          </span>
          <span className="text-xs font-mono text-emerald-accent">Score 94</span>
        </div>
        <div className="mt-3 pt-3 border-t border-graphite-100 grid grid-cols-2 gap-1">
          {savedFields.map((field) => (
            <span key={field} className="text-xs text-graphite-500">{field}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function SavedEmptyState({ hasDatabase }: { hasDatabase: boolean }) {
  return (
    <div className="card shadow-card-md">
      <div className="py-12 px-6">
        <div className="max-w-lg mx-auto text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-graphite-50 border border-graphite-100">
            <Bookmark size={28} className="text-graphite-400" />
          </div>
          <h3 className="text-lg font-semibold text-graphite-800">
            {hasDatabase ? 'No saved repositories yet' : 'Saved analyses will appear here'}
          </h3>
          <p className="text-sm text-graphite-500 mt-2 leading-relaxed">
            {hasDatabase
              ? 'Run an analysis on any repository and save it to track health scores, cache snapshots and compare over time.'
              : 'Connect PostgreSQL to persist repository analyses. Search and live analysis work without a database.'}
          </p>
        </div>

        <div className="mt-8 max-w-md mx-auto">
          <SavedPreviewCard />
        </div>

        <div className="mt-6 max-w-sm mx-auto">
          <p className="text-xs font-medium text-graphite-600 text-center mb-2">What will be saved</p>
          <ul className="grid grid-cols-2 gap-1 text-xs text-graphite-500">
            {savedFields.map((field) => (
              <li key={field}>{field}</li>
            ))}
          </ul>
        </div>

        <div className="mt-6 flex justify-center">
          <Link to="/search" className="btn-primary">Search repositories</Link>
        </div>
      </div>
    </div>
  );
}

export function SavedRepos() {
  const { status } = useApiStatus();
  const [repos, setRepos] = useState<SavedRepository[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('last_analyzed_at');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [filter, setFilter] = useState('');

  const loadRepos = async () => {
    if (!status.databaseConnected) {
      if (!isDatabaseChecking(status)) {
        setLoading(false);
      }
      return;
    }
    setLoading(true);
    try {
      const data = await api.getSavedRepositories({ sort, order, filter: filter || undefined });
      setRepos(data.items);
    } catch {
      setRepos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRepos();
  }, [sort, order, status.databaseConnection]);

  const handleDelete = async (id: number) => {
    try {
      await api.deleteSavedRepository(id);
      setRepos((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      if (err instanceof ApiError) alert(err.message);
    }
  };

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    loadRepos();
  };

  if (isDatabaseChecking(status) || status.apiConnection === 'checking') {
    return (
      <div className="page-stack">
        <div>
          <p className="page-eyebrow">Persistence</p>
          <h2 className="page-title">Saved Repositories</h2>
          <p className="page-desc">Persisted analyses with 24 hour cache refresh.</p>
        </div>
        <LoadingSpinner text="Checking database status..." />
      </div>
    );
  }

  if (!status.databaseConnected) {
    return (
      <div className="page-stack">
        <div>
          <p className="page-eyebrow">Persistence</p>
          <h2 className="page-title">Saved Repositories</h2>
          <p className="page-desc">Persisted analyses with 24 hour cache refresh.</p>
        </div>
        <DatabaseCompactNotice />
        <SavedEmptyState hasDatabase={false} />
      </div>
    );
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <p className="page-eyebrow">Persistence</p>
        <h2 className="page-title">Saved Repositories</h2>
        <div className="page-header-accent" />
        <p className="page-desc">
          {repos.length} saved {repos.length === 1 ? 'repository' : 'repositories'}
        </p>
      </div>

      <StatusCards status={status} showDatabaseNotice={false} />

      {repos.length > 0 && (
        <div className="card">
          <div className="card-body flex flex-wrap items-center gap-3">
            <form onSubmit={handleFilter} className="flex items-center gap-2 flex-1 min-w-[200px]">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-graphite-400" />
                <input
                  type="text"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Filter by name or description..."
                  className="input-search pl-9 py-2"
                />
              </div>
              <button type="submit" className="btn-secondary text-xs">Filter</button>
            </form>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="select-input">
              <option value="last_analyzed_at">Last analyzed</option>
              <option value="stars">Stars</option>
              <option value="forks">Forks</option>
              <option value="open_issues">Open issues</option>
              <option value="name">Name</option>
              <option value="created_at">Date saved</option>
            </select>
            <select value={order} onChange={(e) => setOrder(e.target.value as 'asc' | 'desc')} className="select-input">
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      )}

      {loading && <LoadingSpinner />}

      {!loading && repos.length === 0 && <SavedEmptyState hasDatabase={true} />}

      {!loading && repos.length > 0 && (
        <div className="card overflow-hidden shadow-card-md">
          <div className="table-scroll">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="border-b border-graphite-200 bg-graphite-50">
                <th className="text-left px-5 py-3 metric-label">Repository</th>
                <th className="text-left px-5 py-3 metric-label">Stars</th>
                <th className="text-left px-5 py-3 metric-label">Forks</th>
                <th className="text-left px-5 py-3 metric-label">Issues</th>
                <th className="text-left px-5 py-3 metric-label">Last push</th>
                <th className="text-left px-5 py-3 metric-label">Analyzed</th>
                <th className="text-right px-5 py-3 metric-label">Actions</th>
              </tr>
            </thead>
            <tbody>
              {repos.map((repo) => (
                <tr key={repo.id} className="border-b border-graphite-100 hover:bg-graphite-50/50">
                  <td className="px-5 py-3">
                    <Link
                      to={`/repo/${repo.owner}/${repo.name}`}
                      className="font-mono font-medium text-graphite-900 hover:text-emerald-accent"
                    >
                      {repo.full_name}
                    </Link>
                    {repo.description && (
                      <p className="text-xs text-graphite-500 mt-0.5 line-clamp-1">{repo.description}</p>
                    )}
                  </td>
                  <td className="px-5 py-3 font-mono">{formatNumber(repo.stars)}</td>
                  <td className="px-5 py-3 font-mono">{formatNumber(repo.forks)}</td>
                  <td className="px-5 py-3 font-mono">{repo.open_issues}</td>
                  <td className="px-5 py-3 text-graphite-600">{formatRelative(repo.pushed_at)}</td>
                  <td className="px-5 py-3 text-graphite-600">{formatDate(repo.last_analyzed_at)}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => handleDelete(repo.id)}
                      className="text-graphite-400 hover:text-red-500 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
