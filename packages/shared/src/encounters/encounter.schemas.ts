import { z } from 'zod';

export const VISIT_TYPES = ['OPD', 'IPD', 'EMERGENCY'] as const;
export const VISIT_STATUSES = ['OPEN', 'CLOSED'] as const;
export const DIAGNOSIS_TYPES = ['PROVISIONAL', 'FINAL'] as const;
export const TREATMENT_PLAN_STATUSES = ['ACTIVE', 'COMPLETED', 'CANCELLED'] as const;

export const visitTypeSchema = z.enum(VISIT_TYPES);
export const diagnosisTypeSchema = z.enum(DIAGNOSIS_TYPES);
export const treatmentPlanStatusSchema = z.enum(TREATMENT_PLAN_STATUSES);
export type VisitType = (typeof VISIT_TYPES)[number];
export type VisitStatus = (typeof VISIT_STATUSES)[number];
export type DiagnosisType = (typeof DIAGNOSIS_TYPES)[number];
export type TreatmentPlanStatus = (typeof TREATMENT_PLAN_STATUSES)[number];

const versioned = { version: z.coerce.number().int().nonnegative() };

export const vitalsSchema = z
  .object({
    bloodPressure: z.string().trim().max(20).optional(),
    pulse: z.coerce.number().int().min(0).max(400).optional(),
    temperature: z.coerce.number().min(20).max(45).optional(),
    respiratoryRate: z.coerce.number().int().min(0).max(120).optional(),
    spo2: z.coerce.number().int().min(0).max(100).optional(),
    weightKg: z.coerce.number().min(0).max(500).optional(),
    heightCm: z.coerce.number().min(0).max(300).optional(),
  })
  .strict();
export type Vitals = z.infer<typeof vitalsSchema>;

// ── Visit ─────────────────────────────────────────────────────────────────
export const createVisitSchema = z.object({
  patientId: z.string().uuid(),
  doctorId: z.string().uuid().optional(),
  appointmentId: z.string().uuid().optional(),
  hospitalId: z.string().uuid().optional(),
  visitType: visitTypeSchema.default('OPD'),
  chiefComplaint: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(4000).optional(),
  vitals: vitalsSchema.optional(),
});
export type CreateVisitInput = z.infer<typeof createVisitSchema>;

export const updateVisitSchema = z.object({
  ...versioned,
  chiefComplaint: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(4000).optional(),
  vitals: vitalsSchema.optional(),
});
export type UpdateVisitInput = z.infer<typeof updateVisitSchema>;

export const closeVisitSchema = z.object({ ...versioned });
export type CloseVisitInput = z.infer<typeof closeVisitSchema>;

// ── Diagnosis ───────────────────────────────────────────────────────────────
export const createDiagnosisSchema = z.object({
  code: z.string().trim().max(20).optional(),
  description: z.string().trim().min(1).max(300),
  type: diagnosisTypeSchema.default('PROVISIONAL'),
  notes: z.string().trim().max(1000).optional(),
});
export type CreateDiagnosisInput = z.infer<typeof createDiagnosisSchema>;

// ── Prescription ─────────────────────────────────────────────────────────────
export const createPrescriptionSchema = z.object({
  patientId: z.string().uuid(),
  visitId: z.string().uuid().optional(),
  doctorId: z.string().uuid().optional(),
  notes: z.string().trim().max(1000).optional(),
  items: z
    .array(
      z.object({
        medicineId: z.string().uuid().optional(),
        drugName: z.string().trim().min(1).max(150),
        dosage: z.string().trim().min(1).max(60),
        frequency: z.string().trim().min(1).max(60),
        duration: z.string().trim().min(1).max(60),
        instructions: z.string().trim().max(200).optional(),
      }),
    )
    .min(1, 'At least one drug is required'),
});
export type CreatePrescriptionInput = z.infer<typeof createPrescriptionSchema>;

// ── Treatment plan ───────────────────────────────────────────────────────────
export const createTreatmentPlanSchema = z.object({
  patientId: z.string().uuid(),
  visitId: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(150),
  description: z.string().trim().max(2000).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
export type CreateTreatmentPlanInput = z.infer<typeof createTreatmentPlanSchema>;

export const updateTreatmentPlanSchema = z.object({
  ...versioned,
  status: treatmentPlanStatusSchema,
});
export type UpdateTreatmentPlanInput = z.infer<typeof updateTreatmentPlanSchema>;

export function formatVisitNumber(n: number): string {
  return `VIS-${String(n).padStart(6, '0')}`;
}
export function formatPrescriptionNumber(n: number): string {
  return `RX-${String(n).padStart(6, '0')}`;
}
