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

  const adminEmail = `admin_e2e_${Date.now()}@example.com`;
  const userEmail = `user_e2e_${Date.now()}@example.com`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    const adminRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: adminEmail, password: 'password123', firstName: 'Admin', lastName: 'User' });
    adminToken = adminRes.body.data.accessToken;
    adminId = adminRes.body.data.user.id;

    await prisma.user.update({ where: { id: adminId }, data: { role: 'ADMIN' } });

    const userRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: userEmail, password: 'password123', firstName: 'Regular', lastName: 'User' });
    userToken = userRes.body.data.accessToken;
  });

  afterAll(async () => {
    if (adminId) {
      await prisma.user.deleteMany({ where: { email: { in: [adminEmail, userEmail] } } });
    }
    await app.close();
  });

  describe('GET /users/me', () => {
    it('should return the authenticated user profile', async () => {
      const res = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe(adminEmail);
      expect(res.body.data.password).toBeUndefined();
    });

    it('should fail without auth token', async () => {
      const res = await request(app.getHttpServer()).get('/users/me');
      expect(res.status).toBe(401);
    });
  });

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

    it('should deny access for non-admin users', async () => {
      const res = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('GET /users/:id (admin only)', () => {
    it('should return a specific user', async () => {
      const res = await request(app.getHttpServer())
        .get(`/users/${adminId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe(adminEmail);
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app.getHttpServer())
        .get('/users/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });
});
