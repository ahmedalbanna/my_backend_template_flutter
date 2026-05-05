import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationsService } from './notifications.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class NotificationsCron {
  private readonly logger = new Logger(NotificationsCron.name);

  constructor(
    private notificationsService: NotificationsService,
    private usersService: UsersService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyNotifications() {
    this.logger.log('Running daily notification cron job...');
    
    // مثال: إرسال تنبيه لجميع المستخدمين الذين لديهم Token
    // في الإنتاج، قد ترغب في التصفية حسب شروط معينة
    const { data: users } = await this.usersService.findAll({ limit: 1000 });
    
    for (const user of users) {
      // نحتاج لجلب المستخدم بالكامل للحصول على الـ token (findAll قد لا تعيده)
      const fullUser = await this.usersService.findById(user.id);
      if (fullUser?.fcmToken) {
        try {
          await this.notificationsService.sendToDevice(
            fullUser.fcmToken,
            'صباح الخير!',
            'لا تنسَ تفقد تحديثات اليوم في التطبيق.',
          );
        } catch (e) {
          this.logger.error(`Failed to send cron notification to user ${user.id}`);
        }
      }
    }
  }
}
