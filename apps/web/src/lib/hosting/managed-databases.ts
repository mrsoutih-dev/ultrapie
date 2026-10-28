import fs from 'fs';
import path from 'path';
import { updateDeployment, getDeployments } from './edge-deployments';

export interface DatabaseTable {
  name: string;
  rowCount: number;
  size: string;
}

export interface DatabaseBackupSnapshot {
  id: string;
  databaseId: string;
  databaseName: string;
  type: 'postgresql' | 'redis' | 'sqlite';
  timestamp: string;
  tables: DatabaseTable[];
  dumpSqlOrCommands: string;
  checksumSha256: string;
  sizeBytes: number;
}

export interface ManagedDatabase {
  id: string;
  name: string;
  type: 'postgresql' | 'redis' | 'sqlite';
  version: string;
  status: 'active' | 'provisioning' | 'stopped';
  host: string;
  port: number;
  databaseName: string;
  username: string;
  password?: string;
  connectionUri: string;
  storageUsed: string;
  attachedAppId?: string;
  attachedAppName?: string;
  createdAt: string;
  tables: DatabaseTable[];
}

const DATA_DIR = path.join(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'databases.json');

let inMemoryDatabases: ManagedDatabase[] = [
  {
    id: 'db-pg-core',
    name: 'Production PostgreSQL Cluster',
    type: 'postgresql',
    version: 'PostgreSQL 16.3',
    status: 'active',
    host: 'db.ultrapie.internal',
    port: 5432,
    databaseName: 'ultrapie_production',
    username: 'postgres_admin',
    password: 'p1_Secr3t_99x#z7',
    connectionUri: 'postgresql://postgres_admin:p1_Secr3t_99x#z7@db.ultrapie.internal:5432/ultrapie_production?sslmode=require',
    storageUsed: '34.8 MB / 5 GB',
    attachedAppId: 'dep-counter-01',
    attachedAppName: 'Ultrapie Counter App',
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    tables: [
      { name: 'users', rowCount: 142, size: '1.2 MB' },
      { name: 'app_sessions', rowCount: 1840, size: '8.4 MB' },
      { name: 'audit_logs', rowCount: 5210, size: '25.2 MB' },
    ],
  },
  {
    id: 'db-redis-cache',
    name: 'Global Edge Redis Cache',
    type: 'redis',
    version: 'Redis 7.2-Alpine',
    status: 'active',
    host: 'cache.ultrapie.internal',
    port: 6379,
    databaseName: '0',
    username: 'default',
    password: 'rd_T0ken_88a#k9',
    connectionUri: 'redis://default:rd_T0ken_88a#k9@cache.ultrapie.internal:6379',
    storageUsed: '4.2 MB / 1 GB',
    attachedAppId: 'dep-coolify-api',
    attachedAppName: 'Fastify API Microservice',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    tables: [
      { name: 'sessions:*', rowCount: 320, size: '1.1 MB' },
      { name: 'rate_limits:*', rowCount: 890, size: '2.4 MB' },
      { name: 'ai_cache:*', rowCount: 145, size: '0.7 MB' },
    ],
  },
];

function loadDatabases(): ManagedDatabase[] {
  if (process.env.VITEST) {
    return inMemoryDatabases;
  }
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Could not read databases from file, using in-memory store:', e);
  }
  return inMemoryDatabases;
}

function saveDatabases(dbs: ManagedDatabase[]) {
  inMemoryDatabases = dbs;
  if (process.env.VITEST) {
    return;
  }
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(dbs, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Could not write databases to file, in-memory updated:', e);
  }
}

export function getDatabases(): ManagedDatabase[] {
  return loadDatabases();
}

export function getDatabaseById(id: string): ManagedDatabase | undefined {
  const all = loadDatabases();
  return all.find((d) => d.id === id);
}

