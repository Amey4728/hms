import { useState } from 'react';
import { Plus } from 'lucide-react';
import { RADIOLOGY_MODALITIES, PERMISSIONS } from '@hms/shared';
import { PageHeader } from '@/components/PageHeader';
import { PermissionGate } from '@/components/PermissionGate';
import { Modal } from '@/components/Modal';
import { Badge, Button, Card, Field, Input, PageSpinner, Select } from '@/components/ui';
import { toast } from '@/components/toast';
import { ApiError } from '@/lib/api-client';
import { titleCase } from '@/lib/format';
import { RadiologySubnav } from './RadiologySubnav';
import { useCreateExam, useExams } from './hooks';

const EMPTY = { code: '', name: '', modality: 'XRAY', bodyPart: '', price: '0' };

export function RadiologyCataloguePage() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const create = useCreateExam();
  const { data, isLoading } = useExams({ limit: 100 });
  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = () =>
    create.mutate(
      { ...form, price: Number(form.price), bodyPart: form.bodyPart || undefined },
      {
        onSuccess: () => { toast.success('Exam added'); setOpen(false); setForm(EMPTY); },
        onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Failed'),
      },
    );

  return (
    <div>
      <PageHeader
        title="Radiology"
        actions={
          <PermissionGate anyOf={[PERMISSIONS.RADIOLOGY_MANAGE]}>
            <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New exam</Button>
          </PermissionGate>
        }
      />
      <RadiologySubnav />
      <Card>
        {isLoading ? <PageSpinner /> : (data?.data.length ?? 0) === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">No exams in the catalogue.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr><th className="px-4 py-3 font-medium">Code</th><th className="px-4 py-3 font-medium">Name</th><th className="px-4 py-3 font-medium">Modality</th><th className="px-4 py-3 font-medium">Body part</th><th className="px-4 py-3 text-right font-medium">Price</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.data.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{e.code}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{e.name}</td>
                    <td className="px-4 py-3"><Badge tone="neutral">{titleCase(e.modality)}</Badge></td>
                    <td className="px-4 py-3 text-slate-600">{e.bodyPart ?? '—'}</td>
                    <td className="px-4 py-3 text-right font-medium">{e.price.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Add imaging exam">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Code" required><Input value={form.code} onChange={set('code')} placeholder="CXR" /></Field>
            <Field label="Price" required><Input type="number" value={form.price} onChange={set('price')} /></Field>
          </div>
          <Field label="Name" required><Input value={form.name} onChange={set('name')} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Modality">
              <Select value={form.modality} onChange={set('modality')}>
                {RADIOLOGY_MODALITIES.map((m) => <option key={m} value={m}>{titleCase(m)}</option>)}
              </Select>
            </Field>
            <Field label="Body part"><Input value={form.bodyPart} onChange={set('bodyPart')} placeholder="Chest" /></Field>
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} loading={create.isPending} disabled={!form.code || !form.name}>Add exam</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
