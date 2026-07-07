import type {
  AllergySeverity,
  BloodGroup,
  Gender,
  MaritalStatus,
  MedicalConditionStatus,
  PatientStatus,
} from '@hms/shared';

export interface Patient {
  id: string;
  patientNumber: number;
  mrn: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  dateOfBirth: string;
  gender: Gender;
  bloodGroup: BloodGroup | null;
  maritalStatus: MaritalStatus | null;
  email: string | null;
  phone: string;
  nationalId: string | null;
  addressLine: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  status: PatientStatus;
  hospitalId: string | null;
  branchId: string | null;
  userId: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email: string | null;
  isPrimary: boolean;
  version: number;
}

export interface Allergy {
  id: string;
  allergen: string;
  reaction: string | null;
  severity: AllergySeverity;
  notes: string | null;
  version: number;
}

export interface MedicalHistoryEntry {
  id: string;
  condition: string;
  notes: string | null;
  diagnosedAt: string | null;
  status: MedicalConditionStatus;
  version: number;
}

export interface PatientProfile extends Patient {
  emergencyContacts: EmergencyContact[];
  allergies: Allergy[];
  medicalHistories: MedicalHistoryEntry[];
}
