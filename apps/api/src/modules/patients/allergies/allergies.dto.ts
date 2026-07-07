import { createZodDto } from 'nestjs-zod';
import { createAllergySchema, updateAllergySchema } from '@hms/shared';

export class CreateAllergyDto extends createZodDto(createAllergySchema) {}
export class UpdateAllergyDto extends createZodDto(updateAllergySchema) {}
