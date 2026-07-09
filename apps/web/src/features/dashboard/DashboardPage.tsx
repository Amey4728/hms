import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarClock,
  DollarSign,
  FlaskConical,
  ShieldCheck,
  Stethoscope,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import { PERMISSIONS } from '@hms/shared';
import { PageHeader } from '@/components/PageHeader';
import { PermissionGate } from '@/components/PermissionGate';
import { Card } from '@/components/ui';
import { reportsApi } from '@/features/reports/api';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuthStore } from '@/stores/auth.store';

const GRADIENTS = [
  'from-indigo-500 to-violet-500',
  'from-sky-500 to-blue-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
] as const;

function StatTile({ icon: Icon, label, value, hint, gradient }: { icon: LucideIcon; label: string; value: string; hint?: string; gradient: string }) {
  return (
    <Card className="group relative overflow-hidden p-5 transition-all hover:-translate-y-0.5 hover:shadow-glow">
      <div className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${gradient} opacity-10 blur-2xl transition-opacity group-hover:opacity-20`} />
      <div className={`mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-glow-sm`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-0.5 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{hint}</p>}
    </Card>
  );
}

function QuickLink({ to, icon: Icon, title, subtitle }: { to: string; icon: LucideIcon; title: string; subtitle: string }) {
  return (
    <Link to={to}>
      <Card className="group flex h-full items-center gap-3 p-4 transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-glow dark:hover:border-brand-500/40">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900 dark:text-white">{title}</p>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
        <ArrowRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-500 dark:text-slate-600" />
      </Card>
    </Link>
  );
}

const money = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 0 });

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { hasAny } = usePermissions();
  const canViewReports = hasAny([PERMISSIONS.REPORT_VIEW]);
  const overview = useQuery({ queryKey: ['reports', 'overview'], queryFn: reportsApi.overview, enabled: canViewReports });
  const o = overview.data;

  return (
    <div className="space-y-6">
      <PageHeader title={`Welcome back, ${user?.firstName ?? ''}`} subtitle="Here's what's happening across your hospital today." />

      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-2xl bg-sidebar-gradient p-6 text-white sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-10 h-52 w-52 rounded-full bg-accent-500/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-1/3 h-52 w-52 rounded-full bg-brand-500/30 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-brand-200/80">Signed in as {user?.roles.join(', ')}</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              {o ? `${o.patients} patients · ${o.appointments} appointments` : 'Your command center'}
            </h2>
            <p className="mt-1 text-sm text-brand-100/70">Everything from admissions to billing, in real time.</p>
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur">
            <Stethoscope className="h-8 w-8" />
          </div>
        </div>
      </div>

      {/* Stat tiles (reporting) */}
      {canViewReports && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile icon={UserRound} gradient={GRADIENTS[0]} label="Patients" value={o ? String(o.patients) : '—'} hint="Registered in the system" />
          <StatTile icon={CalendarClock} gradient={GRADIENTS[1]} label="Appointments" value={o ? String(o.appointments) : '—'} hint="Booked to date" />
          <StatTile icon={DollarSign} gradient={GRADIENTS[2]} label="Collected" value={o ? money(o.revenue.collected) : '—'} hint={o ? `${money(o.revenue.outstanding)} outstanding` : undefined} />
          <StatTile icon={FlaskConical} gradient={GRADIENTS[3]} label="Lab orders" value={o ? String(o.labOrders) : '—'} hint="Across all departments" />
        </div>
      )}

      {/* Patients-only fallback tile */}
      {!canViewReports && (
        <PermissionGate anyOf={[PERMISSIONS.PATIENT_READ]}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile icon={UserRound} gradient={GRADIENTS[0]} label="Patients" value="—" hint="Open Patients to view" />
          </div>
        </PermissionGate>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Quick links */}
        <div className="space-y-3 lg:col-span-2">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Quick actions</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <PermissionGate anyOf={[PERMISSIONS.PATIENT_READ]}>
              <QuickLink to="/patients" icon={UserRound} title="Patients" subtitle="Register & view profiles" />
            </PermissionGate>
            <PermissionGate anyOf={[PERMISSIONS.PATIENT_READ]}>
              <QuickLink to="/visits" icon={Stethoscope} title="Clinical visits" subtitle="Encounters & prescriptions" />
            </PermissionGate>
            <PermissionGate anyOf={[PERMISSIONS.APPOINTMENT_READ]}>
              <QuickLink to="/appointments" icon={CalendarClock} title="Appointments" subtitle="Schedule & queue" />
            </PermissionGate>
            <PermissionGate anyOf={[PERMISSIONS.LAB_RESULT_READ]}>
              <QuickLink to="/laboratory" icon={FlaskConical} title="Laboratory" subtitle="Orders & results" />
            </PermissionGate>
          </div>
        </div>

        {/* Roles card */}
        <Card className="p-5">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <ShieldCheck className="h-4 w-4" />
            <p className="text-sm font-medium">Your access</p>
          </div>
          <p className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">{user?.roles.join(', ')}</p>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-3xl font-bold text-gradient">{user?.permissions.length ?? 0}</span>
            <span className="text-sm text-slate-500 dark:text-slate-400">permissions granted</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
