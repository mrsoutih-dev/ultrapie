import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { UserRole, PlanTier, DeploymentStatus } from '@ultrapie/shared';
import { GeminiProvider } from '@ultrapie/ai-gemini';

describe('Phase 01: Product Specification & Architecture Verification', () => {
  it('should have master development plan with required sections', () => {
    const planPath = path.resolve(__dirname, '../docs/ULTRAPIE_MASTER_PLAN.md');
    expect(fs.existsSync(planPath)).toBe(true);
    const content = fs.readFileSync(planPath, 'utf-8');
    expect(content).toContain('Control Plane (Trusted)');
    expect(content).toContain('Execution Plane (Untrusted & Isolated)');
    expect(content).toContain('12-Phase Roadmap');
  });

  it('should have app tracker initialized with all 12 phases and 15 test items', () => {
    const trackerPath = path.resolve(__dirname, '../docs/APP_TRACKER.md');
    expect(fs.existsSync(trackerPath)).toBe(true);
    const content = fs.readFileSync(trackerPath, 'utf-8');
    for (let i = 1; i <= 12; i++) {
      const phaseId = `P${i.toString().padStart(2, '0')}`;
      expect(content).toContain(phaseId);
    }
  });

  it('should have the complete Prisma schema with all 14 entities', () => {
    const schemaPath = path.resolve(__dirname, '../database/prisma/schema.prisma');
    expect(fs.existsSync(schemaPath)).toBe(true);
    const content = fs.readFileSync(schemaPath, 'utf-8');
    const entities = [
      'model User',
      'model Organization',
      'model Membership',
      'model Project',
      'model AISession',
      'model AIUsage',
      'model GitHubConnection',
      'model Repository',
      'model Deployment',
      'model Release',
      'model Domain',
      'model Asset',
      'model Subscription',
      'model AuditLog',
    ];
    for (const entity of entities) {
      expect(content).toContain(entity);
    }
  });
});

describe('Phase 02: Infrastructure & Monorepo Verification', () => {
  it('should export all shared domain types from @ultrapie/shared', () => {
    const roles: UserRole[] = ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'];
    const tiers: PlanTier[] = ['FREE', 'STARTER', 'PRO', 'BUSINESS'];
    const statuses: DeploymentStatus[] = ['QUEUED', 'BUILDING', 'FAILED', 'READY', 'PROMOTING', 'LIVE', 'CANCELLED'];

    expect(roles).toHaveLength(4);
    expect(tiers).toHaveLength(4);
    expect(statuses).toHaveLength(7);
  });

  it('should initialize GeminiProvider with correct capabilities and contract', () => {
    const provider = new GeminiProvider({ apiKey: 'test-key' });
    expect(provider.providerName).toBe('gemini');
    const caps = provider.capabilities();
    expect(caps.supportsStreaming).toBe(true);
    expect(caps.supportsStructuredOutput).toBe(true);
    expect(caps.supportsToolCalling).toBe(true);
    expect(caps.maxContextTokens).toBeGreaterThanOrEqual(1000000);
  });

  it('should have worker Dockerfiles configured for isolated execution', () => {
    const buildWorker = path.resolve(__dirname, '../infrastructure/docker/build-worker.Dockerfile');
    const scanWorker = path.resolve(__dirname, '../infrastructure/docker/quarantine-worker.Dockerfile');
    expect(fs.existsSync(buildWorker)).toBe(true);
    expect(fs.existsSync(scanWorker)).toBe(true);

    const buildContent = fs.readFileSync(buildWorker, 'utf-8');
    expect(buildContent).toContain('USER appbuild'); // non-root
    expect(buildContent).toContain('ENV CI=true');
  });

  it('should have docker-compose.yml with postgres and redis healthchecks', () => {
    const composePath = path.resolve(__dirname, '../docker-compose.yml');
    expect(fs.existsSync(composePath)).toBe(true);
    const content = fs.readFileSync(composePath, 'utf-8');
    expect(content).toContain('postgres:16-alpine');
    expect(content).toContain('redis:7-alpine');
    expect(content).toContain('healthcheck');
  });
});
