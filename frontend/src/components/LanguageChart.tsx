import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { LanguageBreakdown } from '../types';
import { CHART_COLORS } from '../utils/format';

interface Props {
  languages: LanguageBreakdown[];
}

export function LanguageChart({ languages }: Props) {
  if (languages.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-graphite-400 text-sm">
        No language data available
      </div>
    );
  }

  const data = languages.slice(0, 8).map((l) => ({
    name: l.language,
    value: l.percentage,
    bytes: l.bytes,
  }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string) => [`${value}%`, name]}
            contentStyle={{
              background: '#fff',
              border: '1px solid #e8e8ea',
              borderRadius: '6px',
              fontSize: '12px',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-2 mt-2 justify-center">
        {data.map((item, i) => (
          <span key={item.name} className="lang-chip">
            <span
              className="w-2 h-2 rounded-full mr-1.5 inline-block"
              style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
            />
            {item.name} {item.value}%
          </span>
        ))}
      </div>
    </div>
  );
}
