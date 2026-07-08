import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pharmacyApi } from './api';

const MEDS = 'medicines';
const STOCK = 'stock';
const SALES = 'sales';

export function useMedicines(p: { page?: number; limit?: number; search?: string }) {
  return useQuery({ queryKey: [MEDS, p], queryFn: () => pharmacyApi.listMedicines(p), placeholderData: keepPreviousData });
}
export function useAllMedicines() {
  return useQuery({ queryKey: [MEDS, 'all'], queryFn: () => pharmacyApi.allMedicines() });
}
export function useStock(p: { page?: number; limit?: number; search?: string }) {
  return useQuery({ queryKey: [STOCK, p], queryFn: () => pharmacyApi.stock(p), placeholderData: keepPreviousData });
}
export function useLowStock() {
  return useQuery({ queryKey: [STOCK, 'low'], queryFn: () => pharmacyApi.lowStock() });
}
export function useExpiring(days: number) {
  return useQuery({ queryKey: [STOCK, 'expiring', days], queryFn: () => pharmacyApi.expiring(days) });
}
export function useSales(p: { page?: number; limit?: number }) {
  return useQuery({ queryKey: [SALES, p], queryFn: () => pharmacyApi.listSales(p), placeholderData: keepPreviousData });
}

export function useCreateMedicine() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (b: unknown) => pharmacyApi.createMedicine(b), onSuccess: () => qc.invalidateQueries({ queryKey: [MEDS] }) });
}
export function useReceiveBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { medicineId: string; body: unknown }) => pharmacyApi.receiveBatch(v.medicineId, v.body),
    onSuccess: () => qc.invalidateQueries({ queryKey: [STOCK] }),
  });
}
export function useCreateSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b: unknown) => pharmacyApi.createSale(b),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [SALES] });
      qc.invalidateQueries({ queryKey: [STOCK] });
    },
  });
}
