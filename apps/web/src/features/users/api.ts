import type { PaginationMeta } from '@hms/shared';
import { apiClient } from '@/lib/api-client';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  status: string;
  roles: string[];
  version: number;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface RoleOption {
  id: string;
  name: string;
  displayName: string;
}

export interface CreateUserPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roleIds: string[];
}

export const usersApi = {
  list(params: { page?: number; limit?: number; search?: string }) {
    const q = new URLSearchParams();
    if (params.page) q.set('page', String(params.page));
    if (params.limit) q.set('limit', String(params.limit));
    if (params.search) q.set('search', params.search);
    const s = q.toString();
    return apiClient.get<User[], PaginationMeta>(`/users${s ? `?${s}` : ''}`);
  },
  roles() {
    return apiClient.get<RoleOption[]>('/rbac/roles').then((r) => r.data);
  },
  create(payload: CreateUserPayload) {
    return apiClient.post<User>('/users', payload).then((r) => r.data);
  },
  updateStatus(id: string, version: number, status: string) {
    return apiClient.patch<User>(`/users/${id}/status`, { version, status }).then((r) => r.data);
  },
  remove(id: string) {
    return apiClient.del<{ id: string }>(`/users/${id}`).then((r) => r.data);
  },
};
