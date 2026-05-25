import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import bodyParser from 'body-parser';
import express from 'express';
import { AppModule } from './app.module';
import { swaggerConfig } from './config/swagger.config';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { PrismaClientExceptionFilter } from './common/filters/prisma-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(logger);

  // ── Security Headers (Helmet) ───────────────────────────────────
  // Content-Security-Policy, X-Frame-Options, HSTS, X-Content-Type-Options, etc.
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'same-origin' },
      hidePoweredBy: true,
      // Swagger UI needs its own CSP; relax only for docs endpoint
      contentSecurityPolicy:
        process.env.NODE_ENV === 'production' ? undefined : false,
    }),
  );

  // ── Request Body Size Limiting (prevents large payload DoS attacks) ──
  app.use(bodyParser.json({ limit: '1mb' }));
  app.use(bodyParser.urlencoded({ limit: '1mb', extended: true }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(
    new HttpExceptionFilter(),
    new PrismaClientExceptionFilter(),
    new AllExceptionsFilter(),
  );

  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Set global API version prefix — all routes are now under /api/v1/*
  app.setGlobalPrefix('api/v1', {
    exclude: ['docs', 'docs-json'], // Keep Swagger at root /docs
  });

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
    },
  });

  // ── Hardened CORS Configuration ──────────────────────────────────
  // In production, FRONTEND_URL must be set explicitly. In development,
  // we allow a more permissive config but never `true` (allow all).
  const frontendUrl = process.env.FRONTEND_URL;
  const nodeEnv = process.env.NODE_ENV || 'development';
  app.enableCors({
    origin: frontendUrl
      ? frontendUrl.split(',').map((u) => u.trim())
      : nodeEnv === 'production'
        ? false // Disable CORS for non-browser clients in production
        : ['http://localhost:4200', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    maxAge: 86400, // Preflight cache for 24 hours
  });

  app.enableShutdownHooks();

  // ── Production hardening ─────────────────────────────────────────
  if (nodeEnv === 'production') {
    // Trust X-Forwarded-* headers behind reverse proxy
    const expressApp = app
      .getHttpAdapter()
      .getInstance() as express.Application;
    if (expressApp && typeof expressApp.set === 'function') {
      expressApp.set('trust proxy', 1);
    }
    logger.log('Running in production mode — security hardening active');
  }

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
