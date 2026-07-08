import type { AppointmentStatus, AppointmentType } from '@hms/shared';

export interface Appointment {
  id: string;
  appointmentNumber: number;
  appointmentRef: string;
  patientId: string;
  doctorId: string;
  hospitalId: string;
  branchId: string | null;
  departmentId: string | null;
  scheduledStart: string;
  scheduledEnd: string;
  status: AppointmentStatus;
  type: AppointmentType;
  reason: string | null;
  tokenNumber: number | null;
  tokenDate: string | null;
  checkedInAt: string | null;
  cancellationReason: string | null;
  version: number;
  // present on list / queue views
  patientName?: string;
  patientMrn?: string;
  doctorName?: string;
}

export interface Slot {
  start: string;
  end: string;
}
