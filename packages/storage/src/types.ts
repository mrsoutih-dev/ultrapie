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
