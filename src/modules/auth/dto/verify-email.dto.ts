import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  @ApiProperty({
    example: 'a1b2c3d4e5f6...',
    description: 'Email verification token',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(512)
  token!: string;
}
