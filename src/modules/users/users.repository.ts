import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { Prisma, User } from '@prisma/client';

/**
 * User object with only the truly sensitive credential fields excluded.
 * OTP hashes, reset tokens, and expiry dates are still included so that
 * admin views can see auth state without exposing login credentials.
 */
const userListSelect = {
  id: true,
  email: true,
  phone: true,
  firstName: true,
  lastName: true,
  role: true,
  isActive: true,
  fcmToken: true,
  otpHash: true,
  otpExpiresAt: true,
  passwordResetToken: true,
  passwordResetExpires: true,
  createdAt: true,
  updatedAt: true,
} as const;

/** Minimal identifier select for write operations where the caller discards the result */
const idOnlySelect = { id: true } as const;

@Injectable()
export class UsersRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { phone } });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  /**
   * Retrieves a paginated list of users with total count.
   * Uses a transaction to keep count and data consistent.
   * Sensitive fields (password, refreshToken, otpHash, etc.) are excluded.
   */
  async findAll(params: {
    skip?: number;
    take?: number;
    orderBy?: Prisma.UserOrderByWithRelationInput;
    where?: Prisma.UserWhereInput;
  }): Promise<[Pick<User, keyof typeof userListSelect>[], number]> {
    const { skip, take, orderBy, where } = params;
    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        skip,
        take,
        orderBy,
        where,
        select: userListSelect,
      }),
      this.prisma.user.count({ where }),
    ]);
    return [users, total];
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }

  /**
   * Deletes a user by ID.
   * Returns minimal data — only the id is selected since the caller
   * typically only needs to confirm the deletion happened.
   */
  async remove(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id },
      select: idOnlySelect,
    });
  }
}
