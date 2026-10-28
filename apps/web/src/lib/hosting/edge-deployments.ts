import fs from 'fs';
import path from 'path';

export interface DeploymentLog {
  timestamp: string;
  level: 'info' | 'warn' | 'success' | 'error';
  message: string;
}

export interface DeploymentVersion {
  version: number;
  updatedAt: string;
  files: Record<string, string>;
  commitMsg?: string;
}

export interface DeploymentTelemetry {
  requests24h: number;
  bandwidth24h: string;
  cacheHitRate: string;
  avgLatencyMs: number;
  lcp: string;
  inp: string;
  cls: string;
  trafficHistory: number[];
}

export interface EdgeDeployment {
  id: string;
  name: string;
  slug: string;
  subdomain: string;
  status: 'ready' | 'building' | 'failed' | 'stopped';
  type: 'edge' | 'coolify';
  framework: string;
  files: Record<string, string>;
  envVars: Record<string, string>;
  customDomain?: string;
  sslStatus: 'active' | 'pending' | 'none';
  createdAt: string;
  updatedAt: string;
  bundleSize: string;
  version: number;
  history: DeploymentVersion[];
  logs: DeploymentLog[];
  serverName?: string;
  coolifyUuid?: string;
  telemetry: DeploymentTelemetry;
  gitBranch?: string;
  gitAutoDeploy?: boolean;
}

const RESERVED_SLUGS = new Set([
  'api',
  'admin',
  'auth',
  'studio',
  'preview',
  'hosting',
  'staging',
  'status',
  'docs',
  'cdn',
  'mail',
  'root',
  'ultrapie',
]);

export function generateDefaultTelemetry(seedMultiplier = 1): DeploymentTelemetry {
  const baseReq = Math.floor(800 * seedMultiplier + Math.random() * 600);
  const baseBandwidth = (baseReq * 0.018).toFixed(1);
  return {
    requests24h: baseReq,
    bandwidth24h: `${baseBandwidth} MB`,
    cacheHitRate: '99.4%',
    avgLatencyMs: Math.floor(14 + Math.random() * 8),
    lcp: '0.4s',
    inp: '11ms',
    cls: '0.00',
    trafficHistory: [
      Math.floor(20 * seedMultiplier),
      Math.floor(35 * seedMultiplier),
      Math.floor(52 * seedMultiplier),
      Math.floor(40 * seedMultiplier),
      Math.floor(78 * seedMultiplier),
      Math.floor(95 * seedMultiplier),
      Math.floor(120 * seedMultiplier),
      Math.floor(88 * seedMultiplier),
      Math.floor(65 * seedMultiplier),
      Math.floor(92 * seedMultiplier),
      Math.floor(105 * seedMultiplier),
      Math.floor(84 * seedMultiplier),
    ],
  };
}

export function isSlugAvailable(
  slug: string,
  excludeId?: string
): { available: boolean; reason?: string; suggested?: string } {
  const clean = slug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-');

  if (!clean || clean.length < 3) {
    return { available: false, reason: 'Slug must be at least 3 alphanumeric characters' };
  }

  if (RESERVED_SLUGS.has(clean)) {
    return {
      available: false,
      reason: `"${clean}" is a reserved system subdomain`,
      suggested: `${clean}-app`,
    };
  }

  const all = getDeployments();
  const exists = all.some(
    (d) => (d.slug.toLowerCase() === clean || d.subdomain.toLowerCase() === `${clean}.ultrapie.com`) && d.id !== excludeId
  );

  if (exists) {
    return {
      available: false,
      reason: `https://${clean}.ultrapie.com is already taken`,
      suggested: `${clean}-${Math.floor(10 + Math.random() * 89)}`,
    };
  }

  return { available: true };
}

const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'deployments.json');

