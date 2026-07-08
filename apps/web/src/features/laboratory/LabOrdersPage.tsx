import { useState } from 'react';
import { FlaskConical, Plus } from 'lucide-react';
import { LAB_ORDER_STATUSES, PERMISSIONS } from '@hms/shared';
import { PageHeader } from '@/components/PageHeader';
import { PermissionGate } from '@/components/PermissionGate';
import { Badge, Button, Card, PageSpinner, Select } from '@/components/ui';
import { toast } from '@/components/toast';
import { ApiError } from '@/lib/api-client';
import { titleCase } from '@/lib/format';
import { CreateLabOrderModal } from './CreateLabOrderModal';
import { LabSubnav } from './LabSubnav';
import { ResultsModal } from './ResultsModal';
import { useLabCancel, useLabOrders, useLabTransition } from './hooks';
import type { LabOrder } from './api';

const STATUS_TONE: Record<string, 'neutral' | 'info' | 'warning' | 'success' | 'danger'> = {
  ORDERED: 'neutral',
  SAMPLE_COLLECTED: 'warning',
  IN_PROGRESS: 'info',
  COMPLETED: 'success',
  CANCELLED: 'danger',
};

export function LabOrdersPage() {
  const [status, setStatus] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [resultsId, setResultsId] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const transition = useLabTransition();
  const cancel = useLabCancel();

  const { data, isLoading } = useLabOrders({ limit: 20, status: status || undefined });
  const orders = data?.data ?? [];
  const onError = (e: unknown) => toast.error(e instanceof ApiError ? e.message : 'Action failed');

  const act = (o: LabOrder, action: 'collect-sample' | 'start' | 'complete') =>
    transition.mutate(
      { id: o.id, action, version: o.version },
      { onSuccess: () => toast.success('Updated'), onError },
    );

  const doCancel = (o: LabOrder) => {
    const reason = window.prompt('Cancellation reason (optional):') ?? undefined;
    cancel.mutate({ id: o.id, version: o.version, reason }, { onSuccess: () => toast.success('Cancelled'), onError });
  };

  const resultsOrder = orders.find((o) => o.id === resultsId) ?? null;
  const reportOrder = orders.find((o) => o.id === reportId) ?? null;

  return (
    <div>
      <PageHeader
        title="Laboratory"
        actions={
          <PermissionGate anyOf={[PERMISSIONS.LAB_RESULT_CREATE]}>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" /> New order
            </Button>
          </PermissionGate>
        }
      />
      <LabSubnav />

      <Card>
        <div className="border-b border-slate-100 p-4">
          <Select className="max-w-xs" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {LAB_ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {titleCase(s)}
              </option>
            ))}
          </Select>
        </div>

        {isLoading ? (
          <PageSpinner />
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">
            <FlaskConical className="mx-auto mb-2 h-6 w-6 text-slate-300" />
            No lab orders.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Ref</th>
                  <th className="px-4 py-3 font-medium">Patient</th>
                  <th className="px-4 py-3 font-medium">Tests</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{o.orderRef}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{o.patientName}</div>
                      <div className="text-xs text-slate-400">{o.patientMrn}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {o.resultedCount}/{o.totalCount} resulted
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS_TONE[o.status]}>{titleCase(o.status)}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center justify-end gap-1">
                        <PermissionGate anyOf={[PERMISSIONS.LAB_RESULT_CREATE]}>
                          {o.status === 'ORDERED' && (
                            <Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => act(o, 'collect-sample')}>
                              Collect sample
                            </Button>
                          )}
                          {o.status === 'SAMPLE_COLLECTED' && (
                            <Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => act(o, 'start')}>
                              Start
                            </Button>
                          )}
                          {o.status === 'IN_PROGRESS' && (
                            <>
                              <Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => setResultsId(o.id)}>
                                Enter results
                              </Button>
                              <Button className="px-2 py-1 text-xs" onClick={() => act(o, 'complete')}>
                                Complete
                              </Button>
                            </>
                          )}
                          {['ORDERED', 'SAMPLE_COLLECTED', 'IN_PROGRESS'].includes(o.status) && (
                            <Button variant="ghost" className="px-2 py-1 text-xs text-red-500" onClick={() => doCancel(o)}>
                              Cancel
                            </Button>
                          )}
                        </PermissionGate>
                        {o.status === 'COMPLETED' && (
                          <Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => setReportId(o.id)}>
                            Report
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <CreateLabOrderModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <ResultsModal order={resultsOrder} onClose={() => setResultsId(null)} />
      <ResultsModal order={reportOrder} onClose={() => setReportId(null)} readOnly />
    </div>
  );
}
