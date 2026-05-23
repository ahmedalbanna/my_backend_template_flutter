import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/shared/prisma/prisma.service';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { App } from 'supertest/types';

jest.setTimeout(30000);

describe('UsersController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let adminToken: string;
  let userToken: string;
  let adminId: string;
  let userId: string;
  let userEmail: string;

  const adminEmail = `admin_e2e_${Date.now()}@example.com`;

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

    userEmail = `user_e2e_${Date.now()}@example.com`;

    const adminRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: adminEmail,
        password: 'password123',
        firstName: 'Admin',
        lastName: 'User',
      });
    adminToken = adminRes.body.data.accessToken;
    adminId = adminRes.body.data.user.id;

    await prisma.user.update({
      where: { id: adminId },
      data: { role: 'ADMIN' },
    });

    const userRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: userEmail,
        password: 'password123',
        firstName: 'Regular',
        lastName: 'User',
      });
    userToken = userRes.body.data.accessToken;
    userId = userRes.body.data.user.id;
  });

  afterAll(async () => {
    if (adminId) {
      await prisma.user.deleteMany({
        where: { email: { in: [adminEmail, userEmail] } },
      });
    }
    await app.close();
  });

  /* ─────────────── GET /users/me ─────────────── */
  describe('GET /users/me', () => {
    it('should return the authenticated user profile', async () => {
      const res = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe(userEmail);
      expect(res.body.data.password).toBeUndefined();
      expect(res.body.data.refreshToken).toBeUndefined();
    });

    it('should fail without auth token', async () => {
      const res = await request(app.getHttpServer()).get('/users/me');
      expect(res.status).toBe(401);
    });
  });

  /* ─────────────── PUT /users/me ─────────────── */
  describe('PUT /users/me', () => {
    it('should update own profile', async () => {
      const res = await request(app.getHttpServer())
        .put('/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ firstName: 'UpdatedFirst', lastName: 'UpdatedLast' });
      expect(res.status).toBe(200);
      expect(res.body.data.firstName).toBe('UpdatedFirst');
      expect(res.body.data.lastName).toBe('UpdatedLast');
      expect(res.body.data.password).toBeUndefined();
    });

    it('should ignore role/isActive in self-update', async () => {
      const res = await request(app.getHttpServer())
        .put('/users/me')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ role: 'ADMIN', isActive: false });
      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe('USER');
      expect(res.body.data.isActive).toBe(true);
    });

    it('should fail without auth token', async () => {
      const res = await request(app.getHttpServer())
        .put('/users/me')
        .send({ firstName: 'Nope' });
      expect(res.status).toBe(401);
    });
  });

  /* ─────────────── PATCH /users/fcm-token ─────────────── */
  describe('PATCH /users/fcm-token', () => {
    it('should update FCM token', async () => {
      const res = await request(app.getHttpServer())
        .patch('/users/fcm-token')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ token: 'new-fcm-token-123' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should fail without auth token', async () => {
      const res = await request(app.getHttpServer())
        .patch('/users/fcm-token')
        .send({ token: 'test' });
      expect(res.status).toBe(401);
    });
  });

  /* ─────────────── DELETE /users/me ─────────────── */
  describe('DELETE /users/me', () => {
    let tempToken: string;
    let tempEmail: string;
    let tempId: string;

    beforeEach(async () => {
      tempEmail = `temp_e2e_${Date.now()}@example.com`;
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: tempEmail, password: 'password123' });
      tempToken = res.body.data.accessToken;
      tempId = res.body.data.user.id;
    });

    afterEach(async () => {
      await prisma.user.delete({ where: { id: tempId } }).catch(() => {});
    });

    it('should delete own account', async () => {
      const res = await request(app.getHttpServer())
        .delete('/users/me')
        .set('Authorization', `Bearer ${tempToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.message).toBe('User deleted successfully');

      const check = await prisma.user.findUnique({ where: { id: tempId } });
      expect(check).toBeNull();
    });

    it('should fail without auth token', async () => {
      const res = await request(app.getHttpServer()).delete('/users/me');
      expect(res.status).toBe(401);
    });
  });

  /* ─────────────── GET /users (admin only) ─────────────── */
  describe('GET /users (admin only)', () => {
    it('should return paginated users for admin', async () => {
      const res = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.data).toBeInstanceOf(Array);
      expect(res.body.data.meta.total).toBeGreaterThanOrEqual(2);
    });

    it('should support pagination query params', async () => {
      const res = await request(app.getHttpServer())
        .get('/users?page=1&limit=5&sortBy=email&sortOrder=asc')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.meta.page).toBe(1);
      expect(res.body.data.meta.limit).toBe(5);
    });

    it('should deny access for non-admin users', async () => {
      const res = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(403);
    });

    it('should deny access for unauthenticated requests', async () => {
      const res = await request(app.getHttpServer()).get('/users');
      expect(res.status).toBe(401);
    });
  });

  /* ─────────────── GET /users/:id (admin only) ─────────────── */
  describe('GET /users/:id (admin only)', () => {
    it('should return a specific user for admin', async () => {
      const res = await request(app.getHttpServer())
        .get(`/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe(userEmail);
      expect(res.body.data.password).toBeUndefined();
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app.getHttpServer())
        .get('/users/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });

    it('should deny access for non-admin users', async () => {
      const res = await request(app.getHttpServer())
        .get(`/users/${adminId}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(403);
    });
  });

  /* ─────────────── PUT /users/:id (admin only) ─────────────── */
  describe('PUT /users/:id (admin only)', () => {
    it('should update any user (including role)', async () => {
      const res = await request(app.getHttpServer())
        .put(`/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ firstName: 'AdminUpdated', role: 'ADMIN' });
      expect(res.status).toBe(200);
      expect(res.body.data.firstName).toBe('AdminUpdated');

      await prisma.user.update({
        where: { id: userId },
        data: { role: 'USER', firstName: 'Regular' },
      });
    });

    it('should deny access for non-admin users', async () => {
      const res = await request(app.getHttpServer())
        .put(`/users/${adminId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ firstName: 'hack' });
      expect(res.status).toBe(403);
    });
  });

  /* ─────────────── DELETE /users/:id (admin only) ─────────────── */
  describe('DELETE /users/:id (admin only)', () => {
    let deleteUserId: string;

    beforeEach(async () => {
      const email = `delete_e2e_${Date.now()}@example.com`;
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email, password: 'password123' });
      deleteUserId = res.body.data.user.id;
    });

    it('should delete any user by admin', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/users/${deleteUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);

      const check = await prisma.user.findUnique({
        where: { id: deleteUserId },
      });
      expect(check).toBeNull();
    });

    it('should deny access for non-admin users', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/users/${deleteUserId}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(403);
    });
  });
});
