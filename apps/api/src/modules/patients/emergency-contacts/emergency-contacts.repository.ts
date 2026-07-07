import { Injectable } from '@nestjs/common';
import { Prisma, type EmergencyContact } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class EmergencyContactsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.EmergencyContactCreateInput): Promise<EmergencyContact> {
    return this.prisma.emergencyContact.create({ data });
  }

  findByPatient(patientId: string): Promise<EmergencyContact[]> {
    return this.prisma.emergencyContact.findMany({
      where: { patientId, deletedAt: null },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    });
  }

  findOne(patientId: string, id: string): Promise<EmergencyContact | null> {
    return this.prisma.emergencyContact.findFirst({ where: { id, patientId, deletedAt: null } });
  }

  async updateGuarded(
    patientId: string,
    id: string,
    expectedVersion: number,
    data: Prisma.EmergencyContactUpdateInput,
  ): Promise<number> {
    const result = await this.prisma.emergencyContact.updateMany({
      where: { id, patientId, version: expectedVersion, deletedAt: null },
      data: { ...data, version: { increment: 1 } },
    });
    return result.count;
  }

  softDelete(patientId: string, id: string, userId: string): Promise<Prisma.BatchPayload> {
    return this.prisma.emergencyContact.updateMany({
      where: { id, patientId, deletedAt: null },
      data: { deletedAt: new Date(), updatedBy: userId },
    });
  }
}
