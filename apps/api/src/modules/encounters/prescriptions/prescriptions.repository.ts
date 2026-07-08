import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

export const prescriptionInclude = Prisma.validator<Prisma.PrescriptionInclude>()({
  items: { orderBy: { createdAt: 'asc' } },
});
export type PrescriptionWithItems = Prisma.PrescriptionGetPayload<{ include: typeof prescriptionInclude }>;

@Injectable()
export class PrescriptionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.PrescriptionUncheckedCreateInput): Promise<PrescriptionWithItems> {
    return this.prisma.prescription.create({ data, include: prescriptionInclude });
  }
  findWithItems(id: string): Promise<PrescriptionWithItems | null> {
    return this.prisma.prescription.findFirst({ where: { id, deletedAt: null }, include: prescriptionInclude });
  }
  async findManyPaginated(params: { skip: number; take: number; patientId?: string; sortOrder: 'asc' | 'desc' }) {
    const where: Prisma.PrescriptionWhereInput = {
      deletedAt: null,
      ...(params.patientId ? { patientId: params.patientId } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.prescription.findMany({ where, include: prescriptionInclude, orderBy: { createdAt: params.sortOrder }, skip: params.skip, take: params.take }),
      this.prisma.prescription.count({ where }),
    ]);
    return { items, total };
  }
}
