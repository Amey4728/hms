import { Injectable, NotFoundException } from '@nestjs/common';
import type { CreateLabTestInput, UpdateLabTestInput } from '@hms/shared';
import { PaginatedResult } from '../../../common/dto/paginated-result';
import { toPrismaPagination } from '../../../common/dto/pagination.dto';
import { assertUpdatable, assertWritten } from '../../../common/utils/optimistic';
import { toLabTestView } from '../lab.mapper';
import type { LabTestQueryDto } from './lab-tests.dto';
import { LabTestsRepository } from './lab-tests.repository';

@Injectable()
export class LabTestsService {
  constructor(private readonly repo: LabTestsRepository) {}

  async create(input: CreateLabTestInput, userId: string) {
    const test = await this.repo.create({ ...input, createdBy: userId, updatedBy: userId });
    return toLabTestView(test);
  }

  async findById(id: string) {
    const test = await this.repo.findActiveById(id);
    if (!test) throw new NotFoundException('Lab test not found');
    return toLabTestView(test);
  }

  async list(query: LabTestQueryDto) {
    const { skip, take } = toPrismaPagination(query);
    const { items, total } = await this.repo.findManyPaginated({
      skip,
      take,
      search: query.search,
      category: query.category,
      sortOrder: query.sortOrder,
    });
    return PaginatedResult.from(items.map(toLabTestView), total, query.page, query.limit);
  }

  async update(id: string, input: UpdateLabTestInput, userId: string) {
    const { version, ...changes } = input;
    const current = await this.repo.findActiveById(id);
    assertUpdatable(current, version, 'Lab test');
    const count = await this.repo.updateGuarded(id, version, { ...changes, updatedBy: userId });
    assertWritten(count, 'Lab test');
    return this.findById(id);
  }

  async remove(id: string, userId: string): Promise<{ id: string }> {
    const current = await this.repo.findActiveById(id);
    if (!current) throw new NotFoundException('Lab test not found');
    await this.repo.softDelete(id, userId);
    return { id };
  }
}
