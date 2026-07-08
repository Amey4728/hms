import { PERMISSIONS, type PermissionAction } from './permissions';

/**
 * System role identifiers. These are seeded as `isSystem` roles and cannot be
 * deleted. Hospital admins may create additional custom roles at runtime.
 */
export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  HOSPITAL_ADMIN: 'HOSPITAL_ADMIN',
  DOCTOR: 'DOCTOR',
  NURSE: 'NURSE',
  RECEPTIONIST: 'RECEPTIONIST',
  PHARMACIST: 'PHARMACIST',
  LAB_TECHNICIAN: 'LAB_TECHNICIAN',
  RADIOLOGIST: 'RADIOLOGIST',
  BILLING_EXECUTIVE: 'BILLING_EXECUTIVE',
  INSURANCE_EXECUTIVE: 'INSURANCE_EXECUTIVE',
  PATIENT: 'PATIENT',
  AUDITOR: 'AUDITOR',
} as const;

export type RoleName = (typeof ROLES)[keyof typeof ROLES];

export interface RoleDefinition {
  name: RoleName;
  displayName: string;
  description: string;
  /** Use ['*'] to grant every permission (Super Admin). */
  permissions: PermissionAction[] | ['*'];
}

const P = PERMISSIONS;

/**
 * Default role → permission mapping consumed by the seed script.
 * Permission checks are always by permission string, never by role name.
 */
export const ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    name: ROLES.SUPER_ADMIN,
    displayName: 'Super Admin',
    description: 'Platform owner with unrestricted access.',
    permissions: ['*'],
  },
  {
    name: ROLES.HOSPITAL_ADMIN,
    displayName: 'Hospital Admin',
    description: 'Administers a hospital, its branches, departments and staff.',
    permissions: [
      P.USER_CREATE, P.USER_READ, P.USER_UPDATE, P.USER_DELETE,
      P.ROLE_READ, P.ROLE_ASSIGN, P.PERMISSION_READ,
      P.HOSPITAL_READ, P.HOSPITAL_UPDATE,
      P.BRANCH_CREATE, P.BRANCH_READ, P.BRANCH_UPDATE, P.BRANCH_DELETE,
      P.DEPARTMENT_CREATE, P.DEPARTMENT_READ, P.DEPARTMENT_UPDATE, P.DEPARTMENT_DELETE,
      P.STAFF_MANAGE, P.ATTENDANCE_MANAGE, P.PAYROLL_MANAGE,
      P.REPORT_VIEW, P.AUDIT_READ,
    ],
  },
  {
    name: ROLES.DOCTOR,
    displayName: 'Doctor',
    description: 'Clinician: consultations, diagnoses, prescriptions.',
    permissions: [
      P.PATIENT_READ, P.PATIENT_UPDATE,
      P.APPOINTMENT_READ, P.APPOINTMENT_UPDATE, P.DOCTOR_SCHEDULE,
      P.PRESCRIPTION_CREATE, P.PRESCRIPTION_READ,
      P.DIAGNOSIS_CREATE, P.DIAGNOSIS_READ,
      P.LAB_RESULT_READ, P.REPORT_VIEW,
    ],
  },
  {
    name: ROLES.NURSE,
    displayName: 'Nurse',
    description: 'Patient care, vitals, ward support.',
    permissions: [
      P.PATIENT_READ, P.PATIENT_UPDATE,
      P.APPOINTMENT_READ, P.PRESCRIPTION_READ, P.LAB_RESULT_READ,
    ],
  },
  {
    name: ROLES.RECEPTIONIST,
    displayName: 'Receptionist',
    description: 'Front desk: registration, appointments, queue.',
    permissions: [
      P.PATIENT_CREATE, P.PATIENT_READ, P.PATIENT_UPDATE,
      P.APPOINTMENT_CREATE, P.APPOINTMENT_READ, P.APPOINTMENT_UPDATE, P.APPOINTMENT_CANCEL,
    ],
  },
  {
    name: ROLES.PHARMACIST,
    displayName: 'Pharmacist',
    description: 'Dispensing, pharmacy inventory and sales.',
    permissions: [
      P.PRESCRIPTION_READ, P.INVENTORY_MANAGE, P.PHARMACY_SALE_CREATE,
    ],
  },
  {
    name: ROLES.LAB_TECHNICIAN,
    displayName: 'Lab Technician',
    description: 'Sample processing and lab result entry.',
    permissions: [
      P.LAB_TEST_MANAGE, P.LAB_RESULT_CREATE, P.LAB_RESULT_READ, P.PATIENT_READ,
    ],
  },
  {
    name: ROLES.RADIOLOGIST,
    displayName: 'Radiologist',
    description: 'Imaging studies and report uploads.',
    permissions: [
      P.RADIOLOGY_MANAGE, P.RADIOLOGY_REPORT_UPLOAD, P.PATIENT_READ,
    ],
  },
  {
    name: ROLES.BILLING_EXECUTIVE,
    displayName: 'Billing Executive',
    description: 'Invoices, payments, refunds.',
    permissions: [
      P.BILLING_GENERATE, P.BILLING_READ, P.BILLING_REFUND, P.PATIENT_READ,
    ],
  },
  {
    name: ROLES.INSURANCE_EXECUTIVE,
    displayName: 'Insurance Executive',
    description: 'Insurance claims and approvals.',
    permissions: [
      P.INSURANCE_CLAIM_CREATE, P.INSURANCE_CLAIM_APPROVE, P.BILLING_READ, P.PATIENT_READ,
    ],
  },
  {
    name: ROLES.PATIENT,
    displayName: 'Patient',
    description: 'Self-service portal access.',
    permissions: [
      P.APPOINTMENT_CREATE, P.APPOINTMENT_READ, P.PRESCRIPTION_READ,
      P.LAB_RESULT_READ, P.BILLING_READ,
    ],
  },
  {
    name: ROLES.AUDITOR,
    displayName: 'Auditor',
    description: 'Read-only oversight across the platform.',
    permissions: [
      P.AUDIT_READ, P.REPORT_VIEW, P.USER_READ, P.PATIENT_READ, P.BILLING_READ,
    ],
  },
];

/** The role assigned to self-registered users. */
export const DEFAULT_SELF_REGISTER_ROLE: RoleName = ROLES.PATIENT;
