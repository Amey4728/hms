import { Injectable } from '@nestjs/common';
import { Prisma, type MedicalHistory } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class MedicalHistoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.MedicalHistoryCreateInput): Promise<MedicalHistory> {
    return this.prisma.medicalHistory.create({ data });
  }

  findByPatient(patientId: string): Promise<MedicalHistory[]> {
    return this.prisma.medicalHistory.findMany({
      where: { patientId, deletedAt: null },
      orderBy: [{ diagnosedAt: 'desc' }, { createdAt: 'desc' }],
    });
  }

  findOne(patientId: string, id: string): Promise<MedicalHistory | null> {
    return this.prisma.medicalHistory.findFirst({ where: { id, patientId, deletedAt: null } });
  }

  async updateGuarded(
    patientId: string,
    id: string,
    expectedVersion: number,
    data: Prisma.MedicalHistoryUpdateInput,
  ): Promise<number> {
    const result = await this.prisma.medicalHistory.updateMany({
      where: { id, patientId, version: expectedVersion, deletedAt: null },
      data: { ...data, version: { increment: 1 } },
    });
    return result.count;
  }

  softDelete(patientId: string, id: string, userId: string): Promise<Prisma.BatchPayload> {
    return this.prisma.medicalHistory.updateMany({
      where: { id, patientId, deletedAt: null },
      data: { deletedAt: new Date(), updatedBy: userId },
    });
  }
}
