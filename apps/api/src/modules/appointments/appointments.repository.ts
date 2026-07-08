import { Injectable } from '@nestjs/common';
import { Prisma, type Appointment, type AppointmentStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ACTIVE_STATUSES } from './appointment.state';

@Injectable()
export class AppointmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.AppointmentUncheckedCreateInput): Promise<Appointment> {
    return this.prisma.appointment.create({ data });
  }

  findActiveById(id: string): Promise<Appointment | null> {
    return this.prisma.appointment.findFirst({ where: { id, deletedAt: null } });
  }

  /** Count active appointments for a doctor that overlap [start, end). */
  async countOverlaps(
    doctorId: string,
    start: Date,
    end: Date,
    excludeId?: string,
  ): Promise<number> {
    return this.prisma.appointment.count({
      where: {
        doctorId,
        deletedAt: null,
        status: { in: ACTIVE_STATUSES },
        scheduledStart: { lt: end },
        scheduledEnd: { gt: start },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  }

  /** Active appointments for a doctor within a day window (slot generation). */
  findForDoctorInWindow(doctorId: string, from: Date, to: Date): Promise<Appointment[]> {
    return this.prisma.appointment.findMany({
      where: {
        doctorId,
        deletedAt: null,
        status: { in: ACTIVE_STATUSES },
        scheduledStart: { gte: from, lt: to },
      },
      orderBy: { scheduledStart: 'asc' },
    });
  }

  /** Live queue: checked-in / in-progress for a doctor on a token date, by token. */
  findQueue(doctorId: string, tokenDate: Date): Promise<Appointment[]> {
    return this.prisma.appointment.findMany({
      where: {
        doctorId,
        tokenDate,
        deletedAt: null,
        status: { in: ['CHECKED_IN', 'IN_PROGRESS'] },
      },
      orderBy: { tokenNumber: 'asc' },
    });
  }

  async findManyPaginated(params: {
    skip: number;
    take: number;
    doctorId?: string;
    patientId?: string;
    hospitalId?: string;
    status?: AppointmentStatus;
    from?: Date;
    to?: Date;
    sortOrder: 'asc' | 'desc';
  }): Promise<{ items: Appointment[]; total: number }> {
    const where: Prisma.AppointmentWhereInput = {
      deletedAt: null,
      ...(params.doctorId ? { doctorId: params.doctorId } : {}),
      ...(params.patientId ? { patientId: params.patientId } : {}),
      ...(params.hospitalId ? { hospitalId: params.hospitalId } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.from || params.to
        ? {
            scheduledStart: {
              ...(params.from ? { gte: params.from } : {}),
              ...(params.to ? { lte: params.to } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.appointment.findMany({
        where,
        orderBy: { scheduledStart: params.sortOrder },
        skip: params.skip,
        take: params.take,
      }),
      this.prisma.appointment.count({ where }),
    ]);
    return { items, total };
  }

  async updateGuarded(
    id: string,
    expectedVersion: number,
    data: Prisma.AppointmentUpdateInput,
  ): Promise<number> {
    const result = await this.prisma.appointment.updateMany({
      where: { id, version: expectedVersion, deletedAt: null },
      data: { ...data, version: { increment: 1 } },
    });
    return result.count;
  }

  /**
   * Assigns the next token for (doctorId, tokenDate) and applies the update in a
   * single transaction. The @@unique([doctorId, tokenDate, tokenNumber]) guards
   * against concurrent duplicate tokens.
   */
  async transitionWithToken(params: {
    id: string;
    expectedVersion: number;
    doctorId: string;
    tokenDate: Date;
    data: Prisma.AppointmentUncheckedUpdateInput;
  }): Promise<{ count: number; tokenNumber: number }> {
    return this.prisma.$transaction(async (tx) => {
      const agg = await tx.appointment.aggregate({
        where: { doctorId: params.doctorId, tokenDate: params.tokenDate },
        _max: { tokenNumber: true },
      });
      const tokenNumber = (agg._max.tokenNumber ?? 0) + 1;
      const res = await tx.appointment.updateMany({
        where: { id: params.id, version: params.expectedVersion, deletedAt: null },
        data: {
          ...params.data,
          tokenDate: params.tokenDate,
          tokenNumber,
          version: { increment: 1 },
        },
      });
      return { count: res.count, tokenNumber };
    });
  }

  /** Creates a walk-in already checked-in with an assigned token, atomically. */
  async createWalkInWithToken(
    data: Prisma.AppointmentUncheckedCreateInput,
    doctorId: string,
    tokenDate: Date,
  ): Promise<Appointment> {
    return this.prisma.$transaction(async (tx) => {
      const agg = await tx.appointment.aggregate({
        where: { doctorId, tokenDate },
        _max: { tokenNumber: true },
      });
      const tokenNumber = (agg._max.tokenNumber ?? 0) + 1;
      return tx.appointment.create({ data: { ...data, tokenDate, tokenNumber } });
    });
  }
}
