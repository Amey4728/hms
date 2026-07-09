import { useEffect, useState } from 'react';
import { Modal } from '@/components/Modal';
import { PatientPicker } from '@/components/PatientPicker';
import { Button, Field, Input, Select } from '@/components/ui';
import { toast } from '@/components/toast';
import { ApiError } from '@/lib/api-client';
import { cn } from '@/lib/cn';
import { useHospitals } from '@/features/lookups';
import { useAllLabTests, useCreateLabOrder } from './hooks';

export function CreateLabOrderModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const hospitals = useHospitals();
  const tests = useAllLabTests();
  const create = useCreateLabOrder();

  const [hospitalId, setHospitalId] = useState('');
  const [patientId, setPatientId] = useState('');
  const [testIds, setTestIds] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open) {
      setPatientId('');
      setTestIds([]);
      setNotes('');
    }
  }, [open]);
  useEffect(() => {
    if (!hospitalId && hospitals.data?.[0]) setHospitalId(hospitals.data[0].id);
  }, [hospitals.data, hospitalId]);

  const toggle = (id: string) => setTestIds((v) => (v.includes(id) ? v.filter((x) => x !== id) : [...v, id]));
  const canSubmit = hospitalId && patientId && testIds.length > 0;

  const submit = () =>
    create.mutate(
      { hospitalId, patientId, testIds, notes: notes || undefined },
      {
        onSuccess: (o) => {
          toast.success(`Order ${o.orderRef} created`);
          onClose();
        },
        onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Failed'),
      },
    );

  return (
    <Modal open={open} onClose={onClose} title="New lab order" width="max-w-xl">
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
        <PatientPicker value={patientId} onChange={setPatientId} required />
        <Field label="Tests" required>
          <div className="max-h-52 space-y-1 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800 p-2">
            {tests.data?.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => toggle(t.id)}
                className={cn(
                  'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm',
                  testIds.includes(t.id) ? 'bg-brand-50 text-brand-700' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50',
                )}
              >
                <span>
                  {t.name} <span className="text-xs text-slate-400 dark:text-slate-500">· {t.code}</span>
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">{t.price.toFixed(2)}</span>
              </button>
            ))}
            {tests.data?.length === 0 && <p className="px-2 py-1 text-sm text-slate-400 dark:text-slate-500">Add tests to the catalogue first.</p>}
          </div>
        </Field>
        <Field label="Notes">
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
        </Field>
        <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={create.isPending} disabled={!canSubmit}>
            Create order ({testIds.length})
          </Button>
        </div>
      </div>
    </Modal>
  );
}
