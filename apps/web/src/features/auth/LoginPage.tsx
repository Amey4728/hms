import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { loginSchema, type LoginInput } from '@hms/shared';
import { Button, Card, Field, Input } from '@/components/ui';
import { ApiError } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth.store';
import { useLogin } from './hooks';

export function LoginPage() {
  const status = useAuthStore((s) => s.status);
  const navigate = useNavigate();
  const location = useLocation();
  const login = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const from = (location.state as { from?: string } | null)?.from ?? '/';

  useEffect(() => {
    if (status === 'authenticated') navigate(from, { replace: true });
  }, [status, from, navigate]);

  if (status === 'authenticated') return <Navigate to={from} replace />;

  const onSubmit = (values: LoginInput) => login.mutate(values);
  const serverError = login.error instanceof ApiError ? login.error.message : null;

  return (
    <div className="flex min-h-full items-center justify-center bg-gradient-to-br from-brand-50 to-slate-100 p-4">
      <Card className="w-full max-w-md p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white">
            <Activity className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Sign in to HMS</h1>
          <p className="mt-1 text-sm text-slate-500">Hospital Management System</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Field label="Email" required error={errors.email?.message}>
            <Input type="email" autoComplete="username" placeholder="you@hospital.com" {...register('email')} />
          </Field>
          <Field label="Password" required error={errors.password?.message}>
            <Input type="password" autoComplete="current-password" placeholder="••••••••" {...register('password')} />
          </Field>

          {serverError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {serverError}
            </div>
          )}

          <Button type="submit" className="w-full" loading={login.isPending}>
            Sign in
          </Button>
        </form>

        <p className="mt-6 rounded-lg bg-slate-50 p-3 text-center text-xs text-slate-500">
          Demo: <span className="font-medium">superadmin@hms.local</span> / <span className="font-medium">SuperAdmin@123</span>
        </p>
      </Card>
    </div>
  );
}
