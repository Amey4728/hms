import type { UserWithRbac } from './users.repository';

export interface UserView {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  status: string;
  hospitalId: string | null;
  branchId: string | null;
  roles: string[];
  permissions: string[];
  version: number;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Resolves the flat list of role names and the union of permission actions. */
export function resolveRbac(user: UserWithRbac): { roles: string[]; permissions: string[] } {
  const roles: string[] = [];
  const permissions = new Set<string>();
  for (const ur of user.userRoles) {
    roles.push(ur.role.name);
    for (const rp of ur.role.rolePermissions) {
      permissions.add(rp.permission.action);
    }
  }
  return { roles, permissions: [...permissions] };
}

/** Public, password-free representation of a user. */
export function toUserView(user: UserWithRbac): UserView {
  const { roles, permissions } = resolveRbac(user);
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    status: user.status,
    hospitalId: user.hospitalId,
    branchId: user.branchId,
    roles,
    permissions,
    version: user.version,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
