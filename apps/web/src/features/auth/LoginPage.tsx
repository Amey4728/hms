import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Activity, HeartPulse, ShieldCheck, Stethoscope } from 'lucide-react';
import { loginSchema, type LoginInput } from '@hms/shared';
import { Button, Field, Input } from '@/components/ui';
import { ApiError } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth.store';
import { useLogin } from './hooks';

const highlights = [
  { icon: Stethoscope, text: 'Clinical, labs, radiology & pharmacy in one place' },
  { icon: ShieldCheck, text: 'Role-based access with full audit trails' },
  { icon: HeartPulse, text: 'Real-time billing, insurance & analytics' },
];

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
    <div className="grid min-h-full lg:grid-cols-2">
      {/* Brand hero */}
      <div className="relative hidden overflow-hidden bg-sidebar-gradient p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-accent-500/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-brand-500/30 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 backdrop-blur">
            <Activity className="h-6 w-6" />
          </div>
          <span className="text-lg font-bold tracking-tight">HMS</span>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-4xl font-bold leading-tight tracking-tight">
            The operating system for modern hospitals.
          </h2>
          <p className="mt-4 text-brand-100/80">
            One secure platform for patients, care teams and operations — from admission to billing.
          </p>
          <ul className="mt-8 space-y-4">
            {highlights.map((h) => (
              <li key={h.text} className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
                  <h.icon className="h-[18px] w-[18px] text-brand-200" />
                </span>
                <span className="text-sm text-brand-100/90">{h.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-brand-200/60">© 2026 HMS · Enterprise Hospital Management</p>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-glow lg:hidden">
              <Activity className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Welcome back</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Sign in to your HMS account</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Field label="Email" required error={errors.email?.message}>
              <Input type="email" autoComplete="username" placeholder="you@hospital.com" {...register('email')} />
            </Field>
            <Field label="Password" required error={errors.password?.message}>
              <Input type="password" autoComplete="current-password" placeholder="••••••••" {...register('password')} />
            </Field>

            {serverError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                {serverError}
              </div>
            )}

            <Button type="submit" className="w-full" loading={login.isPending}>
              Sign in
            </Button>
          </form>

          <p className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-3 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
            Demo: <span className="font-medium text-slate-700 dark:text-slate-200">superadmin@hms.local</span> /{' '}
            <span className="font-medium text-slate-700 dark:text-slate-200">SuperAdmin@123</span>
          </p>
        </div>
      </div>
    </div>
  );
}
