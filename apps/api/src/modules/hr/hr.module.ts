import { Module } from '@nestjs/common';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';
import { HrController } from './hr.controller';
import { HrRepository } from './hr.repository';
import { HrService } from './hr.service';

@Module({
  controllers: [EmployeesController, HrController],
  providers: [EmployeesService, HrService, HrRepository],
})
export class HrModule {}
