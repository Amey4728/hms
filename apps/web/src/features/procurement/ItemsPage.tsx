import { useState } from 'react';
import { Plus, SlidersHorizontal } from 'lucide-react';
import { INVENTORY_CATEGORIES, PERMISSIONS } from '@hms/shared';
import { PageHeader } from '@/components/PageHeader';
import { PermissionGate } from '@/components/PermissionGate';
import { Modal } from '@/components/Modal';
import { Badge, Button, Card, Field, Input, PageSpinner, Select } from '@/components/ui';
import { toast } from '@/components/toast';
import { ApiError } from '@/lib/api-client';
import { titleCase } from '@/lib/format';
import { InventorySubnav } from './InventorySubnav';
import { useAdjust, useCreateItem, useItems, useLowStock } from './hooks';
import type { Item } from './api';

const EMPTY = { code: '', name: '', category: 'CONSUMABLE', unit: '', quantity: '0', reorderLevel: '0', unitCost: '' };

export function ItemsPage() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const create = useCreateItem();
  const adjust = useAdjust();
  const { data, isLoading } = useItems({ limit: 100 });
  const low = useLowStock();
  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const onError = (e: unknown) => toast.error(e instanceof ApiError ? e.message : 'Failed');

  const submit = () => create.mutate(
    { ...form, quantity: Number(form.quantity), reorderLevel: Number(form.reorderLevel), unitCost: form.unitCost ? Number(form.unitCost) : undefined, unit: form.unit || undefined },
    { onSuccess: () => { toast.success('Item added'); setOpen(false); setForm(EMPTY); }, onError },
  );

  const doAdjust = (it: Item) => {
    const raw = window.prompt(`Adjust stock for ${it.name} (current ${it.quantity}). Enter signed delta (e.g. 10 or -3):`);
    if (!raw) return;
    adjust.mutate({ id: it.id, delta: Number(raw), note: 'manual' }, { onSuccess: () => toast.success('Stock adjusted'), onError });
  };

  return (
    <div>
      <PageHeader title="Inventory"
        actions={<PermissionGate anyOf={[PERMISSIONS.INVENTORY_MANAGE]}><Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New item</Button></PermissionGate>} />
      <InventorySubnav />

      {(low.data?.length ?? 0) > 0 && (
        <Card className="mb-4 border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {low.data!.length} item(s) at or below reorder level: {low.data!.map((i) => i.name).join(', ')}
        </Card>
      )}

      <Card>
        {isLoading ? <PageSpinner /> : (data?.data.length ?? 0) === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500 dark:text-slate-400">No items.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-left text-xs uppercase text-slate-500 dark:text-slate-400">
                <tr><th className="px-4 py-3 font-medium">Code</th><th className="px-4 py-3 font-medium">Name</th><th className="px-4 py-3 font-medium">Category</th><th className="px-4 py-3 text-right font-medium">On hand</th><th className="px-4 py-3 text-right font-medium">Reorder</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 text-right font-medium">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data?.data.map((it) => (
                  <tr key={it.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">{it.code}</td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{it.name}</td>
                    <td className="px-4 py-3"><Badge tone="neutral">{titleCase(it.category)}</Badge></td>
                    <td className="px-4 py-3 text-right font-medium">{it.quantity}{it.unit ? ` ${it.unit}` : ''}</td>
                    <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">{it.reorderLevel}</td>
                    <td className="px-4 py-3"><Badge tone={it.isLow ? 'danger' : 'success'}>{it.isLow ? 'Low' : 'OK'}</Badge></td>
                    <td className="px-4 py-3 text-right">
                      <PermissionGate anyOf={[PERMISSIONS.INVENTORY_MANAGE]}>
                        <Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => doAdjust(it)}><SlidersHorizontal className="h-4 w-4" /> Adjust</Button>
                      </PermissionGate>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Add inventory item">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Code" required><Input value={form.code} onChange={set('code')} placeholder="GLOVE" /></Field>
            <Field label="Category"><Select value={form.category} onChange={set('category')}>{INVENTORY_CATEGORIES.map((c) => <option key={c} value={c}>{titleCase(c)}</option>)}</Select></Field>
          </div>
          <Field label="Name" required><Input value={form.name} onChange={set('name')} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Unit"><Input value={form.unit} onChange={set('unit')} placeholder="box" /></Field>
            <Field label="Unit cost"><Input type="number" value={form.unitCost} onChange={set('unitCost')} /></Field>
            <Field label="Opening quantity"><Input type="number" value={form.quantity} onChange={set('quantity')} /></Field>
            <Field label="Reorder level"><Input type="number" value={form.reorderLevel} onChange={set('reorderLevel')} /></Field>
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} loading={create.isPending} disabled={!form.code || !form.name}>Add item</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
