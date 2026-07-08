import { useEffect, useState } from 'react';
import { Modal } from '@/components/Modal';
import { Button, Field, Input } from '@/components/ui';
import { toast } from '@/components/toast';
import { apiErrorMessage } from '@/lib/api-client';
import { cn } from '@/lib/cn';
import { useCreateUser, useRoles } from './hooks';

const EMPTY = { email: '', password: '', firstName: '', lastName: '', phone: '' };

export function CreateUserModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const roles = useRoles();
  const create = useCreateUser();
  const [form, setForm] = useState(EMPTY);
  const [roleIds, setRoleIds] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setForm(EMPTY);
      setRoleIds([]);
    }
  }, [open]);

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const toggleRole = (id: string) =>
    setRoleIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  const canSubmit =
    form.email && form.password && form.firstName && form.lastName && roleIds.length > 0;

  const submit = () =>
    create.mutate(
      { ...form, phone: form.phone || undefined, roleIds },
      {
        onSuccess: (u) => {
          toast.success(`Created ${u.firstName} ${u.lastName}`);
          onClose();
        },
        onError: (e) => toast.error(apiErrorMessage(e, 'Failed to create user')),
      },
    );

  return (
    <Modal open={open} onClose={onClose} title="Create staff user" width="max-w-xl">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="First name" required>
            <Input value={form.firstName} onChange={set('firstName')} />
          </Field>
          <Field label="Last name" required>
            <Input value={form.lastName} onChange={set('lastName')} />
          </Field>
        </div>
        <Field label="Email" required>
          <Input type="email" value={form.email} onChange={set('email')} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Password" required hint="8+ chars with an uppercase, lowercase, number & symbol">
            <Input type="password" value={form.password} onChange={set('password')} placeholder="e.g. Amey@1234" />
          </Field>
          <Field label="Phone">
            <Input value={form.phone} onChange={set('phone')} placeholder="Optional" />
          </Field>
        </div>

        <Field label="Roles" required>
          <div className="flex flex-wrap gap-2">
            {roles.data?.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => toggleRole(r.id)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium',
                  roleIds.includes(r.id)
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-slate-300 text-slate-600 hover:bg-slate-50',
                )}
              >
                {r.displayName}
              </button>
            ))}
          </div>
        </Field>

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={create.isPending} disabled={!canSubmit}>
            Create user
          </Button>
        </div>
      </div>
    </Modal>
  );
}
