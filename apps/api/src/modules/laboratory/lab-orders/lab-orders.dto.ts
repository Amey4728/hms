import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  cancelLabOrderSchema,
  createLabOrderSchema,
  enterResultSchema,
  labOrderStatusSchema,
  labTransitionSchema,
} from '@hms/shared';
import { paginationQuerySchema } from '../../../common/dto/pagination.dto';

export class CreateLabOrderDto extends createZodDto(createLabOrderSchema) {}
export class EnterResultDto extends createZodDto(enterResultSchema) {}
export class LabTransitionDto extends createZodDto(labTransitionSchema) {}
export class CancelLabOrderDto extends createZodDto(cancelLabOrderSchema) {}

export const labOrderQuerySchema = paginationQuerySchema.extend({
  patientId: z.string().uuid().optional(),
  hospitalId: z.string().uuid().optional(),
  status: labOrderStatusSchema.optional(),
});
export class LabOrderQueryDto extends createZodDto(labOrderQuerySchema) {}
