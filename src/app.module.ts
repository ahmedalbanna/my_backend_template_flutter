import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import configuration, { validationSchema } from './config/configuration';
import { PrismaModule } from './shared/prisma/prisma.module';
import { EmailModule } from './shared/email/email.module';
import { SmsModule } from './shared/sms/sms.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60000, limit: 10 }],
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
      validationOptions: {
        abortEarly: false,
        allowUnknown: true,
      },
    }),
    PrismaModule,
    EmailModule,
    SmsModule,
    AuthModule,
    UsersModule,
    HealthModule,
  ],
})
export class AppModule {}
