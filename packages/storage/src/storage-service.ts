import * as crypto from 'crypto';
import {
  StorageBucketType,
  StorageObject,
  PresignedUrlResult,
  StorageBackupItem,
  StorageBackupSnapshot,
  StorageRestoreResult,
} from './types';

export class UnauthorizedStorageAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedStorageAccessError';
  }
}

export class CorruptedBackupSnapshotError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CorruptedBackupSnapshotError';
  }
}

export class StorageService {
  private objects: Map<string, StorageObject> = new Map();
  private signingSecret: string;
  private cdnBaseUrl: string;

  constructor(options: { signingSecret?: string; cdnBaseUrl?: string } = {}) {
    this.signingSecret =
      options.signingSecret ||
      process.env.STORAGE_SIGNING_SECRET ||
      'ultrapie-storage-signing-secret-dev';
    this.cdnBaseUrl =
      options.cdnBaseUrl ||
      process.env.NEXT_PUBLIC_CDN_URL ||
      process.env.CDN_BASE_URL ||
      'https://media.ultrapie.com';
  }

  private getCompositeKey(bucket: StorageBucketType, key: string): string {
    return `${bucket}::${key}`;
  }

  /**
   * Stores an object into a specified bucket tier.
   */
  async putObject(
    bucket: StorageBucketType,
    key: string,
    data: Buffer | string,
    contentType = 'application/octet-stream',
    metadata?: Record<string, string>
  ): Promise<StorageObject> {
    const obj: StorageObject = {
      bucket,
      key,
      data,
      contentType,
      metadata,
      createdAt: new Date().toISOString(),
    };

    this.objects.set(this.getCompositeKey(bucket, key), obj);
    return obj;
  }

  /**
   * Retrieves an object. Strictly enforces authorization for private/quarantined data.
   */
  async getObject(
    bucket: StorageBucketType,
    key: string,
    signedToken?: string
  ): Promise<StorageObject> {
    const compositeKey = this.getCompositeKey(bucket, key);
    const obj = this.objects.get(compositeKey);

    if (!obj) {
      throw new Error(`Object not found: [${bucket}] ${key}`);
    }

    // Security Rule: Private sources & quarantine CANNOT be read without valid signed token
    if (bucket === 'private-sources' || bucket === 'quarantine') {
      if (!signedToken || !this.verifySignedToken(bucket, key, signedToken)) {
        throw new UnauthorizedStorageAccessError(
          `Unauthorized access blocked: Cannot read private bucket '${bucket}' without valid signed authorization.`
        );
      }
    }

    return obj;
  }

  /**
   * Lists objects, optionally filtered by bucket.
   */
  async listObjects(bucket?: StorageBucketType): Promise<StorageObject[]> {
    const all = Array.from(this.objects.values());
    if (!bucket) return all;
    return all.filter((o) => o.bucket === bucket);
  }

  /**
   * Deletes an object from storage.
   */
  async deleteObject(bucket: StorageBucketType, key: string): Promise<boolean> {
    return this.objects.delete(this.getCompositeKey(bucket, key));
  }

  /**
   * Clears all stored objects (used during disaster drills and test resets).
   */
  clearAllObjects(): void {
    this.objects.clear();
  }

  /**
   * Generates a short-lived presigned URL for secure access to private assets.
   */
  generatePresignedUrl(
    bucket: StorageBucketType,
    key: string,
    expiresInSeconds = 900 // 15 minutes
  ): PresignedUrlResult {
    const expiresAt = Date.now() + expiresInSeconds * 1000;
    const payload = `${bucket}::${key}::${expiresAt}`;
    const signature = crypto
      .createHmac('sha256', this.signingSecret)
      .update(payload)
      .digest('hex');

    const token = Buffer.from(JSON.stringify({ expiresAt, signature })).toString('base64');
    const url = `https://storage.ultrapie.com/${bucket}/${encodeURIComponent(key)}?token=${token}`;

    return {
      url,
      expiresAt: new Date(expiresAt).toISOString(),
    };
  }

