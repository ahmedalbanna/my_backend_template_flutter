import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly isProduction: boolean;
  private readonly twilioAccountSid: string;
  private readonly twilioAuthToken: string;
  private readonly twilioPhoneNumber: string;

  constructor(configService: ConfigService) {
    this.isProduction =
      configService.get<string>('NODE_ENV') === 'production';
    this.twilioAccountSid = configService.get<string>('sms.accountSid') || '';
    this.twilioAuthToken = configService.get<string>('sms.authToken') || '';
    this.twilioPhoneNumber =
      configService.get<string>('sms.phoneNumber') || '';

    if (this.isProduction && !this.twilioAccountSid) {
      this.logger.warn(
        'Twilio credentials not configured — SMS sending will fail in production',
      );
    }
  }

  async sendSms(to: string, message: string): Promise<void> {
    if (!this.isProduction) {
      this.logger.log(`\n📱 SMS to ${to}: ${message}\n`);
      return;
    }

    if (!this.twilioAccountSid || !this.twilioAuthToken || !this.twilioPhoneNumber) {
      this.logger.error('Twilio not configured — cannot send SMS');
      return;
    }

    const { default: twilio } = await import('twilio');
    const client = twilio(this.twilioAccountSid, this.twilioAuthToken);
    await client.messages.create({
      body: message,
      from: this.twilioPhoneNumber,
      to,
    });
    this.logger.log(`SMS sent to ${to}`);
  }

  async sendOtp(phone: string, otp: string): Promise<void> {
    await this.sendSms(phone, `Your verification code is: ${otp}`);
  }
}
