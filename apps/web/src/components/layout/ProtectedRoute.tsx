import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { PageSpinner } from '@/components/ui';
import { useAuthStore } from '@/stores/auth.store';

/** Gates the app shell: waits for bootstrap, then requires an authenticated session. */
export function ProtectedRoute() {
  const status = useAuthStore((s) => s.status);
  const location = useLocation();

  if (status === 'loading') return <PageSpinner />;
  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}
