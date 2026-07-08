import { z } from 'zod';

export const INVENTORY_CATEGORIES = ['EQUIPMENT', 'CONSUMABLE', 'OTHER'] as const;
export const PURCHASE_STATUSES = ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'RECEIVED'] as const;
export const TRANSFER_STATUSES = ['PENDING', 'COMPLETED', 'CANCELLED'] as const;

export const inventoryCategorySchema = z.enum(INVENTORY_CATEGORIES);
export const purchaseStatusSchema = z.enum(PURCHASE_STATUSES);
export const transferStatusSchema = z.enum(TRANSFER_STATUSES);
export type InventoryCategory = (typeof INVENTORY_CATEGORIES)[number];
export type PurchaseStatus = (typeof PURCHASE_STATUSES)[number];
export type TransferStatus = (typeof TRANSFER_STATUSES)[number];

const versioned = { version: z.coerce.number().int().nonnegative() };
const code = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9_-]{2,20}$/, 'Code must be 2–20 chars: A–Z, 0–9, dash or underscore');

// ── Vendor ──────────────────────────────────────────────────────────────────
export const createVendorSchema = z.object({
  code,
  name: z.string().trim().min(2).max(150),
  contactEmail: z.string().trim().toLowerCase().email().optional(),
  contactPhone: z.string().trim().max(20).optional(),
  address: z.string().trim().max(255).optional(),
  isActive: z.boolean().default(true),
});
export type CreateVendorInput = z.infer<typeof createVendorSchema>;
export const updateVendorSchema = createVendorSchema.omit({ code: true }).partial().extend(versioned);
export type UpdateVendorInput = z.infer<typeof updateVendorSchema>;

// ── Inventory item ────────────────────────────────────────────────────────────
export const createInventoryItemSchema = z.object({
  code,
  name: z.string().trim().min(2).max(150),
  category: inventoryCategorySchema.default('CONSUMABLE'),
  unit: z.string().trim().max(30).optional(),
  quantity: z.coerce.number().int().nonnegative().default(0),
  reorderLevel: z.coerce.number().int().nonnegative().default(0),
  unitCost: z.coerce.number().nonnegative().optional(),
  hospitalId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  isActive: z.boolean().default(true),
});
export type CreateInventoryItemInput = z.infer<typeof createInventoryItemSchema>;
export const updateInventoryItemSchema = createInventoryItemSchema
  .omit({ code: true, quantity: true })
  .partial()
  .extend(versioned);
export type UpdateInventoryItemInput = z.infer<typeof updateInventoryItemSchema>;

export const adjustStockSchema = z.object({
  delta: z.coerce.number().int().refine((n) => n !== 0, 'delta cannot be zero'),
  note: z.string().trim().max(200).optional(),
});
export type AdjustStockInput = z.infer<typeof adjustStockSchema>;

// ── Purchase request ──────────────────────────────────────────────────────────
export const createPurchaseRequestSchema = z.object({
  vendorId: z.string().uuid().optional(),
  notes: z.string().trim().max(500).optional(),
  items: z
    .array(
      z.object({
        itemId: z.string().uuid(),
        quantity: z.coerce.number().int().positive(),
        unitCost: z.coerce.number().nonnegative().optional(),
      }),
    )
    .min(1, 'At least one item is required'),
});
export type CreatePurchaseRequestInput = z.infer<typeof createPurchaseRequestSchema>;

export const purchaseTransitionSchema = z.object({ ...versioned });
export type PurchaseTransitionInput = z.infer<typeof purchaseTransitionSchema>;
export const purchaseDecisionSchema = z.object({ ...versioned, decisionNote: z.string().trim().max(300).optional() });
export type PurchaseDecisionInput = z.infer<typeof purchaseDecisionSchema>;

// ── Stock transfer ────────────────────────────────────────────────────────────
export const createTransferSchema = z.object({
  itemId: z.string().uuid(),
  fromBranchId: z.string().uuid().optional(),
  toBranchId: z.string().uuid().optional(),
  quantity: z.coerce.number().int().positive(),
  note: z.string().trim().max(200).optional(),
});
export type CreateTransferInput = z.infer<typeof createTransferSchema>;
export const transferTransitionSchema = z.object({ ...versioned });
export type TransferTransitionInput = z.infer<typeof transferTransitionSchema>;

export function formatPurchaseNumber(n: number): string {
  return `PO-${String(n).padStart(6, '0')}`;
}
export function formatTransferNumber(n: number): string {
  return `TRF-${String(n).padStart(6, '0')}`;
}
