import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { radiologyApi } from './api';

const EXAMS = 'rad-exams';
const STUDIES = 'rad-studies';

export function useExams(p: { page?: number; limit?: number; search?: string }) {
  return useQuery({ queryKey: [EXAMS, p], queryFn: () => radiologyApi.listExams(p), placeholderData: keepPreviousData });
}
export function useAllExams() {
  return useQuery({ queryKey: [EXAMS, 'all'], queryFn: () => radiologyApi.allExams() });
}
export function useStudies(p: { page?: number; limit?: number; status?: string }) {
  return useQuery({ queryKey: [STUDIES, p], queryFn: () => radiologyApi.listStudies(p), placeholderData: keepPreviousData });
}
export function useCreateExam() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (b: unknown) => radiologyApi.createExam(b), onSuccess: () => qc.invalidateQueries({ queryKey: [EXAMS] }) });
}
export function useCreateStudy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b: { patientId: string; hospitalId: string; examId: string }) => radiologyApi.createStudy(b),
    onSuccess: () => qc.invalidateQueries({ queryKey: [STUDIES] }),
  });
}
export function useStudyActions() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: [STUDIES] });
  return {
    schedule: useMutation({ mutationFn: (v: { id: string; version: number; scheduledAt: string }) => radiologyApi.schedule(v.id, v.version, v.scheduledAt), onSuccess: invalidate }),
    perform: useMutation({ mutationFn: (v: { id: string; version: number }) => radiologyApi.perform(v.id, v.version), onSuccess: invalidate }),
    report: useMutation({ mutationFn: (v: { id: string; body: unknown }) => radiologyApi.report(v.id, v.body), onSuccess: invalidate }),
    cancel: useMutation({ mutationFn: (v: { id: string; version: number; reason?: string }) => radiologyApi.cancel(v.id, v.version, v.reason), onSuccess: invalidate }),
  };
}