export function provisionDatabase(params: {
  name: string;
  type: 'postgresql' | 'redis' | 'sqlite';
  attachedAppId?: string;
}): ManagedDatabase {
  const all = loadDatabases();
  const dbId = `db-${params.type === 'postgresql' ? 'pg' : params.type}-${Date.now().toString(36)}`;
  const cleanName = params.name.trim() || `${params.type.toUpperCase()} Instance`;

  // Random secure credentials
  const randSuffix = Math.random().toString(36).substring(2, 8);
  const username = params.type === 'redis' ? 'default' : `u_${randSuffix}`;
  const password = `pwd_${Math.random().toString(36).substring(2, 10)}!x`;
  const dbName = params.type === 'redis' ? '0' : `db_${randSuffix}`;
  const host = params.type === 'redis' ? 'cache.ultrapie.internal' : 'db.ultrapie.internal';
  const port = params.type === 'redis' ? 6379 : 5432;

  const connectionUri =
    params.type === 'redis'
      ? `redis://${username}:${password}@${host}:${port}`
      : `postgresql://${username}:${password}@${host}:${port}/${dbName}?sslmode=require`;

  let attachedAppName: string | undefined;
  if (params.attachedAppId) {
    const apps = getDeployments();
    const app = apps.find((a) => a.id === params.attachedAppId || a.slug === params.attachedAppId);
    if (app) {
      attachedAppName = app.name;
      // Automatically inject into application environment variables!
      const envKey = params.type === 'redis' ? 'REDIS_URL' : 'DATABASE_URL';
      updateDeployment(app.id, {
        envVars: {
          ...app.envVars,
          [envKey]: connectionUri,
        },
      });
    }
  }

  const newDb: ManagedDatabase = {
    id: dbId,
    name: cleanName,
    type: params.type,
    version: params.type === 'postgresql' ? 'PostgreSQL 16.3' : 'Redis 7.2-Alpine',
    status: 'active',
    host,
    port,
    databaseName: dbName,
    username,
    password,
    connectionUri,
    storageUsed: '4.0 KB / 1 GB',
    attachedAppId: params.attachedAppId,
    attachedAppName,
    createdAt: new Date().toISOString(),
    tables:
      params.type === 'postgresql'
        ? [
            { name: 'users', rowCount: 0, size: '16 kB' },
            { name: 'posts', rowCount: 0, size: '16 kB' },
          ]
        : [{ name: 'keys:*', rowCount: 0, size: '4 kB' }],
  };

  all.unshift(newDb);
  saveDatabases(all);
  return newDb;
}

export function executeDatabaseQuery(
  id: string,
  query: string
): { success: boolean; result: any; durationMs: number } {
  const db = getDatabaseById(id);
  if (!db) {
    return { success: false, result: 'Database not found', durationMs: 0 };
  }

  const start = Date.now();
  const trimmed = query.trim().toUpperCase();

  // Simulated interactive query runner
  if (db.type === 'postgresql') {
    if (trimmed.startsWith('SELECT') && trimmed.includes('USERS')) {
      return {
        success: true,
        result: [
          { id: 1, email: 'demo@ultrapie.com', role: 'ADMIN', created_at: '2026-10-26T12:00:00Z' },
          { id: 2, email: 'alex@example.org', role: 'DEVELOPER', created_at: '2026-10-27T08:30:00Z' },
          { id: 3, email: 'sarah@vibeheberg.com', role: 'MEMBER', created_at: '2026-10-28T14:15:00Z' },
        ],
        durationMs: Date.now() - start + 12,
      };
    }

    if (trimmed.startsWith('SELECT') && trimmed.includes('TABLE')) {
      return {
        success: true,
        result: db.tables,
        durationMs: Date.now() - start + 8,
      };
    }

    return {
      success: true,
      result: {
        command: trimmed.split(' ')[0],
        affectedRows: 1,
        message: 'Query executed successfully against ' + db.databaseName,
      },
      durationMs: Date.now() - start + 14,
    };
  }

  // Redis runner
  if (db.type === 'redis') {
    if (trimmed.startsWith('KEYS') || trimmed.startsWith('SCAN')) {
      return {
        success: true,
        result: ['session:tok_99182', 'cache:user:1', 'rate_limit:ip_192.168.1.1', 'ai:token_budget:proj_1'],
        durationMs: Date.now() - start + 3,
      };
    }
    return {
      success: true,
      result: 'OK',
      durationMs: Date.now() - start + 2,
    };
  }

  return { success: true, result: 'Query completed.', durationMs: Date.now() - start + 5 };
}

