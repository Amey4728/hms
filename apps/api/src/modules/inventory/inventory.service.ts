import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { InventoryCategory, PurchaseStatus, TransferStatus } from '@prisma/client';
import type {
  AdjustStockInput,
  CreateInventoryItemInput,
  CreatePurchaseRequestInput,
  CreateTransferInput,
  CreateVendorInput,
  PurchaseDecisionInput,
  UpdateInventoryItemInput,
  UpdateVendorInput,
} from '@hms/shared';
import { PaginatedResult } from '../../common/dto/paginated-result';
import { toPrismaPagination } from '../../common/dto/pagination.dto';
import { assertUpdatable, assertWritten } from '../../common/utils/optimistic';
import { toItemView, toPurchaseView } from './inventory.mapper';
import { ProcurementRepository } from './procurement.repository';

interface Q {
  page: number; limit: number; sortOrder: 'asc' | 'desc';
}

@Injectable()
export class InventoryService {
  constructor(private readonly repo: ProcurementRepository) {}

  // ── Vendors ────────────────────────────────────────────────────────────
  createVendor(input: CreateVendorInput, userId: string) {
    return this.repo.createVendor({ ...input, createdBy: userId, updatedBy: userId });
  }
  async getVendor(id: string) {
    const v = await this.repo.findVendor(id);
    if (!v) throw new NotFoundException('Vendor not found');
    return v;
  }
  async listVendors(q: Q & { search?: string }) {
    const { skip, take } = toPrismaPagination(q);
    const { items, total } = await this.repo.listVendors({ skip, take, search: q.search, sortOrder: q.sortOrder });
    return PaginatedResult.from(items, total, q.page, q.limit);
  }
  async updateVendor(id: string, input: UpdateVendorInput, userId: string) {
    const { version, ...changes } = input;
    assertUpdatable(await this.repo.findVendor(id), version, 'Vendor');
    assertWritten(await this.repo.updateVendor(id, version, { ...changes, updatedBy: userId }), 'Vendor');
    return this.getVendor(id);
  }
  async removeVendor(id: string, userId: string) {
    if (!(await this.repo.findVendor(id))) throw new NotFoundException('Vendor not found');
    await this.repo.softDeleteVendor(id, userId);
    return { id };
  }

  // ── Items ──────────────────────────────────────────────────────────────
  async createItem(input: CreateInventoryItemInput, userId: string) {
    return toItemView(await this.repo.createItem({ ...input, createdBy: userId, updatedBy: userId }));
  }
  async getItem(id: string) {
    const i = await this.repo.findItem(id);
    if (!i) throw new NotFoundException('Item not found');
    return toItemView(i);
  }
  async listItems(q: Q & { search?: string; category?: InventoryCategory }) {
    const { skip, take } = toPrismaPagination(q);
    const { items, total } = await this.repo.listItems({ skip, take, search: q.search, category: q.category, sortOrder: q.sortOrder });
    return PaginatedResult.from(items.map(toItemView), total, q.page, q.limit);
  }
  async updateItem(id: string, input: UpdateInventoryItemInput, userId: string) {
    const { version, ...changes } = input;
    assertUpdatable(await this.repo.findItem(id), version, 'Item');
    assertWritten(await this.repo.updateItem(id, version, { ...changes, updatedBy: userId }), 'Item');
    return this.getItem(id);
  }
  async removeItem(id: string, userId: string) {
    if (!(await this.repo.findItem(id))) throw new NotFoundException('Item not found');
    await this.repo.softDeleteItem(id, userId);
    return { id };
  }
  async adjustStock(id: string, input: AdjustStockInput, userId: string) {
    const item = await this.repo.findItem(id);
    if (!item) throw new NotFoundException('Item not found');
    if (item.quantity + input.delta < 0) throw new BadRequestException('Adjustment would make stock negative');
    return toItemView(await this.repo.adjustItemQuantity(id, input.delta, userId));
  }
  async lowStock() {
    return (await this.repo.lowStockItems()).map(toItemView);
  }

