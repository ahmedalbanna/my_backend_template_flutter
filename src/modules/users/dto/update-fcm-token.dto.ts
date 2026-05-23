import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for updating the Firebase Cloud Messaging (FCM) push notification token.
 */
export class UpdateFcmTokenDto {
  @ApiProperty({
    example: 'fcm-token-abc123-def456',
    description: 'Firebase Cloud Messaging token for push notifications',
  })
  @IsNotEmpty({ message: 'FCM token is required' })
  @IsString()
  token!: string;
}
