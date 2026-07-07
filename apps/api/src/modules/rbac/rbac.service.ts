import { Injectable, NotFoundException } from '@nestjs/common';
import type { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface RoleView {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  isSystem: boolean;
  permissions: string[];
}

export interface PermissionView {
  id: string;
  action: string;
  resource: string;
  description: string | null;
}

@Injectable()
export class RbacService {
  constructor(private readonly prisma: PrismaService) {}

  async listRoles(): Promise<RoleView[]> {
    const roles = await this.prisma.role.findMany({
      where: { deletedAt: null },
      include: { rolePermissions: { include: { permission: true } } },
      orderBy: { name: 'asc' },
    });
    return roles.map((r) => ({
      id: r.id,
      name: r.name,
      displayName: r.displayName,
      description: r.description,
      isSystem: r.isSystem,
      permissions: r.rolePermissions.map((rp) => rp.permission.action),
    }));
  }

  async getRoleByName(name: string): Promise<Role> {
    const role = await this.prisma.role.findFirst({ where: { name, deletedAt: null } });
    if (!role) throw new NotFoundException(`Role "${name}" not found`);
    return role;
  }

  async listPermissions(): Promise<PermissionView[]> {
    const permissions = await this.prisma.permission.findMany({
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    });
    return permissions.map((p) => ({
      id: p.id,
      action: p.action,
      resource: p.resource,
      description: p.description,
    }));
  }

  /** Idempotently grants a role to a user (by role id). */
  async assignRoleToUser(userId: string, roleId: string, assignedBy?: string): Promise<void> {
    await this.prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId } },
      create: { userId, roleId, assignedBy },
      update: {},
    });
  }

  async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    await this.prisma.userRole.deleteMany({ where: { userId, roleId } });
  }
}
