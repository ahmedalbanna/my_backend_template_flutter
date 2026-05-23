import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration, { validationSchema } from './config/configuration';
import { PrismaModule } from './shared/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
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
    AuthModule,
    UsersModule,
    HealthModule,
  ],
})
export class AppModule {}
