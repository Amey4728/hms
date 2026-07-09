import { useState } from 'react';
import { Field, Input } from '@/components/ui';
import { usePatientSearch } from '@/features/lookups';

export function PatientPicker({
  value,
  onChange,
  required,
  label = 'Patient',
}: {
  value: string;
  onChange: (id: string) => void;
  required?: boolean;
  label?: string;
}) {
  const [term, setTerm] = useState('');
  const patients = usePatientSearch(term);

  return (
    <Field label={label} required={required}>
      <Input
        placeholder="Search patient by name / phone…"
        value={term}
        onChange={(e) => {
          setTerm(e.target.value);
          onChange('');
        }}
      />
      {term && !value && (
        <div className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800">
          {patients.data?.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                onChange(p.id);
                setTerm(`${p.firstName} ${p.lastName} · ${p.mrn}`);
              }}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50"
            >
              {p.firstName} {p.lastName} <span className="text-slate-400 dark:text-slate-500">· {p.mrn}</span>
            </button>
          ))}
          {patients.data?.length === 0 && <p className="px-3 py-2 text-sm text-slate-400 dark:text-slate-500">No matches</p>}
        </div>
      )}
    </Field>
  );
}
