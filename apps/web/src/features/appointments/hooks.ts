import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import {
  appointmentsApi,
  type AppointmentListParams,
  type BookPayload,
  type WalkInPayload,
} from './api';

const KEY = 'appointments';

export interface Lookup {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  mrn?: string;
}

export function useAppointments(params: AppointmentListParams) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () => appointmentsApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useSlots(doctorId: string, date: string, enabled: boolean) {
  return useQuery({
    queryKey: [KEY, 'slots', doctorId, date],
    queryFn: () => appointmentsApi.slots(doctorId, date),
    enabled: enabled && Boolean(doctorId) && Boolean(date),
  });
}

export function useQueue(doctorId: string, date: string) {
  return useQuery({
    queryKey: [KEY, 'queue', doctorId, date],
    queryFn: () => appointmentsApi.queue(doctorId, date),
    enabled: Boolean(doctorId) && Boolean(date),
    refetchInterval: 10_000,
  });
}

export function useDoctors() {
  return useQuery({
    queryKey: ['lookup', 'doctors'],
    queryFn: () => apiClient.get<Lookup[]>('/users?role=DOCTOR&limit=100').then((r) => r.data),
  });
}

export function useHospitalsLookup() {
  return useQuery({
    queryKey: ['lookup', 'hospitals'],
    queryFn: () =>
      apiClient
        .get<Array<{ id: string; name: string }>>('/hospitals?limit=100')
        .then((r) => r.data),
  });
}

export function usePatientSearch(term: string) {
  return useQuery({
    queryKey: ['lookup', 'patients', term],
    queryFn: () =>
      apiClient
        .get<Lookup[]>(`/patients?limit=8${term ? `&search=${encodeURIComponent(term)}` : ''}`)
        .then((r) => r.data),
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: [KEY] });
}

export function useBook() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: (p: BookPayload) => appointmentsApi.book(p), onSuccess: invalidate });
}

export function useWalkIn() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: (p: WalkInPayload) => appointmentsApi.walkIn(p), onSuccess: invalidate });
}

export function useTransition() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (v: {
      id: string;
      action: 'check-in' | 'start' | 'complete' | 'no-show';
      version: number;
    }) => appointmentsApi.transition(v.id, v.action, v.version),
    onSuccess: invalidate,
  });
}

export function useCancel() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (v: { id: string; version: number; reason?: string }) =>
      appointmentsApi.cancel(v.id, v.version, v.reason),
    onSuccess: invalidate,
  });
}
