import type { AppointmentStatus } from '@hms/shared';

export const STATUS_TONE: Record<
  AppointmentStatus,
  'neutral' | 'success' | 'warning' | 'danger' | 'info'
> = {
  BOOKED: 'info',
  CHECKED_IN: 'warning',
  IN_PROGRESS: 'info',
  COMPLETED: 'success',
  CANCELLED: 'neutral',
  NO_SHOW: 'danger',
};

export type TransitionAction = 'check-in' | 'start' | 'complete' | 'no-show';

/** Buttons to show for an appointment given its status. */
export function nextActions(status: AppointmentStatus): { action: TransitionAction; label: string }[] {
  switch (status) {
    case 'BOOKED':
      return [
        { action: 'check-in', label: 'Check in' },
        { action: 'no-show', label: 'No-show' },
      ];
    case 'CHECKED_IN':
      return [{ action: 'start', label: 'Start' }];
    case 'IN_PROGRESS':
      return [{ action: 'complete', label: 'Complete' }];
    default:
      return [];
  }
}

export const CANCELLABLE: AppointmentStatus[] = ['BOOKED', 'CHECKED_IN'];
