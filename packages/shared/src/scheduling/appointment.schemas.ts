import { z } from 'zod';

// ── Enums (mirror the Prisma enums) ──────────────────────────────────────
export const APPOINTMENT_STATUSES = [
  'BOOKED',
  'CHECKED_IN',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
] as const;
export const APPOINTMENT_TYPES = ['SCHEDULED', 'WALK_IN'] as const;

export const appointmentStatusSchema = z.enum(APPOINTMENT_STATUSES);
export const appointmentTypeSchema = z.enum(APPOINTMENT_TYPES);
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];
export type AppointmentType = (typeof APPOINTMENT_TYPES)[number];

const versioned = { version: z.coerce.number().int().nonnegative() };
const timeString = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be HH:MM (24h)');
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD');
const durationMinutes = z.coerce.number().int().min(5).max(240).default(15);

// ── Doctor availability ──────────────────────────────────────────────────
export const createAvailabilitySchema = z
  .object({
    doctorId: z.string().uuid(),
    hospitalId: z.string().uuid(),
    branchId: z.string().uuid().optional(),
    departmentId: z.string().uuid().optional(),
    dayOfWeek: z.coerce.number().int().min(0).max(6),
    startTime: timeString,
    endTime: timeString,
    slotDurationMinutes: durationMinutes,
    isActive: z.boolean().default(true),
  })
  .refine((v) => v.startTime < v.endTime, {
    message: 'startTime must be before endTime',
    path: ['endTime'],
  });
export type CreateAvailabilityInput = z.infer<typeof createAvailabilitySchema>;

export const updateAvailabilitySchema = z.object({
  ...versioned,
  startTime: timeString.optional(),
  endTime: timeString.optional(),
  slotDurationMinutes: z.coerce.number().int().min(5).max(240).optional(),
  isActive: z.boolean().optional(),
});
export type UpdateAvailabilityInput = z.infer<typeof updateAvailabilitySchema>;

// ── Appointments ─────────────────────────────────────────────────────────
export const bookAppointmentSchema = z.object({
  patientId: z.string().uuid(),
  doctorId: z.string().uuid(),
  hospitalId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  scheduledStart: z.coerce.date(),
  durationMinutes,
  reason: z.string().trim().max(300).optional(),
});
export type BookAppointmentInput = z.infer<typeof bookAppointmentSchema>;

export const walkInSchema = z.object({
  patientId: z.string().uuid(),
  doctorId: z.string().uuid(),
  hospitalId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  durationMinutes,
  reason: z.string().trim().max(300).optional(),
});
export type WalkInInput = z.infer<typeof walkInSchema>;

export const rescheduleSchema = z.object({
  ...versioned,
  scheduledStart: z.coerce.date(),
  durationMinutes: z.coerce.number().int().min(5).max(240).optional(),
});
export type RescheduleInput = z.infer<typeof rescheduleSchema>;

export const cancelAppointmentSchema = z.object({
  ...versioned,
  reason: z.string().trim().max(300).optional(),
});
export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>;

export const transitionSchema = z.object({ ...versioned });
export type TransitionInput = z.infer<typeof transitionSchema>;

/** Query for the free-slot generator. */
export const slotsQuerySchema = z.object({
  doctorId: z.string().uuid(),
  date: dateOnly,
});
export type SlotsQuery = z.infer<typeof slotsQuerySchema>;

export function formatAppointmentNumber(n: number): string {
  return `APT-${String(n).padStart(6, '0')}`;
}