// In-memory fallback if filesystem access is restricted
let inMemoryDeployments: EdgeDeployment[] = [
  {
    id: 'dep-counter-01',
    name: 'Ultrapie Counter App',
    slug: 'counter-demo',
    subdomain: 'counter-demo.ultrapie.com',
    status: 'ready',
    type: 'edge',
    framework: 'React 19 + Tailwind',
    bundleSize: '34.2 kB',
    version: 2,
    telemetry: generateDefaultTelemetry(1.2),
    gitBranch: 'main',
    gitAutoDeploy: true,
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    sslStatus: 'active',
    customDomain: 'counter.vibeheberg.com',
    envVars: {
      NEXT_PUBLIC_APP_ENV: 'production',
      VITE_API_ENDPOINT: 'https://api.ultrapie.com/v1',
    },
    files: {
      'src/App.tsx': `import React, { useState } from 'react';
import { Plus, Minus, RotateCcw, Sparkles, Zap, ShieldCheck } from 'lucide-react';

export default function App() {
  const [count, setCount] = useState(0);
  const [step, setStep] = useState(1);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center relative z-10 mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/80 text-purple-300 border border-purple-800/60 text-xs font-semibold mb-3">
            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            <span>Ultrapie Edge Instant Deploy</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Interactive Counter</h1>
          <p className="text-xs text-slate-400 mt-1">Live edge-served React 19 application</p>
        </div>

        <div className="py-8 bg-slate-950/70 border border-slate-800/80 rounded-2xl text-center mb-6 relative z-10">
          <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-400 font-mono">
            {count}
          </span>
          <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mt-2">
            Current Counter Value
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6 relative z-10">
          <button
            onClick={() => setCount((c) => c - step)}
            className="p-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-semibold flex items-center justify-center gap-1 transition-all border border-slate-700/60"
          >
            <Minus className="h-4 w-4" />
            <span>-{step}</span>
          </button>
          <button
            onClick={() => setCount(0)}
            className="p-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-slate-300 font-semibold flex items-center justify-center gap-1 transition-all border border-slate-700/60"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset</span>
          </button>
          <button
            onClick={() => setCount((c) => c + step)}
            className="p-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95 text-white font-semibold flex items-center justify-center gap-1 transition-all shadow-lg shadow-purple-600/30"
          >
            <Plus className="h-4 w-4" />
            <span>+{step}</span>
          </button>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-slate-800/80 relative z-10">
          <div className="flex items-center gap-1.5 text-emerald-400 font-mono">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Edge Cache: 18ms</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Step:</span>
            {[1, 5, 10].map((s) => (
              <button
                key={s}
                onClick={() => setStep(s)}
                className={\`px-2 py-0.5 rounded text-[11px] font-bold transition-all \${
                  step === s
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }\`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}`,
      'src/index.css': `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  background-color: #020617;
  color: #f8fafc;
  font-family: system-ui, -apple-system, sans-serif;
}`,
    },
    history: [
      {
        version: 1,
        updatedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
        files: {
          'src/App.tsx': `export default function App() { return <div className="p-8 text-white">Version 1 Initial</div>; }`,
        },
        commitMsg: 'Initial release from Studio',
      },
    ],
    logs: [
      { timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), level: 'info', message: 'Triggering release build v2 via Ultrapie Edge Engine...' },
      { timestamp: new Date(Date.now() - 3600000 * 2 + 200).toISOString(), level: 'info', message: 'Transpiling JSX/TSX modules with React 19 & Tailwind...' },
      { timestamp: new Date(Date.now() - 3600000 * 2 + 450).toISOString(), level: 'success', message: 'Bundle generated (34.2 kB). Uploading to Edge Storage...' },
      { timestamp: new Date(Date.now() - 3600000 * 2 + 750).toISOString(), level: 'success', message: 'Deployment live on https://counter-demo.ultrapie.com' },
    ],
  },
  {
    id: 'dep-portfolio-02',
    name: 'Sleek Vibe Portfolio',
    slug: 'vibe-portfolio',
    subdomain: 'vibe-portfolio.ultrapie.com',
    status: 'ready',
    type: 'edge',
    framework: 'React 19 + Tailwind',
    bundleSize: '51.8 kB',
    version: 1,
    telemetry: generateDefaultTelemetry(0.8),
    gitBranch: 'main',
    gitAutoDeploy: true,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    sslStatus: 'active',
    envVars: {
      VITE_SITE_TITLE: 'Elhoussine Soutih - Fullstack AI Engineer',
    },
    files: {
      'src/App.tsx': `import React from 'react';
import { Sparkles, Terminal, Code2, Globe, Github, Mail, ArrowUpRight } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-xl w-full p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
            <Terminal className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Elhoussine Soutih</h1>
            <p className="text-xs text-purple-400 font-mono">Senior AI Platform Architect & Full-Stack Builder</p>
          </div>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed mb-6">
          Building Ultrapie: the next-generation autonomous AI Vibe Coding studio and self-hosted cloud hosting infrastructure. Powered by Google Gemini and React 19.
        </p>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1 font-mono">Specialization</span>
            <span className="text-sm font-semibold text-white">Autonomous Agents & Edge</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1 font-mono">Status</span>
            <span className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Available for Projects
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a href="https://github.com" target="_blank" className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all">
            <Github className="h-4 w-4" />
            <span>GitHub Profile</span>
          </a>
          <a href="mailto:contact@ultrapie.com" className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border border-slate-700">
            <Mail className="h-4 w-4" />
            <span>Get in Touch</span>
          </a>
        </div>
      </div>
    </div>
  );
}`,
      'src/index.css': `@tailwind base;\n@tailwind components;\n@tailwind utilities;\nbody { margin: 0; background: #020617; }`,
    },
    history: [],
    logs: [
      { timestamp: new Date(Date.now() - 3600000 * 24).toISOString(), level: 'success', message: 'Deployed successfully to https://vibe-portfolio.ultrapie.com' },
    ],
  },
  {
    id: 'dep-coolify-api',
    name: 'Fastify API Microservice',
    slug: 'api-gateway',
    subdomain: 'api.ultrapie.com',
    status: 'ready',
    type: 'coolify',
    framework: 'Node.js / Dockerfile',
    bundleSize: '142 MB',
    version: 4,
    telemetry: generateDefaultTelemetry(2.4),
    gitBranch: 'main',
    gitAutoDeploy: true,
    createdAt: new Date(Date.now() - 3600000 * 96).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    sslStatus: 'active',
    serverName: 'Production VPS (Ubuntu 24.04)',
    coolifyUuid: 'app-api-gateway',
    envVars: {
      NODE_ENV: 'production',
      PORT: '4000',
    },
    files: {},
    history: [],
    logs: [
      { timestamp: new Date(Date.now() - 3600000 * 8).toISOString(), level: 'info', message: 'Coolify docker container rebuilt with Nixpacks.' },
      { timestamp: new Date(Date.now() - 3600000 * 8 + 300).toISOString(), level: 'success', message: 'Container healthy on port 4000.' },
    ],
  },
];

