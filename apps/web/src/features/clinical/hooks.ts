import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { clinicalApi } from './api';

const VISITS = 'visits';

export function useVisits(p: { page?: number; limit?: number; patientId?: string; status?: string }) {
  return useQuery({ queryKey: [VISITS, p], queryFn: () => clinicalApi.listVisits(p), placeholderData: keepPreviousData });
}
export function useVisit(id: string) {
  return useQuery({ queryKey: [VISITS, id], queryFn: () => clinicalApi.getVisit(id), enabled: Boolean(id) });
}

function useInvalidate(id?: string) {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: [VISITS] });
    if (id) qc.invalidateQueries({ queryKey: [VISITS, id] });
  };
}

export function useCreateVisit() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: (b: unknown) => clinicalApi.createVisit(b), onSuccess: invalidate });
}
export function useVisitActions(id: string) {
  const invalidate = useInvalidate(id);
  return {
    close: useMutation({ mutationFn: (v: { version: number }) => clinicalApi.closeVisit(id, v.version), onSuccess: invalidate }),
    addDiagnosis: useMutation({ mutationFn: (b: unknown) => clinicalApi.addDiagnosis(id, b), onSuccess: invalidate }),
    removeDiagnosis: useMutation({ mutationFn: (did: string) => clinicalApi.removeDiagnosis(id, did), onSuccess: invalidate }),
    prescribe: useMutation({ mutationFn: (b: unknown) => clinicalApi.createPrescription(b), onSuccess: invalidate }),
    plan: useMutation({ mutationFn: (b: unknown) => clinicalApi.createTreatmentPlan(b), onSuccess: invalidate }),
  };
}
