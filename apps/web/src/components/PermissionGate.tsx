import type { ReactNode } from 'react';
import type { PermissionAction } from '@hms/shared';
import { usePermissions } from '@/hooks/usePermissions';

/** Renders children only if the user holds any of the required permissions. */
export function PermissionGate({
  anyOf,
  children,
  fallback = null,
}: {
  anyOf: PermissionAction[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { hasAny } = usePermissions();
  return <>{hasAny(anyOf) ? children : fallback}</>;
}
