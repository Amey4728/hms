import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { Branch } from '@prisma/client';
import type { CreateBranchInput, UpdateBranchInput } from '@hms/shared';
import { PaginatedResult } from '../../common/dto/paginated-result';
import { toPrismaPagination } from '../../common/dto/pagination.dto';
import { assertUpdatable, assertWritten } from '../../common/utils/optimistic';
import { HospitalsRepository } from '../hospitals/hospitals.repository';
import { BranchesRepository } from './branches.repository';
import type { BranchQueryDto } from './dto/branch.dto';

@Injectable()
export class BranchesService {
  constructor(
    private readonly repo: BranchesRepository,
    private readonly hospitals: HospitalsRepository,
  ) {}

  async create(input: CreateBranchInput, userId: string): Promise<Branch> {
    const { hospitalId, ...rest } = input;
    await this.assertHospitalExists(hospitalId);
    return this.repo.create({
      ...rest,
      hospital: { connect: { id: hospitalId } },
      createdBy: userId,
      updatedBy: userId,
    });
  }

  async findById(id: string): Promise<Branch> {
    const branch = await this.repo.findActiveById(id);
    if (!branch) throw new NotFoundException('Branch not found');
    return branch;
  }

  async list(query: BranchQueryDto): Promise<PaginatedResult<Branch>> {
    const { skip, take } = toPrismaPagination(query);
    const { items, total } = await this.repo.findManyPaginated({
      skip,
      take,
      hospitalId: query.hospitalId,
      search: query.search,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
    return PaginatedResult.from(items, total, query.page, query.limit);
  }

  async update(id: string, input: UpdateBranchInput, userId: string): Promise<Branch> {
    const { version, ...changes } = input;
    const current = await this.repo.findActiveById(id);
    assertUpdatable(current, version, 'Branch');

    const count = await this.repo.updateGuarded(id, version, { ...changes, updatedBy: userId });
    assertWritten(count, 'Branch');
    return this.findById(id);
  }

  async remove(id: string, userId: string): Promise<{ id: string }> {
    const branch = await this.repo.findActiveById(id);
    if (!branch) throw new NotFoundException('Branch not found');

    if (await this.repo.hasActiveDepartments(id)) {
      throw new ConflictException('Cannot delete a branch that still has active departments');
    }

    await this.repo.softDelete(id, userId);
    return { id };
  }

  private async assertHospitalExists(hospitalId: string): Promise<void> {
    const hospital = await this.hospitals.findActiveById(hospitalId);
    if (!hospital) throw new NotFoundException(`Hospital ${hospitalId} not found`);
  }
}
