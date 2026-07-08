import { useEffect, useState } from 'react';
import { FileDown, Plus, ScanLine } from 'lucide-react';
import { RADIOLOGY_STATUSES, PERMISSIONS } from '@hms/shared';
import { PageHeader } from '@/components/PageHeader';
import { PermissionGate } from '@/components/PermissionGate';
import { Modal } from '@/components/Modal';
import { PatientPicker } from '@/components/PatientPicker';
import { Badge, Button, Card, Field, Input, PageSpinner, Select } from '@/components/ui';
import { toast } from '@/components/toast';
import { apiClient, ApiError } from '@/lib/api-client';
import { titleCase } from '@/lib/format';
import { useHospitals } from '@/features/lookups';
import { RadiologySubnav } from './RadiologySubnav';
import { useAllExams, useCreateStudy, useStudies, useStudyActions } from './hooks';
import type { Study } from './api';

const TONE: Record<string, 'neutral' | 'info' | 'warning' | 'success' | 'danger'> = {
  REQUESTED: 'neutral', SCHEDULED: 'warning', PERFORMED: 'info', REPORTED: 'success', CANCELLED: 'danger',
};

export function RadiologyStudiesPage() {
  const [status, setStatus] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [reportFor, setReportFor] = useState<Study | null>(null);
  const [viewFor, setViewFor] = useState<Study | null>(null);

  const hospitals = useHospitals();
  const exams = useAllExams();
  const create = useCreateStudy();
  const actions = useStudyActions();
  const { data, isLoading } = useStudies({ limit: 20, status: status || undefined });
  const rows = data?.data ?? [];

  const [hospitalId, setHospitalId] = useState('');
  const [patientId, setPatientId] = useState('');
  const [examId, setExamId] = useState('');
  const [report, setReport] = useState({ findings: '', impression: '', imageUrl: '' });

  useEffect(() => { if (!hospitalId && hospitals.data?.[0]) setHospitalId(hospitals.data[0].id); }, [hospitals.data, hospitalId]);
  useEffect(() => { if (createOpen) { setPatientId(''); setExamId(''); } }, [createOpen]);
  useEffect(() => { if (reportFor) setReport({ findings: '', impression: '', imageUrl: '' }); }, [reportFor]);

  const onError = (e: unknown) => toast.error(e instanceof ApiError ? e.message : 'Action failed');
  const openPdf = (studyId: string) => apiClient.openBlob(`/radiology/studies/${studyId}/report.pdf`).catch(onError);

  const submitStudy = () => create.mutate({ hospitalId, patientId, examId }, {
    onSuccess: (s) => { toast.success(`Study ${s.studyRef} requested`); setCreateOpen(false); },
    onError,
  });

  const doSchedule = (s: Study) => {
    const at = window.prompt('Scheduled date-time (ISO, e.g. 2026-07-10T10:00):', new Date().toISOString().slice(0, 16));
    if (!at) return;
    actions.schedule.mutate({ id: s.id, version: s.version, scheduledAt: new Date(at).toISOString() }, { onSuccess: () => toast.success('Scheduled'), onError });
  };
  const submitReport = () => reportFor && actions.report.mutate(
    { id: reportFor.id, body: { version: reportFor.version, findings: report.findings, impression: report.impression || undefined, imageUrl: report.imageUrl || undefined } },
    { onSuccess: () => { toast.success('Report uploaded'); setReportFor(null); }, onError },
  );

  return (
    <div>
      <PageHeader
        title="Radiology"
        actions={
          <PermissionGate anyOf={[PERMISSIONS.RADIOLOGY_MANAGE]}>
            <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> New study</Button>
          </PermissionGate>
        }
      />
      <RadiologySubnav />

      <Card>
        <div className="border-b border-slate-100 p-4">
          <Select className="max-w-xs" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {RADIOLOGY_STATUSES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
          </Select>
        </div>
        {isLoading ? <PageSpinner /> : rows.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500"><ScanLine className="mx-auto mb-2 h-6 w-6 text-slate-300" />No studies.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr><th className="px-4 py-3 font-medium">Ref</th><th className="px-4 py-3 font-medium">Patient</th><th className="px-4 py-3 font-medium">Exam</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 text-right font-medium">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{s.studyRef}</td>
                    <td className="px-4 py-3"><div className="font-medium text-slate-900">{s.patientName}</div><div className="text-xs text-slate-400">{s.patientMrn}</div></td>
                    <td className="px-4 py-3 text-slate-600">{s.examName} <span className="text-xs text-slate-400">· {titleCase(s.modality)}</span></td>
                    <td className="px-4 py-3"><Badge tone={TONE[s.status]}>{titleCase(s.status)}</Badge></td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center justify-end gap-1">
                        <PermissionGate anyOf={[PERMISSIONS.RADIOLOGY_MANAGE]}>
                          {s.status === 'REQUESTED' && <Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => doSchedule(s)}>Schedule</Button>}
                          {s.status === 'SCHEDULED' && <Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => actions.perform.mutate({ id: s.id, version: s.version }, { onSuccess: () => toast.success('Performed'), onError })}>Perform</Button>}
                          {s.status === 'PERFORMED' && <Button className="px-2 py-1 text-xs" onClick={() => setReportFor(s)}>Report</Button>}
                          {['REQUESTED', 'SCHEDULED', 'PERFORMED'].includes(s.status) && (
                            <Button variant="ghost" className="px-2 py-1 text-xs text-red-500" onClick={() => actions.cancel.mutate({ id: s.id, version: s.version }, { onSuccess: () => toast.success('Cancelled'), onError })}>Cancel</Button>
                          )}
                        </PermissionGate>
                        {s.status === 'REPORTED' && <Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => setViewFor(s)}>View report</Button>}
                        {s.status === 'REPORTED' && <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => openPdf(s.id)}><FileDown className="h-4 w-4" /> PDF</Button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create study */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New imaging study" width="max-w-xl">
        <div className="space-y-4">
          <Field label="Hospital" required>
            <Select value={hospitalId} onChange={(e) => setHospitalId(e.target.value)}>
              <option value="" disabled>Select hospital…</option>
              {hospitals.data?.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </Select>
          </Field>
          <PatientPicker value={patientId} onChange={setPatientId} required />
          <Field label="Exam" required>
            <Select value={examId} onChange={(e) => setExamId(e.target.value)}>
              <option value="" disabled>Select exam…</option>
              {exams.data?.map((e) => <option key={e.id} value={e.id}>{e.name} · {titleCase(e.modality)}</option>)}
            </Select>
          </Field>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={submitStudy} loading={create.isPending} disabled={!hospitalId || !patientId || !examId}>Request study</Button>
          </div>
        </div>
      </Modal>

      {/* Upload report */}
      <Modal open={!!reportFor} onClose={() => setReportFor(null)} title={`Report · ${reportFor?.studyRef ?? ''}`} width="max-w-xl">
        <div className="space-y-4">
          <Field label="Findings" required>
            <textarea className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" rows={4} value={report.findings} onChange={(e) => setReport((r) => ({ ...r, findings: e.target.value }))} />
          </Field>
          <Field label="Impression"><Input value={report.impression} onChange={(e) => setReport((r) => ({ ...r, impression: e.target.value }))} /></Field>
          <Field label="Image URL"><Input value={report.imageUrl} onChange={(e) => setReport((r) => ({ ...r, imageUrl: e.target.value }))} placeholder="https://…" /></Field>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Button variant="secondary" onClick={() => setReportFor(null)}>Cancel</Button>
            <Button onClick={submitReport} loading={actions.report.isPending} disabled={!report.findings}>Upload report</Button>
          </div>
        </div>
      </Modal>

      {/* View report */}
      <Modal open={!!viewFor} onClose={() => setViewFor(null)} title={`Report · ${viewFor?.studyRef ?? ''}`} width="max-w-xl">
        {viewFor && (
          <div className="space-y-3 text-sm">
            <p><span className="text-slate-400">Exam:</span> {viewFor.examName}</p>
            <div><p className="text-xs uppercase text-slate-400">Findings</p><p className="text-slate-700">{viewFor.findings}</p></div>
            {viewFor.impression && <div><p className="text-xs uppercase text-slate-400">Impression</p><p className="text-slate-700">{viewFor.impression}</p></div>}
            {viewFor.imageUrl && <a href={viewFor.imageUrl} target="_blank" rel="noreferrer" className="text-brand-600 underline">View image</a>}
          </div>
        )}
      </Modal>
    </div>
  );
}
