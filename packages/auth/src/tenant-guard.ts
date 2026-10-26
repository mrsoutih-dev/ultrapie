import { TenantContext } from './types.js';

export class TenantSecurityError extends Error {
  constructor(message: string = 'Access denied: Cross-tenant operation prohibited') {
    super(message);
    this.name = 'TenantSecurityError';
  }
}

export class TenantGuard {
  /**
   * Enforces that an operation is performed exclusively within the tenant scope.
   */
  static assertTenantAccess(
    context: TenantContext,
    targetResourceOrgId: string,
    operationName = 'Resource access'
  ): void {
    if (!context || !context.organizationId) {
      throw new TenantSecurityError('Invalid tenant context: No active organization identified');
    }

    if (context.organizationId !== targetResourceOrgId) {
      throw new TenantSecurityError(
        `Cross-tenant breach attempt blocked on ${operationName}: Caller org [${context.organizationId}] cannot access target org [${targetResourceOrgId}]`
      );
    }
  }

  /**
   * Filters query conditions to automatically scope to the authenticated tenant.
   */
  static scopeQuery<T extends { organizationId?: string }>(
    context: TenantContext,
    where: T = {} as T
  ): T & { organizationId: string } {
    if (!context.organizationId) {
      throw new TenantSecurityError('Cannot scope query without authenticated organizationId');
    }
    return {
      ...where,
      organizationId: context.organizationId,
    };
  }
}
