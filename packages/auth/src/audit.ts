import { TenantContext } from './types.js';

export interface AuditLogEntry {
  organizationId: string;
  userId?: string;
  action: string;
  targetType: string;
  targetId: string;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export function createAuditEntry(
  context: TenantContext,
  action: string,
  targetType: string,
  targetId: string,
  metadata?: Record<string, unknown>,
  ipAddress?: string
): AuditLogEntry {
  return {
    organizationId: context.organizationId,
    userId: context.userId,
    action,
    targetType,
    targetId,
    metadata,
    ipAddress,
    timestamp: new Date().toISOString(),
  };
}
