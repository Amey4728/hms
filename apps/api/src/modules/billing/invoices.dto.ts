import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  cancelInvoiceSchema,
  createInvoiceSchema,
  invoiceStatusSchema,
  recordPaymentSchema,
  refundSchema,
} from '@hms/shared';
import { paginationQuerySchema } from '../../common/dto/pagination.dto';

export class CreateInvoiceDto extends createZodDto(createInvoiceSchema) {}
export class RecordPaymentDto extends createZodDto(recordPaymentSchema) {}
export class RefundDto extends createZodDto(refundSchema) {}
export class CancelInvoiceDto extends createZodDto(cancelInvoiceSchema) {}

export const invoiceQuerySchema = paginationQuerySchema.extend({
  patientId: z.string().uuid().optional(),
  status: invoiceStatusSchema.optional(),
});
export class InvoiceQueryDto extends createZodDto(invoiceQuerySchema) {}
