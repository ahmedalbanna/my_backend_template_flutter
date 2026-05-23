import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Refresh token received from login or previous refresh',
  })
  @IsNotEmpty({ message: 'Refresh token is required' })
  @IsString()
  @MaxLength(2048, { message: 'Refresh token must be at most 2048 characters' })
  refreshToken!: string;
}
