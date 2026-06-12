import type { LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div className="card card-interactive">
      <div className="py-16 sm:py-20 px-6 text-center">
        <div className="empty-icon-wrap">
          <Icon size={28} className="text-graphite-400" />
        </div>
        <h3 className="text-lg font-semibold text-graphite-900">{title}</h3>
        <p className="text-sm text-graphite-500 mt-2 max-w-md mx-auto leading-relaxed">{description}</p>
        {action && <div className="mt-6">{action}</div>}
      </div>
    </div>
  );
}
