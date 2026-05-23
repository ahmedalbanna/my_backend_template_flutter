import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    description:
      'Password reset token received via email (from forgot-password)',
    example: 'a1b2c3d4e5f6...',
  })
  @IsNotEmpty({ message: 'Reset token is required' })
  @IsString()
  @MaxLength(512, { message: 'Token must be at most 512 characters' })
  token!: string;

  @ApiProperty({
    example: 'newSecurePassword123',
    description: 'New password — minimum 6 characters',
    minLength: 6,
  })
  @IsNotEmpty({ message: 'New password is required' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  @MaxLength(128, { message: 'Password must be at most 128 characters' })
  newPassword!: string;
}
