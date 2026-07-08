import { Module } from '@nestjs/common';
import { HospitalsModule } from '../hospitals/hospitals.module';
import { PatientsModule } from '../patients/patients.module';
import { LabOrdersController } from './lab-orders/lab-orders.controller';
import { LabOrdersRepository } from './lab-orders/lab-orders.repository';
import { LabOrdersService } from './lab-orders/lab-orders.service';
import { LabTestsController } from './lab-tests/lab-tests.controller';
import { LabTestsRepository } from './lab-tests/lab-tests.repository';
import { LabTestsService } from './lab-tests/lab-tests.service';

@Module({
  imports: [PatientsModule, HospitalsModule],
  controllers: [LabTestsController, LabOrdersController],
  providers: [LabTestsService, LabTestsRepository, LabOrdersService, LabOrdersRepository],
  exports: [LabTestsRepository],
})
export class LaboratoryModule {}
