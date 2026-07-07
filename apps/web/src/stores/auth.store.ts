import { create } from 'zustand';
import { apiClient } from '@/lib/api-client';

export interface AuthUser {
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
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  user: AuthUser | null;
  status: AuthStatus;
  setSession: (user: AuthUser, accessToken: string) => void;
  clearSession: () => void;
  setStatus: (status: AuthStatus) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'loading',
  setSession: (user, accessToken) => {
    apiClient.setAccessToken(accessToken);
    set({ user, status: 'authenticated' });
  },
  clearSession: () => {
    apiClient.setAccessToken(null);
    set({ user: null, status: 'unauthenticated' });
  },
  setStatus: (status) => set({ status }),
}));
