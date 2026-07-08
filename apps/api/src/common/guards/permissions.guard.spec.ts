import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import { PERMISSIONS } from '@hms/shared';
import { PermissionsGuard } from './permissions.guard';
import type { AuthenticatedUser } from '../types/authenticated-user';

function contextWith(user: AuthenticatedUser | undefined): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

describe('PermissionsGuard', () => {
  const user: AuthenticatedUser = {
    id: 'u1',
    email: 'doc@hms.local',
    roles: ['DOCTOR'],
    permissions: [PERMISSIONS.PATIENT_READ, PERMISSIONS.PRESCRIPTION_CREATE],
    hospitalId: null,
    branchId: null,
  };

  function guardRequiring(required: string[] | undefined, isPublic = false): PermissionsGuard {
    const reflector = {
      getAllAndOverride: jest.fn((key: string) => (key === 'isPublic' ? isPublic : required)),
    } as unknown as Reflector;
    return new PermissionsGuard(reflector);
  }

  it('allows when the user holds the required permission', () => {
    const guard = guardRequiring([PERMISSIONS.PATIENT_READ]);
    expect(guard.canActivate(contextWith(user))).toBe(true);
  });

  it('allows public routes without checks', () => {
    const guard = guardRequiring([PERMISSIONS.USER_DELETE], true);
    expect(guard.canActivate(contextWith(undefined))).toBe(true);
  });

  it('allows routes that declare no permissions', () => {
    const guard = guardRequiring(undefined);
    expect(guard.canActivate(contextWith(user))).toBe(true);
  });

  it('denies when a required permission is missing', () => {
    const guard = guardRequiring([PERMISSIONS.USER_DELETE]);
    expect(() => guard.canActivate(contextWith(user))).toThrow(ForbiddenException);
  });
});
