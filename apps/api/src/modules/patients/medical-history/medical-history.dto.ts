import { createZodDto } from 'nestjs-zod';
import { createMedicalHistorySchema, updateMedicalHistorySchema } from '@hms/shared';

export class CreateMedicalHistoryDto extends createZodDto(createMedicalHistorySchema) {}
export class UpdateMedicalHistoryDto extends createZodDto(updateMedicalHistorySchema) {}
