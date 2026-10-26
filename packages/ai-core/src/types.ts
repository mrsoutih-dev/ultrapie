import { FilePatch, AIUsageReport } from '@ultrapie/shared';
import { z } from 'zod';

export interface AIProviderCapabilities {
  supportsStreaming: boolean;
  supportsStructuredOutput: boolean;
  supportsToolCalling: boolean;
  maxContextTokens: number;
}

export interface AIRequestContext {
  projectId: string;
  framework?: string;
  manifest?: Record<string, unknown>;
  fileIndex?: Array<{ path: string; summary?: string }>;
  existingFiles?: Record<string, string>;
}

export interface AIGenerationResult {
  text: string;
  patches?: FilePatch[];
  usage: AIUsageReport;
}

export interface IAIProvider {
  readonly providerName: string;
  capabilities(): AIProviderCapabilities;
  healthCheck(): Promise<boolean>;
  generate(prompt: string, context?: AIRequestContext): Promise<AIGenerationResult>;
  stream(
    prompt: string,
    context?: AIRequestContext,
    onChunk?: (chunk: string) => void
  ): AsyncIterable<string>;
  structuredOutput<T>(
    prompt: string,
    schema: z.ZodType<T>,
    context?: AIRequestContext
  ): Promise<{ data: T; usage: AIUsageReport }>;
}
