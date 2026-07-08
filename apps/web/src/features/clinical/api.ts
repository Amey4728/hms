import type { DiagnosisType, PaginationMeta, TreatmentPlanStatus, VisitStatus, VisitType } from '@hms/shared';
import { apiClient } from '@/lib/api-client';

export interface Vitals {
  bloodPressure?: string;
  pulse?: number;
  temperature?: number;
  respiratoryRate?: number;
  spo2?: number;
  weightKg?: number;
  heightCm?: number;
}

export interface Diagnosis {
  id: string;
  code: string | null;
  description: string;
  type: DiagnosisType;
  notes: string | null;
}

export interface Visit {
  id: string;
  visitNumber: number;
  visitRef: string;
  patientId: string;
  patientName: string;
  patientMrn: string;
  doctorId: string | null;
  visitType: VisitType;
  status: VisitStatus;
  chiefComplaint: string | null;
  notes: string | null;
  vitals: Vitals | null;
  visitDate: string;
  closedAt: string | null;
  diagnoses: Diagnosis[];
  prescriptions: Array<{ id: string; prescriptionRef: string; items: number }>;
  treatmentPlans: Array<{ id: string; title: string; status: TreatmentPlanStatus }>;
  version: number;
}

export interface Prescription {
  id: string;
  prescriptionRef: string;
  patientId: string;
  visitId: string | null;
  notes: string | null;
  items: Array<{ id: string; drugName: string; dosage: string; frequency: string; duration: string; instructions: string | null }>;
}

function qs(p: Record<string, string | number | undefined>) {
  const q = new URLSearchParams();
  Object.entries(p).forEach(([k, v]) => v !== undefined && v !== '' && q.set(k, String(v)));
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const clinicalApi = {
  listVisits(p: { page?: number; limit?: number; patientId?: string; status?: string }) {
    return apiClient.get<Visit[], PaginationMeta>(`/visits${qs(p)}`);
  },
  getVisit(id: string) {
    return apiClient.get<Visit>(`/visits/${id}`).then((r) => r.data);
  },
  createVisit(body: unknown) {
    return apiClient.post<Visit>('/visits', body).then((r) => r.data);
  },
  closeVisit(id: string, version: number) {
    return apiClient.patch<Visit>(`/visits/${id}/close`, { version }).then((r) => r.data);
  },
  addDiagnosis(visitId: string, body: unknown) {
    return apiClient.post<Visit>(`/visits/${visitId}/diagnoses`, body).then((r) => r.data);
  },
  removeDiagnosis(visitId: string, diagnosisId: string) {
    return apiClient.del<Visit>(`/visits/${visitId}/diagnoses/${diagnosisId}`).then((r) => r.data);
  },
  createPrescription(body: unknown) {
    return apiClient.post<Prescription>('/prescriptions', body).then((r) => r.data);
  },
  createTreatmentPlan(body: unknown) {
    return apiClient.post('/treatment-plans', body).then((r) => r.data);
  },
};
