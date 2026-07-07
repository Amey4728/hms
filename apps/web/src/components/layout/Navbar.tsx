import { useState } from 'react';
import { LogOut, Menu, UserCircle2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { useLogout } from '@/features/auth/hooks';
import { useAuthStore } from '@/stores/auth.store';

export function Navbar({ onMenuClick }: { onMenuClick: () => void }) {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const [open, setOpen] = useState(false);

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6">
      <button
        onClick={onMenuClick}
        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex-1" />

      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100"
        >
          <UserCircle2 className="h-7 w-7 text-slate-400" />
          <div className="hidden text-left sm:block">
            <p className="text-sm font-medium text-slate-800">
              {user ? `${user.firstName} ${user.lastName}` : '—'}
            </p>
            <p className="text-xs text-slate-500">{user?.roles.join(', ')}</p>
          </div>
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute right-0 z-20 mt-2 w-56 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
              <div className="border-b border-slate-100 px-3 py-2">
                <p className="truncate text-sm font-medium text-slate-800">{user?.email}</p>
                <p className="text-xs text-slate-500">{user?.roles.join(', ')}</p>
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
    </header>
  );
}
