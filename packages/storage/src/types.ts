export type StorageBucketType =
  | 'private-sources'
  | 'quarantine'
  | 'public-assets'
  | 'releases';

export interface StorageObject {
  bucket: StorageBucketType;
  key: string;
  data: Buffer | string;
  contentType: string;
  metadata?: Record<string, string>;
  createdAt: string;
}

export interface PresignedUrlResult {
  url: string;
  expiresAt: string;
}

export interface StorageBackupItem {
  bucket: StorageBucketType;
  key: string;
  dataBase64: string;
  contentType: string;
  metadata?: Record<string, string>;
  createdAt: string;
  checksumSha256: string;
}

export interface StorageBackupSnapshot {
  id: string;
  timestamp: string;
  version: string;
  totalObjects: number;
  totalSizeBytes: number;
  manifestSha256: string;
  items: StorageBackupItem[];
}

export interface StorageRestoreResult {
  snapshotId: string;
  restoredCount: number;
  skippedCount: number;
  verifiedCount: number;
  dataLossDetected: boolean;
  restoredAt: string;
}

