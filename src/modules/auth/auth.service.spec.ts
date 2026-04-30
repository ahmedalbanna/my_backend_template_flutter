import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../../shared/email/email.service';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<Partial<UsersService>>;
  let jwtService: jest.Mocked<Partial<JwtService>>;
  let configService: jest.Mocked<Partial<ConfigService>>;
  let emailService: jest.Mocked<Partial<EmailService>>;

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      updateRefreshToken: jest.fn(),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mocked_token'),
    };

    configService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key.includes('Secret')) return 'secret';
        if (key.includes('ExpiresIn')) return '1h';
        return null;
      }),
    };

    emailService = {
      sendWelcome: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
        { provide: EmailService, useValue: emailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should throw BadRequestException if email already exists', async () => {
      usersService.findByEmail!.mockResolvedValueOnce({ id: '1' } as any);

      await expect(
        service.register({ email: 'test@example.com', password: 'password123' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully register a user and return tokens', async () => {
      usersService.findByEmail!.mockResolvedValueOnce(null);
      
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        password: 'hashedpassword',
        refreshToken: 'hashedrefresh',
      };
      
      usersService.create!.mockResolvedValueOnce(mockUser as any);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');

      const result = await service.register({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
      });

      expect(usersService.create).toHaveBeenCalled();
      expect(emailService.sendWelcome).toHaveBeenCalledWith('test@example.com', 'Test');
      expect(result.accessToken).toBe('mocked_token');
      expect(result.refreshToken).toBe('mocked_token');
      expect(result.user).toBeDefined();
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user does not exist', async () => {
      usersService.findByEmail!.mockResolvedValueOnce(null);

      await expect(
        service.login({ email: 'test@example.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      usersService.findByEmail!.mockResolvedValueOnce({ password: 'hashedpassword' } as any);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      await expect(
        service.login({ email: 'test@example.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return tokens and user if login is successful', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        password: 'hashedpassword',
        isActive: true,
      };

      usersService.findByEmail!.mockResolvedValueOnce(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('hashedrefresh');

      const result = await service.login({ email: 'test@example.com', password: 'password123' });

      expect(jwtService.sign).toHaveBeenCalledTimes(2);
      expect(usersService.updateRefreshToken).toHaveBeenCalledWith('1', 'hashedrefresh');
      expect(result.accessToken).toBe('mocked_token');
      expect(result.refreshToken).toBe('mocked_token');
      expect(result.user).toBeDefined();
      expect(result.user.password).toBeUndefined();
    });
  });
});
