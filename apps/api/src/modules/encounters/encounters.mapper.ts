import { formatMrn, formatPrescriptionNumber, formatVisitNumber } from '@hms/shared';
import type { VisitWithDetails } from './visits/visits.repository';
import type { PrescriptionWithItems } from './prescriptions/prescriptions.repository';

export function toVisitView(v: VisitWithDetails) {
  return {
    id: v.id,
    visitNumber: v.visitNumber,
    visitRef: formatVisitNumber(v.visitNumber),
    patientId: v.patientId,
    patientName: `${v.patient.firstName} ${v.patient.lastName}`,
    patientMrn: formatMrn(v.patient.patientNumber),
    doctorId: v.doctorId,
    hospitalId: v.hospitalId,
    appointmentId: v.appointmentId,
    visitType: v.visitType,
    status: v.status,
    chiefComplaint: v.chiefComplaint,
    notes: v.notes,
    vitals: v.vitals,
    visitDate: v.visitDate,
    closedAt: v.closedAt,
    diagnoses: v.diagnoses.map((d) => ({
      id: d.id,
      code: d.code,
      description: d.description,
      type: d.type,
      notes: d.notes,
    })),
    prescriptions: v.prescriptions.map((p) => ({
      id: p.id,
      prescriptionRef: formatPrescriptionNumber(p.prescriptionNumber),
      items: p.items.length,
    })),
    treatmentPlans: v.treatmentPlans.map((t) => ({ id: t.id, title: t.title, status: t.status })),
    version: v.version,
    createdAt: v.createdAt,
  };
}

export function toPrescriptionView(p: PrescriptionWithItems) {
  return {
    id: p.id,
    prescriptionNumber: p.prescriptionNumber,
    prescriptionRef: formatPrescriptionNumber(p.prescriptionNumber),
    patientId: p.patientId,
    visitId: p.visitId,
    doctorId: p.doctorId,
    notes: p.notes,
    items: p.items.map((i) => ({
      id: i.id,
      drugName: i.drugName,
      dosage: i.dosage,
      frequency: i.frequency,
      duration: i.duration,
      instructions: i.instructions,
    })),
    createdAt: p.createdAt,
  };
}
