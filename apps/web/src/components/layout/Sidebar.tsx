import { NavLink } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { cn } from '@/lib/cn';
import { usePermissions } from '@/hooks/usePermissions';
import { NAV_ITEMS } from './nav';

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { hasAny } = usePermissions();
  const items = NAV_ITEMS.filter((item) => item.anyOf.length === 0 || hasAny(item.anyOf));

  return (
    <aside className="relative flex h-full w-64 flex-col overflow-hidden bg-sidebar-gradient text-slate-300">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -left-16 top-24 h-64 w-64 rounded-full bg-accent-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 bottom-10 h-52 w-52 rounded-full bg-brand-500/20 blur-3xl" />

      <div className="relative flex items-center gap-3 px-6 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/20 backdrop-blur">
          <Activity className="h-5 w-5" />
        </div>
        <div>
          <p className="text-base font-bold tracking-tight text-white">HMS</p>
          <p className="text-xs text-brand-200/80">Hospital System</p>
        </div>
      </div>

      <nav className="relative flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                isActive
                  ? 'bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ring-1 ring-white/10'
                  : 'text-slate-300/80 hover:bg-white/5 hover:text-white',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    'absolute left-0 top-1/2 h-6 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-brand-300 to-accent-300 transition-all',
                    isActive ? 'w-1 opacity-100' : 'w-0 opacity-0',
                  )}
                />
                <item.icon className={cn('h-5 w-5 transition-colors', isActive ? 'text-brand-200' : 'text-slate-400 group-hover:text-white')} />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="relative border-t border-white/10 px-5 py-4 text-xs text-slate-400/70">HMS v1.0 · Enterprise</div>
    </aside>
  );
}
