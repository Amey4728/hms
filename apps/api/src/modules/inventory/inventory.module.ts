import { Module } from '@nestjs/common';
import {
  ItemsController,
  PurchaseRequestsController,
  TransfersController,
  VendorsController,
} from './inventory.controllers';
import { InventoryService } from './inventory.service';
import { ProcurementRepository } from './procurement.repository';

@Module({
  controllers: [
    VendorsController,
    ItemsController,
    PurchaseRequestsController,
    TransfersController,
  ],
  providers: [InventoryService, ProcurementRepository],
})
export class InventoryModule {}
