import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { PERMISSIONS } from '@hms/shared';
import { PageHeader } from '@/components/PageHeader';
import { PermissionGate } from '@/components/PermissionGate';
import { Modal } from '@/components/Modal';
import { Badge, Button, Card, Field, Input, PageSpinner } from '@/components/ui';
import { toast } from '@/components/toast';
import { ApiError } from '@/lib/api-client';
import { OrgSubnav } from './OrgSubnav';
import { useCreateHospital, useDeleteHospital, useHospitalsList } from './hooks';
import type { Hospital } from './api';

const EMPTY = { name: '', code: '', city: '', email: '', phone: '' };

export function HospitalsPage() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const create = useCreateHospital();
  const del = useDeleteHospital();
  const { data, isLoading } = useHospitalsList({ limit: 100 });
  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const onError = (e: unknown) => toast.error(e instanceof ApiError ? e.message : 'Failed');

  const submit = () => create.mutate(
    { name: form.name, code: form.code, city: form.city || undefined, email: form.email || undefined, phone: form.phone || undefined },
    { onSuccess: () => { toast.success('Hospital created'); setOpen(false); setForm(EMPTY); }, onError },
  );
  const remove = (h: Hospital) => {
    if (!window.confirm(`Delete ${h.name}?`)) return;
    del.mutate(h.id, { onSuccess: () => toast.success('Deleted'), onError });
  };

  return (
    <div>
      <PageHeader title="Organization"
        actions={<PermissionGate anyOf={[PERMISSIONS.HOSPITAL_CREATE]}><Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New hospital</Button></PermissionGate>} />
      <OrgSubnav />
      <Card>
        {isLoading ? <PageSpinner /> : (data?.data.length ?? 0) === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">No hospitals.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr><th className="px-4 py-3 font-medium">Code</th><th className="px-4 py-3 font-medium">Name</th><th className="px-4 py-3 font-medium">City</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 text-right font-medium">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.data.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{h.code}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{h.name}</td>
                    <td className="px-4 py-3 text-slate-600">{h.city ?? '—'}</td>
                    <td className="px-4 py-3"><Badge tone={h.isActive ? 'success' : 'neutral'}>{h.isActive ? 'Active' : 'Inactive'}</Badge></td>
                    <td className="px-4 py-3 text-right">
                      <PermissionGate anyOf={[PERMISSIONS.HOSPITAL_DELETE]}>
                        <Button variant="ghost" className="px-2 py-1 text-red-500 hover:bg-red-50" onClick={() => remove(h)}><Trash2 className="h-4 w-4" /></Button>
                      </PermissionGate>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Add hospital">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Code" required><Input value={form.code} onChange={set('code')} placeholder="CCH" /></Field>
            <Field label="City"><Input value={form.city} onChange={set('city')} /></Field>
          </div>
          <Field label="Name" required><Input value={form.name} onChange={set('name')} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Email"><Input type="email" value={form.email} onChange={set('email')} /></Field>
            <Field label="Phone"><Input value={form.phone} onChange={set('phone')} /></Field>
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} loading={create.isPending} disabled={!form.code || !form.name}>Add hospital</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
