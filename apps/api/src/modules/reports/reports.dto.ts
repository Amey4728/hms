import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const dateRangeSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
export class DateRangeDto extends createZodDto(dateRangeSchema) {}
