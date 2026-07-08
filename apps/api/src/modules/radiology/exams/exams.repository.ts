import { Injectable } from '@nestjs/common';
import { Prisma, type RadiologyExam } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class ExamsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.RadiologyExamUncheckedCreateInput): Promise<RadiologyExam> {
    return this.prisma.radiologyExam.create({ data });
  }

  findActiveById(id: string): Promise<RadiologyExam | null> {
    return this.prisma.radiologyExam.findFirst({ where: { id, deletedAt: null } });
  }

  async findManyPaginated(params: {
    skip: number;
    take: number;
    search?: string;
    sortOrder: 'asc' | 'desc';
  }): Promise<{ items: RadiologyExam[]; total: number }> {
    const where: Prisma.RadiologyExamWhereInput = {
      deletedAt: null,
      ...(params.search
        ? { OR: [{ name: { contains: params.search, mode: 'insensitive' } }, { code: { contains: params.search, mode: 'insensitive' } }] }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.radiologyExam.findMany({ where, orderBy: { name: params.sortOrder }, skip: params.skip, take: params.take }),
      this.prisma.radiologyExam.count({ where }),
    ]);
    return { items, total };
  }

  async updateGuarded(id: string, expectedVersion: number, data: Prisma.RadiologyExamUpdateInput): Promise<number> {
    const result = await this.prisma.radiologyExam.updateMany({
      where: { id, version: expectedVersion, deletedAt: null },
      data: { ...data, version: { increment: 1 } },
    });
    return result.count;
  }

  softDelete(id: string, userId: string): Promise<Prisma.BatchPayload> {
    return this.prisma.radiologyExam.updateMany({ where: { id, deletedAt: null }, data: { deletedAt: new Date(), updatedBy: userId } });
  }
}
