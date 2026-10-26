'use client';

import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Globe,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Layout,
  Code2,
  Layers,
  ArrowRight,
  TrendingUp,
  ShoppingBag,
  Briefcase,
  Smartphone,
  CheckCircle2,
  Rocket,
  RotateCw,
} from 'lucide-react';
import { ViewportMode } from '@/hooks/useStudioState';

interface PreviewSandboxProps {
  files: Record<string, string>;
  viewport: ViewportMode;
  previewKey: number;
  onSendPrompt?: (prompt: string) => void;
  isStreaming?: boolean;
  streamingLineCount?: number;
  onOpenEasyDeploy?: () => void;
}

export function PreviewSandbox({
  files,
  viewport,
  previewKey,
  onSendPrompt,
  isStreaming,
  streamingLineCount,
  onOpenEasyDeploy,
}: PreviewSandboxProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const fileKeys = Object.keys(files);
  const isEmpty = fileKeys.length === 0;

  const appFileKey = Object.keys(files).find(
    (k) => k === 'src/App.tsx' || k === 'App.tsx' || k.endsWith('.tsx') || k.endsWith('.jsx')
  );
  const appCode = appFileKey ? files[appFileKey] : (files['src/App.tsx'] || '');
  const cssCode = files['src/index.css'] || files['src/App.css'] || '';
  const indexHtml = files['index.html'] || '';

  // Clean code for in-memory Babel Standalone execution
  const sanitizedReactCode = useMemo(() => {
    return appCode.replace(/import\s+['"][^'"]+\.css['"];?/g, '');
  }, [appCode]);

  // Construct complete HTML with embedded initial code & multi-CDN fallback
  const previewHtml = useMemo(() => {
    if (indexHtml && indexHtml.includes('<!DOCTYPE html>')) {
      return indexHtml;
    }

    const codeToRun = sanitizedReactCode || '';

    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <!-- Tailwind CSS with animation plugins -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- React 18 UMD with CDN fallbacks -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js" onerror="this.onerror=null;this.src='https://unpkg.com/react@18/umd/react.production.min.js';"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js" onerror="this.onerror=null;this.src='https://unpkg.com/react-dom@18/umd/react-dom.production.min.js';"></script>
    <!-- Babel Standalone for live in-browser TSX/JSX compilation -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.24.4/babel.min.js" onerror="this.onerror=null;this.src='https://unpkg.com/@babel/standalone/babel.min.js';"></script>
    <style id="custom-css">
      ${cssCode}
      /* Smooth transitions */
      * { box-sizing: border-box; }
      body { margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
    </style>
  </head>
  <body class="bg-slate-950 text-slate-100 min-h-screen antialiased">
    <div id="root">
      <div id="initial-loading" style="padding: 2.5rem; color: #38bdf8; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; gap: 12px;">
        <div style="width: 16px; height: 16px; border-radius: 50%; background: #38bdf8; animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <b style="font-size: 15px; color: #f8fafc;">Ultrapie Live App Initializing...</b>
        <span style="font-size: 12px; color: #94a3b8;">Assembling component tree and styles</span>
      </div>
    </div>

    <script>
      // Initial embedded component source (ensures direct execution on first load or new tab)
      const INITIAL_SOURCE = ${JSON.stringify(codeToRun)};
      const INITIAL_CSS = ${JSON.stringify(cssCode)};

      // Universal SVG icon mock for Lucide React
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

      // Browser utility mock
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
              window.__lastGoodTree = TargetComp;
            }
          }
        } catch (err) {
          console.debug('Preview compiling...', err.message);
        }
      }

      // 1. Compile initial embedded source as soon as Babel is ready
      const checkReady = setInterval(() => {
        if (window.Babel && window.React && window.ReactDOM) {
          clearInterval(checkReady);
          if (INITIAL_SOURCE) {
            compileAndRender(INITIAL_SOURCE, INITIAL_CSS);
          }
          window.parent.postMessage({ type: 'SANDBOX_READY' }, '*');
        }
      }, 25);

      // 2. Listen for live code updates from parent studio window
      window.addEventListener('message', (e) => {
        if (!e.data) return;
        if (e.data.type === 'UPDATE_CODE') {
          compileAndRender(e.data.code, e.data.css);
        }
      });
    </script>
  </body>
