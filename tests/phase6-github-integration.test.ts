import { describe, it, expect } from 'vitest';
import * as crypto from 'crypto';
import {
  WebhookVerifier,
  WebhookIdempotencyManager,
  GitHubSyncService,
  MockGitHubClient,
  GitConflictError,
  GitHubRepoReference,
} from '@ultrapie/github';

describe('Phase 06: GitHub App Integration & Bidirectional Sync', () => {
  const webhookSecret = 'test-github-webhook-secret-98765';
  const samplePayload = JSON.stringify({
    action: 'push',
    ref: 'refs/heads/main',
    repository: { name: 'landing-vibe', full_name: 'ultrapie-org/landing-vibe' },
  });

  describe('Webhook Signature Verification', () => {
    it('should verify genuine GitHub webhook signature', () => {
      const hmac = crypto.createHmac('sha256', webhookSecret).update(samplePayload).digest('hex');
      const signatureHeader = `sha256=${hmac}`;

      const isValid = WebhookVerifier.verifySignature(samplePayload, signatureHeader, webhookSecret);
      expect(isValid).toBe(true);
    });

    it('should reject forged or tampered webhook payload', () => {
      const hmac = crypto.createHmac('sha256', webhookSecret).update(samplePayload).digest('hex');
      const signatureHeader = `sha256=${hmac}`;

      const tamperedPayload = samplePayload + '{"hacked": true}';
      const isValid = WebhookVerifier.verifySignature(tamperedPayload, signatureHeader, webhookSecret);
      expect(isValid).toBe(false);
    });

    it('should reject signature signed with foreign secret', () => {
      const foreignHmac = crypto.createHmac('sha256', 'wrong-secret').update(samplePayload).digest('hex');
      const signatureHeader = `sha256=${foreignHmac}`;

      const isValid = WebhookVerifier.verifySignature(samplePayload, signatureHeader, webhookSecret);
      expect(isValid).toBe(false);
    });
  });

  describe('Webhook Idempotency & Replay Protection', () => {
    it('should process new event and block identical replay delivery IDs', () => {
      const manager = new WebhookIdempotencyManager();
      const deliveryId = '72d3162e-cc78-11e3-81ab-4c9367dc09d2';

      expect(manager.recordEventIfNew(deliveryId)).toBe(true);
      // Attempt replay
      expect(manager.recordEventIfNew(deliveryId)).toBe(false);
    });
  });

  describe('Bi-directional Commit Sync & Conflict Detection', () => {
    const mockRepo: GitHubRepoReference = {
      owner: 'ultrapie-org',
      repo: 'landing-vibe',
      defaultBranch: 'main',
      installationId: 123456,
    };

    it('should push commit successfully and return immutable SHA', async () => {
      const mockClient = new MockGitHubClient();
      const syncService = new GitHubSyncService(mockClient);

      const initialHead = await mockClient.getBranchHeadSha(mockRepo, 'main');

      const result = await syncService.pushCommit({
        repo: mockRepo,
        branch: 'main',
        message: 'feat: add pricing component via Ultrapie Studio',
        expectedParentSha: initialHead,
        files: [
          { path: 'src/components/Pricing.tsx', content: 'export const Pricing = () => null;' },
        ],
      });

      expect(result.commitSha).toHaveLength(40);
      expect(result.filesChanged).toBe(1);
      expect(result.branch).toBe('main');

      // Verify branch head was advanced
      const updatedHead = await mockClient.getBranchHeadSha(mockRepo, 'main');
      expect(updatedHead).toBe(result.commitSha);
    });

    it('should block push and throw GitConflictError if external changes detected', async () => {
      const mockClient = new MockGitHubClient();
      const syncService = new GitHubSyncService(mockClient);

      const staleSha = 'stale-sha-999999999999999999999999999999999999';

      await expect(
        syncService.pushCommit({
          repo: mockRepo,
          branch: 'main',
          message: 'attempt push with stale parent',
          expectedParentSha: staleSha, // Does not match mock client head
          files: [{ path: 'src/App.tsx', content: 'conflict code' }],
        })
      ).rejects.toThrow(GitConflictError);
    });
  });
});
