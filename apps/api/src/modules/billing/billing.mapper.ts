import { formatInvoiceNumber } from '@hms/shared';
import type { InvoiceWithDetails } from './invoices.repository';

export function toInvoiceView(inv: InvoiceWithDetails) {
  const total = inv.total.toNumber();
  const amountPaid = inv.amountPaid.toNumber();
  return {
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    invoiceRef: formatInvoiceNumber(inv.invoiceNumber),
    patientId: inv.patientId,
    hospitalId: inv.hospitalId,
    status: inv.status,
    subtotal: inv.subtotal.toNumber(),
    discount: inv.discount.toNumber(),
    tax: inv.tax.toNumber(),
    total,
    amountPaid,
    balance: Number((total - amountPaid).toFixed(2)),
    notes: inv.notes,
    cancellationReason: inv.cancellationReason,
    items: inv.items.map((i) => ({
      id: i.id,
      description: i.description,
      quantity: i.quantity,
      unitPrice: i.unitPrice.toNumber(),
      lineTotal: i.lineTotal.toNumber(),
    })),
    payments: inv.payments.map((p) => ({
      id: p.id,
      amount: p.amount.toNumber(),
      method: p.method,
      type: p.type,
      reference: p.reference,
      note: p.note,
      createdAt: p.createdAt,
    })),
    version: inv.version,
    createdAt: inv.createdAt,
  };
}
