import { Type, applyDecorators } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOkResponse,
  ApiResponse,
  ApiResponseOptions,
  getSchemaPath,
} from '@nestjs/swagger';
import { ApiSuccessResponse } from '../dto/api-response.dto';
import {
  PaginatedResponseDto,
  PaginationMetaDto,
} from '../dto/paginated-response.dto';

/**
 * Decorator that wraps a data DTO inside the standard { success, data } envelope
 * for Swagger/OpenAPI documentation.
 *
 * Use this on endpoints that return a single object (not paginated).
 *
 * @example
 * ```typescript
 * @ApiWrappedResponse(UserResponseDto, { status: 200, description: 'User found' })
 * ```
 */
export function ApiWrappedResponse(
  model: Type<unknown>,
  options?: ApiResponseOptions,
) {
  return applyDecorators(
    ApiExtraModels(ApiSuccessResponse, model),
    ApiResponse({
      ...options,
      schema: {
        allOf: [
          { $ref: getSchemaPath(ApiSuccessResponse) },
          {
            properties: {
              data: { $ref: getSchemaPath(model) },
            },
          },
        ],
      },
    }),
  );
}

/**
 * Decorator for paginated endpoints.
 * Wraps the data array inside PaginatedResponseDto which includes PaginationMetaDto.
 *
 * @example
 * ```typescript
 * @ApiPaginatedResponse(UserResponseDto, { description: 'Paginated user list' })
 * ```
 */
export function ApiPaginatedResponse(
  model: Type<unknown>,
  options?: ApiResponseOptions,
) {
  return applyDecorators(
    ApiExtraModels(
      ApiSuccessResponse,
      PaginatedResponseDto,
      PaginationMetaDto,
      model,
    ),
    ApiOkResponse({
      ...options,
      schema: {
        allOf: [
          { $ref: getSchemaPath(ApiSuccessResponse) },
          {
            properties: {
              data: {
                allOf: [
                  { $ref: getSchemaPath(PaginatedResponseDto) },
                  {
                    properties: {
                      data: {
                        type: 'array',
                        items: { $ref: getSchemaPath(model) },
                      },
                    },
                  },
                ],
              },
            },
          },
        ],
      },
    }),
  );
}

/**
 * Convenience decorator for endpoints that return a simple message string
 * wrapped in the standard envelope.
 *
 * @example
 * ```typescript
 * @ApiMessageResponse('Account deleted')
 * ```
 */
export function ApiMessageResponse(message: string, status = 200) {
  return applyDecorators(
    ApiExtraModels(ApiSuccessResponse),
    ApiResponse({
      status,
      description: message,
      schema: {
        allOf: [
          { $ref: getSchemaPath(ApiSuccessResponse) },
          {
            properties: {
              data: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    example: message,
                  },
                },
              },
            },
          },
        ],
      },
    }),
  );
}
