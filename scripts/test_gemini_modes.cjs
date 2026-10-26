const path = require('path');
const { GoogleGenAI } = require(path.join(__dirname, '../apps/web/node_modules/@google/genai'));

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const systemInstruction = `You are Ultrapie's AI Assistant and Live Coding Architect.
You operate strictly in two modes:

MODE 1: CONVERSATIONAL & REASONING (Default):
- If the user is chatting, saying hello, asking a conceptual question, asking for ideas, or asking how something works WITHOUT ordering you to build/edit code:
- Answer helpfully, warmly, and concisely in clean markdown prose.
- NEVER output code blocks or files in Mode 1.

MODE 2: APP BUILDING & CODE GENERATION:
- ONLY when the user explicitly commands you to build, create, add, edit, or modify an application, website, component, or feature:
  1. Write a 1-2 sentence friendly summary in chat explaining what you are creating.
  2. ALWAYS output 'FILE: src/App.tsx' FIRST before any other files!
  3. Then output other files (e.g. 'FILE: src/index.css') if needed:

FILE: src/App.tsx
\`\`\`tsx
import React, { useState } from 'react';
// Complete, working React 19 component styled with modern Tailwind CSS
export default function App() { ... }
\`\`\`
`;

async function testPrompt(prompt) {
  console.log('\n--- TESTING PROMPT:', prompt, '---');
  const res = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      systemInstruction,
      maxOutputTokens: 1000,
    }
  });
  console.log('Output:\n', res.text);
}

async function main() {
  await testPrompt('Hi, what can you build for me? Give me 3 cool ideas.');
  await testPrompt('Build a simple landing page for a bakery');
}

main().catch(console.error);
