import { z } from 'zod';

export const CLAIM_STATUSES = ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'SETTLED'] as const;
export const claimStatusSchema = z.enum(CLAIM_STATUSES);
export type ClaimStatus = (typeof CLAIM_STATUSES)[number];

const versioned = { version: z.coerce.number().int().nonnegative() };
const code = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9_-]{2,20}$/, 'Code must be 2–20 chars: A–Z, 0–9, dash or underscore');

export const createProviderSchema = z.object({
  code,
  name: z.string().trim().min(2).max(150),
  contactEmail: z.string().trim().toLowerCase().email().optional(),
  contactPhone: z.string().trim().max(20).optional(),
  isActive: z.boolean().default(true),
});
export type CreateProviderInput = z.infer<typeof createProviderSchema>;

export const updateProviderSchema = createProviderSchema.omit({ code: true }).partial().extend(versioned);
export type UpdateProviderInput = z.infer<typeof updateProviderSchema>;

export const createClaimSchema = z.object({
  patientId: z.string().uuid(),
  providerId: z.string().uuid(),
  invoiceId: z.string().uuid().optional(),
  policyNumber: z.string().trim().min(1).max(80),
  claimedAmount: z.coerce.number().positive(),
  notes: z.string().trim().max(500).optional(),
});
export type CreateClaimInput = z.infer<typeof createClaimSchema>;

export const claimTransitionSchema = z.object({ ...versioned });
export type ClaimTransitionInput = z.infer<typeof claimTransitionSchema>;

export const approveClaimSchema = z.object({
  ...versioned,
  approvedAmount: z.coerce.number().nonnegative(),
  decisionNote: z.string().trim().max(300).optional(),
});
export type ApproveClaimInput = z.infer<typeof approveClaimSchema>;

export const rejectClaimSchema = z.object({
  ...versioned,
  decisionNote: z.string().trim().min(1).max(300),
});
export type RejectClaimInput = z.infer<typeof rejectClaimSchema>;

export function formatClaimNumber(n: number): string {
  return `CLM-${String(n).padStart(6, '0')}`;
}
