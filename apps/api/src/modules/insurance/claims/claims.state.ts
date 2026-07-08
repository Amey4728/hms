import { ConflictException } from '@nestjs/common';
import type { ClaimStatus } from '@hms/shared';

export const CLAIM_TRANSITIONS: Record<ClaimStatus, ClaimStatus[]> = {
  SUBMITTED: ['UNDER_REVIEW', 'REJECTED'],
  UNDER_REVIEW: ['APPROVED', 'REJECTED'],
  APPROVED: ['SETTLED'],
  REJECTED: [],
  SETTLED: [],
};

export function assertClaimTransition(from: ClaimStatus, to: ClaimStatus): void {
  if (!CLAIM_TRANSITIONS[from].includes(to)) {
    throw new ConflictException(
      `Illegal claim transition ${from} → ${to}. Allowed: ${CLAIM_TRANSITIONS[from].join(', ') || 'none'}`,
    );
  }
}
