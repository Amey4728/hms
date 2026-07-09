import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Eye, Plus, Search, Trash2 } from 'lucide-react';
import { PERMISSIONS } from '@hms/shared';
import { PageHeader } from '@/components/PageHeader';
import { PermissionGate } from '@/components/PermissionGate';
import { Badge, Button, Card, Input, PageSpinner } from '@/components/ui';
import { toast } from '@/components/toast';
import { ApiError } from '@/lib/api-client';
import { calculateAge, formatDate, titleCase } from '@/lib/format';
import { usePatients, useDeletePatient } from './hooks';
import type { Patient } from './types';

const PAGE_SIZE = 10;

function statusTone(status: string) {
  if (status === 'ACTIVE') return 'success' as const;
  if (status === 'DECEASED') return 'danger' as const;
  return 'neutral' as const;
}

export function PatientsListPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const del = useDeletePatient();

  // Debounce search input.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isError, error } = usePatients({ page, limit: PAGE_SIZE, search });
  const patients = data?.data ?? [];
  const meta = data?.meta;

  const handleDelete = (p: Patient) => {
    if (!window.confirm(`Delete patient ${p.firstName} ${p.lastName} (${p.mrn})?`)) return;
    del.mutate(p.id, {
      onSuccess: () => toast.success('Patient deleted'),
      onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Delete failed'),
    });
  };

  return (
    <div>
      <PageHeader
        title="Patients"
        subtitle="Register and manage patient records"
        actions={
          <PermissionGate anyOf={[PERMISSIONS.PATIENT_CREATE]}>
            <Link to="/patients/new">
              <Button>
                <Plus className="h-4 w-4" /> Register patient
              </Button>
            </Link>
          </PermissionGate>
        }
      />

      <Card>
        <div className="border-b border-slate-100 dark:border-slate-800 p-4">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <Input
              className="pl-9"
              placeholder="Search name, phone, or MRN number…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <PageSpinner />
        ) : isError ? (
          <div className="p-8 text-center text-sm text-red-600">
            {error instanceof ApiError ? error.message : 'Failed to load patients'}
          </div>
        ) : patients.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500 dark:text-slate-400">No patients found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-left text-xs uppercase text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">MRN</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Gender</th>
                  <th className="px-4 py-3 font-medium">Age</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {patients.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">{p.mrn}</td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                      {p.firstName} {p.lastName}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{titleCase(p.gender)}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{calculateAge(p.dateOfBirth)}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{p.phone}</td>
                    <td className="px-4 py-3">
                      <Badge tone={statusTone(p.status)}>{titleCase(p.status)}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/patients/${p.id}`} title="View profile">
                          <Button variant="ghost" className="px-2 py-1">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <PermissionGate anyOf={[PERMISSIONS.PATIENT_DELETE]}>
                          <Button
                            variant="ghost"
                            className="px-2 py-1 text-red-500 hover:bg-red-50"
                            onClick={() => handleDelete(p)}
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
          <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 p-4 text-sm text-slate-600 dark:text-slate-300">
            <span>
              Page {meta.page} of {meta.totalPages} · {meta.total} total
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="px-3 py-1.5"
                disabled={!meta.hasPreviousPage}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </Button>
              <Button
                variant="secondary"
                className="px-3 py-1.5"
                disabled={!meta.hasNextPage}
                onClick={() => setPage((p) => p + 1)}
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
