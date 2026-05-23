import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { swaggerConfig } from './config/swagger.config';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { PrismaClientExceptionFilter } from './common/filters/prisma-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(logger);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(
    new AllExceptionsFilter(),
    new HttpExceptionFilter(),
    new PrismaClientExceptionFilter(),
  );

  app.useGlobalInterceptors(new TransformInterceptor());

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
    },
  });

  app.enableCors({
    origin: process.env.FRONTEND_URL || true,
    credentials: true,
  });

  app.enableShutdownHooks();

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`Swagger docs available at:  http://localhost:${port}/docs`);

  return app;
}

process.on('uncaughtException', (error: Error) => {
  Logger.error('Uncaught exception — shutting down', error.stack, 'System');
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  Logger.error(
    'Unhandled rejection',
    reason instanceof Error ? reason.stack : String(reason),
    'System',
  );
});

bootstrap().catch((error: unknown) => {
  Logger.error(
    'Failed to start application',
    error instanceof Error ? error.stack : String(error),
    'Bootstrap',
  );
  process.exit(1);
});
