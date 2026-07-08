import type { InvoiceStatus, PaymentMethod, PaymentType, PaginationMeta } from '@hms/shared';
import { apiClient } from '@/lib/api-client';

export interface Invoice {
  id: string;
  invoiceNumber: number;
  invoiceRef: string;
  patientId: string;
  patientName: string;
  patientMrn: string;
  status: InvoiceStatus;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  amountPaid: number;
  balance: number;
  notes: string | null;
  items: Array<{ id: string; description: string; quantity: number; unitPrice: number; lineTotal: number }>;
  payments: Array<{
    id: string;
    amount: number;
    method: PaymentMethod;
    type: PaymentType;
    reference: string | null;
    note: string | null;
    createdAt: string;
  }>;
  version: number;
  createdAt: string;
}

function qs(p: Record<string, string | number | undefined>) {
  const q = new URLSearchParams();
  Object.entries(p).forEach(([k, v]) => v !== undefined && v !== '' && q.set(k, String(v)));
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const billingApi = {
  list(p: { page?: number; limit?: number; status?: string }) {
    return apiClient.get<Invoice[], PaginationMeta>(`/billing/invoices${qs(p)}`);
  },
  get(id: string) {
    return apiClient.get<Invoice>(`/billing/invoices/${id}`).then((r) => r.data);
  },
  create(body: unknown) {
    return apiClient.post<Invoice>('/billing/invoices', body).then((r) => r.data);
  },
  pay(id: string, body: unknown) {
    return apiClient.post<Invoice>(`/billing/invoices/${id}/payments`, body).then((r) => r.data);
  },
  refund(id: string, body: unknown) {
    return apiClient.post<Invoice>(`/billing/invoices/${id}/refunds`, body).then((r) => r.data);
  },
  cancel(id: string, version: number, reason?: string) {
    return apiClient.patch<Invoice>(`/billing/invoices/${id}/cancel`, { version, reason }).then((r) => r.data);
  },
};
