import type { InventoryCategory, PaginationMeta, PurchaseStatus } from '@hms/shared';
import { apiClient } from '@/lib/api-client';

export interface Item {
  id: string;
  code: string;
  name: string;
  category: InventoryCategory;
  unit: string | null;
  quantity: number;
  reorderLevel: number;
  unitCost: number | null;
  isLow: boolean;
  version: number;
}
export interface Vendor {
  id: string;
  code: string;
  name: string;
  contactEmail: string | null;
  contactPhone: string | null;
  version: number;
}
export interface PurchaseRequest {
  id: string;
  requestNumber: number;
  requestRef: string;
  vendorId: string | null;
  vendorName: string | null;
  status: PurchaseStatus;
  items: Array<{ id: string; itemName: string; quantity: number; unitCost: number | null }>;
  version: number;
}

function qs(p: Record<string, string | number | undefined>) {
  const q = new URLSearchParams();
  Object.entries(p).forEach(([k, v]) => v !== undefined && v !== '' && q.set(k, String(v)));
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const procurementApi = {
  listItems(p: { page?: number; limit?: number; search?: string }) {
    return apiClient.get<Item[], PaginationMeta>(`/inventory/items${qs(p)}`);
  },
  allItems() {
    return apiClient.get<Item[]>('/inventory/items?limit=200').then((r) => r.data);
  },
  createItem(body: unknown) {
    return apiClient.post<Item>('/inventory/items', body).then((r) => r.data);
  },
  adjust(id: string, delta: number, note?: string) {
    return apiClient.patch<Item>(`/inventory/items/${id}/adjust`, { delta, note }).then((r) => r.data);
  },
  lowStock() {
    return apiClient.get<Item[]>('/inventory/items/alerts/low-stock').then((r) => r.data);
  },
  listVendors(p: { page?: number; limit?: number }) {
    return apiClient.get<Vendor[], PaginationMeta>(`/inventory/vendors${qs(p)}`);
  },
  allVendors() {
    return apiClient.get<Vendor[]>('/inventory/vendors?limit=200').then((r) => r.data);
  },
  createVendor(body: unknown) {
    return apiClient.post<Vendor>('/inventory/vendors', body).then((r) => r.data);
  },
  listPurchases(p: { page?: number; limit?: number; status?: string }) {
    return apiClient.get<PurchaseRequest[], PaginationMeta>(`/inventory/purchase-requests${qs(p)}`);
  },
  createPurchase(body: unknown) {
    return apiClient.post<PurchaseRequest>('/inventory/purchase-requests', body).then((r) => r.data);
  },
  purchaseAction(id: string, action: 'submit' | 'approve' | 'reject' | 'receive', version: number) {
    return apiClient.patch<PurchaseRequest>(`/inventory/purchase-requests/${id}/${action}`, { version }).then((r) => r.data);
  },
};
