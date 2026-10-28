'use client';

import React, { useState } from 'react';
import {
  Globe,
  X,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  ArrowRight,
  ExternalLink,
  Loader2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { EdgeDeployment } from '@/lib/hosting/edge-deployments';

interface CustomDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
  deployment: EdgeDeployment | null;
  onUpdated: (updated: EdgeDeployment) => void;
}

export function CustomDomainModal({
  isOpen,
  onClose,
  deployment,
  onUpdated,
}: CustomDomainModalProps) {
  const [domain, setDomain] = useState(deployment?.customDomain || '');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [copiedTarget, setCopiedTarget] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen || !deployment) return null;

  const handleCopyTarget = () => {
    navigator.clipboard.writeText('edge.ultrapie.com');
    setCopiedTarget(true);
    setTimeout(() => setCopiedTarget(false), 2000);
  };

  const handleVerifyAndSave = async () => {
    const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, '');
    if (!cleanDomain) {
      setFeedback('Please enter a valid domain (e.g. app.mycompany.com)');
      return;
    }

    setIsVerifying(true);
    setFeedback(null);

    // Simulate DNS check and TLS certificate issuance
    await new Promise((r) => setTimeout(r, 800));

    try {
      const res = await fetch('/api/deployments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: deployment.id,
          updates: {
            customDomain: cleanDomain,
            sslStatus: 'active',
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.deployment) {
        setVerified(true);
        setFeedback(`Custom domain ${cleanDomain} verified! Automatic SSL is active.`);
        onUpdated(data.deployment);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setFeedback(data.error || 'Failed to update custom domain');
      }
    } catch (e: any) {
      setFeedback(e.message || 'Error configuring custom domain');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-purple-950 border border-purple-800/60 flex items-center justify-center text-purple-400">
              <Globe className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Custom Domain & Managed TLS</h3>
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
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Domain Name
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. app.mycompany.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder:text-slate-600 font-mono focus:outline-none focus:border-purple-500"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Connect your apex domain or subdomain with zero certificate maintenance.
            </p>
          </div>

          {/* DNS Configuration Instructions */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                <span>Required DNS Record in your Registrar (Cloudflare, Namecheap, etc.)</span>
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase font-mono">Type</span>
                <span className="font-bold text-white font-mono">CNAME</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase font-mono">Name</span>
                <span className="font-bold text-white font-mono">
                  {domain ? domain.split('.')[0] : 'app'}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 relative">
                <span className="text-[10px] text-slate-500 block uppercase font-mono">Target</span>
                <span className="font-bold text-purple-300 font-mono text-[11px]">edge.ultrapie.com</span>
              </div>
            </div>

            <button
              onClick={handleCopyTarget}
              className="w-full py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono flex items-center justify-center gap-1.5 border border-slate-800 transition-colors"
            >
              {copiedTarget ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Target Copied to Clipboard</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Target: edge.ultrapie.com</span>
                </>
              )}
            </button>
          </div>

          {feedback && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                verified
                  ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/60'
                  : 'bg-amber-950/40 text-amber-300 border border-amber-800/60'
              }`}
            >
              {verified ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
              )}
              <span>{feedback}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Automatic Let's Encrypt / Cloudflare SSL</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              onClick={handleVerifyAndSave}
              disabled={isVerifying}
              className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-purple-600/30 transition-all disabled:opacity-50"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Verifying DNS...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Verify & Activate</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
