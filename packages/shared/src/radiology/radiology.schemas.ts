import { z } from 'zod';

export const RADIOLOGY_MODALITIES = ['XRAY', 'MRI', 'CT', 'ULTRASOUND', 'MAMMOGRAPHY', 'OTHER'] as const;
export const RADIOLOGY_STATUSES = ['REQUESTED', 'SCHEDULED', 'PERFORMED', 'REPORTED', 'CANCELLED'] as const;

export const radiologyModalitySchema = z.enum(RADIOLOGY_MODALITIES);
export const radiologyStatusSchema = z.enum(RADIOLOGY_STATUSES);
export type RadiologyModality = (typeof RADIOLOGY_MODALITIES)[number];
export type RadiologyStatus = (typeof RADIOLOGY_STATUSES)[number];

const versioned = { version: z.coerce.number().int().nonnegative() };
const code = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9_-]{2,20}$/, 'Code must be 2–20 chars: A–Z, 0–9, dash or underscore');

export const createRadiologyExamSchema = z.object({
  code,
  name: z.string().trim().min(2).max(150),
  modality: radiologyModalitySchema.default('XRAY'),
  bodyPart: z.string().trim().max(80).optional(),
  price: z.coerce.number().nonnegative().default(0),
  isActive: z.boolean().default(true),
  hospitalId: z.string().uuid().optional(),
});
export type CreateRadiologyExamInput = z.infer<typeof createRadiologyExamSchema>;

export const updateRadiologyExamSchema = createRadiologyExamSchema.omit({ code: true }).partial().extend(versioned);
export type UpdateRadiologyExamInput = z.infer<typeof updateRadiologyExamSchema>;

export const createStudySchema = z.object({
  patientId: z.string().uuid(),
  hospitalId: z.string().uuid(),
  examId: z.string().uuid(),
  referredById: z.string().uuid().optional(),
});
export type CreateStudyInput = z.infer<typeof createStudySchema>;

export const scheduleStudySchema = z.object({
  ...versioned,
  scheduledAt: z.coerce.date(),
});
export type ScheduleStudyInput = z.infer<typeof scheduleStudySchema>;

export const reportStudySchema = z.object({
  ...versioned,
  findings: z.string().trim().min(1).max(2000),
  impression: z.string().trim().max(1000).optional(),
  imageUrl: z.string().trim().url().max(500).optional(),
});
export type ReportStudyInput = z.infer<typeof reportStudySchema>;

export const studyTransitionSchema = z.object({ ...versioned });
export type StudyTransitionInput = z.infer<typeof studyTransitionSchema>;

export const cancelStudySchema = z.object({ ...versioned, reason: z.string().trim().max(300).optional() });
export type CancelStudyInput = z.infer<typeof cancelStudySchema>;

export function formatStudyNumber(n: number): string {
  return `RAD-${String(n).padStart(6, '0')}`;
}
