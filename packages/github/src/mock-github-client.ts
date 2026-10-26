import * as crypto from 'crypto';
import { IGitHubClient } from './sync-service.js';
import { GitHubRepoReference, PushCommitOptions, PushCommitResult } from './types.js';

export class MockGitHubClient implements IGitHubClient {
  public branchHeads: Record<string, string> = {
    main: 'a1b2c3d4e5f60718293a4b5c6d7e8f9012345678',
  };

  public commitsLog: PushCommitResult[] = [];

  async getBranchHeadSha(repo: GitHubRepoReference, branch: string): Promise<string> {
    return this.branchHeads[branch] || 'initial-base-sha-000000000000000000000';
  }

  async createCommit(options: PushCommitOptions): Promise<PushCommitResult> {
    const randomHex = crypto.randomBytes(20).toString('hex');
    const newCommit: PushCommitResult = {
      commitSha: randomHex,
      branch: options.branch,
      treeSha: crypto.randomBytes(20).toString('hex'),
      filesChanged: options.files.length,
      url: `https://github.com/${options.repo.owner}/${options.repo.repo}/commit/${randomHex}`,
    };

    // Advance mock branch head
    this.branchHeads[options.branch] = randomHex;
    this.commitsLog.push(newCommit);

    return newCommit;
  }
}
