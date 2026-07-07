import type { Patient } from '@prisma/client';
import { formatMrn } from '@hms/shared';
import type { PatientProfile } from './patients.repository';

/** Adds the derived MRN to any patient row. */
export function toPatientView<T extends Patient>(patient: T): T & { mrn: string } {
  return { ...patient, mrn: formatMrn(patient.patientNumber) };
}

/** Full profile: patient + MRN + active child collections. */
export function toPatientProfile(patient: PatientProfile) {
  return {
    ...toPatientView(patient),
    emergencyContacts: patient.emergencyContacts,
    allergies: patient.allergies,
    medicalHistories: patient.medicalHistories,
  };
}
