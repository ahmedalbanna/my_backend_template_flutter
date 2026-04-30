import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditLogOptions {
  action: string;
  entityName: string;
  entityId: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private prisma: PrismaService) {}

  async log(options: AuditLogOptions): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: options.action,
          entityName: options.entityName,
          entityId: options.entityId,
          userId: options.userId,
          metadata: options.metadata as any,
        },
      });
      this.logger.debug(
        `Audit: [${options.action}] ${options.entityName}#${options.entityId} by user ${options.userId ?? 'system'}`,
      );
    } catch (error) {
      // Audit logging should never break the main request
      this.logger.error('Failed to write audit log', error);
    }
  }

  async findByUser(userId: string, limit = 50) {
    return this.prisma.auditLog.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  async findByEntity(entityName: string, entityId: string) {
    return this.prisma.auditLog.findMany({
      where: { entityName, entityId },
      orderBy: { timestamp: 'desc' },
    });
  }
}
