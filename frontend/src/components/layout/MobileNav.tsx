import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Overview', end: true },
  { to: '/search', label: 'Search' },
  { to: '/saved', label: 'Saved' },
  { to: '/compare', label: 'Compare' },
  { to: '/risk', label: 'Risk' },
  { to: '/monitor', label: 'Monitor' },
  { to: '/about', label: 'About' },
];

export function MobileNav() {
  return (
    <nav className="md:hidden flex gap-1.5 px-3 py-2.5 bg-graphite-950 border-b border-graphite-800 overflow-x-auto">
      {navItems.map(({ to, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors border ${
              isActive
                ? 'bg-graphite-800 text-emerald-glow border-emerald-500/30'
                : 'text-graphite-400 border-transparent hover:text-graphite-200 hover:bg-graphite-900/60'
            }`
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
