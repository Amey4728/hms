import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-full">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile sidebar drawer */}
      <div className={cn('fixed inset-0 z-40 lg:hidden', mobileOpen ? 'block' : 'hidden')}>
        <div className="absolute inset-0 bg-slate-900/40" onClick={() => setMobileOpen(false)} />
        <div className="absolute left-0 top-0 h-full">
          <Sidebar onNavigate={() => setMobileOpen(false)} />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
