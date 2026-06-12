import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Clock, FileX, Bug, Activity } from 'lucide-react';
import { api } from '../api/client';
import { useApiStatus } from '../hooks/useApiStatus';
import { isApiConnected, shouldShowDatabaseNotice } from '../utils/connectionStatus';
import { DatabaseCompactNotice } from '../components/StatusCards';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { SuggestedRepoCard } from '../components/SuggestedRepoCard';
import { SUGGESTED_REPOS, getHealthColor } from '../utils/format';
import type { RiskCenterData, HealthScore } from '../types';
import type { LucideIcon } from 'lucide-react';

const riskCategories = [
  { title: 'High risk', icon: ShieldAlert, desc: 'Elevated risk score or health summary flagged as high risk.' },
  { title: 'Stale activity', icon: Clock, desc: 'No push activity in 6 months or longer.' },
  { title: 'Missing license', icon: FileX, desc: 'No license declared, commercial use needs review.' },
  { title: 'High issue ratio', icon: Bug, desc: 'Open issues high relative to stars and community size.' },
  { title: 'Low documentation score', icon: Activity, desc: 'Missing description, license or weak documentation signals.' },
];

interface RiskSectionProps {
  title: string;
  icon: LucideIcon;
  items: Array<{ owner: string; name: string; full_name: string; description: string | null; health: HealthScore }>;
  emptyText: string;
}

function RiskSection({ title, icon: Icon, items, emptyText }: RiskSectionProps) {
  return (
    <section className="card shadow-card">
      <div className="card-header flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 border border-amber-100">
          <Icon size={14} className="text-amber-risk" />
        </div>
        <h3 className="section-title">{title}</h3>
        <span className="ml-auto text-xs font-mono text-graphite-500 bg-graphite-50 px-2 py-0.5 rounded-md border border-graphite-100">
          {items.length}
        </span>
      </div>
      {items.length === 0 ? (
        <div className="card-body">
          <p className="text-sm text-graphite-400">{emptyText}</p>
        </div>
      ) : (
        <div className="divide-y divide-graphite-100/90">
          {items.map((item) => (
            <div key={item.full_name} className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-graphite-50/50 transition-colors">
              <div>
                <Link
                  to={`/repo/${item.owner}/${item.name}`}
                  className="font-mono text-sm font-medium text-graphite-900 hover:text-emerald-accent"
                >
                  {item.full_name}
                </Link>
                {item.description && (
                  <p className="text-xs text-graphite-500 mt-0.5 line-clamp-1">{item.description}</p>
                )}
              </div>
              <span className={`text-xs font-mono font-medium ${getHealthColor(item.health.summary)}`}>
                {item.health.score} · {item.health.summary}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function RiskCenter() {
  const { status } = useApiStatus();
  const [data, setData] = useState<RiskCenterData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isApiConnected(status)) {
      if (status.apiConnection !== 'checking') {
        setLoading(false);
      }
      return;
    }
    api.riskCenter()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [status.apiConnection]);

  const hasData = data && (
    data.highRisk.length > 0 ||
    data.stale.length > 0 ||
    data.missingLicense.length > 0 ||
    data.highIssueRatio.length > 0 ||
    data.lowActivity.length > 0
  );

  return (
    <div className="page-stack">
      <div className="page-header">
        <p className="page-eyebrow">Technical monitoring</p>
        <h2 className="page-title">Risk Center</h2>
        <div className="page-header-accent" />
        <p className="page-desc">
          Maintenance and adoption risk across saved repository analyses.
        </p>
      </div>

      {shouldShowDatabaseNotice(status) && <DatabaseCompactNotice />}

      {loading && <LoadingSpinner text="Loading risk data..." />}

      {!loading && hasData && data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <RiskSection title="High risk repositories" icon={ShieldAlert} items={data.highRisk} emptyText="No high risk repositories detected." />
          <RiskSection title="Stale repositories" icon={Clock} items={data.stale} emptyText="No stale repositories detected." />
          <RiskSection title="Missing license" icon={FileX} items={data.missingLicense} emptyText="All saved repos have licenses." />
          <RiskSection title="High issue ratio" icon={Bug} items={data.highIssueRatio} emptyText="No repos with high issue ratios." />
          <RiskSection title="Low activity score" icon={Activity} items={data.lowActivity} emptyText="All saved repos have healthy activity." />
        </div>
      )}

      {!loading && !hasData && (
        <>
          <div className="card shadow-card-md">
            <div className="card-header">
              <h3 className="section-title">Risk categories monitored</h3>
            </div>
            <div className="card-body grid grid-cols-1 sm:grid-cols-2 gap-4">
              {riskCategories.map(({ title, icon: Icon, desc }) => (
                <div key={title} className="flex items-start gap-3 p-4 rounded-xl border border-graphite-100/90 bg-graphite-50/30">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 border border-amber-100 shrink-0">
                    <Icon size={15} className="text-amber-risk" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-graphite-800">{title}</p>
                    <p className="text-xs text-graphite-500 mt-1 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-graphite-500 text-center">
            Analyze and save repositories to populate live risk monitoring.
          </p>

          <section>
            <h3 className="section-title mb-4">Suggested repositories to analyze</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {SUGGESTED_REPOS.slice(0, 4).map((repo) => (
                <SuggestedRepoCard key={repo.label} repo={repo} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
