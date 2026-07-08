import { Injectable } from '@nestjs/common';
import { Prisma, type LabOrder, type LabOrderItem, type LabOrderStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

export const labOrderInclude = Prisma.validator<Prisma.LabOrderInclude>()({
  items: { include: { test: { select: { code: true, name: true, unit: true, referenceRange: true } } }, orderBy: { createdAt: 'asc' } },
});
export type LabOrderWithItems = Prisma.LabOrderGetPayload<{ include: typeof labOrderInclude }>;

@Injectable()
export class LabOrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.LabOrderUncheckedCreateInput): Promise<LabOrderWithItems> {
    return this.prisma.labOrder.create({ data, include: labOrderInclude });
  }

  findWithItems(id: string): Promise<LabOrderWithItems | null> {
    return this.prisma.labOrder.findFirst({ where: { id, deletedAt: null }, include: labOrderInclude });
  }

  findBareById(id: string): Promise<LabOrder | null> {
    return this.prisma.labOrder.findFirst({ where: { id, deletedAt: null } });
  }

  async findManyPaginated(params: {
    skip: number;
    take: number;
    patientId?: string;
    hospitalId?: string;
    status?: LabOrderStatus;
    sortOrder: 'asc' | 'desc';
  }): Promise<{ items: LabOrderWithItems[]; total: number }> {
    const where: Prisma.LabOrderWhereInput = {
      deletedAt: null,
      ...(params.patientId ? { patientId: params.patientId } : {}),
      ...(params.hospitalId ? { hospitalId: params.hospitalId } : {}),
      ...(params.status ? { status: params.status } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.labOrder.findMany({
        where,
        include: labOrderInclude,
        orderBy: { createdAt: params.sortOrder },
        skip: params.skip,
        take: params.take,
      }),
      this.prisma.labOrder.count({ where }),
    ]);
    return { items, total };
  }

  async updateGuarded(id: string, expectedVersion: number, data: Prisma.LabOrderUpdateInput): Promise<number> {
    const result = await this.prisma.labOrder.updateMany({
      where: { id, version: expectedVersion, deletedAt: null },
      data: { ...data, version: { increment: 1 } },
    });
    return result.count;
  }

  softDelete(id: string, userId: string): Promise<Prisma.BatchPayload> {
    return this.prisma.labOrder.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date(), updatedBy: userId },
    });
  }

  findItem(orderId: string, itemId: string): Promise<LabOrderItem | null> {
    return this.prisma.labOrderItem.findFirst({ where: { id: itemId, orderId } });
  }

  async updateItemGuarded(
    orderId: string,
    itemId: string,
    expectedVersion: number,
    data: Prisma.LabOrderItemUpdateInput,
  ): Promise<number> {
    const result = await this.prisma.labOrderItem.updateMany({
      where: { id: itemId, orderId, version: expectedVersion },
      data: { ...data, version: { increment: 1 } },
    });
    return result.count;
  }

  async countUnresulted(orderId: string): Promise<number> {
    return this.prisma.labOrderItem.count({ where: { orderId, resultValue: null } });
  }
}
