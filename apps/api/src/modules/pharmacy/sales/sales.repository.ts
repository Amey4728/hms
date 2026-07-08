import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

export const saleInclude = Prisma.validator<Prisma.PharmacySaleInclude>()({
  items: {
    include: {
      medicine: { select: { name: true } },
      batch: { select: { batchNumber: true } },
    },
    orderBy: { createdAt: 'asc' },
  },
});
export type SaleWithItems = Prisma.PharmacySaleGetPayload<{ include: typeof saleInclude }>;

interface SaleParams {
  patientId?: string;
  hospitalId?: string;
  soldById: string;
  discount: number;
  taxRate: number;
  items: { medicineId: string; quantity: number }[];
}

@Injectable()
export class SalesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findWithItems(id: string): Promise<SaleWithItems | null> {
    return this.prisma.pharmacySale.findFirst({
      where: { id, deletedAt: null },
      include: saleInclude,
    });
  }

  async findManyPaginated(params: {
    skip: number;
    take: number;
    patientId?: string;
    sortOrder: 'asc' | 'desc';
  }): Promise<{ items: SaleWithItems[]; total: number }> {
    const where: Prisma.PharmacySaleWhereInput = {
      deletedAt: null,
      ...(params.patientId ? { patientId: params.patientId } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.pharmacySale.findMany({
        where,
        include: saleInclude,
        orderBy: { createdAt: params.sortOrder },
        skip: params.skip,
        take: params.take,
      }),
      this.prisma.pharmacySale.count({ where }),
    ]);
    return { items, total };
  }

  /**
   * Creates a sale, decrementing stock FEFO (first-expiry-first-out) across
   * batches, and computes subtotal/discount/tax/total — all atomically.
   */
  async createSaleTransactional(params: SaleParams): Promise<string> {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    return this.prisma.$transaction(async (tx) => {
      const sale = await tx.pharmacySale.create({
        data: {
          patientId: params.patientId,
          hospitalId: params.hospitalId,
          soldById: params.soldById,
          createdBy: params.soldById,
        },
      });

      let subtotal = new Prisma.Decimal(0);

      for (const line of params.items) {
        const medicine = await tx.medicine.findFirst({
          where: { id: line.medicineId, deletedAt: null, isActive: true },
        });
        if (!medicine)
          throw new BadRequestException(`Medicine ${line.medicineId} not found or inactive`);

        const batches = await tx.medicineBatch.findMany({
          where: {
            medicineId: line.medicineId,
            deletedAt: null,
            quantity: { gt: 0 },
            expiryDate: { gte: today },
          },
          orderBy: { expiryDate: 'asc' },
        });
        const available = batches.reduce((s, b) => s + b.quantity, 0);
        if (available < line.quantity) {
          throw new BadRequestException(
            `Insufficient stock for ${medicine.name}: need ${line.quantity}, have ${available}`,
          );
        }

        let remaining = line.quantity;
        for (const batch of batches) {
          if (remaining <= 0) break;
          const take = Math.min(remaining, batch.quantity);
          remaining -= take;
          await tx.medicineBatch.update({
            where: { id: batch.id },
            data: { quantity: { decrement: take } },
          });
          const lineTotal = medicine.unitPrice.mul(take);
          subtotal = subtotal.add(lineTotal);
          await tx.pharmacySaleItem.create({
            data: {
              saleId: sale.id,
              medicineId: medicine.id,
              batchId: batch.id,
              quantity: take,
              unitPrice: medicine.unitPrice,
              lineTotal,
            },
          });
        }
      }

      const discount = Prisma.Decimal.min(new Prisma.Decimal(params.discount), subtotal);
      const taxable = subtotal.sub(discount);
      const tax = taxable.mul(params.taxRate).div(100);
      const total = taxable.add(tax);

      await tx.pharmacySale.update({
        where: { id: sale.id },
        data: { subtotal, discount, tax, total },
      });
      return sale.id;
    });
  }
}
