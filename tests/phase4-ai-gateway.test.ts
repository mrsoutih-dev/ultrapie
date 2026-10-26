import { describe, it, expect } from 'vitest';
import {
  PatchValidator,
  PatchValidationError,
  TokenMeter,
  AICodeOrchestrator,
  MockAIProvider,
  MultiFilePatchSchema,
} from '@ultrapie/ai-core';
import { FilePatch } from '@ultrapie/shared';

describe('Phase 04: AI Gateway & Gemini Engine', () => {
  describe('Patch Security & Validation', () => {
    it('should approve valid multi-file relative patches', () => {
      const validPatches: FilePatch[] = [
        { path: 'src/App.tsx', operation: 'create', content: 'export default () => <div>App</div>;' },
        { path: 'src/index.css', operation: 'create', content: '@tailwind base;' },
        { path: 'public/favicon.ico', operation: 'delete' },
      ];

      expect(() => PatchValidator.validate(validPatches)).not.toThrow();
    });

    it('should reject path traversal exploits (../)', () => {
      const maliciousPatches: FilePatch[] = [
        { path: '../../etc/passwd', operation: 'update', content: 'root:x:0:0' },
      ];

      expect(() => PatchValidator.validate(maliciousPatches)).toThrow(PatchValidationError);
      expect(() => PatchValidator.validate(maliciousPatches)).toThrow(/Path traversal/);
    });

    it('should reject absolute paths', () => {
      const maliciousPatches: FilePatch[] = [
        { path: '/var/www/html/index.html', operation: 'create', content: 'hacked' },
      ];

      expect(() => PatchValidator.validate(maliciousPatches)).toThrow(PatchValidationError);
    });

    it('should reject modifications to .env and secret files', () => {
      const forbiddenFiles = ['.env', '.env.local', '.env.production', 'id_rsa', 'ssl.key', 'cert.pem'];

      for (const file of forbiddenFiles) {
        const patch: FilePatch[] = [{ path: file, operation: 'create', content: 'SECRET=true' }];
        expect(() => PatchValidator.validate(patch)).toThrow(PatchValidationError);
        expect(() => PatchValidator.validate(patch)).toThrow(/forbidden file/);
      }
    });

    it('should correctly apply creates, updates, and deletes to virtual files', () => {
      const initial = {
        'src/App.tsx': 'old app',
        'src/OldComponent.tsx': 'to be deleted',
      };

      const patches: FilePatch[] = [
        { path: 'src/App.tsx', operation: 'update', content: 'new app' },
        { path: 'src/NewFeature.tsx', operation: 'create', content: 'feature code' },
        { path: 'src/OldComponent.tsx', operation: 'delete' },
      ];

      const result = PatchValidator.applyPatches(initial, patches);

      expect(result['src/App.tsx']).toBe('new app');
      expect(result['src/NewFeature.tsx']).toBe('feature code');
      expect(result['src/OldComponent.tsx']).toBeUndefined();
    });
  });

  describe('Token Metering & Quotas', () => {
    it('should accurately calculate token usage and USD cost', () => {
      const usage = TokenMeter.calculateUsage(100_000, 50_000, 'gemini-2.5-flash');
      expect(usage.promptTokens).toBe(100_000);
      expect(usage.candidateTokens).toBe(50_000);
      expect(usage.totalTokens).toBe(150_000);
      // prompt: 0.1 * $0.15 = 0.015, candidate: 0.05 * $0.60 = 0.030, total = 0.045
      expect(usage.estimatedCostUsd).toBeCloseTo(0.045, 3);
    });

    it('should enforce quota limits when budget is exceeded', () => {
      const limit = 500_000;
      expect(TokenMeter.isQuotaExceeded(400_000, 50_000, limit)).toBe(false);
      expect(TokenMeter.isQuotaExceeded(480_000, 30_000, limit)).toBe(true);
    });
  });

  describe('AI Code Orchestration & Repair', () => {
    it('should act as a chatbot first for conversational queries without modifying files', async () => {
      const mockProvider = new MockAIProvider();
      const orchestrator = new AICodeOrchestrator(mockProvider);

      const result = await orchestrator.processUserPrompt('Hello, how does this platform work?', {
        projectId: 'proj_demo_1',
      });

      expect(result.isCodeAction).toBe(false);
      expect(result.patches).toHaveLength(0);
      expect(result.reply).toContain('Hello!');
    });

    it('should generate multi-file patch plan from natural language prompt', async () => {
      const mockProvider = new MockAIProvider();
      const orchestrator = new AICodeOrchestrator(mockProvider);

      const result = await orchestrator.processUserPrompt('Create a modern landing page for a SaaS app', {
        projectId: 'proj_demo_1',
        framework: 'vite-react',
      });

      expect(result.summary).toBeDefined();
      expect(result.patches.length).toBeGreaterThanOrEqual(2);
      expect(result.updatedFiles['src/App.tsx']).toContain('Hello Ultrapie');
      expect(result.updatedFiles['src/components/Hero.tsx']).toContain('Hero Content');
      expect(result.usage.totalTokens).toBeGreaterThan(0);
    });

    it('should handle automated self-repair on build errors', async () => {
      const mockProvider = new MockAIProvider({
        summary: 'Fixed missing TypeScript import and syntax error.',
        patches: [
          {
            path: 'src/App.tsx',
            operation: 'update',
            content: "import React from 'react'; export default function App() { return <div>Fixed</div>; }",
          },
        ],
      });

      const orchestrator = new AICodeOrchestrator(mockProvider);
      const repairResult = await orchestrator.repairBuildErrors(
        "TS2304: Cannot find name 'React'",
        { projectId: 'proj_demo_1' }
      );

      expect(repairResult.summary).toContain('Fixed');
      expect(repairResult.updatedFiles['src/App.tsx']).toContain('Fixed');
    });

    it('should support streaming token output for real-time web studio', async () => {
      const mockProvider = new MockAIProvider();
      const chunks: string[] = [];

      for await (const chunk of mockProvider.stream('Generate preview')) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks.join('')).toBe('Hello! I am your AI assistant.');
    });
  });
});
