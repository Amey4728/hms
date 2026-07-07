import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import {
  ALL_PERMISSIONS,
  ROLE_DEFINITIONS,
  ROLES,
  splitPermission,
  type PermissionAction,
} from '@hms/shared';

const prisma = new PrismaClient();

const ARGON2_OPTS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
};

async function seedPermissions(): Promise<Map<PermissionAction, string>> {
  const idByAction = new Map<PermissionAction, string>();
  for (const action of ALL_PERMISSIONS) {
    const { resource } = splitPermission(action);
    const permission = await prisma.permission.upsert({
      where: { action },
      create: { action, resource },
      update: { resource },
    });
    idByAction.set(action, permission.id);
  }
  console.log(`✓ Seeded ${idByAction.size} permissions`);
  return idByAction;
}

async function seedRoles(permissionIds: Map<PermissionAction, string>): Promise<void> {
  for (const def of ROLE_DEFINITIONS) {
    const role = await prisma.role.upsert({
      where: { name: def.name },
      create: {
        name: def.name,
        displayName: def.displayName,
        description: def.description,
        isSystem: true,
      },
      update: { displayName: def.displayName, description: def.description, isSystem: true },
    });

    const actions: PermissionAction[] =
      def.permissions[0] === '*' ? ALL_PERMISSIONS : (def.permissions as PermissionAction[]);

    // Reset system-role permissions to match the source-of-truth definition.
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    await prisma.rolePermission.createMany({
      data: actions
        .map((a) => permissionIds.get(a))
        .filter((id): id is string => Boolean(id))
        .map((permissionId) => ({ roleId: role.id, permissionId })),
      skipDuplicates: true,
    });
  }
  console.log(`✓ Seeded ${ROLE_DEFINITIONS.length} roles`);
}

async function seedSuperAdmin(): Promise<void> {
  const email = process.env.SEED_SUPERADMIN_EMAIL ?? 'superadmin@hms.local';
  const password = process.env.SEED_SUPERADMIN_PASSWORD ?? 'SuperAdmin@123';

  const superAdminRole = await prisma.role.findUniqueOrThrow({ where: { name: ROLES.SUPER_ADMIN } });
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`• Super admin already exists (${email})`);
    return;
  }

  const passwordHash = await argon2.hash(password, ARGON2_OPTS);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      userRoles: { create: { roleId: superAdminRole.id } },
    },
  });
  console.log(`✓ Created super admin: ${user.email} / ${password}`);
}

async function main(): Promise<void> {
  console.log('Seeding HMS database…');
  const permissionIds = await seedPermissions();
  await seedRoles(permissionIds);
  await seedSuperAdmin();
  console.log('Seed complete.');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
