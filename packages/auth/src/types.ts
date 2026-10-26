import { UserRole } from '@ultrapie/shared';

export interface AuthSession {
  userId: string;
  email: string;
  name?: string;
  currentOrgId: string;
  role: UserRole;
}

export interface TenantContext {
  organizationId: string;
  userId: string;
  role: UserRole;
}

export type Permission =
  | 'org:manage'
  | 'org:delete'
  | 'billing:manage'
  | 'project:create'
  | 'project:edit'
  | 'project:delete'
  | 'project:deploy'
  | 'domain:manage'
  | 'asset:upload';
