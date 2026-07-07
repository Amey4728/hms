import { Injectable } from '@nestjs/common';
import { Prisma, type Department, type DepartmentType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DepartmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.DepartmentCreateInput): Promise<Department> {
    return this.prisma.department.create({ data });
  }

  findActiveById(id: string): Promise<Department | null> {
    return this.prisma.department.findFirst({ where: { id, deletedAt: null } });
  }

  async findManyPaginated(params: {
    skip: number;
    take: number;
    hospitalId?: string;
    branchId?: string;
    type?: DepartmentType;
    search?: string;
    sortBy?: string;
    sortOrder: 'asc' | 'desc';
  }): Promise<{ items: Department[]; total: number }> {
    const where: Prisma.DepartmentWhereInput = {
      deletedAt: null,
      ...(params.hospitalId ? { hospitalId: params.hospitalId } : {}),
      ...(params.branchId ? { branchId: params.branchId } : {}),
      ...(params.type ? { type: params.type } : {}),
      ...(params.search
        ? {
            OR: [
              { name: { contains: params.search, mode: 'insensitive' } },
              { code: { contains: params.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const sortable = new Set(['createdAt', 'updatedAt', 'name', 'code', 'type']);
    const orderBy: Prisma.DepartmentOrderByWithRelationInput =
      params.sortBy && sortable.has(params.sortBy)
        ? { [params.sortBy]: params.sortOrder }
        : { createdAt: params.sortOrder };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.department.findMany({ where, orderBy, skip: params.skip, take: params.take }),
      this.prisma.department.count({ where }),
    ]);
    return { items, total };
  }

  async updateGuarded(
    id: string,
    expectedVersion: number,
    data: Prisma.DepartmentUpdateInput,
  ): Promise<number> {
    const result = await this.prisma.department.updateMany({
      where: { id, version: expectedVersion, deletedAt: null },
      data: { ...data, version: { increment: 1 } },
    });
    return result.count;
  }

  softDelete(id: string, userId: string): Promise<Prisma.BatchPayload> {
    return this.prisma.department.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date(), updatedBy: userId },
    });
  }
}
