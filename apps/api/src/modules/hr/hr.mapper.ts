import type { Employee, Payslip } from '@prisma/client';
import { formatEmployeeNumber } from '@hms/shared';

export function toEmployeeView(e: Employee) {
  return {
    ...e,
    employeeRef: formatEmployeeNumber(e.employeeNumber),
    baseSalary: e.baseSalary.toNumber(),
  };
}

export function toPayslipView(p: Payslip) {
  return {
    ...p,
    baseSalary: p.baseSalary.toNumber(),
    allowances: p.allowances.toNumber(),
    deductions: p.deductions.toNumber(),
    netPay: p.netPay.toNumber(),
  };
}

export function dateOnly(d: string): Date {
  return new Date(`${d}T00:00:00.000Z`);
}

export function daysBetween(start: string, end: string): number {
  const ms = dateOnly(end).getTime() - dateOnly(start).getTime();
  return Math.floor(ms / (24 * 60 * 60 * 1000)) + 1;
}
