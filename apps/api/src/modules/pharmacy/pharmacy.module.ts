import { Module } from '@nestjs/common';
import { HospitalsModule } from '../hospitals/hospitals.module';
import { PatientsModule } from '../patients/patients.module';
import { InventoryController } from './inventory/inventory.controller';
import { InventoryRepository } from './inventory/inventory.repository';
import { InventoryService } from './inventory/inventory.service';
import { MedicinesController } from './medicines/medicines.controller';
import { MedicinesRepository } from './medicines/medicines.repository';
import { MedicinesService } from './medicines/medicines.service';
import { SalesController } from './sales/sales.controller';
import { SalesRepository } from './sales/sales.repository';
import { SalesService } from './sales/sales.service';

@Module({
  imports: [PatientsModule, HospitalsModule],
  controllers: [MedicinesController, InventoryController, SalesController],
  providers: [
    MedicinesService,
    MedicinesRepository,
    InventoryService,
    InventoryRepository,
    SalesService,
    SalesRepository,
  ],
})
export class PharmacyModule {}
