import { z } from 'zod';

/** Department categories — mirrors the Prisma `DepartmentType` enum. */
export const DEPARTMENT_TYPES = ['CLINICAL', 'DIAGNOSTIC', 'SUPPORT', 'ADMINISTRATIVE'] as const;
export const departmentTypeSchema = z.enum(DEPARTMENT_TYPES);
export type DepartmentType = (typeof DEPARTMENT_TYPES)[number];

/** Entity code: uppercase alphanumeric with dash/underscore, 2–20 chars. */
const codeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9_-]{2,20}$/, 'Code must be 2–20 chars: A–Z, 0–9, dash or underscore');

/** Optional contact + address fields shared by every org entity. */
const contactFields = {
  email: z.string().trim().toLowerCase().email().optional(),
  phone: z
    .string()
    .trim()
    .regex(/^[+]?[0-9\s-]{7,20}$/, 'Invalid phone number')
    .optional(),
  addressLine: z.string().trim().max(255).optional(),
  city: z.string().trim().max(120).optional(),
  state: z.string().trim().max(120).optional(),
  country: z.string().trim().max(120).optional(),
  postalCode: z.string().trim().max(20).optional(),
};

/** Version required on every update for optimistic locking. */
const versioned = { version: z.coerce.number().int().nonnegative() };

// ── Hospital ───────────────────────────────────────────────────────────
export const createHospitalSchema = z.object({
  name: z.string().trim().min(2).max(150),
  code: codeSchema,
  licenseNumber: z.string().trim().max(80).optional(),
  isActive: z.boolean().default(true),
  ...contactFields,
});
export type CreateHospitalInput = z.infer<typeof createHospitalSchema>;

export const updateHospitalSchema = createHospitalSchema.partial().extend(versioned);
export type UpdateHospitalInput = z.infer<typeof updateHospitalSchema>;

// ── Branch ─────────────────────────────────────────────────────────────
export const createBranchSchema = z.object({
  hospitalId: z.string().uuid(),
  name: z.string().trim().min(2).max(150),
  code: codeSchema,
  isActive: z.boolean().default(true),
  ...contactFields,
});
export type CreateBranchInput = z.infer<typeof createBranchSchema>;

export const updateBranchSchema = createBranchSchema
  .omit({ hospitalId: true })
  .partial()
  .extend(versioned);
export type UpdateBranchInput = z.infer<typeof updateBranchSchema>;

// ── Department ─────────────────────────────────────────────────────────
export const createDepartmentSchema = z.object({
  hospitalId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(150),
  code: codeSchema,
  type: departmentTypeSchema.default('CLINICAL'),
  description: z.string().trim().max(500).optional(),
  isActive: z.boolean().default(true),
});
export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;

export const updateDepartmentSchema = createDepartmentSchema
  .omit({ hospitalId: true })
  .partial()
  .extend({
    ...versioned,
    // nullable → pass `null` to detach the department from its branch
    branchId: z.string().uuid().nullable().optional(),
  });
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
