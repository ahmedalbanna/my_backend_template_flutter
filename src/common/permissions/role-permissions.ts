import { Permission } from './permission.constants';

export const ROLE_PERMISSIONS: Record<string, readonly Permission[]> = {
  USER: [
    // Self-management only
    Permission.USERS_READ,
    Permission.USERS_WRITE,
    Permission.USERS_DELETE,
    Permission.AUTH_LOGOUT,
  ],

  ADMIN: [
    // Full access
    Permission.USERS_READ,
    Permission.USERS_WRITE,
    Permission.USERS_DELETE,
    Permission.USERS_MANAGE,
    Permission.AUTH_LOGOUT,
  ],
};

export function getPermissionsForRole(role: string): readonly Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}
