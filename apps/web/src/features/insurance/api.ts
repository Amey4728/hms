import type { ClaimStatus, PaginationMeta } from '@hms/shared';
import { apiClient } from '@/lib/api-client';

export interface Provider {
  id: string;
  code: string;
  name: string;
  contactEmail: string | null;
  contactPhone: string | null;
  version: number;
}

export interface Claim {
  id: string;
  claimNumber: number;
  claimRef: string;
  patientId: string;
  patientName: string;
  patientMrn: string;
  providerId: string;
  providerName: string;
  policyNumber: string;
  claimedAmount: number;
  approvedAmount: number | null;
  status: ClaimStatus;
  decisionNote: string | null;
  version: number;
}

function qs(p: Record<string, string | number | undefined>) {
  const q = new URLSearchParams();
  Object.entries(p).forEach(([k, v]) => v !== undefined && v !== '' && q.set(k, String(v)));
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const insuranceApi = {
  listProviders(p: { page?: number; limit?: number }) {
    return apiClient.get<Provider[], PaginationMeta>(`/insurance/providers${qs(p)}`);
  },
  allProviders() {
    return apiClient.get<Provider[]>('/insurance/providers?limit=200').then((r) => r.data);
  },
  createProvider(body: unknown) {
    return apiClient.post<Provider>('/insurance/providers', body).then((r) => r.data);
  },
  listClaims(p: { page?: number; limit?: number; status?: string }) {
    return apiClient.get<Claim[], PaginationMeta>(`/insurance/claims${qs(p)}`);
  },
  createClaim(body: unknown) {
    return apiClient.post<Claim>('/insurance/claims', body).then((r) => r.data);
  },
  transition(id: string, action: 'review' | 'settle', version: number) {
    return apiClient.patch<Claim>(`/insurance/claims/${id}/${action}`, { version }).then((r) => r.data);
  },
  approve(id: string, version: number, approvedAmount: number, decisionNote?: string) {
    return apiClient.patch<Claim>(`/insurance/claims/${id}/approve`, { version, approvedAmount, decisionNote }).then((r) => r.data);
  },
  reject(id: string, version: number, decisionNote: string) {
    return apiClient.patch<Claim>(`/insurance/claims/${id}/reject`, { version, decisionNote }).then((r) => r.data);
  },
};
