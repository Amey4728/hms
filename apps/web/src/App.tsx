import { RouterProvider } from 'react-router-dom';
import { Toaster } from '@/components/toast';
import { useAuthBootstrap } from '@/features/auth/hooks';
import { router } from '@/routes/router';

export function App() {
  useAuthBootstrap();
  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>
  );
}
