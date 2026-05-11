import { Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from '../../shared/firebase/firebase.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import * as admin from 'firebase-admin';


@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private firebaseService: FirebaseService,
    private prisma: PrismaService,
  ) {}


  async sendToDevice(token: string, title: string, body: string, data?: Record<string, string>) {
    if (!this.firebaseService.messaging) {
      this.logger.warn('Messaging not initialized');
      return;
    }

    const message: admin.messaging.Message = {
      token,
      notification: { title, body },
      data: data || {},
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'high_importance_channel',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
          },
        },
      },
    };

    try {
      const response = await this.firebaseService.messaging.send(message);
      this.logger.log(`Notification sent successfully: ${response}`);
      return response;
    } catch (error) {
      this.logger.error('Error sending notification', error);
      throw error;
    }
  }

  async sendToTopic(topic: string, title: string, body: string, data?: Record<string, string>) {
    if (!this.firebaseService.messaging) return;

    const message: admin.messaging.TopicMessage = {
      topic,
      notification: { title, body },
      data: data || {},
    };

    try {
      const response = await this.firebaseService.messaging.send(message);
      this.logger.log(`Topic notification sent successfully: ${response}`);
      return response;
    } catch (error) {
      this.logger.error('Error sending topic notification', error);
      throw error;
    }
  }

  async findAllByUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(id: string, userId: string) {
    return this.prisma.notification.update({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}

