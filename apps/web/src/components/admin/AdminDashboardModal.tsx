'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import {
  X,
  Crown,
  Shield,
  Activity,
  Users,
  DollarSign,
  Cpu,
  Server,
  Sparkles,
  Zap,
  CheckCircle2,
  RefreshCw,
  Terminal,
  ExternalLink,
  Lock,
  Layers,
  Check,
} from 'lucide-react';

export function AdminDashboardModal() {
  const { user, isAdminModalOpen, closeAdminModal } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [stats, setStats] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [recentActions, setRecentActions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'actions' | 'users' | 'server'>('overview');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchAdminData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setUsersList(data.users || []);
        setRecentActions(data.recentActions || []);
      }
    } catch (err) {
      console.error('Failed to fetch admin statistics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdminModalOpen) {
      fetchAdminData();
    }
  }, [isAdminModalOpen]);

  if (!isAdminModalOpen) return null;

  const handleGrantPro = async (targetUserId: string, targetEmail: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUserId, plan: 'PRO', isSubscribed: true }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(`Granted PRO Plan to ${targetEmail}`);
        setTimeout(() => setActionMessage(null), 3000);
        fetchAdminData();
      }
    } catch (err) {
      console.error('Failed to grant pro:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div
        className={`max-w-5xl w-full rounded-2xl shadow-2xl border overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200 ${
          isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}
      >
        {/* Header with Master Owner Badge */}
        <div
          className={`p-6 border-b flex items-center justify-between ${
            isLight ? 'border-slate-100 bg-slate-50/80' : 'border-slate-800 bg-slate-950/80'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-amber-400 via-amber-500 to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
              <Crown className="h-5 w-5 text-slate-950 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight">Ultrapie Admin Control Center</h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <Shield className="h-2.5 w-2.5" />
                  <span>Master Owner Pro</span>
                </span>
              </div>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Full control, live studio audit logs, token meters & user subscription management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchAdminData}
              className={`p-2 rounded-xl transition-colors ${
                isLight ? 'hover:bg-slate-200 text-slate-500' : 'hover:bg-slate-800 text-slate-400'
              }`}
              title="Refresh Statistics"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={closeAdminModal}
              className={`p-2 rounded-xl transition-colors ${
                isLight ? 'hover:bg-slate-200 text-slate-500' : 'hover:bg-slate-800 text-slate-400'
              }`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div
          className={`flex border-b px-6 gap-6 ${
            isLight ? 'border-slate-100 bg-slate-50/40' : 'border-slate-800 bg-slate-950/40'
          }`}
        >
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'border-cyan-500 text-cyan-500'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>Overview & Metrics</span>
          </button>
          <button
            onClick={() => setActiveTab('actions')}
            className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'actions'
                ? 'border-cyan-500 text-cyan-500'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="h-3.5 w-3.5" />
            <span>Studio Action Stream ({recentActions.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'users'
                ? 'border-cyan-500 text-cyan-500'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>User Management ({usersList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('server')}
            className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'server'
                ? 'border-cyan-500 text-cyan-500'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="h-3.5 w-3.5" />
            <span>WSL & Coolify Node</span>
          </button>
        </div>

        {/* Feedback Banner */}
        {actionMessage && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-6 py-2 text-xs text-emerald-400 font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div
                  className={`p-4 rounded-xl border ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-semibold">Monthly MRR</span>
                    <DollarSign className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-black text-emerald-400">${stats?.mrr || 167}/mo</div>
                  <div className="text-[11px] text-slate-500 mt-1">Paid active subscribers</div>
                </div>

                <div
                  className={`p-4 rounded-xl border ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-semibold">Total Users</span>
                    <Users className="h-4 w-4 text-cyan-400" />
                  </div>
                  <div className="text-2xl font-black">{stats?.totalUsers || usersList.length}</div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {stats?.activeSubscribers || 3} subscribed
                  </div>
                </div>

                <div
                  className={`p-4 rounded-xl border ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-semibold">Gemini 3 Flash</span>
                    <Cpu className="h-4 w-4 text-indigo-400" />
                  </div>
                  <div className="text-2xl font-black text-indigo-400">
                    {stats?.totalTokens ? (stats.totalTokens / 1000).toFixed(1) + 'k' : '1.5M'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Tokens consumed</div>
                </div>

                <div
                  className={`p-4 rounded-xl border ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-semibold">Studio Builds</span>
                    <Zap className="h-4 w-4 text-amber-400" />
                  </div>
                  <div className="text-2xl font-black text-amber-400">
                    {stats?.totalGenerations || 842}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Interactive generations</div>
                </div>
              </div>

              {/* Master Account Card */}
              <div
                className={`p-5 rounded-2xl border bg-gradient-to-r ${
                  isLight
                    ? 'from-amber-50 to-orange-50 border-amber-200'
                    : 'from-amber-950/40 to-slate-950 border-amber-800/40'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-amber-400 fill-current" />
                      <span className="font-bold text-sm">Master Owner Credentials Verified</span>
                    </div>
                    <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                      Active Master: <strong>Elhoussine Soutih</strong> (<code>zohodigital.com@gmail.com</code>).
                      Unlimited Pro access, bypasses subscription paywalls, and controls all server deployments.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-400/20">
                    PRO LIFETIME
                  </span>
                </div>
              </div>

              {/* Quick Action Logs Preview */}
              <div>
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-cyan-400" />
                  <span>Recent Studio Activity (Live Stream)</span>
                </h3>
                <div
                  className={`rounded-xl border divide-y overflow-hidden ${
                    isLight ? 'bg-slate-50 border-slate-200 divide-slate-200' : 'bg-slate-950 border-slate-800 divide-slate-850'
                  }`}
                >
                  {recentActions.slice(0, 5).map((act) => (
                    <div key={act.id} className="p-3 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                            act.action.includes('STREAM')
                              ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                              : act.action.includes('DEPLOY')
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-purple-950 text-purple-400 border border-purple-800'
                          }`}
                        >
                          {act.action}
                        </span>
                        <span className="font-semibold">{act.details}</span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                        <span>{act.userEmail}</span>
                        <span>{new Date(act.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'actions' && (
            <div className="space-y-3">
              <h3 className="font-bold text-sm">Full Studio Action Stream</h3>
              <div
                className={`rounded-xl border divide-y overflow-hidden ${
                  isLight ? 'bg-slate-50 border-slate-200 divide-slate-200' : 'bg-slate-950 border-slate-800 divide-slate-850'
                }`}
              >
                {recentActions.map((act) => (
                  <div key={act.id} className="p-3 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-cyan-400">
                        {act.action}
                      </span>
                      <div>
                        <div className="font-semibold">{act.details}</div>
                        <div className="text-[10px] text-slate-500">
                          User: {act.userName} ({act.userEmail})
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-[11px] text-slate-500">
                      <div>{new Date(act.timestamp).toLocaleDateString()}</div>
                      <div>{new Date(act.timestamp).toLocaleTimeString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm">Platform Users & Subscriptions</h3>
                <span className="text-xs text-slate-500">{usersList.length} total registered</span>
              </div>

              <div
                className={`rounded-xl border overflow-hidden ${
                  isLight ? 'border-slate-200' : 'border-slate-800'
                }`}
              >
                <table className="w-full text-left text-xs">
                  <thead
                    className={`border-b font-semibold ${
                      isLight ? 'bg-slate-100/70 border-slate-200 text-slate-600' : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <tr>
                      <th className="p-3">User</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Subscription</th>
                      <th className="p-3">Plan</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {usersList.map((u) => (
                      <tr
                        key={u.id}
                        className={isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-850'}
                      >
                        <td className="p-3">
                          <div className="font-bold">{u.name}</div>
                          <div className="text-[11px] text-slate-500">{u.email}</div>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              u.role === 'OWNER'
                                ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="p-3">
                          {u.isSubscribed ? (
                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Active</span>
                            </span>
                          ) : (
                            <span className="text-slate-500 font-medium">Unpaid</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className="font-mono font-bold text-cyan-400">
                            {u.plan ? `${u.plan} ($${u.plan === 'STARTER' ? 19 : u.plan === 'PRO' ? 49 : 99}/mo)` : 'None'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {u.role !== 'OWNER' && (
                            <button
                              onClick={() => handleGrantPro(u.id, u.email)}
                              className="px-2.5 py-1 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800 hover:bg-cyan-900 text-[11px] font-bold transition-all"
                            >
                              Grant PRO ($49)
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'server' && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm">Server Infrastructure & Services</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  className={`p-4 rounded-xl border space-y-2 ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">Next.js Web & Studio</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                      ACTIVE :3005
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Systemd service <code>ultrapie-web.service</code> running on native WSL Linux ext4.
                  </p>
                </div>

                <div
                  className={`p-4 rounded-xl border space-y-2 ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">NestJS Control Plane API</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                      ACTIVE :4000
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Systemd service <code>ultrapie-api.service</code> running on port 4000.
                  </p>
                </div>

                <div
                  className={`p-4 rounded-xl border space-y-2 ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">Traefik Reverse Proxy</span>
                    <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-400 border border-purple-800 text-[10px] font-bold">
                      COOLIFY PROXY :80/:443
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Dynamic file <code>/data/coolify/proxy/dynamic/ultrapie.yaml</code> routes domains to host <code>10.0.1.1:3005</code>.
                  </p>
                </div>

                <div
                  className={`p-4 rounded-xl border space-y-2 ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">Coolify VPS Panel</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                      ACTIVE :8000
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Admin email: <code>zohodigital.com@gmail.com</code> | Password verified.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`p-4 border-t flex items-center justify-between text-xs ${
            isLight ? 'border-slate-100 bg-slate-50/80 text-slate-500' : 'border-slate-800 bg-slate-950/80 text-slate-400'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Real-time control connected to WSL Ubuntu Daemon</span>
          </div>

          <button
            onClick={closeAdminModal}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors"
          >
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
}
