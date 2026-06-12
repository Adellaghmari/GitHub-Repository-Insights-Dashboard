import type { ExecutiveSummary } from '../utils/healthExplain';

interface Props {
  summary: ExecutiveSummary;
}

export function ExecutiveSummaryCard({ summary }: Props) {
  const rows = [
    { label: 'Recommendation', value: summary.recommendation },
    { label: 'Why it matters', value: summary.whyItMatters },
    { label: 'Watch out for', value: summary.watchOutFor },
    { label: 'Best use case', value: summary.bestUseCase },
  ];

  return (
    <section className="card border-cyan-200/70 bg-gradient-to-br from-cyan-50/30 via-white to-white shadow-card-md">
      <div className="card-header border-cyan-100/80">
        <h3 className="section-title">Executive summary</h3>
      </div>
      <div className="card-body grid grid-cols-1 sm:grid-cols-2 gap-5">
        {rows.map(({ label, value }) => (
          <div key={label}>
            <p className="metric-label">{label}</p>
            <p className="text-sm text-graphite-700 mt-1.5 leading-relaxed">{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
