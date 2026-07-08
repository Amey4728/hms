import { Injectable } from '@nestjs/common';
import { Prisma, type Medicine } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class MedicinesRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.MedicineUncheckedCreateInput): Promise<Medicine> {
    return this.prisma.medicine.create({ data });
  }

  findActiveById(id: string): Promise<Medicine | null> {
    return this.prisma.medicine.findFirst({ where: { id, deletedAt: null } });
  }

  async findManyPaginated(params: {
    skip: number;
    take: number;
    search?: string;
    sortOrder: 'asc' | 'desc';
  }): Promise<{ items: Medicine[]; total: number }> {
    const where: Prisma.MedicineWhereInput = {
      deletedAt: null,
      ...(params.search
        ? {
            OR: [
              { name: { contains: params.search, mode: 'insensitive' } },
              { code: { contains: params.search, mode: 'insensitive' } },
              { genericName: { contains: params.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.medicine.findMany({
        where,
        orderBy: { name: params.sortOrder },
        skip: params.skip,
        take: params.take,
      }),
      this.prisma.medicine.count({ where }),
    ]);
    return { items, total };
  }

  async updateGuarded(
    id: string,
    expectedVersion: number,
    data: Prisma.MedicineUpdateInput,
  ): Promise<number> {
    const result = await this.prisma.medicine.updateMany({
      where: { id, version: expectedVersion, deletedAt: null },
      data: { ...data, version: { increment: 1 } },
    });
    return result.count;
  }

  softDelete(id: string, userId: string): Promise<Prisma.BatchPayload> {
    return this.prisma.medicine.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date(), updatedBy: userId },
    });
  }
}
