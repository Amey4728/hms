import { Injectable } from '@nestjs/common';
import { Prisma, type TreatmentPlan } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class TreatmentPlansRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.TreatmentPlanUncheckedCreateInput): Promise<TreatmentPlan> {
    return this.prisma.treatmentPlan.create({ data });
  }
  findActiveById(id: string): Promise<TreatmentPlan | null> {
    return this.prisma.treatmentPlan.findFirst({ where: { id, deletedAt: null } });
  }
  async findManyPaginated(params: {
    skip: number;
    take: number;
    patientId?: string;
    sortOrder: 'asc' | 'desc';
  }) {
    const where: Prisma.TreatmentPlanWhereInput = {
      deletedAt: null,
      ...(params.patientId ? { patientId: params.patientId } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.treatmentPlan.findMany({
        where,
        orderBy: { createdAt: params.sortOrder },
        skip: params.skip,
        take: params.take,
      }),
      this.prisma.treatmentPlan.count({ where }),
    ]);
    return { items, total };
  }
  async updateGuarded(
    id: string,
    expectedVersion: number,
    data: Prisma.TreatmentPlanUpdateInput,
  ): Promise<number> {
    const r = await this.prisma.treatmentPlan.updateMany({
      where: { id, version: expectedVersion, deletedAt: null },
      data: { ...data, version: { increment: 1 } },
    });
    return r.count;
  }
}
