import { apiClient } from '@/lib/api-client';

export interface Overview {
  patients: number;
  appointments: number;
  labOrders: number;
  medicines: number;
  revenue: { billed: number; collected: number; outstanding: number; pharmacySales: number };
}
export interface Revenue {
  invoices: { count: number; billed: number; collected: number; outstanding: number; discount: number; tax: number };
  pharmacy: { count: number; revenue: number };
}
export interface AppointmentStats {
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
}
export interface DoctorStat {
  doctorId: string;
  doctorName: string;
  appointments: number;
}
export interface InventoryStats {
  medicines: number;
  lowStock: number;
  expiringBatches: number;
  stockValue: number;
}

export const reportsApi = {
  overview: () => apiClient.get<Overview>('/reports/overview').then((r) => r.data),
  revenue: () => apiClient.get<Revenue>('/reports/revenue').then((r) => r.data),
  appointments: () => apiClient.get<AppointmentStats>('/reports/appointments').then((r) => r.data),
  doctors: () => apiClient.get<DoctorStat[]>('/reports/doctors').then((r) => r.data),
  inventory: () => apiClient.get<InventoryStats>('/reports/inventory').then((r) => r.data),
};
