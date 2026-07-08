import { ConflictException } from '@nestjs/common';
import type { RadiologyStatus } from '@hms/shared';

export const STUDY_TRANSITIONS: Record<RadiologyStatus, RadiologyStatus[]> = {
  REQUESTED: ['SCHEDULED', 'CANCELLED'],
  SCHEDULED: ['PERFORMED', 'CANCELLED'],
  PERFORMED: ['REPORTED', 'CANCELLED'],
  REPORTED: [],
  CANCELLED: [],
};

export function assertStudyTransition(from: RadiologyStatus, to: RadiologyStatus): void {
  if (!STUDY_TRANSITIONS[from].includes(to)) {
    throw new ConflictException(
      `Illegal study transition ${from} → ${to}. Allowed: ${STUDY_TRANSITIONS[from].join(', ') || 'none'}`,
    );
  }
}
