import { describe, it, expect } from 'vitest';
import {
  signSessionToken,
  verifySessionToken,
  hasPermission,
  canManageBilling,
  canDeploy,
  TenantGuard,
  TenantSecurityError,
  createAuditEntry,
  type AuthSession,
  type TenantContext,
} from '@ultrapie/auth';

describe('Phase 03: Authentication & Multi-Tenancy', () => {
  const sampleUserA: AuthSession = {
    userId: 'usr_alpha_01',
    email: 'sarah@tenant-a.com',
    name: 'Sarah Connor',
    currentOrgId: 'org_alpha_001',
    role: 'OWNER',
  };

  const sampleUserB: AuthSession = {
    userId: 'usr_beta_02',
    email: 'john@tenant-b.com',
    name: 'John Doe',
    currentOrgId: 'org_beta_002',
    role: 'MEMBER',
  };

  describe('Session Tokens & Signatures', () => {
    it('should sign and verify valid session token', async () => {
      const token = await signSessionToken(sampleUserA);
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(20);

      const verified = await verifySessionToken(token);
      expect(verified).not.toBeNull();
      expect(verified?.userId).toBe(sampleUserA.userId);
      expect(verified?.currentOrgId).toBe(sampleUserA.currentOrgId);
      expect(verified?.role).toBe('OWNER');
    });

    it('should reject invalid or tampered tokens', async () => {
      const token = await signSessionToken(sampleUserA);
      const tampered = token.slice(0, -5) + 'xxxxx';
      const verified = await verifySessionToken(tampered);
      expect(verified).toBeNull();
    });

    it('should reject token signed with another secret', async () => {
      const token = await signSessionToken(sampleUserA, 'foreign-secret-key-1234567890');
      const verified = await verifySessionToken(token, 'standard-secret-key-0987654321');
      expect(verified).toBeNull();
    });
  });

  describe('Role-Based Access Control (RBAC)', () => {
    it('should allow OWNER all permissions including billing and deletion', () => {
      expect(hasPermission('OWNER', 'billing:manage')).toBe(true);
      expect(hasPermission('OWNER', 'org:delete')).toBe(true);
      expect(canManageBilling('OWNER')).toBe(true);
      expect(canDeploy('OWNER')).toBe(true);
    });

    it('should allow ADMIN project management but disallow billing by default', () => {
      expect(hasPermission('ADMIN', 'project:create')).toBe(true);
      expect(hasPermission('ADMIN', 'project:deploy')).toBe(true);
      expect(canManageBilling('ADMIN')).toBe(false);
    });

    it('should allow MEMBER to edit and deploy projects only', () => {
      expect(hasPermission('MEMBER', 'project:edit')).toBe(true);
      expect(hasPermission('MEMBER', 'project:deploy')).toBe(true);
      expect(hasPermission('MEMBER', 'org:manage')).toBe(false);
    });

    it('should deny VIEWER any mutation permissions', () => {
      expect(hasPermission('VIEWER', 'project:create')).toBe(false);
      expect(hasPermission('VIEWER', 'project:edit')).toBe(false);
      expect(hasPermission('VIEWER', 'project:deploy')).toBe(false);
    });
  });

  describe('Cross-Tenant Security Barrier', () => {
    const tenantAContext: TenantContext = {
      organizationId: 'org_alpha_001',
      userId: 'usr_alpha_01',
      role: 'OWNER',
    };

    it('should allow operation when tenant matches resource organizationId', () => {
      expect(() => {
        TenantGuard.assertTenantAccess(tenantAContext, 'org_alpha_001', 'Update Project');
      }).not.toThrow();
    });

    it('should strictly throw TenantSecurityError on cross-tenant access attempt', () => {
      expect(() => {
        TenantGuard.assertTenantAccess(tenantAContext, 'org_beta_002', 'Read Project');
      }).toThrow(TenantSecurityError);
    });

    it('should automatically inject organizationId when scoping queries', () => {
      const rawFilter = { id: 'proj_999', status: 'active' };
      const scoped = TenantGuard.scopeQuery(tenantAContext, rawFilter);

      expect(scoped.organizationId).toBe('org_alpha_001');
      expect(scoped.id).toBe('proj_999');
    });

    it('should reject queries with empty tenant context', () => {
      const invalidContext = { organizationId: '', userId: '', role: 'MEMBER' as const };
      expect(() => {
        TenantGuard.scopeQuery(invalidContext, {});
      }).toThrow(TenantSecurityError);
    });
  });

  describe('Audit Logging', () => {
    it('should generate compliant immutable audit entries', () => {
      const context: TenantContext = {
        organizationId: 'org_alpha_001',
        userId: 'usr_alpha_01',
        role: 'OWNER',
      };

      const entry = createAuditEntry(
        context,
        'project.delete',
        'project',
        'proj_001',
        { reason: 'User requested' },
        '192.168.1.1'
      );

      expect(entry.organizationId).toBe('org_alpha_001');
      expect(entry.userId).toBe('usr_alpha_01');
      expect(entry.action).toBe('project.delete');
      expect(entry.targetType).toBe('project');
      expect(entry.targetId).toBe('proj_001');
      expect(entry.timestamp).toBeDefined();
    });
  });
});
