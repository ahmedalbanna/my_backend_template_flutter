import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { FirebaseModule } from '../../shared/firebase/firebase.module';
import { UsersModule } from '../users/users.module';
import { NotificationsCron } from './notifications.cron';

import { NotificationsController } from './notifications.controller';

@Module({
  imports: [FirebaseModule, UsersModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsCron],
  exports: [NotificationsService],
})

export class NotificationsModule {}
