import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { EmailService } from '../email/email.service';
import { EMAIL_QUEUE, EmailJobData } from './queue.service';

@Processor(EMAIL_QUEUE)
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private emailService: EmailService) {}

  @Process('send-email')
  async handleSendEmail(job: Job<EmailJobData>): Promise<void> {
    this.logger.log(`Processing email job #${job.id} to: ${job.data.to}`);
    try {
      await this.emailService.sendMail({
        to: job.data.to,
        subject: job.data.subject,
        html: job.data.html,
        text: job.data.text,
      });
      this.logger.log(`Email job #${job.id} completed successfully`);
    } catch (error) {
      this.logger.error(`Email job #${job.id} failed`, error);
      throw error; // Rethrow to trigger Bull retry
    }
  }
}
