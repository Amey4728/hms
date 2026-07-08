import { Injectable, NotFoundException } from '@nestjs/common';
import type { CreateProviderInput, UpdateProviderInput } from '@hms/shared';
import { PaginatedResult } from '../../../common/dto/paginated-result';
import { toPrismaPagination, type PaginationQuery } from '../../../common/dto/pagination.dto';
import { assertUpdatable, assertWritten } from '../../../common/utils/optimistic';
import { ProvidersRepository } from './providers.repository';

@Injectable()
export class ProvidersService {
  constructor(private readonly repo: ProvidersRepository) {}

  create(input: CreateProviderInput, userId: string) {
    return this.repo.create({ ...input, createdBy: userId, updatedBy: userId });
  }
  async findById(id: string) {
    const p = await this.repo.findActiveById(id);
    if (!p) throw new NotFoundException('Provider not found');
    return p;
  }
  async list(query: PaginationQuery) {
    const { skip, take } = toPrismaPagination(query);
    const { items, total } = await this.repo.findManyPaginated({
      skip,
      take,
      search: query.search,
      sortOrder: query.sortOrder,
    });
    return PaginatedResult.from(items, total, query.page, query.limit);
  }
  async update(id: string, input: UpdateProviderInput, userId: string) {
    const { version, ...changes } = input;
    const current = await this.repo.findActiveById(id);
    assertUpdatable(current, version, 'Provider');
    assertWritten(
      await this.repo.updateGuarded(id, version, { ...changes, updatedBy: userId }),
      'Provider',
    );
    return this.findById(id);
  }
  async remove(id: string, userId: string): Promise<{ id: string }> {
    if (!(await this.repo.findActiveById(id))) throw new NotFoundException('Provider not found');
    await this.repo.softDelete(id, userId);
    return { id };
  }
}
