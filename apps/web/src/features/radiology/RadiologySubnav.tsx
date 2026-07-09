import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/cn';

const tabs = [
  { to: '/radiology', label: 'Studies', end: true },
  { to: '/radiology/catalogue', label: 'Exam Catalogue', end: false },
];

export function RadiologySubnav() {
  return (
    <div className="mb-4 flex gap-1 border-b border-slate-200 dark:border-slate-800">
      {tabs.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.end}
          className={({ isActive }) =>
            cn(
              '-mb-px border-b-2 px-4 py-2 text-sm font-medium',
              isActive ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700',
            )
          }
        >
          {t.label}
        </NavLink>
      ))}
    </div>
  );
}
