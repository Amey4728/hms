import type { RadiologyExam } from '@prisma/client';
import { formatMrn, formatStudyNumber } from '@hms/shared';
import type { StudyWithRefs } from './studies/studies.repository';

export function toExamView(e: RadiologyExam) {
  return { ...e, price: e.price.toNumber() };
}

export function toStudyView(s: StudyWithRefs) {
  return {
    id: s.id,
    studyNumber: s.studyNumber,
    studyRef: formatStudyNumber(s.studyNumber),
    patientId: s.patientId,
    patientName: `${s.patient.firstName} ${s.patient.lastName}`,
    patientMrn: formatMrn(s.patient.patientNumber),
    hospitalId: s.hospitalId,
    examId: s.examId,
    examName: s.exam.name,
    modality: s.exam.modality,
    bodyPart: s.exam.bodyPart,
    status: s.status,
    scheduledAt: s.scheduledAt,
    performedAt: s.performedAt,
    reportedAt: s.reportedAt,
    findings: s.findings,
    impression: s.impression,
    imageUrl: s.imageUrl,
    cancellationReason: s.cancellationReason,
    version: s.version,
    createdAt: s.createdAt,
  };
}
