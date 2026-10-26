import { z } from 'zod';
import { IAIProvider, AIProviderCapabilities, AIRequestContext, AIGenerationResult } from './types.js';
import { AIUsageReport } from '@ultrapie/shared';

export class MockAIProvider implements IAIProvider {
  public readonly providerName = 'mock-provider';

  constructor(
    private mockPatchesResponse?: {
      reply?: string;
      summary?: string;
      isCodeAction?: boolean;
      patches?: Array<{ path: string; operation: 'create' | 'update' | 'delete'; content?: string }>;
    }
  ) {}

  capabilities(): AIProviderCapabilities {
    return {
      supportsStreaming: true,
      supportsStructuredOutput: true,
      supportsToolCalling: true,
      maxContextTokens: 100000,
    };
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }

  async generate(prompt: string, context?: AIRequestContext): Promise<AIGenerationResult> {
    return {
      text: 'Mock generation response',
      usage: {
        promptTokens: 120,
        candidateTokens: 350,
        totalTokens: 470,
        estimatedCostUsd: 0.0001,
      },
    };
  }

  async *stream(
    prompt: string,
    context?: AIRequestContext,
    onChunk?: (chunk: string) => void
  ): AsyncIterable<string> {
    const chunks = ['Hello! ', 'I am ', 'your AI ', 'assistant.'];
    for (const chunk of chunks) {
      if (onChunk) onChunk(chunk);
      yield chunk;
    }
  }

  async structuredOutput<T>(
    prompt: string,
    schema: z.ZodType<T>,
    context?: AIRequestContext
  ): Promise<{ data: T; usage: AIUsageReport }> {
    let defaultData: any = this.mockPatchesResponse;

    if (!defaultData) {
      // Extract ONLY the user input line if full prompt with system instructions was passed
      let userInput = prompt;
      if (prompt.includes('CURRENT USER INPUT:')) {
        const afterMarker = prompt.split('CURRENT USER INPUT:')[1] || '';
        userInput = afterMarker.split('\n\n')[0].trim();
      }

      const lowerInput = userInput.toLowerCase();
      const isCodingOrder =
        lowerInput.includes('add') ||
        lowerInput.includes('create') ||
        lowerInput.includes('build') ||
        lowerInput.includes('modify') ||
        lowerInput.includes('delete') ||
        lowerInput.includes('refactor') ||
        lowerInput.includes('landing page');

      if (!isCodingOrder) {
        defaultData = {
          reply: 'Hello! I am your AI assistant. I can chat with you, discuss ideas, or write code when you are ready.',
          isCodeAction: false,
          patches: [],
        };
      } else {
        defaultData = {
          reply: 'I have generated the requested components for your application.',
          isCodeAction: true,
          patches: [
            {
              path: 'src/App.tsx',
              operation: 'create',
              content: 'export default function App() { return <h1>Hello Ultrapie</h1>; }',
            },
            {
              path: 'src/components/Hero.tsx',
              operation: 'create',
              content: 'export function Hero() { return <section>Hero Content</section>; }',
            },
          ],
        };
      }
    } else {
      if (!defaultData.reply) {
        defaultData.reply = defaultData.summary || 'Operation complete.';
      }
      if (defaultData.isCodeAction === undefined) {
        defaultData.isCodeAction = Boolean(defaultData.patches && defaultData.patches.length > 0);
      }
      if (!defaultData.patches) {
        defaultData.patches = [];
      }
    }

    const parsed = schema.parse(defaultData);

    return {
      data: parsed,
      usage: {
        promptTokens: 450,
        candidateTokens: 920,
        totalTokens: 1370,
        estimatedCostUsd: 0.00025,
      },
    };
  }
}
