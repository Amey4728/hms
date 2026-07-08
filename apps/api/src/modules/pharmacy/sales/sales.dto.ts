import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { createSaleSchema } from '@hms/shared';
import { paginationQuerySchema } from '../../../common/dto/pagination.dto';

export class CreateSaleDto extends createZodDto(createSaleSchema) {}

export const saleQuerySchema = paginationQuerySchema.extend({
  patientId: z.string().uuid().optional(),
});
export class SaleQueryDto extends createZodDto(saleQuerySchema) {}
