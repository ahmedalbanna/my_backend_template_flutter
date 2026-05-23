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
import { AuthRepository } from './auth.repository';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private authRepository: AuthRepository,
  ) {}

  private generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };
    const expiresIn = (this.configService.get<string>('jwt.expiresIn') ||
      '15m') as `${number}h` | `${number}m` | `${number}s`;
    const refreshExpiresIn = (this.configService.get<string>(
      'jwt.refreshExpiresIn',
    ) || '7d') as `${number}h` | `${number}m` | `${number}s` | `${number}d`;

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn,
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: refreshExpiresIn,
    });
    return { accessToken, refreshToken };
  }

  private async hashToken(token: string): Promise<string> {
    return bcrypt.hash(token, 10);
  }

  async validateUser(email: string, pass: string) {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(pass, user.password))) {
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

    const tokens = this.generateTokens(user.id, user.email);
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

    const tokens = this.generateTokens(user.id, user.email);
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

    const tokens = this.generateTokens(user.id, user.email);
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
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await this.authRepository.setPasswordResetToken(
      user.id,
      resetToken,
      expires,
    );

    return { message: 'If the email exists, a reset link has been sent.' };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const user = await this.authRepository.findByResetToken(dto.token);
    if (!user) {
      throw new NotFoundException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.authRepository.updatePassword(user.id, hashedPassword);
    await this.authRepository.updateRefreshToken(user.id, null);

    return { message: 'Password reset successfully' };
  }
}
