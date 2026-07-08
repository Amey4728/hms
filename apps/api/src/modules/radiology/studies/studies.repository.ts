import { Injectable } from '@nestjs/common';
import { Prisma, type RadiologyStatus, type RadiologyStudy } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

export const studyInclude = Prisma.validator<Prisma.RadiologyStudyInclude>()({
  patient: { select: { firstName: true, lastName: true, patientNumber: true } },
  exam: { select: { name: true, modality: true, bodyPart: true } },
});
export type StudyWithRefs = Prisma.RadiologyStudyGetPayload<{ include: typeof studyInclude }>;

@Injectable()
export class StudiesRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.RadiologyStudyUncheckedCreateInput): Promise<StudyWithRefs> {
    return this.prisma.radiologyStudy.create({ data, include: studyInclude });
  }

  findWithRefs(id: string): Promise<StudyWithRefs | null> {
    return this.prisma.radiologyStudy.findFirst({ where: { id, deletedAt: null }, include: studyInclude });
  }

  findBareById(id: string): Promise<RadiologyStudy | null> {
    return this.prisma.radiologyStudy.findFirst({ where: { id, deletedAt: null } });
  }

  async findManyPaginated(params: {
    skip: number;
    take: number;
    patientId?: string;
    status?: RadiologyStatus;
    sortOrder: 'asc' | 'desc';
  }): Promise<{ items: StudyWithRefs[]; total: number }> {
    const where: Prisma.RadiologyStudyWhereInput = {
      deletedAt: null,
      ...(params.patientId ? { patientId: params.patientId } : {}),
      ...(params.status ? { status: params.status } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.radiologyStudy.findMany({ where, include: studyInclude, orderBy: { createdAt: params.sortOrder }, skip: params.skip, take: params.take }),
      this.prisma.radiologyStudy.count({ where }),
    ]);
    return { items, total };
  }

  async updateGuarded(id: string, expectedVersion: number, data: Prisma.RadiologyStudyUpdateInput): Promise<number> {
    const result = await this.prisma.radiologyStudy.updateMany({
      where: { id, version: expectedVersion, deletedAt: null },
      data: { ...data, version: { increment: 1 } },
    });
    return result.count;
  }
}
