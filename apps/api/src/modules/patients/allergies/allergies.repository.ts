import { Injectable } from '@nestjs/common';
import { Prisma, type Allergy } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class AllergiesRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.AllergyCreateInput): Promise<Allergy> {
    return this.prisma.allergy.create({ data });
  }

  findByPatient(patientId: string): Promise<Allergy[]> {
    return this.prisma.allergy.findMany({
      where: { patientId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
  }

  findOne(patientId: string, id: string): Promise<Allergy | null> {
    return this.prisma.allergy.findFirst({ where: { id, patientId, deletedAt: null } });
  }

  async updateGuarded(
    patientId: string,
    id: string,
    expectedVersion: number,
    data: Prisma.AllergyUpdateInput,
  ): Promise<number> {
    const result = await this.prisma.allergy.updateMany({
      where: { id, patientId, version: expectedVersion, deletedAt: null },
      data: { ...data, version: { increment: 1 } },
    });
    return result.count;
  }

  softDelete(patientId: string, id: string, userId: string): Promise<Prisma.BatchPayload> {
    return this.prisma.allergy.updateMany({
      where: { id, patientId, deletedAt: null },
      data: { deletedAt: new Date(), updatedBy: userId },
    });
  }
}
