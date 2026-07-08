import { z } from 'zod';

export const INVOICE_STATUSES = ['ISSUED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED', 'REFUNDED'] as const;
export const PAYMENT_METHODS = ['CASH', 'CARD', 'UPI', 'INSURANCE', 'BANK_TRANSFER'] as const;
export const PAYMENT_TYPES = ['PAYMENT', 'REFUND'] as const;

export const invoiceStatusSchema = z.enum(INVOICE_STATUSES);
export const paymentMethodSchema = z.enum(PAYMENT_METHODS);
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type PaymentType = (typeof PAYMENT_TYPES)[number];

const versioned = { version: z.coerce.number().int().nonnegative() };

// ── Invoice ────────────────────────────────────────────────────────────────
export const createInvoiceSchema = z.object({
  patientId: z.string().uuid(),
  hospitalId: z.string().uuid().optional(),
  notes: z.string().trim().max(500).optional(),
  items: z
    .array(
      z.object({
        description: z.string().trim().min(1).max(200),
        quantity: z.coerce.number().int().positive().default(1),
        unitPrice: z.coerce.number().nonnegative(),
      }),
    )
    .min(1, 'At least one line item is required'),
  discount: z.coerce.number().nonnegative().default(0),
  taxRate: z.coerce.number().min(0).max(100).default(0),
});
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;

// ── Payments / refunds ───────────────────────────────────────────────────────
export const recordPaymentSchema = z.object({
  amount: z.coerce.number().positive(),
  method: paymentMethodSchema.default('CASH'),
  reference: z.string().trim().max(80).optional(),
  note: z.string().trim().max(300).optional(),
});
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;

export const refundSchema = z.object({
  amount: z.coerce.number().positive(),
  method: paymentMethodSchema.default('CASH'),
  reason: z.string().trim().max(300).optional(),
});
export type RefundInput = z.infer<typeof refundSchema>;

export const cancelInvoiceSchema = z.object({
  ...versioned,
  reason: z.string().trim().max(300).optional(),
});
export type CancelInvoiceInput = z.infer<typeof cancelInvoiceSchema>;

export function formatInvoiceNumber(n: number): string {
  return `INV-${String(n).padStart(6, '0')}`;
}