  // ── Purchase requests ────────────────────────────────────────────────────
  async createPurchase(input: CreatePurchaseRequestInput, userId: string) {
    for (const line of input.items) {
      if (!(await this.repo.findItem(line.itemId))) throw new BadRequestException(`Item ${line.itemId} not found`);
    }
    if (input.vendorId && !(await this.repo.findVendor(input.vendorId))) throw new NotFoundException('Vendor not found');
    const pr = await this.repo.createPurchase({
      vendorId: input.vendorId,
      requestedById: userId,
      notes: input.notes,
      createdBy: userId,
      updatedBy: userId,
      items: { create: input.items.map((i) => ({ itemId: i.itemId, quantity: i.quantity, unitCost: i.unitCost })) },
    });
    return toPurchaseView(pr);
  }
  async getPurchase(id: string) {
    const pr = await this.repo.findPurchase(id);
    if (!pr) throw new NotFoundException('Purchase request not found');
    return toPurchaseView(pr);
  }
  async listPurchases(q: Q & { status?: PurchaseStatus }) {
    const { skip, take } = toPrismaPagination(q);
    const { items, total } = await this.repo.listPurchases({ skip, take, status: q.status, sortOrder: q.sortOrder });
    return PaginatedResult.from(items.map(toPurchaseView), total, q.page, q.limit);
  }
  submitPurchase(id: string, version: number, userId: string) {
    return this.purchaseTransition(id, version, 'SUBMITTED', ['DRAFT'], userId, {});
  }
  approvePurchase(id: string, input: PurchaseDecisionInput, userId: string) {
    return this.purchaseTransition(id, input.version, 'APPROVED', ['SUBMITTED'], userId, { decisionNote: input.decisionNote });
  }
  rejectPurchase(id: string, input: PurchaseDecisionInput, userId: string) {
    return this.purchaseTransition(id, input.version, 'REJECTED', ['SUBMITTED'], userId, { decisionNote: input.decisionNote });
  }
  async receivePurchase(id: string, version: number, userId: string) {
    const current = await this.repo.findPurchaseBare(id);
    assertUpdatable(current, version, 'Purchase request');
    if (current.status !== 'APPROVED') throw new ConflictException('Only APPROVED requests can be received');
    assertWritten(await this.repo.receivePurchase(id, version, userId), 'Purchase request');
    return this.getPurchase(id);
  }
  private async purchaseTransition(id: string, version: number, to: PurchaseStatus, allowedFrom: PurchaseStatus[], userId: string, extra: Record<string, unknown>) {
    const current = await this.repo.findPurchaseBare(id);
    assertUpdatable(current, version, 'Purchase request');
    if (!allowedFrom.includes(current.status)) {
      throw new ConflictException(`Illegal purchase transition ${current.status} → ${to}`);
    }
    assertWritten(await this.repo.updatePurchase(id, version, { status: to, updatedBy: userId, ...extra }), 'Purchase request');
    return this.getPurchase(id);
  }

  // ── Stock transfers ──────────────────────────────────────────────────────
  async createTransfer(input: CreateTransferInput, userId: string) {
    if (!(await this.repo.findItem(input.itemId))) throw new NotFoundException('Item not found');
    return this.repo.createTransfer({ ...input, createdBy: userId });
  }
  async listTransfers(q: Q & { status?: TransferStatus }) {
    const { skip, take } = toPrismaPagination(q);
    const { items, total } = await this.repo.listTransfers({ skip, take, status: q.status, sortOrder: q.sortOrder });
    return PaginatedResult.from(items, total, q.page, q.limit);
  }
  async completeTransfer(id: string, version: number) {
    const current = await this.repo.findTransfer(id);
    assertUpdatable(current, version, 'Transfer');
    if (current.status !== 'PENDING') throw new ConflictException(`Transfer already ${current.status}`);
    assertWritten(await this.repo.updateTransfer(id, version, { status: 'COMPLETED', completedAt: new Date() }), 'Transfer');
    const updated = await this.repo.findTransfer(id);
    if (!updated) throw new NotFoundException('Transfer not found');
    return updated;
  }
}
