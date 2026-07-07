/**
 * The principal attached to `request.user` after JWT authentication. It carries
 * the resolved permission set so PermissionsGuard can authorise without a DB hit.
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  roles: string[];
  permissions: string[];
  hospitalId: string | null;
  branchId: string | null;
}

/** Shape of the signed access-token payload. */
export interface AccessTokenPayload {
  sub: string;
  email: string;
  roles: string[];
  permissions: string[];
  hospitalId: string | null;
  branchId: string | null;
}
