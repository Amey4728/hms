import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/** Prisma include that pulls a user's roles and their permissions in one query. */
const userWithRbac = Prisma.validator<Prisma.UserInclude>()({
  userRoles: {
    include: { role: { include: { rolePermissions: { include: { permission: true } } } } },
  },
});

export type UserWithRbac = Prisma.UserGetPayload<{ include: typeof userWithRbac }>;

/**
 * The only component that touches Prisma for users. Encapsulates soft-delete
 * filtering, RBAC includes, and the security-counter mutations.
 */
@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmailWithRbac(email: string): Promise<UserWithRbac | null> {
    return this.prisma.user.findFirst({
      where: { email, deletedAt: null },
      include: userWithRbac,
    });
  }

  findByIdWithRbac(id: string): Promise<UserWithRbac | null> {
    return this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: userWithRbac,
    });
  }

  create(data: Prisma.UserCreateInput): Promise<UserWithRbac> {
    return this.prisma.user.create({ data, include: userWithRbac });
  }

  async findManyPaginated(params: {
    skip: number;
    take: number;
    search?: string;
    role?: string;
    sortBy?: string;
    sortOrder: 'asc' | 'desc';
  }): Promise<{ items: UserWithRbac[]; total: number }> {
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(params.role
        ? { userRoles: { some: { role: { name: params.role, deletedAt: null } } } }
        : {}),
      ...(params.search
        ? {
            OR: [
              { email: { contains: params.search, mode: 'insensitive' } },
              { firstName: { contains: params.search, mode: 'insensitive' } },
              { lastName: { contains: params.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const sortable = new Set([
      'createdAt',
      'updatedAt',
      'email',
      'firstName',
      'lastName',
      'status',
    ]);
    const orderBy: Prisma.UserOrderByWithRelationInput =
      params.sortBy && sortable.has(params.sortBy)
        ? { [params.sortBy]: params.sortOrder }
        : { createdAt: params.sortOrder };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        include: userWithRbac,
        orderBy,
        skip: params.skip,
        take: params.take,
      }),
      this.prisma.user.count({ where }),
    ]);
    return { items, total };
  }

  async updateGuarded(
    id: string,
    expectedVersion: number,
    data: Prisma.UserUpdateInput,
  ): Promise<number> {
    const result = await this.prisma.user.updateMany({
      where: { id, version: expectedVersion, deletedAt: null },
      data: { ...data, version: { increment: 1 } },
    });
    return result.count;
  }

  softDelete(id: string, userId: string): Promise<Prisma.BatchPayload> {
    return this.prisma.user.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date(), updatedBy: userId },
    });
  }

  /** Revoke all active refresh tokens for a user (e.g. on suspend/deactivate). */
  revokeAllTokens(userId: string): Promise<Prisma.BatchPayload> {
    return this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  countRolesByIds(roleIds: string[]): Promise<number> {
    return this.prisma.role.count({ where: { id: { in: roleIds }, deletedAt: null } });
  }

  recordSuccessfulLogin(id: string): Promise<void> {
    return this.prisma.user
      .update({
        where: { id },
        data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
      })
      .then(() => undefined);
  }

  registerFailedLogin(id: string, lockUntil: Date | null): Promise<void> {
    return this.prisma.user
      .update({
        where: { id },
        data: {
          failedLoginAttempts: { increment: 1 },
          ...(lockUntil ? { lockedUntil: lockUntil } : {}),
        },
      })
      .then(() => undefined);
  }
}