</html>`;
  }, [sanitizedReactCode, cssCode, indexHtml]);

  const postCodeToIframe = useCallback(
    (code: string, css: string) => {
      if (!iframeRef.current?.contentWindow) return;
      iframeRef.current.contentWindow.postMessage(
        {
          type: 'UPDATE_CODE',
          code,
          css,
        },
        '*'
      );
    },
    []
  );

  useEffect(() => {
    if (!isEmpty && sanitizedReactCode) {
      postCodeToIframe(sanitizedReactCode, cssCode);
    }
  }, [sanitizedReactCode, cssCode, isEmpty, postCodeToIframe]);

  useEffect(() => {
    if (!isEmpty && sanitizedReactCode) {
      postCodeToIframe(sanitizedReactCode, cssCode);
    }
  }, [previewKey, isEmpty, sanitizedReactCode, cssCode, postCodeToIframe]);

  const getViewportWidth = () => {
    switch (viewport) {
      case 'mobile':
        return 'max-w-[375px]';
      case 'tablet':
        return 'max-w-[768px]';
      default:
        return 'w-full';
    }
  };

  const STARTER_PROMPTS = [
    {
      title: 'Modern SaaS Landing Page',
      desc: 'Hero section with gradient text, 3-tier pricing cards, customer testimonials, and contact modal.',
      icon: Layout,
      prompt: 'Build a modern SaaS landing page for an AI productivity app with a hero section, gradient buttons, 3 pricing tiers (Free, Pro, Enterprise), customer reviews, and a FAQ accordion.',
    },
    {
      title: 'Analytics & Sales Dashboard',
      desc: 'Interactive KPI metric cards, revenue trends, status badges, and searchable data table.',
      icon: TrendingUp,
      prompt: 'Create a responsive analytics dashboard with metric summary cards (Revenue, Active Users, Conversions), a visual activity chart, and a recent orders table with filter buttons.',
    },
    {
      title: 'Developer / Designer Portfolio',
      desc: 'Project showcase grid with live tags, skills pills, about me bio, and social contact links.',
      icon: Briefcase,
      prompt: 'Build a sleek developer portfolio website with a hero banner, filterable project cards (web, mobile, AI), a skills checklist, and a contact form with social links.',
    },
    {
      title: 'E-Commerce Product Showcase',
      desc: 'Product gallery cards with prices, category filters, and an interactive shopping cart counter.',
      icon: ShoppingBag,
      prompt: 'Create a modern e-commerce product store with category filters (Sneakers, Watches, Bags), product cards with prices and ratings, and an interactive Add-to-Cart drawer.',
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 border-l border-slate-800">
      {/* Sandbox Header / URL Bar */}
      <div className="h-10 border-b border-slate-800 bg-slate-950 px-3 flex items-center justify-between text-xs text-slate-400 select-none">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-400 text-xs flex-1 truncate font-mono">
            <Globe className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
            <span className="truncate">
              {isEmpty ? 'studio://empty-canvas' : 'https://preview-studio.ultrapie.app'}
            </span>
            {isStreaming ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-300 font-sans border border-cyan-800 ml-auto shrink-0 animate-pulse">
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping"></span>
                <span>Live Rendering {streamingLineCount ? `(Line ${streamingLineCount})` : ''}</span>
              </span>
            ) : (
              <ShieldCheck className="h-3 w-3 text-emerald-400 shrink-0 ml-auto" />
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenEasyDeploy && (
            <button
              onClick={onOpenEasyDeploy}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:brightness-110 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all"
              title="1-Click Easy Deploy"
            >
              <Rocket className="h-3.5 w-3.5 text-white" />
              <span>Easy Deploy</span>
            </button>
          )}

          {!isEmpty && (
            <>
              <button
                onClick={() => postCodeToIframe(sanitizedReactCode, cssCode)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                title="Refresh Preview"
              >
                <RotateCw className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => {
                  const blob = new Blob([previewHtml], { type: 'text/html' });
                  const url = URL.createObjectURL(blob);
                  window.open(url, '_blank');
                }}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                title="Open preview in new tab"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Frame Container */}
      <div className="flex-1 bg-slate-900/40 p-4 flex items-center justify-center overflow-auto">
        {isEmpty ? (
          /* Google AI Studio Style Empty Canvas */
          <div className={`w-full text-center p-8 space-y-8 animate-in fade-in transition-all duration-300 ${viewport === 'desktop' ? 'max-w-2xl' : getViewportWidth()}`}>
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 text-xs font-semibold shadow-inner">
                <Sparkles className="h-3.5 w-3.5 text-cyan-400 animate-spin" />
                <span>Google AI Studio Experience &bull; Gemini Engine</span>
              </div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">
                What app or website would you like to build?
              </h2>
              <p className="text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
                Describe any idea in natural language in the chat on the left. Gemini will structure the project, write production code, and render your live app here instantly.
              </p>
            </div>

            {/* Quick-Prompt Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              {STARTER_PROMPTS.map((card, idx) => {
                const IconComp = card.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => onSendPrompt && onSendPrompt(card.prompt)}
                    className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/70 hover:bg-slate-850 text-left transition-all group flex flex-col justify-between shadow-lg hover:shadow-cyan-500/10"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="h-8 w-8 rounded-lg bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
                          <IconComp className="h-4 w-4" />
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                      </div>
                      <h4 className="font-bold text-white text-xs mb-1 group-hover:text-cyan-300 transition-colors">
                        {card.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 leading-snug">
                        {card.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div
            className={`h-full shadow-2xl rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex flex-col transition-all duration-300 ${getViewportWidth()}`}
          >
            <iframe
              key={previewKey}
              ref={iframeRef}
              srcDoc={previewHtml}
              sandbox="allow-scripts allow-same-origin allow-modals allow-forms allow-popups"
              className="w-full h-full border-0 bg-slate-950"
              title="Ultrapie Live App Preview Sandbox"
            />
          </div>
        )}
      </div>
    </div>
  );
}
