import { useState } from 'react';
import { Plus } from 'lucide-react';
import { SPECIMEN_TYPES, PERMISSIONS } from '@hms/shared';
import { PageHeader } from '@/components/PageHeader';
import { PermissionGate } from '@/components/PermissionGate';
import { Modal } from '@/components/Modal';
import { Badge, Button, Card, Field, Input, PageSpinner, Select } from '@/components/ui';
import { toast } from '@/components/toast';
import { ApiError } from '@/lib/api-client';
import { titleCase } from '@/lib/format';
import { LabSubnav } from './LabSubnav';
import { useCreateLabTest, useLabTests } from './hooks';

const EMPTY = { code: '', name: '', category: '', specimenType: 'BLOOD', unit: '', referenceRange: '', price: '0' };

export function LabCataloguePage() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const create = useCreateLabTest();
  const { data, isLoading } = useLabTests({ limit: 100 });

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = () =>
    create.mutate(
      { ...form, price: Number(form.price), category: form.category || undefined, unit: form.unit || undefined, referenceRange: form.referenceRange || undefined },
      {
        onSuccess: () => {
          toast.success('Test added');
          setOpen(false);
          setForm(EMPTY);
        },
        onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Failed'),
      },
    );

  return (
    <div>
      <PageHeader
        title="Laboratory"
        actions={
          <PermissionGate anyOf={[PERMISSIONS.LAB_TEST_MANAGE]}>
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> New test
            </Button>
          </PermissionGate>
        }
      />
      <LabSubnav />

      <Card>
        {isLoading ? (
          <PageSpinner />
        ) : (data?.data.length ?? 0) === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500 dark:text-slate-400">No tests in the catalogue.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-left text-xs uppercase text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Specimen</th>
                  <th className="px-4 py-3 font-medium">Reference</th>
                  <th className="px-4 py-3 text-right font-medium">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data?.data.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">{t.code}</td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{t.name}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{t.category ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Badge tone="neutral">{titleCase(t.specimenType)}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {t.referenceRange ?? '—'} {t.unit ? `(${t.unit})` : ''}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-slate-100">{t.price.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Add lab test">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Code" required>
              <Input value={form.code} onChange={set('code')} placeholder="CBC" />
            </Field>
            <Field label="Price" required>
              <Input type="number" value={form.price} onChange={set('price')} />
            </Field>
          </div>
          <Field label="Name" required>
            <Input value={form.name} onChange={set('name')} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Category">
              <Input value={form.category} onChange={set('category')} />
            </Field>
            <Field label="Specimen type">
              <Select value={form.specimenType} onChange={set('specimenType')}>
                {SPECIMEN_TYPES.map((s) => (
                  <option key={s} value={s}>
                    {titleCase(s)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Unit">
              <Input value={form.unit} onChange={set('unit')} placeholder="mg/dL" />
            </Field>
            <Field label="Reference range">
              <Input value={form.referenceRange} onChange={set('referenceRange')} placeholder="70-100" />
            </Field>
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} loading={create.isPending} disabled={!form.code || !form.name}>
              Add test
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
