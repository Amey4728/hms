import { Module } from '@nestjs/common';
import { PatientsModule } from '../patients/patients.module';
import { ClaimsController } from './claims/claims.controller';
import { ClaimsRepository } from './claims/claims.repository';
import { ClaimsService } from './claims/claims.service';
import { ProvidersController } from './providers/providers.controller';
import { ProvidersRepository } from './providers/providers.repository';
import { ProvidersService } from './providers/providers.service';

@Module({
  imports: [PatientsModule],
  controllers: [ProvidersController, ClaimsController],
  providers: [ProvidersService, ProvidersRepository, ClaimsService, ClaimsRepository],
})
export class InsuranceModule {}
