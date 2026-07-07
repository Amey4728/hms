import {
  Building2,
  CalendarClock,
  LayoutDashboard,
  Users,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import { PERMISSIONS, type PermissionAction } from '@hms/shared';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  /** Visible if the user holds any of these (empty = always visible). */
  anyOf: PermissionAction[];
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard, anyOf: [] },
  { label: 'Patients', to: '/patients', icon: UserRound, anyOf: [PERMISSIONS.PATIENT_READ] },
  {
    label: 'Appointments',
    to: '/appointments',
    icon: CalendarClock,
    anyOf: [PERMISSIONS.APPOINTMENT_READ],
  },
  {
    label: 'Hospitals',
    to: '/hospitals',
    icon: Building2,
    anyOf: [PERMISSIONS.HOSPITAL_READ],
  },
  { label: 'Users', to: '/users', icon: Users, anyOf: [PERMISSIONS.USER_READ] },
];
