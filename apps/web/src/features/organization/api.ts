import type { DepartmentType, PaginationMeta } from '@hms/shared';
import { apiClient } from '@/lib/api-client';

export interface Hospital {
  id: string;
  name: string;
  code: string;
  city: string | null;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  version: number;
}
export interface Branch {
  id: string;
  hospitalId: string;
  name: string;
  code: string;
  city: string | null;
  isActive: boolean;
  version: number;
}
export interface Department {
  id: string;
  hospitalId: string;
  branchId: string | null;
  name: string;
  code: string;
  type: DepartmentType;
  isActive: boolean;
  version: number;
}

function qs(p: Record<string, string | number | undefined>) {
  const q = new URLSearchParams();
  Object.entries(p).forEach(([k, v]) => v !== undefined && v !== '' && q.set(k, String(v)));
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const orgApi = {
  listHospitals(p: { page?: number; limit?: number; search?: string }) {
    return apiClient.get<Hospital[], PaginationMeta>(`/hospitals${qs(p)}`);
  },
  createHospital(body: unknown) {
    return apiClient.post<Hospital>('/hospitals', body).then((r) => r.data);
  },
  deleteHospital(id: string) {
    return apiClient.del<{ id: string }>(`/hospitals/${id}`).then((r) => r.data);
  },
  listBranches(p: { hospitalId?: string; page?: number; limit?: number }) {
    return apiClient.get<Branch[], PaginationMeta>(`/branches${qs(p)}`);
  },
  createBranch(body: unknown) {
    return apiClient.post<Branch>('/branches', body).then((r) => r.data);
  },
  listDepartments(p: { hospitalId?: string; branchId?: string; page?: number; limit?: number }) {
    return apiClient.get<Department[], PaginationMeta>(`/departments${qs(p)}`);
  },
  createDepartment(body: unknown) {
    return apiClient.post<Department>('/departments', body).then((r) => r.data);
  },
};
