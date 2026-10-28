'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Globe,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Server,
  Code2,
  RefreshCw,
  AlertCircle,
  Loader2,
  Terminal,
  Smartphone,
} from 'lucide-react';
import { EdgeDeployment } from '@/lib/hosting/edge-deployments';
import { QRCodeShareModal } from '@/components/hosting/QRCodeShareModal';

export default function PreviewDeploymentPage() {
  const params = useParams();
  const slug = (params?.slug as string) || '';

  const [deployment, setDeployment] = useState<EdgeDeployment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [bannerMinimized, setBannerMinimized] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!slug) return;

    async function fetchDeployment() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/deployments?slug=${encodeURIComponent(slug)}`);
        const data = await res.json();
        if (res.ok && data.deployment) {
          setDeployment(data.deployment);
        } else {
          setError(data.error || 'Deployment not found');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load deployment');
      } finally {
        setLoading(false);
      }
    }

    fetchDeployment();
  }, [slug]);

  // Code files
  const files = deployment?.files || {};
  const appFileKey = Object.keys(files).find(
    (k) => k === 'src/App.tsx' || k === 'App.tsx' || k.endsWith('.tsx') || k.endsWith('.jsx')
  );
  const appCode = appFileKey ? files[appFileKey] : (files['src/App.tsx'] || '');
  const cssCode = files['src/index.css'] || files['src/App.css'] || '';

  const sanitizedReactCode = useMemo(() => {
    return appCode ? appCode.replace(/import\s+['"][^'"]+\.css['"];?/g, '') : '';
  }, [appCode]);

  const previewHtml = useMemo(() => {
    const codeToRun = sanitizedReactCode || '';

    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${deployment?.name || 'Ultrapie Live Application'}</title>
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- React 18 UMD -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js"></script>
    <!-- Babel Standalone for live in-browser TSX/JSX compilation -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.24.4/babel.min.js"></script>
    <style id="custom-css">
      ${cssCode}
      * { box-sizing: border-box; }
      body { margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
    </style>
  </head>
  <body class="bg-slate-950 text-slate-100 min-h-screen antialiased">
    <div id="root">
      <div id="initial-loading" style="padding: 2.5rem; color: #38bdf8; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; gap: 12px;">
        <div style="width: 20px; height: 20px; border-radius: 50%; background: #38bdf8; animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <b style="font-size: 15px; color: #f8fafc;">Ultrapie Edge Runtime Loading...</b>
        <span style="font-size: 12px; color: #94a3b8;">${deployment?.subdomain || 'Serving from Edge CDN'}</span>
      </div>
    </div>

    <script>
      const INITIAL_SOURCE = ${JSON.stringify(codeToRun)};
      const INITIAL_CSS = ${JSON.stringify(cssCode)};

      const LucideProxy = new Proxy({}, {
        get: (target, prop) => {
          return function IconMock(props) {
            props = props || {};
            return React.createElement('svg', {
              xmlns: 'http://www.w3.org/2000/svg',
              width: props.size || 18,
              height: props.size || 18,
              viewBox: '0 0 24 24',
              fill: 'none',
              stroke: 'currentColor',
              strokeWidth: '2',
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
              className: props.className || '',
              style: props.style
            }, [
              React.createElement('circle', { key: '1', cx: 12, cy: 12, r: 8, opacity: 0.25, fill: 'currentColor' }),
              React.createElement('path', { key: '2', d: 'M12 7v10M7 12h10' })
            ]);
          };
        }
      });

      const clsx = (...args) => args.flat().filter(Boolean).join(' ');
      const twMerge = clsx;

      let reactRoot = null;

      function compileAndRender(code, css) {
        if (css !== undefined) {
          const styleEl = document.getElementById('custom-css');
          if (styleEl) styleEl.textContent = css;
        }

        if (!code || !code.trim()) return;

        if (!window.Babel || !window.React || !window.ReactDOM) {
          setTimeout(() => compileAndRender(code, css), 50);
          return;
        }

        try {
          const transpiled = Babel.transform(code, {
            presets: [
              'typescript',
              ['env', { modules: 'commonjs' }],
              ['react', { runtime: 'classic' }]
            ],
            filename: 'App.tsx'
          }).code;

          const require = (name) => {
            if (name === 'react') return React;
            if (name === 'react-dom') return ReactDOM;
            if (name === 'lucide-react') return LucideProxy;
            return {};
          };

          const exports = {};
          const module = { exports };

          const runner = new Function(
            'React',
            'ReactDOM',
            'require',
            'exports',
            'module',
            'LucideProxy',
            'clsx',
            'twMerge',
            transpiled
          );

          runner(React, ReactDOM, require, exports, module, LucideProxy, clsx, twMerge);

          const TargetComp = exports.default || module.exports.default || exports.App || window.App;
          if (TargetComp) {
            const rootContainer = document.getElementById('root');
            if (!reactRoot && rootContainer) {
              reactRoot = ReactDOM.createRoot(rootContainer);
            }
            if (reactRoot) {
              reactRoot.render(React.createElement(TargetComp));
            }
          }
        } catch (err) {
          console.error('Execution error:', err);
          const rootContainer = document.getElementById('root');
          if (rootContainer) {
            rootContainer.innerHTML = '<div style="padding: 2rem; color: #ef4444; font-family: monospace;"><b>Runtime Error:</b><pre>' + err.message + '</pre></div>';
          }
        }
      }

      const checkReady = setInterval(() => {
        if (window.Babel && window.React && window.ReactDOM) {
          clearInterval(checkReady);
          if (INITIAL_SOURCE) {
            compileAndRender(INITIAL_SOURCE, INITIAL_CSS);
          }
        }
      }, 50);
    </script>
  </body>
</html>`;
  }, [deployment, sanitizedReactCode, cssCode]);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined' && deployment) {
      navigator.clipboard.writeText(`https://${deployment.subdomain}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-200">
        <Loader2 className="h-8 w-8 text-purple-400 animate-spin mb-3" />
        <p className="text-sm font-medium">Resolving Edge Deployment...</p>
        <span className="text-xs text-slate-500 font-mono mt-1">{slug}</span>
      </div>
    );
  }

  if (error || !deployment) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center shadow-2xl">
          <AlertCircle className="h-12 w-12 text-rose-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Deployment Not Found</h1>
          <p className="text-sm text-slate-400 mb-6">
            The requested application <span className="font-mono text-purple-300">"{slug}"</span> does not exist or has been removed.
          </p>
          <div className="flex flex-col gap-2.5">
            <Link
              href="/hosting"
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-600/30"
            >
              <Server className="h-4 w-4" />
              <span>Go to Hosting Control Center</span>
            </Link>
            <Link
              href="/studio"
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <Sparkles className="h-4 w-4" />
              <span>Launch AI Studio</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 flex flex-col">
      {/* Floating Edge Hosting Bar */}
      <div
        className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
          bannerMinimized ? 'opacity-90 hover:opacity-100' : ''
        }`}
      >
        {bannerMinimized ? (
          <button
            onClick={() => setBannerMinimized(false)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 shadow-2xl backdrop-blur-md text-xs font-medium transition-all"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono">{deployment.subdomain}</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>
        ) : (
          <div className="p-3.5 rounded-2xl bg-slate-900/95 border border-slate-800 shadow-2xl backdrop-blur-xl flex flex-col gap-2.5 min-w-[340px]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center shadow-sm">
                  <Globe className="h-3.5 w-3.5 text-white" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white leading-tight">{deployment.name}</div>
                  <div className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                    <span>Edge CDN (Live)</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-cyan-400">v{deployment.version}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setBannerMinimized(true)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Minimize banner"
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 text-[11px] font-mono text-slate-300">
              <span className="truncate max-w-[170px]">{deployment.subdomain}</span>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <button
                  onClick={() => setIsQrOpen(true)}
                  className="p-1 rounded-md bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 transition-colors"
                  title="Mobile QR Code"
                >
                  <Smartphone className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={handleCopyLink}
                  className="text-purple-400 hover:text-purple-300 flex items-center gap-1 font-sans text-[10px] p-1"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Link
                href="/hosting"
                className="flex-1 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors border border-slate-700/60"
              >
                <Server className="h-3 w-3 text-purple-400" />
                <span>Hosting</span>
              </Link>
              <Link
                href="/studio"
                className="flex-1 py-1.5 px-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors shadow-sm shadow-purple-600/30"
              >
                <Code2 className="h-3 w-3" />
                <span>Open in Studio</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Embedded Application Viewport */}
      <iframe
        ref={iframeRef}
        srcDoc={previewHtml}
        title={deployment.name}
        className="w-full h-full border-none"
        sandbox="allow-scripts allow-same-origin allow-modals allow-forms allow-popups"
      />

      <QRCodeShareModal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        deployment={deployment}
      />
    </div>
  );
}
