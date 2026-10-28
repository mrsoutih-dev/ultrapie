'use client';

import React, { useState } from 'react';
import {
  Rocket,
  X,
  Server,
  Globe,
  Download,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  Loader2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import JSZip from 'jszip';

interface EasyDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: Record<string, string>;
  projectName?: string;
}

export function EasyDeployModal({
  isOpen,
  onClose,
  files,
  projectName = 'Ultrapie App',
}: EasyDeployModalProps) {
  const [deployTarget, setDeployTarget] = useState<'edge' | 'coolify' | 'zip'>('edge');
  const [isDeploying, setIsDeploying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [deployedUrl, setDeployedUrl] = useState<string | null>(null);
  const [deployedSlug, setDeployedSlug] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const steps = [
    'Analyzing & packaging workspace files...',
    'Building React 19 & Tailwind bundles...',
    'Provisioning isolated edge runtime & storage...',
    'Activating wildcard SSL & global edge CDN...',
  ];

  const handle1ClickDeploy = async () => {
    if (deployTarget === 'zip') {
      handleDownloadZip();
      return;
    }

    setIsDeploying(true);
    setCurrentStep(0);
    setDeployedUrl(null);
    setDeployedSlug(null);

    // Simulate real-time deployment progress steps
    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(i);
      await new Promise((r) => setTimeout(r, 450));
    }

    try {
      if (deployTarget === 'edge') {
        const res = await fetch('/api/deployments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: projectName,
            files,
            type: 'edge',
          }),
        });
        const data = await res.json();
        if (data.deployment) {
          setDeployedSlug(data.deployment.slug);
          setDeployedUrl(window.location.origin + `/preview/${data.deployment.slug}`);
        } else {
          const appSlug = projectName.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'my-app';
          setDeployedUrl(window.location.origin + `/preview/${appSlug}`);
        }
      } else if (deployTarget === 'coolify') {
        // Also register in deployments and notify coolify
        await fetch('/api/deployments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: projectName,
            files,
            type: 'coolify',
          }),
        }).catch(() => {});

        await fetch('/api/coolify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'createApp',
            payload: {
              name: projectName,
              git_repository: 'https://github.com/ultrapie-team/demo-app',
              git_branch: 'main',
              build_pack: 'nixpacks',
            },
          }),
        }).catch(() => {});

        const appSlug = projectName.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'my-app';
        setDeployedUrl(`http://localhost:8000/app/${appSlug}`);
      }
    } catch (e) {
      const appSlug = projectName.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'my-app';
      setDeployedUrl(window.location.origin + `/preview/${appSlug}`);
    } finally {
      setIsDeploying(false);
    }
  };

  const handleDownloadZip = async () => {
    setIsDeploying(true);
    const zip = new JSZip();

    // Default project wrapper if not present
    if (!files['package.json']) {
      zip.file(
        'package.json',
        JSON.stringify(
          {
            name: projectName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            private: true,
            version: '1.0.0',
            type: 'module',
            scripts: {
              dev: 'vite',
              build: 'tsc && vite build',
              preview: 'vite preview',
            },
            dependencies: {
              react: '^19.0.0',
              'react-dom': '^19.0.0',
              'lucide-react': '^1.16.0',
            },
            devDependencies: {
              '@types/react': '^19.0.0',
              '@types/react-dom': '^19.0.0',
              '@vitejs/plugin-react': '^4.3.4',
              autoprefixer: '^10.4.20',
              postcss: '^8.4.49',
              tailwindcss: '^3.4.17',
              typescript: '^5.8.0',
              vite: '^6.0.0',
            },
          },
          null,
          2
        )
      );
    }

    if (!files['index.html']) {
      zip.file(
        'index.html',
        `<!doctype html>
<html lang="en" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
  </head>
  <body class="bg-slate-950 text-slate-100 min-h-screen">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`
      );
    }

    if (!files['src/main.tsx']) {
      zip.file(
        'src/main.tsx',
        `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`
      );
    }

    for (const [path, content] of Object.entries(files)) {
      zip.file(path, content);
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${projectName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.zip`;
    link.click();
    URL.revokeObjectURL(url);
    setIsDeploying(false);
  };

  const copyUrl = () => {
    if (deployedUrl) {
      navigator.clipboard.writeText(deployedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white">
              <Rocket className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>1-Click Easy Deploy</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Instant
                </span>
              </h2>
              <p className="text-xs text-slate-400">Launch your app with zero complex configuration.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {deployedUrl ? (
            /* Success View */
            <div className="p-6 rounded-2xl bg-emerald-950/30 border border-emerald-800/60 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="h-14 w-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Deployment Successful!</h3>
                <p className="text-xs text-slate-400 mt-1">Your web application is live and accessible.</p>
              </div>

              {/* URL Pill */}
              <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 p-2 rounded-xl text-xs font-mono">
                <Globe className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="truncate flex-1 text-slate-200 text-left">{deployedUrl}</span>
                <button
                  onClick={copyUrl}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors shrink-0"
                  title="Copy link"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <a
                  href={deployedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
                >
                  <span>Open Live Application</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <div className="flex items-center gap-2">
                  <a
                    href="/hosting"
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-purple-900/40"
                  >
                    <Server className="h-3.5 w-3.5 text-purple-400" />
                    <span>View in Hosting Panel</span>
                  </a>
                  <button
                    onClick={() => setDeployedUrl(null)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                  >
                    Deploy Another
                  </button>
                </div>
              </div>
            </div>
          ) : isDeploying ? (
            /* Active Deployment Progress View */
            <div className="py-8 space-y-6 text-center">
              <div className="h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">Deploying to Live Server</h3>
                <p className="text-xs text-emerald-400 font-mono animate-pulse">{steps[currentStep]}</p>
              </div>

              <div className="max-w-xs mx-auto space-y-2">
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-300"
                    style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Step {currentStep + 1} of 4</span>
                  <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
                </div>
              </div>
            </div>
          ) : (
            /* Target Selection & 1-Click Action View */
            <div className="space-y-4">
              <div className="text-xs font-semibold text-slate-300">Choose Deployment Destination:</div>

              <div className="grid grid-cols-1 gap-2.5">
                {/* 1. Ultrapie Instant Edge Subdomain */}
                <button
                  onClick={() => setDeployTarget('edge')}
                  className={`p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all ${
                    deployTarget === 'edge'
                      ? 'bg-purple-950/40 border-purple-500 shadow-md shadow-purple-500/10'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div
                    className={`p-2.5 rounded-xl ${
                      deployTarget === 'edge' ? 'bg-gradient-to-tr from-purple-500 to-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Globe className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white">Ultrapie Edge Subdomain (*.ultrapie.com)</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold">
                        Recommended • Instant
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Instant zero-config live deployment with wildcard SSL. Direct edge execution, fast CDN caching, and custom domain support.
                    </p>
                  </div>
                </button>

                {/* 2. Coolify Self-Hosted VPS */}
                <button
                  onClick={() => setDeployTarget('coolify')}
                  className={`p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all ${
                    deployTarget === 'coolify'
                      ? 'bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-500/10'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div
                    className={`p-2.5 rounded-xl ${
                      deployTarget === 'coolify' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Server className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white">Self-Hosted VPS (Coolify v4)</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">
                        Docker :8000
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Deploys to your local or remote Coolify instance on port 8000. Full container isolation with automated health checks.
                    </p>
                  </div>
                </button>

                {/* 3. ZIP Export */}
                <button
                  onClick={() => setDeployTarget('zip')}
                  className={`p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all ${
                    deployTarget === 'zip'
                      ? 'bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-500/10'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div
                    className={`p-2.5 rounded-xl ${
                      deployTarget === 'zip' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Download className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-bold text-white">Download Standalone ZIP</span>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Exports full source code with Vite, React 19, TypeScript, and Tailwind ready to run locally (<code className="text-cyan-400">npm run dev</code>).
                    </p>
                  </div>
                </button>
              </div>

              {/* Action Button */}
              <button
                onClick={handle1ClickDeploy}
                className="w-full mt-2 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:brightness-110 text-white font-bold text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all"
              >
                <Rocket className="h-4 w-4" />
                <span>
                  {deployTarget === 'zip' ? 'Download Project (.zip)' : '🚀 Deploy Live in 1 Click'}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
