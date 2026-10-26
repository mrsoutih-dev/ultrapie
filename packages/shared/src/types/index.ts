export type UserRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

export type PlanTier = 'FREE' | 'STARTER' | 'PRO' | 'BUSINESS';

export type DeploymentStatus =
  | 'QUEUED'
  | 'BUILDING'
  | 'FAILED'
  | 'READY'
  | 'PROMOTING'
  | 'LIVE'
  | 'CANCELLED';

export type AssetScanStatus = 'PENDING' | 'CLEAN' | 'INFECTED' | 'QUARANTINED';

export interface FilePatch {
  path: string;
  operation: 'create' | 'update' | 'delete';
  content?: string;
  diff?: string;
}

export interface ProjectManifest {
  name: string;
  framework: 'vite-react' | 'nextjs' | 'vanilla-html';
  buildCommand: string;
  outputDirectory: string;
  entryPoint: string;
}

export interface AIUsageReport {
  promptTokens: number;
  candidateTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
}
