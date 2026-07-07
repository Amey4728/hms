import { Injectable, NotFoundException } from '@nestjs/common';
import type { Patient } from '@prisma/client';
import type { CreatePatientInput, UpdatePatientInput } from '@hms/shared';
import { PaginatedResult } from '../../common/dto/paginated-result';
import { toPrismaPagination } from '../../common/dto/pagination.dto';
import { assertUpdatable, assertWritten } from '../../common/utils/optimistic';
import { BranchesRepository } from '../branches/branches.repository';
import { HospitalsRepository } from '../hospitals/hospitals.repository';
import type { PatientQueryDto } from './dto/patient.dto';
import { toPatientProfile, toPatientView } from './patients.mapper';
import { PatientsRepository } from './patients.repository';

@Injectable()
export class PatientsService {
  constructor(
    private readonly repo: PatientsRepository,
    private readonly hospitals: HospitalsRepository,
    private readonly branches: BranchesRepository,
  ) {}

  async create(input: CreatePatientInput, userId: string) {
    const { hospitalId, branchId, userId: linkedUserId, ...rest } = input;
    await this.assertScoping(hospitalId, branchId);

    const patient = await this.repo.create({
      ...rest,
      ...(hospitalId ? { hospital: { connect: { id: hospitalId } } } : {}),
      ...(branchId ? { branch: { connect: { id: branchId } } } : {}),
      ...(linkedUserId ? { user: { connect: { id: linkedUserId } } } : {}),
      createdBy: userId,
      updatedBy: userId,
    });
    return toPatientView(patient);
  }

  /** Full profile with active child collections. */
  async getProfile(id: string) {
    const patient = await this.repo.findProfileById(id);
    if (!patient) throw new NotFoundException('Patient not found');
    return toPatientProfile(patient);
  }

  async list(query: PatientQueryDto) {
    const { skip, take } = toPrismaPagination(query);
    const { items, total } = await this.repo.findManyPaginated({
      skip,
      take,
      hospitalId: query.hospitalId,
      status: query.status,
      gender: query.gender,
      search: query.search,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
    return PaginatedResult.from(items.map(toPatientView), total, query.page, query.limit);
  }

  async update(id: string, input: UpdatePatientInput, userId: string) {
    const { version, hospitalId, branchId, userId: linkedUserId, ...changes } = input;
    const current = await this.repo.findActiveById(id);
    assertUpdatable(current, version, 'Patient');
    await this.assertScoping(hospitalId, branchId);

    const count = await this.repo.updateGuarded(id, version, {
      ...changes,
      ...(hospitalId !== undefined
        ? hospitalId
          ? { hospital: { connect: { id: hospitalId } } }
          : { hospital: { disconnect: true } }
        : {}),
      ...(branchId !== undefined
        ? branchId
          ? { branch: { connect: { id: branchId } } }
          : { branch: { disconnect: true } }
        : {}),
      ...(linkedUserId !== undefined
        ? linkedUserId
          ? { user: { connect: { id: linkedUserId } } }
          : { user: { disconnect: true } }
        : {}),
      updatedBy: userId,
    });
    assertWritten(count, 'Patient');
    return toPatientView((await this.repo.findActiveById(id)) as Patient);
  }

  async remove(id: string, userId: string): Promise<{ id: string }> {
    const patient = await this.repo.findActiveById(id);
    if (!patient) throw new NotFoundException('Patient not found');
    await this.repo.softDelete(id, userId);
    return { id };
  }

  /** Guard used by child-resource services. */
  async assertPatientExists(id: string): Promise<void> {
    if (!(await this.repo.existsActive(id))) throw new NotFoundException('Patient not found');
  }

  private async assertScoping(hospitalId?: string, branchId?: string): Promise<void> {
    if (hospitalId) {
      const hospital = await this.hospitals.findActiveById(hospitalId);
      if (!hospital) throw new NotFoundException(`Hospital ${hospitalId} not found`);
    }
    if (branchId) {
      const branch = await this.branches.findActiveById(branchId);
      if (!branch) throw new NotFoundException(`Branch ${branchId} not found`);
    }
  }
}
