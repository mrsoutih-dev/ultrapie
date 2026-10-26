'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Server,
  Cloud,
  Cpu,
  HardDrive,
  RefreshCw,
  ExternalLink,
  Play,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Settings2,
  Terminal,
  Activity,
  Plus,
  GitBranch,
  Key,
  Globe,
  Loader2,
} from 'lucide-react';
import { CreateCoolifyAppModal } from '@/components/hosting/CreateCoolifyAppModal';

interface CoolifyServer {
  id: number | string;
  uuid: string;
  name: string;
  ip: string;
  status: string;
  is_reachable: boolean;
  cpu_usage?: string;
  memory_usage?: string;
  docker_version?: string;
}

interface CoolifyApp {
  id: number | string;
  uuid: string;
  name: string;
  status: string;
  fqdn?: string;
  git_repository?: string;
  git_branch?: string;
  build_pack?: string;
  updated_at?: string;
  server_name?: string;
}

export default function HostingPage() {
  const [coolifyUrl, setCoolifyUrl] = useState('');
  const [token, setToken] = useState('');
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isDemo, setIsDemo] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [deployingAppUuid, setDeployingAppUuid] = useState<string | null>(null);

  const [servers, setServers] = useState<CoolifyServer[]>([]);
  const [applications, setApplications] = useState<CoolifyApp[]>([]);
  const [activeTab, setActiveTab] = useState<'apps' | 'servers' | 'settings'>('apps');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Load saved credentials on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUrl =
        localStorage.getItem('ultrapie_coolify_url') || 'http://localhost:8000';
      const savedToken =
        localStorage.getItem('ultrapie_coolify_token') ||
        '6|9gNNiFPNnxeA3Yk7O83K5ijExdoQpMP2zTIYoJBi';
      setCoolifyUrl(savedUrl);
      setToken(savedToken);

      // Fetch initial data
      fetchData(savedUrl, savedToken);
    }
  }, []);

  const fetchData = async (url: string, tok: string) => {
    setIsLoading(true);
    try {
      // 1. Ping
      const pingRes = await fetch('/api/coolify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coolifyUrl: url, token: tok, action: 'ping' }),
      });
      const pingData = await pingRes.json();
      setIsConnected(pingData.connected || false);
      setIsDemo(pingData.status === 'simulated' || !url);
      setStatusMessage(pingData.message || 'Connected to Coolify instance');

      // 2. Fetch Servers
      const serversRes = await fetch('/api/coolify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coolifyUrl: url, token: tok, action: 'servers' }),
      });
      const serversData = await serversRes.json();
      if (serversData.servers) {
        setServers(serversData.servers);
      }

      // 3. Fetch Applications
      const appsRes = await fetch('/api/coolify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coolifyUrl: url, token: tok, action: 'applications' }),
      });
      const appsData = await appsRes.json();
      if (appsData.applications) {
        setApplications(appsData.applications);
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage(err.message || 'Error connecting to Coolify');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAndConnect = async () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ultrapie_coolify_url', coolifyUrl.trim());
      localStorage.setItem('ultrapie_coolify_token', token.trim());
    }
    await fetchData(coolifyUrl.trim(), token.trim());
  };

  const handleTriggerDeploy = async (uuid: string) => {
    setDeployingAppUuid(uuid);
    try {
      const res = await fetch('/api/coolify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coolifyUrl,
          token,
          action: 'deploy',
          appUuid: uuid,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Coolify deployment triggered successfully!');
      } else {
        alert(`Deployment failed: ${data.error || 'Server error'}`);
      }
    } catch (err: any) {
      alert(`Error triggering deploy: ${err.message}`);
    } finally {
      setDeployingAppUuid(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-40 px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center shadow-md shadow-purple-500/20">
              <Server className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg text-white">ultrapie</span>
          </Link>
          <span className="text-slate-600">/</span>
          <div className="flex items-center gap-2 text-sm text-purple-300 font-semibold">
            <Cloud className="h-4 w-4" />
            <span>Coolify Hosting Panel</span>
          </div>
          {isDemo ? (
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-400 border border-amber-800/60 font-medium">
              Demo / Preview Mode
            </span>
          ) : isConnected ? (
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-medium flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Connected
            </span>
          ) : (
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-950/80 text-red-400 border border-red-800/60 font-medium">
              Disconnected
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchData(coolifyUrl, token)}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link
            href="/studio"
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-md shadow-blue-600/20"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Back to Studio</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {/* Banner / Info */}
        <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-slate-900 border border-purple-900/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="h-5 w-5 text-purple-400" />
              <h1 className="text-xl font-bold text-white">Self-Hosted Infrastructure via Coolify API</h1>
            </div>
            <p className="text-sm text-slate-300 max-w-2xl">
              Connect your own self-hosted Coolify instance to orchestrate Docker containers, deploy projects directly from Git, configure automatic SSL certificates, and monitor your VPS resources.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('settings')}
            className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-purple-600/25 transition-all"
          >
            <Settings2 className="h-4 w-4" />
            <span>Server Settings</span>
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-6 text-sm">
          <button
            onClick={() => setActiveTab('apps')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'apps'
                ? 'bg-purple-950 text-purple-300 border border-purple-800/80 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>Applications ({applications.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('servers')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'servers'
                ? 'bg-purple-950 text-purple-300 border border-purple-800/80 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Server className="h-4 w-4" />
            <span>Servers ({servers.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'settings'
                ? 'bg-purple-950 text-purple-300 border border-purple-800/80 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Key className="h-4 w-4" />
            <span>Coolify API Credentials</span>
          </button>
        </div>

        {/* TAB 1: Applications */}
        {activeTab === 'apps' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-200">Deployed Applications</h2>
                <span className="text-xs text-slate-500">
                  Manage and trigger 1-click zero-downtime rebuilds
                </span>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-purple-600/25 transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>New Application</span>
              </button>
            </div>

            {applications.length === 0 ? (
              <div className="p-12 text-center rounded-xl bg-slate-900/40 border border-slate-800 text-slate-400">
                <Cloud className="h-10 w-10 mx-auto text-slate-600 mb-3" />
                <p className="text-sm font-medium">No applications found on Coolify.</p>
                <p className="text-xs text-slate-500 mt-1">
                  Connect your server in API Credentials or create your first application.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {applications.map((app) => (
                  <div
                    key={app.uuid}
                    className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-purple-800/50 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <h3 className="font-semibold text-white text-base leading-tight">
                            {app.name}
                          </h3>
                          <span className="text-[11px] font-mono text-slate-500">
                            UUID: {app.uuid}
                          </span>
                        </div>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                          {app.status}
                        </span>
                      </div>

                      {app.fqdn && (
                        <div className="mb-3">
                          <a
                            href={app.fqdn}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 font-mono underline underline-offset-2 break-all"
                          >
                            <Globe className="h-3.5 w-3.5 flex-shrink-0" />
                            <span>{app.fqdn}</span>
                            <ExternalLink className="h-3 w-3 flex-shrink-0" />
                          </a>
                        </div>
                      )}

                      <div className="space-y-1.5 text-xs text-slate-400 bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
                        {app.git_repository && (
                          <div className="flex items-center gap-1.5 truncate">
                            <GitBranch className="h-3.5 w-3.5 text-cyan-400 flex-shrink-0" />
                            <span className="text-slate-300 font-mono truncate">
                              {app.git_repository} ({app.git_branch || 'main'})
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                          <span>Build Pack: <strong className="text-slate-300">{app.build_pack || 'nixpacks'}</strong></span>
                          <span>Server: <strong className="text-slate-300">{app.server_name || 'Primary'}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                      <span suppressHydrationWarning className="text-[11px] text-slate-500">
                        {app.updated_at ? `Updated: ${new Date(app.updated_at).toLocaleTimeString()}` : ''}
                      </span>
                      <button
                        onClick={() => handleTriggerDeploy(app.uuid)}
                        disabled={deployingAppUuid === app.uuid}
                        className="px-3 py-1.5 rounded-lg bg-purple-600/90 hover:bg-purple-600 text-white text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        {deployingAppUuid === app.uuid ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span>Deploying...</span>
                          </>
                        ) : (
                          <>
                            <Play className="h-3.5 w-3.5" />
                            <span>Deploy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Servers */}
        {activeTab === 'servers' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-200">Connected VPS / Nodes</h2>
              <span className="text-xs text-slate-500">
                Docker Daemon health & resource consumption
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {servers.map((server) => (
                <div
                  key={server.uuid}
                  className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-indigo-950 border border-indigo-800/60 flex items-center justify-center text-indigo-400">
                        <Server className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{server.name}</h3>
                        <p className="text-xs text-slate-400 font-mono">IP: {server.ip}</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                      {server.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center pt-3 border-t border-slate-800">
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/60">
                      <Cpu className="h-4 w-4 mx-auto text-cyan-400 mb-1" />
                      <div className="text-xs text-slate-400">CPU Usage</div>
                      <div className="text-sm font-semibold text-white">{server.cpu_usage || '18%'}</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/60">
                      <HardDrive className="h-4 w-4 mx-auto text-purple-400 mb-1" />
                      <div className="text-xs text-slate-400">Memory</div>
                      <div className="text-sm font-semibold text-white">{server.memory_usage || '3.4GB / 8GB'}</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/60">
                      <Terminal className="h-4 w-4 mx-auto text-emerald-400 mb-1" />
                      <div className="text-xs text-slate-400">Docker</div>
                      <div className="text-sm font-semibold text-white">{server.docker_version || '27.x'}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: API Credentials / Configuration */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-white">Coolify Instance Connection</h2>
              <p className="text-xs text-slate-400 mt-1">
                Provide your server endpoint and Coolify Bearer API Token. You can generate an API Token in your Coolify dashboard under Keys & Tokens.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Coolify Server URL
                </label>
                <input
                  type="text"
                  placeholder="https://coolify.yourdomain.com or http://<IP>:8000"
                  value={coolifyUrl}
                  onChange={(e) => setCoolifyUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Coolify API Bearer Token
                </label>
                <input
                  type="password"
                  placeholder="1|AbCdEf123456789..."
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>
            </div>

            {statusMessage && (
              <div
                className={`p-3.5 rounded-lg text-xs flex items-start gap-2 ${
                  isConnected
                    ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/60'
                    : isDemo
                    ? 'bg-amber-950/40 text-amber-300 border border-amber-800/60'
                    : 'bg-red-950/40 text-red-300 border border-red-800/60'
                }`}
              >
                {isConnected ? (
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5 text-emerald-400" />
                ) : isDemo ? (
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-amber-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-red-400" />
                )}
                <span>{statusMessage}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setCoolifyUrl('');
                  setToken('');
                  if (typeof window !== 'undefined') {
                    localStorage.removeItem('ultrapie_coolify_url');
                    localStorage.removeItem('ultrapie_coolify_token');
                  }
                  fetchData('', '');
                }}
                className="px-3.5 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                Reset to Demo
              </button>
              <button
                onClick={handleSaveAndConnect}
                disabled={isLoading}
                className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Save & Test Connection</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Create New Application Modal */}
      <CreateCoolifyAppModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        servers={servers.map((s) => ({ uuid: s.uuid, name: s.name, ip: s.ip }))}
        onAppCreated={(newApp) => {
          setApplications((prev) => [newApp, ...prev]);
        }}
      />
    </div>
  );
}
