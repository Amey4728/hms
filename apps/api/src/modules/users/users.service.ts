import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { CreateUserInput, UpdateUserInput, UpdateUserStatusInput } from '@hms/shared';
import { PaginatedResult } from '../../common/dto/paginated-result';
import { toPrismaPagination, type PaginationQuery } from '../../common/dto/pagination.dto';
import { hashPassword } from '../../common/security/password.util';
import { assertUpdatable, assertWritten } from '../../common/utils/optimistic';
import { toUserView, type UserView } from './users.mapper';
import { UsersRepository, type UserWithRbac } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly repo: UsersRepository) {}

  /** Used by the auth layer; returns the raw entity (incl. passwordHash). */
  findRawById(id: string): Promise<UserWithRbac | null> {
    return this.repo.findByIdWithRbac(id);
  }

  async create(input: CreateUserInput, actorId: string): Promise<UserView> {
    const existing = await this.repo.findByEmailWithRbac(input.email);
    if (existing) throw new ConflictException('An account with this email already exists');

    const foundRoles = await this.repo.countRolesByIds(input.roleIds);
    if (foundRoles !== input.roleIds.length) {
      throw new BadRequestException('One or more roleIds are invalid');
    }

    const passwordHash = await hashPassword(input.password);
    const user = await this.repo.create({
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      status: input.status,
      ...(input.hospitalId ? { hospital: { connect: { id: input.hospitalId } } } : {}),
      ...(input.branchId ? { branch: { connect: { id: input.branchId } } } : {}),
      createdBy: actorId,
      updatedBy: actorId,
      userRoles: {
        create: input.roleIds.map((roleId) => ({ roleId, assignedBy: actorId })),
      },
    });
    return toUserView(user);
  }

  async update(id: string, input: UpdateUserInput, actorId: string): Promise<UserView> {
    const { version, hospitalId, branchId, ...changes } = input;
    const current = await this.repo.findByIdWithRbac(id);
    assertUpdatable(current, version, 'User');

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
      updatedBy: actorId,
    });
    assertWritten(count, 'User');
    return this.findById(id);
  }

  async updateStatus(id: string, input: UpdateUserStatusInput, actorId: string): Promise<UserView> {
    const current = await this.repo.findByIdWithRbac(id);
    assertUpdatable(current, input.version, 'User');

    const count = await this.repo.updateGuarded(id, input.version, {
      status: input.status,
      updatedBy: actorId,
    });
    assertWritten(count, 'User');
    // Revoke sessions when the account is no longer active.
    if (input.status !== 'ACTIVE') await this.repo.revokeAllTokens(id);
    return this.findById(id);
  }

  async remove(id: string, actorId: string): Promise<{ id: string }> {
    const current = await this.repo.findByIdWithRbac(id);
    if (!current) throw new NotFoundException('User not found');
    if (id === actorId) throw new BadRequestException('You cannot delete your own account');

    await this.repo.softDelete(id, actorId);
    await this.repo.revokeAllTokens(id);
    return { id };
  }

  async findById(id: string): Promise<UserView> {
    const user = await this.repo.findByIdWithRbac(id);
    if (!user) throw new NotFoundException('User not found');
    return toUserView(user);
  }

  async list(query: PaginationQuery & { role?: string }): Promise<PaginatedResult<UserView>> {
    const { skip, take } = toPrismaPagination(query);
    const { items, total } = await this.repo.findManyPaginated({
      skip,
      take,
      search: query.search,
      role: query.role,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
    return PaginatedResult.from(items.map(toUserView), total, query.page, query.limit);
  }
}
