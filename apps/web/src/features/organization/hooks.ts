import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { orgApi } from './api';

const HOSP = 'hospitals';
const BRANCH = 'branches';
const DEPT = 'departments';

export function useHospitalsList(p: { page?: number; limit?: number; search?: string }) {
  return useQuery({ queryKey: [HOSP, p], queryFn: () => orgApi.listHospitals(p), placeholderData: keepPreviousData });
}
export function useBranches(p: { hospitalId?: string; page?: number; limit?: number }) {
  return useQuery({ queryKey: [BRANCH, p], queryFn: () => orgApi.listBranches(p), placeholderData: keepPreviousData });
}
export function useDepartments(p: { hospitalId?: string; branchId?: string; page?: number; limit?: number }) {
  return useQuery({ queryKey: [DEPT, p], queryFn: () => orgApi.listDepartments(p), placeholderData: keepPreviousData });
}
export function useCreateHospital() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (b: unknown) => orgApi.createHospital(b), onSuccess: () => qc.invalidateQueries({ queryKey: [HOSP] }) });
}
export function useDeleteHospital() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => orgApi.deleteHospital(id), onSuccess: () => qc.invalidateQueries({ queryKey: [HOSP] }) });
}
export function useCreateBranch() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (b: unknown) => orgApi.createBranch(b), onSuccess: () => qc.invalidateQueries({ queryKey: [BRANCH] }) });
}
export function useCreateDepartment() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (b: unknown) => orgApi.createDepartment(b), onSuccess: () => qc.invalidateQueries({ queryKey: [DEPT] }) });
}
