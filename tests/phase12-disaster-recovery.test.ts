import { describe, it, expect } from 'vitest';
import { StorageService, CorruptedBackupSnapshotError } from '@ultrapie/storage';
import {
  getDatabases,
  createDatabaseBackup,
  restoreDatabaseFromBackup,
  verifyDatabaseBackupIntegrity,
} from '../apps/web/src/lib/hosting/managed-databases';
import { DisasterRecoveryEngine } from '../apps/web/src/lib/hosting/disaster-recovery';
import { runDisasterRecoveryVerification } from '../scripts/backup_restore_drill';

describe('Phase 12 / Acceptance Test #15: Automated Backup & Disaster Recovery', () => {
  describe('Cryptographic Storage Snapshots & Restoration', () => {
    const storage = new StorageService({
      signingSecret: 'dr-test-signing-key',
      cdnBaseUrl: 'https://assets.ultrapie.com',
    });

    it('should generate an immutable snapshot with item and aggregate SHA-256 checksums', async () => {
      await storage.putObject('public-assets', 'assets/logo.svg', '<svg>logo</svg>', 'image/svg+xml');
      await storage.putObject('releases', 'releases/bundle.js', 'console.log("prod")', 'application/javascript');

      const snapshot = await storage.createBackupSnapshot();

      expect(snapshot.id).toBeDefined();
      expect(snapshot.totalObjects).toBe(2);
      expect(snapshot.manifestSha256).toHaveLength(64);
      expect(snapshot.items).toHaveLength(2);

      const svgItem = snapshot.items.find((i) => i.key === 'assets/logo.svg');
      expect(svgItem).toBeDefined();
      expect(svgItem?.checksumSha256).toHaveLength(64);
      expect(storage.verifySnapshotIntegrity(snapshot)).toBe(true);
    });

    it('should reject tampered or corrupted snapshots before restoring', async () => {
      await storage.putObject('public-assets', 'assets/tamper.txt', 'AUTHENTIC_DATA', 'text/plain');
      const snapshot = await storage.createBackupSnapshot();

      // Tamper with content base64
      const corruptedSnapshot = JSON.parse(JSON.stringify(snapshot));
      corruptedSnapshot.items[0].dataBase64 = Buffer.from('TAMPERED_MALICIOUS_DATA').toString('base64');

      expect(storage.verifySnapshotIntegrity(corruptedSnapshot)).toBe(false);

      await expect(
        storage.restoreFromSnapshot(corruptedSnapshot)
      ).rejects.toThrow(CorruptedBackupSnapshotError);
    });

    it('should restore storage objects from backup with 100% byte fidelity', async () => {
      storage.clearAllObjects();

      await storage.putObject('releases', 'v1/app.bin', Buffer.from([0xde, 0xad, 0xbe, 0xef]), 'application/octet-stream');
      await storage.putObject('private-sources', 'code/repo.zip', 'SOURCE_CODE_ZIP', 'application/zip');

      const snapshot = await storage.createBackupSnapshot();

      // Wipe storage completely
      storage.clearAllObjects();
      expect((await storage.listObjects()).length).toBe(0);

      // Restore
      const result = await storage.restoreFromSnapshot(snapshot);
      expect(result.restoredCount).toBe(2);
      expect(result.dataLossDetected).toBe(false);

      // Verify restored content
      const binObj = await storage.getObject('releases', 'v1/app.bin');
      expect(Buffer.isBuffer(binObj.data)).toBe(true);
      expect((binObj.data as Buffer).toString('hex')).toBe('deadbeef');
    });
  });

  describe('Database Backup & Restore Verification', () => {
    it('should create database snapshot with table structure and checksum', () => {
      const dbs = getDatabases();
      expect(dbs.length).toBeGreaterThan(0);

      const db = dbs[0];
      const snapshot = createDatabaseBackup(db.id);

      expect(snapshot.databaseId).toBe(db.id);
      expect(snapshot.databaseName).toBe(db.databaseName);
      expect(snapshot.checksumSha256).toHaveLength(64);
      expect(snapshot.tables.length).toBe(db.tables.length);
      expect(verifyDatabaseBackupIntegrity(snapshot)).toBe(true);
    });

    it('should restore database from backup snapshot accurately', () => {
      const dbs = getDatabases();
      const targetDb = dbs[0];
      const snapshot = createDatabaseBackup(targetDb.id);

      const restored = restoreDatabaseFromBackup(snapshot);
      expect(restored).toBe(true);

      const activeDbs = getDatabases();
      const verifiedDb = activeDbs.find((d) => d.id === targetDb.id);
      expect(verifiedDb).toBeDefined();
      expect(verifiedDb?.tables.length).toBe(snapshot.tables.length);
    });
  });

  describe('Full-Platform Disaster Recovery Drill (Acceptance Test #15)', () => {
    it('should execute end-to-end disaster drill with zero data loss', async () => {
      const engine = new DisasterRecoveryEngine();
      const report = await engine.runDisasterRecoveryDrill();

      expect(report.success).toBe(true);
      expect(report.zeroDataLoss).toBe(true);
      expect(report.r2Storage.dataLossDetected).toBe(false);
      expect(report.databases.zeroDataLoss).toBe(true);
      expect(report.integrityProof.match).toBe(true);
    });

    it('should execute stand-alone backup and restore drill script', async () => {
      const result = await runDisasterRecoveryVerification();

      expect(result.success).toBe(true);
      expect(result.zeroDataLoss).toBe(true);
      expect(result.restoredObjectsCount).toBe(3);
      expect(result.restoredDatabasesCount).toBeGreaterThanOrEqual(2);
      expect(result.manifestSha256).toHaveLength(64);
    });
  });
});
