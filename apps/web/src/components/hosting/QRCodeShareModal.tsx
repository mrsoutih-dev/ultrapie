'use client';

import React, { useState } from 'react';
import {
  QrCode,
  X,
  Smartphone,
  Copy,
  Check,
  ExternalLink,
  Download,
  Share2,
  Sparkles,
  ShieldCheck,
  Globe,
} from 'lucide-react';
import { EdgeDeployment } from '@/lib/hosting/edge-deployments';

interface QRCodeShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  deployment: EdgeDeployment | null;
}

export function QRCodeShareModal({
  isOpen,
  onClose,
  deployment,
}: QRCodeShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !deployment) return null;

  const targetUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/preview/${deployment.slug}`
      : `https://${deployment.customDomain || deployment.subdomain}`;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(
    targetUrl
  )}&format=svg&qzone=2&bgcolor=020617&color=c084fc`;

  const handleCopy = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (platform: 'x' | 'whatsapp' | 'linkedin') => {
    const text = encodeURIComponent(
      `Check out ${deployment.name} built with Ultrapie Autonomous AI Studio: ${targetUrl}`
    );
    let shareUrl = '';
    if (platform === 'x') {
      shareUrl = `https://twitter.com/intent/tweet?text=${text}`;
    } else if (platform === 'whatsapp') {
      shareUrl = `https://api.whatsapp.com/send?text=${text}`;
    } else if (platform === 'linkedin') {
      shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(targetUrl)}`;
    }
    window.open(shareUrl, '_blank', 'width=600,height=500');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-purple-950 border border-purple-800/60 flex items-center justify-center text-purple-400">
              <Smartphone className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Mobile Test & Instant Share</h3>
              <p className="text-xs text-slate-400 font-mono">{deployment.subdomain}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col items-center text-center space-y-5">
          {/* QR Code Container */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 shadow-inner relative group">
            <div className="w-56 h-56 rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center">
              <img
                src={qrImageUrl}
                alt={`QR code for ${deployment.name}`}
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>iOS Camera & Android Chrome Ready</span>
            </span>
            <p className="text-xs text-slate-400 pt-1">
              Point your camera to test mobile gestures, responsive layout, and touch controls.
            </p>
          </div>

          {/* Link Pill with Copy Button */}
          <div className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 truncate text-slate-300">
              <Globe className="h-4 w-4 text-purple-400 shrink-0" />
              <span className="truncate">{targetUrl}</span>
            </div>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors shrink-0 ml-2"
              title="Copy URL"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>

          {/* Social Share Buttons */}
          <div className="w-full pt-1">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              1-Click Share to
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleShare('x')}
                className="py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-200 transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Twitter / X</span>
              </button>
              <button
                onClick={() => handleShare('whatsapp')}
                className="py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-emerald-400 transition-colors flex items-center justify-center gap-1.5"
              >
                <span>WhatsApp</span>
              </button>
              <button
                onClick={() => handleShare('linkedin')}
                className="py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-blue-400 transition-colors flex items-center justify-center gap-1.5"
              >
                <span>LinkedIn</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <a
            href={targetUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-semibold"
          >
            <span>Open in New Tab</span>
            <ExternalLink className="h-3 w-3" />
          </a>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
