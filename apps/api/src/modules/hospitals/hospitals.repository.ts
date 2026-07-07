import { Injectable } from '@nestjs/common';
import { Prisma, type Hospital } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class HospitalsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.HospitalCreateInput): Promise<Hospital> {
    return this.prisma.hospital.create({ data });
  }

  findActiveById(id: string): Promise<Hospital | null> {
    return this.prisma.hospital.findFirst({ where: { id, deletedAt: null } });
  }

  async findManyPaginated(params: {
    skip: number;
    take: number;
    search?: string;
    sortBy?: string;
    sortOrder: 'asc' | 'desc';
  }): Promise<{ items: Hospital[]; total: number }> {
    const where: Prisma.HospitalWhereInput = {
      deletedAt: null,
      ...(params.search
        ? {
            OR: [
              { name: { contains: params.search, mode: 'insensitive' } },
              { code: { contains: params.search, mode: 'insensitive' } },
              { city: { contains: params.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const sortable = new Set(['createdAt', 'updatedAt', 'name', 'code', 'city']);
    const orderBy: Prisma.HospitalOrderByWithRelationInput =
      params.sortBy && sortable.has(params.sortBy)
        ? { [params.sortBy]: params.sortOrder }
        : { createdAt: params.sortOrder };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.hospital.findMany({ where, orderBy, skip: params.skip, take: params.take }),
      this.prisma.hospital.count({ where }),
    ]);
    return { items, total };
  }

  /** Optimistic, soft-delete-aware update. Returns the number of rows written. */
  async updateGuarded(
    id: string,
    expectedVersion: number,
    data: Prisma.HospitalUpdateInput,
  ): Promise<number> {
    const result = await this.prisma.hospital.updateMany({
      where: { id, version: expectedVersion, deletedAt: null },
      data: { ...data, version: { increment: 1 } },
    });
    return result.count;
  }

  softDelete(id: string, userId: string): Promise<Prisma.BatchPayload> {
    return this.prisma.hospital.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date(), updatedBy: userId },
    });
  }

  /** True if the hospital has any non-deleted branch or department. */
  async hasActiveChildren(id: string): Promise<boolean> {
    const [branches, departments] = await this.prisma.$transaction([
      this.prisma.branch.count({ where: { hospitalId: id, deletedAt: null } }),
      this.prisma.department.count({ where: { hospitalId: id, deletedAt: null } }),
    ]);
    return branches + departments > 0;
  }
}
