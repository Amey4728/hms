import { Injectable } from '@nestjs/common';
import { Prisma, type MedicineBatch } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

const medicineWithBatches = Prisma.validator<Prisma.MedicineInclude>()({
  batches: {
    where: { deletedAt: null },
    select: { id: true, quantity: true, expiryDate: true, batchNumber: true },
  },
});
export type MedicineWithBatches = Prisma.MedicineGetPayload<{
  include: typeof medicineWithBatches;
}>;

const batchWithMedicine = Prisma.validator<Prisma.MedicineBatchInclude>()({
  medicine: { select: { code: true, name: true } },
});
export type BatchWithMedicine = Prisma.MedicineBatchGetPayload<{
  include: typeof batchWithMedicine;
}>;

@Injectable()
export class InventoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  createBatch(data: Prisma.MedicineBatchUncheckedCreateInput): Promise<MedicineBatch> {
    return this.prisma.medicineBatch.create({ data });
  }

  async findMedicinesWithBatches(params: {
    skip: number;
    take: number;
    search?: string;
  }): Promise<{ items: MedicineWithBatches[]; total: number }> {
    const where: Prisma.MedicineWhereInput = {
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
      this.prisma.medicine.findMany({
        where,
        include: medicineWithBatches,
        orderBy: { name: 'asc' },
        skip: params.skip,
        take: params.take,
      }),
      this.prisma.medicine.count({ where }),
    ]);
    return { items, total };
  }

  /** All active medicines with batches — used for low-stock alerting. */
  findAllMedicinesWithBatches(): Promise<MedicineWithBatches[]> {
    return this.prisma.medicine.findMany({
      where: { deletedAt: null, isActive: true },
      include: medicineWithBatches,
    });
  }

  findExpiringBatches(cutoff: Date): Promise<BatchWithMedicine[]> {
    return this.prisma.medicineBatch.findMany({
      where: { deletedAt: null, quantity: { gt: 0 }, expiryDate: { lte: cutoff } },
      include: batchWithMedicine,
      orderBy: { expiryDate: 'asc' },
    });
  }
}
