import { Injectable, NotFoundException } from '@nestjs/common';
import type { ClaimStatus } from '@prisma/client';
import type { ApproveClaimInput, CreateClaimInput, RejectClaimInput } from '@hms/shared';
import { PaginatedResult } from '../../../common/dto/paginated-result';
import { toPrismaPagination } from '../../../common/dto/pagination.dto';
import { assertUpdatable, assertWritten } from '../../../common/utils/optimistic';
import { PatientsRepository } from '../../patients/patients.repository';
import { ProvidersRepository } from '../providers/providers.repository';
import { toClaimView } from './claims.mapper';
import { assertClaimTransition } from './claims.state';
import { ClaimsRepository } from './claims.repository';

interface ClaimQuery {
  page: number;
  limit: number;
  sortOrder: 'asc' | 'desc';
  patientId?: string;
  providerId?: string;
  status?: ClaimStatus;
}

@Injectable()
export class ClaimsService {
  constructor(
    private readonly repo: ClaimsRepository,
    private readonly patients: PatientsRepository,
    private readonly providers: ProvidersRepository,
  ) {}

  async create(input: CreateClaimInput, userId: string) {
    if (!(await this.patients.existsActive(input.patientId)))
      throw new NotFoundException('Patient not found');
    if (!(await this.providers.findActiveById(input.providerId)))
      throw new NotFoundException('Provider not found');
    const claim = await this.repo.create({
      patientId: input.patientId,
      providerId: input.providerId,
      invoiceId: input.invoiceId,
      policyNumber: input.policyNumber,
      claimedAmount: input.claimedAmount,
      notes: input.notes,
      createdBy: userId,
      updatedBy: userId,
    });
    return toClaimView(claim);
  }

  async findById(id: string) {
    const claim = await this.repo.findWithRefs(id);
    if (!claim) throw new NotFoundException('Claim not found');
    return toClaimView(claim);
  }

  async list(query: ClaimQuery) {
    const { skip, take } = toPrismaPagination(query);
    const { items, total } = await this.repo.findManyPaginated({
      skip,
      take,
      patientId: query.patientId,
      providerId: query.providerId,
      status: query.status,
      sortOrder: query.sortOrder,
    });
    return PaginatedResult.from(items.map(toClaimView), total, query.page, query.limit);
  }

  review(id: string, version: number, userId: string) {
    return this.transition(id, version, 'UNDER_REVIEW', userId, {});
  }

  approve(id: string, input: ApproveClaimInput, userId: string) {
    return this.transition(id, input.version, 'APPROVED', userId, {
      approvedAmount: input.approvedAmount,
      decisionNote: input.decisionNote,
      decisionAt: new Date(),
    });
  }

  reject(id: string, input: RejectClaimInput, userId: string) {
    return this.transition(id, input.version, 'REJECTED', userId, {
      decisionNote: input.decisionNote,
      decisionAt: new Date(),
    });
  }

  settle(id: string, version: number, userId: string) {
    return this.transition(id, version, 'SETTLED', userId, { settledAt: new Date() });
  }

  private async transition(
    id: string,
    version: number,
    to: ClaimStatus,
    userId: string,
    extra: Record<string, unknown>,
  ) {
    const current = await this.repo.findBareById(id);
    assertUpdatable(current, version, 'Claim');
    assertClaimTransition(current.status, to);
    assertWritten(
      await this.repo.updateGuarded(id, version, { status: to, updatedBy: userId, ...extra }),
      'Claim',
    );
    return this.findById(id);
  }
}
