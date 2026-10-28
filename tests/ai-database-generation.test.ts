import { describe, it, expect } from 'vitest';
import {
  isCodeGenerationPrompt,
  generateFallbackResponse,
} from '../apps/web/src/lib/gemini-fallback-engine';

describe('AI Studio Fullstack Database-Aware Generation (Option 2)', () => {
  it('should identify database-related app generation prompts as code generation', () => {
    expect(isCodeGenerationPrompt('build an app with postgresql database')).toBe(true);
    expect(isCodeGenerationPrompt('create a crud dashboard with database')).toBe(true);
    expect(isCodeGenerationPrompt('generate fullstack inventory app with prisma')).toBe(true);
    expect(isCodeGenerationPrompt('what is a database?')).toBe(false); // pure conceptual question
  });

  it('should generate complete database schema and interactive CRUD application', () => {
    const result = generateFallbackResponse('build an inventory app with database');

    expect(result.chatText).toContain('Fullstack Database-Backed Application');
    expect(result.files['src/App.tsx']).toBeDefined();
    expect(result.files['prisma/schema.prisma']).toBeDefined();
    expect(result.files['src/lib/db.ts']).toBeDefined();

    const appCode = result.files['src/App.tsx'];
    expect(appCode).toContain('DATABASE_URL');
    expect(appCode).toContain('PostgreSQL 16.3 Connected');
    expect(appCode).toContain('handleCreate');
    expect(appCode).toContain('handleDelete');
    expect(appCode).toContain('handleRunQuery');

    const schema = result.files['prisma/schema.prisma'];
    expect(schema).toContain('provider = "postgresql"');
    expect(schema).toContain('model Record');
  });
});
