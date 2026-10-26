import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@ultrapie/shared': path.resolve(import.meta.dirname, './packages/shared/src/index.ts'),
      '@ultrapie/ai-core': path.resolve(import.meta.dirname, './packages/ai-core/src/index.ts'),
      '@ultrapie/ai-gemini': path.resolve(import.meta.dirname, './packages/ai-gemini/src/index.ts'),
      '@ultrapie/auth': path.resolve(import.meta.dirname, './packages/auth/src/index.ts'),
      '@ultrapie/github': path.resolve(import.meta.dirname, './packages/github/src/index.ts'),
      '@ultrapie/deployment': path.resolve(import.meta.dirname, './packages/deployment/src/index.ts'),
      '@ultrapie/storage': path.resolve(import.meta.dirname, './packages/storage/src/index.ts'),
      '@ultrapie/domains': path.resolve(import.meta.dirname, './packages/domains/src/index.ts'),
      '@ultrapie/security': path.resolve(import.meta.dirname, './packages/security/src/index.ts'),
      '@ultrapie/database': path.resolve(import.meta.dirname, './database/src/index.ts'),
    },
  },
});
