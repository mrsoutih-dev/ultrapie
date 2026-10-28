import { describe, it, expect } from 'vitest';
import {
  getDatabases,
  getDatabaseById,
  provisionDatabase,
  executeDatabaseQuery,
  deleteDatabase,
} from '../apps/web/src/lib/hosting/managed-databases';
import {
  createDeployment,
  getDeploymentBySlug,
} from '../apps/web/src/lib/hosting/edge-deployments';

describe('Sprint E1: 1-Click Managed Databases (PostgreSQL & Redis)', () => {
  it('should initialize with default active PostgreSQL and Redis clusters', () => {
    const dbs = getDatabases();
    expect(dbs.length).toBeGreaterThanOrEqual(2);

    const pg = dbs.find((d) => d.type === 'postgresql');
    expect(pg).toBeDefined();
    expect(pg?.version).toContain('PostgreSQL 16');
    expect(pg?.status).toBe('active');
    expect(pg?.connectionUri).toContain('postgresql://');

    const redis = dbs.find((d) => d.type === 'redis');
    expect(redis).toBeDefined();
    expect(redis?.version).toContain('Redis 7');
    expect(redis?.status).toBe('active');
    expect(redis?.connectionUri).toContain('redis://');
  });

  it('should provision a new PostgreSQL instance and auto-inject DATABASE_URL into target app', () => {
    // 1. Create a dummy app
    const app = createDeployment({
      name: 'Blog Backend App',
      files: { 'src/App.tsx': 'export default function App() { return <div>Blog</div>; }' },
      type: 'edge',
    });
    expect(app).toBeDefined();

    // 2. Provision Postgres database attached to this app
    const db = provisionDatabase({
      name: 'Blog PostgreSQL DB',
      type: 'postgresql',
      attachedAppId: app.id,
    });

    expect(db.id).toBeDefined();
    expect(db.type).toBe('postgresql');
    expect(db.connectionUri).toContain('postgresql://');
    expect(db.connectionUri).toContain('db.ultrapie.internal:5432');
    expect(db.attachedAppName).toBe('Blog Backend App');

    // 3. Verify DATABASE_URL was automatically injected into the app's envVars!
    const refreshedApp = getDeploymentBySlug('blog-backend-app');
    expect(refreshedApp?.envVars['DATABASE_URL']).toBe(db.connectionUri);
  });

  it('should provision a new Redis instance and auto-inject REDIS_URL into target app', () => {
    const app = getDeploymentBySlug('blog-backend-app');
    expect(app).toBeDefined();
    if (!app) return;

    const redisDb = provisionDatabase({
      name: 'Blog Redis Cache',
      type: 'redis',
      attachedAppId: app.id,
    });

    expect(redisDb.type).toBe('redis');
    expect(redisDb.connectionUri).toContain('redis://');
    expect(redisDb.connectionUri).toContain('cache.ultrapie.internal:6379');

    const refreshedApp = getDeploymentBySlug('blog-backend-app');
    expect(refreshedApp?.envVars['REDIS_URL']).toBe(redisDb.connectionUri);
  });

  it('should execute SQL queries and return structured output', () => {
    const dbs = getDatabases();
    const pg = dbs.find((d) => d.type === 'postgresql');
    expect(pg).toBeDefined();
    if (!pg) return;

    const queryRes = executeDatabaseQuery(pg.id, 'SELECT * FROM users;');
    expect(queryRes.success).toBe(true);
    expect(Array.isArray(queryRes.result)).toBe(true);
    expect(queryRes.result.length).toBeGreaterThan(0);
    expect(queryRes.durationMs).toBeGreaterThan(0);
  });

  it('should execute Redis CLI commands in query runner', () => {
    const dbs = getDatabases();
    const redis = dbs.find((d) => d.type === 'redis');
    expect(redis).toBeDefined();
    if (!redis) return;

    const redisRes = executeDatabaseQuery(redis.id, 'KEYS *');
    expect(redisRes.success).toBe(true);
    expect(Array.isArray(redisRes.result)).toBe(true);
    expect(redisRes.durationMs).toBeGreaterThan(0);
  });

  it('should delete a managed database cleanly', () => {
    const dbs = getDatabases();
    const target = dbs.find((d) => d.name === 'Blog PostgreSQL DB');
    expect(target).toBeDefined();
    if (!target) return;

    const deleted = deleteDatabase(target.id);
    expect(deleted).toBe(true);

    const check = getDatabaseById(target.id);
    expect(check).toBeUndefined();
  });
});
