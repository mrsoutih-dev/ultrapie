import * as crypto from 'crypto';
import {
  GitHubRepoReference,
  PushCommitOptions,
  PushCommitResult,
} from './types.js';

export class GitConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GitConflictError';
  }
}

export interface IGitHubClient {
  getBranchHeadSha(repo: GitHubRepoReference, branch: string): Promise<string>;
  createCommit(options: PushCommitOptions): Promise<PushCommitResult>;
}

export class GitHubSyncService {
  constructor(private client: IGitHubClient) {}

  /**
   * Pushes a batch of files committed by user/AI to GitHub.
   * Performs conflict detection against remote branch head before committing.
   */
  async pushCommit(options: PushCommitOptions): Promise<PushCommitResult> {
    if (!options.files || options.files.length === 0) {
      throw new Error('Cannot create an empty commit without files');
    }

    // 1. Fetch current remote branch head
    const currentRemoteSha = await this.client.getBranchHeadSha(options.repo, options.branch);

    // 2. Conflict Detection: ensure local base matches remote head
    if (options.expectedParentSha && options.expectedParentSha !== currentRemoteSha) {
      throw new GitConflictError(
        `Remote branch '${options.branch}' in ${options.repo.owner}/${options.repo.repo} has new external commits (Remote: ${currentRemoteSha}, Local expected: ${options.expectedParentSha}). Please pull before pushing.`
      );
    }

    // 3. Execute atomic commit via GitHub client
    return this.client.createCommit(options);
  }
}
