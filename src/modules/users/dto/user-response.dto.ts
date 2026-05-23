import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Sanitized user object returned in user management endpoints.
 * Password, refreshToken, and other sensitive fields are excluded.
 */
export class UserResponseDto {
  @ApiProperty({ example: 'cmpx0abc123def456', description: 'Unique user ID' })
  id!: string;

  @ApiPropertyOptional({
    example: 'user@example.com',
    description: 'Email address',
  })
  email?: string | null;

  @ApiPropertyOptional({
    example: '+201234567890',
    description: 'Phone number',
  })
  phone?: string | null;

  @ApiPropertyOptional({ example: 'John', description: 'First name' })
  firstName?: string | null;

  @ApiPropertyOptional({ example: 'Doe', description: 'Last name' })
  lastName?: string | null;

  @ApiProperty({
    example: 'USER',
    description: 'User role',
    enum: ['USER', 'ADMIN'],
  })
  role!: string;

  @ApiProperty({ example: true, description: 'Whether the account is active' })
  isActive!: boolean;

  @ApiPropertyOptional({
    example: 'fcm-token-abc123',
    description: 'Firebase Cloud Messaging token for push notifications',
    nullable: true,
  })
  fcmToken?: string | null;

  @ApiProperty({
    example: '2026-05-23T12:00:00.000Z',
    description: 'Account creation timestamp',
  })
  createdAt!: Date;

  @ApiProperty({
    example: '2026-05-23T12:00:00.000Z',
    description: 'Last update timestamp',
  })
  updatedAt!: Date;
}
