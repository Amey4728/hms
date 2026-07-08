import { useEffect, useState } from 'react';
import { Ban, CheckCircle2, ChevronLeft, ChevronRight, Plus, Search, Trash2 } from 'lucide-react';
import { PERMISSIONS } from '@hms/shared';
import { PageHeader } from '@/components/PageHeader';
import { PermissionGate } from '@/components/PermissionGate';
import { Badge, Button, Card, Input, PageSpinner } from '@/components/ui';
import { toast } from '@/components/toast';
import { ApiError } from '@/lib/api-client';
import { titleCase } from '@/lib/format';
import { CreateUserModal } from './CreateUserModal';
import { useDeleteUser, useUpdateUserStatus, useUsers } from './hooks';
import type { User } from './api';

const PAGE_SIZE = 10;

function statusTone(s: string) {
  if (s === 'ACTIVE') return 'success' as const;
  if (s === 'SUSPENDED') return 'danger' as const;
  return 'neutral' as const;
}

export function UsersListPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const statusMut = useUpdateUserStatus();
  const del = useDeleteUser();

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isError, error } = useUsers({ page, limit: PAGE_SIZE, search });
  const rows = data?.data ?? [];
  const meta = data?.meta;
  const onError = (e: unknown) => toast.error(e instanceof ApiError ? e.message : 'Action failed');

  const toggleStatus = (u: User) => {
    const next = u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    statusMut.mutate(
      { id: u.id, version: u.version, status: next },
      { onSuccess: () => toast.success(`User ${next === 'ACTIVE' ? 'activated' : 'suspended'}`), onError },
    );
  };

  const remove = (u: User) => {
    if (!window.confirm(`Delete ${u.firstName} ${u.lastName}?`)) return;
    del.mutate(u.id, { onSuccess: () => toast.success('User deleted'), onError });
  };

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle="Manage staff accounts and roles"
        actions={
          <PermissionGate anyOf={[PERMISSIONS.USER_CREATE]}>
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4" /> New user
            </Button>
          </PermissionGate>
        }
      />

      <Card>
        <div className="border-b border-slate-100 p-4">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input className="pl-9" placeholder="Search name or email…" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
          </div>
        </div>

        {isLoading ? (
          <PageSpinner />
        ) : isError ? (
          <div className="p-8 text-center text-sm text-red-600">
            {error instanceof ApiError ? error.message : 'Failed to load'}
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Roles</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {u.firstName} {u.lastName}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {u.roles.map((r) => (
                          <Badge key={r} tone="info">
                            {titleCase(r)}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={statusTone(u.status)}>{titleCase(u.status)}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <PermissionGate anyOf={[PERMISSIONS.USER_UPDATE]}>
                          <Button
                            variant="ghost"
                            className="px-2 py-1 text-xs"
                            onClick={() => toggleStatus(u)}
                            title={u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                          >
                            {u.status === 'ACTIVE' ? (
                              <Ban className="h-4 w-4 text-amber-500" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            )}
                          </Button>
                        </PermissionGate>
                        <PermissionGate anyOf={[PERMISSIONS.USER_DELETE]}>
                          <Button
                            variant="ghost"
                            className="px-2 py-1 text-red-500 hover:bg-red-50"
                            onClick={() => remove(u)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </PermissionGate>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta && meta.total > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 p-4 text-sm text-slate-600">
            <span>
              Page {meta.page} of {meta.totalPages} · {meta.total} total
            </span>
            <div className="flex gap-2">
              <Button variant="secondary" className="px-3 py-1.5" disabled={!meta.hasPreviousPage} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4" /> Prev
              </Button>
              <Button variant="secondary" className="px-3 py-1.5" disabled={!meta.hasNextPage} onClick={() => setPage((p) => p + 1)}>
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <CreateUserModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
