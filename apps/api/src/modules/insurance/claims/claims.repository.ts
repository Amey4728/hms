import { Injectable } from '@nestjs/common';
import { Prisma, type ClaimStatus, type InsuranceClaim } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

export const claimInclude = Prisma.validator<Prisma.InsuranceClaimInclude>()({
  patient: { select: { firstName: true, lastName: true, patientNumber: true } },
  provider: { select: { name: true, code: true } },
});
export type ClaimWithRefs = Prisma.InsuranceClaimGetPayload<{ include: typeof claimInclude }>;

@Injectable()
export class ClaimsRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.InsuranceClaimUncheckedCreateInput): Promise<ClaimWithRefs> {
    return this.prisma.insuranceClaim.create({ data, include: claimInclude });
  }
  findWithRefs(id: string): Promise<ClaimWithRefs | null> {
    return this.prisma.insuranceClaim.findFirst({
      where: { id, deletedAt: null },
      include: claimInclude,
    });
  }
  findBareById(id: string): Promise<InsuranceClaim | null> {
    return this.prisma.insuranceClaim.findFirst({ where: { id, deletedAt: null } });
  }
  async findManyPaginated(params: {
    skip: number;
    take: number;
    patientId?: string;
    providerId?: string;
    status?: ClaimStatus;
    sortOrder: 'asc' | 'desc';
  }): Promise<{ items: ClaimWithRefs[]; total: number }> {
    const where: Prisma.InsuranceClaimWhereInput = {
      deletedAt: null,
      ...(params.patientId ? { patientId: params.patientId } : {}),
      ...(params.providerId ? { providerId: params.providerId } : {}),
      ...(params.status ? { status: params.status } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.insuranceClaim.findMany({
        where,
        include: claimInclude,
        orderBy: { createdAt: params.sortOrder },
        skip: params.skip,
        take: params.take,
      }),
      this.prisma.insuranceClaim.count({ where }),
    ]);
    return { items, total };
  }
  async updateGuarded(
    id: string,
    expectedVersion: number,
    data: Prisma.InsuranceClaimUpdateInput,
  ): Promise<number> {
    const r = await this.prisma.insuranceClaim.updateMany({
      where: { id, version: expectedVersion, deletedAt: null },
      data: { ...data, version: { increment: 1 } },
    });
    return r.count;
  }
}
