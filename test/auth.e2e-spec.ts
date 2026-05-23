import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/shared/prisma/prisma.service';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { App } from 'supertest/types';

jest.setTimeout(30000);

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = 'password123';
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());

    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    if (userId) {
      await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    }
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: testEmail,
          password: testPassword,
          firstName: 'E2E',
          lastName: 'Test',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.user.email).toBe(testEmail);
      expect(response.body.data.user.password).toBeUndefined();

      userId = response.body.data.user.id;
    });

    it('should fail if email already exists', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: testEmail,
          password: testPassword,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Email already in use');
    });

    it('should fail validation if password is too short', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: `short_${testEmail}`,
          password: '123',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('/auth/login (POST)', () => {
    it('should login successfully with correct credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.user.email).toBe(testEmail);
    });

    it('should fail to login with incorrect password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testEmail,
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
