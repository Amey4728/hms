import type { LoginInput } from '@hms/shared';
import { apiClient } from '@/lib/api-client';
import type { AuthUser } from '@/stores/auth.store';

interface SessionPayload {
  user: AuthUser;
  accessToken: string;
}

/**
 * De-duplicates concurrent refresh calls. Refresh tokens rotate on every use and
 * the server revokes the whole family if an already-used token is replayed
 * (theft detection). React StrictMode / multiple mounts can fire refresh twice
 * with the same cookie, so we must collapse them into one in-flight request.
 */
let refreshInFlight: Promise<SessionPayload> | null = null;

export const authApi = {
  login(input: LoginInput) {
    return apiClient.post<SessionPayload>('/auth/login', input).then((r) => r.data);
  },
  /** Cookie-based session restore. skipAuthRefresh avoids recursion on 401. */
  refresh() {
    if (!refreshInFlight) {
      refreshInFlight = apiClient
        .post<SessionPayload>('/auth/refresh', undefined, { skipAuthRefresh: true })
        .then((r) => r.data)
        .finally(() => {
          refreshInFlight = null;
        });
    }
    return refreshInFlight;
  },
  logout() {
    return apiClient.post<null>('/auth/logout').then((r) => r.data);
  },
  me() {
    return apiClient.get<AuthUser>('/auth/me').then((r) => r.data);
  },
};
