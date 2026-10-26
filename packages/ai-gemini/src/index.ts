import { GoogleGenAI } from '@google/genai';
import {
  IAIProvider,
  AIProviderCapabilities,
  AIRequestContext,
  AIGenerationResult,
} from '@ultrapie/ai-core';
import { z } from 'zod';

export interface GeminiProviderOptions {
  apiKey?: string;
  defaultModel?: string;
}

export class GeminiProvider implements IAIProvider {
  public readonly providerName = 'gemini';
  private client: GoogleGenAI;
  private defaultModel: string;
  private fallbackModels: string[];

  constructor(options: GeminiProviderOptions = {}) {
    const apiKey = options.apiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ GEMINI_API_KEY is not set. GeminiProvider will fail live calls.');
    }
    this.client = new GoogleGenAI({ apiKey: apiKey || 'dummy-key' });
    this.defaultModel = options.defaultModel || 'gemini-flash-latest';
    this.fallbackModels = [
      this.defaultModel,
      'gemini-flash-latest',
      'gemini-flash-lite-latest',
      'gemini-3.5-flash',
      'gemini-3.8-flash',
      'gemma-4-26b-a4b-it',
    ];
  }

  capabilities(): AIProviderCapabilities {
    return {
      supportsStreaming: true,
      supportsStructuredOutput: true,
      supportsToolCalling: true,
      maxContextTokens: 1000000,
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      return Boolean(process.env.GEMINI_API_KEY);
    } catch {
      return false;
    }
  }

  private async callWithFallback(fn: (model: string) => Promise<any>): Promise<any> {
    let lastError: any = null;
    const tried = new Set<string>();

    for (const model of this.fallbackModels) {
      if (tried.has(model)) continue;
      tried.add(model);
      try {
        return await fn(model);
      } catch (err: any) {
        lastError = err;
        console.warn(`[GeminiProvider] Model ${model} failed, trying fallback:`, err.message?.substring(0, 100));
      }
    }

    throw lastError || new Error('All Gemini model candidates failed');
  }

  async generate(prompt: string, context?: AIRequestContext): Promise<AIGenerationResult> {
    const response = await this.callWithFallback((model) =>
      this.client.models.generateContent({
        model,
        contents: prompt,
      })
    );

    const text = response.text || '';
    const usage = response.usageMetadata;

    return {
      text,
      usage: {
        promptTokens: usage?.promptTokenCount ?? 0,
        candidateTokens: usage?.candidatesTokenCount ?? 0,
        totalTokens: usage?.totalTokenCount ?? 0,
        estimatedCostUsd: 0.0,
      },
    };
  }

  async *stream(
    prompt: string,
    context?: AIRequestContext,
    onChunk?: (chunk: string) => void
  ): AsyncIterable<string> {
    const streamResponse = await this.client.models.generateContentStream({
      model: this.defaultModel,
      contents: prompt,
    });

    for await (const chunk of streamResponse) {
      const text = chunk.text || '';
      if (text) {
        if (onChunk) onChunk(text);
        yield text;
      }
    }
  }

  async structuredOutput<T>(
    prompt: string,
    schema: z.ZodType<T>,
    context?: AIRequestContext
  ): Promise<{ data: T; usage: { promptTokens: number; candidateTokens: number; totalTokens: number; estimatedCostUsd: number } }> {
    const response = await this.callWithFallback((model) =>
      this.client.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      })
    );

    let rawJson = response.text || '{}';
    // Clean potential markdown fences (```json ... ```)
    rawJson = rawJson.trim().replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();

    // If there is surrounding conversational text, extract the outermost JSON object
    const firstBrace = rawJson.indexOf('{');
    const lastBrace = rawJson.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      rawJson = rawJson.substring(firstBrace, lastBrace + 1);
    }

    let parsed: T;
    try {
      parsed = schema.parse(JSON.parse(rawJson));
    } catch (parseErr) {
      console.warn('Gemini raw output parse retry, raw was:', rawJson.substring(0, 300));
      // Fallback: try parsing as simple reply
      parsed = schema.parse({
        reply: response.text || 'I have processed your request.',
        isCodeAction: false,
        patches: [],
      });
    }
    const usage = response.usageMetadata;

    return {
      data: parsed,
      usage: {
        promptTokens: usage?.promptTokenCount ?? 0,
        candidateTokens: usage?.candidatesTokenCount ?? 0,
        totalTokens: usage?.totalTokenCount ?? 0,
        estimatedCostUsd: 0.0,
      },
    };
  }
}
