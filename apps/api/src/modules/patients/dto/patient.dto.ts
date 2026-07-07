import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  createPatientSchema,
  genderSchema,
  patientStatusSchema,
  updatePatientSchema,
} from '@hms/shared';
import { paginationQuerySchema } from '../../../common/dto/pagination.dto';

export class CreatePatientDto extends createZodDto(createPatientSchema) {}
export class UpdatePatientDto extends createZodDto(updatePatientSchema) {}

export const patientQuerySchema = paginationQuerySchema.extend({
  hospitalId: z.string().uuid().optional(),
  status: patientStatusSchema.optional(),
  gender: genderSchema.optional(),
});
export class PatientQueryDto extends createZodDto(patientQuerySchema) {}
