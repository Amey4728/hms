import { Module } from '@nestjs/common';
import { HospitalsModule } from '../hospitals/hospitals.module';
import { PatientsModule } from '../patients/patients.module';
import { ExamsController } from './exams/exams.controller';
import { ExamsRepository } from './exams/exams.repository';
import { ExamsService } from './exams/exams.service';
import { StudiesController } from './studies/studies.controller';
import { StudiesRepository } from './studies/studies.repository';
import { StudiesService } from './studies/studies.service';

@Module({
  imports: [PatientsModule, HospitalsModule],
  controllers: [ExamsController, StudiesController],
  providers: [ExamsService, ExamsRepository, StudiesService, StudiesRepository],
})
export class RadiologyModule {}
