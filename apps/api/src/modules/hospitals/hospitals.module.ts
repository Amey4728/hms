import { Module } from '@nestjs/common';
import { HospitalsController } from './hospitals.controller';
import { HospitalsRepository } from './hospitals.repository';
import { HospitalsService } from './hospitals.service';

@Module({
  controllers: [HospitalsController],
  providers: [HospitalsService, HospitalsRepository],
  exports: [HospitalsService, HospitalsRepository],
})
export class HospitalsModule {}
