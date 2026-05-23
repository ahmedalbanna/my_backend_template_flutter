import {
  IsNotEmpty,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
  @ApiProperty({
    example: '+201234567890',
    description: 'Phone number used in the send-otp request',
  })
  @IsNotEmpty({ message: 'Phone number is required' })
  @IsString()
  @MaxLength(16, { message: 'Phone number must be at most 16 characters' })
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'Phone must be in international format (e.g. +201234567890)',
  })
  phone!: string;

  @ApiProperty({
    example: '123456',
    description: '6-digit OTP code sent to the phone',
    minLength: 6,
    maxLength: 6,
  })
  @IsNotEmpty({ message: 'OTP code is required' })
  @IsString()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: 'OTP must be a 6-digit number' })
  otp!: string;
}
