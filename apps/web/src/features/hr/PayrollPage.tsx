import { useMemo } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Badge, Card, PageSpinner } from '@/components/ui';
import { titleCase } from '@/lib/format';
import { HrSubnav } from './HrSubnav';
import { useAllEmployees, usePayslips } from './hooks';

const TONE: Record<string, 'neutral' | 'warning' | 'success'> = {
  DRAFT: 'neutral', FINALIZED: 'warning', PAID: 'success',
};

export function PayrollPage() {
  const employees = useAllEmployees();
  const { data, isLoading } = usePayslips({ limit: 50 });
  const nameOf = useMemo(() => new Map((employees.data ?? []).map((e) => [e.id, `${e.firstName} ${e.lastName}`])), [employees.data]);
  const rows = data?.data ?? [];

  return (
    <div>
      <PageHeader title="Human Resources" />
      <HrSubnav />
      <Card>
        {isLoading ? <PageSpinner /> : rows.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">No payslips. Generate one from the Employees tab.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr><th className="px-4 py-3 font-medium">Employee</th><th className="px-4 py-3 font-medium">Period</th><th className="px-4 py-3 text-right font-medium">Base</th><th className="px-4 py-3 text-right font-medium">Allowances</th><th className="px-4 py-3 text-right font-medium">Deductions</th><th className="px-4 py-3 text-right font-medium">Net pay</th><th className="px-4 py-3 font-medium">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{nameOf.get(p.employeeId) ?? p.employeeId.slice(0, 8)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{p.period}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{p.baseSalary.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-emerald-600">+{p.allowances.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-red-600">−{p.deductions.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">{p.netPay.toFixed(2)}</td>
                    <td className="px-4 py-3"><Badge tone={TONE[p.status]}>{titleCase(p.status)}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
