'use client';

import React, { useState, useEffect } from 'react';
import {
  Globe,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { EdgeDeployment } from '@/lib/hosting/edge-deployments';

interface ClaimSubdomainModalProps {
  isOpen: boolean;
  onClose: () => void;
  deployment: EdgeDeployment | null;
  onUpdated: (updated: EdgeDeployment) => void;
}

export function ClaimSubdomainModal({
  isOpen,
  onClose,
  deployment,
  onUpdated,
}: ClaimSubdomainModalProps) {
  const [slug, setSlug] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [reason, setReason] = useState<string | null>(null);
  const [suggested, setSuggested] = useState<string | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (deployment) {
      setSlug(deployment.slug);
      setIsAvailable(null);
      setReason(null);
      setSuggested(null);
      setFeedback(null);
    }
  }, [deployment]);

  // Live debounced slug availability check
  useEffect(() => {
    if (!slug || (deployment && slug === deployment.slug)) {
      setIsAvailable(null);
      setReason(null);
      setSuggested(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsChecking(true);
      try {
        const res = await fetch(
          `/api/deployments?checkSlug=${encodeURIComponent(slug)}&id=${deployment?.id || ''}`
        );
        const data = await res.json();
        setIsAvailable(data.available);
        setReason(data.reason || null);
        setSuggested(data.suggested || null);
      } catch (e) {
        setIsAvailable(false);
        setReason('Error checking availability');
      } finally {
        setIsChecking(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [slug, deployment]);

  if (!isOpen || !deployment) return null;

  const handleClaim = async () => {
    if (!slug.trim() || isAvailable === false) return;
    setIsClaiming(true);
    setFeedback(null);

    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-');

    try {
      const res = await fetch('/api/deployments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: deployment.id,
          updates: {
            slug: cleanSlug,
            subdomain: `${cleanSlug}.ultrapie.com`,
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.deployment) {
        setFeedback(`Claimed https://${cleanSlug}.ultrapie.com successfully!`);
        onUpdated(data.deployment);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setFeedback(data.error || 'Failed to claim subdomain');
      }
    } catch (e: any) {
      setFeedback(e.message || 'Error claiming subdomain');
    } finally {
      setIsClaiming(false);
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
              <h3 className="text-sm font-bold text-white">Subdomain Claimer & Slug Engine</h3>
              <p className="text-xs text-slate-400">Customize your public *.ultrapie.com address</p>
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
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Desired Subdomain Name
            </label>
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 focus-within:border-purple-500 transition-all">
              <span className="text-xs text-slate-500 font-mono select-none">https://</span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="your-app-name"
                className="flex-1 bg-transparent border-none text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none px-1"
              />
              <span className="text-xs text-purple-400 font-mono select-none">.ultrapie.com</span>
              <div className="ml-2 pl-2 border-l border-slate-800">
                {isChecking ? (
                  <Loader2 className="h-4 w-4 text-slate-400 animate-spin" />
                ) : isAvailable === true ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : isAvailable === false ? (
                  <AlertCircle className="h-4 w-4 text-rose-400" />
                ) : null}
              </div>
            </div>

            {/* Availability Helper Text */}
            <div className="pt-2 min-h-[24px]">
              {isAvailable === true && (
                <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>https://{slug}.ultrapie.com is available to claim!</span>
                </div>
              )}
              {isAvailable === false && (
                <div className="text-[11px] text-rose-400 flex items-center justify-between">
                  <span>{reason}</span>
                  {suggested && (
                    <button
                      type="button"
                      onClick={() => setSlug(suggested)}
                      className="text-purple-400 hover:text-purple-300 underline font-mono text-[10px]"
                    >
                      Try {suggested}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-400 space-y-1">
            <div className="font-semibold text-slate-300">Live Atomic Routing:</div>
            <p className="text-[11px] leading-relaxed">
              When claimed, your application's edge DNS and SSL certificates are instantly refreshed. Traffic to the old slug will automatically redirect.
            </p>
          </div>

          {feedback && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                feedback.includes('successfully')
                  ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/60'
                  : 'bg-rose-950/40 text-rose-300 border border-rose-800/60'
              }`}
            >
              {feedback.includes('successfully') ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
              )}
              <span>{feedback}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-purple-400" />
            <span>Automatic wildcard SSL mapping</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              onClick={handleClaim}
              disabled={isClaiming || isAvailable === false || !slug || slug === deployment.slug}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-purple-600/30 transition-all disabled:opacity-50"
            >
              {isClaiming ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Claiming Subdomain...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Claim Subdomain</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
