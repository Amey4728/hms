import { useState } from 'react';
import { PAYMENT_METHODS, PERMISSIONS } from '@hms/shared';
import { Modal } from '@/components/Modal';
import { PermissionGate } from '@/components/PermissionGate';
import { Badge, Button, Input, Select } from '@/components/ui';
import { toast } from '@/components/toast';
import { ApiError } from '@/lib/api-client';
import { titleCase } from '@/lib/format';
import { useCancelInvoice, usePayInvoice, useRefundInvoice } from './hooks';
import type { Invoice } from './api';

const STATUS_TONE: Record<string, 'neutral' | 'info' | 'warning' | 'success' | 'danger'> = {
  ISSUED: 'info',
  PARTIALLY_PAID: 'warning',
  PAID: 'success',
  CANCELLED: 'neutral',
  REFUNDED: 'danger',
};

export function InvoiceDetailModal({ invoice, onClose }: { invoice: Invoice | null; onClose: () => void }) {
  const pay = usePayInvoice();
  const refund = useRefundInvoice();
  const cancel = useCancelInvoice();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('CASH');
  const [mode, setMode] = useState<'pay' | 'refund'>('pay');

  if (!invoice) return null;
  const onError = (e: unknown) => toast.error(e instanceof ApiError ? e.message : 'Failed');
  const done = () => {
    setAmount('');
    toast.success('Done');
  };

  const submit = () => {
    const body = { amount: Number(amount), method };
    if (mode === 'pay') pay.mutate({ id: invoice.id, body }, { onSuccess: done, onError });
    else refund.mutate({ id: invoice.id, body }, { onSuccess: done, onError });
  };

  const doCancel = () => {
    const reason = window.prompt('Cancellation reason (optional):') ?? undefined;
    cancel.mutate({ id: invoice.id, version: invoice.version, reason }, { onSuccess: () => toast.success('Invoice cancelled'), onError });
  };

  const closed = invoice.status === 'CANCELLED';

  return (
    <Modal open={!!invoice} onClose={onClose} title={`Invoice ${invoice.invoiceRef}`} width="max-w-2xl">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-slate-900">{invoice.patientName}</p>
            <p className="text-xs text-slate-400">{invoice.patientMrn}</p>
          </div>
          <Badge tone={STATUS_TONE[invoice.status]}>{titleCase(invoice.status)}</Badge>
        </div>

        <div className="rounded-lg border border-slate-200">
          {invoice.items.map((i) => (
            <div key={i.id} className="flex justify-between border-b border-slate-100 px-3 py-2 text-sm last:border-0">
              <span className="text-slate-700">
                {i.description} <span className="text-slate-400">× {i.quantity}</span>
              </span>
              <span className="text-slate-600">{i.lineTotal.toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
          <span className="text-slate-500">Subtotal</span><span className="text-right">{invoice.subtotal.toFixed(2)}</span>
          <span className="text-slate-500">Discount</span><span className="text-right">−{invoice.discount.toFixed(2)}</span>
          <span className="text-slate-500">Tax</span><span className="text-right">{invoice.tax.toFixed(2)}</span>
          <span className="font-semibold text-slate-800">Total</span><span className="text-right font-semibold">{invoice.total.toFixed(2)}</span>
          <span className="text-slate-500">Paid</span><span className="text-right text-emerald-600">{invoice.amountPaid.toFixed(2)}</span>
          <span className="font-semibold text-slate-800">Balance</span><span className="text-right font-semibold text-brand-700">{invoice.balance.toFixed(2)}</span>
        </div>

        {invoice.payments.length > 0 && (
          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-slate-400">Payments</p>
            <div className="space-y-1">
              {invoice.payments.map((p) => (
                <div key={p.id} className="flex justify-between text-sm">
                  <span className="text-slate-600">
                    <Badge tone={p.type === 'REFUND' ? 'danger' : 'neutral'}>{titleCase(p.type)}</Badge> {titleCase(p.method)}
                  </span>
                  <span className={p.type === 'REFUND' ? 'text-red-600' : 'text-slate-700'}>
                    {p.type === 'REFUND' ? '−' : ''}{p.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!closed && (
          <div className="border-t border-slate-100 pt-4">
            <div className="mb-2 flex gap-2">
              <PermissionGate anyOf={[PERMISSIONS.BILLING_GENERATE]}>
                <button
                  onClick={() => setMode('pay')}
                  className={`rounded-lg px-3 py-1 text-sm ${mode === 'pay' ? 'bg-brand-600 text-white' : 'bg-slate-100'}`}
                >
                  Payment
                </button>
              </PermissionGate>
              <PermissionGate anyOf={[PERMISSIONS.BILLING_REFUND]}>
                <button
                  onClick={() => setMode('refund')}
                  className={`rounded-lg px-3 py-1 text-sm ${mode === 'refund' ? 'bg-red-600 text-white' : 'bg-slate-100'}`}
                >
                  Refund
                </button>
              </PermissionGate>
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <Select className="max-w-[10rem]" value={method} onChange={(e) => setMethod(e.target.value)}>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {titleCase(m)}
                  </option>
                ))}
              </Select>
              <Button onClick={submit} loading={pay.isPending || refund.isPending} disabled={!amount}>
                {mode === 'pay' ? 'Record payment' : 'Refund'}
              </Button>
            </div>

            {invoice.amountPaid === 0 && (
              <PermissionGate anyOf={[PERMISSIONS.BILLING_GENERATE]}>
                <div className="mt-3 text-right">
                  <Button variant="ghost" className="text-red-500" onClick={doCancel} loading={cancel.isPending}>
                    Cancel invoice
                  </Button>
                </div>
              </PermissionGate>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
