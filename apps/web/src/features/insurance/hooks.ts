import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { insuranceApi } from './api';

const PROVIDERS = 'ins-providers';
const CLAIMS = 'ins-claims';

export function useProviders(p: { page?: number; limit?: number }) {
  return useQuery({ queryKey: [PROVIDERS, p], queryFn: () => insuranceApi.listProviders(p), placeholderData: keepPreviousData });
}
export function useAllProviders() {
  return useQuery({ queryKey: [PROVIDERS, 'all'], queryFn: () => insuranceApi.allProviders() });
}
export function useClaims(p: { page?: number; limit?: number; status?: string }) {
  return useQuery({ queryKey: [CLAIMS, p], queryFn: () => insuranceApi.listClaims(p), placeholderData: keepPreviousData });
}
export function useCreateProvider() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (b: unknown) => insuranceApi.createProvider(b), onSuccess: () => qc.invalidateQueries({ queryKey: [PROVIDERS] }) });
}
export function useCreateClaim() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (b: unknown) => insuranceApi.createClaim(b), onSuccess: () => qc.invalidateQueries({ queryKey: [CLAIMS] }) });
}
export function useClaimActions() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: [CLAIMS] });
  return {
    transition: useMutation({ mutationFn: (v: { id: string; action: 'review' | 'settle'; version: number }) => insuranceApi.transition(v.id, v.action, v.version), onSuccess: invalidate }),
    approve: useMutation({ mutationFn: (v: { id: string; version: number; approvedAmount: number; decisionNote?: string }) => insuranceApi.approve(v.id, v.version, v.approvedAmount, v.decisionNote), onSuccess: invalidate }),
    reject: useMutation({ mutationFn: (v: { id: string; version: number; decisionNote: string }) => insuranceApi.reject(v.id, v.version, v.decisionNote), onSuccess: invalidate }),
  };
}
