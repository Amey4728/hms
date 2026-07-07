import { Link } from 'react-router-dom';
import { ShieldCheck, UserRound } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { PermissionGate } from '@/components/PermissionGate';
import { Card } from '@/components/ui';
import { PERMISSIONS } from '@hms/shared';
import { usePatients } from '@/features/patients/hooks';
import { useAuthStore } from '@/stores/auth.store';

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </Card>
  );
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const patients = usePatients({ page: 1, limit: 1 });

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user?.firstName ?? ''}`}
        subtitle="Here's an overview of your hospital system."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <PermissionGate anyOf={[PERMISSIONS.PATIENT_READ]}>
          <StatCard
            label="Registered patients"
            value={patients.data ? String(patients.data.meta.total) : '—'}
            hint="Total in the system"
          />
        </PermissionGate>

        <Card className="p-5">
          <div className="flex items-center gap-2 text-slate-500">
            <ShieldCheck className="h-4 w-4" />
            <p className="text-sm">Your roles</p>
          </div>
          <p className="mt-2 text-lg font-semibold text-slate-900">{user?.roles.join(', ')}</p>
          <p className="mt-1 text-xs text-slate-400">{user?.permissions.length} permissions granted</p>
        </Card>

        <PermissionGate anyOf={[PERMISSIONS.PATIENT_READ]}>
          <Link to="/patients">
            <Card className="flex h-full items-center gap-3 p-5 transition hover:border-brand-300 hover:shadow">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <UserRound className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-slate-900">Manage patients</p>
                <p className="text-xs text-slate-500">Register and view profiles</p>
              </div>
            </Card>
          </Link>
        </PermissionGate>
      </div>
    </div>
  );
}
