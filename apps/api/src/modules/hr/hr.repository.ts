import { Injectable } from '@nestjs/common';
import {
  Prisma,
  type Attendance,
  type Employee,
  type EmployeeStatus,
  type LeaveRequest,
  type LeaveStatus,
  type Payslip,
  type Shift,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class HrRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ── Employees ────────────────────────────────────────────────────────
  createEmployee(data: Prisma.EmployeeUncheckedCreateInput): Promise<Employee> {
    return this.prisma.employee.create({ data });
  }
  findEmployee(id: string): Promise<Employee | null> {
    return this.prisma.employee.findFirst({ where: { id, deletedAt: null } });
  }
  async listEmployees(params: {
    skip: number;
    take: number;
    search?: string;
    status?: EmployeeStatus;
    sortOrder: 'asc' | 'desc';
  }) {
    const where: Prisma.EmployeeWhereInput = {
      deletedAt: null,
      ...(params.status ? { status: params.status } : {}),
      ...(params.search
        ? {
            OR: [
              { firstName: { contains: params.search, mode: 'insensitive' } },
              { lastName: { contains: params.search, mode: 'insensitive' } },
              { designation: { contains: params.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.employee.findMany({
        where,
        orderBy: { createdAt: params.sortOrder },
        skip: params.skip,
        take: params.take,
      }),
      this.prisma.employee.count({ where }),
    ]);
    return { items, total };
  }
  async updateEmployee(
    id: string,
    expectedVersion: number,
    data: Prisma.EmployeeUpdateInput,
  ): Promise<number> {
    const r = await this.prisma.employee.updateMany({
      where: { id, version: expectedVersion, deletedAt: null },
      data: { ...data, version: { increment: 1 } },
    });
    return r.count;
  }
  softDeleteEmployee(id: string, userId: string) {
    return this.prisma.employee.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date(), updatedBy: userId },
    });
  }

  // ── Attendance ───────────────────────────────────────────────────────
  upsertAttendance(
    employeeId: string,
    date: Date,
    data: Omit<Prisma.AttendanceUncheckedCreateInput, 'employeeId' | 'date'>,
  ): Promise<Attendance> {
    return this.prisma.attendance.upsert({
      where: { employeeId_date: { employeeId, date } },
      create: { employeeId, date, ...data },
      update: data,
    });
  }
  listAttendance(employeeId: string, from?: Date, to?: Date): Promise<Attendance[]> {
    return this.prisma.attendance.findMany({
      where: {
        employeeId,
        ...(from || to
          ? { date: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
          : {}),
      },
      orderBy: { date: 'desc' },
    });
  }

  // ── Leave ────────────────────────────────────────────────────────────
  createLeave(data: Prisma.LeaveRequestUncheckedCreateInput): Promise<LeaveRequest> {
    return this.prisma.leaveRequest.create({ data });
  }
  findLeave(id: string): Promise<LeaveRequest | null> {
    return this.prisma.leaveRequest.findUnique({ where: { id } });
  }
  async listLeave(params: {
    skip: number;
    take: number;
    employeeId?: string;
    status?: LeaveStatus;
    sortOrder: 'asc' | 'desc';
  }) {
    const where: Prisma.LeaveRequestWhereInput = {
      ...(params.employeeId ? { employeeId: params.employeeId } : {}),
      ...(params.status ? { status: params.status } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.leaveRequest.findMany({
        where,
        orderBy: { createdAt: params.sortOrder },
        skip: params.skip,
        take: params.take,
      }),
      this.prisma.leaveRequest.count({ where }),
    ]);
    return { items, total };
  }
  async updateLeave(
    id: string,
    expectedVersion: number,
    data: Prisma.LeaveRequestUpdateInput,
  ): Promise<number> {
    const r = await this.prisma.leaveRequest.updateMany({
      where: { id, version: expectedVersion },
      data: { ...data, version: { increment: 1 } },
    });
    return r.count;
  }

  // ── Shifts ───────────────────────────────────────────────────────────
  createShift(data: Prisma.ShiftUncheckedCreateInput): Promise<Shift> {
    return this.prisma.shift.create({ data });
  }
  listShifts(employeeId: string, from?: Date, to?: Date): Promise<Shift[]> {
    return this.prisma.shift.findMany({
      where: {
        employeeId,
        ...(from || to
          ? { date: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
          : {}),
      },
      orderBy: { date: 'asc' },
    });
  }

  // ── Payroll ──────────────────────────────────────────────────────────
  findPayslip(id: string): Promise<Payslip | null> {
    return this.prisma.payslip.findUnique({ where: { id } });
  }
  findPayslipByPeriod(employeeId: string, period: string): Promise<Payslip | null> {
    return this.prisma.payslip.findUnique({ where: { employeeId_period: { employeeId, period } } });
  }
  createPayslip(data: Prisma.PayslipUncheckedCreateInput): Promise<Payslip> {
    return this.prisma.payslip.create({ data });
  }
  async listPayslips(params: {
    skip: number;
    take: number;
    employeeId?: string;
    period?: string;
    sortOrder: 'asc' | 'desc';
  }) {
    const where: Prisma.PayslipWhereInput = {
      ...(params.employeeId ? { employeeId: params.employeeId } : {}),
      ...(params.period ? { period: params.period } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.payslip.findMany({
        where,
        orderBy: { createdAt: params.sortOrder },
        skip: params.skip,
        take: params.take,
      }),
      this.prisma.payslip.count({ where }),
    ]);
    return { items, total };
  }
  async updatePayslip(
    id: string,
    expectedVersion: number,
    data: Prisma.PayslipUpdateInput,
  ): Promise<number> {
    const r = await this.prisma.payslip.updateMany({
      where: { id, version: expectedVersion },
      data: { ...data, version: { increment: 1 } },
    });
    return r.count;
  }
}
