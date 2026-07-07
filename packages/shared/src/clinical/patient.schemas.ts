import { z } from 'zod';

// ── Enums (mirror the Prisma enums) ──────────────────────────────────────
export const GENDERS = ['MALE', 'FEMALE', 'OTHER', 'UNKNOWN'] as const;
export const BLOOD_GROUPS = [
  'A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE',
  'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE',
] as const;
export const MARITAL_STATUSES = ['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'OTHER'] as const;
export const PATIENT_STATUSES = ['ACTIVE', 'INACTIVE', 'DECEASED'] as const;
export const ALLERGY_SEVERITIES = ['MILD', 'MODERATE', 'SEVERE', 'LIFE_THREATENING'] as const;
export const MEDICAL_CONDITION_STATUSES = ['ACTIVE', 'RESOLVED', 'CHRONIC'] as const;

export const genderSchema = z.enum(GENDERS);
export const bloodGroupSchema = z.enum(BLOOD_GROUPS);
export const maritalStatusSchema = z.enum(MARITAL_STATUSES);
export const patientStatusSchema = z.enum(PATIENT_STATUSES);
export const allergySeveritySchema = z.enum(ALLERGY_SEVERITIES);
export const medicalConditionStatusSchema = z.enum(MEDICAL_CONDITION_STATUSES);

export type Gender = (typeof GENDERS)[number];
export type BloodGroup = (typeof BLOOD_GROUPS)[number];
export type MaritalStatus = (typeof MARITAL_STATUSES)[number];
export type PatientStatus = (typeof PATIENT_STATUSES)[number];
export type AllergySeverity = (typeof ALLERGY_SEVERITIES)[number];
export type MedicalConditionStatus = (typeof MEDICAL_CONDITION_STATUSES)[number];

const phone = z
  .string()
  .trim()
  .regex(/^[+]?[0-9\s-]{7,20}$/, 'Invalid phone number');
const optionalEmail = z.string().trim().toLowerCase().email().optional();
const versioned = { version: z.coerce.number().int().nonnegative() };

/** A date in the past (birth dates, diagnosis dates). */
const pastDate = z.coerce
  .date()
  .refine((d) => d.getTime() <= Date.now(), 'Date cannot be in the future');

// ── Patient ──────────────────────────────────────────────────────────────
export const createPatientSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  middleName: z.string().trim().max(80).optional(),
  dateOfBirth: pastDate,
  gender: genderSchema,
  bloodGroup: bloodGroupSchema.optional(),
  maritalStatus: maritalStatusSchema.optional(),
  email: optionalEmail,
  phone,
  nationalId: z.string().trim().max(40).optional(),
  addressLine: z.string().trim().max(255).optional(),
  city: z.string().trim().max(120).optional(),
  state: z.string().trim().max(120).optional(),
  country: z.string().trim().max(120).optional(),
  postalCode: z.string().trim().max(20).optional(),
  status: patientStatusSchema.default('ACTIVE'),
  hospitalId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
});
export type CreatePatientInput = z.infer<typeof createPatientSchema>;

export const updatePatientSchema = createPatientSchema.partial().extend(versioned);
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;

// ── Emergency contact ────────────────────────────────────────────────────
export const createEmergencyContactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  relationship: z.string().trim().min(1).max(60),
  phone,
  email: optionalEmail,
  addressLine: z.string().trim().max(255).optional(),
  isPrimary: z.boolean().default(false),
});
export type CreateEmergencyContactInput = z.infer<typeof createEmergencyContactSchema>;

export const updateEmergencyContactSchema = createEmergencyContactSchema.partial().extend(versioned);
export type UpdateEmergencyContactInput = z.infer<typeof updateEmergencyContactSchema>;

// ── Allergy ──────────────────────────────────────────────────────────────
export const createAllergySchema = z.object({
  allergen: z.string().trim().min(1).max(120),
  reaction: z.string().trim().max(255).optional(),
  severity: allergySeveritySchema.default('MILD'),
  notes: z.string().trim().max(500).optional(),
});
export type CreateAllergyInput = z.infer<typeof createAllergySchema>;

export const updateAllergySchema = createAllergySchema.partial().extend(versioned);
export type UpdateAllergyInput = z.infer<typeof updateAllergySchema>;

// ── Medical history ──────────────────────────────────────────────────────
export const createMedicalHistorySchema = z.object({
  condition: z.string().trim().min(1).max(200),
  notes: z.string().trim().max(1000).optional(),
  diagnosedAt: pastDate.optional(),
  status: medicalConditionStatusSchema.default('ACTIVE'),
});
export type CreateMedicalHistoryInput = z.infer<typeof createMedicalHistorySchema>;

export const updateMedicalHistorySchema = createMedicalHistorySchema.partial().extend(versioned);
export type UpdateMedicalHistoryInput = z.infer<typeof updateMedicalHistorySchema>;

/** Build the human-readable MRN from the DB sequence value. */
export function formatMrn(patientNumber: number): string {
  return `MRN-${String(patientNumber).padStart(6, '0')}`;
}
