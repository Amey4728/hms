import { Injectable, NotFoundException } from '@nestjs/common';
import type { CreateMedicineInput, UpdateMedicineInput } from '@hms/shared';
import { PaginatedResult } from '../../../common/dto/paginated-result';
import { toPrismaPagination, type PaginationQuery } from '../../../common/dto/pagination.dto';
import { assertUpdatable, assertWritten } from '../../../common/utils/optimistic';
import { toMedicineView } from '../pharmacy.mapper';
import { MedicinesRepository } from './medicines.repository';

@Injectable()
export class MedicinesService {
  constructor(private readonly repo: MedicinesRepository) {}

  async create(input: CreateMedicineInput, userId: string) {
    const medicine = await this.repo.create({ ...input, createdBy: userId, updatedBy: userId });
    return toMedicineView(medicine);
  }

  async findById(id: string) {
    const medicine = await this.repo.findActiveById(id);
    if (!medicine) throw new NotFoundException('Medicine not found');
    return toMedicineView(medicine);
  }

  async list(query: PaginationQuery) {
    const { skip, take } = toPrismaPagination(query);
    const { items, total } = await this.repo.findManyPaginated({
      skip,
      take,
      search: query.search,
      sortOrder: query.sortOrder,
    });
    return PaginatedResult.from(items.map(toMedicineView), total, query.page, query.limit);
  }

  async update(id: string, input: UpdateMedicineInput, userId: string) {
    const { version, ...changes } = input;
    const current = await this.repo.findActiveById(id);
    assertUpdatable(current, version, 'Medicine');
    const count = await this.repo.updateGuarded(id, version, { ...changes, updatedBy: userId });
    assertWritten(count, 'Medicine');
    return this.findById(id);
  }

  async remove(id: string, userId: string): Promise<{ id: string }> {
    const current = await this.repo.findActiveById(id);
    if (!current) throw new NotFoundException('Medicine not found');
    await this.repo.softDelete(id, userId);
    return { id };
  }
}
