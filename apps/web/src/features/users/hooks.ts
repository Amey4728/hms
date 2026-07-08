import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi, type CreateUserPayload } from './api';

const KEY = 'users';

export function useUsers(params: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () => usersApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useRoles() {
  return useQuery({ queryKey: ['rbac', 'roles'], queryFn: () => usersApi.roles() });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: [KEY] });
}

export function useCreateUser() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: (p: CreateUserPayload) => usersApi.create(p), onSuccess: invalidate });
}

export function useUpdateUserStatus() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (v: { id: string; version: number; status: string }) =>
      usersApi.updateStatus(v.id, v.version, v.status),
    onSuccess: invalidate,
  });
}

export function useDeleteUser() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: (id: string) => usersApi.remove(id), onSuccess: invalidate });
}
