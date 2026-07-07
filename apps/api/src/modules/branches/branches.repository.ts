import { Injectable } from '@nestjs/common';
import { Prisma, type Branch } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BranchesRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.BranchCreateInput): Promise<Branch> {
    return this.prisma.branch.create({ data });
  }

  findActiveById(id: string): Promise<Branch | null> {
    return this.prisma.branch.findFirst({ where: { id, deletedAt: null } });
  }

  async findManyPaginated(params: {
    skip: number;
    take: number;
    hospitalId?: string;
    search?: string;
    sortBy?: string;
    sortOrder: 'asc' | 'desc';
  }): Promise<{ items: Branch[]; total: number }> {
    const where: Prisma.BranchWhereInput = {
      deletedAt: null,
      ...(params.hospitalId ? { hospitalId: params.hospitalId } : {}),
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
    const orderBy: Prisma.BranchOrderByWithRelationInput =
      params.sortBy && sortable.has(params.sortBy)
        ? { [params.sortBy]: params.sortOrder }
        : { createdAt: params.sortOrder };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.branch.findMany({ where, orderBy, skip: params.skip, take: params.take }),
      this.prisma.branch.count({ where }),
    ]);
    return { items, total };
  }

  async updateGuarded(
    id: string,
    expectedVersion: number,
    data: Prisma.BranchUpdateInput,
  ): Promise<number> {
    const result = await this.prisma.branch.updateMany({
      where: { id, version: expectedVersion, deletedAt: null },
      data: { ...data, version: { increment: 1 } },
    });
    return result.count;
  }

  softDelete(id: string, userId: string): Promise<Prisma.BatchPayload> {
    return this.prisma.branch.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date(), updatedBy: userId },
    });
  }

  async hasActiveDepartments(id: string): Promise<boolean> {
    const count = await this.prisma.department.count({
      where: { branchId: id, deletedAt: null },
    });
    return count > 0;
  }
}
