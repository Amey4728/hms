import { Injectable, NotFoundException } from '@nestjs/common';
import type { CreatePrescriptionInput } from '@hms/shared';
import { PaginatedResult } from '../../../common/dto/paginated-result';
import { toPrismaPagination } from '../../../common/dto/pagination.dto';
import { PatientsRepository } from '../../patients/patients.repository';
import { toPrescriptionView } from '../encounters.mapper';
import { PrescriptionsRepository } from './prescriptions.repository';

@Injectable()
export class PrescriptionsService {
  constructor(
    private readonly repo: PrescriptionsRepository,
    private readonly patients: PatientsRepository,
  ) {}

  async create(input: CreatePrescriptionInput, userId: string) {
    if (!(await this.patients.existsActive(input.patientId))) throw new NotFoundException('Patient not found');
    const prescription = await this.repo.create({
      patientId: input.patientId,
      visitId: input.visitId,
      doctorId: input.doctorId ?? userId,
      notes: input.notes,
      createdBy: userId,
      updatedBy: userId,
      items: { create: input.items },
    });
    return toPrescriptionView(prescription);
  }

  async findById(id: string) {
    const p = await this.repo.findWithItems(id);
    if (!p) throw new NotFoundException('Prescription not found');
    return toPrescriptionView(p);
  }

  async list(query: { page: number; limit: number; sortOrder: 'asc' | 'desc'; patientId?: string }) {
    const { skip, take } = toPrismaPagination(query);
    const { items, total } = await this.repo.findManyPaginated({ skip, take, patientId: query.patientId, sortOrder: query.sortOrder });
    return PaginatedResult.from(items.map(toPrescriptionView), total, query.page, query.limit);
  }
}
