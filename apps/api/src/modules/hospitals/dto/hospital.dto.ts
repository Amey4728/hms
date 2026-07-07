import { createZodDto } from 'nestjs-zod';
import { createHospitalSchema, updateHospitalSchema } from '@hms/shared';

export class CreateHospitalDto extends createZodDto(createHospitalSchema) {}
export class UpdateHospitalDto extends createZodDto(updateHospitalSchema) {}
