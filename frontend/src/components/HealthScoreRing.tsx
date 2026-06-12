import { getHealthColor } from '../utils/format';

interface Props {
  score: number;
  summary: string;
  size?: 'sm' | 'lg';
}

const strokeColors: Record<string, string> = {
  Healthy: '#10b981',
  Stable: '#06b6d4',
  'Needs Attention': '#f59e0b',
  'High Risk': '#ef4444',
};

export function HealthScoreRing({ score, summary, size = 'lg' }: Props) {
  const radius = size === 'lg' ? 54 : 32;
  const stroke = size === 'lg' ? 8 : 5;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const dimension = radius * 2;
  const colorClass = getHealthColor(summary);
  const strokeColor = strokeColors[summary] || '#5c5c66';

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: dimension, height: dimension }}>
        <svg width={dimension} height={dimension} className="transform -rotate-90">
          <circle
            stroke="#e8e8ea"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke={strokeColor}
            fill="transparent"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            style={{ strokeDashoffset }}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-mono font-bold ${size === 'lg' ? 'text-3xl' : 'text-lg'} ${colorClass}`}>
            {score}
          </span>
        </div>
      </div>
      <span className={`mt-2 text-sm font-medium ${colorClass}`}>{summary}</span>
    </div>
  );
}
