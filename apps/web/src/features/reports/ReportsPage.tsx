import { useQuery } from '@tanstack/react-query';
import { Activity, CalendarClock, DollarSign, FlaskConical, Package, UserRound } from 'lucide-react';
import type { ReactNode } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Badge, Card, PageSpinner } from '@/components/ui';
import { titleCase } from '@/lib/format';
import { reportsApi } from './api';

function Stat({ icon, label, value, hint }: { icon: ReactNode; label: string; value: string; hint?: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{hint}</p>}
    </Card>
  );
}

function money(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function ReportsPage() {
  const overview = useQuery({ queryKey: ['reports', 'overview'], queryFn: reportsApi.overview });
  const revenue = useQuery({ queryKey: ['reports', 'revenue'], queryFn: reportsApi.revenue });
  const appts = useQuery({ queryKey: ['reports', 'appointments'], queryFn: reportsApi.appointments });
  const doctors = useQuery({ queryKey: ['reports', 'doctors'], queryFn: reportsApi.doctors });
  const inventory = useQuery({ queryKey: ['reports', 'inventory'], queryFn: reportsApi.inventory });

  if (overview.isLoading) return <PageSpinner />;
  const o = overview.data;

  return (
    <div>
      <PageHeader title="Reports & Analytics" subtitle="Operational and financial overview" />

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={<UserRound className="h-4 w-4" />} label="Patients" value={String(o?.patients ?? 0)} />
        <Stat icon={<CalendarClock className="h-4 w-4" />} label="Appointments" value={String(o?.appointments ?? 0)} />
        <Stat icon={<FlaskConical className="h-4 w-4" />} label="Lab orders" value={String(o?.labOrders ?? 0)} />
        <Stat
          icon={<DollarSign className="h-4 w-4" />}
          label="Collected"
          value={money(o?.revenue.collected ?? 0)}
          hint={`Outstanding ${money(o?.revenue.outstanding ?? 0)}`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Revenue */}
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-emerald-600" />
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">Revenue</h3>
          </div>
          {revenue.data && (
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <span className="text-slate-500 dark:text-slate-400">Invoices</span><span className="text-right">{revenue.data.invoices.count}</span>
              <span className="text-slate-500 dark:text-slate-400">Billed</span><span className="text-right">{money(revenue.data.invoices.billed)}</span>
              <span className="text-slate-500 dark:text-slate-400">Collected</span><span className="text-right text-emerald-600">{money(revenue.data.invoices.collected)}</span>
              <span className="text-slate-500 dark:text-slate-400">Outstanding</span><span className="text-right text-amber-600">{money(revenue.data.invoices.outstanding)}</span>
              <span className="text-slate-500 dark:text-slate-400">Tax collected</span><span className="text-right">{money(revenue.data.invoices.tax)}</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">Pharmacy sales</span><span className="text-right font-medium">{money(revenue.data.pharmacy.revenue)}</span>
            </div>
          )}
        </Card>

        {/* Appointments breakdown */}
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-brand-600" />
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">Appointments by status</h3>
          </div>
          {appts.data && (
            <div className="space-y-2">
              {Object.entries(appts.data.byStatus).map(([k, v]) => {
                const pct = appts.data!.total ? Math.round((v / appts.data!.total) * 100) : 0;
                return (
                  <div key={k}>
                    <div className="mb-0.5 flex justify-between text-xs text-slate-600 dark:text-slate-300">
                      <span>{titleCase(k)}</span>
                      <span>{v}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className="h-2 rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Doctor workload */}
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-brand-600" />
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">Doctor workload</h3>
          </div>
          {(doctors.data?.length ?? 0) === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500">No appointments yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {doctors.data?.map((d) => (
                <li key={d.doctorId} className="flex justify-between">
                  <span className="text-slate-700 dark:text-slate-300">Dr. {d.doctorName}</span>
                  <Badge tone="info">{d.appointments}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Inventory */}
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-amber-600" />
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">Pharmacy inventory</h3>
          </div>
          {inventory.data && (
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <span className="text-slate-500 dark:text-slate-400">Medicines</span><span className="text-right">{inventory.data.medicines}</span>
              <span className="text-slate-500 dark:text-slate-400">Low stock</span><span className="text-right text-red-600">{inventory.data.lowStock}</span>
              <span className="text-slate-500 dark:text-slate-400">Expiring (30d)</span><span className="text-right text-amber-600">{inventory.data.expiringBatches}</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">Stock value</span><span className="text-right font-medium">{money(inventory.data.stockValue)}</span>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
