import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreatePatientInput } from '@hms/shared';
import { patientsApi, type PatientListParams } from './api';

const KEY = 'patients';

export function usePatients(params: PatientListParams) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: () => patientsApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function usePatientProfile(id: string) {
  return useQuery({
    queryKey: [KEY, 'profile', id],
    queryFn: () => patientsApi.getProfile(id),
    enabled: Boolean(id),
  });
}

export function useCreatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePatientInput) => patientsApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useDeletePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => patientsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
