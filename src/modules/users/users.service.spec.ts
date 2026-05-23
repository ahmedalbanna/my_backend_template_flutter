import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<Partial<UsersRepository>>;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    phone: null,
    password: 'hashed',
    firstName: 'Test',
    lastName: 'User',
    role: 'USER' as const,
    isActive: true,
    refreshToken: 'rtoken',
    fcmToken: null,
    otpHash: null,
    otpExpiresAt: null,
    passwordResetToken: null,
    passwordResetExpires: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    repository = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      findByPhone: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: repository },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  /* ─────────────── create ─────────────── */
  describe('create', () => {
    it('should create a user and return it', async () => {
      repository.create!.mockResolvedValue(mockUser);
      const result = await service.create({
        email: 'test@example.com',
        password: 'hashed',
      });
      expect(repository.create).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });
  });

  /* ─────────────── findByEmail ─────────────── */
  describe('findByEmail', () => {
    it('should return a user if found', async () => {
      repository.findByEmail!.mockResolvedValue(mockUser);
      const result = await service.findByEmail('test@example.com');
      expect(result).toEqual(mockUser);
    });

    it('should return null if not found', async () => {
      repository.findByEmail!.mockResolvedValue(null);
      const result = await service.findByEmail('missing@example.com');
      expect(result).toBeNull();
    });
  });

  /* ─────────────── findByPhone ─────────────── */
  describe('findByPhone', () => {
    it('should return a user if found by phone', async () => {
      repository.findByPhone!.mockResolvedValue(mockUser);
      const result = await service.findByPhone('+201234567890');
      expect(result).toEqual(mockUser);
    });

    it('should return null if phone not found', async () => {
      repository.findByPhone!.mockResolvedValue(null);
      const result = await service.findByPhone('+999999999999');
      expect(result).toBeNull();
    });
  });

  /* ─────────────── findById ─────────────── */
  describe('findById', () => {
    it('should return a user if found', async () => {
      repository.findById!.mockResolvedValue(mockUser);
      const result = await service.findById('1');
      expect(result).toEqual(mockUser);
    });

    it('should return null if not found', async () => {
      repository.findById!.mockResolvedValue(null);
      const result = await service.findById('999');
      expect(result).toBeNull();
    });
  });

  /* ─────────────── findAll ─────────────── */
  describe('findAll', () => {
    it('should return paginated users without sensitive fields', async () => {
      repository.findAll!.mockResolvedValue([[mockUser], 1]);
      const result = await service.findAll({ page: 1, limit: 10 });
      expect(result.meta.total).toBe(1);
      expect(result.data[0].password).toBeUndefined();
      expect(result.data[0].refreshToken).toBeUndefined();
      expect(result.data[0].email).toBe('test@example.com');
    });

    it('should apply sorting defaults', async () => {
      repository.findAll!.mockResolvedValue([[mockUser], 1]);
      await service.findAll({});
      expect(repository.findAll).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should apply custom pagination and sorting', async () => {
      repository.findAll!.mockResolvedValue([[mockUser], 50]);
      await service.findAll({
        page: 3,
        limit: 20,
        sortBy: 'email',
        sortOrder: 'asc',
      });
      expect(repository.findAll).toHaveBeenCalledWith({
        skip: 40,
        take: 20,
        orderBy: { email: 'asc' },
      });
    });
  });

  /* ─────────────── update ─────────────── */
  describe('update', () => {
    it('should update and return user without sensitive fields', async () => {
      repository.update!.mockResolvedValue(mockUser);
      const result = await service.update('1', { firstName: 'Updated' });
      expect(result.password).toBeUndefined();
      expect(result.refreshToken).toBeUndefined();
      expect(repository.update).toHaveBeenCalledWith('1', {
        firstName: 'Updated',
      });
    });
  });

  /* ─────────────── remove ─────────────── */
  describe('remove', () => {
    it('should delete user and return confirmation', async () => {
      repository.remove!.mockResolvedValue(mockUser);
      const result = await service.remove('1');
      expect(result).toEqual({ message: 'User deleted successfully' });
      expect(repository.remove).toHaveBeenCalledWith('1');
    });
  });

  /* ─────────────── updateFcmToken ─────────────── */
  describe('updateFcmToken', () => {
    it('should update FCM token', async () => {
      repository.update!.mockResolvedValue(mockUser);
      await service.updateFcmToken('1', 'new-fcm-token');
      expect(repository.update).toHaveBeenCalledWith('1', {
        fcmToken: 'new-fcm-token',
      });
    });
  });
});
