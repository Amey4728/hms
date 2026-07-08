import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { createAvailabilitySchema, updateAvailabilitySchema } from '@hms/shared';

export class CreateAvailabilityDto extends createZodDto(createAvailabilitySchema) {}
export class UpdateAvailabilityDto extends createZodDto(updateAvailabilitySchema) {}

export const availabilityQuerySchema = z.object({ doctorId: z.string().uuid() });
export class AvailabilityQueryDto extends createZodDto(availabilityQuerySchema) {}
