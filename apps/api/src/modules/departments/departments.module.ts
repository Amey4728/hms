import { Module } from '@nestjs/common';
import { BranchesModule } from '../branches/branches.module';
import { HospitalsModule } from '../hospitals/hospitals.module';
import { DepartmentsController } from './departments.controller';
import { DepartmentsRepository } from './departments.repository';
import { DepartmentsService } from './departments.service';

@Module({
  imports: [HospitalsModule, BranchesModule],
  controllers: [DepartmentsController],
  providers: [DepartmentsService, DepartmentsRepository],
  exports: [DepartmentsService, DepartmentsRepository],
})
export class DepartmentsModule {}
