import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';

export const EMAIL_QUEUE = 'email';
export const IMAGE_PROCESSING_QUEUE = 'image-processing';

export interface EmailJobData {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export interface ImageProcessingJobData {
  filePath: string;
  options?: {
    resize?: { width: number; height: number };
    format?: 'jpeg' | 'png' | 'webp';
    quality?: number;
  };
}

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue(EMAIL_QUEUE) private emailQueue: Queue,
    @InjectQueue(IMAGE_PROCESSING_QUEUE) private imageQueue: Queue,
  ) {}

  async addEmailJob(data: EmailJobData, opts?: { delay?: number; attempts?: number }): Promise<void> {
    await this.emailQueue.add('send-email', data, {
      attempts: opts?.attempts ?? 3,
      delay: opts?.delay ?? 0,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: true,
    });
    this.logger.log(`Email job queued for: ${Array.isArray(data.to) ? data.to.join(',') : data.to}`);
  }

  async addImageProcessingJob(data: ImageProcessingJobData): Promise<void> {
    await this.imageQueue.add('process-image', data, {
      attempts: 2,
      removeOnComplete: true,
    });
    this.logger.log(`Image processing job queued: ${data.filePath}`);
  }

  async getEmailQueueStatus() {
    const [waiting, active, completed, failed] = await Promise.all([
      this.emailQueue.getWaitingCount(),
      this.emailQueue.getActiveCount(),
      this.emailQueue.getCompletedCount(),
      this.emailQueue.getFailedCount(),
    ]);
    return { waiting, active, completed, failed };
  }
}
