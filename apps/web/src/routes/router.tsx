import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { PlaceholderPage } from '@/components/PlaceholderPage';
import { LoginPage } from '@/features/auth/LoginPage';
import { AppointmentsListPage } from '@/features/appointments/AppointmentsListPage';
import { QueueBoardPage } from '@/features/appointments/QueueBoardPage';
import { LabOrdersPage } from '@/features/laboratory/LabOrdersPage';
import { LabCataloguePage } from '@/features/laboratory/LabCataloguePage';
import { SalesPage } from '@/features/pharmacy/SalesPage';
import { MedicinesPage } from '@/features/pharmacy/MedicinesPage';
import { StockPage } from '@/features/pharmacy/StockPage';
import { InvoicesPage } from '@/features/billing/InvoicesPage';
import { ReportsPage } from '@/features/reports/ReportsPage';
import { RadiologyStudiesPage } from '@/features/radiology/RadiologyStudiesPage';
import { RadiologyCataloguePage } from '@/features/radiology/RadiologyCataloguePage';
import { ClaimsPage } from '@/features/insurance/ClaimsPage';
import { ProvidersPage } from '@/features/insurance/ProvidersPage';
import { EmployeesPage } from '@/features/hr/EmployeesPage';
import { LeavePage } from '@/features/hr/LeavePage';
import { PayrollPage } from '@/features/hr/PayrollPage';
import { ItemsPage } from '@/features/procurement/ItemsPage';
import { VendorsPage } from '@/features/procurement/VendorsPage';
import { PurchaseRequestsPage } from '@/features/procurement/PurchaseRequestsPage';
import { HospitalsPage } from '@/features/organization/HospitalsPage';
import { BranchesPage } from '@/features/organization/BranchesPage';
import { DepartmentsPage } from '@/features/organization/DepartmentsPage';
import { VisitsPage } from '@/features/clinical/VisitsPage';
import { VisitDetailPage } from '@/features/clinical/VisitDetailPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { UsersListPage } from '@/features/users/UsersListPage';
import { PatientsListPage } from '@/features/patients/PatientsListPage';
import { PatientRegisterPage } from '@/features/patients/PatientRegisterPage';
import { PatientProfilePage } from '@/features/patients/PatientProfilePage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'patients', element: <PatientsListPage /> },
          { path: 'patients/new', element: <PatientRegisterPage /> },
          { path: 'patients/:id', element: <PatientProfilePage /> },
          { path: 'visits', element: <VisitsPage /> },
          { path: 'visits/:id', element: <VisitDetailPage /> },
          { path: 'appointments', element: <AppointmentsListPage /> },
          { path: 'appointments/queue', element: <QueueBoardPage /> },
          { path: 'laboratory', element: <LabOrdersPage /> },
          { path: 'laboratory/catalogue', element: <LabCataloguePage /> },
          { path: 'pharmacy', element: <SalesPage /> },
          { path: 'pharmacy/medicines', element: <MedicinesPage /> },
          { path: 'pharmacy/stock', element: <StockPage /> },
          { path: 'billing', element: <InvoicesPage /> },
          { path: 'reports', element: <ReportsPage /> },
          { path: 'radiology', element: <RadiologyStudiesPage /> },
          { path: 'radiology/catalogue', element: <RadiologyCataloguePage /> },
          { path: 'insurance', element: <ClaimsPage /> },
          { path: 'insurance/providers', element: <ProvidersPage /> },
          { path: 'hr', element: <EmployeesPage /> },
          { path: 'hr/leave', element: <LeavePage /> },
          { path: 'hr/payroll', element: <PayrollPage /> },
          { path: 'inventory', element: <ItemsPage /> },
          { path: 'inventory/vendors', element: <VendorsPage /> },
          { path: 'inventory/purchase-requests', element: <PurchaseRequestsPage /> },
          { path: 'hospitals', element: <HospitalsPage /> },
          { path: 'hospitals/branches', element: <BranchesPage /> },
          { path: 'hospitals/departments', element: <DepartmentsPage /> },
          { path: 'users', element: <UsersListPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
