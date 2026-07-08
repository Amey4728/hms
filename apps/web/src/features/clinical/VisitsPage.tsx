import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Plus, Stethoscope } from 'lucide-react';
import { VISIT_TYPES, PERMISSIONS } from '@hms/shared';
import { PageHeader } from '@/components/PageHeader';
import { PermissionGate } from '@/components/PermissionGate';
import { Modal } from '@/components/Modal';
import { PatientPicker } from '@/components/PatientPicker';
import { Badge, Button, Card, Field, Input, PageSpinner, Select } from '@/components/ui';
import { toast } from '@/components/toast';
import { ApiError } from '@/lib/api-client';
import { formatDate, titleCase } from '@/lib/format';
import { useCreateVisit, useVisits } from './hooks';

export function VisitsPage() {
  const [status, setStatus] = useState('');
  const [open, setOpen] = useState(false);
  const create = useCreateVisit();
  const { data, isLoading } = useVisits({ limit: 20, status: status || undefined });
  const rows = data?.data ?? [];

  const [patientId, setPatientId] = useState('');
  const [visitType, setVisitType] = useState('OPD');
  const [chiefComplaint, setChief] = useState('');
  const [notes, setNotes] = useState('');
  const [vitals, setVitals] = useState({ bloodPressure: '', pulse: '', temperature: '', spo2: '' });

  useEffect(() => {
    if (open) { setPatientId(''); setVisitType('OPD'); setChief(''); setNotes(''); setVitals({ bloodPressure: '', pulse: '', temperature: '', spo2: '' }); }
  }, [open]);
  const onError = (e: unknown) => toast.error(e instanceof ApiError ? e.message : 'Failed');

  const submit = () => {
    const v: Record<string, unknown> = {};
    if (vitals.bloodPressure) v.bloodPressure = vitals.bloodPressure;
    if (vitals.pulse) v.pulse = Number(vitals.pulse);
    if (vitals.temperature) v.temperature = Number(vitals.temperature);
    if (vitals.spo2) v.spo2 = Number(vitals.spo2);
    create.mutate(
      { patientId, visitType, chiefComplaint: chiefComplaint || undefined, notes: notes || undefined, vitals: Object.keys(v).length ? v : undefined },
      { onSuccess: (visit) => { toast.success(`Visit ${visit.visitRef} opened`); setOpen(false); }, onError },
    );
  };

  return (
    <div>
      <PageHeader title="Clinical Visits" subtitle="Encounters, diagnoses, prescriptions & treatment plans"
        actions={<PermissionGate anyOf={[PERMISSIONS.PATIENT_UPDATE]}><Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New visit</Button></PermissionGate>} />

      <Card>
        <div className="border-b border-slate-100 p-4">
          <Select className="max-w-xs" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option value="OPEN">Open</option>
            <option value="CLOSED">Closed</option>
          </Select>
        </div>
        {isLoading ? <PageSpinner /> : rows.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500"><Stethoscope className="mx-auto mb-2 h-6 w-6 text-slate-300" />No visits.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr><th className="px-4 py-3 font-medium">Ref</th><th className="px-4 py-3 font-medium">Patient</th><th className="px-4 py-3 font-medium">Type</th><th className="px-4 py-3 font-medium">Date</th><th className="px-4 py-3 font-medium">Dx / Rx</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 text-right font-medium">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{v.visitRef}</td>
                    <td className="px-4 py-3"><div className="font-medium text-slate-900">{v.patientName}</div><div className="text-xs text-slate-400">{v.patientMrn}</div></td>
                    <td className="px-4 py-3 text-slate-600">{v.visitType}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(v.visitDate)}</td>
                    <td className="px-4 py-3 text-slate-600">{v.diagnoses.length} / {v.prescriptions.length}</td>
                    <td className="px-4 py-3"><Badge tone={v.status === 'OPEN' ? 'info' : 'neutral'}>{titleCase(v.status)}</Badge></td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/visits/${v.id}`}><Button variant="ghost" className="px-2 py-1"><Eye className="h-4 w-4" /></Button></Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="New clinical visit" width="max-w-xl">
        <div className="space-y-4">
          <PatientPicker value={patientId} onChange={setPatientId} required />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Visit type"><Select value={visitType} onChange={(e) => setVisitType(e.target.value)}>{VISIT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</Select></Field>
            <Field label="Chief complaint"><Input value={chiefComplaint} onChange={(e) => setChief(e.target.value)} placeholder="Fever, cough" /></Field>
          </div>
          <Field label="Notes"><Input value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase text-slate-400">Vitals (optional)</p>
            <div className="grid grid-cols-4 gap-2">
              <Input placeholder="BP" value={vitals.bloodPressure} onChange={(e) => setVitals((v) => ({ ...v, bloodPressure: e.target.value }))} />
              <Input placeholder="Pulse" type="number" value={vitals.pulse} onChange={(e) => setVitals((v) => ({ ...v, pulse: e.target.value }))} />
              <Input placeholder="Temp °C" type="number" value={vitals.temperature} onChange={(e) => setVitals((v) => ({ ...v, temperature: e.target.value }))} />
              <Input placeholder="SpO2 %" type="number" value={vitals.spo2} onChange={(e) => setVitals((v) => ({ ...v, spo2: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} loading={create.isPending} disabled={!patientId}>Open visit</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
