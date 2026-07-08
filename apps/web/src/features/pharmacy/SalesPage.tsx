import { useState } from 'react';
import { Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { PERMISSIONS } from '@hms/shared';
import { PageHeader } from '@/components/PageHeader';
import { PermissionGate } from '@/components/PermissionGate';
import { Modal } from '@/components/Modal';
import { PatientPicker } from '@/components/PatientPicker';
import { Button, Card, Field, Input, PageSpinner, Select } from '@/components/ui';
import { toast } from '@/components/toast';
import { ApiError } from '@/lib/api-client';
import { formatDate } from '@/lib/format';
import { PharmacySubnav } from './PharmacySubnav';
import { useAllMedicines, useCreateSale, useSales } from './hooks';

interface Line {
  medicineId: string;
  name: string;
  price: number;
  quantity: number;
}

export function SalesPage() {
  const [open, setOpen] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [lines, setLines] = useState<Line[]>([]);
  const [pick, setPick] = useState('');
  const [qty, setQty] = useState('1');
  const [discount, setDiscount] = useState('0');
  const [taxRate, setTaxRate] = useState('0');

  const meds = useAllMedicines();
  const create = useCreateSale();
  const { data, isLoading } = useSales({ limit: 20 });

  const addLine = () => {
    const m = meds.data?.find((x) => x.id === pick);
    if (!m || Number(qty) <= 0) return;
    setLines((ls) => [...ls, { medicineId: m.id, name: m.name, price: m.unitPrice, quantity: Number(qty) }]);
    setPick('');
    setQty('1');
  };

  const subtotal = lines.reduce((s, l) => s + l.price * l.quantity, 0);
  const est = Math.max(0, subtotal - Number(discount)) * (1 + Number(taxRate) / 100);

  const reset = () => {
    setPatientId('');
    setLines([]);
    setPick('');
    setQty('1');
    setDiscount('0');
    setTaxRate('0');
  };

  const submit = () =>
    create.mutate(
      {
        patientId: patientId || undefined,
        items: lines.map((l) => ({ medicineId: l.medicineId, quantity: l.quantity })),
        discount: Number(discount),
        taxRate: Number(taxRate),
      },
      {
        onSuccess: (s) => {
          toast.success(`Sale ${s.saleRef} · total ${s.total.toFixed(2)}`);
          setOpen(false);
          reset();
        },
        onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Failed'),
      },
    );

  return (
    <div>
      <PageHeader
        title="Pharmacy"
        actions={
          <PermissionGate anyOf={[PERMISSIONS.PHARMACY_SALE_CREATE]}>
            <Button onClick={() => setOpen(true)}>
              <ShoppingCart className="h-4 w-4" /> New sale
            </Button>
          </PermissionGate>
        }
      />
      <PharmacySubnav />

      <Card>
        {isLoading ? (
          <PageSpinner />
        ) : (data?.data.length ?? 0) === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">No sales yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Ref</th>
                  <th className="px-4 py-3 font-medium">Items</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 text-right font-medium">Subtotal</th>
                  <th className="px-4 py-3 text-right font-medium">Tax</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.data.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{s.saleRef}</td>
                    <td className="px-4 py-3 text-slate-600">{s.items.length}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(s.createdAt)}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{s.subtotal.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{s.tax.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">{s.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="New sale" width="max-w-2xl">
        <div className="space-y-4">
          <PatientPicker value={patientId} onChange={setPatientId} label="Patient (optional)" />

          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Field label="Medicine">
                <Select value={pick} onChange={(e) => setPick(e.target.value)}>
                  <option value="">Select medicine…</option>
                  {meds.data?.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} · {m.unitPrice.toFixed(2)}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="Qty">
              <Input type="number" className="w-20" value={qty} onChange={(e) => setQty(e.target.value)} />
            </Field>
            <Button variant="secondary" onClick={addLine} disabled={!pick}>
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>

          {lines.length > 0 && (
            <div className="rounded-lg border border-slate-200">
              {lines.map((l, idx) => (
                <div key={idx} className="flex items-center justify-between border-b border-slate-100 px-3 py-2 text-sm last:border-0">
                  <span className="text-slate-700">
                    {l.name} × {l.quantity}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-600">{(l.price * l.quantity).toFixed(2)}</span>
                    <button onClick={() => setLines((ls) => ls.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600">
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

          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
            <span className="text-sm text-slate-500">
              Subtotal {subtotal.toFixed(2)} · Est. total <span className="font-semibold text-slate-800">{est.toFixed(2)}</span>
            </span>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={submit} loading={create.isPending} disabled={lines.length === 0}>
                Record sale
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
