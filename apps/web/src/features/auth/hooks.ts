import { useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import type { LoginInput } from '@hms/shared';
import { queryClient } from '@/lib/query-client';
import { useAuthStore } from '@/stores/auth.store';
import { authApi } from './api';

/** Restores the session on app load via the refresh cookie. */
export function useAuthBootstrap(): void {
  const setSession = useAuthStore((s) => s.setSession);
  const clearSession = useAuthStore((s) => s.clearSession);

  useEffect(() => {
    let active = true;
    authApi
      .refresh()
      .then((session) => {
        if (active) setSession(session.user, session.accessToken);
      })
      .catch(() => {
        if (active) clearSession();
      });
    return () => {
      active = false;
    };
  }, [setSession, clearSession]);
}

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession);
  return useMutation({
    mutationFn: (input: LoginInput) => authApi.login(input),
    onSuccess: (session) => setSession(session.user, session.accessToken),
  });
}

export function useLogout() {
  const clearSession = useAuthStore((s) => s.clearSession);
  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      clearSession();
      queryClient.clear();
    },
  });
}
