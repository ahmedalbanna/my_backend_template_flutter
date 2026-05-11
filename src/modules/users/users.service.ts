import { Injectable, Logger } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { User, Prisma } from '@prisma/client';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { AuditService } from '../../shared/audit/audit.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { FirebaseService } from '../../shared/firebase/firebase.service';


@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private usersRepository: UsersRepository,
    private auditService: AuditService,
    private prisma: PrismaService,
    private firebaseService: FirebaseService,
  ) {}


  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.usersRepository.create(data);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email);
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findById(id);
  }

  async findAll(query: PaginationQueryDto): Promise<{ data: Omit<User, 'password' | 'refreshToken'>[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const [users, total] = await this.usersRepository.findAll({
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    });

    const sanitized = users.map(({ password, refreshToken, ...u }) => u);

    return {
      data: sanitized,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<Omit<User, 'password' | 'refreshToken'>> {
    const existing = await this.usersRepository.findById(id);
    const user = await this.usersRepository.update(id, data);

    if (existing && this.isNameChanged(existing, data)) {
      await this.onProfileChanged(id, existing, user);
    }

    const { password, refreshToken, ...result } = user;
    return result;
  }

  async remove(id: string): Promise<{ message: string }> {
    await this.usersRepository.remove(id);
    return { message: 'User deleted successfully' };
  }

  async updateFcmToken(id: string, token: string): Promise<void> {
    await this.usersRepository.update(id, { fcmToken: token });
  }

  async getAuditLogs(userId: string, limit = 50) {
    return this.auditService.findByUser(userId, limit);
  }

  // ─── Private helpers ──────────────────────────────────────────────

  private isNameChanged(existing: User | null, data: Prisma.UserUpdateInput): boolean {
    if (!existing) return false;
    return (
      (data.firstName !== undefined && data.firstName !== existing.firstName) ||
      (data.lastName !== undefined && data.lastName !== existing.lastName)
    );
  }

  private async onProfileChanged(id: string, existing: User, updated: User): Promise<void> {
    const oldName = [existing.firstName, existing.lastName].filter(Boolean).join(' ');
    const newName = [updated.firstName, updated.lastName].filter(Boolean).join(' ');

    await this.auditService.log({
      action: 'UPDATE_PROFILE',
      entityName: 'User',
      entityId: id,
      userId: id,
      metadata: { oldName, newName },
    });

    const title = 'Profile Updated';
    const body = `Your name has been updated to "${newName}"`;
    const notificationData = { type: 'profile_updated', userId: id };

    await this.prisma.notification.create({
      data: { userId: id, title, body, data: notificationData },
    });

    const messaging = this.firebaseService.messaging;
    if (messaging && updated.fcmToken) {
      messaging.send({
        token: updated.fcmToken,
        notification: { title, body },
        data: notificationData,
        android: { priority: 'high', notification: { sound: 'default', channelId: 'high_importance_channel' } },
        apns: { payload: { aps: { sound: 'default' } } },
      }).catch((err) => this.logger.error('FCM push failed', err));
    }
  }
}

