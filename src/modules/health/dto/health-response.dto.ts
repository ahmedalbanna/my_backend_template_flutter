import { ApiProperty } from '@nestjs/swagger';

/**
 * Response DTO for the health check endpoint.
 */
export class HealthResponseDto {
  @ApiProperty({ example: 'ok', description: 'Overall system status' })
  status!: string;

  @ApiProperty({ example: 'up', description: 'Database connectivity status' })
  database!: string;

  @ApiProperty({
    example: '2026-05-23T12:00:00.000Z',
    description: 'Timestamp of the health check',
  })
  timestamp!: string;
}
