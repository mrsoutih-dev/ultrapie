'use client';

import React, { useState } from 'react';
import {
  Database,
  X,
  Play,
  Terminal,
  Loader2,
  Clock,
  Sparkles,
  Table,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { ManagedDatabase } from '@/lib/hosting/managed-databases';

interface DatabaseQueryModalProps {
  isOpen: boolean;
  onClose: () => void;
  database: ManagedDatabase | null;
}

export function DatabaseQueryModal({
  isOpen,
  onClose,
  database,
}: DatabaseQueryModalProps) {
  const [query, setQuery] = useState(
    database?.type === 'redis' ? 'KEYS *' : 'SELECT * FROM users;'
  );
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [durationMs, setDurationMs] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [allowDestructive, setAllowDestructive] = useState(false);

  if (!isOpen || !database) return null;

  const quickQueries =
    database.type === 'redis'
      ? ['KEYS *', 'SCAN 0', 'INFO', 'GET cache:user:1']
      : [
          'SELECT * FROM users;',
          'SELECT * FROM app_sessions LIMIT 5;',
          'SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 5;',
          'SELECT * FROM information_schema.tables;',
        ];

  const handleRunQuery = async () => {
    if (!query.trim()) return;
    setIsRunning(true);
    setError(null);

    try {
      const res = await fetch('/api/databases', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: database.id,
          action: 'query',
          query: query.trim(),
          allowDestructive,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setResult(data.result);
        setDurationMs(data.durationMs || 10);
      } else {
        setError(data.result || data.error || 'Query failed');
        setResult(null);
      }
    } catch (e: any) {
      setError(e.message || 'Execution error');
      setResult(null);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div
              className={`h-9 w-9 rounded-xl flex items-center justify-center ${
                database.type === 'redis'
                  ? 'bg-rose-950 border border-rose-800/60 text-rose-400'
                  : 'bg-cyan-950 border border-cyan-800/60 text-cyan-400'
              }`}
            >
              <Database className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">{database.name}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {database.version}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">{database.host}:{database.port}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setAllowDestructive(!allowDestructive)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border transition-all ${
                allowDestructive
                  ? 'bg-rose-950/80 border-rose-700 text-rose-300'
                  : 'bg-emerald-950/80 border-emerald-800 text-emerald-400'
              }`}
              title={
                allowDestructive
                  ? 'Click to restore Read-Only Safety Guard'
                  : 'Click to enable Destructive Operations (DROP, DELETE, TRUNCATE)'
              }
            >
              <span>{allowDestructive ? '⚠️ Destructive Mode' : '🛡️ Safe Guard Active'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 flex-1 overflow-y-auto">
          {/* Quick Query Pills */}
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Preset Queries:
            </span>
            <div className="flex flex-wrap gap-2">
              {quickQueries.map((q) => (
                <button
                  key={q}
                  onClick={() => setQuery(q)}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] font-mono transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Query Editor */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                {database.type === 'redis' ? 'Redis CLI Command' : 'SQL Query'}
              </label>
              <button
                onClick={handleRunQuery}
                disabled={isRunning}
                className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-cyan-600/25 transition-all disabled:opacity-50"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Executing...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 fill-current" />
                    <span>Execute</span>
                  </>
                )}
              </button>
            </div>

            <textarea
              rows={3}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter your command here..."
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Results Viewer */}
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Table className="h-3.5 w-3.5 text-cyan-400" />
                <span>Execution Output</span>
              </span>
              {durationMs !== null && (
                <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{durationMs}ms</span>
                </span>
              )}
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-900/60 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                <span className="font-mono">{error}</span>
              </div>
            )}

            {result === null && !error && (
              <div className="py-8 text-center text-slate-600 font-mono text-xs border border-dashed border-slate-800 rounded-xl">
                Click "Execute" or select a preset query to run.
              </div>
            )}

            {result !== null && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs overflow-x-auto max-h-56">
                {Array.isArray(result) && result.length > 0 && typeof result[0] === 'object' ? (
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                        {Object.keys(result[0]).map((col) => (
                          <th key={col} className="pb-2 pr-4">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900">
                      {result.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/40">
                          {Object.values(row).map((val: any, vIdx) => (
                            <td key={vIdx} className="py-2 pr-4 text-slate-200 whitespace-nowrap">
                              {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <pre className="text-slate-300 text-xs">{JSON.stringify(result, null, 2)}</pre>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono text-[11px] text-slate-500">
            Database: {database.databaseName}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
