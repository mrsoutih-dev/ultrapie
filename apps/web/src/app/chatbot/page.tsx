'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Send,
  Trash2,
  Code2,
  Sliders,
  Bot,
  User,
  Copy,
  Check,
  RotateCcw,
  Settings2,
  Layers,
  ArrowLeft,
  KeyRound,
  ExternalLink,
  ChevronDown,
  CheckCircle2,
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  modelUsed?: string;
  timestamp: string;
}

const PRESET_SYSTEM_INSTRUCTIONS = [
  {
    name: 'Default Assistant',
    text: 'You are a helpful, accurate, and concise AI assistant powered by Google Gemini.',
  },
  {
    name: 'Code Architect',
    text: 'You are a Senior Full-Stack Software Architect. Write production-ready, clean TypeScript, React, and Next.js code with explanations.',
  },
  {
    name: 'Creative Writer',
    text: 'You are a creative writer and storyteller. Provide engaging, rich, and imaginative responses.',
  },
  {
    name: 'Concise Analyst',
    text: 'You are an analytical researcher. Give direct, bullet-pointed, data-driven answers without fluff.',
  },
];

const AVAILABLE_MODELS = [
  { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash Lite', badge: 'Active Free Quota' },
  { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite', badge: 'Fastest' },
  { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash', badge: 'Flagship' },
  { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash', badge: 'Stable' },
  { id: 'gemini-flash-lite-latest', name: 'Gemini Flash Lite Latest', badge: 'Auto' },
  { id: 'gemma-4-26b-a4b-it', name: 'Gemma 4 26B Instruct', badge: 'Open Weights' },
];

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        '👋 Welcome to the **Google AI Studio Chatbot** for Ultrapie!\n\nI am connected directly to your Google Gemini API. Ask me anything or explore development concepts!\n\n💡 **Tip:** If you want to generate complete React 19 apps with a **real-time Live Preview Sandbox** and Monaco code streaming, click **[Open Studio with Live Preview](/studio)** at the top right!',
      timestamp: 'Just now',
    },
  ]);

  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-3.5-flash-lite');
  const [systemInstruction, setSystemInstruction] = useState(
    'You are a helpful, accurate, and concise AI assistant powered by Google Gemini.'
  );
  const [temperature, setTemperature] = useState(0.7);
  const [topP, setTopP] = useState(0.95);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [codeTab, setCodeTab] = useState<'curl' | 'js' | 'python'>('js');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    const userText = input.trim();
    setInput('');

    const userMsg: Message = {
      id: Math.random().toString(36).substring(7),
      role: 'user',
      content: userText,
      timestamp: new Date().toLocaleTimeString(),
    };

    const assistantMsgId = Math.random().toString(36).substring(7);
    const initialAssistantMsg: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg, initialAssistantMsg]);
    setIsStreaming(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [...messages, userMsg],
          systemInstruction,
          model: selectedModel,
          temperature,
          topP,
          maxOutputTokens: maxTokens,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to get response`);
      }

      const modelHeader = response.headers.get('X-Model-Used') || selectedModel;

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulatedText += chunk;

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? { ...msg, content: accumulatedText, modelUsed: modelHeader }
              : msg
          )
        );
      }
    } catch (err: any) {
      console.error('Streaming error:', err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                content: `⚠️ **Error communicating with Gemini API**:\n\n\`\`\`\n${
                  err.message || err
                }\n\`\`\`\nPlease verify your API key or model quota.`,
              }
            : msg
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const copyToClipboard = (text: string, id?: string) => {
    navigator.clipboard.writeText(text);
    if (id) {
      setCopiedMsgId(id);
      setTimeout(() => setCopiedMsgId(null), 2000);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const getExportCode = () => {
    if (codeTab === 'js') {
      return `import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: 'YOUR_GEMINI_API_KEY' });

async function main() {
  const response = await ai.models.generateContent({
    model: '${selectedModel}',
    contents: 'Hello Gemini',
    config: {
      systemInstruction: ${JSON.stringify(systemInstruction)},
      temperature: ${temperature},
      topP: ${topP},
      maxOutputTokens: ${maxTokens},
    },
  });
  console.log(response.text);
}

main();`;
    }

    if (codeTab === 'python') {
      return `from google import genai
from google.genai import types

client = genai.Client(api_key="YOUR_GEMINI_API_KEY")

response = client.models.generate_content(
    model="${selectedModel}",
    contents="Hello Gemini",
    config=types.GenerateContentConfig(
        system_instruction=${JSON.stringify(systemInstruction)},
        temperature=${temperature},
        top_p=${topP},
        max_output_tokens=${maxTokens},
    ),
)

print(response.text)`;
    }

    return `curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=YOUR_GEMINI_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "systemInstruction": { "parts": [{ "text": ${JSON.stringify(systemInstruction)} }] },
    "contents": [{ "role": "user", "parts": [{ "text": "Hello Gemini" }] }],
    "generationConfig": {
      "temperature": ${temperature},
      "topP": ${topP},
      "maxOutputTokens": ${maxTokens}
    }
  }'`;
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#090d16] text-slate-100 overflow-hidden font-sans">
      {/* 1. Google AI Studio Top Navigation Bar */}
      <header className="h-14 border-b border-slate-800 bg-slate-950 px-5 flex items-center justify-between select-none">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Ultrapie</span>
          </Link>
          <div className="h-4 w-px bg-slate-800" />
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/20">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-sm text-white">Google AI Studio</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-mono">
              Live Interactive Chat
            </span>
          </div>
        </div>

        {/* Model Selector & Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/studio"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:brightness-110 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
            title="Open Ultrapie AI Studio with Live Preview & Monaco Editor"
          >
            <Sparkles className="h-3.5 w-3.5 text-white" />
            <span>Open Studio with Live Preview</span>
          </Link>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 text-xs">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span className="font-mono">API Key Active</span>
          </div>

          <div className="relative">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="appearance-none bg-slate-900 border border-slate-700/80 hover:border-slate-600 rounded-lg px-3 py-1.5 pr-8 text-xs font-medium text-slate-200 outline-none cursor-pointer transition-colors"
            >
              {AVAILABLE_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            onClick={() => setShowCodeModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs text-slate-200 transition-colors"
          >
            <Code2 className="h-3.5 w-3.5 text-cyan-400" />
            <span>Get Code</span>
          </button>

          <button
            onClick={() =>
              setMessages([
                {
                  id: 'welcome',
                  role: 'assistant',
                  content: 'Chat cleared. How can I help you today?',
                  timestamp: new Date().toLocaleTimeString(),
                },
              ])
            }
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
            title="Clear Chat"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* 2. Main Studio Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: System Instructions & Parameters */}
        <aside className="w-80 border-r border-slate-800 bg-slate-950/80 p-4 flex flex-col gap-5 overflow-y-auto select-none">
          {/* Section: System Instructions */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Settings2 className="h-3.5 w-3.5 text-cyan-400" />
                <span>System Instructions</span>
              </label>
              <span className="text-[10px] text-slate-500 font-mono">Optional</span>
            </div>
            <textarea
              value={systemInstruction}
              onChange={(e) => setSystemInstruction(e.target.value)}
              rows={4}
              placeholder="Give the model behavioral instructions, persona, or guidelines..."
              className="w-full p-2.5 text-xs bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-lg text-slate-200 outline-none resize-none transition-colors"
            />
            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1 mt-1">
              {PRESET_SYSTEM_INSTRUCTIONS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => setSystemInstruction(preset.text)}
                  className="text-[10px] px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-slate-800/80" />

          {/* Section: Model Parameters */}
          <div className="flex flex-col gap-4">
            <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sliders className="h-3.5 w-3.5 text-blue-400" />
              <span>Run Parameters</span>
            </div>

            {/* Temperature Slider */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Temperature</span>
                <span className="font-mono text-cyan-400">{temperature.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Precise (0.0)</span>
                <span>Creative (2.0)</span>
              </div>
            </div>

            {/* Top-P Slider */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Top-P</span>
                <span className="font-mono text-cyan-400">{topP.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={topP}
                onChange={(e) => setTopP(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            {/* Max Output Tokens */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Max Tokens</span>
                <span className="font-mono text-cyan-400">{maxTokens}</span>
              </div>
              <input
                type="range"
                min="256"
                max="8192"
                step="256"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>
          </div>

          {/* API Info Card */}
          <div className="mt-auto p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs flex flex-col gap-1.5 text-slate-400">
            <div className="flex items-center gap-1.5 font-medium text-slate-300">
              <KeyRound className="h-3.5 w-3.5 text-emerald-400" />
              <span>Direct Google GenAI SDK</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Powered by <span className="font-mono text-slate-400">@google/genai</span> with real-time streaming tokens.
            </p>
          </div>
        </aside>

        {/* Center: Conversation Canvas */}
        <main className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-4xl w-full mx-auto">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                )}

                <div
                  className={`flex flex-col max-w-[85%] ${
                    msg.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <span className="text-[11px] font-medium text-slate-400">
                      {msg.role === 'user' ? 'You' : msg.modelUsed || selectedModel}
                    </span>
                    <span suppressHydrationWarning className="text-[10px] text-slate-600">{msg.timestamp}</span>
                  </div>

                  <div
                    className={`relative group p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-600/20'
                        : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none shadow-md'
                    }`}
                  >
                    {msg.content ? (
                      <div>{msg.content}</div>
                    ) : (
                      <div className="flex items-center gap-2 text-slate-400 py-1">
                        <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                        <span className="text-xs">Thinking & streaming from Gemini...</span>
                      </div>
                    )}

                    {/* Copy message button */}
                    {msg.content && (
                      <button
                        onClick={() => copyToClipboard(msg.content, msg.id)}
                        className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 p-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-opacity"
                        title="Copy message"
                      >
                        {copiedMsgId === msg.id ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {msg.role === 'user' && (
                  <div className="h-8 w-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-slate-300">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Prompt Input Area */}
          <div className="border-t border-slate-800 bg-slate-950 p-4">
            <div className="max-w-4xl mx-auto flex flex-col gap-2">
              {/* Quick suggestion prompt chips */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                {[
                  'Explain quantum computing in simple terms',
                  'Write a Next.js 15 Server Action with Prisma',
                  'Design a modern SaaS landing hero section with Tailwind CSS',
                  'Compare Gemini 3.8 Flash vs Claude 3.7 Sonnet',
                ].map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInput(suggestion);
                    }}
                    className="shrink-0 px-3 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              {/* Input Form */}
              <div className="relative flex items-center bg-slate-900 border border-slate-800 focus-within:border-cyan-500 rounded-2xl p-2 transition-colors">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Enter a prompt here (Shift+Enter for newline, Enter to send)..."
                  rows={2}
                  disabled={isStreaming}
                  className="flex-1 bg-transparent px-3 py-1.5 text-sm text-slate-100 placeholder-slate-500 outline-none resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isStreaming}
                  className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 text-white flex items-center justify-center transition-all shadow-md shadow-blue-500/25 shrink-0 ml-2"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                <span>Model: <span className="font-mono text-slate-400">{selectedModel}</span></span>
                <span>Press Enter to send, Shift + Enter for new line</span>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* 3. "Get Code" Modal (like Google AI Studio) */}
      {showCodeModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl flex flex-col overflow-hidden">
            <div className="h-12 border-b border-slate-800 px-5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Code2 className="h-4 w-4 text-cyan-400" />
                <span>Get Code — Google AI Studio</span>
              </div>
              <button
                onClick={() => setShowCodeModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Close ✕
              </button>
            </div>

            {/* Language Tabs */}
            <div className="flex border-b border-slate-800 bg-slate-950 px-4 text-xs">
              {(['js', 'python', 'curl'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setCodeTab(tab)}
                  className={`px-4 py-2.5 font-medium border-b-2 transition-colors ${
                    codeTab === tab
                      ? 'border-cyan-500 text-cyan-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab === 'js' ? 'JavaScript (@google/genai)' : tab === 'python' ? 'Python' : 'cURL'}
                </button>
              ))}
            </div>

            {/* Code Body */}
            <div className="p-4 relative">
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300 overflow-x-auto max-h-96">
                {getExportCode()}
              </pre>

              <button
                onClick={() => copyToClipboard(getExportCode())}
                className="absolute top-7 right-7 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 flex items-center gap-1.5 border border-slate-700 transition-colors"
              >
                {copiedCode ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
