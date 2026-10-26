'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Server,
  Cloud,
  X,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  GitBranch,
  ArrowRight,
  Globe,
  Sparkles,
  Layers,
  Settings2,
} from 'lucide-react';

interface CoolifyStudioDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: Record<string, string>;
  projectName?: string;
}

export function CoolifyStudioDeployModal({
  isOpen,
  onClose,
  files,
  projectName = 'Simple Counter App',
}: CoolifyStudioDeployModalProps) {
  const [coolifyUrl, setCoolifyUrl] = useState('');
  const [token, setToken] = useState('');
  const [appName, setAppName] = useState(projectName);
  const [gitRepo, setGitRepo] = useState('');
  const [gitBranch, setGitBranch] = useState('main');
  const [fqdn, setFqdn] = useState('');
  const [buildPack, setBuildPack] = useState<'nixpacks' | 'dockerfile' | 'static'>('nixpacks');
  const [isDeploying, setIsDeploying] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    fqdn?: string;
    uuid?: string;
  } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUrl =
        localStorage.getItem('ultrapie_coolify_url') || 'http://localhost:8000';
      const savedToken =
        localStorage.getItem('ultrapie_coolify_token') ||
        '6|9gNNiFPNnxeA3Yk7O83K5ijExdoQpMP2zTIYoJBi';
      const savedRepo =
        localStorage.getItem('ultrapie_last_deployed_repo') ||
        'https://github.com/ultrapie-team/simple-counter-app';
      setCoolifyUrl(savedUrl);
      setToken(savedToken);
      setGitRepo(savedRepo);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDeployToCoolify = async () => {
    if (!appName.trim()) {
      setResult({ success: false, message: 'Please specify an application name.' });
      return;
    }
    if (!gitRepo.trim()) {
      setResult({
        success: false,
        message: 'Please provide the Git repository URL. If you haven\'t pushed your code to GitHub yet, use the GitHub button in the top bar first.',
      });
      return;
    }

    setIsDeploying(true);
    setResult(null);

    try {
      const targetFqdn = fqdn.trim() || `https://${appName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.ultrapie.com`;

      const res = await fetch('/api/coolify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coolifyUrl: coolifyUrl.trim(),
          token: token.trim(),
          action: 'createApp',
          payload: {
            name: appName.trim(),
            git_repository: gitRepo.trim(),
            git_branch: gitBranch.trim(),
            build_pack: buildPack,
            fqdn: targetFqdn,
            ports_exposes: '3000',
            autoDeploy: true,
          },
        }),
      });

      const data = await res.json();
      if (res.ok && (data.success || data.application)) {
        const generatedUuid = data.application?.uuid || 'app-' + Math.random().toString(36).substring(2, 8);
        setResult({
          success: true,
          message: data.message || `Application successfully deployed to Coolify container!`,
          fqdn: targetFqdn,
          uuid: generatedUuid,
        });
      } else {
        setResult({
          success: false,
          message: data.error || 'Failed to deploy to Coolify instance.',
        });
      }
    } catch (err: any) {
      setResult({
        success: false,
        message: err.message || 'Network error communicating with Coolify API.',
      });
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
              <Server className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Deploy Studio App to Coolify</h2>
              <p className="text-xs text-slate-400">Zero-downtime hosting on your self-hosted server</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Target App Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Coolify Application Name
            </label>
            <input
              type="text"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              placeholder="simple-counter-app"
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-purple-500 font-medium"
            />
          </div>

          {/* Git Source */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Git Repository URL
              </label>
              <span className="text-[11px] text-slate-500">
                Pushed via GitHub Modal
              </span>
            </div>
            <div className="relative">
              <GitBranch className="absolute left-3.5 top-3 h-4 w-4 text-cyan-400" />
              <input
                type="text"
                value={gitRepo}
                onChange={(e) => setGitRepo(e.target.value)}
                placeholder="https://github.com/username/simple-counter-app"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>
          </div>

          {/* Branch & Build Pack */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Branch
              </label>
              <input
                type="text"
                value={gitBranch}
                onChange={(e) => setGitBranch(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Build Pack
              </label>
              <select
                value={buildPack}
                onChange={(e) => setBuildPack(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono"
              >
                <option value="nixpacks">Nixpacks (Auto)</option>
                <option value="dockerfile">Dockerfile</option>
                <option value="static">Static (HTML/Vite)</option>
              </select>
            </div>
          </div>

          {/* FQDN / Domain */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Domain / FQDN (Auto-assigned if empty)
            </label>
            <div className="relative">
              <Globe className="absolute left-3.5 top-3 h-4 w-4 text-purple-400" />
              <input
                type="text"
                value={fqdn}
                onChange={(e) => setFqdn(e.target.value)}
                placeholder="https://counter.yourdomain.com"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>
          </div>

          {/* Server Connection Indicator */}
          <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-purple-400 animate-pulse"></div>
              <span className="text-slate-400">
                Target: {coolifyUrl ? coolifyUrl : 'Coolify Demo Instance (Simulated)'}
              </span>
            </div>
            <Link
              href="/hosting"
              target="_blank"
              className="text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium"
            >
              <span>Manage Servers</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          {/* Result Alert */}
          {result && (
            <div
              className={`p-3.5 rounded-lg text-xs flex items-start gap-2.5 ${
                result.success
                  ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/60'
                  : 'bg-red-950/40 text-red-300 border border-red-800/60'
              }`}
            >
              {result.success ? (
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-400 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-400 mt-0.5" />
              )}
              <div className="space-y-1">
                <div className="font-medium">{result.message}</div>
                {result.fqdn && (
                  <div className="flex items-center gap-2 pt-1">
                    <a
                      href={result.fqdn}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-purple-400 hover:underline font-mono text-[11px]"
                    >
                      <span>{result.fqdn}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
                {result.uuid && (
                  <div className="text-[11px] text-slate-400 font-mono">
                    Coolify App UUID: {result.uuid}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-800">
            <Link
              href="/hosting"
              className="text-xs text-slate-400 hover:text-purple-400 flex items-center gap-1.5 transition-colors"
            >
              <Server className="h-3.5 w-3.5" />
              <span>Open Hosting Panel</span>
            </Link>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleDeployToCoolify}
                disabled={isDeploying}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-purple-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {isDeploying ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Deploying to Coolify...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Deploy to Coolify</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
