import { ConflictException } from '@nestjs/common';
import type { LabOrderStatus } from '@hms/shared';

export const LAB_ORDER_TRANSITIONS: Record<LabOrderStatus, LabOrderStatus[]> = {
  ORDERED: ['SAMPLE_COLLECTED', 'CANCELLED'],
  SAMPLE_COLLECTED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

export function assertLabTransition(from: LabOrderStatus, to: LabOrderStatus): void {
  if (!LAB_ORDER_TRANSITIONS[from].includes(to)) {
    throw new ConflictException(
      `Illegal lab order transition ${from} → ${to}. Allowed: ${
        LAB_ORDER_TRANSITIONS[from].join(', ') || 'none'
      }`,
    );
  }
}
