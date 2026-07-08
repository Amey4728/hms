import { Injectable } from '@nestjs/common';
import { Prisma, type DoctorAvailability } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class AvailabilityRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.DoctorAvailabilityCreateInput): Promise<DoctorAvailability> {
    return this.prisma.doctorAvailability.create({ data });
  }

  findActiveById(id: string): Promise<DoctorAvailability | null> {
    return this.prisma.doctorAvailability.findFirst({ where: { id, deletedAt: null } });
  }

  findByDoctor(doctorId: string): Promise<DoctorAvailability[]> {
    return this.prisma.doctorAvailability.findMany({
      where: { doctorId, deletedAt: null },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  /** Active availability blocks for a doctor on a given weekday (for slot generation). */
  findActiveByDoctorAndDay(doctorId: string, dayOfWeek: number): Promise<DoctorAvailability[]> {
    return this.prisma.doctorAvailability.findMany({
      where: { doctorId, dayOfWeek, isActive: true, deletedAt: null },
      orderBy: { startTime: 'asc' },
    });
  }

  async updateGuarded(
    id: string,
    expectedVersion: number,
    data: Prisma.DoctorAvailabilityUpdateInput,
  ): Promise<number> {
    const result = await this.prisma.doctorAvailability.updateMany({
      where: { id, version: expectedVersion, deletedAt: null },
      data: { ...data, version: { increment: 1 } },
    });
    return result.count;
  }

  softDelete(id: string, userId: string): Promise<Prisma.BatchPayload> {
    return this.prisma.doctorAvailability.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date(), updatedBy: userId },
    });
  }
}
