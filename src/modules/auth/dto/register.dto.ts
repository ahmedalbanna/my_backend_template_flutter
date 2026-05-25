import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiPropertyOptional({
    example: 'user@example.com',
    description: 'Email address — required if phone is not provided',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @MaxLength(255, { message: 'Email must be at most 255 characters' })
  email?: string;

  @ApiProperty({
    example: 'securePassword123',
    description:
      'User password — minimum 6 characters. Optional if registering via OTP flow.',
    minLength: 6,
  })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  @MaxLength(128, { message: 'Password must be at most 128 characters' })
  password?: string;

  @ApiPropertyOptional({
    example: '+201234567890',
    description:
      'Phone number in international format — required if email is not provided',
  })
  @IsOptional()
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'Phone must be in international format (e.g. +201234567890)',
  })
  phone?: string;

  @ApiPropertyOptional({
    example: 'John',
    description: 'First name',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'First name must be at most 100 characters' })
  firstName?: string;

  @ApiPropertyOptional({
    example: 'Doe',
    description: 'Last name',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Last name must be at most 100 characters' })
  lastName?: string;
}
