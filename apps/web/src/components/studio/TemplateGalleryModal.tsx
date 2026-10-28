'use client';

import React from 'react';
import {
  Sparkles,
  X,
  Layout,
  Database,
  ShoppingBag,
  MessageSquare,
  TrendingUp,
  Briefcase,
  ArrowRight,
  Check,
} from 'lucide-react';
import { generateFallbackResponse } from '@/lib/gemini-fallback-engine';
import { STARTER_TEMPLATES, StarterTemplate } from '@/lib/studio/starter-templates';

const TEMPLATE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'saas-landing': Layout,
  'database-crud': Database,
  'ecommerce-store': ShoppingBag,
  'ai-assistant': MessageSquare,
  'crypto-fintech': TrendingUp,
  'dev-portfolio': Briefcase,
};

interface TemplateGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (files: Record<string, string>, name: string) => void;
}

export function TemplateGalleryModal({
  isOpen,
  onClose,
  onSelectTemplate,
}: TemplateGalleryModalProps) {
  if (!isOpen) return null;

  const handleApplyTemplate = (tpl: StarterTemplate) => {
    const res = generateFallbackResponse(tpl.promptKeyword);
    onSelectTemplate(res.files, tpl.name);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#12151c] border border-white/10 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-purple-500/10 via-transparent to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                Starter Template Gallery
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Instant Fork
                </span>
              </h3>
              <p className="text-xs text-white/50">
                Choose a production-ready application to fork directly into your studio workspace
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Templates Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {STARTER_TEMPLATES.map((tpl) => {
            const Icon = TEMPLATE_ICONS[tpl.id] || Layout;
            return (
              <div
                key={tpl.id}
                className="group p-5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-purple-500/40 hover:bg-white/[0.04] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-white/10 text-purple-400 group-hover:text-purple-300 transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${tpl.badgeColor}`}
                    >
                      {tpl.badge}
                    </span>
                  </div>

                  <h4 className="font-semibold text-white text-sm mb-1 group-hover:text-purple-300 transition-colors">
                    {tpl.name}
                  </h4>
                  <p className="text-xs text-white/50 leading-relaxed mb-4">
                    {tpl.description}
                  </p>
                </div>

                <button
                  onClick={() => handleApplyTemplate(tpl)}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white/10 hover:bg-purple-600 text-white text-xs font-semibold border border-white/10 hover:border-purple-500 transition-all shadow-sm"
                >
                  <span>Fork into Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between bg-white/[0.01]">
          <span className="text-xs text-white/40">
            All templates generate clean React 19 + Tailwind CSS + Lucide icons.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
