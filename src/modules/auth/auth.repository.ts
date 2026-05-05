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

  async updateRefreshToken(id: string, refreshToken: string | null): Promise<void> {
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
}
