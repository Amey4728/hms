import { useState } from 'react';
import { Plus } from 'lucide-react';
import { PERMISSIONS } from '@hms/shared';
import { PageHeader } from '@/components/PageHeader';
import { PermissionGate } from '@/components/PermissionGate';
import { Modal } from '@/components/Modal';
import { Button, Card, Field, Input, PageSpinner } from '@/components/ui';
import { toast } from '@/components/toast';
import { ApiError } from '@/lib/api-client';
import { InsuranceSubnav } from './InsuranceSubnav';
import { useCreateProvider, useProviders } from './hooks';

const EMPTY = { code: '', name: '', contactEmail: '', contactPhone: '' };

export function ProvidersPage() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const create = useCreateProvider();
  const { data, isLoading } = useProviders({ limit: 100 });
  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = () => create.mutate(
    { code: form.code, name: form.name, contactEmail: form.contactEmail || undefined, contactPhone: form.contactPhone || undefined },
    { onSuccess: () => { toast.success('Provider added'); setOpen(false); setForm(EMPTY); }, onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Failed') },
  );

  return (
    <div>
      <PageHeader title="Insurance"
        actions={<PermissionGate anyOf={[PERMISSIONS.INSURANCE_CLAIM_APPROVE]}><Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New provider</Button></PermissionGate>} />
      <InsuranceSubnav />
      <Card>
        {isLoading ? <PageSpinner /> : (data?.data.length ?? 0) === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500 dark:text-slate-400">No providers.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-left text-xs uppercase text-slate-500 dark:text-slate-400">
                <tr><th className="px-4 py-3 font-medium">Code</th><th className="px-4 py-3 font-medium">Name</th><th className="px-4 py-3 font-medium">Email</th><th className="px-4 py-3 font-medium">Phone</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data?.data.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">{p.code}</td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{p.name}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{p.contactEmail ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{p.contactPhone ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Add insurance provider">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Code" required><Input value={form.code} onChange={set('code')} placeholder="ACME" /></Field>
            <Field label="Phone"><Input value={form.contactPhone} onChange={set('contactPhone')} /></Field>
          </div>
          <Field label="Name" required><Input value={form.name} onChange={set('name')} /></Field>
          <Field label="Email"><Input type="email" value={form.contactEmail} onChange={set('contactEmail')} /></Field>
          <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} loading={create.isPending} disabled={!form.code || !form.name}>Add provider</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
