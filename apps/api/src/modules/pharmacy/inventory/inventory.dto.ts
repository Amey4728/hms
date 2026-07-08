import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { receiveBatchSchema } from '@hms/shared';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class ReceiveBatchDto extends createZodDto(receiveBatchSchema) {}
export class StockQueryDto extends PaginationQueryDto {}

export const expiryQuerySchema = z.object({
  days: z.coerce.number().int().min(0).max(365).default(30),
});
export class ExpiryQueryDto extends createZodDto(expiryQuerySchema) {}
