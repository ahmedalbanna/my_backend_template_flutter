import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration, { validationSchema } from './config/configuration';
import { PrismaModule } from './shared/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { HealthModule } from './modules/health/health.module';
import { UploadModule } from './shared/upload/upload.module';
import { EmailModule } from './shared/email/email.module';
import { QueueModule } from './shared/queue/queue.module';
import { AuditModule } from './shared/audit/audit.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { FirebaseModule } from './shared/firebase/firebase.module';

@Module({
  imports: [
    // ─── Configuration ─────────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
      validationOptions: {
        abortEarly: false, // Report ALL missing env vars at once
        allowUnknown: true,
      },
    }),

    // ─── Task Scheduling ────────────────────────────────────────────────────
    ScheduleModule.forRoot(),

    // ─── Rate Limiting ──────────────────────────────────────────────────────
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,    // 1 second
        limit: 5,     // max 5 requests per second
      },
      {
        name: 'medium',
        ttl: 60000,   // 1 minute
        limit: 100,   // max 100 requests per minute
      },
    ]),

    // ─── Core Modules ───────────────────────────────────────────────────────
    PrismaModule,
    FirebaseModule,

    // ─── Feature Modules ────────────────────────────────────────────────────
    AuthModule,
    UsersModule,
    HealthModule,
    NotificationsModule,

    // ─── Shared Services ────────────────────────────────────────────────────
    EmailModule,
    UploadModule,
    QueueModule,
    AuditModule,
  ],
})
export class AppModule {}
