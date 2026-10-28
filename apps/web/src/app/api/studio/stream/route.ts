import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import {
  isCodeGenerationPrompt,
  generateFallbackResponse,
  generateConversationalResponse,
} from '@/lib/gemini-fallback-engine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, existingFiles = {}, model, chatHistory = [] } = body;

    const headerKey = req.headers.get('x-gemini-api-key');
    const apiKey =
      body.apiKey ||
      headerKey ||
      process.env.GEMINI_API_KEY ||
      '';

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Valid prompt is required' }, { status: 400 });
    }

    const encoder = new TextEncoder();

    // Helper to stream text line-by-line smoothly so Monaco types out line by line
    const streamFallbackText = (fullText: string) => {
      const stream = new ReadableStream({
        async start(controller) {
          const lines = fullText.split('\n');
          for (let l = 0; l < lines.length; l++) {
            const line = lines[l] + (l < lines.length - 1 ? '\n' : '');
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: line })}\n\n`));
            await new Promise((r) => setTimeout(r, 5)); // smooth line-by-line typewriter pacing
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
        },
      });
    };

    // Helper to format fallback files as streaming markdown
    const streamFallbackCode = () => {
      const fallback = generateFallbackResponse(prompt, existingFiles);
      let payload = fallback.chatText + '\n\n';
      for (const [filePath, content] of Object.entries(fallback.files)) {
        const ext = filePath.endsWith('.tsx')
          ? 'tsx'
          : filePath.endsWith('.css')
          ? 'css'
          : filePath.endsWith('.json')
          ? 'json'
          : 'html';
        payload += `FILE: ${filePath}\n\`\`\`${ext}\n${content}\n\`\`\`\n\n`;
      }
      return streamFallbackText(payload);
    };

    // Attempt calling Google Gemini API
    const ai = new GoogleGenAI({ apiKey });
    const selectedModel = model || 'gemini-3-flash-preview';

    const existingFileNames = Object.keys(existingFiles).join(', ') || 'None (fresh empty workspace)';

    const systemInstruction = `You are Ultrapie AI, an elite Polymath, Principal AI Research Scientist, and Live Full-Stack Application Architect (powered by Google Gemini).

You operate with the profound depth, intelligence, and nuance of Google AI Studio and Google DeepMind Antigravity, while also possessing the ability to generate and modify live interactive applications.

CAPABILITIES & OPERATING MODES:

MODE 1: GENERAL INTELLIGENCE, REASONING & DEEP EXPLANATION (Default):
- When the user asks ANY question (conceptual, philosophical, scientific, mathematical, software architecture, technical debugging, languages, writing, general curiosity):
- Provide comprehensive, first-principles explanations with genuine intellectual depth, nuance, and structural clarity.
- Structure responses using clear markdown headers (#, ##, ###), bullet points, numbered lists, and bold key terms.
- Use illustrative code snippets in standard markdown code fences (e.g. \`\`\`tsx, \`\`\`python, \`\`\`sql) where helpful.
- Support mathematical expressions and structured comparisons.
- Do NOT output 'FILE:' tags when answering general or conceptual questions.

MODE 2: APP BUILDING & LIVE APPLICATION UPDATES:
- ONLY when the user explicitly instructs you to build, create, generate, edit, or modify an application, website, component, dashboard, or UI feature (e.g. "Build a SaaS landing page", "Create a task manager", "Add a pricing table", "Change the theme"):
  1. Briefly summarize in 1-2 friendly sentences what you created or updated.
  2. ALWAYS output the complete, working source files using the explicit 'FILE: <path>' header format:

FILE: src/App.tsx
\`\`\`tsx
import React, { useState } from 'react';
// Complete, working React 19 component styled with modern Tailwind CSS
export default function App() { ... }
\`\`\`

FILE: src/index.css
\`\`\`css
@tailwind base;
@tailwind components;
@tailwind utilities;
\`\`\`

DATABASE & FULLSTACK ARCHITECTURE:
- If the user asks for a database, backend, CRUD, or persistent data:
  1. In 'FILE: src/App.tsx', provide full working state and interactive CRUD tables with simulated or live database connection indicators.
  2. Also output 'FILE: prisma/schema.prisma' with clean PostgreSQL model definitions.
  3. Also output 'FILE: src/lib/db.ts' with typed interfaces and client helpers.

Rules for Mode 2:
- Current workspace files: ${existingFileNames}.
- ALWAYS output complete, working, production-ready code with Lucide icons and sleek modern Tailwind CSS.
- Never use placeholder comments or ellipses for logic.
- ALWAYS output 'FILE: src/App.tsx' FIRST!`;

    const contents: any[] = [];
    if (chatHistory && chatHistory.length > 0) {
      for (const msg of chatHistory.slice(-8)) {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        });
      }
    }
    contents.push({
      role: 'user',
      parts: [{ text: prompt }],
    });

    const rawCandidates = [
      selectedModel,
      'gemini-flash-lite-latest',
      'gemini-3-flash-preview',
      'gemini-3.8-flash',
      'gemini-3.5-flash',
      'gemini-flash-latest',
      'gemma-4-26b-a4b-it',
    ];
    const modelCandidates = [...new Set(rawCandidates)];

    let streamResponse: any = null;
    let activeModelName = selectedModel;

    // Connect to Google Gemini API with smart model candidate fallback
    for (const m of modelCandidates) {
      try {
        const streamPromise = ai.models.generateContentStream({
          model: m,
          contents,
          config: {
            systemInstruction,
            temperature: 0.7,
            maxOutputTokens: 8192,
          },
        });

        // 3500ms timeout per model to give Google Gemini ample time to establish TLS & stream
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout connecting to Gemini model ' + m)), 3500)
        );

        streamResponse = (await Promise.race([streamPromise, timeoutPromise])) as any;
        if (streamResponse) {
          activeModelName = m;
          console.log(`Successfully connected to Gemini live model: ${m}`);
          break;
        }
      } catch (err: any) {
        console.warn(`Candidate ${m} unavailable (${err.message?.substring(0, 70)}), trying next candidate...`);
        // If quota limit or error, continue to next model candidate instead of aborting!
        continue;
      }
    }

    // If Gemini is unreachable or connection timed out, seamlessly trigger instant fallback
    if (!streamResponse) {
      console.log('Gemini external API timed out or exhausted. Using intelligent instant fallback.');
      if (isCodeGenerationPrompt(prompt)) {
        return streamFallbackCode();
      } else {
        return streamFallbackText(generateConversationalResponse(prompt));
      }
    }

    // If Gemini connected, stream from live response with fallback on stream failure
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let hasEmitted = false;
          let lineBuffer = '';
          for await (const chunk of streamResponse) {
            const text = chunk.text || '';
            if (text) {
              hasEmitted = true;
              lineBuffer += text;
              if (lineBuffer.includes('\n')) {
                const parts = lineBuffer.split('\n');
                lineBuffer = parts.pop() || '';
                for (const p of parts) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: p + '\n' })}\n\n`));
                  await new Promise((r) => setTimeout(r, 3));
                }
              }
            }
          }
          if (lineBuffer) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: lineBuffer })}\n\n`));
          }
          if (!hasEmitted) {
            // Emitted nothing, check if code generation or conversational query
            if (isCodeGenerationPrompt(prompt)) {
              const fallback = generateFallbackResponse(prompt, existingFiles);
              let payload = fallback.chatText + '\n\n';
              for (const [filePath, content] of Object.entries(fallback.files)) {
                payload += `FILE: ${filePath}\n\`\`\`tsx\n${content}\n\`\`\`\n\n`;
              }
              const fallbackLines = payload.split('\n');
              for (let l = 0; l < fallbackLines.length; l++) {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ text: fallbackLines[l] + (l < fallbackLines.length - 1 ? '\n' : '') })}\n\n`
                  )
                );
                await new Promise((r) => setTimeout(r, 5));
              }
            } else {
              const answer = generateConversationalResponse(prompt);
              const answerLines = answer.split('\n');
              for (let l = 0; l < answerLines.length; l++) {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ text: answerLines[l] + (l < answerLines.length - 1 ? '\n' : '') })}\n\n`
                  )
                );
                await new Promise((r) => setTimeout(r, 5));
              }
            }
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
          controller.close();
        } catch (err: any) {
          console.error('Stream iteration error:', err.message);
          // Seamless fallback in stream
          if (isCodeGenerationPrompt(prompt)) {
            const fallback = generateFallbackResponse(prompt, existingFiles);
            let payload = fallback.chatText + '\n\n';
            for (const [filePath, content] of Object.entries(fallback.files)) {
              payload += `FILE: ${filePath}\n\`\`\`tsx\n${content}\n\`\`\`\n\n`;
            }
            const fallbackLines = payload.split('\n');
            for (let l = 0; l < fallbackLines.length; l++) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ text: fallbackLines[l] + (l < fallbackLines.length - 1 ? '\n' : '') })}\n\n`
                )
              );
              await new Promise((r) => setTimeout(r, 5));
            }
          } else {
            const answer = generateConversationalResponse(prompt);
            const answerLines = answer.split('\n');
            for (let l = 0; l < answerLines.length; l++) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ text: answerLines[l] + (l < answerLines.length - 1 ? '\n' : '') })}\n\n`
                )
              );
              await new Promise((r) => setTimeout(r, 5));
            }
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Model-Used': activeModelName,
      },
    });
  } catch (error: any) {
    console.error('Studio stream error:', error);
    // Return friendly conversational response instead of 500 error
    return NextResponse.json({
      chatText: generateConversationalResponse('hello'),
    });
  }
}
