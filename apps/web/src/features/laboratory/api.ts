import type { LabOrderStatus, LabResultFlag, PaginationMeta, SpecimenType } from '@hms/shared';
import { apiClient } from '@/lib/api-client';

export interface LabTest {
  id: string;
  code: string;
  name: string;
  category: string | null;
  specimenType: SpecimenType;
  unit: string | null;
  referenceRange: string | null;
  price: number;
  isActive: boolean;
  version: number;
}

export interface LabOrderItem {
  id: string;
  testId: string;
  testCode: string;
  testName: string;
  unit: string | null;
  referenceRange: string | null;
  resultValue: string | null;
  flag: LabResultFlag | null;
  resultNotes: string | null;
  resultedAt: string | null;
  version: number;
}

export interface LabOrder {
  id: string;
  orderNumber: number;
  orderRef: string;
  patientId: string;
  patientName: string;
  patientMrn: string;
  hospitalId: string;
  status: LabOrderStatus;
  notes: string | null;
  items: LabOrderItem[];
  resultedCount: number;
  totalCount: number;
  version: number;
  createdAt: string;
}

function qs(p: Record<string, string | number | undefined>) {
  const q = new URLSearchParams();
  Object.entries(p).forEach(([k, v]) => v !== undefined && v !== '' && q.set(k, String(v)));
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const labApi = {
  listTests(p: { page?: number; limit?: number; search?: string }) {
    return apiClient.get<LabTest[], PaginationMeta>(`/lab/tests${qs(p)}`);
  },
  allTests() {
    return apiClient.get<LabTest[]>('/lab/tests?limit=200').then((r) => r.data);
  },
  createTest(body: unknown) {
    return apiClient.post<LabTest>('/lab/tests', body).then((r) => r.data);
  },
  listOrders(p: { page?: number; limit?: number; status?: string }) {
    return apiClient.get<LabOrder[], PaginationMeta>(`/lab/orders${qs(p)}`);
  },
  getOrder(id: string) {
    return apiClient.get<LabOrder>(`/lab/orders/${id}`).then((r) => r.data);
  },
  createOrder(body: { patientId: string; hospitalId: string; testIds: string[]; notes?: string }) {
    return apiClient.post<LabOrder>('/lab/orders', body).then((r) => r.data);
  },
  transition(id: string, action: 'collect-sample' | 'start' | 'complete', version: number) {
    return apiClient.patch<LabOrder>(`/lab/orders/${id}/${action}`, { version }).then((r) => r.data);
  },
  cancel(id: string, version: number, reason?: string) {
    return apiClient.patch<LabOrder>(`/lab/orders/${id}/cancel`, { version, reason }).then((r) => r.data);
  },
  enterResult(orderId: string, itemId: string, body: unknown) {
    return apiClient.patch<LabOrder>(`/lab/orders/${orderId}/items/${itemId}/result`, body).then((r) => r.data);
  },
};
