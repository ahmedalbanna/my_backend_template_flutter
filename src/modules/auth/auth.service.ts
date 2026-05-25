import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { EmailService } from '../../shared/email/email.service';
import { SmsService } from '../../shared/sms/sms.service';
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
import { SendVerificationEmailDto } from './dto/send-verification-email.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { AuthRepository } from './auth.repository';

const OTP_EXPIRY_MINUTES = 5;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private authRepository: AuthRepository,
    private emailService: EmailService,
    private smsService: SmsService,
  ) {}

  private generateTokens(
    userId: string,
    role: string,
    email?: string,
    phone?: string,
  ) {
    const payload: Record<string, unknown> = { sub: userId, role };
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

  private async findUserByIdentifier(email?: string, phone?: string) {
    if (email) return this.usersService.findByEmail(email);
    if (phone) return this.usersService.findByPhone(phone);
    return null;
  }

  private assertIdentifierProvided(email?: string, phone?: string): void {
    if (!email && !phone) {
      throw new BadRequestException(
        'At least one of email or phone must be provided',
      );
    }
  }

  private excludeSensitive(
    user: Record<string, unknown>,
  ): Record<string, unknown> {
    const {
      password: _pw,
      refreshToken: _rt,
      otpHash: _oh,
      otpExpiresAt: _oe,
      passwordResetToken: _prt,
      passwordResetExpires: _pre,
      emailVerificationToken: _evt,
      emailVerificationExpires: _eve,
      loginAttempts: _la,
      lockUntil: _lu,
      ...rest
    } = user;
    void [
      _pw,
      _rt,
      _oh,
      _oe,
      _prt,
      _pre,
      _evt,
      _eve,
      _la,
      _lu,
    ];
    return rest;
  }

  async register(registerDto: RegisterDto) {
    const { email, phone, password, firstName, lastName } = registerDto;
    this.assertIdentifierProvided(email, phone);

    if (email) {
      const existing = await this.usersService.findByEmail(email);
      if (existing) {
        throw new BadRequestException('Email already in use');
      }
    }

    if (phone && password) {
      const existingPhone = await this.usersService.findByPhone(phone);
      if (existingPhone?.isActive) {
        throw new BadRequestException('Phone number already in use');
      }
    }

    const hashedPassword = password
      ? await bcrypt.hash(password, 10)
      : undefined;

    // ── Phone-based registration → require OTP ──
    if (phone) {
      const { otp, hash } = this.generateOtp();
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

      const user = await this.usersService.create({
        ...(email && { email }),
        phone,
        ...(hashedPassword && { password: hashedPassword }),
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        otpHash: hash,
        otpExpiresAt: expiresAt,
        isActive: false,
      });

      await this.smsService.sendOtp(phone, otp);

      const message = 'Account created. Please verify your phone via OTP.';
      const isDev = this.configService.get<string>('NODE_ENV') !== 'production';
      const result: { message: string; otp?: string } = { message };
      if (isDev) result.otp = otp;
      return result;
    }

    // ── Email+password registration → require email verification ──
    const user = await this.usersService.create({
      email,
      password: hashedPassword!,
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
    });

    const skipVerification = this.configService.get<boolean>(
      'auth.skipEmailVerification',
    );

    if (skipVerification) {
      const tokens = this.generateTokens(
        user.id,
        user.role,
        user.email ?? undefined,
        user.phone ?? undefined,
      );
      const hashedRefreshToken = await this.hashToken(tokens.refreshToken);
      await this.authRepository.updateRefreshToken(
        user.id,
        hashedRefreshToken,
      );
      return {
        ...tokens,
        user: this.excludeSensitive(user),
      };
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.authRepository.setEmailVerificationToken(
      user.id,
      hashedToken,
      expires,
    );

    await this.emailService.sendVerificationEmail(
      user.email!,
      verificationToken,
    );

    return {
      message:
        'Account created. Please check your email to verify your account.',
    };
  }

  async login(loginDto: LoginDto) {
    const { email, phone, password } = loginDto;
    this.assertIdentifierProvided(email, phone);

    const user = await this.findUserByIdentifier(email, phone);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // ── Account lockout check ──
    const maxAttempts = this.configService.get<number>(
      'auth.maxLoginAttempts',
    )!;
    const lockMinutes = this.configService.get<number>(
      'auth.accountLockMinutes',
    )!;

    if (user.lockUntil && new Date() < user.lockUntil) {
      const remaining = Math.ceil(
        (user.lockUntil.getTime() - Date.now()) / 60000,
      );
      throw new UnauthorizedException(
        `Account locked. Try again in ${remaining} minute(s).`,
      );
    }

    if (!user.password) {
      throw new UnauthorizedException(
        'This account uses OTP authentication. Please sign in with a verification code.',
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      const newAttempts = user.loginAttempts + 1;
      await this.authRepository.incrementLoginAttempts(user.id);

      if (newAttempts >= maxAttempts) {
        const until = new Date(
          Date.now() + lockMinutes * 60 * 1000,
        );
        await this.authRepository.lockAccount(user.id, until);
        throw new UnauthorizedException(
          `Account locked due to too many failed attempts. Try again in ${lockMinutes} minute(s).`,
        );
      }

      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException(
        'Account not activated. Please verify your phone via OTP.',
      );
    }

    // ── Check email verification for email-based accounts ──
    if (user.email && !user.emailVerified) {
      const skipVerification = this.configService.get<boolean>(
        'auth.skipEmailVerification',
      );
      if (!skipVerification) {
        throw new UnauthorizedException(
          'Please verify your email before signing in. Check your inbox for the verification link.',
        );
      }
    }

    await this.authRepository.resetLoginAttempts(user.id);

    const tokens = this.generateTokens(
      user.id,
      user.role,
      user.email ?? undefined,
      user.phone ?? undefined,
    );
    const hashedRefreshToken = await this.hashToken(tokens.refreshToken);
    await this.authRepository.updateRefreshToken(user.id, hashedRefreshToken);

    return {
      ...tokens,
      user: this.excludeSensitive(user),
    };
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

    const tokens = this.generateTokens(
      user.id,
      user.role,
      user.email ?? undefined,
      user.phone ?? undefined,
    );
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
    const hashedResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await this.authRepository.setPasswordResetToken(
      user.id,
      hashedResetToken,
      expires,
    );

    await this.emailService.sendPasswordResetEmail(
      user.email!,
      resetToken,
    );

    return { message: 'If the email exists, a reset link has been sent.' };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const tokenHash = crypto
      .createHash('sha256')
      .update(dto.token)
      .digest('hex');

    const user = await this.authRepository.findByResetToken(tokenHash);

    if (!user) {
      throw new NotFoundException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.authRepository.updatePassword(user.id, hashedPassword);
    await this.authRepository.updateRefreshToken(user.id, null);

    return { message: 'Password reset successfully' };
  }

  // ── Email Verification ─────────────────────────────────────

  async sendVerificationEmail(
    dto: SendVerificationEmailDto,
  ): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      return { message: 'If the email exists, a verification link has been sent.' };
    }

    if (user.emailVerified) {
      return { message: 'Email is already verified.' };
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.authRepository.setEmailVerificationToken(
      user.id,
      hashedToken,
      expires,
    );

    await this.emailService.sendVerificationEmail(
      user.email!,
      verificationToken,
    );

    return {
      message: 'If the email exists, a verification link has been sent.',
    };
  }

  async verifyEmail(
    dto: VerifyEmailDto,
  ): Promise<{ message: string }> {
    const tokenHash = crypto
      .createHash('sha256')
      .update(dto.token)
      .digest('hex');

    const user = await this.authRepository.findByEmailVerificationToken(
      tokenHash,
    );

    if (!user) {
      throw new NotFoundException(
        'Invalid or expired email verification token',
      );
    }

    await this.authRepository.verifyEmail(user.id);

    return { message: 'Email verified successfully. You can now sign in.' };
  }

  // ── OTP ─────────────────────────────────────────────────────

  private generateOtp(): { otp: string; hash: string } {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const salt = this.configService.get<string>('otp.hashSecret')!;
    const hash = crypto.createHmac('sha256', salt).update(otp).digest('hex');
    return { otp, hash };
  }

  async sendOtp(dto: SendOtpDto): Promise<{ message: string; otp?: string }> {
    let user = await this.usersService.findByPhone(dto.phone);

    const { otp, hash } = this.generateOtp();
    const isDev = this.configService.get<string>('NODE_ENV') !== 'production';
    if (isDev) {
      this.logger.log(`📱 OTP for ${dto.phone}: ${otp}`);
    }
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

    await this.smsService.sendOtp(dto.phone, otp);

    if (isDev) {
      return { message: 'OTP sent successfully (simulated)', otp };
    }

    return { message: 'OTP sent successfully' };
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

    const salt = this.configService.get<string>('otp.hashSecret')!;
    const hash = crypto
      .createHmac('sha256', salt)
      .update(dto.otp)
      .digest('hex');
    const isMatch =
      Buffer.from(hash).length === Buffer.from(user.otpHash).length &&
      crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(user.otpHash));
    if (!isMatch) {
      throw new BadRequestException('Invalid OTP code');
    }

    if (!user.isActive) {
      await this.authRepository.activateUser(user.id);
    }

    await this.authRepository.clearOtp(user.id);

    const tokens = this.generateTokens(
      user.id,
      user.role,
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
