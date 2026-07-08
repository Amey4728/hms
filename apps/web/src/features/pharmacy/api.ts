import type { MedicineForm, PaginationMeta } from '@hms/shared';
import { apiClient } from '@/lib/api-client';

export interface Medicine {
  id: string;
  code: string;
  name: string;
  genericName: string | null;
  form: MedicineForm;
  strength: string | null;
  manufacturer: string | null;
  unitPrice: number;
  reorderLevel: number;
  isActive: boolean;
  version: number;
}

export interface StockRow {
  medicineId: string;
  code: string;
  name: string;
  form: MedicineForm;
  reorderLevel: number;
  stock: number;
  isLow: boolean;
  batches: number;
}

export interface LowStockRow {
  medicineId: string;
  code: string;
  name: string;
  reorderLevel: number;
  stock: number;
}

export interface ExpiringRow {
  batchId: string;
  medicineCode: string;
  medicineName: string;
  batchNumber: string;
  quantity: number;
  expiryDate: string;
}

export interface Sale {
  id: string;
  saleNumber: number;
  saleRef: string;
  patientId: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  items: Array<{
    id: string;
    medicineName: string;
    batchNumber: string | null;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  createdAt: string;
}

function qs(p: Record<string, string | number | undefined>) {
  const q = new URLSearchParams();
  Object.entries(p).forEach(([k, v]) => v !== undefined && v !== '' && q.set(k, String(v)));
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const pharmacyApi = {
  listMedicines(p: { page?: number; limit?: number; search?: string }) {
    return apiClient.get<Medicine[], PaginationMeta>(`/pharmacy/medicines${qs(p)}`);
  },
  allMedicines() {
    return apiClient.get<Medicine[]>('/pharmacy/medicines?limit=200').then((r) => r.data);
  },
  createMedicine(body: unknown) {
    return apiClient.post<Medicine>('/pharmacy/medicines', body).then((r) => r.data);
  },
  receiveBatch(medicineId: string, body: unknown) {
    return apiClient.post(`/pharmacy/inventory/medicines/${medicineId}/batches`, body).then((r) => r.data);
  },
  stock(p: { page?: number; limit?: number; search?: string }) {
    return apiClient.get<StockRow[], PaginationMeta>(`/pharmacy/inventory/stock${qs(p)}`);
  },
  lowStock() {
    return apiClient.get<LowStockRow[]>('/pharmacy/inventory/alerts/low-stock').then((r) => r.data);
  },
  expiring(days: number) {
    return apiClient.get<ExpiringRow[]>(`/pharmacy/inventory/alerts/expiring?days=${days}`).then((r) => r.data);
  },
  listSales(p: { page?: number; limit?: number }) {
    return apiClient.get<Sale[], PaginationMeta>(`/pharmacy/sales${qs(p)}`);
  },
  createSale(body: unknown) {
    return apiClient.post<Sale>('/pharmacy/sales', body).then((r) => r.data);
  },
};
