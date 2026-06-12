import { Link } from 'react-router-dom';
import { Star, GitFork, AlertCircle, ExternalLink, Clock, Scale } from 'lucide-react';
import { formatNumber, formatRelative, getRiskHintColor } from '../utils/format';
import type { SearchResultItem } from '../types';

interface Props {
  repo: SearchResultItem;
  onSave?: () => void;
  saveDisabled?: boolean;
  exactMatch?: boolean;
}

export function SearchResultCard({ repo, onSave, saveDisabled, exactMatch }: Props) {
  const riskColors = getRiskHintColor(repo.riskHint);

  return (
    <article className="card card-interactive group">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-mono text-graphite-400">{repo.owner}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Link
                to={`/repo/${repo.owner}/${repo.name}`}
                className="text-lg font-semibold font-mono text-graphite-900 group-hover:text-emerald-accent transition-colors truncate"
              >
                {repo.name}
              </Link>
              {exactMatch && (
                <span className="text-xs px-2 py-0.5 rounded-md font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                  Exact match
                </span>
              )}
              <a
                href={repo.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-graphite-300 hover:text-graphite-500 shrink-0"
              >
                <ExternalLink size={14} />
              </a>
            </div>
            {repo.description && (
              <p className="text-sm text-graphite-500 mt-2.5 line-clamp-2 leading-relaxed">
                {repo.description}
              </p>
            )}
          </div>

          <span className={`shrink-0 text-xs px-2.5 py-1 rounded-md font-mono font-medium border ${riskColors}`}>
            {repo.riskHint} risk
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-4">
          {repo.language && <span className="lang-chip">{repo.language}</span>}
          {repo.license && (
            <span className="inline-flex items-center gap-1 lang-chip">
              <Scale size={10} />
              {repo.license}
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-xs font-mono text-graphite-500">
            <Clock size={11} />
            {formatRelative(repo.pushedAt || repo.updatedAt)}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-graphite-100/90">
          <div className="text-center">
            <p className="metric-label">Stars</p>
            <p className="font-mono text-sm font-semibold text-graphite-800 mt-1 flex items-center justify-center gap-1">
              <Star size={12} className="text-amber-risk" />
              {formatNumber(repo.stars)}
            </p>
          </div>
          <div className="text-center">
            <p className="metric-label">Forks</p>
            <p className="font-mono text-sm font-semibold text-graphite-800 mt-1 flex items-center justify-center gap-1">
              <GitFork size={12} className="text-graphite-400" />
              {formatNumber(repo.forks)}
            </p>
          </div>
          <div className="text-center">
            <p className="metric-label">Issues</p>
            <p className="font-mono text-sm font-semibold text-graphite-800 mt-1 flex items-center justify-center gap-1">
              <AlertCircle size={12} className="text-graphite-400" />
              {repo.openIssues}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-5">
          <Link to={`/repo/${repo.owner}/${repo.name}`} className="btn-primary text-xs py-2">
            Analyze
          </Link>
          {onSave && (
            <button
              onClick={onSave}
              disabled={saveDisabled}
              className="btn-secondary text-xs py-2"
              title={saveDisabled ? 'Database required to save' : undefined}
            >
              Save
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
