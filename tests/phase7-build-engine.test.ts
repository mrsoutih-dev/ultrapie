import { describe, it, expect } from 'vitest';
import { BuildSandboxRunner, ReleaseManager } from '@ultrapie/deployment';

describe('Phase 07: Execution Plane & Build Engine', () => {
  const runner = new BuildSandboxRunner();
  const sampleProjectId = 'proj_landing_vibe_01';

  const validFiles: Record<string, string> = {
    'src/App.tsx': 'export default function App() { return <h1>Ultrapie</h1>; }',
    'src/index.css': 'body { background: #000; }',
    'index.html': '<!DOCTYPE html><html><body><div id="root"></div></body></html>',
  };

  describe('Isolated Sandbox Build Execution', () => {
    it('should build static project in unprivileged sandbox and output bundle', async () => {
      const result = await runner.executeBuild({
        deploymentId: 'dep_1001',
        projectId: sampleProjectId,
        commitSha: 'c0ffee1234567890abcdef1234567890abcdef12',
        framework: 'vite-react',
        files: validFiles,
      });

      expect(result.status).toBe('SUCCESS');
      expect(result.buildLogs.length).toBeGreaterThan(3);
      expect(result.outputFiles).toBeDefined();
      expect(result.outputFiles?.['index.html']).toBeDefined();
      expect(result.bundleSizeKb).toBeGreaterThan(0);
    });

    it('should fail safely if required entry point is missing', async () => {
      const brokenFiles = { 'src/other.txt': 'no code here' };
      const result = await runner.executeBuild({
        deploymentId: 'dep_1002',
        projectId: sampleProjectId,
        commitSha: 'deadbeef1234567890abcdef1234567890abcdef',
        framework: 'vite-react',
        files: brokenFiles,
      });

      expect(result.status).toBe('FAILED');
      expect(result.error).toContain('Missing required entrypoint');
      expect(result.outputFiles).toBeUndefined();
    });

    it('should capture compiler errors without crashing worker', async () => {
      const syntaxErrorFiles = {
        'src/App.tsx': 'export default function App() { SIMULATE_COMPILE_ERROR }',
      };
      const result = await runner.executeBuild({
        deploymentId: 'dep_1003',
        projectId: sampleProjectId,
        commitSha: 'badd00d1234567890abcdef1234567890abcdef',
        framework: 'vite-react',
        files: syntaxErrorFiles,
      });

      expect(result.status).toBe('FAILED');
      expect(result.error).toContain('SyntaxError');
    });
  });

  describe('Immutable Releases, Promotion & Safe Rollback', () => {
    it('should create preview release and promote to production', async () => {
      const releaseManager = new ReleaseManager();

      const buildResult = await runner.executeBuild({
        deploymentId: 'dep_v1',
        projectId: sampleProjectId,
        commitSha: '1111111111111111111111111111111111111111',
        framework: 'vite-react',
        files: validFiles,
      });

      const release = releaseManager.processBuildOutcome(sampleProjectId, buildResult);
      expect(release).not.toBeNull();
      expect(release?.releaseUrl).toContain('https://preview-dep_v1.ultrapie.app');
      expect(release?.isActive).toBe(false);

      // Promote to production
      const liveRelease = releaseManager.promoteReleaseToProduction(sampleProjectId, release!.releaseId);
      expect(liveRelease.isActive).toBe(true);

      const currentActive = releaseManager.getActiveRelease(sampleProjectId);
      expect(currentActive?.releaseId).toBe(release?.releaseId);
    });

    it('CRITICAL RULE: A failed deployment must NEVER replace the active production release', async () => {
      const releaseManager = new ReleaseManager();

      // 1. First deployment: successful V1 promoted to production
      const goodBuild = await runner.executeBuild({
        deploymentId: 'dep_v1_working',
        projectId: sampleProjectId,
        commitSha: 'aaaa111111111111111111111111111111111111',
        framework: 'vite-react',
        files: validFiles,
      });
      const v1Release = releaseManager.processBuildOutcome(sampleProjectId, goodBuild, true);
      expect(releaseManager.getActiveRelease(sampleProjectId)?.releaseId).toBe(v1Release?.releaseId);

      // 2. Second deployment: broken build
      const failedBuild = await runner.executeBuild({
        deploymentId: 'dep_v2_broken',
        projectId: sampleProjectId,
        commitSha: 'bbbb222222222222222222222222222222222222',
        framework: 'vite-react',
        files: { 'src/App.tsx': 'SIMULATE_COMPILE_ERROR' },
      });
      const v2Release = releaseManager.processBuildOutcome(sampleProjectId, failedBuild);
      expect(v2Release).toBeNull(); // No release created for failed build

      // 3. Verify V1 is still 100% LIVE and untouched
      const stillActive = releaseManager.getActiveRelease(sampleProjectId);
      expect(stillActive?.releaseId).toBe(v1Release?.releaseId);
      expect(stillActive?.isActive).toBe(true);
    });

    it('should support instant one-click rollback to prior release', async () => {
      const releaseManager = new ReleaseManager();

      // Deploy V1
      const buildV1 = await runner.executeBuild({
        deploymentId: 'dep_v1',
        projectId: sampleProjectId,
        commitSha: '1111111111111111111111111111111111111111',
        framework: 'vite-react',
        files: validFiles,
      });
      const v1 = releaseManager.processBuildOutcome(sampleProjectId, buildV1, true);

      // Deploy V2
      const buildV2 = await runner.executeBuild({
        deploymentId: 'dep_v2',
        projectId: sampleProjectId,
        commitSha: '2222222222222222222222222222222222222222',
        framework: 'vite-react',
        files: validFiles,
      });
      const v2 = releaseManager.processBuildOutcome(sampleProjectId, buildV2, true);
      expect(releaseManager.getActiveRelease(sampleProjectId)?.releaseId).toBe(v2?.releaseId);

      // Instant rollback to V1
      const rolledBack = releaseManager.rollbackToRelease(sampleProjectId, v1!.releaseId);
      expect(rolledBack.releaseId).toBe(v1?.releaseId);
      expect(rolledBack.isActive).toBe(true);
      expect(releaseManager.getActiveRelease(sampleProjectId)?.releaseId).toBe(v1?.releaseId);
    });
  });
});
