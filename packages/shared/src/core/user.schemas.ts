import { z } from 'zod';
import { passwordSchema } from '../auth/schemas';

export const USER_STATUSES = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING'] as const;
export const userStatusSchema = z.enum(USER_STATUSES);
export type UserStatus = (typeof USER_STATUSES)[number];

const versioned = { version: z.coerce.number().int().nonnegative() };
const phone = z
  .string()
  .trim()
  .regex(/^[+]?[0-9\s-]{7,20}$/, 'Invalid phone number')
  .optional();

/** Admin-created user (assign one or more roles up front). */
export const createUserSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: passwordSchema,
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  phone,
  roleIds: z.array(z.string().uuid()).min(1, 'At least one role is required'),
  hospitalId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
  status: userStatusSchema.default('ACTIVE'),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  ...versioned,
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().min(1).max(80).optional(),
  phone,
  hospitalId: z.string().uuid().nullable().optional(),
  branchId: z.string().uuid().nullable().optional(),
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const updateUserStatusSchema = z.object({
  ...versioned,
  status: userStatusSchema,
});
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
