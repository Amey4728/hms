import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { PERMISSIONS } from '@hms/shared';
import { PageHeader } from '@/components/PageHeader';
import { PermissionGate } from '@/components/PermissionGate';
import { Modal } from '@/components/Modal';
import { Button, Card, Field, Input, PageSpinner, Select } from '@/components/ui';
import { toast } from '@/components/toast';
import { ApiError } from '@/lib/api-client';
import { OrgSubnav } from './OrgSubnav';
import { useBranches, useCreateBranch, useHospitalsList } from './hooks';

export function BranchesPage() {
  const hospitals = useHospitalsList({ limit: 100 });
  const [hospitalId, setHospitalId] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', city: '' });
  const create = useCreateBranch();
  const { data, isLoading } = useBranches({ hospitalId: hospitalId || undefined, limit: 100 });

  useEffect(() => { if (!hospitalId && hospitals.data?.data[0]) setHospitalId(hospitals.data.data[0].id); }, [hospitals.data, hospitalId]);
  const onError = (e: unknown) => toast.error(e instanceof ApiError ? e.message : 'Failed');

  const submit = () => create.mutate(
    { hospitalId, name: form.name, code: form.code, city: form.city || undefined },
    { onSuccess: () => { toast.success('Branch created'); setOpen(false); setForm({ name: '', code: '', city: '' }); }, onError },
  );

  return (
    <div>
      <PageHeader title="Organization"
        actions={<PermissionGate anyOf={[PERMISSIONS.BRANCH_CREATE]}><Button onClick={() => setOpen(true)} disabled={!hospitalId}><Plus className="h-4 w-4" /> New branch</Button></PermissionGate>} />
      <OrgSubnav />
      <Card>
        <div className="border-b border-slate-100 p-4">
          <Select className="max-w-xs" value={hospitalId} onChange={(e) => setHospitalId(e.target.value)}>
            <option value="" disabled>Select hospital…</option>
            {hospitals.data?.data.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
          </Select>
        </div>
        {isLoading ? <PageSpinner /> : (data?.data.length ?? 0) === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">No branches for this hospital.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr><th className="px-4 py-3 font-medium">Code</th><th className="px-4 py-3 font-medium">Name</th><th className="px-4 py-3 font-medium">City</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.data.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{b.code}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{b.name}</td>
                    <td className="px-4 py-3 text-slate-600">{b.city ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Add branch">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Code" required><Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="NW" /></Field>
            <Field label="City"><Input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} /></Field>
          </div>
          <Field label="Name" required><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></Field>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} loading={create.isPending} disabled={!form.code || !form.name}>Add branch</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
