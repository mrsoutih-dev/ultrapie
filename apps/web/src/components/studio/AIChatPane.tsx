'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Check,
  X,
  FileCode,
  ArrowRight,
  Bot,
  User,
  Loader2,
} from 'lucide-react';
import { ChatMessage } from '@/hooks/useStudioState';
import { FilePatch } from '@ultrapie/shared';

interface AIChatPaneProps {
  messages: ChatMessage[];
  isGenerating: boolean;
  pendingPatches: FilePatch[] | null;
  geminiModel?: string;
  onSendPrompt: (prompt: string) => void;
  onApplyPatches: () => void;
  onRejectPatches: () => void;
}

function renderInlineMarkdown(text: string) {
  const tokens = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
  return tokens.map((token, idx) => {
    if (token.startsWith('**') && token.endsWith('**') && token.length >= 4) {
      return (
        <strong key={idx} className="font-semibold text-white">
          {token.slice(2, -2)}
        </strong>
      );
    }
    if (token.startsWith('`') && token.endsWith('`') && token.length >= 2) {
      return (
        <code key={idx} className="px-1 py-0.5 rounded bg-slate-950 border border-slate-800 text-cyan-300 font-mono text-[11px]">
          {token.slice(1, -1)}
        </code>
      );
    }
    if (token.startsWith('*') && token.endsWith('*') && token.length >= 2) {
      return (
        <em key={idx} className="italic text-slate-200">
          {token.slice(1, -1)}
        </em>
      );
    }
    return token;
  });
}

