import { useEffect, useState } from 'react';
import { Modal } from '@/components/Modal';
import { Button, Field, Input, Select, Spinner } from '@/components/ui';
import { toast } from '@/components/toast';
import { ApiError } from '@/lib/api-client';
import { cn } from '@/lib/cn';
import { useBook, useDoctors, useHospitalsLookup, usePatientSearch, useSlots, useWalkIn } from './hooks';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function BookAppointmentModal({
  open,
  mode,
  onClose,
}: {
  open: boolean;
  mode: 'book' | 'walkin';
  onClose: () => void;
}) {
  const doctors = useDoctors();
  const hospitals = useHospitalsLookup();
  const book = useBook();
  const walkIn = useWalkIn();

  const [hospitalId, setHospitalId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [patientTerm, setPatientTerm] = useState('');
  const [patientId, setPatientId] = useState('');
  const [date, setDate] = useState(todayStr());
  const [slotStart, setSlotStart] = useState('');
  const [duration, setDuration] = useState(30);
  const [reason, setReason] = useState('');

  const patients = usePatientSearch(patientTerm);
  const slots = useSlots(doctorId, date, mode === 'book');

  useEffect(() => {
    if (open) {
      setHospitalId('');
      setDoctorId('');
      setPatientTerm('');
      setPatientId('');
      setDate(todayStr());
      setSlotStart('');
      setDuration(30);
      setReason('');
    }
  }, [open, mode]);

  // Default hospital to the first one.
  useEffect(() => {
    if (!hospitalId && hospitals.data?.[0]) setHospitalId(hospitals.data[0].id);
  }, [hospitals.data, hospitalId]);

  const pending = book.isPending || walkIn.isPending;
  const canSubmit =
    hospitalId && doctorId && patientId && (mode === 'walkin' || slotStart);

  const submit = () => {
    const onError = (e: unknown) =>
      toast.error(e instanceof ApiError ? e.message : 'Failed');
    if (mode === 'walkin') {
      walkIn.mutate(
        { hospitalId, doctorId, patientId, durationMinutes: duration, reason: reason || undefined },
        {
          onSuccess: (a) => {
            toast.success(`Walk-in ${a.appointmentRef} · token ${a.tokenNumber}`);
            onClose();
          },
          onError,
        },
      );
    } else {
      book.mutate(
        {
          hospitalId,
          doctorId,
          patientId,
          scheduledStart: slotStart,
          durationMinutes: duration,
          reason: reason || undefined,
        },
        {
          onSuccess: (a) => {
            toast.success(`Booked ${a.appointmentRef}`);
            onClose();
          },
          onError,
        },
      );
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={mode === 'walkin' ? 'Register walk-in' : 'Book appointment'} width="max-w-xl">
      <div className="space-y-4">
        <Field label="Hospital" required>
          <Select value={hospitalId} onChange={(e) => setHospitalId(e.target.value)}>
            <option value="" disabled>
              Select hospital…
            </option>
            {hospitals.data?.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Doctor" required>
          <Select
            value={doctorId}
            onChange={(e) => {
              setDoctorId(e.target.value);
              setSlotStart('');
            }}
          >
            <option value="" disabled>
              {doctors.isLoading ? 'Loading…' : 'Select doctor…'}
            </option>
            {doctors.data?.map((d) => (
              <option key={d.id} value={d.id}>
                Dr. {d.firstName} {d.lastName}
              </option>
            ))}
          </Select>
          {doctors.data?.length === 0 && (
            <p className="mt-1 text-xs text-amber-600">No users with the DOCTOR role yet.</p>
          )}
        </Field>

        <Field label="Patient" required>
          <Input
            placeholder="Search patient by name / phone…"
            value={patientTerm}
            onChange={(e) => {
              setPatientTerm(e.target.value);
              setPatientId('');
            }}
          />
          {patientTerm && !patientId && (
            <div className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800">
              {patients.data?.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setPatientId(p.id);
                    setPatientTerm(`${p.firstName} ${p.lastName} · ${p.mrn}`);
                  }}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  {p.firstName} {p.lastName} <span className="text-slate-400 dark:text-slate-500">· {p.mrn}</span>
                </button>
              ))}
              {patients.data?.length === 0 && (
                <p className="px-3 py-2 text-sm text-slate-400 dark:text-slate-500">No matches</p>
              )}
            </div>
          )}
        </Field>

        <div className="grid grid-cols-2 gap-4">
          {mode === 'book' && (
            <Field label="Date" required>
              <Input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setSlotStart('');
                }}
              />
            </Field>
          )}
          <Field label="Duration (min)">
            <Select value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
              {[15, 20, 30, 45, 60].map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {mode === 'book' && doctorId && (
          <Field label="Available slots" required>
            {slots.isLoading ? (
              <Spinner />
            ) : slots.data && slots.data.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {slots.data.map((s) => (
                  <button
                    key={s.start}
                    onClick={() => setSlotStart(s.start)}
                    className={cn(
                      'rounded-lg border px-3 py-1.5 text-sm',
                      slotStart === s.start
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50',
                    )}
                  >
                    {new Date(s.start).toISOString().slice(11, 16)}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 dark:text-slate-500">
                No free slots — add availability for this doctor/day, or pick another date.
              </p>
            )}
          </Field>
        )}

        <Field label="Reason">
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Optional" />
        </Field>

        <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={pending} disabled={!canSubmit}>
            {mode === 'walkin' ? 'Register walk-in' : 'Book'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
