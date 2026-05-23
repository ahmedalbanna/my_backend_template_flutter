import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import ms from 'ms';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { AuthRepository } from './auth.repository';

const OTP_EXPIRY_MINUTES = 5;

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private authRepository: AuthRepository,
  ) {}

  private generateTokens(userId: string, email?: string, phone?: string) {
    const payload: Record<string, unknown> = { sub: userId };
    if (email) payload.email = email;
    if (phone) payload.phone = phone;

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn:
        ms(
          (this.configService.get<string>('jwt.expiresIn') ||
            '15m') as unknown as ms.StringValue,
        ) / 1000,
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn:
        ms(
          (this.configService.get<string>('jwt.refreshExpiresIn') ||
            '7d') as unknown as ms.StringValue,
        ) / 1000,
    });
    return { accessToken, refreshToken };
  }

  private async hashToken(token: string): Promise<string> {
    return bcrypt.hash(token, 10);
  }

  async validateUser(email: string, pass: string) {
    const user = await this.usersService.findByEmail(email);
    if (user?.password && (await bcrypt.compare(pass, user.password))) {
      const { password: _password, ...result } = user;
      void _password;
      return result;
    }
    return null;
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new BadRequestException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
    });

    const tokens = this.generateTokens(user.id, user.email ?? undefined);
    const hashedRefreshToken = await this.hashToken(tokens.refreshToken);
    await this.authRepository.updateRefreshToken(user.id, hashedRefreshToken);

    const {
      password: _password,
      refreshToken: _refreshToken,
      ...result
    } = user;
    void [_password, _refreshToken];
    return { ...tokens, user: result };
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.isActive === false) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const tokens = this.generateTokens(user.id, user.email ?? undefined);
    const hashedRefreshToken = await this.hashToken(tokens.refreshToken);
    await this.authRepository.updateRefreshToken(user.id, hashedRefreshToken);

    return { ...tokens, user };
  }

  async refreshTokens(dto: RefreshTokenDto) {
    let payload: { sub: string; email: string };
    try {
      payload = this.jwtService.verify(dto.refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Access denied');
    }

    const refreshTokenMatches = await bcrypt.compare(
      dto.refreshToken,
      user.refreshToken,
    );
    if (!refreshTokenMatches) {
      throw new UnauthorizedException('Refresh token mismatch');
    }

    const tokens = this.generateTokens(user.id, user.email ?? undefined);
    const hashedRefreshToken = await this.hashToken(tokens.refreshToken);
    await this.authRepository.updateRefreshToken(user.id, hashedRefreshToken);

    return tokens;
  }

  async logout(userId: string): Promise<{ message: string }> {
    await this.authRepository.updateRefreshToken(userId, null);
    return { message: 'Logged out successfully' };
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      return { message: 'If the email exists, a reset link has been sent.' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedResetToken = await bcrypt.hash(resetToken, 10);
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await this.authRepository.setPasswordResetToken(
      user.id,
      hashedResetToken,
      expires,
    );

    return { message: 'If the email exists, a reset link has been sent.' };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const usersWithTokens =
      await this.authRepository.findUsersWithValidResetTokens();
    let matchedUser: { id: string } | null = null;

    for (const u of usersWithTokens) {
      if (
        u.passwordResetToken &&
        (await bcrypt.compare(dto.token, u.passwordResetToken))
      ) {
        matchedUser = u;
        break;
      }
    }

    if (!matchedUser) {
      throw new NotFoundException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.authRepository.updatePassword(matchedUser.id, hashedPassword);
    await this.authRepository.updateRefreshToken(matchedUser.id, null);

    return { message: 'Password reset successfully' };
  }

  private generateOtp(): { otp: string; hash: string } {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hash = crypto.createHash('sha256').update(otp).digest('hex');
    return { otp, hash };
  }

  async sendOtp(dto: SendOtpDto): Promise<{ message: string }> {
    let user = await this.usersService.findByPhone(dto.phone);

    const { otp, hash } = this.generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    if (user) {
      await this.authRepository.setOtp(user.id, hash, expiresAt);
    } else {
      user = await this.usersService.create({
        phone: dto.phone,
        otpHash: hash,
        otpExpiresAt: expiresAt,
        isActive: false,
      });
    }

    void otp;

    return {
      message: 'OTP sent successfully (simulated)',
    };
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<{
    accessToken: string;
    refreshToken: string;
    user: Record<string, unknown>;
  }> {
    const user = await this.usersService.findByPhone(dto.phone);
    if (!user) {
      throw new NotFoundException('No account found with this phone number');
    }

    if (!user.otpHash || !user.otpExpiresAt) {
      throw new BadRequestException('No OTP requested for this phone');
    }

    if (new Date() > user.otpExpiresAt) {
      throw new BadRequestException('OTP has expired');
    }

    const hash = crypto.createHash('sha256').update(dto.otp).digest('hex');
    if (hash !== user.otpHash) {
      throw new BadRequestException('Invalid OTP code');
    }

    if (!user.isActive) {
      await this.authRepository.activateUser(user.id);
    }

    await this.authRepository.clearOtp(user.id);

    const tokens = this.generateTokens(
      user.id,
      user.email ?? undefined,
      user.phone ?? undefined,
    );
    const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 10);
    await this.authRepository.updateRefreshToken(user.id, hashedRefreshToken);

    const userData: Record<string, unknown> = {
      id: user.id,
      phone: user.phone,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: true,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return { ...tokens, user: userData };
  }
}
