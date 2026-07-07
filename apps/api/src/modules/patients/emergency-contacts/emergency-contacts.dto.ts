import { createZodDto } from 'nestjs-zod';
import { createEmergencyContactSchema, updateEmergencyContactSchema } from '@hms/shared';

export class CreateEmergencyContactDto extends createZodDto(createEmergencyContactSchema) {}
export class UpdateEmergencyContactDto extends createZodDto(updateEmergencyContactSchema) {}
