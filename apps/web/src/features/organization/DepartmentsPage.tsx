import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { DEPARTMENT_TYPES, PERMISSIONS } from '@hms/shared';
import { PageHeader } from '@/components/PageHeader';
import { PermissionGate } from '@/components/PermissionGate';
import { Modal } from '@/components/Modal';
import { Badge, Button, Card, Field, Input, PageSpinner, Select } from '@/components/ui';
import { toast } from '@/components/toast';
import { ApiError } from '@/lib/api-client';
import { titleCase } from '@/lib/format';
import { OrgSubnav } from './OrgSubnav';
import { useBranches, useCreateDepartment, useDepartments, useHospitalsList } from './hooks';

export function DepartmentsPage() {
  const hospitals = useHospitalsList({ limit: 100 });
  const [hospitalId, setHospitalId] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', type: 'CLINICAL', branchId: '' });
  const create = useCreateDepartment();
  const branches = useBranches({ hospitalId: hospitalId || undefined, limit: 100 });
  const { data, isLoading } = useDepartments({ hospitalId: hospitalId || undefined, limit: 100 });

  useEffect(() => { if (!hospitalId && hospitals.data?.data[0]) setHospitalId(hospitals.data.data[0].id); }, [hospitals.data, hospitalId]);
  useEffect(() => { if (open) setForm({ name: '', code: '', type: 'CLINICAL', branchId: '' }); }, [open]);
  const onError = (e: unknown) => toast.error(e instanceof ApiError ? e.message : 'Failed');

  const submit = () => create.mutate(
    { hospitalId, name: form.name, code: form.code, type: form.type, branchId: form.branchId || undefined },
    { onSuccess: () => { toast.success('Department created'); setOpen(false); }, onError },
  );

  return (
    <div>
      <PageHeader title="Organization"
        actions={<PermissionGate anyOf={[PERMISSIONS.DEPARTMENT_CREATE]}><Button onClick={() => setOpen(true)} disabled={!hospitalId}><Plus className="h-4 w-4" /> New department</Button></PermissionGate>} />
      <OrgSubnav />
      <Card>
        <div className="border-b border-slate-100 dark:border-slate-800 p-4">
          <Select className="max-w-xs" value={hospitalId} onChange={(e) => setHospitalId(e.target.value)}>
            <option value="" disabled>Select hospital…</option>
            {hospitals.data?.data.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
          </Select>
        </div>
        {isLoading ? <PageSpinner /> : (data?.data.length ?? 0) === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500 dark:text-slate-400">No departments for this hospital.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-left text-xs uppercase text-slate-500 dark:text-slate-400">
                <tr><th className="px-4 py-3 font-medium">Code</th><th className="px-4 py-3 font-medium">Name</th><th className="px-4 py-3 font-medium">Type</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data?.data.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">{d.code}</td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{d.name}</td>
                    <td className="px-4 py-3"><Badge tone="neutral">{titleCase(d.type)}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Add department">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Code" required><Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="CARDIO" /></Field>
            <Field label="Type"><Select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>{DEPARTMENT_TYPES.map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}</Select></Field>
          </div>
          <Field label="Name" required><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></Field>
          <Field label="Branch (optional)">
            <Select value={form.branchId} onChange={(e) => setForm((f) => ({ ...f, branchId: e.target.value }))}>
              <option value="">— hospital-wide —</option>
              {branches.data?.data.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </Select>
          </Field>
          <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} loading={create.isPending} disabled={!form.code || !form.name}>Add department</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
