import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface PatientLookup {
  id: string;
  firstName: string;
  lastName: string;
  mrn: string;
}

export function usePatientSearch(term: string) {
  return useQuery({
    queryKey: ['lookup', 'patients', term],
    queryFn: () =>
      apiClient
        .get<PatientLookup[]>(`/patients?limit=8${term ? `&search=${encodeURIComponent(term)}` : ''}`)
        .then((r) => r.data),
  });
}

export function useHospitals() {
  return useQuery({
    queryKey: ['lookup', 'hospitals'],
    queryFn: () => apiClient.get<Array<{ id: string; name: string }>>('/hospitals?limit=100').then((r) => r.data),
  });
}
