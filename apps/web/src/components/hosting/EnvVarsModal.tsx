'use client';

import React, { useState, useEffect } from 'react';
import {
  Key,
  X,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Shield,
} from 'lucide-react';
import { EdgeDeployment } from '@/lib/hosting/edge-deployments';

interface EnvVarsModalProps {
  isOpen: boolean;
  onClose: () => void;
  deployment: EdgeDeployment | null;
  onUpdated: (updated: EdgeDeployment) => void;
}

export function EnvVarsModal({
  isOpen,
  onClose,
  deployment,
  onUpdated,
}: EnvVarsModalProps) {
  const [vars, setVars] = useState<Array<{ key: string; value: string; id: string }>>([]);
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (deployment) {
      const initial = Object.entries(deployment.envVars || {}).map(([key, value], idx) => ({
        id: `${key}-${idx}`,
        key,
        value,
      }));
      setVars(initial);
      setFeedback(null);
    }
  }, [deployment]);

  if (!isOpen || !deployment) return null;

  const handleAddVar = () => {
    setVars((prev) => [...prev, { id: `var-${Date.now()}`, key: '', value: '' }]);
  };

  const handleRemoveVar = (id: string) => {
    setVars((prev) => prev.filter((v) => v.id !== id));
  };

  const handleUpdateKey = (id: string, newKey: string) => {
    setVars((prev) =>
      prev.map((v) => (v.id === id ? { ...v, key: newKey.toUpperCase().replace(/[^A-Z0-9_]/g, '') } : v))
    );
  };

  const handleUpdateVal = (id: string, newVal: string) => {
    setVars((prev) => prev.map((v) => (v.id === id ? { ...v, value: newVal } : v)));
  };

  const toggleShowValue = (id: string) => {
    setShowValues((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setFeedback(null);

    const envMap: Record<string, string> = {};
    for (const item of vars) {
      const k = item.key.trim();
      if (k) {
        envMap[k] = item.value;
      }
    }

    try {
      const res = await fetch('/api/deployments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: deployment.id,
          updates: {
            envVars: envMap,
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.deployment) {
        setFeedback('Environment variables saved & deployment redeployed!');
        onUpdated(data.deployment);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setFeedback(data.error || 'Failed to save environment variables');
      }
    } catch (e: any) {
      setFeedback(e.message || 'Error saving environment variables');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-purple-950 border border-purple-800/60 flex items-center justify-center text-purple-400">
              <Key className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Environment Variables (.env)</h3>
              <p className="text-xs text-slate-400 font-mono">{deployment.subdomain}</p>
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
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Encrypted variables injected into runtime and client bundles.
            </span>
            <button
              onClick={handleAddVar}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Variable</span>
            </button>
          </div>

          {vars.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
              No custom environment variables defined yet.
            </div>
          ) : (
            <div className="space-y-2.5">
              {vars.map((item) => (
                <div key={item.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="KEY (e.g. VITE_API_URL)"
                    value={item.key}
                    onChange={(e) => handleUpdateKey(item.id, e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-600 font-mono focus:outline-none focus:border-purple-500"
                  />
                  <div className="relative flex-[1.5]">
                    <input
                      type={showValues[item.id] ? 'text' : 'password'}
                      placeholder="VALUE"
                      value={item.value}
                      onChange={(e) => handleUpdateVal(item.id, e.target.value)}
                      className="w-full pl-3 pr-8 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-600 font-mono focus:outline-none focus:border-purple-500"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowValue(item.id)}
                      className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300"
                    >
                      {showValues[item.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  <button
                    onClick={() => handleRemoveVar(item.id)}
                    className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                    title="Delete variable"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {feedback && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                feedback.includes('saved')
                  ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/60'
                  : 'bg-rose-950/40 text-rose-300 border border-rose-800/60'
              }`}
            >
              {feedback.includes('saved') ? (
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
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <Shield className="h-3.5 w-3.5 text-purple-400" />
            <span>Encrypted at rest with salt-hashed PBKDF2</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-purple-600/30 transition-all disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  <span>Save & Apply</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
