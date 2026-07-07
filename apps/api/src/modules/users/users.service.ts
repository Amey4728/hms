import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginatedResult } from '../../common/dto/paginated-result';
import { toPrismaPagination, type PaginationQuery } from '../../common/dto/pagination.dto';
import { toUserView, type UserView } from './users.mapper';
import { UsersRepository, type UserWithRbac } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly repo: UsersRepository) {}

  /** Used by the auth layer; returns the raw entity (incl. passwordHash). */
  findRawById(id: string): Promise<UserWithRbac | null> {
    return this.repo.findByIdWithRbac(id);
  }

  async findById(id: string): Promise<UserView> {
    const user = await this.repo.findByIdWithRbac(id);
    if (!user) throw new NotFoundException('User not found');
    return toUserView(user);
  }

  async list(query: PaginationQuery): Promise<PaginatedResult<UserView>> {
    const { skip, take } = toPrismaPagination(query);
    const { items, total } = await this.repo.findManyPaginated({
      skip,
      take,
      search: query.search,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
    return PaginatedResult.from(items.map(toUserView), total, query.page, query.limit);
  }
}
