import { useState } from 'react';
import { LAB_RESULT_FLAGS } from '@hms/shared';
import { Modal } from '@/components/Modal';
import { Badge, Button, Input, Select } from '@/components/ui';
import { toast } from '@/components/toast';
import { ApiError } from '@/lib/api-client';
import { titleCase } from '@/lib/format';
import { useEnterResult } from './hooks';
import type { LabOrder } from './api';

export function ResultsModal({
  order,
  onClose,
  readOnly,
}: {
  order: LabOrder | null;
  onClose: () => void;
  readOnly?: boolean;
}) {
  const enter = useEnterResult();
  const [drafts, setDrafts] = useState<Record<string, { value: string; flag: string }>>({});

  if (!order) return null;

  const save = (itemId: string, version: number) => {
    const d = drafts[itemId];
    if (!d?.value) return;
    enter.mutate(
      { orderId: order.id, itemId, body: { version, resultValue: d.value, flag: d.flag || undefined } },
      {
        onSuccess: () => toast.success('Result saved'),
        onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Failed'),
      },
    );
  };

  return (
    <Modal
      open={!!order}
      onClose={onClose}
      title={`${readOnly ? 'Report' : 'Enter results'} · ${order.orderRef}`}
      width="max-w-2xl"
    >
      <div className="space-y-3">
        {order.items.map((i) => (
          <div key={i.id} className="rounded-lg border border-slate-200 p-3">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">{i.testName}</p>
                <p className="text-xs text-slate-400">
                  {i.testCode} · ref {i.referenceRange ?? '—'} {i.unit ? `(${i.unit})` : ''}
                </p>
              </div>
              {i.resultValue != null && (
                <Badge tone="success">
                  {i.resultValue} {i.flag ? `· ${titleCase(i.flag)}` : ''}
                </Badge>
              )}
            </div>
            {readOnly ? (
              <p className="text-sm text-slate-600">
                {i.resultValue ?? '—'} {i.unit ?? ''} {i.resultNotes ? `· ${i.resultNotes}` : ''}
              </p>
            ) : (
            <div className="flex gap-2">
              <Input
                placeholder="Result value"
                defaultValue={i.resultValue ?? ''}
                onChange={(e) =>
                  setDrafts((d) => ({ ...d, [i.id]: { ...(d[i.id] ?? { value: '', flag: '' }), value: e.target.value } }))
                }
              />
              <Select
                className="max-w-[10rem]"
                defaultValue={i.flag ?? ''}
                onChange={(e) =>
                  setDrafts((d) => ({ ...d, [i.id]: { ...(d[i.id] ?? { value: '', flag: '' }), flag: e.target.value } }))
                }
              >
                <option value="">Flag…</option>
                {LAB_RESULT_FLAGS.map((f) => (
                  <option key={f} value={f}>
                    {titleCase(f)}
                  </option>
                ))}
              </Select>
              <Button className="px-3" onClick={() => save(i.id, i.version)} loading={enter.isPending}>
                Save
              </Button>
            </div>
            )}
          </div>
        ))}
        <div className="flex justify-between border-t border-slate-100 pt-3 text-sm text-slate-500">
          <span>
            {order.resultedCount}/{order.totalCount} resulted
          </span>
          <Button variant="secondary" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}