function loadDeployments(): EdgeDeployment[] {
  if (process.env.VITEST) {
    return inMemoryDeployments.map((d) => ({
      ...d,
      telemetry: d.telemetry || generateDefaultTelemetry(1),
      gitBranch: d.gitBranch || 'main',
      gitAutoDeploy: d.gitAutoDeploy ?? true,
    }));
  }

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((d: any) => ({
          ...d,
          telemetry: d.telemetry || generateDefaultTelemetry(1),
          gitBranch: d.gitBranch || 'main',
          gitAutoDeploy: d.gitAutoDeploy ?? true,
        }));
      }
    }
  } catch (e) {
    console.warn('Could not read deployments from file, using in-memory store:', e);
  }
  return inMemoryDeployments.map((d) => ({
    ...d,
    telemetry: d.telemetry || generateDefaultTelemetry(1),
    gitBranch: d.gitBranch || 'main',
    gitAutoDeploy: d.gitAutoDeploy ?? true,
  }));
}

export function createBranchDeployment(
  baseSlug: string,
  branchName: string,
  files?: Record<string, string>
): EdgeDeployment | null {
  const all = loadDeployments();
  const parent = all.find((d) => d.slug === baseSlug || d.id === baseSlug);
  if (!parent) return null;

  const cleanBranch = branchName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
  const branchSlug = `${cleanBranch}-${parent.slug}`;
  const branchNameDisplay = `${parent.name} (${branchName})`;

  const branchDep = createDeployment({
    name: branchNameDisplay,
    files: files || parent.files,
    type: parent.type,
    framework: parent.framework,
    envVars: parent.envVars,
  });

  branchDep.slug = branchSlug;
  branchDep.subdomain = `${branchSlug}.ultrapie.com`;
  branchDep.gitBranch = branchName;
  branchDep.gitAutoDeploy = true;
  branchDep.logs.unshift({
    timestamp: new Date().toISOString(),
    level: 'info',
    message: `Branch preview deployment provisioned for Git branch "${branchName}"`,
  });

  const updatedAll = loadDeployments();
  const idx = updatedAll.findIndex((d) => d.id === branchDep.id);
  if (idx !== -1) {
    updatedAll[idx] = branchDep;
    saveDeployments(updatedAll);
  }

  return branchDep;
}

function saveDeployments(deployments: EdgeDeployment[]) {
  inMemoryDeployments = deployments;
  if (process.env.VITEST) {
    return;
  }
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(deployments, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Could not write deployments to file, in-memory updated:', e);
  }
}

export function getDeployments(): EdgeDeployment[] {
  return loadDeployments();
}

export function getDeploymentBySlug(slug: string): EdgeDeployment | undefined {
  const all = loadDeployments();
  const normalized = slug.trim().toLowerCase();
  return all.find(
    (d) =>
      d.slug.toLowerCase() === normalized ||
      d.id.toLowerCase() === normalized ||
      d.subdomain.toLowerCase() === `${normalized}.ultrapie.com` ||
      d.customDomain?.toLowerCase() === normalized
  );
}

