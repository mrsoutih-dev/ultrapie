import { describe, it, expect } from 'vitest';
import { executeDatabaseQuery, getDatabaseById } from '../apps/web/src/lib/hosting/managed-databases';

describe('Studio Database Explorer & Managed Query Engine', () => {
  it('should safely execute read-only queries against managed PostgreSQL instances', () => {
    const res = executeDatabaseQuery('db-pg-core', 'SELECT * FROM users;');
    expect(res.success).toBe(true);
    expect(res.durationMs).toBeGreaterThan(0);
    expect(res.result).toBeDefined();
  });

  it('should block destructive operations by default with safety guard', () => {
    const res = executeDatabaseQuery('db-pg-core', 'DROP TABLE users;');
    expect(res.success).toBe(false);
    expect(res.result).toContain('Safety Guard Blocked');
  });

  it('should allow destructive operations only when allowDestructive is explicitly true', () => {
    const res = executeDatabaseQuery('db-pg-core', 'DROP TABLE test_temp;', { allowDestructive: true });
    expect(res.success).toBe(true);
  });

  it('should execute Redis CLI commands and return structured output', () => {
    const res = executeDatabaseQuery('db-redis-cache', 'KEYS *');
    expect(res.success).toBe(true);
    expect(Array.isArray(res.result)).toBe(true);
  });

  it('should protect Redis instances from unauthorized FLUSHALL commands', () => {
    const res = executeDatabaseQuery('db-redis-cache', 'FLUSHALL');
    expect(res.success).toBe(false);
    expect(res.result).toContain('Safety Guard Blocked');
  });
});
