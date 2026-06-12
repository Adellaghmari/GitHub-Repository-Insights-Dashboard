import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search as SearchIcon, SlidersHorizontal, ArrowRight } from 'lucide-react';
import { api, ApiError } from '../api/client';
import { useApiStatus } from '../hooks/useApiStatus';
import { isApiConnected } from '../utils/connectionStatus';
import { StatusCards } from '../components/StatusCards';
import { SearchResultCard } from '../components/SearchResultCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { SUGGESTED_QUERIES } from '../utils/format';
import { formatApiErrorMessage } from '../utils/healthExplain';
import type { SearchResultItem } from '../types';

const DEMO_REPOS = [
  { owner: 'facebook', name: 'react', label: 'facebook/react' },
  { owner: 'vercel', name: 'next.js', label: 'vercel/next.js' },
] as const;

const OWNER_REPO_PATTERN = /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/;

function isExactMatch(repo: SearchResultItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return false;
  const full = `${repo.owner}/${repo.name}`.toLowerCase();
  return full === q || repo.name.toLowerCase() === q;
}

function parseOwnerRepo(input: string): { owner: string; repo: string } | null {
  const trimmed = input.trim();
  if (!OWNER_REPO_PATTERN.test(trimmed)) return null;
  const slash = trimmed.indexOf('/');
  return {
    owner: trimmed.slice(0, slash),
    repo: trimmed.slice(slash + 1),
  };
}

export function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { status } = useApiStatus();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [exactInput, setExactInput] = useState('');
  const [exactError, setExactError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState('stars');
  const [order, setOrder] = useState('desc');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const activeQuery = searchParams.get('q') || '';

  const performSearch = async (q: string) => {
    if (!q.trim() || !isApiConnected(status)) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.searchRepositories(q, { sort, order });
      setResults(data.items);
      setTotalCount(data.total_count);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(formatApiErrorMessage(err.message, err.code));
      } else {
        setError('Search failed. Please try again.');
      }
      setResults([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
      performSearch(q);
    }
  }, [searchParams, sort, order, status.apiConnection]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query.trim() });
    }
  };

  const navigateToRepo = (owner: string, repo: string) => {
    navigate(`/repo/${owner}/${repo}`);
  };

  const handleExactLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseOwnerRepo(exactInput);
    if (!parsed) {
      setExactError('Use owner/repository format, for example facebook/react.');
      return;
    }
    setExactError(null);
    navigateToRepo(parsed.owner, parsed.repo);
  };

  const handleSave = async (owner: string, name: string) => {
    try {
      await api.saveRepository(owner, name);
      setSaveMessage(`Saved ${owner}/${name}`);
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      if (err instanceof ApiError) {
        setSaveMessage(err.message);
      }
    }
  };

  const showSortNote = !loading && !error && results.length > 0 && !activeQuery.includes('/');

  return (
    <div className="page-stack">
      <div className="page-header">
        <p className="page-eyebrow">Primary workflow</p>
        <h2 className="page-title">Repository Search</h2>
        <div className="page-header-accent" />
        <p className="page-desc">
          Look up a specific repository or search GitHub broadly, then open a full health report.
        </p>
      </div>

      <StatusCards status={status} showDatabaseNotice={false} />

      {saveMessage && (
        <div className="alert-success">{saveMessage}</div>
      )}

      <section className="card card-interactive border-emerald-200/50 shadow-card-md relative overflow-hidden">
        <div className="metric-widget-accent" />
        <div className="card-header py-3">
          <h3 className="section-title">Exact repository lookup</h3>
        </div>
        <div className="card-body pt-0 space-y-3">
          <form onSubmit={handleExactLookup} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={exactInput}
              onChange={(e) => {
                setExactInput(e.target.value);
                if (exactError) setExactError(null);
              }}
              placeholder="owner/repository"
              className="input-search flex-1 font-mono text-sm"
            />
            <button type="submit" className="btn-primary shrink-0 flex items-center justify-center gap-1.5">
              Analyze repository
              <ArrowRight size={14} />
            </button>
          </form>
          <p className="text-xs text-graphite-500">
            Enter a repository in owner/repository format, or use a quick action below.
          </p>
          {exactError && (
            <p className="text-sm text-red-600">{exactError}</p>
          )}
          <div className="flex flex-wrap gap-2 pt-1 border-t border-graphite-100">
            {DEMO_REPOS.map(({ owner, name, label }) => (
              <button
                key={label}
                type="button"
                onClick={() => navigateToRepo(owner, name)}
                className="btn-secondary text-xs py-1.5"
              >
                Analyze {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="section-title">General GitHub search</h3>
          <p className="text-xs text-graphite-500 mt-0.5">
            Search by keyword, language or topic. Results follow GitHub sort order.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card card-interactive">
          <div className="card-body">
            <div className="relative">
              <SearchIcon size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-graphite-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search repositories (e.g. react, typescript dashboard)..."
                className="input-search pl-12 text-base py-4"
                disabled={!isApiConnected(status)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-4">
              <div className="flex items-center gap-2 text-sm text-graphite-500">
                <SlidersHorizontal size={16} />
                Filters
              </div>
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="select-input">
                <option value="stars">Stars</option>
                <option value="forks">Forks</option>
                <option value="updated">Updated</option>
                <option value="help-wanted-issues">Help wanted</option>
              </select>
              <select value={order} onChange={(e) => setOrder(e.target.value)} className="select-input">
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              <span className="text-xs text-graphite-500">Suggested:</span>
              {SUGGESTED_QUERIES.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => {
                    setQuery(q);
                    setSearchParams({ q });
                  }}
                  className="lang-chip hover:bg-graphite-200 transition-colors cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </form>
      </section>

      {loading && <LoadingSpinner text="Searching GitHub..." />}

      {error && (
        <div className={error.toLowerCase().includes('rate limit') ? 'alert-warn' : 'alert-error'}>
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && results.length > 0 && (
        <>
          <div className="space-y-2">
            <p className="text-sm text-graphite-500 font-mono">
              {totalCount.toLocaleString()} results
            </p>
            {showSortNote && (
              <p className="text-xs text-graphite-400">
                Results are sorted by stars, so broad matches can appear before exact repository names.
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 gap-3">
            {results.map((repo) => (
              <SearchResultCard
                key={repo.id}
                repo={repo}
                exactMatch={isExactMatch(repo, activeQuery)}
                onSave={
                  status.databaseConnected
                    ? () => handleSave(repo.owner, repo.name)
                    : undefined
                }
                saveDisabled={!status.databaseConnected}
              />
            ))}
          </div>
        </>
      )}

      {!loading && !error && activeQuery && results.length === 0 && isApiConnected(status) && (
        <EmptyState
          icon={SearchIcon}
          title="No repositories found"
          description={`No results for "${activeQuery}". Try a different search term or use exact lookup for owner/repository.`}
        />
      )}

      {!activeQuery && !loading && (
        <EmptyState
          icon={SearchIcon}
          title="Start searching"
          description="Use exact lookup for a known repository, or run a general GitHub search above."
        />
      )}
    </div>
  );
}
