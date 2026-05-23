import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class AuthRepository {
  constructor(private prisma: PrismaService) {}

  async findByResetToken(token: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { gt: new Date() },
      },
    });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { phone } });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async create(data: {
    phone: string;
    otpHash: string;
    otpExpiresAt: Date;
  }): Promise<User> {
    return this.prisma.user.create({
      data: {
        phone: data.phone,
        otpHash: data.otpHash,
        otpExpiresAt: data.otpExpiresAt,
        isActive: false,
      },
    });
  }

  async updateRefreshToken(
    id: string,
    refreshToken: string | null,
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { refreshToken },
    });
  }

  async updatePassword(id: string, password: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: {
        password,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });
  }

  async setPasswordResetToken(
    id: string,
    token: string,
    expires: Date,
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { passwordResetToken: token, passwordResetExpires: expires },
    });
  }

  async setOtp(id: string, otpHash: string, otpExpiresAt: Date): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { otpHash, otpExpiresAt },
    });
  }

  async clearOtp(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { otpHash: null, otpExpiresAt: null },
    });
  }

  async activateUser(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { isActive: true },
    });
  }
}
