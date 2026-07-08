import { Module } from '@nestjs/common';
import { PatientsModule } from '../patients/patients.module';
import { PrescriptionsController } from './prescriptions/prescriptions.controller';
import { PrescriptionsRepository } from './prescriptions/prescriptions.repository';
import { PrescriptionsService } from './prescriptions/prescriptions.service';
import { TreatmentPlansController } from './treatment-plans/treatment-plans.controller';
import { TreatmentPlansRepository } from './treatment-plans/treatment-plans.repository';
import { TreatmentPlansService } from './treatment-plans/treatment-plans.service';
import { VisitsController } from './visits/visits.controller';
import { VisitsRepository } from './visits/visits.repository';
import { VisitsService } from './visits/visits.service';

@Module({
  imports: [PatientsModule],
  controllers: [VisitsController, PrescriptionsController, TreatmentPlansController],
  providers: [
    VisitsService, VisitsRepository,
    PrescriptionsService, PrescriptionsRepository,
    TreatmentPlansService, TreatmentPlansRepository,
  ],
})
export class EncountersModule {}
