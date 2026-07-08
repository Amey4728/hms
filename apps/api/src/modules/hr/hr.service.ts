import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type {
  CreateLeaveInput,
  CreateShiftInput,
  GeneratePayslipInput,
  LeaveDecisionInput,
  MarkAttendanceInput,
  PayslipStatusInput,
} from '@hms/shared';
import { PaginatedResult } from '../../common/dto/paginated-result';
import { toPrismaPagination } from '../../common/dto/pagination.dto';
import { assertUpdatable, assertWritten } from '../../common/utils/optimistic';
import { HrRepository } from './hr.repository';
import { dateOnly, daysBetween, toPayslipView } from './hr.mapper';

/** Attendance, leave, shifts and payroll operations. */
@Injectable()
export class HrService {
  constructor(private readonly repo: HrRepository) {}

  private async assertEmployee(employeeId: string) {
    if (!(await this.repo.findEmployee(employeeId)))
      throw new NotFoundException('Employee not found');
  }

  // ── Attendance ─────────────────────────────────────────────────────────
  async markAttendance(employeeId: string, input: MarkAttendanceInput, userId: string) {
    await this.assertEmployee(employeeId);
    const { date, ...rest } = input;
    return this.repo.upsertAttendance(employeeId, dateOnly(date), { ...rest, createdBy: userId });
  }
  async listAttendance(employeeId: string, from?: string, to?: string) {
    await this.assertEmployee(employeeId);
    return this.repo.listAttendance(
      employeeId,
      from ? dateOnly(from) : undefined,
      to ? dateOnly(to) : undefined,
    );
  }

  // ── Leave ──────────────────────────────────────────────────────────────
  async requestLeave(employeeId: string, input: CreateLeaveInput) {
    await this.assertEmployee(employeeId);
    return this.repo.createLeave({
      employeeId,
      type: input.type,
      startDate: dateOnly(input.startDate),
      endDate: dateOnly(input.endDate),
      days: daysBetween(input.startDate, input.endDate),
      reason: input.reason,
    });
  }
  async listLeave(query: {
    page: number;
    limit: number;
    sortOrder: 'asc' | 'desc';
    employeeId?: string;
    status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  }) {
    const { skip, take } = toPrismaPagination(query);
    const { items, total } = await this.repo.listLeave({
      skip,
      take,
      employeeId: query.employeeId,
      status: query.status,
      sortOrder: query.sortOrder,
    });
    return PaginatedResult.from(items, total, query.page, query.limit);
  }
  async decideLeave(id: string, approve: boolean, input: LeaveDecisionInput, userId: string) {
    const current = await this.repo.findLeave(id);
    assertUpdatable(current, input.version, 'Leave request');
    if (current.status !== 'PENDING')
      throw new ConflictException(`Leave already ${current.status}`);
    assertWritten(
      await this.repo.updateLeave(id, input.version, {
        status: approve ? 'APPROVED' : 'REJECTED',
        decisionNote: input.decisionNote,
        decidedById: userId,
      }),
      'Leave request',
    );
    const updated = await this.repo.findLeave(id);
    if (!updated) throw new NotFoundException('Leave request not found');
    return updated;
  }

  // ── Shifts ─────────────────────────────────────────────────────────────
  async createShift(input: CreateShiftInput, userId: string) {
    await this.assertEmployee(input.employeeId);
    return this.repo.createShift({
      employeeId: input.employeeId,
      date: dateOnly(input.date),
      startTime: input.startTime,
      endTime: input.endTime,
      note: input.note,
      createdBy: userId,
    });
  }
  async listShifts(employeeId: string, from?: string, to?: string) {
    await this.assertEmployee(employeeId);
    return this.repo.listShifts(
      employeeId,
      from ? dateOnly(from) : undefined,
      to ? dateOnly(to) : undefined,
    );
  }

  // ── Payroll ────────────────────────────────────────────────────────────
  async generatePayslip(employeeId: string, input: GeneratePayslipInput, userId: string) {
    const employee = await this.repo.findEmployee(employeeId);
    if (!employee) throw new NotFoundException('Employee not found');
    if (await this.repo.findPayslipByPeriod(employeeId, input.period)) {
      throw new ConflictException(`Payslip for ${input.period} already exists`);
    }
    const base = employee.baseSalary.toNumber();
    const netPay = Number((base + input.allowances - input.deductions).toFixed(2));
    const payslip = await this.repo.createPayslip({
      employeeId,
      period: input.period,
      baseSalary: base,
      allowances: input.allowances,
      deductions: input.deductions,
      netPay,
      generatedBy: userId,
    });
    return toPayslipView(payslip);
  }
  async listPayslips(query: {
    page: number;
    limit: number;
    sortOrder: 'asc' | 'desc';
    employeeId?: string;
    period?: string;
  }) {
    const { skip, take } = toPrismaPagination(query);
    const { items, total } = await this.repo.listPayslips({
      skip,
      take,
      employeeId: query.employeeId,
      period: query.period,
      sortOrder: query.sortOrder,
    });
    return PaginatedResult.from(items.map(toPayslipView), total, query.page, query.limit);
  }
  async setPayslipStatus(id: string, input: PayslipStatusInput, userId: string) {
    const current = await this.repo.findPayslip(id);
    assertUpdatable(current, input.version, 'Payslip');
    assertWritten(
      await this.repo.updatePayslip(id, input.version, {
        status: input.status,
        generatedBy: userId,
      }),
      'Payslip',
    );
    const updated = await this.repo.findPayslip(id);
    if (!updated) throw new NotFoundException('Payslip not found');
    return toPayslipView(updated);
  }
}
