interface Props {
  text: string;
}

export function StakeholderSummaryCard({ text }: Props) {
  return (
    <section className="card shadow-card">
      <div className="card-header">
        <h3 className="section-title">Stakeholder summary</h3>
      </div>
      <div className="card-body">
        <p className="text-sm text-graphite-700 leading-relaxed">{text}</p>
        <p className="text-xs text-graphite-400 mt-4">
          Plain-language overview for developers, support, sales and business stakeholders.
        </p>
      </div>
    </section>
  );
}
