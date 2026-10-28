'use client';

import React, { useState } from 'react';
import {
  RotateCcw,
  X,
  History,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  ShieldCheck,
  FileCode,
} from 'lucide-react';
import { EdgeDeployment } from '@/lib/hosting/edge-deployments';

interface RollbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  deployment: EdgeDeployment | null;
  onUpdated: (updated: EdgeDeployment) => void;
}

export function RollbackModal({
  isOpen,
  onClose,
  deployment,
  onUpdated,
}: RollbackModalProps) {
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen || !deployment) return null;

  const history = deployment.history || [];

  const handleRollback = async (version: number) => {
    setIsRollingBack(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/deployments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: deployment.id,
          action: 'rollback',
          version,
        }),
      });

      const data = await res.json();
      if (res.ok && data.deployment) {
        setFeedback(`Rolled back successfully to release v${version}!`);
        onUpdated(data.deployment);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setFeedback(data.error || 'Failed to rollback deployment');
      }
    } catch (e: any) {
      setFeedback(e.message || 'Error executing rollback');
    } finally {
      setIsRollingBack(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-purple-950 border border-purple-800/60 flex items-center justify-center text-purple-400">
              <RotateCcw className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Instant Version Rollback</h3>
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
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block">Current Active Release</span>
              <span className="text-sm font-bold text-white font-mono">v{deployment.version} (Live)</span>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
              Live Serving
            </span>
          </div>

          <div className="text-xs font-semibold text-slate-300 pt-2">
            Select a previous immutable release snapshot to restore:
          </div>

          {history.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
              No previous version snapshots available. Every future Studio deployment will preserve an immutable snapshot.
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((item) => (
                <div
                  key={item.version}
                  className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-purple-800/60 transition-all flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-purple-300 font-mono">v{item.version}</span>
                      <span className="text-[11px] text-slate-400 truncate max-w-[200px]">
                        {item.commitMsg || 'Studio Release'}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(item.updatedAt).toLocaleString()}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <FileCode className="h-3 w-3" />
                        <span>{Object.keys(item.files || {}).length} files</span>
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRollback(item.version)}
                    disabled={isRollingBack}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-purple-600 hover:text-white text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {isRollingBack && selectedVersion === item.version ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="h-3.5 w-3.5" />
                    )}
                    <span>Rollback</span>
                  </button>
                </div>
              ))}
            </div>
          )}

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
            <span>Zero-downtime atomic edge swap</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
