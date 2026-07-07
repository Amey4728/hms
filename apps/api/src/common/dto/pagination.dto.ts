import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/** Reusable pagination + sorting + search query params. */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().trim().min(1).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().trim().min(1).optional(),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export class PaginationQueryDto extends createZodDto(paginationQuerySchema) {}

/** Helper to compute Prisma skip/take from a pagination query. */
export function toPrismaPagination(query: PaginationQuery): { skip: number; take: number } {
  return { skip: (query.page - 1) * query.limit, take: query.limit };
}
