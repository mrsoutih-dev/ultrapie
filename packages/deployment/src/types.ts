import { DeploymentStatus } from '@ultrapie/shared';

export interface BuildJobPayload {
  deploymentId: string;
  projectId: string;
  commitSha: string;
  framework: string;
  files: Record<string, string>;
  timeoutMs?: number;
}

export interface BuildExecutionResult {
  deploymentId: string;
  commitSha: string;
  status: 'SUCCESS' | 'FAILED';
  durationMs: number;
  buildLogs: string[];
  outputFiles?: Record<string, string>;
  bundleSizeKb?: number;
  error?: string;
}

export interface ReleaseDescriptor {
  releaseId: string;
  deploymentId: string;
  projectId: string;
  storageKey: string;
  releaseUrl: string;
  commitSha: string;
  isActive: boolean;
  createdAt: string;
}
