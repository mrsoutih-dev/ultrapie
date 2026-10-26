import { UserRole } from '@ultrapie/shared';
import { Permission } from './types.js';

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  OWNER: [
    'org:manage',
    'org:delete',
    'billing:manage',
    'project:create',
    'project:edit',
    'project:delete',
    'project:deploy',
    'domain:manage',
    'asset:upload',
  ],
  ADMIN: [
    'org:manage',
    'project:create',
    'project:edit',
    'project:delete',
    'project:deploy',
    'domain:manage',
    'asset:upload',
  ],
  MEMBER: [
    'project:create',
    'project:edit',
    'project:deploy',
    'asset:upload',
  ],
  VIEWER: [],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

export function canManageBilling(role: UserRole): boolean {
  return hasPermission(role, 'billing:manage');
}

export function canDeploy(role: UserRole): boolean {
  return hasPermission(role, 'project:deploy');
}

export function canEditCode(role: UserRole): boolean {
  return hasPermission(role, 'project:edit');
}
