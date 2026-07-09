import { useState } from 'react';
import { PackagePlus, Plus } from 'lucide-react';
import { MEDICINE_FORMS, PERMISSIONS } from '@hms/shared';
import { PageHeader } from '@/components/PageHeader';
import { PermissionGate } from '@/components/PermissionGate';
import { Modal } from '@/components/Modal';
import { Badge, Button, Card, Field, Input, PageSpinner, Select } from '@/components/ui';
import { toast } from '@/components/toast';
import { ApiError } from '@/lib/api-client';
import { titleCase } from '@/lib/format';
import { PharmacySubnav } from './PharmacySubnav';
import { useCreateMedicine, useMedicines, useReceiveBatch } from './hooks';
import type { Medicine } from './api';

const EMPTY_MED = { code: '', name: '', genericName: '', form: 'TABLET', strength: '', manufacturer: '', unitPrice: '0', reorderLevel: '0' };
const EMPTY_BATCH = { batchNumber: '', quantity: '', expiryDate: '' };

export function MedicinesPage() {
  const [medOpen, setMedOpen] = useState(false);
  const [med, setMed] = useState(EMPTY_MED);
  const [receiveFor, setReceiveFor] = useState<Medicine | null>(null);
  const [batch, setBatch] = useState(EMPTY_BATCH);

  const create = useCreateMedicine();
  const receive = useReceiveBatch();
  const { data, isLoading } = useMedicines({ limit: 100 });

  const setM = (k: keyof typeof EMPTY_MED) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setMed((f) => ({ ...f, [k]: e.target.value }));
  const setB = (k: keyof typeof EMPTY_BATCH) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setBatch((f) => ({ ...f, [k]: e.target.value }));

  const submitMed = () =>
    create.mutate(
      {
        ...med,
        unitPrice: Number(med.unitPrice),
        reorderLevel: Number(med.reorderLevel),
        genericName: med.genericName || undefined,
        strength: med.strength || undefined,
        manufacturer: med.manufacturer || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Medicine added');
          setMedOpen(false);
          setMed(EMPTY_MED);
        },
        onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Failed'),
      },
    );

  const submitBatch = () => {
    if (!receiveFor) return;
    receive.mutate(
      { medicineId: receiveFor.id, body: { ...batch, quantity: Number(batch.quantity) } },
      {
        onSuccess: () => {
          toast.success('Stock received');
          setReceiveFor(null);
          setBatch(EMPTY_BATCH);
        },
        onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Failed'),
      },
    );
  };

  return (
    <div>
      <PageHeader
        title="Pharmacy"
        actions={
          <PermissionGate anyOf={[PERMISSIONS.INVENTORY_MANAGE]}>
            <Button onClick={() => setMedOpen(true)}>
              <Plus className="h-4 w-4" /> New medicine
            </Button>
          </PermissionGate>
        }
      />
      <PharmacySubnav />

      <Card>
        {isLoading ? (
          <PageSpinner />
        ) : (data?.data.length ?? 0) === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500 dark:text-slate-400">No medicines yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-left text-xs uppercase text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Form</th>
                  <th className="px-4 py-3 font-medium">Reorder</th>
                  <th className="px-4 py-3 text-right font-medium">Price</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data?.data.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">{m.code}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 dark:text-slate-100">{m.name}</div>
                      {m.strength && <div className="text-xs text-slate-400 dark:text-slate-500">{m.strength}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone="neutral">{titleCase(m.form)}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{m.reorderLevel}</td>
                    <td className="px-4 py-3 text-right font-medium">{m.unitPrice.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">
                      <PermissionGate anyOf={[PERMISSIONS.INVENTORY_MANAGE]}>
                        <Button variant="secondary" className="px-2 py-1 text-xs" onClick={() => setReceiveFor(m)}>
                          <PackagePlus className="h-4 w-4" /> Receive
                        </Button>
                      </PermissionGate>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={medOpen} onClose={() => setMedOpen(false)} title="Add medicine">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Code" required>
              <Input value={med.code} onChange={setM('code')} placeholder="PARA500" />
            </Field>
            <Field label="Form">
              <Select value={med.form} onChange={setM('form')}>
                {MEDICINE_FORMS.map((f) => (
                  <option key={f} value={f}>
                    {titleCase(f)}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Name" required>
            <Input value={med.name} onChange={setM('name')} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Generic name">
              <Input value={med.genericName} onChange={setM('genericName')} />
            </Field>
            <Field label="Strength">
              <Input value={med.strength} onChange={setM('strength')} placeholder="500mg" />
            </Field>
            <Field label="Unit price" required>
              <Input type="number" value={med.unitPrice} onChange={setM('unitPrice')} />
            </Field>
            <Field label="Reorder level">
              <Input type="number" value={med.reorderLevel} onChange={setM('reorderLevel')} />
            </Field>
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">
            <Button variant="secondary" onClick={() => setMedOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitMed} loading={create.isPending} disabled={!med.code || !med.name}>
              Add medicine
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!receiveFor} onClose={() => setReceiveFor(null)} title={`Receive stock · ${receiveFor?.name ?? ''}`}>
        <div className="space-y-4">
          <Field label="Batch number" required>
            <Input value={batch.batchNumber} onChange={setB('batchNumber')} placeholder="B-2026-01" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Quantity" required>
              <Input type="number" value={batch.quantity} onChange={setB('quantity')} />
            </Field>
            <Field label="Expiry date" required>
              <Input type="date" value={batch.expiryDate} onChange={setB('expiryDate')} />
            </Field>
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">
            <Button variant="secondary" onClick={() => setReceiveFor(null)}>
              Cancel
            </Button>
            <Button onClick={submitBatch} loading={receive.isPending} disabled={!batch.batchNumber || !batch.quantity || !batch.expiryDate}>
              Receive stock
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
