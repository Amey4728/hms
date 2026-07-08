import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { createLabTestSchema, updateLabTestSchema } from '@hms/shared';
import { paginationQuerySchema } from '../../../common/dto/pagination.dto';

export class CreateLabTestDto extends createZodDto(createLabTestSchema) {}
export class UpdateLabTestDto extends createZodDto(updateLabTestSchema) {}

export const labTestQuerySchema = paginationQuerySchema.extend({
  category: z.string().trim().min(1).optional(),
});
export class LabTestQueryDto extends createZodDto(labTestQuerySchema) {}
