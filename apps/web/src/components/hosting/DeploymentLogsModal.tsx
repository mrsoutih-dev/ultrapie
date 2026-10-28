'use client';

import React, { useState } from 'react';
import {
  Terminal,
  X,
  Copy,
  Check,
  Download,
  Clock,
  Sparkles,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { EdgeDeployment, DeploymentLog } from '@/lib/hosting/edge-deployments';

interface DeploymentLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  deployment: EdgeDeployment | null;
}

export function DeploymentLogsModal({
  isOpen,
  onClose,
  deployment,
}: DeploymentLogsModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !deployment) return null;

  const logs: DeploymentLog[] = deployment.logs || [];

  const handleCopyLogs = () => {
    const text = logs
      .map((l) => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadLogs = () => {
    const text = logs
      .map((l) => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}`)
      .join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${deployment.slug}-build-logs.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-purple-950 border border-purple-800/60 flex items-center justify-center text-purple-400">
              <Terminal className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">{deployment.name}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  v{deployment.version}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">{deployment.subdomain}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLogs}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition-colors"
              title="Copy all logs"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={handleDownloadLogs}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition-colors"
              title="Download log file"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Terminal Window */}
        <div className="flex-1 overflow-y-auto p-5 bg-slate-950 font-mono text-xs space-y-2.5 select-text">
          <div className="text-slate-500 pb-2 border-b border-slate-900 text-[11px] flex items-center justify-between">
            <span>--- Ultrapie Live Build & Execution Stream ---</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Connected
            </span>
          </div>

          {logs.length === 0 ? (
            <div className="text-slate-600 italic py-8 text-center">No logs recorded yet.</div>
          ) : (
            logs.map((log, idx) => {
              const levelColor =
                log.level === 'error'
                  ? 'text-rose-400 bg-rose-950/40 border-rose-900/60'
                  : log.level === 'warn'
                  ? 'text-amber-400 bg-amber-950/40 border-amber-900/60'
                  : log.level === 'success'
                  ? 'text-emerald-400 bg-emerald-950/40 border-emerald-900/60'
                  : 'text-cyan-400 bg-cyan-950/40 border-cyan-900/60';

              return (
                <div key={idx} className="flex items-start gap-3 py-1 hover:bg-slate-900/40 px-2 rounded">
                  <span className="text-slate-500 text-[10px] shrink-0 select-none">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span
                    className={`text-[9px] uppercase px-1.5 py-0.2 rounded border font-semibold shrink-0 ${levelColor}`}
                  >
                    {log.level}
                  </span>
                  <span className="text-slate-200 break-all leading-relaxed">{log.message}</span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 text-[11px]">
            <ShieldCheck className="h-3.5 w-3.5 text-purple-400" />
            <span>Immutable build snapshot: {deployment.bundleSize}</span>
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
