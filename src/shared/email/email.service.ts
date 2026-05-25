import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private readonly from: string;

  constructor(configService: ConfigService) {
    this.from = configService.get<string>('mail.from') || 'noreply@example.com';
    const host = configService.get<string>('mail.host');
    const user = configService.get<string>('mail.user');
    const pass = configService.get<string>('mail.pass');
    const port = configService.get<number>('mail.port') || 587;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      this.logger.log(`SMTP configured: ${host}:${port}`);
    } else {
      this.logger.warn('No SMTP configured — emails will be logged to console only');
      nodemailer.createTestAccount().then((account) => {
        this.transporter = nodemailer.createTransport({
          host: account.smtp.host,
          port: account.smtp.port,
          secure: account.smtp.secure,
          auth: { user: account.user, pass: account.pass },
        });
        this.logger.log(`Using Ethereal test SMTP: ${account.user}`);
      });
    }
  }

  private async ensureTransporter(): Promise<nodemailer.Transporter> {
    if (!this.transporter) {
      const account = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: account.smtp.host,
        port: account.smtp.port,
        secure: account.smtp.secure,
        auth: { user: account.user, pass: account.pass },
      });
    }
    return this.transporter;
  }

  async sendMail(to: string, subject: string, html: string): Promise<void> {
    const transporter = await this.ensureTransporter();
    const info = await transporter.sendMail({
      from: this.from,
      to,
      subject,
      html,
    });
    if (info.messageId) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        this.logger.log(`📧 Email preview: ${previewUrl}`);
      }
    }
  }

  async sendPasswordResetEmail(to: string, resetToken: string): Promise<void> {
    const resetLink = `${resetToken}`;
    await this.sendMail(
      to,
      'Password Reset',
      `<p>Use the following token to reset your password:</p>
       <p><strong>${resetToken}</strong></p>
       <p>This token expires in 1 hour.</p>`,
    );
    this.logger.log(`Password reset email sent to ${to}`);
  }

  async sendVerificationEmail(to: string, verificationToken: string): Promise<void> {
    await this.sendMail(
      to,
      'Verify Your Email',
      `<p>Use the following token to verify your email:</p>
       <p><strong>${verificationToken}</strong></p>
       <p>This token expires in 24 hours.</p>`,
    );
    this.logger.log(`Verification email sent to ${to}`);
  }
}
