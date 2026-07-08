import { Injectable } from '@nestjs/common';
import { Prisma, type InsuranceProvider } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class ProvidersRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.InsuranceProviderCreateInput): Promise<InsuranceProvider> {
    return this.prisma.insuranceProvider.create({ data });
  }
  findActiveById(id: string): Promise<InsuranceProvider | null> {
    return this.prisma.insuranceProvider.findFirst({ where: { id, deletedAt: null } });
  }
  async findManyPaginated(params: {
    skip: number;
    take: number;
    search?: string;
    sortOrder: 'asc' | 'desc';
  }) {
    const where: Prisma.InsuranceProviderWhereInput = {
      deletedAt: null,
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
      this.prisma.insuranceProvider.findMany({
        where,
        orderBy: { name: params.sortOrder },
        skip: params.skip,
        take: params.take,
      }),
      this.prisma.insuranceProvider.count({ where }),
    ]);
    return { items, total };
  }
  async updateGuarded(
    id: string,
    expectedVersion: number,
    data: Prisma.InsuranceProviderUpdateInput,
  ): Promise<number> {
    const r = await this.prisma.insuranceProvider.updateMany({
      where: { id, version: expectedVersion, deletedAt: null },
      data: { ...data, version: { increment: 1 } },
    });
    return r.count;
  }
  softDelete(id: string, userId: string) {
    return this.prisma.insuranceProvider.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date(), updatedBy: userId },
    });
  }
}