export function createDeployment(params: {
  name: string;
  files: Record<string, string>;
  type?: 'edge' | 'coolify';
  framework?: string;
  envVars?: Record<string, string>;
}): EdgeDeployment {
  const all = loadDeployments();
  const slug = params.name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || `app-${Date.now().toString(36)}`;

  // Calculate approximate bundle size
  const totalBytes = Object.values(params.files).reduce(
    (acc, content) => acc + (content ? content.length : 0),
    0
  );
  const bundleSize = `${Math.max(12, Math.round(totalBytes / 102.4) / 10)} kB`;

  const newDeployment: EdgeDeployment = {
    id: `dep-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    name: params.name || 'Untitled App',
    slug,
    subdomain: `${slug}.ultrapie.com`,
    status: 'ready',
    type: params.type || 'edge',
    framework: params.framework || 'React 19 + Tailwind',
    files: params.files,
    envVars: params.envVars || {
      NEXT_PUBLIC_APP_ENV: 'production',
    },
    sslStatus: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    bundleSize,
    version: 1,
    telemetry: generateDefaultTelemetry(1),
    gitBranch: 'main',
    gitAutoDeploy: true,
    history: [
      {
        version: 1,
        updatedAt: new Date().toISOString(),
        files: params.files,
        commitMsg: 'Initial deploy from Studio',
      },
    ],
    logs: [
      {
        timestamp: new Date().toISOString(),
        level: 'info',
        message: `Deployment initialized for ${params.name}...`,
      },
      {
        timestamp: new Date(Date.now() + 150).toISOString(),
        level: 'info',
        message: 'Bundling workspace files and resolving React 19 packages...',
      },
      {
        timestamp: new Date(Date.now() + 320).toISOString(),
        level: 'success',
        message: `Bundle compiled successfully (${bundleSize}). Storing in immutable edge release...`,
      },
      {
        timestamp: new Date(Date.now() + 500).toISOString(),
        level: 'success',
        message: `Edge routing live with TLS at https://${slug}.ultrapie.com`,
      },
    ],
  };

  // If a deployment with this slug already exists, update its version instead of duplicating
  const existingIdx = all.findIndex((d) => d.slug === slug);
  if (existingIdx !== -1) {
    const existing = all[existingIdx];
    const newVersion = existing.version + 1;
    existing.history.unshift({
      version: existing.version,
      updatedAt: existing.updatedAt,
      files: existing.files,
      commitMsg: `Snapshot prior to v${newVersion}`,
    });
    existing.files = params.files;
    existing.version = newVersion;
    existing.updatedAt = new Date().toISOString();
    existing.bundleSize = bundleSize;
    existing.status = 'ready';
    existing.logs.unshift({
      timestamp: new Date().toISOString(),
      level: 'success',
      message: `Updated release to version v${newVersion} and invalidated edge cache.`,
    });
    saveDeployments(all);
    return existing;
  }

  all.unshift(newDeployment);
  saveDeployments(all);
  return newDeployment;
}

export function updateDeployment(
  id: string,
  updates: Partial<EdgeDeployment>
): EdgeDeployment | null {
  const all = loadDeployments();
  const idx = all.findIndex((d) => d.id === id || d.slug === id);
  if (idx === -1) return null;

  const current = all[idx];
  const updated: EdgeDeployment = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  if (updates.envVars) {
    updated.logs.unshift({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'Environment variables updated and redeployment triggered.',
    });
  }

  if (updates.customDomain) {
    updated.logs.unshift({
      timestamp: new Date().toISOString(),
      level: 'success',
      message: `Custom domain ${updates.customDomain} linked. Automated SSL certificate issued.`,
    });
  }

  all[idx] = updated;
  saveDeployments(all);
  return updated;
}

export function rollbackDeployment(id: string, targetVersion: number): EdgeDeployment | null {
  const all = loadDeployments();
  const idx = all.findIndex((d) => d.id === id || d.slug === id);
  if (idx === -1) return null;

  const current = all[idx];
  const targetHistory = current.history.find((h) => h.version === targetVersion);
  if (!targetHistory) return null;

  // Save current version to history
  current.history.unshift({
    version: current.version,
    updatedAt: current.updatedAt,
    files: current.files,
    commitMsg: `Rolled back to v${targetVersion}`,
  });

  current.files = targetHistory.files;
  current.version = current.version + 1;
  current.updatedAt = new Date().toISOString();
  current.logs.unshift({
    timestamp: new Date().toISOString(),
    level: 'warn',
    message: `Instant rollback triggered! Reverted workspace files to release v${targetVersion}.`,
  });

  all[idx] = current;
  saveDeployments(all);
  return current;
}

export function deleteDeployment(id: string): boolean {
  const all = loadDeployments();
  const filtered = all.filter((d) => d.id !== id && d.slug !== id);
  if (filtered.length !== all.length) {
    saveDeployments(filtered);
    return true;
  }
  return false;
}
