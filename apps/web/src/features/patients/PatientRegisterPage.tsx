import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import {
  BLOOD_GROUPS,
  GENDERS,
  MARITAL_STATUSES,
  createPatientSchema,
  type CreatePatientInput,
} from '@hms/shared';
import { PageHeader } from '@/components/PageHeader';
import { Button, Card, Field, Input, Select } from '@/components/ui';
import { toast } from '@/components/toast';
import { ApiError } from '@/lib/api-client';
import { titleCase } from '@/lib/format';
import { useCreatePatient } from './hooks';

const emptyToUndef = (v: unknown) => (v === '' ? undefined : v);

export function PatientRegisterPage() {
  const navigate = useNavigate();
  const create = useCreatePatient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreatePatientInput>({
    resolver: zodResolver(createPatientSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      middleName: '',
      phone: '',
      email: '',
      nationalId: '',
      addressLine: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
    },
  });

  const onSubmit = (values: CreatePatientInput) =>
    create.mutate(values, {
      onSuccess: (patient) => {
        toast.success(`Registered ${patient.firstName} · ${patient.mrn}`);
        navigate(`/patients/${patient.id}`);
      },
      onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Registration failed'),
    });

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Register patient"
        actions={
          <Link to="/patients">
            <Button variant="secondary">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          </Link>
        }
      />

      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Identity
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="First name" required error={errors.firstName?.message}>
                <Input {...register('firstName')} />
              </Field>
              <Field label="Last name" required error={errors.lastName?.message}>
                <Input {...register('lastName')} />
              </Field>
              <Field label="Middle name" error={errors.middleName?.message}>
                <Input {...register('middleName', { setValueAs: emptyToUndef })} />
              </Field>
              <Field label="Date of birth" required error={errors.dateOfBirth?.message}>
                <Input type="date" {...register('dateOfBirth')} />
              </Field>
              <Field label="Gender" required error={errors.gender?.message}>
                <Select {...register('gender', { setValueAs: emptyToUndef })} defaultValue="">
                  <option value="" disabled>
                    Select…
                  </option>
                  {GENDERS.map((g) => (
                    <option key={g} value={g}>
                      {titleCase(g)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Blood group" error={errors.bloodGroup?.message}>
                <Select {...register('bloodGroup', { setValueAs: emptyToUndef })} defaultValue="">
                  <option value="">Unknown</option>
                  {BLOOD_GROUPS.map((b) => (
                    <option key={b} value={b}>
                      {b.replace('_POSITIVE', '+').replace('_NEGATIVE', '−')}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Marital status" error={errors.maritalStatus?.message}>
                <Select {...register('maritalStatus', { setValueAs: emptyToUndef })} defaultValue="">
                  <option value="">—</option>
                  {MARITAL_STATUSES.map((m) => (
                    <option key={m} value={m}>
                      {titleCase(m)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="National ID" error={errors.nationalId?.message}>
                <Input {...register('nationalId', { setValueAs: emptyToUndef })} />
              </Field>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Contact
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Phone" required error={errors.phone?.message}>
                <Input {...register('phone')} placeholder="+1 555 0100" />
              </Field>
              <Field label="Email" error={errors.email?.message}>
                <Input type="email" {...register('email', { setValueAs: emptyToUndef })} />
              </Field>
              <Field label="Address" error={errors.addressLine?.message}>
                <Input {...register('addressLine', { setValueAs: emptyToUndef })} />
              </Field>
              <Field label="City" error={errors.city?.message}>
                <Input {...register('city', { setValueAs: emptyToUndef })} />
              </Field>
              <Field label="State" error={errors.state?.message}>
                <Input {...register('state', { setValueAs: emptyToUndef })} />
              </Field>
              <Field label="Postal code" error={errors.postalCode?.message}>
                <Input {...register('postalCode', { setValueAs: emptyToUndef })} />
              </Field>
            </div>
          </section>

          <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">
            <Link to="/patients">
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </Link>
            <Button type="submit" loading={create.isPending}>
              Register patient
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
