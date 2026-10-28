'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Copy,
  Check,
  RotateCcw,
  Trash2,
  Search,
  Filter,
  Layers,
  Zap,
  Database,
  Smartphone,
  Share2,
  TrendingUp,
} from 'lucide-react';
import { CreateCoolifyAppModal } from '@/components/hosting/CreateCoolifyAppModal';
import { DeploymentLogsModal } from '@/components/hosting/DeploymentLogsModal';
import { EnvVarsModal } from '@/components/hosting/EnvVarsModal';
import { CustomDomainModal } from '@/components/hosting/CustomDomainModal';
import { RollbackModal } from '@/components/hosting/RollbackModal';
import { ProvisionDatabaseModal } from '@/components/hosting/ProvisionDatabaseModal';
import { DatabaseQueryModal } from '@/components/hosting/DatabaseQueryModal';
import { QRCodeShareModal } from '@/components/hosting/QRCodeShareModal';
import { DeploymentAnalyticsModal } from '@/components/hosting/DeploymentAnalyticsModal';
import { ClaimSubdomainModal } from '@/components/hosting/ClaimSubdomainModal';
import { BranchDeployModal } from '@/components/hosting/BranchDeployModal';
import { DisasterRecoveryModal } from '@/components/hosting/DisasterRecoveryModal';
import { EdgeDeployment } from '@/lib/hosting/edge-deployments';
import { ManagedDatabase } from '@/lib/hosting/managed-databases';

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

  // Data states
  const [servers, setServers] = useState<CoolifyServer[]>([]);
  const [coolifyApps, setCoolifyApps] = useState<CoolifyApp[]>([]);
  const [edgeDeployments, setEdgeDeployments] = useState<EdgeDeployment[]>([]);
  const [databases, setDatabases] = useState<ManagedDatabase[]>([]);

  // UI Navigation states
  const [activeTab, setActiveTab] = useState<'apps' | 'servers' | 'databases' | 'domains' | 'env' | 'settings'>('apps');
  const [filterType, setFilterType] = useState<'all' | 'edge' | 'coolify'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isProvisionDbOpen, setIsProvisionDbOpen] = useState(false);
  const [activeQueryDb, setActiveQueryDb] = useState<ManagedDatabase | null>(null);
  const [activeLogsDeployment, setActiveLogsDeployment] = useState<EdgeDeployment | null>(null);
  const [activeEnvDeployment, setActiveEnvDeployment] = useState<EdgeDeployment | null>(null);
  const [activeDomainDeployment, setActiveDomainDeployment] = useState<EdgeDeployment | null>(null);
  const [activeRollbackDeployment, setActiveRollbackDeployment] = useState<EdgeDeployment | null>(null);
  const [activeQrDeployment, setActiveQrDeployment] = useState<EdgeDeployment | null>(null);
  const [activeAnalyticsDeployment, setActiveAnalyticsDeployment] = useState<EdgeDeployment | null>(null);
  const [activeClaimDeployment, setActiveClaimDeployment] = useState<EdgeDeployment | null>(null);
  const [activeBranchDeployment, setActiveBranchDeployment] = useState<EdgeDeployment | null>(null);
  const [isDisasterRecoveryOpen, setIsDisasterRecoveryOpen] = useState(false);

  // Load saved credentials & initial data on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUrl =
        localStorage.getItem('ultrapie_coolify_url') || 'http://localhost:8000';
      const savedToken =
        localStorage.getItem('ultrapie_coolify_token') ||
        '6|9gNNiFPNnxeA3Yk7O83K5ijExdoQpMP2zTIYoJBi';
      setCoolifyUrl(savedUrl);
      setToken(savedToken);

      fetchAllData(savedUrl, savedToken);
    }
  }, []);

  const fetchAllData = async (url: string, tok: string) => {
    setIsLoading(true);
    try {
      // 1. Fetch Edge Deployments
      try {
        const edgeRes = await fetch('/api/deployments');
        const edgeData = await edgeRes.json();
        if (edgeData.deployments) {
          setEdgeDeployments(edgeData.deployments);
        }
      } catch (err) {
        console.warn('Could not fetch edge deployments:', err);
      }

      // 1.5 Fetch Managed Databases
      try {
        const dbRes = await fetch('/api/databases');
        const dbData = await dbRes.json();
        if (dbData.databases) {
          setDatabases(dbData.databases);
        }
      } catch (err) {
        console.warn('Could not fetch databases:', err);
      }

      // 2. Fetch Coolify Ping
      const pingRes = await fetch('/api/coolify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coolifyUrl: url, token: tok, action: 'ping' }),
      });
      const pingData = await pingRes.json();
      setIsConnected(pingData.connected || false);
      setIsDemo(pingData.status === 'simulated' || !url);
      setStatusMessage(pingData.message || 'Connected to Coolify instance');

      // 3. Fetch Coolify Servers
      const serversRes = await fetch('/api/coolify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coolifyUrl: url, token: tok, action: 'servers' }),
      });
      const serversData = await serversRes.json();
      if (serversData.servers) {
        setServers(serversData.servers);
      }

      // 4. Fetch Coolify Applications
      const appsRes = await fetch('/api/coolify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coolifyUrl: url, token: tok, action: 'applications' }),
      });
      const appsData = await appsRes.json();
      if (appsData.applications) {
        setCoolifyApps(appsData.applications);
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
    await fetchAllData(coolifyUrl.trim(), token.trim());
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

  const handleDeleteEdgeDeployment = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/deployments?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setEdgeDeployments((prev) => prev.filter((d) => d.id !== id));
      }
    } catch (e: any) {
      alert(`Error deleting deployment: ${e.message}`);
    }
  };

  const handleDeleteDatabase = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to terminate database "${name}"? All schema data will be deleted.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/databases?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setDatabases((prev) => prev.filter((d) => d.id !== id));
      }
    } catch (e: any) {
      alert(`Error deleting database: ${e.message}`);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(text);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const handleUpdateDeploymentInState = (updated: EdgeDeployment) => {
    setEdgeDeployments((prev) =>
      prev.map((d) => (d.id === updated.id ? updated : d))
    );
  };

  // Filtered applications
  const filteredEdgeDeployments = useMemo(() => {
    return edgeDeployments.filter((d) => {
      const matchesType = filterType === 'all' || filterType === d.type;
      const matchesSearch =
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.subdomain.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.customDomain && d.customDomain.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesType && matchesSearch;
    });
  }, [edgeDeployments, filterType, searchQuery]);

  const customDomainsList = useMemo(() => {
    return edgeDeployments.filter((d) => d.customDomain);
  }, [edgeDeployments]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
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
            <span>Cloud Hosting Control Center</span>
          </div>
          {isDemo ? (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-950/80 text-amber-400 border border-amber-800/60 font-medium">
              Demo Preview Mode
            </span>
          ) : isConnected ? (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-medium flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Coolify VPS Connected
            </span>
          ) : (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-950/80 text-red-400 border border-red-800/60 font-medium">
              Disconnected
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchAllData(coolifyUrl, token)}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setIsDisasterRecoveryOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-700/50 text-emerald-300 transition-colors shadow-sm"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Backups & DR</span>
          </button>
          <Link
            href="/studio"
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-colors shadow-md shadow-purple-600/25"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Launch Studio</span>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {/* Banner with Telemetry Summary */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-950/40 to-slate-900/60 border border-purple-900/40">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2 font-medium">
              <span>Active Deployments</span>
              <Activity className="h-4 w-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-white">{edgeDeployments.length + coolifyApps.length}</div>
            <div className="text-[11px] text-purple-300/80 mt-1 flex items-center gap-1">
              <span>{edgeDeployments.filter((d) => d.type === 'edge').length} Edge Subdomains</span>
              <span>•</span>
              <span>{servers.length} VPS Nodes</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-slate-900/60 border border-emerald-900/40">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2 font-medium">
              <span>Edge CDN Global Status</span>
              <Globe className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>100% Uptime</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Average edge latency: 18ms</div>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-900/60 border border-indigo-900/40">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2 font-medium">
              <span>Custom Domains & SSL</span>
              <ShieldCheck className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-black text-white">{customDomainsList.length} Active</div>
            <div className="text-[11px] text-indigo-300/80 mt-1">Managed Let's Encrypt / Cloudflare</div>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-950/40 to-slate-900/60 border border-cyan-900/40">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2 font-medium">
              <span>Docker & Coolify VPS</span>
              <Server className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-black text-white">{servers[0]?.cpu_usage || '24% CPU'}</div>
            <div className="text-[11px] text-cyan-300/80 mt-1">{servers[0]?.memory_usage || '4.2GB / 16GB RAM'}</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-6">
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => setActiveTab('apps')}
              className={`px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'apps'
                  ? 'bg-purple-950 text-purple-300 border border-purple-800/80 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="h-4 w-4" />
              <span>Applications ({edgeDeployments.length + coolifyApps.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('servers')}
              className={`px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'servers'
                  ? 'bg-purple-950 text-purple-300 border border-purple-800/80 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Server className="h-4 w-4" />
              <span>VPS Nodes ({servers.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('databases')}
              className={`px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'databases'
                  ? 'bg-purple-950 text-purple-300 border border-purple-800/80 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Database className="h-4 w-4" />
              <span>Databases ({databases.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('domains')}
              className={`px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'domains'
                  ? 'bg-purple-950 text-purple-300 border border-purple-800/80 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe className="h-4 w-4" />
              <span>Custom Domains ({customDomainsList.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('env')}
              className={`px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'env'
                  ? 'bg-purple-950 text-purple-300 border border-purple-800/80 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Key className="h-4 w-4" />
              <span>Secrets Vault</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'settings'
                  ? 'bg-purple-950 text-purple-300 border border-purple-800/80 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Settings2 className="h-4 w-4" />
              <span>Coolify API</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'databases' ? (
              <button
                onClick={() => setIsProvisionDbOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-cyan-600/25 transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Provision Database</span>
              </button>
            ) : (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-purple-600/25 transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>New Application</span>
              </button>
            )}
          </div>
        </div>

        {/* TAB 1: Applications */}
        {activeTab === 'apps' && (
          <div className="space-y-5">
            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filterType === 'all'
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All Applications
                </button>
                <button
                  onClick={() => setFilterType('edge')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    filterType === 'edge'
                      ? 'bg-purple-950/80 text-purple-300 border border-purple-800'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Globe className="h-3 w-3 text-purple-400" />
                  <span>Edge Subdomains</span>
                </button>
                <button
                  onClick={() => setFilterType('coolify')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    filterType === 'coolify'
                      ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-800'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Server className="h-3 w-3 text-indigo-400" />
                  <span>Coolify VPS</span>
                </button>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Filter by name or domain..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Applications Grid */}
            {filteredEdgeDeployments.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-400">
                <Cloud className="h-10 w-10 mx-auto text-slate-600 mb-3" />
                <p className="text-sm font-medium">No applications match your filter.</p>
                <p className="text-xs text-slate-500 mt-1">
                  Create a new application or deploy directly from the Studio.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredEdgeDeployments.map((app) => (
                  <div
                    key={app.id}
                    className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-purple-800/50 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-white text-base leading-tight">
                              {app.name}
                            </h3>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                              v{app.version}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-slate-500">
                            ID: {app.id}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                              app.type === 'edge'
                                ? 'bg-purple-950/80 text-purple-300 border border-purple-800/60'
                                : 'bg-indigo-950/80 text-indigo-300 border border-indigo-800/60'
                            }`}
                          >
                            {app.type === 'edge' ? 'Edge CDN' : 'Coolify VPS'}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                            {app.status}
                          </span>
                        </div>
                      </div>

                      {/* Subdomain Pill */}
                      <div className="mb-2 p-2 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs font-mono">
                        <div className="flex items-center gap-1.5 truncate text-purple-300">
                          <Globe className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                          <span className="truncate">{app.subdomain}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          <button
                            onClick={() => setActiveClaimDeployment(app)}
                            className="p-1 rounded-md text-slate-400 hover:text-purple-300 hover:bg-slate-900 transition-colors"
                            title="Claim & Customize Subdomain"
                          >
                            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                          </button>
                          <button
                            onClick={() => handleCopy(`https://${app.subdomain}`)}
                            className="text-slate-400 hover:text-white p-1 rounded transition-colors"
                            title="Copy subdomain URL"
                          >
                            {copiedLink === `https://${app.subdomain}` ? (
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Mini Telemetry Bar */}
                      <button
                        onClick={() => setActiveAnalyticsDeployment(app)}
                        className="w-full mb-3 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-purple-800/60 transition-all text-left flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-3.5 w-3.5 text-purple-400" />
                          <div className="text-[11px] font-mono">
                            <span className="text-white font-bold">{app.telemetry?.requests24h?.toLocaleString() || '1,240'}</span>
                            <span className="text-slate-500 ml-1">reqs/24h</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-mono">
                            LCP {app.telemetry?.lcp || '0.4s'}
                          </span>
                          <span className="text-[10px] text-purple-400 group-hover:translate-x-0.5 transition-transform font-medium">
                            Analytics →
                          </span>
                        </div>
                      </button>

                      {/* Custom Domain if attached */}
                      {app.customDomain && (
                        <div className="mb-3 p-2 rounded-xl bg-indigo-950/40 border border-indigo-900/50 flex items-center justify-between text-xs font-mono">
                          <div className="flex items-center gap-1.5 truncate text-indigo-300">
                            <ShieldCheck className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                            <span className="truncate">{app.customDomain}</span>
                          </div>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-900/60 text-indigo-200 font-sans">
                            SSL Active
                          </span>
                        </div>
                      )}

                      {/* Framework & Metadata */}
                      <div className="space-y-1.5 text-xs text-slate-400 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">Framework:</span>
                          <span className="text-slate-300 font-semibold">{app.framework}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">Bundle Size:</span>
                          <span className="text-slate-300 font-mono">{app.bundleSize}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">History:</span>
                          <span className="text-purple-300 font-medium">
                            {app.history.length + 1} release snapshots
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col gap-2.5">
                      <div className="flex items-center gap-2">
                        {/* Visit Live Application */}
                        <Link
                          href={`/preview/${app.slug}`}
                          target="_blank"
                          className="flex-1 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/20 transition-all"
                        >
                          <Play className="h-3.5 w-3.5 fill-current" />
                          <span>Visit Live App</span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>

                        {/* Mobile QR Code */}
                        <button
                          onClick={() => setActiveQrDeployment(app)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 transition-colors"
                          title="Mobile QR Code & Share"
                        >
                          <Smartphone className="h-4 w-4" />
                        </button>

                        {/* Logs */}
                        <button
                          onClick={() => setActiveLogsDeployment(app)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                          title="View Live Execution Logs"
                        >
                          <Terminal className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setActiveEnvDeployment(app)}
                            className="hover:text-purple-300 transition-colors flex items-center gap-1 text-[11px]"
                            title="Manage Environment Variables"
                          >
                            <Key className="h-3 w-3" />
                            <span>.env</span>
                          </button>
                          <span>•</span>
                          <button
                            onClick={() => setActiveDomainDeployment(app)}
                            className="hover:text-purple-300 transition-colors flex items-center gap-1 text-[11px]"
                            title="Configure Custom Domain"
                          >
                            <Globe className="h-3 w-3" />
                            <span>Domain</span>
                          </button>
                          <span>•</span>
                          <button
                            onClick={() => setActiveRollbackDeployment(app)}
                            className="hover:text-purple-300 transition-colors flex items-center gap-1 text-[11px]"
                            title="Rollback Release"
                          >
                            <RotateCcw className="h-3 w-3" />
                            <span>Rollback</span>
                          </button>
                          <span>•</span>
                          <button
                            onClick={() => setActiveBranchDeployment(app)}
                            className="hover:text-cyan-300 transition-colors flex items-center gap-1 text-[11px]"
                            title="GitHub Branch CI/CD & Previews"
                          >
                            <GitBranch className="h-3 w-3 text-cyan-400" />
                            <span>Git</span>
                          </button>
                        </div>

                        <button
                          onClick={() => handleDeleteEdgeDeployment(app.id, app.name)}
                          className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                          title="Delete Application"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Servers / VPS Nodes */}
        {activeTab === 'servers' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-200">Connected VPS / Nodes</h2>
                <span className="text-xs text-slate-500">
                  Docker Daemon health, container isolation & hardware metrics
                </span>
              </div>
              <button
                onClick={() => fetchAllData(coolifyUrl, token)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Probe Nodes</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {servers.map((server) => (
                <div
                  key={server.uuid}
                  className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-indigo-950 border border-indigo-800/60 flex items-center justify-center text-indigo-400">
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
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/60">
                      <Cpu className="h-4 w-4 mx-auto text-cyan-400 mb-1" />
                      <div className="text-xs text-slate-400">CPU Usage</div>
                      <div className="text-sm font-semibold text-white">{server.cpu_usage || '18%'}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/60">
                      <HardDrive className="h-4 w-4 mx-auto text-purple-400 mb-1" />
                      <div className="text-xs text-slate-400">Memory</div>
                      <div className="text-sm font-semibold text-white">{server.memory_usage || '3.4GB / 8GB'}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/60">
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

        {/* TAB: Managed Databases */}
        {activeTab === 'databases' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-200">Managed PostgreSQL & Redis Add-ons</h2>
                <span className="text-xs text-slate-500">
                  High-performance isolated databases with automated connection strings and zero server config
                </span>
              </div>
              <button
                onClick={() => setIsProvisionDbOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-cyan-600/25 transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Provision Instance</span>
              </button>
            </div>

            {databases.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-400">
                <Database className="h-10 w-10 mx-auto text-slate-600 mb-3" />
                <p className="text-sm font-medium">No database instances found.</p>
                <p className="text-xs text-slate-500 mt-1">
                  Provision your first PostgreSQL or Redis instance in 1 click.
                </p>
                <button
                  onClick={() => setIsProvisionDbOpen(true)}
                  className="mt-4 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  <span>Provision Database</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {databases.map((db) => (
                  <div
                    key={db.id}
                    className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-800/50 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <h3 className="font-bold text-white text-base leading-tight">
                            {db.name}
                          </h3>
                          <span className="text-[11px] font-mono text-slate-500">
                            {db.version}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                              db.type === 'postgresql'
                                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/60'
                                : 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                            }`}
                          >
                            {db.type === 'postgresql' ? 'SQL' : 'Cache'}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                            {db.status}
                          </span>
                        </div>
                      </div>

                      {/* Connection String Pill */}
                      <div className="mb-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs font-mono">
                        <div className="flex items-center gap-1.5 truncate text-slate-300">
                          <Key className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                          <span className="truncate">
                            {db.type === 'postgresql'
                              ? `postgresql://${db.username}:••••••••@${db.host}:${db.port}/${db.databaseName}`
                              : `redis://default:••••••••@${db.host}:${db.port}`}
                          </span>
                        </div>
                        <button
                          onClick={() => handleCopy(db.connectionUri)}
                          className="text-slate-400 hover:text-white p-1 rounded transition-colors shrink-0 ml-2"
                          title="Copy Full Connection URI"
                        >
                          {copiedLink === db.connectionUri ? (
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>

                      {/* Attached App */}
                      {db.attachedAppName && (
                        <div className="mb-3 p-2 rounded-xl bg-purple-950/30 border border-purple-900/40 flex items-center justify-between text-xs">
                          <span className="text-[11px] text-purple-300 flex items-center gap-1.5">
                            <Layers className="h-3.5 w-3.5 text-purple-400" />
                            <span>Linked to: <strong>{db.attachedAppName}</strong></span>
                          </span>
                          <span className="text-[10px] font-mono text-purple-400 bg-purple-900/50 px-1.5 py-0.2 rounded">
                            {db.type === 'postgresql' ? 'DATABASE_URL' : 'REDIS_URL'}
                          </span>
                        </div>
                      )}

                      {/* Stats */}
                      <div className="space-y-1.5 text-xs text-slate-400 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">Storage Used:</span>
                          <span className="text-cyan-300 font-mono font-medium">{db.storageUsed}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">Endpoint:</span>
                          <span className="text-slate-300 font-mono">{db.host}:{db.port}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">Active Tables / Keys:</span>
                          <span className="text-white font-medium">{db.tables?.length || 0} entities</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                      <button
                        onClick={() => setActiveQueryDb(db)}
                        className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
                      >
                        <Terminal className="h-3.5 w-3.5" />
                        <span>Query Console</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleCopy(db.connectionUri)}
                          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          title="Copy Connection String"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteDatabase(db.id, db.name)}
                          className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                          title="Terminate Instance"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Custom Domains & SSL */}
        {activeTab === 'domains' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-200">Custom Domains & Edge Certificates</h2>
                <span className="text-xs text-slate-500">
                  Manage domains pointing to your edge deployments with automatic wildcard SSL
                </span>
              </div>
            </div>

            {/* Domains Table */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                      <th className="pb-3">Custom Domain</th>
                      <th className="pb-3">Mapped Application</th>
                      <th className="pb-3">Target CNAME</th>
                      <th className="pb-3">SSL Status</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {customDomainsList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500 font-sans italic">
                          No custom domains connected yet. Click "Domain" on any application card to connect one.
                        </td>
                      </tr>
                    ) : (
                      customDomainsList.map((app) => (
                        <tr key={app.id} className="hover:bg-slate-950/40">
                          <td className="py-3 text-white font-semibold flex items-center gap-2">
                            <Globe className="h-3.5 w-3.5 text-purple-400" />
                            <span>{app.customDomain}</span>
                          </td>
                          <td className="py-3 text-slate-300 font-sans">{app.name}</td>
                          <td className="py-3 text-purple-300">edge.ultrapie.com</td>
                          <td className="py-3">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-sans">
                              <ShieldCheck className="h-3 w-3" />
                              Active (TLS 1.3)
                            </span>
                          </td>
                          <td className="py-3 text-right font-sans">
                            <button
                              onClick={() => setActiveDomainDeployment(app)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
                            >
                              Configure
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* DNS Instructions Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-950/30 to-slate-900 border border-purple-900/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">How to route your custom domain</h3>
                <p className="text-xs text-slate-300 max-w-xl">
                  In your DNS provider (Cloudflare, GoDaddy, Namecheap), add a <strong>CNAME</strong> record pointing your desired domain or subdomain to <code className="text-purple-300 font-mono bg-purple-950/60 px-1.5 py-0.5 rounded">edge.ultrapie.com</code>.
                </p>
              </div>
              <button
                onClick={() => handleCopy('edge.ultrapie.com')}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-purple-600/30 transition-all shrink-0"
              >
                {copiedLink === 'edge.ultrapie.com' ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>Copy CNAME Target</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: Secrets Vault (.env) */}
        {activeTab === 'env' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-slate-200">Environment Variables & Secrets Vault</h2>
              <span className="text-xs text-slate-500">
                Encrypted configuration parameters injected into application builds and runtime environments
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {edgeDeployments.map((app) => (
                <div
                  key={app.id}
                  className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-white text-sm">{app.name}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                        {Object.keys(app.envVars || {}).length} variables
                      </span>
                    </div>

                    <div className="space-y-1.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 font-mono text-[11px]">
                      {Object.keys(app.envVars || {}).length === 0 ? (
                        <span className="text-slate-600 italic">No variables set</span>
                      ) : (
                        Object.entries(app.envVars).slice(0, 3).map(([k, v]) => (
                          <div key={k} className="flex items-center justify-between truncate">
                            <span className="text-purple-300 truncate">{k}</span>
                            <span className="text-slate-600">••••••••</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveEnvDeployment(app)}
                    className="mt-4 w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-700/60"
                  >
                    <Key className="h-3.5 w-3.5 text-purple-400" />
                    <span>Manage Variables</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: Coolify API Credentials */}
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-purple-500 font-mono"
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>
            </div>

            {statusMessage && (
              <div
                className={`p-3.5 rounded-xl text-xs flex items-start gap-2 ${
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
                  fetchAllData('', '');
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                Reset to Demo
              </button>
              <button
                onClick={handleSaveAndConnect}
                disabled={isLoading}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
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

      {/* Modals */}
      <CreateCoolifyAppModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        servers={servers.map((s) => ({ uuid: s.uuid, name: s.name, ip: s.ip }))}
        onAppCreated={(newApp) => {
          setCoolifyApps((prev) => [newApp, ...prev]);
        }}
      />

      <DeploymentLogsModal
        isOpen={!!activeLogsDeployment}
        onClose={() => setActiveLogsDeployment(null)}
        deployment={activeLogsDeployment}
      />

      <EnvVarsModal
        isOpen={!!activeEnvDeployment}
        onClose={() => setActiveEnvDeployment(null)}
        deployment={activeEnvDeployment}
        onUpdated={handleUpdateDeploymentInState}
      />

      <CustomDomainModal
        isOpen={!!activeDomainDeployment}
        onClose={() => setActiveDomainDeployment(null)}
        deployment={activeDomainDeployment}
        onUpdated={handleUpdateDeploymentInState}
      />

      <RollbackModal
        isOpen={!!activeRollbackDeployment}
        onClose={() => setActiveRollbackDeployment(null)}
        deployment={activeRollbackDeployment}
        onUpdated={handleUpdateDeploymentInState}
      />

      <ProvisionDatabaseModal
        isOpen={isProvisionDbOpen}
        onClose={() => setIsProvisionDbOpen(false)}
        deployments={edgeDeployments}
        onProvisioned={(newDb) => {
          setDatabases((prev) => [newDb, ...prev]);
        }}
      />

      <DatabaseQueryModal
        isOpen={!!activeQueryDb}
        onClose={() => setActiveQueryDb(null)}
        database={activeQueryDb}
      />

      <QRCodeShareModal
        isOpen={!!activeQrDeployment}
        onClose={() => setActiveQrDeployment(null)}
        deployment={activeQrDeployment}
      />

      <DeploymentAnalyticsModal
        isOpen={!!activeAnalyticsDeployment}
        onClose={() => setActiveAnalyticsDeployment(null)}
        deployment={activeAnalyticsDeployment}
      />

      <ClaimSubdomainModal
        isOpen={!!activeClaimDeployment}
        onClose={() => setActiveClaimDeployment(null)}
        deployment={activeClaimDeployment}
        onUpdated={handleUpdateDeploymentInState}
      />

      <BranchDeployModal
        isOpen={!!activeBranchDeployment}
        onClose={() => setActiveBranchDeployment(null)}
        deployment={activeBranchDeployment}
        onBranchCreated={(newBranchDep) => {
          setEdgeDeployments((prev) => [newBranchDep, ...prev]);
        }}
        onRebuilt={handleUpdateDeploymentInState}
      />

      <DisasterRecoveryModal
        isOpen={isDisasterRecoveryOpen}
        onClose={() => setIsDisasterRecoveryOpen(false)}
      />
    </div>
  );
}
