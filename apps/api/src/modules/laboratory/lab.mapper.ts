import type { LabTest } from '@prisma/client';
import { formatLabOrderNumber, formatMrn } from '@hms/shared';
import type { LabOrderWithItems } from './lab-orders/lab-orders.repository';

/** Convert a LabTest row (Decimal price → number). */
export function toLabTestView(t: LabTest) {
  return { ...t, price: t.price.toNumber() };
}

/** Order view with number, resolved item test names, and a resulted/total count. */
export function toLabOrderView(o: LabOrderWithItems) {
  const items = o.items.map((i) => ({
    id: i.id,
    testId: i.testId,
    testCode: i.test.code,
    testName: i.test.name,
    unit: i.unit ?? i.test.unit,
    referenceRange: i.test.referenceRange,
    resultValue: i.resultValue,
    flag: i.flag,
    resultNotes: i.resultNotes,
    resultedAt: i.resultedAt,
    version: i.version,
  }));
  const resultedCount = items.filter((i) => i.resultValue != null).length;
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    orderRef: formatLabOrderNumber(o.orderNumber),
    patientId: o.patientId,
    patientName: `${o.patient.firstName} ${o.patient.lastName}`,
    patientMrn: formatMrn(o.patient.patientNumber),
    hospitalId: o.hospitalId,
    orderedById: o.orderedById,
    status: o.status,
    notes: o.notes,
    sampleCollectedAt: o.sampleCollectedAt,
    completedAt: o.completedAt,
    cancelledAt: o.cancelledAt,
    cancellationReason: o.cancellationReason,
    items,
    resultedCount,
    totalCount: items.length,
    version: o.version,
    createdAt: o.createdAt,
  };
}
