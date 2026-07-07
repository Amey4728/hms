import { useMemo } from 'react';
import type { PermissionAction } from '@hms/shared';
import { useAuthStore } from '@/stores/auth.store';

export function usePermissions() {
  const permissions = useAuthStore((s) => s.user?.permissions);

  return useMemo(() => {
    const set = new Set(permissions ?? []);
    return {
      has: (permission: PermissionAction) => set.has(permission),
      hasAny: (perms: PermissionAction[]) => perms.some((p) => set.has(p)),
      hasAll: (perms: PermissionAction[]) => perms.every((p) => set.has(p)),
    };
  }, [permissions]);
}
