import { Module } from '@nestjs/common';
import { BranchesModule } from '../branches/branches.module';
import { DepartmentsModule } from '../departments/departments.module';
import { HospitalsModule } from '../hospitals/hospitals.module';
import { PatientsModule } from '../patients/patients.module';
import { UsersModule } from '../users/users.module';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsRepository } from './appointments.repository';
import { AppointmentsService } from './appointments.service';
import { AvailabilityController } from './availability/availability.controller';
import { AvailabilityRepository } from './availability/availability.repository';
import { AvailabilityService } from './availability/availability.service';
import { SchedulingValidationService } from './scheduling-validation.service';
import { SlotsService } from './slots.service';

@Module({
  imports: [UsersModule, PatientsModule, HospitalsModule, BranchesModule, DepartmentsModule],
  controllers: [AppointmentsController, AvailabilityController],
  providers: [
    AppointmentsService,
    AppointmentsRepository,
    AvailabilityService,
    AvailabilityRepository,
    SlotsService,
    SchedulingValidationService,
  ],
  exports: [AppointmentsService, AppointmentsRepository],
})
export class AppointmentsModule {}
