import { formatClaimNumber, formatMrn } from '@hms/shared';
import type { ClaimWithRefs } from './claims.repository';

export function toClaimView(c: ClaimWithRefs) {
  return {
    id: c.id,
    claimNumber: c.claimNumber,
    claimRef: formatClaimNumber(c.claimNumber),
    patientId: c.patientId,
    patientName: `${c.patient.firstName} ${c.patient.lastName}`,
    patientMrn: formatMrn(c.patient.patientNumber),
    providerId: c.providerId,
    providerName: c.provider.name,
    invoiceId: c.invoiceId,
    policyNumber: c.policyNumber,
    claimedAmount: c.claimedAmount.toNumber(),
    approvedAmount: c.approvedAmount ? c.approvedAmount.toNumber() : null,
    status: c.status,
    notes: c.notes,
    decisionNote: c.decisionNote,
    submittedAt: c.submittedAt,
    decisionAt: c.decisionAt,
    settledAt: c.settledAt,
    version: c.version,
    createdAt: c.createdAt,
  };
}
