import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { DIAGNOSIS_TYPES, PERMISSIONS } from '@hms/shared';
import { PageHeader } from '@/components/PageHeader';
import { PermissionGate } from '@/components/PermissionGate';
import { Modal } from '@/components/Modal';
import { Badge, Button, Card, Field, Input, PageSpinner, Select } from '@/components/ui';
import { toast } from '@/components/toast';
import { ApiError } from '@/lib/api-client';
import { formatDate, titleCase } from '@/lib/format';
import { useVisit, useVisitActions } from './hooks';

function Section({ title, count, action, children }: { title: string; count: number; action?: ReactNode; children: ReactNode }) {
  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
          <Badge tone="info">{count}</Badge>
        </div>
        {action}
      </div>
      {children}
    </Card>
  );
}

const DRUG = { drugName: '', dosage: '', frequency: '', duration: '', instructions: '' };

export function VisitDetailPage() {
  const { id = '' } = useParams();
  const { data: visit, isLoading, isError } = useVisit(id);
  const actions = useVisitActions(id);

  const [dx, setDx] = useState({ description: '', code: '', type: 'PROVISIONAL', notes: '' });
  const [rxOpen, setRxOpen] = useState(false);
  const [drugs, setDrugs] = useState([{ ...DRUG }]);
  const [planOpen, setPlanOpen] = useState(false);
  const [plan, setPlan] = useState({ title: '', description: '' });

  const onError = (e: unknown) => toast.error(e instanceof ApiError ? e.message : 'Failed');
  if (isLoading) return <PageSpinner />;
  if (isError || !visit) return <Card className="p-8 text-center text-sm text-red-600">Visit not found. <Link to="/visits" className="underline">Back</Link></Card>;

  const open = visit.status === 'OPEN';

  const addDx = () => actions.addDiagnosis.mutate(
    { description: dx.description, code: dx.code || undefined, type: dx.type, notes: dx.notes || undefined },
    { onSuccess: () => { toast.success('Diagnosis added'); setDx({ description: '', code: '', type: 'PROVISIONAL', notes: '' }); }, onError },
  );
  const submitRx = () => actions.prescribe.mutate(
    { patientId: visit.patientId, visitId: visit.id, items: drugs.filter((d) => d.drugName).map((d) => ({ ...d, instructions: d.instructions || undefined })) },
    { onSuccess: (p) => { toast.success(`Prescription ${p.prescriptionRef} created`); setRxOpen(false); setDrugs([{ ...DRUG }]); }, onError },
  );
  const submitPlan = () => actions.plan.mutate(
    { patientId: visit.patientId, visitId: visit.id, title: plan.title, description: plan.description || undefined },
    { onSuccess: () => { toast.success('Treatment plan added'); setPlanOpen(false); setPlan({ title: '', description: '' }); }, onError },
  );

  const v = visit.vitals ?? {};

  return (
    <div>
      <PageHeader
        title={`Visit ${visit.visitRef}`}
        subtitle={`${visit.patientName} · ${visit.patientMrn} · ${visit.visitType} · ${formatDate(visit.visitDate)}`}
        actions={
          <div className="flex items-center gap-2">
            <Badge tone={open ? 'info' : 'neutral'}>{titleCase(visit.status)}</Badge>
            {open && (
              <PermissionGate anyOf={[PERMISSIONS.PATIENT_UPDATE]}>
                <Button variant="secondary" onClick={() => actions.close.mutate({ version: visit.version }, { onSuccess: () => toast.success('Visit closed'), onError })}>Close visit</Button>
              </PermissionGate>
            )}
            <Link to="/visits"><Button variant="secondary"><ArrowLeft className="h-4 w-4" /> Back</Button></Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Overview + vitals */}
        <Card className="p-5 lg:col-span-2">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div><p className="text-xs uppercase text-slate-400 dark:text-slate-500">Chief complaint</p><p className="text-sm font-medium text-slate-800 dark:text-slate-200">{visit.chiefComplaint || '—'}</p></div>
            <div><p className="text-xs uppercase text-slate-400 dark:text-slate-500">BP</p><p className="text-sm font-medium text-slate-800 dark:text-slate-200">{v.bloodPressure ?? '—'}</p></div>
            <div><p className="text-xs uppercase text-slate-400 dark:text-slate-500">Pulse</p><p className="text-sm font-medium text-slate-800 dark:text-slate-200">{v.pulse ?? '—'}</p></div>
            <div><p className="text-xs uppercase text-slate-400 dark:text-slate-500">Temp</p><p className="text-sm font-medium text-slate-800 dark:text-slate-200">{v.temperature ?? '—'}</p></div>
            <div><p className="text-xs uppercase text-slate-400 dark:text-slate-500">SpO2</p><p className="text-sm font-medium text-slate-800 dark:text-slate-200">{v.spo2 ?? '—'}</p></div>
          </div>
          {visit.notes && <p className="mt-3 border-t border-slate-100 dark:border-slate-800 pt-3 text-sm text-slate-600 dark:text-slate-300">{visit.notes}</p>}
        </Card>

        {/* Diagnoses */}
        <Section title="Diagnoses" count={visit.diagnoses.length}>
          <ul className="mb-3 space-y-2">
            {visit.diagnoses.map((d) => (
              <li key={d.id} className="flex items-start justify-between rounded-lg border border-slate-100 dark:border-slate-800 p-2 text-sm">
                <span><span className="font-medium text-slate-800 dark:text-slate-200">{d.description}</span>{d.code ? ` (${d.code})` : ''} <Badge tone="neutral">{titleCase(d.type)}</Badge></span>
                {open && (
                  <PermissionGate anyOf={[PERMISSIONS.DIAGNOSIS_CREATE]}>
                    <button onClick={() => actions.removeDiagnosis.mutate(d.id, { onSuccess: () => toast.success('Removed'), onError })} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                  </PermissionGate>
                )}
              </li>
            ))}
            {visit.diagnoses.length === 0 && <p className="text-sm text-slate-400 dark:text-slate-500">None yet.</p>}
          </ul>
          {open && (
            <PermissionGate anyOf={[PERMISSIONS.DIAGNOSIS_CREATE]}>
              <div className="flex items-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                <div className="flex-1"><Field label="Diagnosis"><Input value={dx.description} onChange={(e) => setDx((s) => ({ ...s, description: e.target.value }))} placeholder="Acute URI" /></Field></div>
                <Field label="Code"><Input className="w-24" value={dx.code} onChange={(e) => setDx((s) => ({ ...s, code: e.target.value }))} placeholder="J06.9" /></Field>
                <Field label="Type"><Select value={dx.type} onChange={(e) => setDx((s) => ({ ...s, type: e.target.value }))}>{DIAGNOSIS_TYPES.map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}</Select></Field>
                <Button onClick={addDx} loading={actions.addDiagnosis.isPending} disabled={!dx.description}>Add</Button>
              </div>
            </PermissionGate>
          )}
        </Section>

        {/* Prescriptions */}
        <Section title="Prescriptions" count={visit.prescriptions.length}
          action={open && <PermissionGate anyOf={[PERMISSIONS.PRESCRIPTION_CREATE]}><Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => setRxOpen(true)}><Plus className="h-4 w-4" /> New</Button></PermissionGate>}>
          <ul className="space-y-2">
            {visit.prescriptions.map((p) => (
              <li key={p.id} className="flex justify-between rounded-lg border border-slate-100 dark:border-slate-800 p-2 text-sm">
                <span className="font-mono text-xs text-slate-600 dark:text-slate-300">{p.prescriptionRef}</span>
                <span className="text-slate-500 dark:text-slate-400">{p.items} drug(s)</span>
              </li>
            ))}
            {visit.prescriptions.length === 0 && <p className="text-sm text-slate-400 dark:text-slate-500">None yet.</p>}
          </ul>
        </Section>

        {/* Treatment plans */}
        <Section title="Treatment plans" count={visit.treatmentPlans.length}
          action={<PermissionGate anyOf={[PERMISSIONS.PATIENT_UPDATE]}><Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => setPlanOpen(true)}><Plus className="h-4 w-4" /> New</Button></PermissionGate>}>
          <ul className="space-y-2">
            {visit.treatmentPlans.map((t) => (
              <li key={t.id} className="flex justify-between rounded-lg border border-slate-100 dark:border-slate-800 p-2 text-sm">
                <span className="text-slate-800 dark:text-slate-200">{t.title}</span>
                <Badge tone="neutral">{titleCase(t.status)}</Badge>
              </li>
            ))}
            {visit.treatmentPlans.length === 0 && <p className="text-sm text-slate-400 dark:text-slate-500">None yet.</p>}
          </ul>
        </Section>
      </div>

      {/* New prescription */}
      <Modal open={rxOpen} onClose={() => setRxOpen(false)} title="New prescription" width="max-w-2xl">
        <div className="space-y-3">
          {drugs.map((d, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2">
              <Input className="col-span-4" placeholder="Drug" value={d.drugName} onChange={(e) => setDrugs((ds) => ds.map((x, i) => i === idx ? { ...x, drugName: e.target.value } : x))} />
              <Input className="col-span-2" placeholder="Dosage" value={d.dosage} onChange={(e) => setDrugs((ds) => ds.map((x, i) => i === idx ? { ...x, dosage: e.target.value } : x))} />
              <Input className="col-span-2" placeholder="Freq" value={d.frequency} onChange={(e) => setDrugs((ds) => ds.map((x, i) => i === idx ? { ...x, frequency: e.target.value } : x))} />
              <Input className="col-span-2" placeholder="Duration" value={d.duration} onChange={(e) => setDrugs((ds) => ds.map((x, i) => i === idx ? { ...x, duration: e.target.value } : x))} />
              <button className="col-span-2 text-red-400 hover:text-red-600" onClick={() => setDrugs((ds) => ds.length > 1 ? ds.filter((_, i) => i !== idx) : ds)}><Trash2 className="mx-auto h-4 w-4" /></button>
            </div>
          ))}
          <Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => setDrugs((ds) => [...ds, { ...DRUG }])}><Plus className="h-4 w-4" /> Add drug</Button>
          <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">
            <Button variant="secondary" onClick={() => setRxOpen(false)}>Cancel</Button>
            <Button onClick={submitRx} loading={actions.prescribe.isPending} disabled={!drugs.some((d) => d.drugName && d.dosage && d.frequency && d.duration)}>Create prescription</Button>
          </div>
        </div>
      </Modal>

      {/* New treatment plan */}
      <Modal open={planOpen} onClose={() => setPlanOpen(false)} title="New treatment plan">
        <div className="space-y-4">
          <Field label="Title" required><Input value={plan.title} onChange={(e) => setPlan((p) => ({ ...p, title: e.target.value }))} /></Field>
          <Field label="Description"><Input value={plan.description} onChange={(e) => setPlan((p) => ({ ...p, description: e.target.value }))} /></Field>
          <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">
            <Button variant="secondary" onClick={() => setPlanOpen(false)}>Cancel</Button>
            <Button onClick={submitPlan} loading={actions.plan.isPending} disabled={!plan.title}>Add plan</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
