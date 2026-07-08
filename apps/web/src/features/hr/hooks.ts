import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hrApi } from './api';

const EMP = 'hr-employees';
const LEAVE = 'hr-leave';
const PAY = 'hr-payslips';

export function useEmployees(p: { page?: number; limit?: number; search?: string }) {
  return useQuery({ queryKey: [EMP, p], queryFn: () => hrApi.listEmployees(p), placeholderData: keepPreviousData });
}
export function useAllEmployees() {
  return useQuery({ queryKey: [EMP, 'all'], queryFn: () => hrApi.allEmployees() });
}
export function useLeave(p: { page?: number; limit?: number; status?: string }) {
  return useQuery({ queryKey: [LEAVE, p], queryFn: () => hrApi.listLeave(p), placeholderData: keepPreviousData });
}
export function usePayslips(p: { page?: number; limit?: number }) {
  return useQuery({ queryKey: [PAY, p], queryFn: () => hrApi.listPayslips(p), placeholderData: keepPreviousData });
}
export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (b: unknown) => hrApi.createEmployee(b), onSuccess: () => qc.invalidateQueries({ queryKey: [EMP] }) });
}
export function useRequestLeave() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (v: { employeeId: string; body: unknown }) => hrApi.requestLeave(v.employeeId, v.body), onSuccess: () => qc.invalidateQueries({ queryKey: [LEAVE] }) });
}
export function useGeneratePayslip() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (v: { employeeId: string; body: unknown }) => hrApi.generatePayslip(v.employeeId, v.body), onSuccess: () => qc.invalidateQueries({ queryKey: [PAY] }) });
}
export function useLeaveActions() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: [LEAVE] });
  return {
    approve: useMutation({ mutationFn: (v: { id: string; version: number }) => hrApi.approveLeave(v.id, v.version), onSuccess: invalidate }),
    reject: useMutation({ mutationFn: (v: { id: string; version: number; note?: string }) => hrApi.rejectLeave(v.id, v.version, v.note), onSuccess: invalidate }),
  };
}
