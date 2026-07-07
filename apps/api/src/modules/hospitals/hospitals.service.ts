import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { Hospital } from '@prisma/client';
import type { CreateHospitalInput, UpdateHospitalInput } from '@hms/shared';
import { PaginatedResult } from '../../common/dto/paginated-result';
import { toPrismaPagination, type PaginationQuery } from '../../common/dto/pagination.dto';
import { assertUpdatable, assertWritten } from '../../common/utils/optimistic';
import { HospitalsRepository } from './hospitals.repository';

@Injectable()
export class HospitalsService {
  constructor(private readonly repo: HospitalsRepository) {}

  create(input: CreateHospitalInput, userId: string): Promise<Hospital> {
    return this.repo.create({ ...input, createdBy: userId, updatedBy: userId });
  }

  async findById(id: string): Promise<Hospital> {
    const hospital = await this.repo.findActiveById(id);
    if (!hospital) throw new NotFoundException('Hospital not found');
    return hospital;
  }

  async list(query: PaginationQuery): Promise<PaginatedResult<Hospital>> {
    const { skip, take } = toPrismaPagination(query);
    const { items, total } = await this.repo.findManyPaginated({
      skip,
      take,
      search: query.search,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
    return PaginatedResult.from(items, total, query.page, query.limit);
  }

  async update(id: string, input: UpdateHospitalInput, userId: string): Promise<Hospital> {
    const { version, ...changes } = input;
    const current = await this.repo.findActiveById(id);
    assertUpdatable(current, version, 'Hospital');

    const count = await this.repo.updateGuarded(id, version, { ...changes, updatedBy: userId });
    assertWritten(count, 'Hospital');
    return this.findById(id);
  }

  async remove(id: string, userId: string): Promise<{ id: string }> {
    const hospital = await this.repo.findActiveById(id);
    if (!hospital) throw new NotFoundException('Hospital not found');

    if (await this.repo.hasActiveChildren(id)) {
      throw new ConflictException(
        'Cannot delete a hospital that still has active branches or departments',
      );
    }

    await this.repo.softDelete(id, userId);
    return { id };
  }
}
