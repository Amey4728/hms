import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, HeartPulse, Phone } from 'lucide-react';
import type { ReactNode } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Badge, Button, Card, PageSpinner } from '@/components/ui';
import { ApiError } from '@/lib/api-client';
import { calculateAge, formatDate, titleCase } from '@/lib/format';
import { usePatientProfile } from './hooks';
import type { AllergySeverity } from '@hms/shared';

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-slate-800 dark:text-slate-200">{value || '—'}</p>
    </div>
  );
}

function SectionCard({
  title,
  icon,
  count,
  children,
}: {
  title: string;
  icon: ReactNode;
  count: number;
  children: ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center gap-2">
        {icon}
        <h3 className="font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
        <Badge tone="info">{count}</Badge>
      </div>
      {count === 0 ? <p className="text-sm text-slate-400 dark:text-slate-500">None recorded.</p> : children}
    </Card>
  );
}

const severityTone: Record<AllergySeverity, 'neutral' | 'warning' | 'danger'> = {
  MILD: 'neutral',
  MODERATE: 'warning',
  SEVERE: 'danger',
  LIFE_THREATENING: 'danger',
};

export function PatientProfilePage() {
  const { id = '' } = useParams();
  const { data: patient, isLoading, isError, error } = usePatientProfile(id);

  if (isLoading) return <PageSpinner />;
  if (isError || !patient) {
    return (
      <Card className="p-8 text-center text-sm text-red-600">
        {error instanceof ApiError ? error.message : 'Failed to load patient'}
        <div className="mt-4">
          <Link to="/patients">
            <Button variant="secondary">Back to patients</Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div>
      <PageHeader
        title={`${patient.firstName} ${patient.middleName ?? ''} ${patient.lastName}`.replace(/\s+/g, ' ')}
        subtitle={`${patient.mrn} · ${titleCase(patient.gender)} · ${calculateAge(patient.dateOfBirth)}`}
        actions={
          <Link to="/patients">
            <Button variant="secondary">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">Demographics</h3>
            <Badge tone={patient.status === 'ACTIVE' ? 'success' : 'neutral'}>
              {titleCase(patient.status)}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Detail label="MRN" value={<span className="font-mono">{patient.mrn}</span>} />
            <Detail label="Date of birth" value={formatDate(patient.dateOfBirth)} />
            <Detail label="Blood group" value={patient.bloodGroup?.replace('_POSITIVE', '+').replace('_NEGATIVE', '−')} />
            <Detail label="Marital status" value={patient.maritalStatus ? titleCase(patient.maritalStatus) : null} />
            <Detail label="Phone" value={patient.phone} />
            <Detail label="Email" value={patient.email} />
            <Detail label="National ID" value={patient.nationalId} />
            <Detail
              label="Address"
              value={[patient.addressLine, patient.city, patient.state].filter(Boolean).join(', ')}
            />
          </div>
        </Card>

        <SectionCard
          title="Emergency Contacts"
          icon={<Phone className="h-5 w-5 text-brand-600" />}
          count={patient.emergencyContacts.length}
        >
          <ul className="space-y-3">
            {patient.emergencyContacts.map((c) => (
              <li key={c.id} className="rounded-lg border border-slate-100 dark:border-slate-800 p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-800 dark:text-slate-200">{c.name}</p>
                  {c.isPrimary && <Badge tone="success">Primary</Badge>}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {c.relationship} · {c.phone}
                </p>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard
          title="Allergies"
          icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}
          count={patient.allergies.length}
        >
          <ul className="space-y-3">
            {patient.allergies.map((a) => (
              <li key={a.id} className="rounded-lg border border-slate-100 dark:border-slate-800 p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-800 dark:text-slate-200">{a.allergen}</p>
                  <Badge tone={severityTone[a.severity]}>{titleCase(a.severity)}</Badge>
                </div>
                {a.reaction && <p className="text-sm text-slate-500 dark:text-slate-400">{a.reaction}</p>}
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard
          title="Medical History"
          icon={<HeartPulse className="h-5 w-5 text-emerald-600" />}
          count={patient.medicalHistories.length}
        >
          <ul className="space-y-3">
            {patient.medicalHistories.map((h) => (
              <li key={h.id} className="rounded-lg border border-slate-100 dark:border-slate-800 p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-800 dark:text-slate-200">{h.condition}</p>
                  <Badge tone="neutral">{titleCase(h.status)}</Badge>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {h.diagnosedAt ? `Diagnosed ${formatDate(h.diagnosedAt)}` : ''} {h.notes ?? ''}
                </p>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}
