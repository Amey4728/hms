import { useState } from 'react';
import { LogOut, Menu } from 'lucide-react';
import { Button } from '@/components/ui';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useLogout } from '@/features/auth/hooks';
import { useAuthStore } from '@/stores/auth.store';

function initials(first?: string, last?: string) {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase() || '·';
}

export function Navbar({ onMenuClick }: { onMenuClick: () => void }) {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/70 glass px-4 dark:border-slate-800 lg:px-6">
      <button
        onClick={onMenuClick}
        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <ThemeToggle />

        <div className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2.5 rounded-xl py-1.5 pl-1.5 pr-2.5 transition hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-gradient text-sm font-bold text-white shadow-glow-sm">
              {initials(user?.firstName, user?.lastName)}
            </span>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {user ? `${user.firstName} ${user.lastName}` : '—'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{user?.roles.join(', ')}</p>
            </div>
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
              <div className="absolute right-0 z-20 mt-2 w-60 animate-scale-in rounded-2xl border border-slate-200 bg-white p-2 shadow-card dark:border-slate-800 dark:bg-slate-900">
                <div className="border-b border-slate-100 px-3 py-2 dark:border-slate-800">
                  <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{user?.email}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{user?.roles.join(', ')}</p>
                </div>
                <Button
                  variant="ghost"
                  className="mt-1 w-full justify-start"
                  loading={logout.isPending}
                  onClick={() => logout.mutate()}
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
