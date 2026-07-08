import { Injectable } from '@nestjs/common';
import { Prisma, type Diagnosis, type Visit, type VisitStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

export const visitInclude = Prisma.validator<Prisma.VisitInclude>()({
  diagnoses: { where: { deletedAt: null }, orderBy: { createdAt: 'asc' } },
  treatmentPlans: { where: { deletedAt: null }, orderBy: { createdAt: 'asc' } },
  prescriptions: {
    where: { deletedAt: null },
    include: { items: true },
    orderBy: { createdAt: 'asc' },
  },
  patient: { select: { firstName: true, lastName: true, patientNumber: true } },
});
export type VisitWithDetails = Prisma.VisitGetPayload<{ include: typeof visitInclude }>;

@Injectable()
export class VisitsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.VisitUncheckedCreateInput): Promise<VisitWithDetails> {
    return this.prisma.visit.create({ data, include: visitInclude });
  }
  findWithDetails(id: string): Promise<VisitWithDetails | null> {
    return this.prisma.visit.findFirst({ where: { id, deletedAt: null }, include: visitInclude });
  }
  findBareById(id: string): Promise<Visit | null> {
    return this.prisma.visit.findFirst({ where: { id, deletedAt: null } });
  }
  async findManyPaginated(params: {
    skip: number;
    take: number;
    patientId?: string;
    status?: VisitStatus;
    sortOrder: 'asc' | 'desc';
  }): Promise<{ items: VisitWithDetails[]; total: number }> {
    const where: Prisma.VisitWhereInput = {
      deletedAt: null,
      ...(params.patientId ? { patientId: params.patientId } : {}),
      ...(params.status ? { status: params.status } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.visit.findMany({
        where,
        include: visitInclude,
        orderBy: { visitDate: params.sortOrder },
        skip: params.skip,
        take: params.take,
      }),
      this.prisma.visit.count({ where }),
    ]);
    return { items, total };
  }
  async updateGuarded(
    id: string,
    expectedVersion: number,
    data: Prisma.VisitUpdateInput,
  ): Promise<number> {
    const r = await this.prisma.visit.updateMany({
      where: { id, version: expectedVersion, deletedAt: null },
      data: { ...data, version: { increment: 1 } },
    });
    return r.count;
  }
  addDiagnosis(data: Prisma.DiagnosisUncheckedCreateInput): Promise<Diagnosis> {
    return this.prisma.diagnosis.create({ data });
  }
  softDeleteDiagnosis(visitId: string, id: string): Promise<Prisma.BatchPayload> {
    return this.prisma.diagnosis.updateMany({
      where: { id, visitId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }
}
