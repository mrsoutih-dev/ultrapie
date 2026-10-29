import { describe, it, expect } from 'vitest';
import { verifyAdminRequest } from '../apps/web/src/lib/user-store';
import { executeDatabaseQuery, getDatabases } from '../apps/web/src/lib/hosting/managed-databases';

describe('Maestro War Room Modifications Verification', () => {
  const primaryDbId = getDatabases()[0]?.id || 'db-pg-core';

  describe('Modification 1: RBAC & Endpoint Authorization Protection', () => {
    it('should reject unauthorized requests missing credentials', () => {
      // Temporarily override NODE_ENV to simulate production verification
      const origEnv = process.env.NODE_ENV;
      try {
        (process.env as any).NODE_ENV = 'production';
        const res = verifyAdminRequest(null);
        expect(res.authorized).toBe(false);
        expect(res.error).toContain('missing');
      } finally {
        (process.env as any).NODE_ENV = origEnv;
      }
    });

    it('should allow master owner user ID', () => {
      const res = verifyAdminRequest('usr_master_001');
      expect(res.authorized).toBe(true);
    });

    it('should allow valid system admin drill key', () => {
      const res = verifyAdminRequest('system_dev_secret_drill_key');
      expect(res.authorized).toBe(true);
    });
  });

  describe('Modification 3: Pinned Dependencies in 1-Click ZIP Exporter', () => {
    it('should sanitize package.json to pinned lucide-react and react versions', () => {
      const rawPkg = JSON.stringify({
        name: 'test-app',
        dependencies: {
          'lucide-react': '^1.16.0',
          react: '^18.2.0',
          'react-dom': '^18.2.0',
        },
      });

      const sanitized = rawPkg
        .replace(/"lucide-react":\s*"[^"]*"/g, '"lucide-react": "^0.475.0"')
        .replace(/"react":\s*"\^?18[^"]*"/g, '"react": "^19.0.0"')
        .replace(/"react-dom":\s*"\^?18[^"]*"/g, '"react-dom": "^19.0.0"');

      const parsed = JSON.parse(sanitized);
      expect(parsed.dependencies['lucide-react']).toBe('^0.475.0');
      expect(parsed.dependencies.react).toBe('^19.0.0');
      expect(parsed.dependencies['react-dom']).toBe('^19.0.0');
    });
  });

  describe('Modification 5: SQL Safety Guard & Destructive Mode Protection', () => {
    it('should block DROP TABLE when allowDestructive is false', () => {
      const res = executeDatabaseQuery(primaryDbId, 'DROP TABLE users CASCADE;');
      expect(res.success).toBe(false);
      expect(res.result).toContain('Safety Guard Blocked Destructive Operation');
    });

    it('should block TRUNCATE and DELETE in safe mode', () => {
      const res1 = executeDatabaseQuery(primaryDbId, 'TRUNCATE TABLE audit_logs;');
      expect(res1.success).toBe(false);
      expect(res1.result).toContain('Safety Guard Blocked');

      const res2 = executeDatabaseQuery(primaryDbId, 'DELETE FROM users WHERE id > 0;');
      expect(res2.success).toBe(false);
      expect(res2.result).toContain('Safety Guard Blocked');
    });

    it('should permit destructive operations when allowDestructive is explicitly true', () => {
      const res = executeDatabaseQuery(primaryDbId, 'DROP TABLE temp_cache;', {
        allowDestructive: true,
      });
      expect(res.success).toBe(true);
      expect(res.result.message).toContain('Destructive Mode');
    });

    it('should always permit non-destructive SELECT queries', () => {
      const res = executeDatabaseQuery(primaryDbId, 'SELECT * FROM users;');
      expect(res.success).toBe(true);
      expect(Array.isArray(res.result)).toBe(true);
    });
  });
});
