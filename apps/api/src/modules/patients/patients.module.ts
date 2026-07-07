import { Module } from '@nestjs/common';
import { BranchesModule } from '../branches/branches.module';
import { HospitalsModule } from '../hospitals/hospitals.module';
import { AllergiesController } from './allergies/allergies.controller';
import { AllergiesRepository } from './allergies/allergies.repository';
import { AllergiesService } from './allergies/allergies.service';
import { EmergencyContactsController } from './emergency-contacts/emergency-contacts.controller';
import { EmergencyContactsRepository } from './emergency-contacts/emergency-contacts.repository';
import { EmergencyContactsService } from './emergency-contacts/emergency-contacts.service';
import { MedicalHistoryController } from './medical-history/medical-history.controller';
import { MedicalHistoryRepository } from './medical-history/medical-history.repository';
import { MedicalHistoryService } from './medical-history/medical-history.service';
import { PatientsController } from './patients.controller';
import { PatientsRepository } from './patients.repository';
import { PatientsService } from './patients.service';

@Module({
  imports: [HospitalsModule, BranchesModule],
  controllers: [
    PatientsController,
    EmergencyContactsController,
    AllergiesController,
    MedicalHistoryController,
  ],
  providers: [
    PatientsService,
    PatientsRepository,
    EmergencyContactsService,
    EmergencyContactsRepository,
    AllergiesService,
    AllergiesRepository,
    MedicalHistoryService,
    MedicalHistoryRepository,
  ],
  exports: [PatientsService, PatientsRepository],
})
export class PatientsModule {}
