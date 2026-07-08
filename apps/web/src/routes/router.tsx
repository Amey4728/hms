import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { PlaceholderPage } from '@/components/PlaceholderPage';
import { LoginPage } from '@/features/auth/LoginPage';
import { AppointmentsListPage } from '@/features/appointments/AppointmentsListPage';
import { QueueBoardPage } from '@/features/appointments/QueueBoardPage';
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
          { path: 'appointments', element: <AppointmentsListPage /> },
          { path: 'appointments/queue', element: <QueueBoardPage /> },
          { path: 'hospitals', element: <PlaceholderPage title="Hospitals" phase="a later phase" /> },
          { path: 'users', element: <UsersListPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
