import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PERMISSIONS } from '@hms/shared';
import { PageHeader } from '@/components/PageHeader';
import { PermissionGate } from '@/components/PermissionGate';
import { Badge, Button, Card, Field, PageSpinner, Select } from '@/components/ui';
import { toast } from '@/components/toast';
import { ApiError } from '@/lib/api-client';
import { titleCase } from '@/lib/format';
import { useDoctors, useQueue, useTransition } from './hooks';
import { STATUS_TONE, nextActions } from './status';

export function QueueBoardPage() {
  const doctors = useDoctors();
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const transition = useTransition();

  useEffect(() => {
    if (!doctorId && doctors.data?.[0]) setDoctorId(doctors.data[0].id);
  }, [doctors.data, doctorId]);

  const queue = useQueue(doctorId, date);

  const onError = (e: unknown) => toast.error(e instanceof ApiError ? e.message : 'Action failed');

  return (
    <div>
      <PageHeader
        title="Queue board"
        subtitle="Live consultation queue by token (auto-refreshes)"
        actions={
          <Link to="/appointments">
            <Button variant="secondary">
              <ArrowLeft className="h-4 w-4" /> Appointments
            </Button>
          </Link>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:max-w-xl">
        <Field label="Doctor">
          <Select value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
            <option value="" disabled>
              Select doctor…
            </option>
            {doctors.data?.map((d) => (
              <option key={d.id} value={d.id}>
                Dr. {d.firstName} {d.lastName}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Date">
          <Select value={date} onChange={(e) => setDate(e.target.value)}>
            {[0, 1, 2].map((offset) => {
              const d = new Date();
              d.setUTCDate(d.getUTCDate() + offset);
              const v = d.toISOString().slice(0, 10);
              return (
                <option key={v} value={v}>
                  {v} {offset === 0 ? '(today)' : ''}
                </option>
              );
            })}
          </Select>
        </Field>
      </div>

      {!doctorId ? (
        <Card className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">Select a doctor to view the queue.</Card>
      ) : queue.isLoading ? (
        <PageSpinner />
      ) : (queue.data?.length ?? 0) === 0 ? (
        <Card className="p-12 text-center text-sm text-slate-500 dark:text-slate-400">Queue is empty.</Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {queue.data?.map((a) => (
            <Card key={a.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-50 text-lg font-bold text-brand-700">
                  {a.tokenNumber}
                </div>
                <Badge tone={STATUS_TONE[a.status]}>{titleCase(a.status)}</Badge>
              </div>
              <p className="mt-3 font-medium text-slate-900 dark:text-slate-100">{a.patientName}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">{a.patientMrn}</p>
              <PermissionGate anyOf={[PERMISSIONS.APPOINTMENT_UPDATE]}>
                <div className="mt-3 flex gap-2">
                  {nextActions(a.status).map((na) => (
                    <Button
                      key={na.action}
                      variant="secondary"
                      className="px-3 py-1 text-xs"
                      onClick={() =>
                        transition.mutate(
                          { id: a.id, action: na.action, version: a.version },
                          { onSuccess: () => toast.success(`Appointment ${na.action}`), onError },
                        )
                      }
                    >
                      {na.label}
                    </Button>
                  ))}
                </div>
              </PermissionGate>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
