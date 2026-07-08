import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { labApi } from './api';

const TESTS = 'lab-tests';
const ORDERS = 'lab-orders';

export function useLabTests(p: { page?: number; limit?: number; search?: string }) {
  return useQuery({ queryKey: [TESTS, p], queryFn: () => labApi.listTests(p), placeholderData: keepPreviousData });
}
export function useAllLabTests() {
  return useQuery({ queryKey: [TESTS, 'all'], queryFn: () => labApi.allTests() });
}
export function useLabOrders(p: { page?: number; limit?: number; status?: string }) {
  return useQuery({ queryKey: [ORDERS, p], queryFn: () => labApi.listOrders(p), placeholderData: keepPreviousData });
}

export function useCreateLabTest() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (b: unknown) => labApi.createTest(b), onSuccess: () => qc.invalidateQueries({ queryKey: [TESTS] }) });
}
export function useCreateLabOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b: { patientId: string; hospitalId: string; testIds: string[]; notes?: string }) => labApi.createOrder(b),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ORDERS] }),
  });
}
export function useLabTransition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; action: 'collect-sample' | 'start' | 'complete'; version: number }) =>
      labApi.transition(v.id, v.action, v.version),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ORDERS] }),
  });
}
export function useLabCancel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; version: number; reason?: string }) => labApi.cancel(v.id, v.version, v.reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ORDERS] }),
  });
}
export function useEnterResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { orderId: string; itemId: string; body: unknown }) => labApi.enterResult(v.orderId, v.itemId, v.body),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ORDERS] }),
  });
}
