import type { Appointment } from '@prisma/client';
import { formatAppointmentNumber, formatMrn } from '@hms/shared';
import type { AppointmentWithRefs } from './appointments.repository';

/** Adds the human-readable appointment reference (APT-000001). */
export function toAppointmentView<T extends Appointment>(a: T): T & { appointmentRef: string } {
  return { ...a, appointmentRef: formatAppointmentNumber(a.appointmentNumber) };
}

/** List/queue view that also resolves patient + doctor display names. */
export function toAppointmentListView(a: AppointmentWithRefs) {
  const { patient, doctor, ...rest } = a;
  return {
    ...rest,
    appointmentRef: formatAppointmentNumber(a.appointmentNumber),
    patientName: `${patient.firstName} ${patient.lastName}`,
    patientMrn: formatMrn(patient.patientNumber),
    doctorName: `${doctor.firstName} ${doctor.lastName}`,
  };
}
