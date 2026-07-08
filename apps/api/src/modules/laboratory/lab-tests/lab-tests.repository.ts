import { Injectable } from '@nestjs/common';
import { Prisma, type LabTest } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class LabTestsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.LabTestUncheckedCreateInput): Promise<LabTest> {
    return this.prisma.labTest.create({ data });
  }

  findActiveById(id: string): Promise<LabTest | null> {
    return this.prisma.labTest.findFirst({ where: { id, deletedAt: null } });
  }

  findActiveByIds(ids: string[]): Promise<LabTest[]> {
    return this.prisma.labTest.findMany({ where: { id: { in: ids }, deletedAt: null } });
  }

  async findManyPaginated(params: {
    skip: number;
    take: number;
    search?: string;
    category?: string;
    sortOrder: 'asc' | 'desc';
  }): Promise<{ items: LabTest[]; total: number }> {
    const where: Prisma.LabTestWhereInput = {
      deletedAt: null,
      ...(params.category ? { category: params.category } : {}),
      ...(params.search
        ? {
            OR: [
              { name: { contains: params.search, mode: 'insensitive' } },
              { code: { contains: params.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.labTest.findMany({ where, orderBy: { name: params.sortOrder }, skip: params.skip, take: params.take }),
      this.prisma.labTest.count({ where }),
    ]);
    return { items, total };
  }

  async updateGuarded(id: string, expectedVersion: number, data: Prisma.LabTestUpdateInput): Promise<number> {
    const result = await this.prisma.labTest.updateMany({
      where: { id, version: expectedVersion, deletedAt: null },
      data: { ...data, version: { increment: 1 } },
    });
    return result.count;
  }

  softDelete(id: string, userId: string): Promise<Prisma.BatchPayload> {
    return this.prisma.labTest.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date(), updatedBy: userId },
    });
  }
}
