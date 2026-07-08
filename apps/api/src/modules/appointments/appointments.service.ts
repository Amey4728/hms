import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { Appointment, AppointmentStatus } from '@prisma/client';
import type {
  BookAppointmentInput,
  CancelAppointmentInput,
  RescheduleInput,
  TransitionInput,
  WalkInInput,
} from '@hms/shared';
import { PaginatedResult } from '../../common/dto/paginated-result';
import { toPrismaPagination } from '../../common/dto/pagination.dto';
import { assertUpdatable, assertWritten } from '../../common/utils/optimistic';
import { assertTransition, toDateOnly } from './appointment.state';
import { toAppointmentView } from './appointments.mapper';
import { AppointmentsRepository } from './appointments.repository';
import type { AppointmentQueryDto } from './dto/appointment.dto';
import { SchedulingValidationService } from './scheduling-validation.service';
import { SlotsService } from './slots.service';

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly repo: AppointmentsRepository,
    private readonly validate: SchedulingValidationService,
    private readonly slots: SlotsService,
  ) {}

  // ── booking ────────────────────────────────────────────────────────────
  async book(input: BookAppointmentInput, userId: string) {
    const { patientId, doctorId, hospitalId, branchId, departmentId, scheduledStart, durationMinutes, reason } =
      input;
    await this.validateParticipants(patientId, doctorId, hospitalId, branchId, departmentId);

    const start = scheduledStart;
    const end = new Date(start.getTime() + durationMinutes * 60_000);
    await this.assertNoOverlap(doctorId, start, end);

    const appointment = await this.repo.create({
      patientId,
      doctorId,
      hospitalId,
      branchId,
      departmentId,
      scheduledStart: start,
      scheduledEnd: end,
      status: 'BOOKED',
      type: 'SCHEDULED',
      reason,
      createdBy: userId,
      updatedBy: userId,
    });
    return toAppointmentView(appointment);
  }

  async walkIn(input: WalkInInput, userId: string) {
    const { patientId, doctorId, hospitalId, branchId, departmentId, durationMinutes, reason } = input;
    await this.validateParticipants(patientId, doctorId, hospitalId, branchId, departmentId);

    const start = new Date();
    const end = new Date(start.getTime() + durationMinutes * 60_000);
    await this.assertNoOverlap(doctorId, start, end);

    const appointment = await this.repo.createWalkInWithToken(
      {
        patientId,
        doctorId,
        hospitalId,
        branchId,
        departmentId,
        scheduledStart: start,
        scheduledEnd: end,
        status: 'CHECKED_IN',
        type: 'WALK_IN',
        reason,
        checkedInAt: start,
        createdBy: userId,
        updatedBy: userId,
      },
      doctorId,
      toDateOnly(start),
    );
    return toAppointmentView(appointment);
  }

  // ── reads ──────────────────────────────────────────────────────────────
  async findById(id: string) {
    const appointment = await this.repo.findActiveById(id);
    if (!appointment) throw new NotFoundException('Appointment not found');
    return toAppointmentView(appointment);
  }

  async list(query: AppointmentQueryDto) {
    const { skip, take } = toPrismaPagination(query);
    const { items, total } = await this.repo.findManyPaginated({
      skip,
      take,
      doctorId: query.doctorId,
      patientId: query.patientId,
      hospitalId: query.hospitalId,
      status: query.status,
      from: query.from,
      to: query.to,
      sortOrder: query.sortOrder,
    });
    return PaginatedResult.from(items.map(toAppointmentView), total, query.page, query.limit);
  }

  async queue(doctorId: string, dateStr: string) {
    const tokenDate = new Date(`${dateStr}T00:00:00.000Z`);
    const items = await this.repo.findQueue(doctorId, tokenDate);
    return items.map(toAppointmentView);
  }

  slotsFor(doctorId: string, dateStr: string) {
    return this.slots.generate(doctorId, dateStr);
  }

  // ── mutations ────────────────────────────────────────────────────────────
  async reschedule(id: string, input: RescheduleInput, userId: string) {
    const current = await this.repo.findActiveById(id);
    assertUpdatable(current, input.version, 'Appointment');
    if (current.status !== 'BOOKED') {
      throw new ConflictException(`Only BOOKED appointments can be rescheduled (current: ${current.status})`);
    }

    const durationMs =
      (input.durationMinutes ?? Math.round((+current.scheduledEnd - +current.scheduledStart) / 60_000)) *
      60_000;
    const start = input.scheduledStart;
    const end = new Date(start.getTime() + durationMs);
    await this.assertNoOverlap(current.doctorId, start, end, id);

    const count = await this.repo.updateGuarded(id, input.version, {
      scheduledStart: start,
      scheduledEnd: end,
      updatedBy: userId,
    });
    assertWritten(count, 'Appointment');
    return this.findById(id);
  }

  cancel(id: string, input: CancelAppointmentInput, userId: string) {
    return this.transition(id, input.version, 'CANCELLED', userId, {
      cancelledAt: new Date(),
      cancellationReason: input.reason,
    });
  }

  noShow(id: string, input: TransitionInput, userId: string) {
    return this.transition(id, input.version, 'NO_SHOW', userId, {});
  }

  start(id: string, input: TransitionInput, userId: string) {
    return this.transition(id, input.version, 'IN_PROGRESS', userId, { startedAt: new Date() });
  }

  complete(id: string, input: TransitionInput, userId: string) {
    return this.transition(id, input.version, 'COMPLETED', userId, { completedAt: new Date() });
  }

  /** Check-in assigns a queue token atomically. */
  async checkIn(id: string, input: TransitionInput, userId: string) {
    const current = await this.repo.findActiveById(id);
    assertUpdatable(current, input.version, 'Appointment');
    assertTransition(current.status, 'CHECKED_IN');

    const { count } = await this.repo.transitionWithToken({
      id,
      expectedVersion: input.version,
      doctorId: current.doctorId,
      tokenDate: toDateOnly(new Date()),
      data: { status: 'CHECKED_IN', checkedInAt: new Date(), updatedBy: userId },
    });
    assertWritten(count, 'Appointment');
    return this.findById(id);
  }

  // ── internals ────────────────────────────────────────────────────────────
  private async transition(
    id: string,
    version: number,
    to: AppointmentStatus,
    userId: string,
    extra: Record<string, unknown>,
  ) {
    const current = await this.repo.findActiveById(id);
    assertUpdatable(current, version, 'Appointment');
    assertTransition(current.status, to);

    const count = await this.repo.updateGuarded(id, version, {
      status: to,
      updatedBy: userId,
      ...extra,
    });
    assertWritten(count, 'Appointment');
    return this.findById(id);
  }

  private async validateParticipants(
    patientId: string,
    doctorId: string,
    hospitalId: string,
    branchId?: string,
    departmentId?: string,
  ): Promise<void> {
    await this.validate.assertPatient(patientId);
    await this.validate.assertActiveDoctor(doctorId);
    await this.validate.assertScope(hospitalId, branchId, departmentId);
  }

  private async assertNoOverlap(
    doctorId: string,
    start: Date,
    end: Date,
    excludeId?: string,
  ): Promise<void> {
    const overlaps = await this.repo.countOverlaps(doctorId, start, end, excludeId);
    if (overlaps > 0) {
      throw new ConflictException('The doctor already has an appointment in this time range');
    }
  }
}
