import type { Appointment } from '@prisma/client';
import { formatAppointmentNumber } from '@hms/shared';

/** Adds the human-readable appointment reference (APT-000001). */
export function toAppointmentView<T extends Appointment>(a: T): T & { appointmentRef: string } {
  return { ...a, appointmentRef: formatAppointmentNumber(a.appointmentNumber) };
}
