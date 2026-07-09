import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarPlus, ChevronLeft, ChevronRight, ListOrdered, UserPlus, XCircle } from 'lucide-react';
import { APPOINTMENT_STATUSES, PERMISSIONS } from '@hms/shared';
import { PageHeader } from '@/components/PageHeader';
import { PermissionGate } from '@/components/PermissionGate';
import { Badge, Button, Card, PageSpinner, Select } from '@/components/ui';
import { toast } from '@/components/toast';
import { ApiError } from '@/lib/api-client';
import { titleCase } from '@/lib/format';
import { BookAppointmentModal } from './BookAppointmentModal';
import { useAppointments, useCancel, useTransition } from './hooks';
import { CANCELLABLE, STATUS_TONE, nextActions } from './status';
import type { Appointment } from './types';

const PAGE_SIZE = 10;

function fmt(dt: string) {
  const d = new Date(dt);
  return `${d.toISOString().slice(0, 10)} ${d.toISOString().slice(11, 16)}`;
}

export function AppointmentsListPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [modal, setModal] = useState<null | 'book' | 'walkin'>(null);
  const transition = useTransition();
  const cancel = useCancel();

  const { data, isLoading, isError, error } = useAppointments({
    page,
    limit: PAGE_SIZE,
    status: status || undefined,
  });
  const rows = data?.data ?? [];
  const meta = data?.meta;

  const onError = (e: unknown) => toast.error(e instanceof ApiError ? e.message : 'Action failed');

  const doAction = (a: Appointment, action: 'check-in' | 'start' | 'complete' | 'no-show') =>
    transition.mutate(
      { id: a.id, action, version: a.version },
      { onSuccess: () => toast.success(`Appointment ${action}`), onError },
    );

  const doCancel = (a: Appointment) => {
    const reason = window.prompt('Cancellation reason (optional):') ?? undefined;
    cancel.mutate(
      { id: a.id, version: a.version, reason },
      { onSuccess: () => toast.success('Appointment cancelled'), onError },
    );
  };

  return (
    <div>
      <PageHeader
        title="Appointments"
        subtitle="Book, check in, and track the consultation queue"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to="/appointments/queue">
              <Button variant="secondary">
                <ListOrdered className="h-4 w-4" /> Queue board
              </Button>
            </Link>
            <PermissionGate anyOf={[PERMISSIONS.APPOINTMENT_CREATE]}>
              <Button variant="secondary" onClick={() => setModal('walkin')}>
                <UserPlus className="h-4 w-4" /> Walk-in
              </Button>
              <Button onClick={() => setModal('book')}>
                <CalendarPlus className="h-4 w-4" /> Book
              </Button>
            </PermissionGate>
          </div>
        }
      />

      <Card>
        <div className="border-b border-slate-100 dark:border-slate-800 p-4">
          <Select
            className="max-w-xs"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            {APPOINTMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {titleCase(s)}
              </option>
            ))}
          </Select>
        </div>

        {isLoading ? (
          <PageSpinner />
        ) : isError ? (
          <div className="p-8 text-center text-sm text-red-600">
            {error instanceof ApiError ? error.message : 'Failed to load'}
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500 dark:text-slate-400">No appointments.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-left text-xs uppercase text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Ref</th>
                  <th className="px-4 py-3 font-medium">Patient</th>
                  <th className="px-4 py-3 font-medium">Doctor</th>
                  <th className="px-4 py-3 font-medium">When</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Token</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">{a.appointmentRef}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 dark:text-slate-100">{a.patientName}</div>
                      <div className="text-xs text-slate-400 dark:text-slate-500">{a.patientMrn}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">Dr. {a.doctorName}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{fmt(a.scheduledStart)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={a.type === 'WALK_IN' ? 'warning' : 'neutral'}>
                        {titleCase(a.type)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">{a.tokenNumber ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS_TONE[a.status]}>{titleCase(a.status)}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center justify-end gap-1">
                        <PermissionGate anyOf={[PERMISSIONS.APPOINTMENT_UPDATE]}>
                          {nextActions(a.status).map((na) => (
                            <Button
                              key={na.action}
                              variant="secondary"
                              className="px-2 py-1 text-xs"
                              onClick={() => doAction(a, na.action)}
                            >
                              {na.label}
                            </Button>
                          ))}
                        </PermissionGate>
                        {CANCELLABLE.includes(a.status) && (
                          <PermissionGate anyOf={[PERMISSIONS.APPOINTMENT_CANCEL]}>
                            <Button
                              variant="ghost"
                              className="px-2 py-1 text-red-500 hover:bg-red-50"
                              onClick={() => doCancel(a)}
                              title="Cancel"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </PermissionGate>
                        )}
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

      <BookAppointmentModal open={modal !== null} mode={modal ?? 'book'} onClose={() => setModal(null)} />
    </div>
  );
}
