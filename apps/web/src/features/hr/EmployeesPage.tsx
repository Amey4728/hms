import { useEffect, useState } from 'react';
import { CalendarPlus, Plus, Receipt } from 'lucide-react';
import { EMPLOYMENT_TYPES, LEAVE_TYPES, PERMISSIONS } from '@hms/shared';
import { PageHeader } from '@/components/PageHeader';
import { PermissionGate } from '@/components/PermissionGate';
import { Modal } from '@/components/Modal';
import { Badge, Button, Card, Field, Input, PageSpinner, Select } from '@/components/ui';
import { toast } from '@/components/toast';
import { ApiError } from '@/lib/api-client';
import { titleCase } from '@/lib/format';
import { HrSubnav } from './HrSubnav';
import { useCreateEmployee, useEmployees, useGeneratePayslip, useRequestLeave } from './hooks';
import type { Employee } from './api';

const EMPTY = { firstName: '', lastName: '', designation: '', department: '', employmentType: 'FULL_TIME', joinedAt: '', baseSalary: '0' };

export function EmployeesPage() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [leaveFor, setLeaveFor] = useState<Employee | null>(null);
  const [leave, setLeave] = useState({ type: 'CASUAL', startDate: '', endDate: '', reason: '' });

  const create = useCreateEmployee();
  const requestLeave = useRequestLeave();
  const genPayslip = useGeneratePayslip();
  const { data, isLoading } = useEmployees({ limit: 50 });

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  useEffect(() => { if (leaveFor) setLeave({ type: 'CASUAL', startDate: '', endDate: '', reason: '' }); }, [leaveFor]);
  const onError = (e: unknown) => toast.error(e instanceof ApiError ? e.message : 'Failed');

  const submit = () => create.mutate(
    { ...form, baseSalary: Number(form.baseSalary), department: form.department || undefined },
    { onSuccess: () => { toast.success('Employee added'); setOpen(false); setForm(EMPTY); }, onError },
  );

  const submitLeave = () => leaveFor && requestLeave.mutate(
    { employeeId: leaveFor.id, body: { type: leave.type, startDate: leave.startDate, endDate: leave.endDate, reason: leave.reason || undefined } },
    { onSuccess: () => { toast.success('Leave requested'); setLeaveFor(null); }, onError },
  );

  const payslip = (emp: Employee) => {
    const period = window.prompt('Payroll period (YYYY-MM):', new Date().toISOString().slice(0, 7));
    if (!period) return;
    const allowances = Number(window.prompt('Allowances:', '0') ?? 0);
    const deductions = Number(window.prompt('Deductions:', '0') ?? 0);
    genPayslip.mutate({ employeeId: emp.id, body: { period, allowances, deductions } }, {
      onSuccess: (p) => toast.success(`Payslip ${period}: net ${p.netPay.toFixed(2)}`), onError,
    });
  };

  return (
    <div>
      <PageHeader title="Human Resources"
        actions={<PermissionGate anyOf={[PERMISSIONS.STAFF_MANAGE]}><Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New employee</Button></PermissionGate>} />
      <HrSubnav />
      <Card>
        {isLoading ? <PageSpinner /> : (data?.data.length ?? 0) === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">No employees.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr><th className="px-4 py-3 font-medium">ID</th><th className="px-4 py-3 font-medium">Name</th><th className="px-4 py-3 font-medium">Designation</th><th className="px-4 py-3 font-medium">Type</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 text-right font-medium">Salary</th><th className="px-4 py-3 text-right font-medium">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.data.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{e.employeeRef}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{e.firstName} {e.lastName}</td>
                    <td className="px-4 py-3 text-slate-600">{e.designation}{e.department ? ` · ${e.department}` : ''}</td>
                    <td className="px-4 py-3"><Badge tone="neutral">{titleCase(e.employmentType)}</Badge></td>
                    <td className="px-4 py-3"><Badge tone={e.status === 'ACTIVE' ? 'success' : 'neutral'}>{titleCase(e.status)}</Badge></td>
                    <td className="px-4 py-3 text-right font-medium">{e.baseSalary.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <PermissionGate anyOf={[PERMISSIONS.STAFF_MANAGE, PERMISSIONS.PAYROLL_MANAGE]}>
                        <div className="flex items-center justify-end gap-1">
                          <PermissionGate anyOf={[PERMISSIONS.STAFF_MANAGE]}><Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => setLeaveFor(e)}><CalendarPlus className="h-4 w-4" /> Leave</Button></PermissionGate>
                          <PermissionGate anyOf={[PERMISSIONS.PAYROLL_MANAGE]}><Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => payslip(e)}><Receipt className="h-4 w-4" /> Payslip</Button></PermissionGate>
                        </div>
                      </PermissionGate>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create employee */}
      <Modal open={open} onClose={() => setOpen(false)} title="Add employee" width="max-w-xl">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="First name" required><Input value={form.firstName} onChange={set('firstName')} /></Field>
            <Field label="Last name" required><Input value={form.lastName} onChange={set('lastName')} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Designation" required><Input value={form.designation} onChange={set('designation')} placeholder="Staff Nurse" /></Field>
            <Field label="Department"><Input value={form.department} onChange={set('department')} /></Field>
            <Field label="Employment type"><Select value={form.employmentType} onChange={set('employmentType')}>{EMPLOYMENT_TYPES.map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}</Select></Field>
            <Field label="Joined date" required><Input type="date" value={form.joinedAt} onChange={set('joinedAt')} /></Field>
            <Field label="Base salary" required><Input type="number" value={form.baseSalary} onChange={set('baseSalary')} /></Field>
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} loading={create.isPending} disabled={!form.firstName || !form.lastName || !form.designation || !form.joinedAt}>Add employee</Button>
          </div>
        </div>
      </Modal>

      {/* Request leave */}
      <Modal open={!!leaveFor} onClose={() => setLeaveFor(null)} title={`Leave · ${leaveFor?.firstName ?? ''} ${leaveFor?.lastName ?? ''}`}>
        <div className="space-y-4">
          <Field label="Type"><Select value={leave.type} onChange={(e) => setLeave((l) => ({ ...l, type: e.target.value }))}>{LEAVE_TYPES.map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}</Select></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Start" required><Input type="date" value={leave.startDate} onChange={(e) => setLeave((l) => ({ ...l, startDate: e.target.value }))} /></Field>
            <Field label="End" required><Input type="date" value={leave.endDate} onChange={(e) => setLeave((l) => ({ ...l, endDate: e.target.value }))} /></Field>
          </div>
          <Field label="Reason"><Input value={leave.reason} onChange={(e) => setLeave((l) => ({ ...l, reason: e.target.value }))} /></Field>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Button variant="secondary" onClick={() => setLeaveFor(null)}>Cancel</Button>
            <Button onClick={submitLeave} loading={requestLeave.isPending} disabled={!leave.startDate || !leave.endDate}>Request leave</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
