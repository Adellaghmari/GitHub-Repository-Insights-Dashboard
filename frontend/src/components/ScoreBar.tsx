interface Props {
  label: string;
  score: number;
  color?: string;
}

export function ScoreBar({ label, score, color = 'bg-emerald-accent' }: Props) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-graphite-600">{label}</span>
        <span className="text-xs font-mono text-graphite-800">{score}</span>
      </div>
      <div className="h-2 bg-graphite-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
    </div>
  );
}
