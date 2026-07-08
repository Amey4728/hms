import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { PURCHASE_STATUSES, PERMISSIONS } from '@hms/shared';
import { PageHeader } from '@/components/PageHeader';
import { PermissionGate } from '@/components/PermissionGate';
import { Modal } from '@/components/Modal';
import { Badge, Button, Card, Field, Input, PageSpinner, Select } from '@/components/ui';
import { toast } from '@/components/toast';
import { ApiError } from '@/lib/api-client';
import { titleCase } from '@/lib/format';
import { InventorySubnav } from './InventorySubnav';
import { useAllItems, useAllVendors, useCreatePurchase, usePurchaseAction, usePurchases } from './hooks';
import type { PurchaseRequest } from './api';

const TONE: Record<string, 'neutral' | 'info' | 'warning' | 'success' | 'danger'> = {
  DRAFT: 'neutral', SUBMITTED: 'info', APPROVED: 'warning', REJECTED: 'danger', RECEIVED: 'success',
};

interface Line { itemId: string; name: string; quantity: number }

export function PurchaseRequestsPage() {
  const [status, setStatus] = useState('');
  const [open, setOpen] = useState(false);
  const vendors = useAllVendors();
  const items = useAllItems();
  const create = useCreatePurchase();
  const action = usePurchaseAction();
  const { data, isLoading } = usePurchases({ limit: 20, status: status || undefined });
  const rows = data?.data ?? [];

  const [vendorId, setVendorId] = useState('');
  const [lines, setLines] = useState<Line[]>([]);
  const [pick, setPick] = useState('');
  const [qty, setQty] = useState('1');

  useEffect(() => { if (open) { setVendorId(''); setLines([]); setPick(''); setQty('1'); } }, [open]);
  const onError = (e: unknown) => toast.error(e instanceof ApiError ? e.message : 'Action failed');

  const addLine = () => {
    const it = items.data?.find((x) => x.id === pick);
    if (!it || Number(qty) <= 0) return;
    setLines((ls) => [...ls, { itemId: it.id, name: it.name, quantity: Number(qty) }]);
    setPick(''); setQty('1');
  };

  const submit = () => create.mutate(
    { vendorId: vendorId || undefined, items: lines.map((l) => ({ itemId: l.itemId, quantity: l.quantity })) },
    { onSuccess: (pr) => { toast.success(`${pr.requestRef} created`); setOpen(false); }, onError },
  );

  const act = (pr: PurchaseRequest, a: 'submit' | 'approve' | 'reject' | 'receive') =>
    action.mutate({ id: pr.id, action: a, version: pr.version }, { onSuccess: () => toast.success(titleCase(a)), onError });

  return (
    <div>
      <PageHeader title="Inventory"
        actions={<PermissionGate anyOf={[PERMISSIONS.INVENTORY_MANAGE]}><Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New request</Button></PermissionGate>} />
      <InventorySubnav />
      <Card>
        <div className="border-b border-slate-100 p-4">
          <Select className="max-w-xs" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {PURCHASE_STATUSES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
          </Select>
        </div>
        {isLoading ? <PageSpinner /> : rows.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">No purchase requests.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr><th className="px-4 py-3 font-medium">Ref</th><th className="px-4 py-3 font-medium">Vendor</th><th className="px-4 py-3 font-medium">Items</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 text-right font-medium">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((pr) => (
                  <tr key={pr.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{pr.requestRef}</td>
                    <td className="px-4 py-3 text-slate-600">{pr.vendorName ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{pr.items.length} · {pr.items.reduce((s, i) => s + i.quantity, 0)} units</td>
                    <td className="px-4 py-3"><Badge tone={TONE[pr.status]}>{titleCase(pr.status)}</Badge></td>
                    <td className="px-4 py-3">
                      <PermissionGate anyOf={[PERMISSIONS.INVENTORY_MANAGE]}>
                        <div className="flex flex-wrap items-center justify-end gap-1">
                          {pr.status === 'DRAFT' && <Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => act(pr, 'submit')}>Submit</Button>}
                          {pr.status === 'SUBMITTED' && <><Button className="px-2 py-1 text-xs" onClick={() => act(pr, 'approve')}>Approve</Button><Button variant="ghost" className="px-2 py-1 text-xs text-red-500" onClick={() => act(pr, 'reject')}>Reject</Button></>}
                          {pr.status === 'APPROVED' && <Button className="px-2 py-1 text-xs" onClick={() => act(pr, 'receive')}>Receive</Button>}
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

      <Modal open={open} onClose={() => setOpen(false)} title="New purchase request" width="max-w-xl">
        <div className="space-y-4">
          <Field label="Vendor">
            <Select value={vendorId} onChange={(e) => setVendorId(e.target.value)}>
              <option value="">— none —</option>
              {vendors.data?.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </Select>
          </Field>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Field label="Item">
                <Select value={pick} onChange={(e) => setPick(e.target.value)}>
                  <option value="">Select item…</option>
                  {items.data?.map((i) => <option key={i.id} value={i.id}>{i.name} (on hand {i.quantity})</option>)}
                </Select>
              </Field>
            </div>
            <Field label="Qty"><Input type="number" className="w-20" value={qty} onChange={(e) => setQty(e.target.value)} /></Field>
            <Button variant="secondary" onClick={addLine} disabled={!pick}><Plus className="h-4 w-4" /></Button>
          </div>
          {lines.length > 0 && (
            <div className="rounded-lg border border-slate-200">
              {lines.map((l, idx) => (
                <div key={idx} className="flex items-center justify-between border-b border-slate-100 px-3 py-2 text-sm last:border-0">
                  <span className="text-slate-700">{l.name} × {l.quantity}</span>
                  <button onClick={() => setLines((ls) => ls.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} loading={create.isPending} disabled={lines.length === 0}>Create request</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
