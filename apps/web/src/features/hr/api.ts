import type { EmploymentType, EmployeeStatus, LeaveStatus, LeaveType, PaginationMeta, PayrollStatus } from '@hms/shared';
import { apiClient } from '@/lib/api-client';

export interface Employee {
  id: string;
  employeeNumber: number;
  employeeRef: string;
  firstName: string;
  lastName: string;
  designation: string;
  department: string | null;
  employmentType: EmploymentType;
  status: EmployeeStatus;
  baseSalary: number;
  version: number;
}

export interface Leave {
  id: string;
  employeeId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string | null;
  status: LeaveStatus;
  version: number;
}

export interface Payslip {
  id: string;
  employeeId: string;
  period: string;
  baseSalary: number;
  allowances: number;
  deductions: number;
  netPay: number;
  status: PayrollStatus;
  version: number;
}

function qs(p: Record<string, string | number | undefined>) {
  const q = new URLSearchParams();
  Object.entries(p).forEach(([k, v]) => v !== undefined && v !== '' && q.set(k, String(v)));
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const hrApi = {
  listEmployees(p: { page?: number; limit?: number; search?: string }) {
    return apiClient.get<Employee[], PaginationMeta>(`/hr/employees${qs(p)}`);
  },
  allEmployees() {
    return apiClient.get<Employee[]>('/hr/employees?limit=200').then((r) => r.data);
  },
  createEmployee(body: unknown) {
    return apiClient.post<Employee>('/hr/employees', body).then((r) => r.data);
  },
  requestLeave(employeeId: string, body: unknown) {
    return apiClient.post<Leave>(`/hr/employees/${employeeId}/leave`, body).then((r) => r.data);
  },
  generatePayslip(employeeId: string, body: unknown) {
    return apiClient.post<Payslip>(`/hr/employees/${employeeId}/payslips`, body).then((r) => r.data);
  },
  listLeave(p: { page?: number; limit?: number; status?: string }) {
    return apiClient.get<Leave[], PaginationMeta>(`/hr/leave${qs(p)}`);
  },
  approveLeave(id: string, version: number) {
    return apiClient.patch<Leave>(`/hr/leave/${id}/approve`, { version }).then((r) => r.data);
  },
  rejectLeave(id: string, version: number, decisionNote?: string) {
    return apiClient.patch<Leave>(`/hr/leave/${id}/reject`, { version, decisionNote }).then((r) => r.data);
  },
  listPayslips(p: { page?: number; limit?: number }) {
    return apiClient.get<Payslip[], PaginationMeta>(`/hr/payslips${qs(p)}`);
  },
};
