import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type VisitStatus } from '@prisma/client';
import type { CreateDiagnosisInput, CreateVisitInput, UpdateVisitInput } from '@hms/shared';
import { PaginatedResult } from '../../../common/dto/paginated-result';
import { toPrismaPagination } from '../../../common/dto/pagination.dto';
import { assertUpdatable, assertWritten } from '../../../common/utils/optimistic';
import { PatientsRepository } from '../../patients/patients.repository';
import { toVisitView } from '../encounters.mapper';
import { VisitsRepository } from './visits.repository';

interface VisitQuery {
  page: number;
  limit: number;
  sortOrder: 'asc' | 'desc';
  patientId?: string;
  status?: VisitStatus;
}

@Injectable()
export class VisitsService {
  constructor(
    private readonly repo: VisitsRepository,
    private readonly patients: PatientsRepository,
  ) {}

  async create(input: CreateVisitInput, userId: string) {
    if (!(await this.patients.existsActive(input.patientId)))
      throw new NotFoundException('Patient not found');
    const visit = await this.repo.create({
      patientId: input.patientId,
      doctorId: input.doctorId,
      appointmentId: input.appointmentId,
      hospitalId: input.hospitalId,
      visitType: input.visitType,
      chiefComplaint: input.chiefComplaint,
      notes: input.notes,
      vitals: (input.vitals ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      createdBy: userId,
      updatedBy: userId,
    });
    return toVisitView(visit);
  }

  async findById(id: string) {
    const visit = await this.repo.findWithDetails(id);
    if (!visit) throw new NotFoundException('Visit not found');
    return toVisitView(visit);
  }

  async list(query: VisitQuery) {
    const { skip, take } = toPrismaPagination(query);
    const { items, total } = await this.repo.findManyPaginated({
      skip,
      take,
      patientId: query.patientId,
      status: query.status,
      sortOrder: query.sortOrder,
    });
    return PaginatedResult.from(items.map(toVisitView), total, query.page, query.limit);
  }

  async update(id: string, input: UpdateVisitInput, userId: string) {
    const { version, vitals, ...changes } = input;
    const current = await this.repo.findBareById(id);
    assertUpdatable(current, version, 'Visit');
    if (current.status === 'CLOSED') throw new ConflictException('Cannot edit a closed visit');
    assertWritten(
      await this.repo.updateGuarded(id, version, {
        ...changes,
        ...(vitals !== undefined ? { vitals: vitals as Prisma.InputJsonValue } : {}),
        updatedBy: userId,
      }),
      'Visit',
    );
    return this.findById(id);
  }

  async close(id: string, version: number, userId: string) {
    const current = await this.repo.findBareById(id);
    assertUpdatable(current, version, 'Visit');
    if (current.status === 'CLOSED') throw new ConflictException('Visit is already closed');
    assertWritten(
      await this.repo.updateGuarded(id, version, {
        status: 'CLOSED',
        closedAt: new Date(),
        updatedBy: userId,
      }),
      'Visit',
    );
    return this.findById(id);
  }

  async addDiagnosis(visitId: string, input: CreateDiagnosisInput, userId: string) {
    const visit = await this.repo.findBareById(visitId);
    if (!visit) throw new NotFoundException('Visit not found');
    if (visit.status === 'CLOSED')
      throw new ConflictException('Cannot add a diagnosis to a closed visit');
    await this.repo.addDiagnosis({
      visitId,
      patientId: visit.patientId,
      code: input.code,
      description: input.description,
      type: input.type,
      notes: input.notes,
      recordedById: userId,
    });
    return this.findById(visitId);
  }

  async removeDiagnosis(visitId: string, diagnosisId: string) {
    const res = await this.repo.softDeleteDiagnosis(visitId, diagnosisId);
    if (res.count === 0) throw new NotFoundException('Diagnosis not found');
    return this.findById(visitId);
  }
}