export function deleteDatabase(id: string): boolean {
  const all = loadDatabases();
  const filtered = all.filter((d) => d.id !== id);
  if (filtered.length !== all.length) {
    saveDatabases(filtered);
    return true;
  }
  return false;
}

/**
 * Creates an immutable database snapshot with SQL/AOF dump and SHA-256 integrity checksum.
 */
export function createDatabaseBackup(dbId: string): DatabaseBackupSnapshot {
  const db = getDatabaseById(dbId);
  if (!db) {
    throw new Error(`Database ${dbId} not found`);
  }

  const dumpSqlOrCommands =
    db.type === 'postgresql'
      ? `-- PostgreSQL 16.3 Dump: ${db.databaseName}\n` +
        `-- Dump generated at: ${new Date().toISOString()}\n` +
        db.tables.map((t) => `CREATE TABLE IF NOT EXISTS "${t.name}" (id SERIAL PRIMARY KEY, data JSONB);\n-- Dumped ${t.rowCount} rows`).join('\n') +
        `\n-- End of PostgreSQL Dump`
      : `# Redis AOF Dump: ${db.databaseName}\n` +
        db.tables.map((t) => `*3\r\n$3\r\nSET\r\n$${t.name.length}\r\n${t.name}\r\n$4\r\ndata`).join('\n');

  const crypto = require('crypto');
  const sizeBytes = Buffer.byteLength(dumpSqlOrCommands, 'utf-8');
  const checksumSha256 = crypto.createHash('sha256').update(dumpSqlOrCommands).digest('hex');

  return {
    id: `snap_db_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    databaseId: db.id,
    databaseName: db.databaseName,
    type: db.type,
    timestamp: new Date().toISOString(),
    tables: JSON.parse(JSON.stringify(db.tables)),
    dumpSqlOrCommands,
    checksumSha256,
    sizeBytes,
  };
}

/**
 * Verifies the integrity of a database snapshot.
 */
export function verifyDatabaseBackupIntegrity(snapshot: DatabaseBackupSnapshot): boolean {
  if (!snapshot || !snapshot.dumpSqlOrCommands || !snapshot.checksumSha256) return false;
  const crypto = require('crypto');
  const computed = crypto.createHash('sha256').update(snapshot.dumpSqlOrCommands).digest('hex');
  return computed === snapshot.checksumSha256;
}

/**
 * Restores a database from an immutable snapshot with checksum verification.
 */
export function restoreDatabaseFromBackup(snapshot: DatabaseBackupSnapshot): boolean {
  if (!verifyDatabaseBackupIntegrity(snapshot)) {
    throw new Error(`Database restore failed: Checksum mismatch on snapshot ${snapshot.id}`);
  }

  const all = loadDatabases();
  let existingIndex = all.findIndex((d) => d.id === snapshot.databaseId);

  if (existingIndex >= 0) {
    all[existingIndex] = {
      ...all[existingIndex],
      status: 'active',
      tables: JSON.parse(JSON.stringify(snapshot.tables)),
      storageUsed: `${((snapshot.sizeBytes / 1024) * 0.1).toFixed(1)} MB / 5 GB`,
    };
  } else {
    // Recreate database if deleted
    all.push({
      id: snapshot.databaseId,
      name: `${snapshot.databaseName} (Restored)`,
      type: snapshot.type,
      version: snapshot.type === 'postgresql' ? 'PostgreSQL 16.3' : 'Redis 7.2-Alpine',
      status: 'active',
      host: snapshot.type === 'postgresql' ? 'db.ultrapie.internal' : 'cache.ultrapie.internal',
      port: snapshot.type === 'postgresql' ? 5432 : 6379,
      databaseName: snapshot.databaseName,
      username: 'postgres_admin',
      connectionUri: `${snapshot.type}://admin:secret@internal-db:5432/${snapshot.databaseName}`,
      storageUsed: `${((snapshot.sizeBytes / 1024) * 0.1).toFixed(1)} MB / 5 GB`,
      createdAt: snapshot.timestamp,
      tables: JSON.parse(JSON.stringify(snapshot.tables)),
    });
  }

  saveDatabases(all);
  return true;
}

