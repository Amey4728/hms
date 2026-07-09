import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { INVOICE_STATUSES, PERMISSIONS } from '@hms/shared';
import { PageHeader } from '@/components/PageHeader';
import { PermissionGate } from '@/components/PermissionGate';
import { Modal } from '@/components/Modal';
import { PatientPicker } from '@/components/PatientPicker';
import { Badge, Button, Card, Field, Input, PageSpinner, Select } from '@/components/ui';
import { toast } from '@/components/toast';
import { ApiError } from '@/lib/api-client';
import { formatDate, titleCase } from '@/lib/format';
import { InvoiceDetailModal } from './InvoiceDetailModal';
import { useCreateInvoice, useInvoices } from './hooks';

const STATUS_TONE: Record<string, 'neutral' | 'info' | 'warning' | 'success' | 'danger'> = {
  ISSUED: 'info',
  PARTIALLY_PAID: 'warning',
  PAID: 'success',
  CANCELLED: 'neutral',
  REFUNDED: 'danger',
};

interface ItemDraft {
  description: string;
  quantity: number;
  unitPrice: number;
}

export function InvoicesPage() {
  const [status, setStatus] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [patientId, setPatientId] = useState('');
  const [items, setItems] = useState<ItemDraft[]>([]);
  const [desc, setDesc] = useState('');
  const [qty, setQty] = useState('1');
  const [price, setPrice] = useState('');
  const [discount, setDiscount] = useState('0');
  const [taxRate, setTaxRate] = useState('0');

  const create = useCreateInvoice();
  const { data, isLoading } = useInvoices({ limit: 20, status: status || undefined });
  const rows = data?.data ?? [];
  const selected = rows.find((r) => r.id === selectedId) ?? null;

  const addItem = () => {
    if (!desc || Number(price) < 0) return;
    setItems((it) => [...it, { description: desc, quantity: Number(qty) || 1, unitPrice: Number(price) }]);
    setDesc('');
    setQty('1');
    setPrice('');
  };

  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const est = Math.max(0, subtotal - Number(discount)) * (1 + Number(taxRate) / 100);

  const reset = () => {
    setPatientId('');
    setItems([]);
    setDesc('');
    setQty('1');
    setPrice('');
    setDiscount('0');
    setTaxRate('0');
  };

  const submit = () =>
    create.mutate(
      { patientId, items, discount: Number(discount), taxRate: Number(taxRate) },
      {
        onSuccess: (inv) => {
          toast.success(`Invoice ${inv.invoiceRef} · total ${inv.total.toFixed(2)}`);
          setCreateOpen(false);
          reset();
        },
        onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Failed'),
      },
    );

  return (
    <div>
      <PageHeader
        title="Billing"
        subtitle="Invoices, payments, and refunds"
        actions={
          <PermissionGate anyOf={[PERMISSIONS.BILLING_GENERATE]}>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" /> New invoice
            </Button>
          </PermissionGate>
        }
      />

      <Card>
        <div className="border-b border-slate-100 dark:border-slate-800 p-4">
          <Select className="max-w-xs" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {INVOICE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {titleCase(s)}
              </option>
            ))}
          </Select>
        </div>
        {isLoading ? (
          <PageSpinner />
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500 dark:text-slate-400">No invoices.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-left text-xs uppercase text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Ref</th>
                  <th className="px-4 py-3 font-medium">Patient</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                  <th className="px-4 py-3 text-right font-medium">Balance</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map((inv) => (
                  <tr key={inv.id} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50" onClick={() => setSelectedId(inv.id)}>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">{inv.invoiceRef}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 dark:text-slate-100">{inv.patientName}</div>
                      <div className="text-xs text-slate-400 dark:text-slate-500">{inv.patientMrn}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{formatDate(inv.createdAt)}</td>
                    <td className="px-4 py-3 text-right font-medium">{inv.total.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-brand-700">{inv.balance.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS_TONE[inv.status]}>{titleCase(inv.status)}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create invoice */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New invoice" width="max-w-2xl">
        <div className="space-y-4">
          <PatientPicker value={patientId} onChange={setPatientId} required />

          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Field label="Description">
                <Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Consultation fee" />
              </Field>
            </div>
            <Field label="Qty">
              <Input type="number" className="w-16" value={qty} onChange={(e) => setQty(e.target.value)} />
            </Field>
            <Field label="Unit price">
              <Input type="number" className="w-24" value={price} onChange={(e) => setPrice(e.target.value)} />
            </Field>
            <Button variant="secondary" onClick={addItem} disabled={!desc || price === ''}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {items.length > 0 && (
            <div className="rounded-lg border border-slate-200 dark:border-slate-800">
              {items.map((i, idx) => (
                <div key={idx} className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-3 py-2 text-sm last:border-0">
                  <span className="text-slate-700 dark:text-slate-300">
                    {i.description} × {i.quantity}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-600 dark:text-slate-300">{(i.unitPrice * i.quantity).toFixed(2)}</span>
                    <button onClick={() => setItems((it) => it.filter((_, x) => x !== idx))} className="text-red-400 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Discount">
              <Input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} />
            </Field>
            <Field label="Tax rate (%)">
              <Input type="number" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />
            </Field>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
            <span className="text-sm text-slate-500 dark:text-slate-400">
              Est. total <span className="font-semibold text-slate-800 dark:text-slate-200">{est.toFixed(2)}</span>
            </span>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={submit} loading={create.isPending} disabled={!patientId || items.length === 0}>
                Generate invoice
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      <InvoiceDetailModal invoice={selected} onClose={() => setSelectedId(null)} />
    </div>
  );
}
