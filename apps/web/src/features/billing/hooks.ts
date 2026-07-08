import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { billingApi } from './api';

const KEY = 'invoices';

export function useInvoices(p: { page?: number; limit?: number; status?: string }) {
  return useQuery({ queryKey: [KEY, p], queryFn: () => billingApi.list(p), placeholderData: keepPreviousData });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: [KEY] });
}

export function useCreateInvoice() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: (b: unknown) => billingApi.create(b), onSuccess: invalidate });
}
export function usePayInvoice() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: (v: { id: string; body: unknown }) => billingApi.pay(v.id, v.body), onSuccess: invalidate });
}
export function useRefundInvoice() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: (v: { id: string; body: unknown }) => billingApi.refund(v.id, v.body), onSuccess: invalidate });
}
export function useCancelInvoice() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (v: { id: string; version: number; reason?: string }) => billingApi.cancel(v.id, v.version, v.reason),
    onSuccess: invalidate,
  });
}
