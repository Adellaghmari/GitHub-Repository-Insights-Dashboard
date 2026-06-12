import type { DecisionSummary } from '../utils/healthExplain';

interface Props {
  summary: DecisionSummary;
}

export function DecisionSummaryCard({ summary }: Props) {
  const rows = [
    { label: 'Recommended choice', value: summary.recommendedChoice, mono: true },
    { label: 'Why it wins', value: summary.whyItWins },
    { label: 'Tradeoff', value: summary.tradeoff },
    { label: 'Best use case', value: summary.bestUseCase },
  ];

  return (
    <section className="card border-cyan-200/70 bg-gradient-to-br from-cyan-50/30 via-white to-white shadow-card-md">
      <div className="card-header border-cyan-100/80">
        <h3 className="section-title">Decision summary</h3>
      </div>
      <div className="card-body space-y-4">
        {rows.map(({ label, value, mono }) => (
          <div key={label}>
            <p className="metric-label">{label}</p>
            <p className={`text-sm text-graphite-700 mt-1 leading-relaxed ${mono ? 'font-mono font-medium' : ''}`}>
              {value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
