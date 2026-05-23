import { ApiProperty } from '@nestjs/swagger';

/**
 * Pagination metadata that accompanies every paginated response.
 */
export class PaginationMetaDto {
  @ApiProperty({ example: 50, description: 'Total number of records' })
  total!: number;

  @ApiProperty({ example: 1, description: 'Current page number (1-based)' })
  page!: number;

  @ApiProperty({ example: 10, description: 'Number of items per page' })
  limit!: number;

  @ApiProperty({ example: 5, description: 'Total number of pages' })
  totalPages!: number;
}

/**
 * Generic paginated response wrapper.
 *
 * When returned from a controller, the TransformInterceptor adds the outer
 * { success, data } envelope, so the full JSON response becomes:
 * ```json
 * { "success": true, "data": { "data": [...], "meta": { ... } } }
 * ```
 *
 * Use with @ApiExtraModels and @ApiResponse(schema:) for accurate OpenAPI types.
 */
export class PaginatedResponseDto<T> {
  @ApiProperty({ description: 'Array of items for the current page' })
  data!: T[];

  @ApiProperty({ type: PaginationMetaDto, description: 'Pagination metadata' })
  meta!: PaginationMetaDto;
}
