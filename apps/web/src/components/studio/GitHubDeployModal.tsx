'use client';

import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  X,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FolderPlus,
  GitFork,
  Lock,
  Globe,
  UploadCloud,
  Server,
} from 'lucide-react';

interface GitHubDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: Record<string, string>;
}

export function GitHubDeployModal({ isOpen, onClose, files }: GitHubDeployModalProps) {
  const [token, setToken] = useState('');
  const [isNew, setIsNew] = useState(true);
  const [repoName, setRepoName] = useState('simple-counter-app');
  const [isPrivate, setIsPrivate] = useState(false);
  const [branch, setBranch] = useState('main');
  const [commitMessage, setCommitMessage] = useState('Deploy from Ultrapie Studio');
  const [isDeploying, setIsDeploying] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    repoUrl?: string;
  } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedToken = localStorage.getItem('ultrapie_github_pat');
      if (savedToken) setToken(savedToken);
    }
  }, []);

  if (!isOpen) return null;

  const handleDeploy = async () => {
    if (!token.trim()) {
      setResult({ success: false, message: 'Please enter your GitHub Personal Access Token.' });
      return;
    }
    if (!repoName.trim()) {
      setResult({ success: false, message: 'Please specify a repository name.' });
      return;
    }

    setIsDeploying(true);
    setResult(null);

    // Save token for convenience
    if (typeof window !== 'undefined') {
      localStorage.setItem('ultrapie_github_pat', token.trim());
    }

    try {
      const res = await fetch('/api/github/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token.trim(),
          repoName: repoName.trim(),
          isNew,
          isPrivate,
          branch: branch.trim() || 'main',
          commitMessage: commitMessage.trim() || 'Deploy from Ultrapie Studio',
          files,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'GitHub deployment failed');
      }

      if (data.repoUrl && typeof window !== 'undefined') {
        localStorage.setItem('ultrapie_last_deployed_repo', data.repoUrl);
      }

      setResult({
        success: true,
        message: data.message || 'Successfully deployed to GitHub!',
        repoUrl: data.repoUrl,
      });
    } catch (err: any) {
      setResult({
        success: false,
        message: err.message || 'Deployment error',
      });
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="h-14 border-b border-slate-800 px-5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <GitBranch className="h-4 w-4 text-emerald-400" />
            <span>Deploy to GitHub Repository</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Repository Target Mode */}
          <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setIsNew(true)}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg font-medium transition-colors ${
                isNew
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FolderPlus className="h-3.5 w-3.5" />
              <span>Create New Repo</span>
            </button>
            <button
              type="button"
              onClick={() => setIsNew(false)}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg font-medium transition-colors ${
                !isNew
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GitFork className="h-3.5 w-3.5" />
              <span>Existing Repo</span>
            </button>
          </div>

          {/* GitHub Token */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-semibold">GitHub Personal Access Token (PAT)</label>
              <a
                href="https://github.com/settings/tokens/new?scopes=repo"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1"
              >
                <span>Generate Token</span>
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>
            <input
              type="password"
              placeholder="ghp_..."
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl text-slate-100 font-mono text-xs outline-none transition-colors"
            />
          </div>

          {/* Repo Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-slate-300 font-semibold">
              {isNew ? 'New Repository Name' : 'Existing Repository Name'}
            </label>
            <input
              type="text"
              placeholder="e.g. my-simple-app"
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl text-slate-100 text-xs outline-none transition-colors"
            />
          </div>

          {/* Visibility (if new) */}
          {isNew && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-2 text-slate-300 font-medium">
                {isPrivate ? <Lock className="h-4 w-4 text-amber-400" /> : <Globe className="h-4 w-4 text-emerald-400" />}
                <span>{isPrivate ? 'Private Repository' : 'Public Repository'}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsPrivate(!isPrivate)}
                className="text-[11px] px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Switch to {isPrivate ? 'Public' : 'Private'}
              </button>
            </div>
          )}

          {/* Branch & Message */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-400">Branch</label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs font-mono outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-400">Commit Message</label>
              <input
                type="text"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs outline-none"
              />
            </div>
          </div>

          {/* Result Alert */}
          {result && (
            <div
              className={`p-3 rounded-xl border flex flex-col gap-2 ${
                result.success
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
              }`}
            >
              <div className="flex items-start gap-2">
                {result.success ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <span className="text-[11px] leading-relaxed">{result.message}</span>
              </div>

              {result.repoUrl && (
                <div className="space-y-2 mt-1">
                  <a
                    href={result.repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:underline"
                  >
                    <span>Open on GitHub: {result.repoUrl}</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>

                  <div className="pt-1">
                    <a
                      href="/hosting"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-[11px] shadow-sm transition-all"
                    >
                      <Server className="h-3.5 w-3.5" />
                      <span>Deploy this repository on your Coolify Server &rarr;</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 bg-slate-950/80 px-5 py-3 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            {Object.keys(files).length} files ready to push
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDeploy}
              disabled={isDeploying || !token.trim() || !repoName.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-emerald-600/30 transition-all"
            >
              {isDeploying ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Pushing to GitHub...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="h-3.5 w-3.5" />
                  <span>Push & Deploy</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
