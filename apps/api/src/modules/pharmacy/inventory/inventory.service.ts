import { Injectable, NotFoundException } from '@nestjs/common';
import type { ReceiveBatchInput } from '@hms/shared';
import { PaginatedResult } from '../../../common/dto/paginated-result';
import { toPrismaPagination, type PaginationQuery } from '../../../common/dto/pagination.dto';
import { MedicinesRepository } from '../medicines/medicines.repository';
import { toBatchView } from '../pharmacy.mapper';
import { InventoryRepository, type MedicineWithBatches } from './inventory.repository';

function stockOf(m: MedicineWithBatches): number {
  return m.batches.reduce((sum, b) => sum + b.quantity, 0);
}

@Injectable()
export class InventoryService {
  constructor(
    private readonly repo: InventoryRepository,
    private readonly medicines: MedicinesRepository,
  ) {}

  async receiveBatch(medicineId: string, input: ReceiveBatchInput, userId: string) {
    const medicine = await this.medicines.findActiveById(medicineId);
    if (!medicine) throw new NotFoundException('Medicine not found');
    const batch = await this.repo.createBatch({
      medicineId,
      batchNumber: input.batchNumber,
      quantity: input.quantity,
      expiryDate: new Date(`${input.expiryDate}T00:00:00.000Z`),
      costPrice: input.costPrice,
      createdBy: userId,
    });
    return toBatchView(batch);
  }

  async stockLevels(query: PaginationQuery) {
    const { skip, take } = toPrismaPagination(query);
    const { items, total } = await this.repo.findMedicinesWithBatches({
      skip,
      take,
      search: query.search,
    });
    const rows = items.map((m) => {
      const stock = stockOf(m);
      return {
        medicineId: m.id,
        code: m.code,
        name: m.name,
        form: m.form,
        reorderLevel: m.reorderLevel,
        stock,
        isLow: stock <= m.reorderLevel,
        batches: m.batches.length,
      };
    });
    return PaginatedResult.from(rows, total, query.page, query.limit);
  }

  async lowStockAlerts() {
    const all = await this.repo.findAllMedicinesWithBatches();
    return all
      .map((m) => ({
        medicineId: m.id,
        code: m.code,
        name: m.name,
        reorderLevel: m.reorderLevel,
        stock: stockOf(m),
      }))
      .filter((r) => r.stock <= r.reorderLevel);
  }

  async expiringAlerts(days: number) {
    const cutoff = new Date();
    cutoff.setUTCDate(cutoff.getUTCDate() + days);
    const batches = await this.repo.findExpiringBatches(cutoff);
    return batches.map((b) => ({
      batchId: b.id,
      medicineCode: b.medicine.code,
      medicineName: b.medicine.name,
      batchNumber: b.batchNumber,
      quantity: b.quantity,
      expiryDate: b.expiryDate,
    }));
  }
}
