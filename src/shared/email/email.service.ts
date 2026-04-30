import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { welcomeTemplate } from './templates/welcome.template';
import { resetPasswordTemplate } from './templates/reset-password.template';

@Injectable()
export class EmailService {
  private transporter: Transporter;
  private readonly logger = new Logger(EmailService.name);
  private readonly from: string;

  constructor(private configService: ConfigService) {
    const smtpHost = this.configService.get<string>('email.smtp.host');
    const smtpPort = this.configService.get<number>('email.smtp.port') || 587;
    const smtpUser = this.configService.get<string>('email.smtp.user');
    const smtpPass = this.configService.get<string>('email.smtp.pass');

    this.from = this.configService.get<string>('email.from') || 'noreply@example.com';

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
    });
  }

  // ─── Core Send Method ─────────────────────────────────────────────────────

  async sendMail(options: {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
  }): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.from,
        to: Array.isArray(options.to) ? options.to.join(',') : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
      this.logger.log(`Email sent to ${options.to}: ${options.subject}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}`, error);
      // Don't throw – email failure should not break the request flow
    }
  }

  // ─── Convenience Methods ──────────────────────────────────────────────────

  async sendWelcome(to: string, name: string): Promise<void> {
    await this.sendMail({
      to,
      subject: 'Welcome! Your account is ready 🎉',
      html: welcomeTemplate(name),
      text: `Welcome ${name}! Your account has been created successfully.`,
    });
  }

  async sendPasswordReset(to: string, name: string, token: string): Promise<void> {
    const resetUrl =
      this.configService.get<string>('app.frontendUrl') || 'http://localhost:3000/reset-password';

    await this.sendMail({
      to,
      subject: 'Password Reset Request 🔐',
      html: resetPasswordTemplate(name, token, resetUrl),
      text: `Your password reset token is: ${token}. It expires in 1 hour.`,
    });
  }

  async sendGeneral(to: string, subject: string, html: string): Promise<void> {
    await this.sendMail({ to, subject, html });
  }
}
