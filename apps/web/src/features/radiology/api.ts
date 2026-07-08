import type { PaginationMeta, RadiologyModality, RadiologyStatus } from '@hms/shared';
import { apiClient } from '@/lib/api-client';

export interface RadiologyExam {
  id: string;
  code: string;
  name: string;
  modality: RadiologyModality;
  bodyPart: string | null;
  price: number;
  version: number;
}

export interface Study {
  id: string;
  studyNumber: number;
  studyRef: string;
  patientId: string;
  patientName: string;
  patientMrn: string;
  hospitalId: string;
  examId: string;
  examName: string;
  modality: RadiologyModality;
  bodyPart: string | null;
  status: RadiologyStatus;
  scheduledAt: string | null;
  findings: string | null;
  impression: string | null;
  imageUrl: string | null;
  version: number;
}

function qs(p: Record<string, string | number | undefined>) {
  const q = new URLSearchParams();
  Object.entries(p).forEach(([k, v]) => v !== undefined && v !== '' && q.set(k, String(v)));
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const radiologyApi = {
  listExams(p: { page?: number; limit?: number; search?: string }) {
    return apiClient.get<RadiologyExam[], PaginationMeta>(`/radiology/exams${qs(p)}`);
  },
  allExams() {
    return apiClient.get<RadiologyExam[]>('/radiology/exams?limit=200').then((r) => r.data);
  },
  createExam(body: unknown) {
    return apiClient.post<RadiologyExam>('/radiology/exams', body).then((r) => r.data);
  },
  listStudies(p: { page?: number; limit?: number; status?: string }) {
    return apiClient.get<Study[], PaginationMeta>(`/radiology/studies${qs(p)}`);
  },
  createStudy(body: { patientId: string; hospitalId: string; examId: string }) {
    return apiClient.post<Study>('/radiology/studies', body).then((r) => r.data);
  },
  schedule(id: string, version: number, scheduledAt: string) {
    return apiClient.patch<Study>(`/radiology/studies/${id}/schedule`, { version, scheduledAt }).then((r) => r.data);
  },
  perform(id: string, version: number) {
    return apiClient.patch<Study>(`/radiology/studies/${id}/perform`, { version }).then((r) => r.data);
  },
  report(id: string, body: unknown) {
    return apiClient.patch<Study>(`/radiology/studies/${id}/report`, body).then((r) => r.data);
  },
  cancel(id: string, version: number, reason?: string) {
    return apiClient.patch<Study>(`/radiology/studies/${id}/cancel`, { version, reason }).then((r) => r.data);
  },
};