  /**
   * Verifies the authenticity and expiration of a signed access token.
   */
  verifySignedToken(bucket: StorageBucketType, key: string, token: string): boolean {
    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
      if (!decoded.expiresAt || !decoded.signature) return false;

      // Check expiration
      if (Date.now() > decoded.expiresAt) return false;

      const payload = `${bucket}::${key}::${decoded.expiresAt}`;
      const expectedSig = crypto
        .createHmac('sha256', this.signingSecret)
        .update(payload)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(expectedSig, 'hex'),
        Buffer.from(decoded.signature, 'hex')
      );
    } catch {
      return false;
    }
  }

  /**
   * Returns the public CDN URL for verified public releases and assets.
   */
  getPublicDeliveryUrl(bucket: 'public-assets' | 'releases', key: string): string {
    return `${this.cdnBaseUrl}/${bucket}/${key}`;
  }

  /**
   * Creates an immutable backup snapshot containing full binary data, metadata,
   * and SHA-256 integrity checksums for every object.
   */
  async createBackupSnapshot(targetBucket?: StorageBucketType): Promise<StorageBackupSnapshot> {
    const snapshotId = `snap_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const timestamp = new Date().toISOString();
    const candidateObjects = Array.from(this.objects.values()).filter(
      (obj) => !targetBucket || obj.bucket === targetBucket
    );

    let totalSizeBytes = 0;
    const items: StorageBackupItem[] = candidateObjects.map((obj) => {
      const buffer = Buffer.isBuffer(obj.data) ? obj.data : Buffer.from(obj.data, 'utf-8');
      totalSizeBytes += buffer.length;
      const dataBase64 = buffer.toString('base64');
      const checksumSha256 = crypto.createHash('sha256').update(buffer).digest('hex');

      return {
        bucket: obj.bucket,
        key: obj.key,
        dataBase64,
        contentType: obj.contentType,
        metadata: obj.metadata,
        createdAt: obj.createdAt,
        checksumSha256,
      };
    });

    // Compute deterministic manifest checksum across sorted items
    const sortedSignatures = items
      .map((item) => `${item.bucket}::${item.key}::${item.checksumSha256}`)
      .sort()
      .join('\n');
    const manifestSha256 = crypto.createHash('sha256').update(sortedSignatures).digest('hex');

    return {
      id: snapshotId,
      timestamp,
      version: '1.0.0',
      totalObjects: items.length,
      totalSizeBytes,
      manifestSha256,
      items,
    };
  }

  /**
   * Verifies the cryptographic integrity of a backup snapshot.
   */
  verifySnapshotIntegrity(snapshot: StorageBackupSnapshot): boolean {
    if (!snapshot || !Array.isArray(snapshot.items)) return false;

    // Verify individual items
    for (const item of snapshot.items) {
      const buf = Buffer.from(item.dataBase64, 'base64');
      const hash = crypto.createHash('sha256').update(buf).digest('hex');
      if (hash !== item.checksumSha256) return false;
    }

    // Verify aggregate manifest
    const sortedSignatures = snapshot.items
      .map((item) => `${item.bucket}::${item.key}::${item.checksumSha256}`)
      .sort()
      .join('\n');
    const computedManifest = crypto.createHash('sha256').update(sortedSignatures).digest('hex');

    return computedManifest === snapshot.manifestSha256;
  }

  /**
   * Restores storage objects from an immutable backup snapshot with SHA-256 verification.
   */
  async restoreFromSnapshot(
    snapshot: StorageBackupSnapshot,
    options: { overwrite?: boolean } = {}
  ): Promise<StorageRestoreResult> {
    const { overwrite = true } = options;

    if (!this.verifySnapshotIntegrity(snapshot)) {
      throw new CorruptedBackupSnapshotError(
        `Disaster recovery aborted: Snapshot '${snapshot?.id}' failed SHA-256 integrity check. Manifest mismatch or data corruption detected.`
      );
    }

    let restoredCount = 0;
    let skippedCount = 0;
    let verifiedCount = 0;

    for (const item of snapshot.items) {
      const compositeKey = this.getCompositeKey(item.bucket, item.key);
      if (this.objects.has(compositeKey) && !overwrite) {
        skippedCount++;
        continue;
      }

      const buffer = Buffer.from(item.dataBase64, 'base64');
      const itemCheck = crypto.createHash('sha256').update(buffer).digest('hex');
      if (itemCheck !== item.checksumSha256) {
        throw new CorruptedBackupSnapshotError(
          `Checksum mismatch during restore on object [${item.bucket}] ${item.key}`
        );
      }

      this.objects.set(compositeKey, {
        bucket: item.bucket,
        key: item.key,
        data: buffer,
        contentType: item.contentType,
        metadata: item.metadata,
        createdAt: item.createdAt,
      });

      restoredCount++;
      verifiedCount++;
    }

    return {
      snapshotId: snapshot.id,
      restoredCount,
      skippedCount,
      verifiedCount,
      dataLossDetected: false,
      restoredAt: new Date().toISOString(),
    };
  }
}

