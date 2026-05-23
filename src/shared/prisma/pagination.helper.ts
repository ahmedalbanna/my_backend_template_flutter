/**
 * Reusable pagination utilities.
 *
 * Provides a consistent pagination interface across the application.
 * All paginated endpoints should use the same meta shape so that
 * clients (Flutter, web, etc.) can rely on a uniform response format.
 */

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface PaginationInput {
  page?: number;
  limit?: number;
}

export interface PaginationParams {
  skip: number;
  take: number;
}

/**
 * Converts a page/limit pair into Prisma-compatible skip/take values.
 *
 * @example
 * ```
 * const { skip, take } = calculatePagination({ page: 2, limit: 20 });
 * // => { skip: 20, take: 20 }
 * ```
 */
export function calculatePagination(input: PaginationInput): PaginationParams {
  const page = Math.max(input.page ?? 1, 1);
  const limit = Math.min(Math.max(input.limit ?? 10, 1), 100);
  return {
    skip: (page - 1) * limit,
    take: limit,
  };
}

/**
 * Builds a PaginationMeta object from total count and input parameters.
 *
 * @example
 * ```
 * const meta = createPaginationMeta(50, 1, 10);
 * // => { total: 50, page: 1, limit: 10, totalPages: 5 }
 * ```
 */
export function createPaginationMeta(
  total: number,
  page?: number,
  limit?: number,
): PaginationMeta {
  const safePage = Math.max(page ?? 1, 1);
  const safeLimit = Math.min(Math.max(limit ?? 10, 1), 100);
  return {
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.ceil(total / safeLimit),
  };
}

/**
 * Wraps an array of items and a total count into a standardized PaginatedResult.
 *
 * @example
 * ```
 * const result = paginateResult(users, 50, { page: 1, limit: 10 });
 * // => { data: [...], meta: { total: 50, page: 1, limit: 10, totalPages: 5 } }
 * ```
 */
export function paginateResult<T>(
  data: T[],
  total: number,
  input: PaginationInput,
): PaginatedResult<T> {
  return {
    data,
    meta: createPaginationMeta(total, input.page ?? 1, input.limit ?? 10),
  };
}
