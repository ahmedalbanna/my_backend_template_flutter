import { IsEmail, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendVerificationEmailDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email address to send verification to',
  })
  @IsEmail()
  @MaxLength(255)
  email!: string;
}
