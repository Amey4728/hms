import { Module } from '@nestjs/common';
import { PatientsModule } from '../patients/patients.module';
import { InvoicesController } from './invoices.controller';
import { InvoicesRepository } from './invoices.repository';
import { InvoicesService } from './invoices.service';

@Module({
  imports: [PatientsModule],
  controllers: [InvoicesController],
  providers: [InvoicesService, InvoicesRepository],
})
export class BillingModule {}
