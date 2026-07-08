import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { procurementApi } from './api';

const ITEMS = 'inv-items';
const VENDORS = 'inv-vendors';
const PR = 'inv-purchases';

export function useItems(p: { page?: number; limit?: number; search?: string }) {
  return useQuery({ queryKey: [ITEMS, p], queryFn: () => procurementApi.listItems(p), placeholderData: keepPreviousData });
}
export function useAllItems() {
  return useQuery({ queryKey: [ITEMS, 'all'], queryFn: () => procurementApi.allItems() });
}
export function useLowStock() {
  return useQuery({ queryKey: [ITEMS, 'low'], queryFn: () => procurementApi.lowStock() });
}
export function useVendors(p: { page?: number; limit?: number }) {
  return useQuery({ queryKey: [VENDORS, p], queryFn: () => procurementApi.listVendors(p), placeholderData: keepPreviousData });
}
export function useAllVendors() {
  return useQuery({ queryKey: [VENDORS, 'all'], queryFn: () => procurementApi.allVendors() });
}
export function usePurchases(p: { page?: number; limit?: number; status?: string }) {
  return useQuery({ queryKey: [PR, p], queryFn: () => procurementApi.listPurchases(p), placeholderData: keepPreviousData });
}
export function useCreateItem() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (b: unknown) => procurementApi.createItem(b), onSuccess: () => qc.invalidateQueries({ queryKey: [ITEMS] }) });
}
export function useAdjust() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (v: { id: string; delta: number; note?: string }) => procurementApi.adjust(v.id, v.delta, v.note), onSuccess: () => qc.invalidateQueries({ queryKey: [ITEMS] }) });
}
export function useCreateVendor() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (b: unknown) => procurementApi.createVendor(b), onSuccess: () => qc.invalidateQueries({ queryKey: [VENDORS] }) });
}
export function useCreatePurchase() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (b: unknown) => procurementApi.createPurchase(b), onSuccess: () => qc.invalidateQueries({ queryKey: [PR] }) });
}
export function usePurchaseAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; action: 'submit' | 'approve' | 'reject' | 'receive'; version: number }) => procurementApi.purchaseAction(v.id, v.action, v.version),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [PR] }); qc.invalidateQueries({ queryKey: [ITEMS] }); },
  });
}
