import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Search,
  Bookmark,
  GitCompareArrows,
  ShieldAlert,
  Activity,
  Info,
  Terminal,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const navItems: Array<{ to: string; label: string; icon: LucideIcon; end?: boolean }> = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/saved', label: 'Saved', icon: Bookmark },
  { to: '/compare', label: 'Compare', icon: GitCompareArrows },
  { to: '/risk', label: 'Risk', icon: ShieldAlert },
  { to: '/monitor', label: 'Monitor', icon: Activity },
  { to: '/about', label: 'About', icon: Info },
];

export function LeftRail() {
  return (
    <aside className="w-[188px] shrink-0 bg-graphite-950 border-r border-graphite-800/80 hidden md:flex flex-col shadow-rail">
      <div className="px-4 py-5 border-b border-graphite-800/60">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl bg-graphite-900 border border-emerald-500/40 flex items-center justify-center shrink-0"
            style={{ boxShadow: '0 0 20px -6px rgba(16, 185, 129, 0.35)' }}
          >
            <Terminal size={16} className="text-emerald-glow" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.16em] text-graphite-500 font-mono">Dev Console</p>
            <p className="text-xs font-semibold text-white truncate mt-0.5">Repo Analytics</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-5 px-3 space-y-1">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                isActive ? 'nav-link-active' : 'nav-link-idle'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={16} className={`shrink-0 ${isActive ? 'nav-icon-active' : 'opacity-80'}`} />
                <span className="truncate">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-graphite-800/60">
        <div
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-graphite-900/50 border border-graphite-800/80"
          style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)' }}
        >
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-accent opacity-40 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-glow" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-mono text-graphite-400">System</p>
            <p className="text-[10px] font-mono text-emerald-glow/90 truncate">GitHub REST API</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
