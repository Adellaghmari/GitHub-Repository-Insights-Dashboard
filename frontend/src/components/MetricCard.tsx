import type { LucideIcon } from 'lucide-react';

interface Props {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  subtext?: string;
}

export function MetricCard({ label, value, icon: Icon, subtext }: Props) {
  return (
    <div className="metric-widget">
      <div className="metric-widget-accent" />
      <div className="card-body">
        <div className="flex items-start justify-between gap-3">
          <span className="metric-label">{label}</span>
          {Icon && (
            <div className="metric-icon-wrap">
              <Icon size={17} className="text-emerald-accent" />
            </div>
          )}
        </div>
        <p className="metric-value mt-3">{value}</p>
        {subtext && (
          <p className="text-[11px] font-mono text-graphite-400 mt-2 tracking-wide">{subtext}</p>
        )}
      </div>
    </div>
  );
}
