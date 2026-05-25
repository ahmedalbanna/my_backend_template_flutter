import { ApiProperty } from '@nestjs/swagger';

/**
 * Generic wrapper for all successful API responses.
 *
 * The TransformInterceptor wraps every successful response in this shape at runtime.
 * Use this class with @ApiExtraModels + @ApiResponse(schema:) to generate accurate
 * OpenAPI schemas that include the { success, data } envelope.
 */
export class ApiSuccessResponse<T> {
  @ApiProperty({
    example: true,
    description: 'Indicates whether the request was successful',
  })
  success!: boolean;

  @ApiProperty({ description: 'Response payload' })
  data!: T;
}

/**
 * Standard error response shape returned by all exception filters.
 */
export class ApiErrorResponse {
  @ApiProperty({ example: false, description: 'Always false for errors' })
  success!: boolean;

  @ApiProperty({ description: 'Error details' })
  error!: {
    /** HTTP status code */
    statusCode: number;
    /** Human-readable error message or array of validation errors */
    message: string | string[];
    /** ISO timestamp of when the error occurred */
    timestamp: string;
    /** The URL path that triggered the error */
    path: string;
  };
}

/**
 * A simple message response used for operations that return just a confirmation string.
 */
export class MessageResponseDto {
  @ApiProperty({
    example: 'Logged out successfully',
    description: 'Confirmation message',
  })
  message!: string;
}
