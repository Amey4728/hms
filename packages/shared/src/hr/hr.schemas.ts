import { z } from 'zod';

export const EMPLOYMENT_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT'] as const;
export const EMPLOYEE_STATUSES = ['ACTIVE', 'ON_LEAVE', 'INACTIVE', 'TERMINATED'] as const;
export const ATTENDANCE_STATUSES = ['PRESENT', 'ABSENT', 'HALF_DAY', 'ON_LEAVE'] as const;
export const LEAVE_TYPES = ['SICK', 'CASUAL', 'EARNED', 'UNPAID'] as const;
export const LEAVE_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;
export const PAYROLL_STATUSES = ['DRAFT', 'FINALIZED', 'PAID'] as const;

export const employmentTypeSchema = z.enum(EMPLOYMENT_TYPES);
export const employeeStatusSchema = z.enum(EMPLOYEE_STATUSES);
export const attendanceStatusSchema = z.enum(ATTENDANCE_STATUSES);
export const leaveTypeSchema = z.enum(LEAVE_TYPES);
export const payrollStatusSchema = z.enum(PAYROLL_STATUSES);
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];
export type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[number];
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];
export type LeaveType = (typeof LEAVE_TYPES)[number];
export type LeaveStatus = (typeof LEAVE_STATUSES)[number];
export type PayrollStatus = (typeof PAYROLL_STATUSES)[number];

const versioned = { version: z.coerce.number().int().nonnegative() };
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD');
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be HH:MM');

export const createEmployeeSchema = z.object({
  userId: z.string().uuid().optional(),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().email().optional(),
  phone: z.string().trim().max(20).optional(),
  designation: z.string().trim().min(1).max(100),
  department: z.string().trim().max(100).optional(),
  hospitalId: z.string().uuid().optional(),
  employmentType: employmentTypeSchema.default('FULL_TIME'),
  joinedAt: dateOnly,
  baseSalary: z.coerce.number().nonnegative().default(0),
});
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

export const updateEmployeeSchema = createEmployeeSchema
  .omit({ userId: true, joinedAt: true })
  .partial()
  .extend({ ...versioned, status: employeeStatusSchema.optional() });
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;

export const markAttendanceSchema = z.object({
  date: dateOnly,
  status: attendanceStatusSchema.default('PRESENT'),
  checkIn: time.optional(),
  checkOut: time.optional(),
  note: z.string().trim().max(200).optional(),
});
export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>;

export const createLeaveSchema = z
  .object({
    type: leaveTypeSchema,
    startDate: dateOnly,
    endDate: dateOnly,
    reason: z.string().trim().max(300).optional(),
  })
  .refine((v) => v.startDate <= v.endDate, { message: 'startDate must be on or before endDate', path: ['endDate'] });
export type CreateLeaveInput = z.infer<typeof createLeaveSchema>;

export const leaveDecisionSchema = z.object({ ...versioned, decisionNote: z.string().trim().max(300).optional() });
export type LeaveDecisionInput = z.infer<typeof leaveDecisionSchema>;

export const createShiftSchema = z
  .object({
    employeeId: z.string().uuid(),
    date: dateOnly,
    startTime: time,
    endTime: time,
    note: z.string().trim().max(200).optional(),
  })
  .refine((v) => v.startTime < v.endTime, { message: 'startTime must be before endTime', path: ['endTime'] });
export type CreateShiftInput = z.infer<typeof createShiftSchema>;

export const generatePayslipSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/, 'Period must be YYYY-MM'),
  allowances: z.coerce.number().nonnegative().default(0),
  deductions: z.coerce.number().nonnegative().default(0),
});
export type GeneratePayslipInput = z.infer<typeof generatePayslipSchema>;

export const payslipStatusSchema = z.object({ ...versioned, status: payrollStatusSchema });
export type PayslipStatusInput = z.infer<typeof payslipStatusSchema>;

export function formatEmployeeNumber(n: number): string {
  return `EMP-${String(n).padStart(5, '0')}`;
}
