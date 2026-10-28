import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { generateConversationalResponse } from '@/lib/gemini-fallback-engine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      contents,
      messages,
      systemInstruction,
      model = 'gemini-3-flash-preview',
      temperature = 0.7,
      topP = 0.95,
      maxOutputTokens = 2048,
    } = body;

    const headerKey = req.headers.get('x-gemini-api-key');
    const apiKey =
      body.apiKey ||
      headerKey ||
      process.env.GEMINI_API_KEY ||
      '';

    const rawList = contents || messages || [];
    if (!Array.isArray(rawList) || rawList.length === 0) {
      return NextResponse.json({ error: 'Valid messages or contents array is required' }, { status: 400 });
    }

    const lastMsg = rawList[rawList.length - 1];
    const userPrompt = lastMsg.text || lastMsg.content || '';

    const encoder = new TextEncoder();

    const streamFallbackAnswer = (text: string) => {
      const stream = new ReadableStream({
        async start(controller) {
          const chunkSize = 16;
          for (let i = 0; i < text.length; i += chunkSize) {
            controller.enqueue(encoder.encode(text.substring(i, i + chunkSize)));
            await new Promise((r) => setTimeout(r, 10));
          }
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
          'X-Model-Used': 'ultrapie-intelligent-fallback',
        },
      });
    };

    const ai = new GoogleGenAI({ apiKey });

    const formattedContents = rawList.map((msg: any) => ({
      role: msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user',
      parts: [{ text: msg.text || msg.content || '' }],
    }));

    const aiStudioSystemInstruction = `You are Google Gemini / Ultrapie AI, an elite Polymath, Principal AI Research Scientist, and World-Class Solutions Architect — operating with the same depth, precision, nuance, and cognitive brilliance as Google AI Studio and Google DeepMind Antigravity.

CORE CAPABILITIES & COMMUNICATION PRINCIPLES:
1. Deep First-Principles Reasoning: When answered, unpack complex questions logically from foundational concepts. Never give shallow, generic, or robotic canned responses.
2. Comprehensive & Nuanced Explanations: Address edge cases, tradeoffs, second-order effects, and underlying mechanisms across any discipline: computer science, software architecture, mathematics, philosophy, science, history, linguistics, and creative synthesis.
3. Clean Structured Formatting: Structure your thoughts with clear markdown headers, bold emphases, bullet points, numbered sequential steps, and well-commented, production-grade code snippets when technical subjects are discussed.
4. Natural Linguistic Mastery: Converse natively and fluently in whatever language the user prompts with (including eloquent, idiomatic Arabic or nuanced technical English). Match the user's intent precisely without unnecessary fluff or sales pitches.`;

    const config: any = {
      temperature: Number(temperature) || 0.7,
      topP: Number(topP) || 0.95,
      maxOutputTokens: Number(maxOutputTokens) || 4096,
      systemInstruction: (systemInstruction && systemInstruction.trim()) ? systemInstruction.trim() : aiStudioSystemInstruction,
    };

    const modelCandidates = [
      model,
      'gemini-flash-lite-latest',
      'gemini-3-flash-preview',
      'gemini-3.8-flash',
      'gemini-3.5-flash',
      'gemini-flash-latest',
      'gemma-4-26b-a4b-it',
    ].filter((m, idx, arr) => m && arr.indexOf(m) === idx);

    let responseStream: any = null;
    let selectedModel = model;

    for (const m of modelCandidates) {
      try {
        const streamPromise = ai.models.generateContentStream({
          model: m,
          contents: formattedContents,
          config,
        });

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout connecting to Gemini model ' + m)), 3500)
        );

        responseStream = (await Promise.race([streamPromise, timeoutPromise])) as any;
        if (responseStream) {
          selectedModel = m;
          break;
        }
      } catch (err: any) {
        console.warn(`Model ${m} failed, attempting next candidate...`, err.message?.substring(0, 70));
        continue;
      }
    }

    if (!responseStream) {
      console.log('Gemini chat timed out or quota exhausted. Serving immediate fallback.');
      return streamFallbackAnswer(generateConversationalResponse(userPrompt));
    }

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of responseStream) {
            const text = chunk.text || '';
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
          controller.close();
        } catch {
          controller.enqueue(encoder.encode(generateConversationalResponse(userPrompt)));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Model-Used': selectedModel,
      },
    });
  } catch (err: any) {
    console.error('Chat error:', err);
    return new Response(generateConversationalResponse('hello'), {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}
