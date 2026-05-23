export const Permission = {
  // Users
  USERS_READ: 'users:read',
  USERS_WRITE: 'users:write',
  USERS_DELETE: 'users:delete',
  USERS_MANAGE: 'users:manage',

  // Auth
  AUTH_LOGOUT: 'auth:logout',

  // System
  SYSTEM_HEALTH: 'system:health',
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];
