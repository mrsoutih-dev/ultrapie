'use client';

import React, { useState, useEffect } from 'react';
import {
  Database,
  X,
  Play,
  Terminal,
  Loader2,
  Clock,
  Sparkles,
  Table as TableIcon,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Search,
  Code2,
  Layers,
  ArrowRight,
  Server,
  ShieldCheck,
} from 'lucide-react';

interface StudioDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendPrompt?: (prompt: string) => void;
}

export function StudioDatabaseModal({
  isOpen,
  onClose,
  onSendPrompt,
}: StudioDatabaseModalProps) {
  const [activeTab, setActiveTab] = useState<'tables' | 'query' | 'schema' | 'ai'>('tables');
  const [tablesList, setTablesList] = useState<string[]>([
    'users',
    'organizations',
    'projects',
    'deployments',
    'domains',
    'memberships',
    'audit_logs',
    'ai_sessions',
    'ai_usage',
  ]);
  const [selectedTable, setSelectedTable] = useState<string>('users');
  const [tableData, setTableData] = useState<any[]>([]);
  const [isLoadingTable, setIsLoadingTable] = useState(false);
  const [tableSearch, setTableSearch] = useState('');

  // SQL Runner state
  const [query, setQuery] = useState('SELECT tablename FROM pg_tables WHERE schemaname = \'public\';');
  const [isRunning, setIsRunning] = useState(false);
  const [queryResult, setQueryResult] = useState<any>(null);
  const [durationMs, setDurationMs] = useState<number | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Fetch live tables on open
  useEffect(() => {
    if (isOpen) {
      loadLiveTables();
    }
  }, [isOpen]);

  const loadLiveTables = async () => {
    try {
      const res = await fetch('/api/databases', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'db-pg-core',
          action: 'query',
          query: "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename ASC;",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.result)) {
        const names = data.result.map((r: any) => r.tablename).filter(Boolean);
        if (names.length > 0) {
          setTablesList(names);
          if (!names.includes(selectedTable)) {
            setSelectedTable(names[0]);
          }
        }
      }
    } catch {
      // Keep default table list on error
    }
  };

  const loadTableRecords = async (tbl: string) => {
    setIsLoadingTable(true);
    setSelectedTable(tbl);
    try {
      const res = await fetch('/api/databases', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'db-pg-core',
          action: 'query',
          query: `SELECT * FROM "${tbl}" LIMIT 25;`,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.result)) {
        setTableData(data.result);
      } else {
        setTableData([]);
      }
    } catch {
      setTableData([]);
    } finally {
      setIsLoadingTable(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'tables' && selectedTable) {
      loadTableRecords(selectedTable);
    }
  }, [isOpen, activeTab, selectedTable]);

  const handleRunQuery = async () => {
    if (!query.trim()) return;
    setIsRunning(true);
    setQueryError(null);

    try {
      const res = await fetch('/api/databases', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'db-pg-core',
          action: 'query',
          query: query.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setQueryResult(data.result);
        setDurationMs(data.durationMs || 10);
      } else {
        setQueryError(data.result || data.error || 'Query failed');
        setQueryResult(null);
      }
    } catch (e: any) {
      setQueryError(e.message || 'Execution error');
      setQueryResult(null);
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleAskAISchema = (prompt: string) => {
    if (onSendPrompt) {
      onSendPrompt(prompt);
      onClose();
    }
  };

  if (!isOpen) return null;

  const PRISMA_SCHEMA_CODE = `// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id           String        @id @default(uuid())
  email        String        @unique
  passwordHash String
  name         String?
  avatarUrl    String?
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  memberships  Membership[]
  auditLogs    AuditLog[]

  @@map("users")
}

model Organization {
  id           String        @id @default(uuid())
  name         String
  slug         String        @unique
  planTier     String        @default("FREE")
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  memberships  Membership[]
  projects     Project[]

  @@map("organizations")
}

model Project {
  id             String      @id @default(uuid())
  organizationId String
  name           String
  slug           String
  framework      String      @default("vite-react")
  status         String      @default("active")
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  deployments    Deployment[]
  domains        Domain[]

  @@map("projects")
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0f1319] border border-white/10 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-purple-500/10 via-slate-900 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Studio Database Explorer</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  PostgreSQL 16.3 Live
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Prisma ORM
                </span>
              </div>
              <p className="text-xs text-white/50 font-mono">
                postgresql://ultrapie:••••••••@localhost:5432/ultrapie_dev
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopy('postgresql://ultrapie:ultrapie_dev_secret@localhost:5432/ultrapie_dev', 'uri')}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 border border-white/10 flex items-center gap-1.5 transition-colors font-mono"
            >
              {copiedText === 'uri' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied URI</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy DATABASE_URL</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-white/10 bg-white/[0.02] flex items-center gap-6 text-xs font-medium">
          <button
            onClick={() => setActiveTab('tables')}
            className={`py-3 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'tables'
                ? 'border-purple-500 text-purple-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <TableIcon className="w-4 h-4" />
            <span>Tables & Data Grid ({tablesList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('query')}
            className={`py-3 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'query'
                ? 'border-purple-500 text-purple-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>SQL Query Runner</span>
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`py-3 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'schema'
                ? 'border-purple-500 text-purple-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Prisma Models</span>
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`py-3 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'ai'
                ? 'border-purple-500 text-purple-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>AI Schema Assistant</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-hidden p-6 flex flex-col">
          {/* TAB 1: Tables & Data Grid */}
          {activeTab === 'tables' && (
            <div className="flex-1 flex gap-6 overflow-hidden">
              {/* Tables Sidebar */}
              <div className="w-56 flex flex-col border-r border-white/10 pr-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Tables
                  </span>
                  <button
                    onClick={loadLiveTables}
                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                    title="Refresh Tables"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-1">
                  {tablesList.map((tbl) => (
                    <button
                      key={tbl}
                      onClick={() => loadTableRecords(tbl)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono flex items-center justify-between transition-all ${
                        selectedTable === tbl
                          ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 font-semibold'
                          : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                      }`}
                    >
                      <span className="truncate">{tbl}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Table Data View */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-white">{selectedTable}</span>
                    <span className="text-xs text-slate-500 font-mono">
                      ({tableData.length} rows loaded)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => loadTableRecords(selectedTable)}
                      disabled={isLoadingTable}
                      className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-300 border border-white/10 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      {isLoadingTable ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5" />
                      )}
                      <span>Refresh</span>
                    </button>
                  </div>
                </div>

                {/* Grid */}
                <div className="flex-1 border border-white/10 rounded-xl overflow-auto bg-slate-950/60">
                  {isLoadingTable ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500">
                      <Loader2 className="w-6 h-6 animate-spin text-purple-400 mb-2" />
                      <span className="text-xs">Fetching records from PostgreSQL...</span>
                    </div>
                  ) : tableData.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 p-8 text-center">
                      <TableIcon className="w-8 h-8 text-slate-600 mb-2" />
                      <span className="text-xs font-medium text-slate-400">Table is empty</span>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Use the SQL Runner or AI Assistant to insert sample data.
                      </p>
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-mono sticky top-0 border-b border-white/10 z-10">
                        <tr>
                          {Object.keys(tableData[0]).map((col) => (
                            <th key={col} className="p-3 whitespace-nowrap bg-slate-900/95 font-semibold">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                        {tableData.map((row, idx) => (
                          <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                            {Object.values(row).map((val: any, vIdx) => (
                              <td key={vIdx} className="p-3 text-slate-300 whitespace-nowrap max-w-xs truncate">
                                {typeof val === 'object' && val !== null
                                  ? JSON.stringify(val)
                                  : String(val ?? '')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SQL Query Runner */}
          {activeTab === 'query' && (
            <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
              {/* Presets */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
                  Quick Queries:
                </span>
                {[
                  "SELECT tablename FROM pg_tables WHERE schemaname = 'public';",
                  'SELECT id, email, name, "createdAt" FROM users;',
                  'SELECT * FROM organizations;',
                  'SELECT * FROM projects;',
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => setQuery(q)}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-[11px] font-mono whitespace-nowrap transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Query Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    SQL Statement
                  </label>
                  <button
                    onClick={handleRunQuery}
                    disabled={isRunning}
                    className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-purple-600/25 transition-all disabled:opacity-50"
                  >
                    {isRunning ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Executing...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Execute SQL</span>
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="SELECT * FROM users;"
                  className="w-full p-3 rounded-xl bg-slate-950 border border-white/10 font-mono text-xs text-purple-300 placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Query Result */}
              <div className="flex-1 flex flex-col overflow-hidden border border-white/10 rounded-xl bg-slate-950/60 p-4">
                <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <TableIcon className="w-3.5 h-3.5 text-purple-400" />
                    <span>Execution Output</span>
                  </span>
                  {durationMs !== null && (
                    <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{durationMs}ms</span>
                    </span>
                  )}
                </div>

                {queryError && (
                  <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-900/60 text-xs text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span className="font-mono">{queryError}</span>
                  </div>
                )}

                {queryResult === null && !queryError && (
                  <div className="flex-1 flex items-center justify-center text-slate-600 font-mono text-xs">
                    Click "Execute SQL" or select a preset query to run.
                  </div>
                )}

                {queryResult !== null && (
                  <div className="flex-1 overflow-auto font-mono text-xs">
                    {Array.isArray(queryResult) && queryResult.length > 0 && typeof queryResult[0] === 'object' ? (
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] sticky top-0 border-b border-white/10">
                          <tr>
                            {Object.keys(queryResult[0]).map((col) => (
                              <th key={col} className="p-2 whitespace-nowrap">{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {queryResult.map((row, idx) => (
                            <tr key={idx} className="hover:bg-white/[0.02]">
                              {Object.values(row).map((val: any, vIdx) => (
                                <td key={vIdx} className="p-2 text-slate-200 whitespace-nowrap">
                                  {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <pre className="text-purple-300 text-xs overflow-auto">
                        {JSON.stringify(queryResult, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Prisma Models */}
          {activeTab === 'schema' && (
            <div className="flex-1 flex flex-col overflow-hidden space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono">
                  Active Prisma Schema (database/prisma/schema.prisma)
                </span>
                <button
                  onClick={() => handleCopy(PRISMA_SCHEMA_CODE, 'prisma')}
                  className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-300 border border-white/10 flex items-center gap-1.5 transition-colors font-mono"
                >
                  {copiedText === 'prisma' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied Schema</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Schema</span>
                    </>
                  )}
                </button>
              </div>
              <div className="flex-1 border border-white/10 rounded-xl bg-slate-950 p-4 overflow-auto">
                <pre className="font-mono text-xs text-purple-300 leading-relaxed">
                  {PRISMA_SCHEMA_CODE}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 4: AI Schema Assistant */}
          {activeTab === 'ai' && (
            <div className="flex-1 flex flex-col space-y-4 overflow-y-auto">
              <div>
                <h4 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  AI Schema & Migration Assistant
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Click any architecture preset below to instantly prompt the AI in your Studio chat to generate models, CRUD tables, seed data, and API routes.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    title: 'Fullstack Task & Project Tracker',
                    desc: 'Generates Tasks, Projects, and Priority enum models with drag-and-drop Kanban UI and live PostgreSQL persistence.',
                    prompt: 'Build a fullstack Task & Project Tracker connected to PostgreSQL with Prisma schema, tasks table, priority tags, and interactive CRUD.',
                  },
                  {
                    title: 'E-commerce Products & Orders',
                    desc: 'Generates Products, Categories, Orders, and OrderItems models with a sleek store checkout UI.',
                    prompt: 'Build an E-commerce store with Products, Orders, and Customers backed by Prisma models and PostgreSQL tables.',
                  },
                  {
                    title: 'User Profiles & Team Permissions',
                    desc: 'Generates Team, Role (Owner, Admin, Member), and UserProfile models with an admin access management table.',
                    prompt: 'Add Team Management with Role-Based Access Control (RBAC), team member invites, and PostgreSQL schema.',
                  },
                  {
                    title: 'Telemetry & Analytics Logs',
                    desc: 'Generates EventLog, MetricData, and LatencySample models with real-time analytics graphs and chart components.',
                    prompt: 'Build a real-time Telemetry & Event Log dashboard with interactive metric charts and persistent database models.',
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-white/[0.02] border border-white/10 hover:border-purple-500/40 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <h5 className="font-semibold text-white text-xs mb-1 text-purple-300">
                        {item.title}
                      </h5>
                      <p className="text-xs text-slate-400 leading-relaxed mb-3">
                        {item.desc}
                      </p>
                    </div>
                    <button
                      onClick={() => handleAskAISchema(item.prompt)}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white text-xs font-semibold border border-purple-500/30 transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Prompt AI to Build This</span>
                      <ArrowRight className="w-3 h-3 ml-auto" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/10 bg-white/[0.01] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Server className="w-3.5 h-3.5 text-purple-400" />
            <span>Database: ultrapie-postgres (Container ID: d41c4f9a18d5, Port: 5432)</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
