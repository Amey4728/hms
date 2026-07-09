import { useMemo, useState } from 'react';
import { LEAVE_STATUSES, PERMISSIONS } from '@hms/shared';
import { PageHeader } from '@/components/PageHeader';
import { PermissionGate } from '@/components/PermissionGate';
import { Badge, Button, Card, PageSpinner, Select } from '@/components/ui';
import { toast } from '@/components/toast';
import { ApiError } from '@/lib/api-client';
import { formatDate, titleCase } from '@/lib/format';
import { HrSubnav } from './HrSubnav';
import { useAllEmployees, useLeave, useLeaveActions } from './hooks';
import type { Leave } from './api';

const TONE: Record<string, 'neutral' | 'warning' | 'success' | 'danger'> = {
  PENDING: 'warning', APPROVED: 'success', REJECTED: 'danger',
};

export function LeavePage() {
  const [status, setStatus] = useState('');
  const employees = useAllEmployees();
  const { data, isLoading } = useLeave({ limit: 50, status: status || undefined });
  const actions = useLeaveActions();
  const nameOf = useMemo(() => new Map((employees.data ?? []).map((e) => [e.id, `${e.firstName} ${e.lastName}`])), [employees.data]);
  const rows = data?.data ?? [];
  const onError = (e: unknown) => toast.error(e instanceof ApiError ? e.message : 'Failed');

  const reject = (l: Leave) => {
    const note = window.prompt('Rejection note (optional):') ?? undefined;
    actions.reject.mutate({ id: l.id, version: l.version, note }, { onSuccess: () => toast.success('Rejected'), onError });
  };

  return (
    <div>
      <PageHeader title="Human Resources" />
      <HrSubnav />
      <Card>
        <div className="border-b border-slate-100 dark:border-slate-800 p-4">
          <Select className="max-w-xs" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {LEAVE_STATUSES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
          </Select>
        </div>
        {isLoading ? <PageSpinner /> : rows.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500 dark:text-slate-400">No leave requests.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-left text-xs uppercase text-slate-500 dark:text-slate-400">
                <tr><th className="px-4 py-3 font-medium">Employee</th><th className="px-4 py-3 font-medium">Type</th><th className="px-4 py-3 font-medium">Dates</th><th className="px-4 py-3 font-medium">Days</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 text-right font-medium">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{nameOf.get(l.employeeId) ?? l.employeeId.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{titleCase(l.type)}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{formatDate(l.startDate)} → {formatDate(l.endDate)}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{l.days}</td>
                    <td className="px-4 py-3"><Badge tone={TONE[l.status]}>{titleCase(l.status)}</Badge></td>
                    <td className="px-4 py-3">
                      {l.status === 'PENDING' && (
                        <PermissionGate anyOf={[PERMISSIONS.STAFF_MANAGE]}>
                          <div className="flex items-center justify-end gap-1">
                            <Button className="px-2 py-1 text-xs" onClick={() => actions.approve.mutate({ id: l.id, version: l.version }, { onSuccess: () => toast.success('Approved'), onError })}>Approve</Button>
                            <Button variant="ghost" className="px-2 py-1 text-xs text-red-500" onClick={() => reject(l)}>Reject</Button>
                          </div>
                        </PermissionGate>
                      )}
                    </td>
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
