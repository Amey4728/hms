import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Department } from '@prisma/client';
import type { CreateDepartmentInput, UpdateDepartmentInput } from '@hms/shared';
import { PaginatedResult } from '../../common/dto/paginated-result';
import { toPrismaPagination } from '../../common/dto/pagination.dto';
import { assertUpdatable, assertWritten } from '../../common/utils/optimistic';
import { BranchesRepository } from '../branches/branches.repository';
import { HospitalsRepository } from '../hospitals/hospitals.repository';
import { DepartmentsRepository } from './departments.repository';
import type { DepartmentQueryDto } from './dto/department.dto';

@Injectable()
export class DepartmentsService {
  constructor(
    private readonly repo: DepartmentsRepository,
    private readonly hospitals: HospitalsRepository,
    private readonly branches: BranchesRepository,
  ) {}

  async create(input: CreateDepartmentInput, userId: string): Promise<Department> {
    const { hospitalId, branchId, ...rest } = input;
    await this.assertHierarchy(hospitalId, branchId);
    return this.repo.create({
      ...rest,
      hospital: { connect: { id: hospitalId } },
      ...(branchId ? { branch: { connect: { id: branchId } } } : {}),
      createdBy: userId,
      updatedBy: userId,
    });
  }

  async findById(id: string): Promise<Department> {
    const department = await this.repo.findActiveById(id);
    if (!department) throw new NotFoundException('Department not found');
    return department;
  }

  async list(query: DepartmentQueryDto): Promise<PaginatedResult<Department>> {
    const { skip, take } = toPrismaPagination(query);
    const { items, total } = await this.repo.findManyPaginated({
      skip,
      take,
      hospitalId: query.hospitalId,
      branchId: query.branchId,
      type: query.type,
      search: query.search,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
    return PaginatedResult.from(items, total, query.page, query.limit);
  }

  async update(id: string, input: UpdateDepartmentInput, userId: string): Promise<Department> {
    const { version, branchId, ...changes } = input;
    const current = await this.repo.findActiveById(id);
    assertUpdatable(current, version, 'Department');

    // If a branch is being (re)assigned (non-null), validate it belongs to the same hospital.
    if (branchId) {
      await this.assertBranchInHospital(branchId, current.hospitalId);
    }

    const count = await this.repo.updateGuarded(id, version, {
      ...changes,
      ...(branchId !== undefined
        ? branchId
          ? { branch: { connect: { id: branchId } } }
          : { branch: { disconnect: true } }
        : {}),
      updatedBy: userId,
    });
    assertWritten(count, 'Department');
    return this.findById(id);
  }

  async remove(id: string, userId: string): Promise<{ id: string }> {
    const department = await this.repo.findActiveById(id);
    if (!department) throw new NotFoundException('Department not found');
    await this.repo.softDelete(id, userId);
    return { id };
  }

  // ── validation helpers ──────────────────────────────────────────────

  private async assertHierarchy(hospitalId: string, branchId?: string): Promise<void> {
    const hospital = await this.hospitals.findActiveById(hospitalId);
    if (!hospital) throw new NotFoundException(`Hospital ${hospitalId} not found`);
    if (branchId) await this.assertBranchInHospital(branchId, hospitalId);
  }

  private async assertBranchInHospital(branchId: string, hospitalId: string): Promise<void> {
    const branch = await this.branches.findActiveById(branchId);
    if (!branch) throw new NotFoundException(`Branch ${branchId} not found`);
    if (branch.hospitalId !== hospitalId) {
      throw new BadRequestException('Branch does not belong to the specified hospital');
    }
  }
}
