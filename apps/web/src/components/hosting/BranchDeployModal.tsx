'use client';

import React, { useState } from 'react';
import {
  GitBranch,
  X,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  GitCommit,
} from 'lucide-react';
import { EdgeDeployment } from '@/lib/hosting/edge-deployments';

interface BranchDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  deployment: EdgeDeployment | null;
  onBranchCreated: (newBranchDep: EdgeDeployment) => void;
  onRebuilt: (updatedDep: EdgeDeployment) => void;
}

export function BranchDeployModal({
  isOpen,
  onClose,
  deployment,
  onBranchCreated,
  onRebuilt,
}: BranchDeployModalProps) {
  const [branchName, setBranchName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen || !deployment) return null;

  const handleCreateBranchPreview = async () => {
    if (!branchName.trim()) return;
    setIsCreating(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/deployments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'branchDeploy',
          baseSlug: deployment.slug,
          branchName: branchName.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.deployment) {
        setFeedback(`Branch preview created: https://${data.deployment.subdomain}`);
        onBranchCreated(data.deployment);
        setTimeout(() => {
          onClose();
          setBranchName('');
        }, 1500);
      } else {
        setFeedback(data.error || 'Failed to create branch preview');
      }
    } catch (e: any) {
      setFeedback(e.message || 'Error provisioning branch deployment');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSimulateGitPush = async () => {
    setIsPushing(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/deployments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'simulateGitPush',
          id: deployment.id,
        }),
      });

      const data = await res.json();
      if (res.ok && data.deployment) {
        setFeedback(`[GitHub Webhook Verified] Rebuild v${data.deployment.version} live on edge!`);
        onRebuilt(data.deployment);
      } else {
        setFeedback(data.error || 'Failed to trigger Git rebuild');
      }
    } catch (e: any) {
      setFeedback(e.message || 'Error triggering Git push');
    } finally {
      setIsPushing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-cyan-950 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
              <GitBranch className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">GitHub CI/CD & PR Previews</h3>
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
        <div className="p-6 space-y-6">
          {/* Section 1: Active Branch CI/CD Status */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white">Continuous Deployment</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-semibold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Active
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1 font-mono flex items-center gap-1.5">
                <GitCommit className="h-3 w-3 text-cyan-400" />
                <span>Tracking branch: <strong>{deployment.gitBranch || 'main'}</strong></span>
              </div>
            </div>

            <button
              onClick={handleSimulateGitPush}
              disabled={isPushing}
              className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700 disabled:opacity-50"
            >
              {isPushing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Pushing...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Simulate Git Push</span>
                </>
              )}
            </button>
          </div>

          {/* Section 2: Create Isolated Branch / PR Preview */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Create Isolated Branch / PR Preview URL
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="e.g. feat-darkmode or pr-42"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-600 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <button
                  onClick={handleCreateBranchPreview}
                  disabled={isCreating || !branchName.trim()}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-cyan-600/25 transition-all disabled:opacity-50"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5" />
                      <span>Create Preview</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">
                Generates a standalone preview URL: <code className="text-cyan-300 font-mono">{branchName || 'branch'}-{deployment.slug}.ultrapie.com</code>
              </p>
            </div>
          </div>

          {feedback && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                feedback.includes('created') || feedback.includes('live')
                  ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/60'
                  : 'bg-rose-950/40 text-rose-300 border border-rose-800/60'
              }`}
            >
              {feedback.includes('created') || feedback.includes('live') ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
              )}
              <span className="font-mono text-[11px]">{feedback}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
            <span>Zero-downtime rolling rebuild with health probe</span>
          </div>
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
