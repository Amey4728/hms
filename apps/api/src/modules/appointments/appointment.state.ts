import { ConflictException } from '@nestjs/common';
import type { AppointmentStatus } from '@hms/shared';

/** Allowed status transitions for the appointment lifecycle. */
export const APPOINTMENT_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  BOOKED: ['CHECKED_IN', 'CANCELLED', 'NO_SHOW'],
  CHECKED_IN: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

export function assertTransition(from: AppointmentStatus, to: AppointmentStatus): void {
  if (!APPOINTMENT_TRANSITIONS[from].includes(to)) {
    throw new ConflictException(
      `Illegal appointment transition ${from} → ${to}. Allowed: ${
        APPOINTMENT_TRANSITIONS[from].join(', ') || 'none'
      }`,
    );
  }
}

/** Statuses that occupy a doctor's time (block overlapping bookings). */
export const ACTIVE_STATUSES: AppointmentStatus[] = ['BOOKED', 'CHECKED_IN', 'IN_PROGRESS'];

/** Truncate a timestamp to a UTC date-only Date (for token bucketing). */
export function toDateOnly(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}
