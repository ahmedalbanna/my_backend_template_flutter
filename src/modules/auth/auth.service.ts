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
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { EmailService } from '../../shared/email/email.service';

import { AuthRepository } from './auth.repository';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
    private authRepository: AuthRepository,
  ) { }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: (this.configService.get<string>('jwt.expiresIn') || '15m') as any,
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: (this.configService.get<string>('jwt.refreshExpiresIn') || '7d') as any,
    });
    return { accessToken, refreshToken };
  }

  private async hashToken(token: string): Promise<string> {
    return bcrypt.hash(token, 10);
  }

  // ─── Validate (used by LocalStrategy) ───────────────────────────────────────

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  // ─── Register ────────────────────────────────────────────────────────────────

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

    const tokens = this.generateTokens(user.id, user.email);
    const hashedRefreshToken = await this.hashToken(tokens.refreshToken);
    await this.authRepository.updateRefreshToken(user.id, hashedRefreshToken);

    await this.emailService.sendWelcome(user.email, user.firstName ?? 'User');

    const { password, refreshToken, ...result } = user;
    return { ...tokens, user: result };
  }

  // ─── Login ───────────────────────────────────────────────────────────────────

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.isActive === false) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const tokens = this.generateTokens(user.id, user.email);
    const hashedRefreshToken = await this.hashToken(tokens.refreshToken);
    await this.authRepository.updateRefreshToken(user.id, hashedRefreshToken);

    return { ...tokens, user };
  }

  // ─── Refresh Token ───────────────────────────────────────────────────────────

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

    const tokens = this.generateTokens(user.id, user.email);
    const hashedRefreshToken = await this.hashToken(tokens.refreshToken);
    await this.authRepository.updateRefreshToken(user.id, hashedRefreshToken);

    return tokens;
  }

  // ─── Logout ──────────────────────────────────────────────────────────────────

  async logout(userId: string): Promise<{ message: string }> {
    await this.authRepository.updateRefreshToken(userId, null);
    return { message: 'Logged out successfully' };
  }

  // ─── Forgot Password ─────────────────────────────────────────────────────────

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(dto.email);
    // Always return success to avoid email enumeration
    if (!user) {
      return { message: 'If the email exists, a reset link has been sent.' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.authRepository.setPasswordResetToken(user.id, resetToken, expires);
    await this.emailService.sendPasswordReset(
      user.email,
      user.firstName ?? 'User',
      resetToken,
    );

    return { message: 'If the email exists, a reset link has been sent.' };
  }

  // ─── Reset Password ───────────────────────────────────────────────────────────

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const user = await this.authRepository.findByResetToken(dto.token);
    if (!user) {
      throw new NotFoundException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.authRepository.updatePassword(user.id, hashedPassword);
    // Invalidate all tokens
    await this.authRepository.updateRefreshToken(user.id, null);

    return { message: 'Password reset successfully' };
  }
}
