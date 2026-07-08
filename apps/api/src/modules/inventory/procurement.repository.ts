import { Injectable } from '@nestjs/common';
import {
  Prisma,
  type InventoryCategory,
  type InventoryItem,
  type PurchaseStatus,
  type TransferStatus,
  type Vendor,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export const purchaseInclude = Prisma.validator<Prisma.PurchaseRequestInclude>()({
  items: { include: { item: { select: { code: true, name: true } } }, orderBy: { createdAt: 'asc' } },
  vendor: { select: { name: true, code: true } },
});
export type PurchaseWithItems = Prisma.PurchaseRequestGetPayload<{ include: typeof purchaseInclude }>;

@Injectable()
export class ProcurementRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ── Vendors ──────────────────────────────────────────────────────────
  createVendor(data: Prisma.VendorCreateInput): Promise<Vendor> {
    return this.prisma.vendor.create({ data });
  }
  findVendor(id: string): Promise<Vendor | null> {
    return this.prisma.vendor.findFirst({ where: { id, deletedAt: null } });
  }
  async listVendors(p: { skip: number; take: number; search?: string; sortOrder: 'asc' | 'desc' }) {
    const where: Prisma.VendorWhereInput = {
      deletedAt: null,
      ...(p.search ? { OR: [{ name: { contains: p.search, mode: 'insensitive' } }, { code: { contains: p.search, mode: 'insensitive' } }] } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.vendor.findMany({ where, orderBy: { name: p.sortOrder }, skip: p.skip, take: p.take }),
      this.prisma.vendor.count({ where }),
    ]);
    return { items, total };
  }
  async updateVendor(id: string, v: number, data: Prisma.VendorUpdateInput): Promise<number> {
    return (await this.prisma.vendor.updateMany({ where: { id, version: v, deletedAt: null }, data: { ...data, version: { increment: 1 } } })).count;
  }
  softDeleteVendor(id: string, userId: string) {
    return this.prisma.vendor.updateMany({ where: { id, deletedAt: null }, data: { deletedAt: new Date(), updatedBy: userId } });
  }

  // ── Items ────────────────────────────────────────────────────────────
  createItem(data: Prisma.InventoryItemUncheckedCreateInput): Promise<InventoryItem> {
    return this.prisma.inventoryItem.create({ data });
  }
  findItem(id: string): Promise<InventoryItem | null> {
    return this.prisma.inventoryItem.findFirst({ where: { id, deletedAt: null } });
  }
  async listItems(p: { skip: number; take: number; search?: string; category?: InventoryCategory; sortOrder: 'asc' | 'desc' }) {
    const where: Prisma.InventoryItemWhereInput = {
      deletedAt: null,
      ...(p.category ? { category: p.category } : {}),
      ...(p.search ? { OR: [{ name: { contains: p.search, mode: 'insensitive' } }, { code: { contains: p.search, mode: 'insensitive' } }] } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.inventoryItem.findMany({ where, orderBy: { name: p.sortOrder }, skip: p.skip, take: p.take }),
      this.prisma.inventoryItem.count({ where }),
    ]);
    return { items, total };
  }
  async updateItem(id: string, v: number, data: Prisma.InventoryItemUpdateInput): Promise<number> {
    return (await this.prisma.inventoryItem.updateMany({ where: { id, version: v, deletedAt: null }, data: { ...data, version: { increment: 1 } } })).count;
  }
  softDeleteItem(id: string, userId: string) {
    return this.prisma.inventoryItem.updateMany({ where: { id, deletedAt: null }, data: { deletedAt: new Date(), updatedBy: userId } });
  }
  adjustItemQuantity(id: string, delta: number, userId: string): Promise<InventoryItem> {
    return this.prisma.inventoryItem.update({ where: { id }, data: { quantity: { increment: delta }, updatedBy: userId } });
  }
  lowStockItems(): Promise<InventoryItem[]> {
    return this.prisma.$queryRaw`SELECT * FROM inventory_items WHERE "deletedAt" IS NULL AND "isActive" = true AND quantity <= "reorderLevel" ORDER BY name`;
  }

  // ── Purchase requests ────────────────────────────────────────────────
  createPurchase(data: Prisma.PurchaseRequestUncheckedCreateInput): Promise<PurchaseWithItems> {
    return this.prisma.purchaseRequest.create({ data, include: purchaseInclude });
  }
  findPurchase(id: string): Promise<PurchaseWithItems | null> {
    return this.prisma.purchaseRequest.findFirst({ where: { id, deletedAt: null }, include: purchaseInclude });
  }
  findPurchaseBare(id: string) {
    return this.prisma.purchaseRequest.findFirst({ where: { id, deletedAt: null } });
  }
  async listPurchases(p: { skip: number; take: number; status?: PurchaseStatus; sortOrder: 'asc' | 'desc' }) {
    const where: Prisma.PurchaseRequestWhereInput = { deletedAt: null, ...(p.status ? { status: p.status } : {}) };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.purchaseRequest.findMany({ where, include: purchaseInclude, orderBy: { createdAt: p.sortOrder }, skip: p.skip, take: p.take }),
      this.prisma.purchaseRequest.count({ where }),
    ]);
    return { items, total };
  }
  async updatePurchase(id: string, v: number, data: Prisma.PurchaseRequestUpdateInput): Promise<number> {
    return (await this.prisma.purchaseRequest.updateMany({ where: { id, version: v, deletedAt: null }, data: { ...data, version: { increment: 1 } } })).count;
  }

  /** Marks a purchase RECEIVED and increments each item's stock, atomically. */
  async receivePurchase(id: string, expectedVersion: number, userId: string): Promise<number> {
    return this.prisma.$transaction(async (tx) => {
      const items = await tx.purchaseRequestItem.findMany({ where: { requestId: id } });
      for (const line of items) {
        await tx.inventoryItem.update({ where: { id: line.itemId }, data: { quantity: { increment: line.quantity } } });
      }
      const r = await tx.purchaseRequest.updateMany({
        where: { id, version: expectedVersion, deletedAt: null },
        data: { status: 'RECEIVED', receivedAt: new Date(), updatedBy: userId, version: { increment: 1 } },
      });
      return r.count;
    });
  }

  // ── Stock transfers ──────────────────────────────────────────────────
  createTransfer(data: Prisma.StockTransferUncheckedCreateInput) {
    return this.prisma.stockTransfer.create({ data });
  }
  findTransfer(id: string) {
    return this.prisma.stockTransfer.findUnique({ where: { id } });
  }
  async listTransfers(p: { skip: number; take: number; status?: TransferStatus; sortOrder: 'asc' | 'desc' }) {
    const where: Prisma.StockTransferWhereInput = { ...(p.status ? { status: p.status } : {}) };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.stockTransfer.findMany({ where, orderBy: { createdAt: p.sortOrder }, skip: p.skip, take: p.take }),
      this.prisma.stockTransfer.count({ where }),
    ]);
    return { items, total };
  }
  async updateTransfer(id: string, v: number, data: Prisma.StockTransferUpdateInput): Promise<number> {
    return (await this.prisma.stockTransfer.updateMany({ where: { id, version: v }, data: { ...data, version: { increment: 1 } } })).count;
  }
}
