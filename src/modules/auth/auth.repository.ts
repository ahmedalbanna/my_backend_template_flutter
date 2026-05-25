import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

@Injectable()
export class AuthRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * Find a user by a SHA-256 hashed reset token (with expiry check).
   * Uses the `passwordResetExpires` index for efficient filtering.
   */
  async findByResetToken(tokenHash: string): Promise<{ id: string } | null> {
    return this.prisma.user.findFirst({
      where: {
        passwordResetToken: tokenHash,
        passwordResetExpires: { gt: new Date() },
      },
      select: { id: true },
    });
  }

  /**
   * Updates the refresh token for a user.
   * Returns minimal data — only the id is selected.
   */
  async updateRefreshToken(
    id: string,
    refreshToken: string | null,
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { refreshToken },
      select: { id: true },
    });
  }

  /**
   * Updates the password and clears reset tokens.
   * Returns minimal data — only the id is selected.
   */
  async updatePassword(id: string, password: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: {
        password,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
      select: { id: true },
    });
  }

  /**
   * Stores a SHA-256 hashed password reset token with an expiry date.
   * Returns minimal data — only the id is selected.
   */
  async setPasswordResetToken(
    id: string,
    tokenHash: string,
    expires: Date,
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { passwordResetToken: tokenHash, passwordResetExpires: expires },
      select: { id: true },
    });
  }

  /**
   * Stores a hashed OTP with its expiry date.
   * Returns minimal data — only the id is selected.
   */
  async setOtp(id: string, otpHash: string, otpExpiresAt: Date): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { otpHash, otpExpiresAt },
      select: { id: true },
    });
  }

  /**
   * Clears the stored OTP hash and expiry after successful verification.
   * Returns minimal data — only the id is selected.
   */
  async clearOtp(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { otpHash: null, otpExpiresAt: null },
      select: { id: true },
    });
  }

  /**
   * Activates a user account after successful OTP verification.
   * Returns minimal data — only the id is selected.
   */
  async activateUser(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { isActive: true },
      select: { id: true },
    });
  }

  // ── Email Verification ──────────────────────────────────────

  async findByEmailVerificationToken(
    tokenHash: string,
  ): Promise<{ id: string } | null> {
    return this.prisma.user.findFirst({
      where: {
        emailVerificationToken: tokenHash,
        emailVerificationExpires: { gt: new Date() },
      },
      select: { id: true },
    });
  }

  async setEmailVerificationToken(
    id: string,
    tokenHash: string,
    expires: Date,
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: {
        emailVerificationToken: tokenHash,
        emailVerificationExpires: expires,
      },
      select: { id: true },
    });
  }

  async verifyEmail(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: {
        emailVerified: new Date(),
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
      select: { id: true },
    });
  }

  // ── Account Lockout ─────────────────────────────────────────

  async incrementLoginAttempts(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { loginAttempts: { increment: 1 } },
      select: { id: true },
    });
  }

  async lockAccount(id: string, until: Date): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { loginAttempts: 0, lockUntil: until },
      select: { id: true },
    });
  }

  async resetLoginAttempts(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { loginAttempts: 0, lockUntil: null },
      select: { id: true },
    });
  }
}
