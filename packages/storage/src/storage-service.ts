import * as crypto from 'crypto';
import { StorageBucketType, StorageObject, PresignedUrlResult } from './types.js';

export class UnauthorizedStorageAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedStorageAccessError';
  }
}

export class StorageService {
  private objects: Map<string, StorageObject> = new Map();
  private signingSecret: string;
  private cdnBaseUrl: string;

  constructor(options: { signingSecret?: string; cdnBaseUrl?: string } = {}) {
    this.signingSecret = options.signingSecret || 'ultrapie-storage-signing-secret-dev';
    this.cdnBaseUrl = options.cdnBaseUrl || 'https://assets.ultrapie.com';
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
}
