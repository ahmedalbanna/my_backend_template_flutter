import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * A sanitized user object returned in auth responses (no password/refreshToken).
 */
export class AuthUserResponseDto {
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

/**
 * JWT token pair returned on login, register, and token refresh.
 */
export class AuthTokensDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIs...',
    description: 'JWT access token (short-lived)',
  })
  accessToken!: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIs...',
    description: 'JWT refresh token (long-lived, single-use)',
  })
  refreshToken!: string;
}

/**
 * Response returned after successful registration or OTP verification.
 * Combines JWT tokens with the user object.
 */
export class AuthTokensWithUserDto extends AuthTokensDto {
  @ApiProperty({ type: AuthUserResponseDto, description: 'Authenticated user' })
  user!: AuthUserResponseDto;
}
