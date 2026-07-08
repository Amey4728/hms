import type { Medicine, MedicineBatch } from '@prisma/client';
import { formatSaleNumber } from '@hms/shared';
import type { SaleWithItems } from './sales/sales.repository';

export function toMedicineView(m: Medicine) {
  return { ...m, unitPrice: m.unitPrice.toNumber() };
}

export function toBatchView(b: MedicineBatch) {
  return { ...b, costPrice: b.costPrice ? b.costPrice.toNumber() : null };
}

export function toSaleView(s: SaleWithItems) {
  return {
    id: s.id,
    saleNumber: s.saleNumber,
    saleRef: formatSaleNumber(s.saleNumber),
    patientId: s.patientId,
    hospitalId: s.hospitalId,
    soldById: s.soldById,
    subtotal: s.subtotal.toNumber(),
    discount: s.discount.toNumber(),
    tax: s.tax.toNumber(),
    total: s.total.toNumber(),
    items: s.items.map((i) => ({
      id: i.id,
      medicineId: i.medicineId,
      medicineName: i.medicine.name,
      batchId: i.batchId,
      batchNumber: i.batch?.batchNumber ?? null,
      quantity: i.quantity,
      unitPrice: i.unitPrice.toNumber(),
      lineTotal: i.lineTotal.toNumber(),
    })),
    createdAt: s.createdAt,
  };
}
