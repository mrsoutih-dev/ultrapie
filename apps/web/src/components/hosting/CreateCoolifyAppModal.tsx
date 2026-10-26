'use client';

import React, { useState } from 'react';
import {
  X,
  Server,
  GitBranch,
  Globe,
  Layers,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Cpu,
  Sparkles,
} from 'lucide-react';

interface ServerOption {
  uuid: string;
  name: string;
  ip: string;
}

interface CreateCoolifyAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  servers: ServerOption[];
  onAppCreated: (newApp: any) => void;
  defaultRepo?: string;
  defaultName?: string;
}

export function CreateCoolifyAppModal({
  isOpen,
  onClose,
  servers,
  onAppCreated,
  defaultRepo = 'https://github.com/ultrapie-team/simple-counter-app',
  defaultName = 'Simple Counter App',
}: CreateCoolifyAppModalProps) {
  const [name, setName] = useState(defaultName);
  const [gitRepository, setGitRepository] = useState(defaultRepo);
  const [gitBranch, setGitBranch] = useState('main');
  const [buildPack, setBuildPack] = useState<'nixpacks' | 'dockerfile' | 'static'>('nixpacks');
  const [fqdn, setFqdn] = useState('');
  const [serverUuid, setServerUuid] = useState(servers[0]?.uuid || '');
  const [portsExposes, setPortsExposes] = useState('3000');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; fqdn?: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setResult({ success: false, message: 'Please specify an application name.' });
      return;
    }
    if (!gitRepository.trim()) {
      setResult({ success: false, message: 'Please provide a valid Git repository URL.' });
      return;
    }

    setIsSubmitting(true);
    setResult(null);

    try {
      const savedUrl = typeof window !== 'undefined' ? localStorage.getItem('ultrapie_coolify_url') || '' : '';
      const savedToken = typeof window !== 'undefined' ? localStorage.getItem('ultrapie_coolify_token') || '' : '';

      const targetFqdn = fqdn.trim() || `https://${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.ultrapie.com`;

      const res = await fetch('/api/coolify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coolifyUrl: savedUrl,
          token: savedToken,
          action: 'createApp',
          payload: {
            name: name.trim(),
            git_repository: gitRepository.trim(),
            git_branch: gitBranch.trim(),
            build_pack: buildPack,
            fqdn: targetFqdn,
            server_uuid: serverUuid || (servers[0] ? servers[0].uuid : undefined),
            ports_exposes: portsExposes.trim(),
            autoDeploy: true,
          },
        }),
      });

      const data = await res.json();
      if (res.ok && (data.success || data.application)) {
        const app = data.application || {
          uuid: 'app-' + Math.random().toString(36).substring(2, 8),
          name: name.trim(),
          status: 'running',
          fqdn: targetFqdn,
          git_repository: gitRepository.trim(),
          git_branch: gitBranch.trim(),
          build_pack: buildPack,
          server_name: servers.find((s) => s.uuid === serverUuid)?.name || 'Primary VPS',
          updated_at: new Date().toISOString(),
        };

        setResult({
          success: true,
          message: data.message || `Application "${name}" registered and deployment started on Coolify!`,
          fqdn: targetFqdn,
        });

        onAppCreated(app);
      } else {
        setResult({
          success: false,
          message: data.error || 'Failed to create application on Coolify server.',
        });
      }
    } catch (err: any) {
      setResult({ success: false, message: err.message || 'Network error occurred.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Server className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Deploy New Application to Coolify</h2>
              <p className="text-xs text-slate-400">Connect a Git repository for zero-downtime container hosting</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* App Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Application Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. My Next.js SaaS"
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-purple-500 font-medium"
            />
          </div>

          {/* Git Repository */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Git Repository URL (GitHub / GitLab / Gitea)
            </label>
            <div className="relative">
              <GitBranch className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="text"
                required
                value={gitRepository}
                onChange={(e) => setGitRepository(e.target.value)}
                placeholder="https://github.com/username/repo"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-purple-500 font-mono text-xs"
              />
            </div>
          </div>

          {/* Branch & Port Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Target Branch
              </label>
              <input
                type="text"
                value={gitBranch}
                onChange={(e) => setGitBranch(e.target.value)}
                placeholder="main"
                className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Exposed Port
              </label>
              <input
                type="text"
                value={portsExposes}
                onChange={(e) => setPortsExposes(e.target.value)}
                placeholder="3000"
                className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>
          </div>

          {/* Build Pack Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Build Pack
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'nixpacks', title: 'Nixpacks', desc: 'Auto-detects Node, Vite, Next' },
                { id: 'dockerfile', title: 'Dockerfile', desc: 'Custom container image' },
                { id: 'static', title: 'Static Site', desc: 'Nginx static HTML/JS' },
              ].map((pack) => (
                <button
                  type="button"
                  key={pack.id}
                  onClick={() => setBuildPack(pack.id as any)}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    buildPack === pack.id
                      ? 'bg-purple-950/80 border-purple-500/80 text-white shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="text-xs font-semibold">{pack.title}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">{pack.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* FQDN / Domain */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Public Domain / FQDN (Optional)
            </label>
            <div className="relative">
              <Globe className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={fqdn}
                onChange={(e) => setFqdn(e.target.value)}
                placeholder="https://app.yourdomain.com (Leave blank for default)"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-purple-500 font-mono text-xs"
              />
            </div>
          </div>

          {/* Server Selection */}
          {servers.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Target Coolify Host
              </label>
              <select
                value={serverUuid}
                onChange={(e) => setServerUuid(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
              >
                {servers.map((s) => (
                  <option key={s.uuid} value={s.uuid}>
                    {s.name} ({s.ip})
                  </option>
                ))}
              </select>
            </div>
          )}

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
                <div>{result.message}</div>
                {result.fqdn && (
                  <a
                    href={result.fqdn}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-purple-400 hover:underline font-mono text-[11px]"
                  >
                    <span>{result.fqdn}</span>
                    <ArrowUpRight className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Footer Controls */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-purple-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Deploying on Coolify...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Deploy to Coolify</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
