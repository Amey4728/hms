import { NavLink } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { cn } from '@/lib/cn';
import { usePermissions } from '@/hooks/usePermissions';
import { NAV_ITEMS } from './nav';

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { hasAny } = usePermissions();
  const items = NAV_ITEMS.filter((item) => item.anyOf.length === 0 || hasAny(item.anyOf));

  return (
    <aside className="flex h-full w-64 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-2 border-b border-slate-200 px-6 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
          <Activity className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900">HMS</p>
          <p className="text-xs text-slate-500">Hospital System</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-200 p-4 text-xs text-slate-400">HMS v0.1 · Phase 3</div>
    </aside>
  );
}
