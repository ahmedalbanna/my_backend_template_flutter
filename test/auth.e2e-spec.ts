import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/shared/prisma/prisma.service';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { App } from 'supertest/types';
import * as crypto from 'crypto';

jest.setTimeout(30000);

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = 'password123';
  const testPhone = `+2011${Date.now().toString().slice(-9)}`;
  const knownOtp = '654321';
  const knownOtpHash = crypto
    .createHash('sha256')
    .update(knownOtp)
    .digest('hex');
  let userId: string;
  let accessToken: string;
  let refreshToken: string;

  // Track all test user IDs for cleanup
  const cleanupUserIds: string[] = [];

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
    for (const id of cleanupUserIds) {
      await prisma.user.delete({ where: { id } }).catch(() => {});
    }
    await app.close();
  });

  /* ─────────────── Register ─────────────── */
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
      cleanupUserIds.push(userId);
      accessToken = response.body.data.accessToken;
      refreshToken = response.body.data.refreshToken;
    });

    it('should fail if email already exists', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: testEmail, password: testPassword });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Email already in use');
    });

    it('should fail if password is too short', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: `short_${testEmail}`, password: '123' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  /* ─────────────── Login ─────────────── */
  describe('/auth/login (POST)', () => {
    it('should login successfully with correct credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: testEmail, password: testPassword });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.user.email).toBe(testEmail);

      refreshToken = response.body.data.refreshToken;
    });

    it('should fail to login with incorrect password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: testEmail, password: 'wrongpassword' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail to login with non-existent email', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'nobody@example.com', password: testPassword });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  /* ─────────────── Refresh Tokens ─────────────── */
  describe('/auth/refresh (POST)', () => {
    it('should refresh tokens successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();

      refreshToken = response.body.data.refreshToken;
    });

    it('should fail with a bogus refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: 'totally-invalid-token' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  /* ─────────────── Logout ─────────────── */
  describe('/auth/logout (POST)', () => {
    it('should logout successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('Logged out successfully');
    });

    it('should reject logout without a token', async () => {
      const response = await request(app.getHttpServer()).post('/auth/logout');

      expect(response.status).toBe(401);
    });
  });

  /* ─────────────── Forgot / Reset Password ─────────────── */
  describe('/auth/forgot-password (POST)', () => {
    it('should return same message whether email exists or not', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: testEmail });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe(
        'If the email exists, a reset link has been sent.',
      );
    });
  });

  /* ─────────────── Phone OTP ─────────────── */
  describe('/auth/phone/send-otp (POST)', () => {
    it('should send OTP for a new phone number', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/phone/send-otp')
        .send({ phone: testPhone });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe(
        'OTP sent successfully (simulated)',
      );
      // OTP is not returned in response for security reasons
      expect(response.body.data.otp).toBeUndefined();
    });

    it('should send OTP again for an existing phone number', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/phone/send-otp')
        .send({ phone: testPhone });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      // OTP is not returned in response for security reasons
      expect(response.body.data.otp).toBeUndefined();
    });

    it('should fail with invalid phone format', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/phone/send-otp')
        .send({ phone: '01234567890' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail with empty phone', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/phone/send-otp')
        .send({ phone: '' });

      expect(response.status).toBe(400);
    });
  });

  describe('/auth/phone/verify-otp (POST)', () => {
    // Create a user with a known OTP hash for deterministic verification testing
    let otpTestUserId: string;
    const otpTestPhone = `+2011${(Date.now() + 1).toString().slice(-9)}`;

    beforeAll(async () => {
      const user = await prisma.user.create({
        data: {
          phone: otpTestPhone,
          otpHash: knownOtpHash,
          otpExpiresAt: new Date(Date.now() + 60000),
          isActive: false,
        },
      });
      otpTestUserId = user.id;
      cleanupUserIds.push(otpTestUserId);
    });

    it('should verify OTP and return tokens for a new registration', async () => {
      const verifyResponse = await request(app.getHttpServer())
        .post('/auth/phone/verify-otp')
        .send({ phone: otpTestPhone, otp: knownOtp });

      expect(verifyResponse.status).toBe(200);
      expect(verifyResponse.body.success).toBe(true);
      expect(verifyResponse.body.data.accessToken).toBeDefined();
      expect(verifyResponse.body.data.refreshToken).toBeDefined();
      expect(verifyResponse.body.data.user.phone).toBe(otpTestPhone);
      expect(verifyResponse.body.data.user.isActive).toBe(true);
    });

    it('should verify OTP for an existing active user (login flow)', async () => {
      // Re-seed with a fresh OTP hash since the previous verify cleared it
      const freshHash = crypto
        .createHash('sha256')
        .update(knownOtp)
        .digest('hex');
      await prisma.user.update({
        where: { id: otpTestUserId },
        data: {
          otpHash: freshHash,
          otpExpiresAt: new Date(Date.now() + 60000),
          isActive: true,
        },
      });

      const verifyResponse = await request(app.getHttpServer())
        .post('/auth/phone/verify-otp')
        .send({ phone: otpTestPhone, otp: knownOtp });

      expect(verifyResponse.status).toBe(200);
      expect(verifyResponse.body.data.accessToken).toBeDefined();
      expect(verifyResponse.body.data.user.isActive).toBe(true);
    });

    it('should fail with incorrect OTP', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/phone/verify-otp')
        .send({ phone: otpTestPhone, otp: '000000' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail with non-existent phone', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/phone/verify-otp')
        .send({ phone: '+999999999999999', otp: '123456' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should fail if OTP was not requested (no OTP hash)', async () => {
      const freshPhone = `+2011${(Date.now() + 2).toString().slice(-9)}`;

      // Create a user without OTP (simulating cleared OTP)
      const noOtpUser = await prisma.user.create({
        data: { phone: freshPhone, isActive: true },
      });
      cleanupUserIds.push(noOtpUser.id);

      const response = await request(app.getHttpServer())
        .post('/auth/phone/verify-otp')
        .send({ phone: freshPhone, otp: '123456' });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toBe(
        'No OTP requested for this phone',
      );
    });
  });
});
