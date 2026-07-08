import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  appointmentStatusSchema,
  bookAppointmentSchema,
  cancelAppointmentSchema,
  rescheduleSchema,
  slotsQuerySchema,
  transitionSchema,
  walkInSchema,
} from '@hms/shared';
import { paginationQuerySchema } from '../../../common/dto/pagination.dto';

export class BookAppointmentDto extends createZodDto(bookAppointmentSchema) {}
export class WalkInDto extends createZodDto(walkInSchema) {}
export class RescheduleDto extends createZodDto(rescheduleSchema) {}
export class CancelAppointmentDto extends createZodDto(cancelAppointmentSchema) {}
export class TransitionDto extends createZodDto(transitionSchema) {}
export class SlotsQueryDto extends createZodDto(slotsQuerySchema) {}

export const appointmentQuerySchema = paginationQuerySchema.extend({
  doctorId: z.string().uuid().optional(),
  patientId: z.string().uuid().optional(),
  hospitalId: z.string().uuid().optional(),
  status: appointmentStatusSchema.optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
export class AppointmentQueryDto extends createZodDto(appointmentQuerySchema) {}

export const queueQuerySchema = z.object({
  doctorId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
});
export class QueueQueryDto extends createZodDto(queueQuerySchema) {}
