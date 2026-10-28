'use client';

import React, { useState } from 'react';
import {
  Database,
  X,
  Plus,
  Server,
  Zap,
  CheckCircle2,
  AlertCircle,
  Loader2,
  HardDrive,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import { ManagedDatabase } from '@/lib/hosting/managed-databases';
import { EdgeDeployment } from '@/lib/hosting/edge-deployments';

interface ProvisionDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  deployments: EdgeDeployment[];
  onProvisioned: (newDb: ManagedDatabase) => void;
}

export function ProvisionDatabaseModal({
  isOpen,
  onClose,
  deployments,
  onProvisioned,
}: ProvisionDatabaseModalProps) {
  const [dbType, setDbType] = useState<'postgresql' | 'redis'>('postgresql');
  const [name, setName] = useState('');
  const [selectedAppId, setSelectedAppId] = useState('');
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleProvision = async () => {
    const cleanName = name.trim() || `${dbType === 'postgresql' ? 'PostgreSQL' : 'Redis'} Database`;
    setIsProvisioning(true);
    setFeedback(null);

    // Simulate provisioning sequence
    await new Promise((r) => setTimeout(r, 600));

    try {
      const res = await fetch('/api/databases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          type: dbType,
          attachedAppId: selectedAppId || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.database) {
        setFeedback(`${data.database.version} provisioned successfully!`);
        onProvisioned(data.database);
        setTimeout(() => {
          onClose();
          setName('');
          setSelectedAppId('');
        }, 1200);
      } else {
        setFeedback(data.error || 'Failed to provision database');
      }
    } catch (e: any) {
      setFeedback(e.message || 'Error creating database instance');
    } finally {
      setIsProvisioning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-cyan-950 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
              <Database className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">1-Click Database Provisioning</h3>
              <p className="text-xs text-slate-400">Isolated database instance with automatic connection string</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Engine Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Select Database Engine
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDbType('postgresql')}
                className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  dbType === 'postgresql'
                    ? 'bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-500/10'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white">PostgreSQL 16.3</span>
                  <Database className="h-4 w-4 text-cyan-400" />
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Relational SQL, JSONB, full-text search, with automatic <code className="text-cyan-300">DATABASE_URL</code>.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setDbType('redis')}
                className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  dbType === 'redis'
                    ? 'bg-rose-950/40 border-rose-500 shadow-md shadow-rose-500/10'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white">Redis 7.2 Cache</span>
                  <Zap className="h-4 w-4 text-rose-400" />
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  In-memory key-value store for session auth, rates, and fast caching (<code className="text-rose-300">REDIS_URL</code>).
                </p>
              </button>
            </div>
          </div>

          {/* Database Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Instance Name
            </label>
            <input
              type="text"
              placeholder={dbType === 'postgresql' ? 'e.g. Production PostgreSQL' : 'e.g. Session Cache'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Attach to Application */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Attach to Application (Optional)
            </label>
            <select
              value={selectedAppId}
              onChange={(e) => setSelectedAppId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="">Do not attach (standalone instance)</option>
              {deployments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.subdomain})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              Selecting an app will automatically inject the connection string into its <code className="text-purple-300">.env</code>.
            </p>
          </div>

          {feedback && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                feedback.includes('successfully')
                  ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/60'
                  : 'bg-rose-950/40 text-rose-300 border border-rose-800/60'
              }`}
            >
              {feedback.includes('successfully') ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
              )}
              <span>{feedback}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
            <span>Encrypted credentials & automatic TLS</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              onClick={handleProvision}
              disabled={isProvisioning}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-cyan-600/30 transition-all disabled:opacity-50"
            >
              {isProvisioning ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Provisioning Engine...</span>
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  <span>1-Click Provision</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
