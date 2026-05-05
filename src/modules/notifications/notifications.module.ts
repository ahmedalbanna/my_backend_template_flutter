import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { FirebaseModule } from '../../shared/firebase/firebase.module';
import { UsersModule } from '../users/users.module';
import { NotificationsCron } from './notifications.cron';

@Module({
  imports: [FirebaseModule, UsersModule],
  providers: [NotificationsService, NotificationsCron],
  exports: [NotificationsService],
})
export class NotificationsModule {}
