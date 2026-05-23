import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendOtpDto {
  @ApiProperty({
    example: '+201234567890',
    description:
      'Phone number in international format (e.g. +201234567890 for Egypt)',
  })
  @IsNotEmpty({ message: 'Phone number is required' })
  @IsString()
  @MaxLength(16, { message: 'Phone number must be at most 16 characters' })
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'Phone must be in international format (e.g. +201234567890)',
  })
  phone!: string;
}
