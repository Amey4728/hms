import type { PaginationMeta } from '@hms/shared';
import { apiClient } from '@/lib/api-client';
import type { Appointment, Slot } from './types';

export interface AppointmentListParams {
  page?: number;
  limit?: number;
  doctorId?: string;
  patientId?: string;
  status?: string;
  from?: string;
  to?: string;
  [key: string]: string | number | undefined;
}

function qs(params: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') q.set(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : '';
}

export interface BookPayload {
  patientId: string;
  doctorId: string;
  hospitalId: string;
  scheduledStart: string;
  durationMinutes: number;
  reason?: string;
}

export interface WalkInPayload {
  patientId: string;
  doctorId: string;
  hospitalId: string;
  durationMinutes: number;
  reason?: string;
}

export const appointmentsApi = {
  list(params: AppointmentListParams) {
    return apiClient.get<Appointment[], PaginationMeta>(`/appointments${qs(params)}`);
  },
  slots(doctorId: string, date: string) {
    return apiClient.get<Slot[]>(`/appointments/slots?doctorId=${doctorId}&date=${date}`).then((r) => r.data);
  },
  queue(doctorId: string, date: string) {
    return apiClient
      .get<Appointment[]>(`/appointments/queue?doctorId=${doctorId}&date=${date}`)
      .then((r) => r.data);
  },
  book(payload: BookPayload) {
    return apiClient.post<Appointment>('/appointments', payload).then((r) => r.data);
  },
  walkIn(payload: WalkInPayload) {
    return apiClient.post<Appointment>('/appointments/walk-in', payload).then((r) => r.data);
  },
  transition(id: string, action: 'check-in' | 'start' | 'complete' | 'no-show', version: number) {
    return apiClient.patch<Appointment>(`/appointments/${id}/${action}`, { version }).then((r) => r.data);
  },
  cancel(id: string, version: number, reason?: string) {
    return apiClient.patch<Appointment>(`/appointments/${id}/cancel`, { version, reason }).then((r) => r.data);
  },
};
