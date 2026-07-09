import { useEffect, useState } from 'react';
import { Plus, ShieldCheck } from 'lucide-react';
import { CLAIM_STATUSES, PERMISSIONS } from '@hms/shared';
import { PageHeader } from '@/components/PageHeader';
import { PermissionGate } from '@/components/PermissionGate';
import { Modal } from '@/components/Modal';
import { PatientPicker } from '@/components/PatientPicker';
import { Badge, Button, Card, Field, Input, PageSpinner, Select } from '@/components/ui';
import { toast } from '@/components/toast';
import { ApiError } from '@/lib/api-client';
import { titleCase } from '@/lib/format';
import { InsuranceSubnav } from './InsuranceSubnav';
import { useAllProviders, useClaimActions, useClaims, useCreateClaim } from './hooks';
import type { Claim } from './api';

const TONE: Record<string, 'neutral' | 'info' | 'warning' | 'success' | 'danger'> = {
  SUBMITTED: 'info', UNDER_REVIEW: 'warning', APPROVED: 'info', REJECTED: 'danger', SETTLED: 'success',
};

export function ClaimsPage() {
  const [status, setStatus] = useState('');
  const [open, setOpen] = useState(false);
  const providers = useAllProviders();
  const create = useCreateClaim();
  const actions = useClaimActions();
  const { data, isLoading } = useClaims({ limit: 20, status: status || undefined });
  const rows = data?.data ?? [];

  const [patientId, setPatientId] = useState('');
  const [providerId, setProviderId] = useState('');
  const [policyNumber, setPolicy] = useState('');
  const [claimedAmount, setAmount] = useState('');

  useEffect(() => { if (open) { setPatientId(''); setProviderId(''); setPolicy(''); setAmount(''); } }, [open]);
  const onError = (e: unknown) => toast.error(e instanceof ApiError ? e.message : 'Action failed');

  const submit = () => create.mutate(
    { patientId, providerId, policyNumber, claimedAmount: Number(claimedAmount) },
    { onSuccess: (c) => { toast.success(`Claim ${c.claimRef} submitted`); setOpen(false); }, onError },
  );

  const approve = (c: Claim) => {
    const amt = window.prompt(`Approved amount (claimed ${c.claimedAmount}):`, String(c.claimedAmount));
    if (amt === null) return;
    actions.approve.mutate({ id: c.id, version: c.version, approvedAmount: Number(amt) }, { onSuccess: () => toast.success('Approved'), onError });
  };
  const reject = (c: Claim) => {
    const reason = window.prompt('Rejection reason:');
    if (!reason) return;
    actions.reject.mutate({ id: c.id, version: c.version, decisionNote: reason }, { onSuccess: () => toast.success('Rejected'), onError });
  };

  return (
    <div>
      <PageHeader title="Insurance"
        actions={<PermissionGate anyOf={[PERMISSIONS.INSURANCE_CLAIM_CREATE]}><Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New claim</Button></PermissionGate>} />
      <InsuranceSubnav />

      <Card>
        <div className="border-b border-slate-100 dark:border-slate-800 p-4">
          <Select className="max-w-xs" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {CLAIM_STATUSES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
          </Select>
        </div>
        {isLoading ? <PageSpinner /> : rows.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500 dark:text-slate-400"><ShieldCheck className="mx-auto mb-2 h-6 w-6 text-slate-300" />No claims.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-left text-xs uppercase text-slate-500 dark:text-slate-400">
                <tr><th className="px-4 py-3 font-medium">Ref</th><th className="px-4 py-3 font-medium">Patient</th><th className="px-4 py-3 font-medium">Provider</th><th className="px-4 py-3 text-right font-medium">Claimed</th><th className="px-4 py-3 text-right font-medium">Approved</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 text-right font-medium">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">{c.claimRef}</td>
                    <td className="px-4 py-3"><div className="font-medium text-slate-900 dark:text-slate-100">{c.patientName}</div><div className="text-xs text-slate-400 dark:text-slate-500">{c.patientMrn}</div></td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{c.providerName}</td>
                    <td className="px-4 py-3 text-right">{c.claimedAmount.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-emerald-600">{c.approvedAmount != null ? c.approvedAmount.toFixed(2) : '—'}</td>
                    <td className="px-4 py-3"><Badge tone={TONE[c.status]}>{titleCase(c.status)}</Badge></td>
                    <td className="px-4 py-3">
                      <PermissionGate anyOf={[PERMISSIONS.INSURANCE_CLAIM_APPROVE]}>
                        <div className="flex flex-wrap items-center justify-end gap-1">
                          {c.status === 'SUBMITTED' && <Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => actions.transition.mutate({ id: c.id, action: 'review', version: c.version }, { onSuccess: () => toast.success('Under review'), onError })}>Review</Button>}
                          {c.status === 'UNDER_REVIEW' && <Button className="px-2 py-1 text-xs" onClick={() => approve(c)}>Approve</Button>}
                          {['SUBMITTED', 'UNDER_REVIEW'].includes(c.status) && <Button variant="ghost" className="px-2 py-1 text-xs text-red-500" onClick={() => reject(c)}>Reject</Button>}
                          {c.status === 'APPROVED' && <Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => actions.transition.mutate({ id: c.id, action: 'settle', version: c.version }, { onSuccess: () => toast.success('Settled'), onError })}>Settle</Button>}
                        </div>
                      </PermissionGate>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="New insurance claim" width="max-w-xl">
        <div className="space-y-4">
          <PatientPicker value={patientId} onChange={setPatientId} required />
          <Field label="Provider" required>
            <Select value={providerId} onChange={(e) => setProviderId(e.target.value)}>
              <option value="" disabled>Select provider…</option>
              {providers.data?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Policy number" required><Input value={policyNumber} onChange={(e) => setPolicy(e.target.value)} /></Field>
            <Field label="Claimed amount" required><Input type="number" value={claimedAmount} onChange={(e) => setAmount(e.target.value)} /></Field>
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} loading={create.isPending} disabled={!patientId || !providerId || !policyNumber || !claimedAmount}>Submit claim</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
