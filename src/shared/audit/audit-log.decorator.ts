import { SetMetadata } from '@nestjs/common';

export const AUDIT_LOG_KEY = 'audit_log';

export interface AuditLogMeta {
  action: string;
  entityName: string;
}

/**
 * Decorator to mark a controller method for audit logging.
 * Use with AuditLogInterceptor.
 *
 * @example
 * @AuditLog('DELETE', 'User')
 * @Delete(':id')
 * remove(@Param('id') id: string) { ... }
 */
export const AuditLog = (action: string, entityName: string) =>
  SetMetadata(AUDIT_LOG_KEY, { action, entityName } as AuditLogMeta);
