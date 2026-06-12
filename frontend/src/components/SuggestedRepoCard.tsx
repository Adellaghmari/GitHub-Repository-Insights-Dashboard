import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { formatNumber } from '../utils/format';
import type { SuggestedRepo } from '../utils/format';

interface Props {
  repo: SuggestedRepo;
  onSave?: () => void;
  saveDisabled?: boolean;
}

export function SuggestedRepoCard({ repo, onSave, saveDisabled }: Props) {
  return (
    <div className="card card-interactive group h-full">
      <div className="p-5">
        <div className="min-w-0">
          <Link
            to={`/repo/${repo.owner}/${repo.name}`}
            className="font-mono text-sm font-semibold text-graphite-900 group-hover:text-emerald-accent transition-colors"
          >
            {repo.label}
          </Link>
          <p className="text-xs text-graphite-500 mt-2 leading-relaxed line-clamp-2">
            {repo.description}
          </p>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <span className="lang-chip">{repo.language}</span>
          <span className="flex items-center gap-1 text-xs font-mono text-graphite-600">
            <Star size={11} className="text-amber-risk" />
            {formatNumber(repo.stars)}
          </span>
        </div>

        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-graphite-100/90">
          <Link
            to={`/repo/${repo.owner}/${repo.name}`}
            className="btn-primary text-xs py-2"
          >
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
    </div>
  );
}
