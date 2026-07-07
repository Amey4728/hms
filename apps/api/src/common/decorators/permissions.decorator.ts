import { SetMetadata } from '@nestjs/common';
import type { PermissionAction } from '@hms/shared';

export const PERMISSIONS_KEY = 'requiredPermissions';

/**
 * Declares the permissions required to access a route. PermissionsGuard checks
 * these against the authenticated user's resolved permission set (AND semantics).
 *
 * @example @Permissions('patient.read')
 */
export const Permissions = (...permissions: PermissionAction[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