function renderFormattedMessage(content: string) {
  if (!content) return null;
  if (!content.includes('#') && !content.includes('**') && !content.includes('```') && !content.includes('* ') && !content.includes('- ')) {
    return <p className="whitespace-pre-wrap">{content}</p>;
  }

  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-2 text-xs leading-relaxed">
      {parts.map((part, pIdx) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const firstLineEnd = part.indexOf('\n');
          const lang = firstLineEnd !== -1 ? part.substring(3, firstLineEnd).trim() : 'code';
          const code = firstLineEnd !== -1 ? part.substring(firstLineEnd + 1, part.length - 3).trim() : part.slice(3, -3);
          return (
            <div key={pIdx} className="my-2 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden">
              <div className="px-2.5 py-1 bg-slate-900 border-b border-slate-800 text-[10px] text-slate-400 font-mono flex items-center justify-between">
                <span>{lang || 'code'}</span>
              </div>
              <pre className="p-2.5 text-[11px] font-mono text-cyan-300 overflow-x-auto whitespace-pre">
                <code>{code}</code>
              </pre>
            </div>
          );
        }

        const lines = part.split('\n');
        return (
          <div key={pIdx} className="space-y-1">
            {lines.map((line, lIdx) => {
              const trimmed = line.trim();
              if (!trimmed) return <div key={lIdx} className="h-1.5" />;

              if (trimmed.startsWith('### ')) {
                return (
                  <h4 key={lIdx} className="font-bold text-white text-xs mt-2 mb-1">
                    {renderInlineMarkdown(trimmed.replace(/^###\s+/, ''))}
                  </h4>
                );
              }
              if (trimmed.startsWith('## ')) {
                return (
                  <h3 key={lIdx} className="font-bold text-white text-sm mt-2 mb-1">
                    {renderInlineMarkdown(trimmed.replace(/^##\s+/, ''))}
                  </h3>
                );
              }
              if (trimmed.startsWith('# ')) {
                return (
                  <h2 key={lIdx} className="font-bold text-white text-base mt-2 mb-1">
                    {renderInlineMarkdown(trimmed.replace(/^#\s+/, ''))}
                  </h2>
                );
              }

              if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
                return (
                  <div key={lIdx} className="flex items-start gap-1.5 pl-1 my-0.5">
                    <span className="text-cyan-400 text-xs leading-tight">•</span>
                    <span className="flex-1 text-slate-200">
                      {renderInlineMarkdown(trimmed.substring(2))}
                    </span>
                  </div>
                );
              }

              const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
              if (numMatch) {
                return (
                  <div key={lIdx} className="flex items-start gap-1.5 pl-1 my-0.5">
                    <span className="text-cyan-400 font-semibold text-[11px] min-w-4">
                      {numMatch[1]}.
                    </span>
                    <span className="flex-1 text-slate-200">
                      {renderInlineMarkdown(numMatch[2])}
                    </span>
                  </div>
                );
              }

              return (
                <p key={lIdx} className="text-slate-300">
                  {renderInlineMarkdown(line)}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

const SUGGESTED_PROMPTS = [
  'Add a modern pricing section with 3 tiers',
  'Add a dark mode toggle button in header',
  'Add an interactive testimonials carousel',
  'Make the hero section responsive with gradient buttons',
];

export function AIChatPane({
  messages,
  isGenerating,
  pendingPatches,
  geminiModel,
  onSendPrompt,
  onApplyPatches,
  onRejectPatches,
}: AIChatPaneProps) {
  const [inputPrompt, setInputPrompt] = useState('');
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPrompt.trim()) {
      onSendPrompt(inputPrompt.trim());
      setInputPrompt('');
    }
  };

  return (
    <aside className="w-80 border-r border-slate-800 bg-slate-950 flex flex-col h-full select-none">
      {/* Header */}
      <div className="h-11 border-b border-slate-800 px-3.5 flex items-center justify-between text-xs font-semibold text-slate-300 bg-slate-950">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-bold text-white tracking-tight">AI Architect</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-[10px] text-cyan-400 font-mono shadow-inner">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="truncate max-w-[110px]">
            {geminiModel ? geminiModel.replace('gemini-', 'Gemini ').replace('-lite', ' Lite') : 'Gemini 3.5 Lite'}
          </span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col gap-1 ${
              msg.role === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div className="flex items-center gap-1 text-[10px] text-slate-500">
              {msg.role === 'user' ? (
                <>
                  <span>You</span>
                  <User className="h-2.5 w-2.5" />
                </>
              ) : (
                <>
                  <Bot className="h-2.5 w-2.5 text-cyan-400" />
                  <span>Gemini Assistant</span>
                </>
              )}
            </div>
            <div
              className={`p-3 rounded-xl max-w-[95%] leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-300'
              }`}
            >
              {msg.isPending ? (
                <div className="flex items-center gap-2 text-cyan-400 py-1">
                  <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                  <span className="text-[11px] text-slate-400">Gemini is thinking...</span>
                </div>
              ) : (
                renderFormattedMessage(msg.content)
              )}

              {msg.patches && msg.patches.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-slate-800/80">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1.5 flex items-center gap-1">
                    <FileCode className="h-3 w-3 text-cyan-400" />
                    <span>Proposed File Changes ({msg.patches.length})</span>
                  </div>
                  <ul className="space-y-1 text-[11px] text-slate-300">
                    {msg.patches.map((p, idx) => (
                      <li key={idx} className="flex items-center gap-1 font-mono">
                        <span
                          className={`text-[9px] px-1 py-0.2 rounded font-semibold ${
                            p.operation === 'create'
                              ? 'bg-emerald-950 text-emerald-400'
                              : p.operation === 'delete'
                              ? 'bg-rose-950 text-rose-400'
                              : 'bg-amber-950 text-amber-400'
                          }`}
                        >
                          {p.operation.toUpperCase()}
                        </span>
                        <span className="truncate">{p.path}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Pending Patches Action Bar */}
      {pendingPatches && (
        <div className="p-3 bg-slate-900 border-t border-b border-cyan-800/40 flex items-center justify-between">
          <div className="text-[11px] text-cyan-300 font-medium">
            Review {pendingPatches.length} file changes
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onRejectPatches}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Reject"
            >
              <X className="h-3.5 w-3.5 text-rose-400" />
            </button>
            <button
              onClick={onApplyPatches}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 transition-colors shadow-sm"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Apply Changes</span>
            </button>
          </div>
        </div>
      )}

      {/* Prompt Form */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-slate-800">
        {messages.length <= 1 && (
          <div className="mb-2.5 flex flex-wrap gap-1.5">
            {[
              'Build a modern SaaS landing page',
              'Create a developer portfolio',
              'Build an analytics dashboard',
              'Create an e-commerce store',
            ].map((chip, idx) => (
              <button
                type="button"
                key={idx}
                onClick={() => setInputPrompt(chip)}
                className="px-2 py-1 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-cyan-300 text-[10px] transition-colors"
              >
                + {chip}
              </button>
            ))}
          </div>
        )}
        <div className="relative">
          <textarea
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder="Ask anything or command code changes (type anytime, never blocked)..."
            rows={3}
            className="w-full p-2.5 pr-9 text-xs bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl text-slate-100 placeholder-slate-500 outline-none resize-none transition-colors"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <button
            type="submit"
            disabled={!inputPrompt.trim()}
            className="absolute bottom-3 right-3 p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white transition-colors"
            title="Send Message"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </form>
    </aside>
  );
}
