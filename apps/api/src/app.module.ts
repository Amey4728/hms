import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE, Reflector } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ZodValidationPipe } from 'nestjs-zod';
import { AppController } from './app.controller';
import { appConfig } from './config/configuration';
import { validateEnv } from './config/env.validation';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { PdfModule } from './common/pdf/pdf.module';
import { PrismaModule } from './prisma/prisma.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { AuthModule } from './modules/auth/auth.module';
import { BillingModule } from './modules/billing/billing.module';
import { BranchesModule } from './modules/branches/branches.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { EncountersModule } from './modules/encounters/encounters.module';
import { HealthModule } from './modules/health/health.module';
import { HospitalsModule } from './modules/hospitals/hospitals.module';
import { HrModule } from './modules/hr/hr.module';
import { InsuranceModule } from './modules/insurance/insurance.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { LaboratoryModule } from './modules/laboratory/laboratory.module';
import { PatientsModule } from './modules/patients/patients.module';
import { PharmacyModule } from './modules/pharmacy/pharmacy.module';
import { RadiologyModule } from './modules/radiology/radiology.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { ReportsModule } from './modules/reports/reports.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ['.env'],
      load: [() => appConfig(validateEnv(process.env))],
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.getOrThrow<number>('security.throttleTtlSeconds') * 1000,
            limit: config.getOrThrow<number>('security.throttleLimit'),
          },
        ],
      }),
    }),
    PrismaModule,
    PdfModule,
    AuthModule,
    UsersModule,
    RbacModule,
    HospitalsModule,
    BranchesModule,
    DepartmentsModule,
    PatientsModule,
    AppointmentsModule,
    LaboratoryModule,
    PharmacyModule,
    BillingModule,
    RadiologyModule,
    InsuranceModule,
    EncountersModule,
    HrModule,
    InventoryModule,
    ReportsModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    // Global input validation (Zod DTOs)
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    // Global error contract
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    // Global response envelope + logging
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    {
      provide: APP_INTERCEPTOR,
      useFactory: (reflector: Reflector) => new TransformInterceptor(reflector),
      inject: [Reflector],
    },
    // Global guards: rate-limit → authenticate → authorize
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
