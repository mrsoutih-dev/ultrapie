import { NextRequest, NextResponse } from 'next/server';
import { AICodeOrchestrator, MockAIProvider } from '@ultrapie/ai-core';
import { GeminiProvider } from '@ultrapie/ai-gemini';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, existingFiles, model, chatHistory } = body;

    // Check for user-provided API key from request body, header, or env
    const headerKey = req.headers.get('x-gemini-api-key');
    const apiKey =
      body.apiKey ||
      headerKey ||
      process.env.GEMINI_API_KEY ||
      '';

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Valid prompt is required' }, { status: 400 });
    }

    const selectedModel = model || 'gemini-flash-latest';
    const provider = apiKey
      ? new GeminiProvider({ apiKey, defaultModel: selectedModel })
      : new MockAIProvider();

    const orchestrator = new AICodeOrchestrator(provider);

    const result = await orchestrator.processUserPrompt(prompt, {
      projectId: 'studio-active',
      existingFiles: existingFiles || {},
      framework: 'vite-react',
      chatHistory: chatHistory || [],
    });

    return NextResponse.json({
      reply: result.reply,
      isCodeAction: result.isCodeAction,
      summary: result.summary,
      patches: result.patches,
      usage: result.usage,
    });
  } catch (error: any) {
    console.error('Studio generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal AI generation failure' },
      { status: 500 }
    );
  }
}
