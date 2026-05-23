import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { getPermissionsForRole } from '../permissions';
import type { Permission } from '../permissions';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: { role?: string };
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles && !requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const userRole = request.user?.role;

    if (!userRole) {
      throw new ForbiddenException('Access denied: no role assigned');
    }

    if (requiredRoles && requiredRoles.length > 0) {
      const hasRole = requiredRoles.some((role) => userRole === role);
      if (!hasRole) {
        throw new ForbiddenException(
          `Access denied: requires one of [${requiredRoles.join(', ')}] roles`,
        );
      }
    }

    if (requiredPermissions && requiredPermissions.length > 0) {
      const userPermissions = getPermissionsForRole(userRole);
      const hasAllPermissions = requiredPermissions.every((p) =>
        userPermissions.includes(p),
      );
      if (!hasAllPermissions) {
        throw new ForbiddenException(
          `Access denied: missing required permissions [${requiredPermissions.join(', ')}]`,
        );
      }
    }

    return true;
  }
}
