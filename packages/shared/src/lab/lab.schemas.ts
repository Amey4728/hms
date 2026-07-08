import { z } from 'zod';

export const SPECIMEN_TYPES = ['BLOOD', 'URINE', 'STOOL', 'SWAB', 'TISSUE', 'OTHER'] as const;
export const LAB_ORDER_STATUSES = [
  'ORDERED',
  'SAMPLE_COLLECTED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
] as const;
export const LAB_RESULT_FLAGS = ['NORMAL', 'LOW', 'HIGH', 'CRITICAL'] as const;

export const specimenTypeSchema = z.enum(SPECIMEN_TYPES);
export const labOrderStatusSchema = z.enum(LAB_ORDER_STATUSES);
export const labResultFlagSchema = z.enum(LAB_RESULT_FLAGS);
export type SpecimenType = (typeof SPECIMEN_TYPES)[number];
export type LabOrderStatus = (typeof LAB_ORDER_STATUSES)[number];
export type LabResultFlag = (typeof LAB_RESULT_FLAGS)[number];

const versioned = { version: z.coerce.number().int().nonnegative() };
const code = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9_-]{2,20}$/, 'Code must be 2–20 chars: A–Z, 0–9, dash or underscore');

// ── Test catalogue ───────────────────────────────────────────────────────
export const createLabTestSchema = z.object({
  code,
  name: z.string().trim().min(2).max(150),
  category: z.string().trim().max(80).optional(),
  specimenType: specimenTypeSchema.default('BLOOD'),
  unit: z.string().trim().max(30).optional(),
  referenceRange: z.string().trim().max(80).optional(),
  price: z.coerce.number().nonnegative().default(0),
  isActive: z.boolean().default(true),
  hospitalId: z.string().uuid().optional(),
});
export type CreateLabTestInput = z.infer<typeof createLabTestSchema>;

export const updateLabTestSchema = createLabTestSchema
  .omit({ code: true })
  .partial()
  .extend(versioned);
export type UpdateLabTestInput = z.infer<typeof updateLabTestSchema>;

// ── Orders ────────────────────────────────────────────────────────────────
export const createLabOrderSchema = z.object({
  patientId: z.string().uuid(),
  hospitalId: z.string().uuid(),
  orderedById: z.string().uuid().optional(),
  notes: z.string().trim().max(500).optional(),
  testIds: z.array(z.string().uuid()).min(1, 'At least one test is required'),
});
export type CreateLabOrderInput = z.infer<typeof createLabOrderSchema>;

export const enterResultSchema = z.object({
  ...versioned,
  resultValue: z.string().trim().min(1).max(200),
  unit: z.string().trim().max(30).optional(),
  flag: labResultFlagSchema.optional(),
  resultNotes: z.string().trim().max(300).optional(),
});
export type EnterResultInput = z.infer<typeof enterResultSchema>;

export const labTransitionSchema = z.object({ ...versioned });
export type LabTransitionInput = z.infer<typeof labTransitionSchema>;

export const cancelLabOrderSchema = z.object({
  ...versioned,
  reason: z.string().trim().max(300).optional(),
});
export type CancelLabOrderInput = z.infer<typeof cancelLabOrderSchema>;

export function formatLabOrderNumber(n: number): string {
  return `LAB-${String(n).padStart(6, '0')}`;
}
