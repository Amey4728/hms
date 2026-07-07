import type { CreatePatientInput, PaginationMeta } from '@hms/shared';
import { apiClient } from '@/lib/api-client';
import type { Patient, PatientProfile } from './types';

export interface PatientListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  gender?: string;
}

function toQuery(params: PatientListParams): string {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') q.set(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const patientsApi = {
  list(params: PatientListParams) {
    return apiClient.get<Patient[], PaginationMeta>(`/patients${toQuery(params)}`);
  },
  getProfile(id: string) {
    return apiClient.get<PatientProfile>(`/patients/${id}`).then((r) => r.data);
  },
  create(input: CreatePatientInput) {
    return apiClient.post<Patient>('/patients', input).then((r) => r.data);
  },
  remove(id: string) {
    return apiClient.del<{ id: string }>(`/patients/${id}`).then((r) => r.data);
  },
};
