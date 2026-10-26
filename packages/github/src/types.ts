export interface GitHubAppConfig {
  appId: string;
  privateKey: string;
  webhookSecret: string;
  clientId?: string;
  clientSecret?: string;
}

export interface GitHubRepoReference {
  owner: string;
  repo: string;
  defaultBranch: string;
  installationId: number;
}

export interface CommitFilePayload {
  path: string;
  content: string;
}

export interface PushCommitOptions {
  repo: GitHubRepoReference;
  branch: string;
  message: string;
  files: CommitFilePayload[];
  expectedParentSha?: string;
  author?: {
    name: string;
    email: string;
  };
}

export interface PushCommitResult {
  commitSha: string;
  branch: string;
  treeSha: string;
  filesChanged: number;
  url: string;
}

export interface WebhookEventPayload {
  id: string;
  event: string;
  signature: string;
  rawBody: string;
  timestamp: string;
}
