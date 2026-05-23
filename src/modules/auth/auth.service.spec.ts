import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { AuthRepository } from './auth.repository';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

jest.mock('bcrypt');
jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomBytes: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<Partial<UsersService>>;
  let jwtService: jest.Mocked<Partial<JwtService>>;
  let configService: jest.Mocked<Partial<ConfigService>>;
  let authRepository: jest.Mocked<Partial<AuthRepository>>;

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      findByPhone: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mocked_token'),
      verify: jest.fn(),
    };

    configService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'otp.hashSecret') return 'test-otp-salt-value-for-hmac';
        if (key.includes('Secret')) return 'secret';
        if (key.includes('ExpiresIn')) return '1h';
        return null;
      }),
    };

    authRepository = {
      findByResetToken: jest.fn(),
      updateRefreshToken: jest.fn(),
      updatePassword: jest.fn(),
      setPasswordResetToken: jest.fn(),
      setOtp: jest.fn(),
      clearOtp: jest.fn(),
      activateUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
        { provide: AuthRepository, useValue: authRepository },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  /* ─────────────── register ─────────────── */
  describe('register', () => {
    it('should throw BadRequestException if email already exists', async () => {
      usersService.findByEmail!.mockResolvedValueOnce({ id: '1' } as any);
      await expect(
        service.register({
          email: 'test@example.com',
          password: 'password123',
        }),
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
      expect(result.accessToken).toBe('mocked_token');
      expect(result.refreshToken).toBe('mocked_token');
      expect(result.user).toBeDefined();
    });
  });

  /* ─────────────── login ─────────────── */
  describe('login', () => {
    it('should throw UnauthorizedException if user does not exist', async () => {
      usersService.findByEmail!.mockResolvedValueOnce(null);
      await expect(
        service.login({ email: 'test@example.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      usersService.findByEmail!.mockResolvedValueOnce({
        password: 'hashedpassword',
      } as any);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);
      await expect(
        service.login({ email: 'test@example.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if account is deactivated', async () => {
      usersService.findByEmail!.mockResolvedValueOnce({
        id: '1',
        email: 'test@example.com',
        password: 'hashedpassword',
        isActive: false,
      } as any);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
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
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedrefresh');

      const result = await service.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(jwtService.sign).toHaveBeenCalledTimes(2);
      expect(authRepository.updateRefreshToken).toHaveBeenCalledWith(
        '1',
        'hashedrefresh',
      );
      expect(result.accessToken).toBe('mocked_token');
      expect(result.refreshToken).toBe('mocked_token');
      expect(result.user).toBeDefined();
      expect(result.user.password).toBeUndefined();
    });
  });

  /* ─────────────── refreshTokens ─────────────── */
  describe('refreshTokens', () => {
    const dto = { refreshToken: 'some-token' };

    it('should throw UnauthorizedException if token verification fails', async () => {
      jwtService.verify!.mockImplementationOnce(() => {
        throw new Error('jwt expired');
      });
      await expect(service.refreshTokens(dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if user not found', async () => {
      jwtService.verify!.mockReturnValueOnce({ sub: '1', email: 'a@b.com' });
      usersService.findById!.mockResolvedValueOnce(null);
      await expect(service.refreshTokens(dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if stored refresh token is missing', async () => {
      jwtService.verify!.mockReturnValueOnce({ sub: '1', email: 'a@b.com' });
      usersService.findById!.mockResolvedValueOnce({
        id: '1',
        refreshToken: null,
      } as any);
      await expect(service.refreshTokens(dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if refresh token mismatch', async () => {
      jwtService.verify!.mockReturnValueOnce({ sub: '1', email: 'a@b.com' });
      usersService.findById!.mockResolvedValueOnce({
        id: '1',
        refreshToken: 'stored-hash',
      } as any);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);
      await expect(service.refreshTokens(dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should return new tokens on success', async () => {
      jwtService.verify!.mockReturnValueOnce({ sub: '1', email: 'a@b.com' });
      usersService.findById!.mockResolvedValueOnce({
        id: '1',
        email: 'a@b.com',
        refreshToken: 'stored-hash',
      } as any);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-refresh-hash');

      const result = await service.refreshTokens(dto);

      expect(jwtService.sign).toHaveBeenCalledTimes(2);
      expect(authRepository.updateRefreshToken).toHaveBeenCalledWith(
        '1',
        'new-refresh-hash',
      );
      expect(result.accessToken).toBe('mocked_token');
      expect(result.refreshToken).toBe('mocked_token');
    });
  });

  /* ─────────────── logout ─────────────── */
  describe('logout', () => {
    it('should clear refresh token and return message', async () => {
      const result = await service.logout('user-1');
      expect(authRepository.updateRefreshToken).toHaveBeenCalledWith(
        'user-1',
        null,
      );
      expect(result.message).toBe('Logged out successfully');
    });
  });

  /* ─────────────── forgotPassword ─────────────── */
  describe('forgotPassword', () => {
    it('should return same message whether email exists or not', async () => {
      usersService.findByEmail!.mockResolvedValueOnce(null);
      const result = await service.forgotPassword({
        email: 'missing@example.com',
      });
      expect(result.message).toBe(
        'If the email exists, a reset link has been sent.',
      );
    });

    it('should set reset token when user exists', async () => {
      const mockUser = { id: '1', email: 'a@b.com' };
      usersService.findByEmail!.mockResolvedValueOnce(mockUser as any);
      // crypto.randomBytes is mocked at the top of the file
      (crypto.randomBytes as jest.Mock).mockReturnValue(
        Buffer.from('a'.repeat(32)),
      );
      // Compute what SHA-256(resetToken.toString('hex')) will be
      const hexToken = Buffer.from('a'.repeat(32)).toString('hex');
      const expectedHash = crypto
        .createHash('sha256')
        .update(hexToken)
        .digest('hex');

      const result = await service.forgotPassword({
        email: 'a@b.com',
      });

      expect(authRepository.setPasswordResetToken).toHaveBeenCalledWith(
        '1',
        expectedHash,
        expect.any(Date),
      );
      expect(result.message).toBe(
        'If the email exists, a reset link has been sent.',
      );
    });
  });

  /* ─────────────── resetPassword ─────────────── */
  describe('resetPassword', () => {
    it('should throw NotFoundException if token lookup returns nothing', async () => {
      authRepository.findByResetToken!.mockResolvedValueOnce(null);
      await expect(
        service.resetPassword({ token: 'bad', newPassword: 'newPass123' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if no user matches the token hash', async () => {
      authRepository.findByResetToken!.mockResolvedValueOnce(null);

      await expect(
        service.resetPassword({ token: 'bad', newPassword: 'newPass123' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update password and clear refresh tokens on success', async () => {
      authRepository.findByResetToken!.mockResolvedValueOnce({
        id: '1',
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-pw');

      const result = await service.resetPassword({
        token: 'good-token',
        newPassword: 'newPass123',
      });

      expect(authRepository.updatePassword).toHaveBeenCalledWith(
        '1',
        'new-hashed-pw',
      );
      expect(authRepository.updateRefreshToken).toHaveBeenCalledWith('1', null);
      expect(result.message).toBe('Password reset successfully');
    });
  });

  /* ─────────────── sendOtp ─────────────── */
  describe('sendOtp', () => {
    it('should create a new user when phone does not exist', async () => {
      usersService.findByPhone!.mockResolvedValueOnce(null);
      usersService.create!.mockResolvedValueOnce({
        id: 'new-id',
        phone: '+201234567890',
      } as any);

      const result = await service.sendOtp({ phone: '+201234567890' });

      expect(usersService.create).toHaveBeenCalledWith({
        phone: '+201234567890',
        otpHash: expect.any(String),
        otpExpiresAt: expect.any(Date),
        isActive: false,
      });
      expect(result.message).toBe('OTP sent successfully (simulated)');
    });

    it('should update OTP for existing user', async () => {
      usersService.findByPhone!.mockResolvedValueOnce({
        id: 'existing-id',
        phone: '+201234567890',
      } as any);

      const result = await service.sendOtp({ phone: '+201234567890' });

      expect(authRepository.setOtp).toHaveBeenCalledWith(
        'existing-id',
        expect.any(String),
        expect.any(Date),
      );
      expect(usersService.create).not.toHaveBeenCalled();
      expect(result.message).toBe('OTP sent successfully (simulated)');
    });
  });

  /* ─────────────── verifyOtp ─────────────── */
  describe('verifyOtp', () => {
    const validOtp = '123456';
    const otpSalt = 'test-otp-salt-value-for-hmac';
    const validHash = crypto
      .createHmac('sha256', otpSalt)
      .update(validOtp)
      .digest('hex');

    it('should throw NotFoundException if phone does not exist', async () => {
      usersService.findByPhone!.mockResolvedValueOnce(null);
      await expect(
        service.verifyOtp({ phone: '+201234567890', otp: validOtp }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if no OTP was requested', async () => {
      usersService.findByPhone!.mockResolvedValueOnce({
        id: '1',
        otpHash: null,
        otpExpiresAt: null,
      } as any);
      await expect(
        service.verifyOtp({ phone: '+201234567890', otp: validOtp }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if OTP has expired', async () => {
      usersService.findByPhone!.mockResolvedValueOnce({
        id: '1',
        otpHash: validHash,
        otpExpiresAt: new Date(Date.now() - 1000),
      } as any);
      await expect(
        service.verifyOtp({ phone: '+201234567890', otp: validOtp }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if OTP is wrong', async () => {
      usersService.findByPhone!.mockResolvedValueOnce({
        id: '1',
        otpHash: validHash,
        otpExpiresAt: new Date(Date.now() + 60000),
      } as any);
      await expect(
        service.verifyOtp({ phone: '+201234567890', otp: '000000' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should activate a new user and return tokens', async () => {
      const mockUser = {
        id: '1',
        phone: '+201234567890',
        email: null,
        firstName: null,
        lastName: null,
        role: 'USER',
        isActive: false,
        otpHash: validHash,
        otpExpiresAt: new Date(Date.now() + 60000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      usersService.findByPhone!.mockResolvedValueOnce(mockUser as any);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-refresh');

      const result = await service.verifyOtp({
        phone: '+201234567890',
        otp: validOtp,
      });

      expect(authRepository.activateUser).toHaveBeenCalledWith('1');
      expect(authRepository.clearOtp).toHaveBeenCalledWith('1');
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
      expect(result.accessToken).toBe('mocked_token');
      expect(result.refreshToken).toBe('mocked_token');
      expect(result.user).toBeDefined();
    });

    it('should NOT re-activate an already active user', async () => {
      const mockUser = {
        id: '1',
        phone: '+201234567890',
        email: null,
        isActive: true,
        otpHash: validHash,
        otpExpiresAt: new Date(Date.now() + 60000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      usersService.findByPhone!.mockResolvedValueOnce(mockUser as any);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-refresh');

      await service.verifyOtp({ phone: '+201234567890', otp: validOtp });

      expect(authRepository.activateUser).not.toHaveBeenCalled();
      expect(authRepository.clearOtp).toHaveBeenCalledWith('1');
    });
  });
});
