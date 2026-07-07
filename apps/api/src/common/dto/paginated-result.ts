import type { PaginationMeta } from '@hms/shared';

/**
 * Wrapper returned by services for list endpoints. The TransformInterceptor
 * detects it and lifts `items` into `data` and `meta` into the envelope's meta.
 */
export class PaginatedResult<T> {
  constructor(
    public readonly items: T[],
    public readonly meta: PaginationMeta,
  ) {}

  static from<T>(items: T[], total: number, page: number, limit: number): PaginatedResult<T> {
    const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;
    return new PaginatedResult<T>(items, {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    });
  }
}
