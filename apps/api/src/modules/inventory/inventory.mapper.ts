import type { InventoryItem } from '@prisma/client';
import { formatPurchaseNumber } from '@hms/shared';
import type { PurchaseWithItems } from './procurement.repository';

export function toItemView(i: InventoryItem) {
  return { ...i, unitCost: i.unitCost ? i.unitCost.toNumber() : null, isLow: i.quantity <= i.reorderLevel };
}

export function toPurchaseView(p: PurchaseWithItems) {
  return {
    id: p.id,
    requestNumber: p.requestNumber,
    requestRef: formatPurchaseNumber(p.requestNumber),
    vendorId: p.vendorId,
    vendorName: p.vendor?.name ?? null,
    status: p.status,
    notes: p.notes,
    decisionNote: p.decisionNote,
    receivedAt: p.receivedAt,
    items: p.items.map((it) => ({
      id: it.id,
      itemId: it.itemId,
      itemCode: it.item.code,
      itemName: it.item.name,
      quantity: it.quantity,
      unitCost: it.unitCost ? it.unitCost.toNumber() : null,
    })),
    version: p.version,
    createdAt: p.createdAt,
  };
}
