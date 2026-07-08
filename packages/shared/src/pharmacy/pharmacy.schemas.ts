import { z } from 'zod';

export const MEDICINE_FORMS = [
  'TABLET',
  'CAPSULE',
  'SYRUP',
  'INJECTION',
  'OINTMENT',
  'DROPS',
  'OTHER',
] as const;
export const medicineFormSchema = z.enum(MEDICINE_FORMS);
export type MedicineForm = (typeof MEDICINE_FORMS)[number];

const versioned = { version: z.coerce.number().int().nonnegative() };
const code = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9_-]{2,20}$/, 'Code must be 2–20 chars: A–Z, 0–9, dash or underscore');
const futureDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD');

// ── Medicine catalogue ─────────────────────────────────────────────────────
export const createMedicineSchema = z.object({
  code,
  name: z.string().trim().min(2).max(150),
  genericName: z.string().trim().max(150).optional(),
  form: medicineFormSchema.default('TABLET'),
  strength: z.string().trim().max(60).optional(),
  manufacturer: z.string().trim().max(120).optional(),
  unitPrice: z.coerce.number().nonnegative().default(0),
  reorderLevel: z.coerce.number().int().nonnegative().default(0),
  isActive: z.boolean().default(true),
  hospitalId: z.string().uuid().optional(),
});
export type CreateMedicineInput = z.infer<typeof createMedicineSchema>;

export const updateMedicineSchema = createMedicineSchema.omit({ code: true }).partial().extend(versioned);
export type UpdateMedicineInput = z.infer<typeof updateMedicineSchema>;

// ── Inventory (batch intake) ────────────────────────────────────────────────
export const receiveBatchSchema = z.object({
  batchNumber: z.string().trim().min(1).max(60),
  quantity: z.coerce.number().int().positive(),
  expiryDate: futureDate,
  costPrice: z.coerce.number().nonnegative().optional(),
});
export type ReceiveBatchInput = z.infer<typeof receiveBatchSchema>;

// ── Sales ───────────────────────────────────────────────────────────────────
export const createSaleSchema = z.object({
  patientId: z.string().uuid().optional(),
  hospitalId: z.string().uuid().optional(),
  items: z
    .array(
      z.object({
        medicineId: z.string().uuid(),
        quantity: z.coerce.number().int().positive(),
      }),
    )
    .min(1, 'At least one item is required'),
  discount: z.coerce.number().nonnegative().default(0),
  taxRate: z.coerce.number().min(0).max(100).default(0),
});
export type CreateSaleInput = z.infer<typeof createSaleSchema>;

export function formatSaleNumber(n: number): string {
  return `SALE-${String(n).padStart(6, '0')}`;
}
