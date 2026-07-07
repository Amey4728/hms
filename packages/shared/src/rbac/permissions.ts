/**
 * Central permission catalogue for the entire HMS.
 *
 * Format: `<resource>.<action>`. This is the single source of truth shared by
 * the API (guards + seed) and the web app (permission-based menus). Adding a
 * new capability = adding a string here and mapping it to roles in `roles.ts`.
 */

export const PERMISSIONS = {
  // ── Core: users / roles / permissions ─────────────────────────────
  USER_CREATE: 'user.create',
  USER_READ: 'user.read',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',

  ROLE_CREATE: 'role.create',
  ROLE_READ: 'role.read',
  ROLE_UPDATE: 'role.update',
  ROLE_DELETE: 'role.delete',
  ROLE_ASSIGN: 'role.assign',

  PERMISSION_READ: 'permission.read',

  // ── Core: organisation ────────────────────────────────────────────
  HOSPITAL_CREATE: 'hospital.create',
  HOSPITAL_READ: 'hospital.read',
  HOSPITAL_UPDATE: 'hospital.update',
  HOSPITAL_DELETE: 'hospital.delete',

  BRANCH_CREATE: 'branch.create',
  BRANCH_READ: 'branch.read',
  BRANCH_UPDATE: 'branch.update',
  BRANCH_DELETE: 'branch.delete',

  DEPARTMENT_CREATE: 'department.create',
  DEPARTMENT_READ: 'department.read',
  DEPARTMENT_UPDATE: 'department.update',
  DEPARTMENT_DELETE: 'department.delete',

  // ── Clinical (wired in later phases) ──────────────────────────────
  PATIENT_CREATE: 'patient.create',
  PATIENT_READ: 'patient.read',
  PATIENT_UPDATE: 'patient.update',
  PATIENT_DELETE: 'patient.delete',

  PRESCRIPTION_CREATE: 'prescription.create',
  PRESCRIPTION_READ: 'prescription.read',

  DIAGNOSIS_CREATE: 'diagnosis.create',
  DIAGNOSIS_READ: 'diagnosis.read',

  // ── Appointments ──────────────────────────────────────────────────
  APPOINTMENT_CREATE: 'appointment.create',
  APPOINTMENT_READ: 'appointment.read',
  APPOINTMENT_UPDATE: 'appointment.update',
  APPOINTMENT_CANCEL: 'appointment.cancel',
  DOCTOR_SCHEDULE: 'doctor.schedule',

  // ── Laboratory ────────────────────────────────────────────────────
  LAB_TEST_MANAGE: 'lab.test.manage',
  LAB_RESULT_CREATE: 'lab.result.create',
  LAB_RESULT_READ: 'lab.result.read',

  // ── Radiology ─────────────────────────────────────────────────────
  RADIOLOGY_MANAGE: 'radiology.manage',
  RADIOLOGY_REPORT_UPLOAD: 'radiology.report.upload',

  // ── Pharmacy / Inventory ──────────────────────────────────────────
  INVENTORY_MANAGE: 'inventory.manage',
  PHARMACY_SALE_CREATE: 'pharmacy.sale.create',

  // ── Billing / Insurance ───────────────────────────────────────────
  BILLING_GENERATE: 'billing.generate',
  BILLING_READ: 'billing.read',
  BILLING_REFUND: 'billing.refund',
  INSURANCE_CLAIM_CREATE: 'insurance.claim.create',
  INSURANCE_CLAIM_APPROVE: 'insurance.claim.approve',

  // ── HR ────────────────────────────────────────────────────────────
  STAFF_MANAGE: 'staff.manage',
  ATTENDANCE_MANAGE: 'attendance.manage',
  PAYROLL_MANAGE: 'payroll.manage',

  // ── Reports / Audit ───────────────────────────────────────────────
  REPORT_VIEW: 'report.view',
  AUDIT_READ: 'audit.read',
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;
export type PermissionAction = (typeof PERMISSIONS)[PermissionKey];

/** Flat list of every permission action string. */
export const ALL_PERMISSIONS: PermissionAction[] = Object.values(PERMISSIONS);

/** Split an action string into its `resource` and `action` parts for storage. */
export function splitPermission(action: PermissionAction): {
  resource: string;
  action: string;
} {
  const idx = action.lastIndexOf('.');
  return {
    resource: action.slice(0, idx),
    action: action.slice(idx + 1),
  };
}
