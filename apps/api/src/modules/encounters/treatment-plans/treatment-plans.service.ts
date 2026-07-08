import { Injectable, NotFoundException } from '@nestjs/common';
import type { CreateTreatmentPlanInput, UpdateTreatmentPlanInput } from '@hms/shared';
import { PaginatedResult } from '../../../common/dto/paginated-result';
import { toPrismaPagination } from '../../../common/dto/pagination.dto';
import { assertUpdatable, assertWritten } from '../../../common/utils/optimistic';
import { PatientsRepository } from '../../patients/patients.repository';
import { TreatmentPlansRepository } from './treatment-plans.repository';

@Injectable()
export class TreatmentPlansService {
  constructor(
    private readonly repo: TreatmentPlansRepository,
    private readonly patients: PatientsRepository,
  ) {}

  async create(input: CreateTreatmentPlanInput, userId: string) {
    if (!(await this.patients.existsActive(input.patientId)))
      throw new NotFoundException('Patient not found');
    return this.repo.create({
      patientId: input.patientId,
      visitId: input.visitId,
      title: input.title,
      description: input.description,
      startDate: input.startDate ? new Date(`${input.startDate}T00:00:00.000Z`) : undefined,
      endDate: input.endDate ? new Date(`${input.endDate}T00:00:00.000Z`) : undefined,
      createdBy: userId,
      updatedBy: userId,
    });
  }

  async list(query: {
    page: number;
    limit: number;
    sortOrder: 'asc' | 'desc';
    patientId?: string;
  }) {
    const { skip, take } = toPrismaPagination(query);
    const { items, total } = await this.repo.findManyPaginated({
      skip,
      take,
      patientId: query.patientId,
      sortOrder: query.sortOrder,
    });
    return PaginatedResult.from(items, total, query.page, query.limit);
  }

  async updateStatus(id: string, input: UpdateTreatmentPlanInput, userId: string) {
    const current = await this.repo.findActiveById(id);
    assertUpdatable(current, input.version, 'Treatment plan');
    assertWritten(
      await this.repo.updateGuarded(id, input.version, { status: input.status, updatedBy: userId }),
      'Treatment plan',
    );
    const updated = await this.repo.findActiveById(id);
    if (!updated) throw new NotFoundException('Treatment plan not found');
    return updated;
  }
}
