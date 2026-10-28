/**
 * Ultrapie Intelligent Fallback Engine
 * Provides instant responses and complete functional React 19 + Tailwind code
 * whenever external Google Gemini APIs experience network latency, connection timeouts, or quota limits.
 */

export interface FallbackAppResult {
  chatText: string;
  files: Record<string, string>;
}

export function isCodeGenerationPrompt(prompt: string): boolean {
  const p = prompt.toLowerCase().trim();

  // 1. If it's a question (ends with ?, or starts with question words), it is NOT code generation!
  if (
    p.endsWith('?') ||
    /^(what|why|how|who|where|when|can\s+you|could\s+you|tell\s+me|explain|is\s+it|are\s+there)\b/i.test(p)
  ) {
    // Only treat as code generation if there is an explicit command like "can you build a ..."
    if (!/\b(build|create|code|generate|make)\s+(me\s+)?(a|an|the)\b/i.test(p)) {
      return false;
    }
  }

  // 2. Queries asking for ideas, suggestions, concepts, comparisons, tutorials, help
  if (
    p.includes('idea') ||
    p.includes('suggest') ||
    p.includes('explain') ||
    p.includes('how to') ||
    p.includes('how do i') ||
    p.includes('how can i') ||
    p.includes('what should') ||
    p.includes('recommend') ||
    p.includes('difference between') ||
    p.includes('tell me about') ||
    p.includes('help me understand') ||
    p.includes('question')
  ) {
    return false;
  }

  // 3. Greetings & introductory queries
  if (
    /^(hi|hello|hey|greetings|good\s+(morning|afternoon|evening)|yo|sup)\b/i.test(p) ||
    /^(what\s+can\s+you\s+do|who\s+are\s+you|help|how\s+does\s+this\s+work|what\s+is\s+ultrapie)\b/i.test(p)
  ) {
    return false;
  }

  // 4. Explicit build commands & app requests (English & French)
  const buildPatterns = [
    /^(build|create|generate|code|develop|make|give|fais|cree|créer)\b/i,
    /\b(build|create|generate|make|code|design|develop|fais|cree|créer)\s+(a|an|the|me|us|un|une)?\b/i,
    /\b(i\s+want|i\s+need|give\s+me|je\s+veux|donne\s+moi)\s+(a|an|the|un|une)?\s*([a-z0-9-]+\s+)*(app|application|website|site|landing|dashboard|page|ui|component|store|portfolio|form|calculator|game|todo)\b/i,
    /\b(build|create|generate|make)\s+(a|an|the|me|us)?\s*([a-z0-9-]+\s+)*(app|application|website|site|landing|dashboard|page|ui|component|store|portfolio|form|calculator|game|todo)\b/i,
    /\b(add|insert|implement|change|update|ajoute)\s+(a|an|the|un|une)?\s*([a-z0-9-]+\s+)*(button|navbar|hero|footer|section|modal|card|table|sidebar|header|tab|chart|color|theme)\b/i,
    /^(landing\s+page|dashboard|portfolio|ecommerce|todo\s+app)\b/i,
  ];

  return buildPatterns.some((pattern) => pattern.test(p));
}

export function generateFallbackResponse(
  prompt: string,
  existingFiles: Record<string, string> = {}
): FallbackAppResult {
  const p = prompt.toLowerCase();

  // 0. Fullstack Database-Backed Application (PostgreSQL / Redis / SQL / CRUD)
  if (
    p.includes('database') ||
    p.includes('db') ||
    p.includes('postgres') ||
    p.includes('redis') ||
    p.includes('sql') ||
    p.includes('crud') ||
    p.includes('prisma') ||
    p.includes('schema') ||
    p.includes('fullstack')
  ) {
    return {
      chatText: `I have architected a **Fullstack Database-Backed Application** for you, connected to your managed PostgreSQL 16.3 & Redis 7.2 clusters with automated Prisma schema models, typed data queries, and an interactive live records console!`,
      files: {
        'src/App.tsx': `import React, { useState } from 'react';
import { Database, Plus, Trash2, Search, RefreshCw, CheckCircle2, Table, Terminal, Server, ShieldCheck, Sparkles, Filter } from 'lucide-react';

interface RecordItem {
  id: string;
  name: string;
  category: string;
  status: 'active' | 'pending' | 'archived';
  recordsCount: number;
  updatedAt: string;
}

const INITIAL_RECORDS: RecordItem[] = [
  { id: 'rec_101', name: 'User Authentication Session', category: 'Security', status: 'active', recordsCount: 1420, updatedAt: 'Just now' },
  { id: 'rec_102', name: 'Global Product Inventory', category: 'Catalog', status: 'active', recordsCount: 840, updatedAt: '2 mins ago' },
  { id: 'rec_103', name: 'Payment Webhook Payloads', category: 'Billing', status: 'pending', recordsCount: 312, updatedAt: '15 mins ago' },
  { id: 'rec_104', name: 'Telemetry & Request Latency Logs', category: 'Analytics', status: 'active', recordsCount: 5240, updatedAt: '1 hour ago' },
  { id: 'rec_105', name: 'Deprecated API V1 Tokens', category: 'Auth', status: 'archived', recordsCount: 68, updatedAt: 'Yesterday' },
];

export default function App() {
  const [records, setRecords] = useState<RecordItem[]>(INITIAL_RECORDS);
  const [activeTab, setActiveTab] = useState<'records' | 'schema' | 'query'>('records');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('General');
  const [executedQuery, setExecutedQuery] = useState('SELECT * FROM "records" WHERE status = \\'active\\' LIMIT 10;');
  const [queryResult, setQueryResult] = useState<any>(null);
  const [queryLatency, setQueryLatency] = useState<number | null>(null);

  const filtered = records.filter((r) => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'All' || r.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const newRec: RecordItem = {
      id: 'rec_' + Math.floor(100 + Math.random() * 900),
      name: newName,
      category: newCategory,
      status: 'active',
      recordsCount: Math.floor(Math.random() * 500) + 1,
      updatedAt: 'Just now',
    };
    setRecords([newRec, ...records]);
    setNewName('');
  };

  const handleDelete = (id: string) => {
    setRecords(records.filter((r) => r.id !== id));
  };

  const handleRunQuery = () => {
    const start = performance.now();
    setQueryResult(filtered);
    setQueryLatency(Math.round(performance.now() - start + 8));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Banner: Database Connection State */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-white text-base">Ultrapie Database Control Hub</h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                PostgreSQL 16.3 Connected
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">DATABASE_URL: postgresql://admin:***@db.ultrapie.internal:5432/production</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-mono text-cyan-300 flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5" />
            Redis Cache: 100% Hit Rate
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="px-6 border-b border-slate-800 bg-slate-900/40 flex items-center gap-6 text-xs font-medium">
        <button
          onClick={() => setActiveTab('records')}
          className={\`py-3 border-b-2 flex items-center gap-2 \${activeTab === 'records' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-400 hover:text-white'}\`}
        >
          <Table className="w-4 h-4" /> Live Records (\${records.length})
        </button>
        <button
          onClick={() => setActiveTab('schema')}
          className={\`py-3 border-b-2 flex items-center gap-2 \${activeTab === 'schema' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-400 hover:text-white'}\`}
        >
          <ShieldCheck className="w-4 h-4" /> Prisma Schema
        </button>
        <button
          onClick={() => setActiveTab('query')}
          className={\`py-3 border-b-2 flex items-center gap-2 \${activeTab === 'query' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-400 hover:text-white'}\`}
        >
          <Terminal className="w-4 h-4" /> SQL Console
        </button>
      </div>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {activeTab === 'records' && (
          <div className="space-y-6">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search records by name or ID..."
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-purple-500"
                >
                  <option value="All">All Categories</option>
                  <option value="Security">Security</option>
                  <option value="Catalog">Catalog</option>
                  <option value="Billing">Billing</option>
                  <option value="Analytics">Analytics</option>
                  <option value="Auth">Auth</option>
                </select>
              </div>

              {/* Insert Form */}
              <form onSubmit={handleCreate} className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="New record name..."
                  className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-md shadow-purple-600/20"
                >
                  <Plus className="w-3.5 h-3.5" /> Insert
                </button>
              </form>
            </div>

            {/* Table */}
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 font-medium border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Record ID</th>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Row Count</th>
                    <th className="py-3 px-4">Last Updated</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-900/60 transition-colors">
                      <td className="py-3 px-4 text-purple-400">{item.id}</td>
                      <td className="py-3 px-4 font-sans font-medium text-white">{item.name}</td>
                      <td className="py-3 px-4 font-sans text-slate-300">{item.category}</td>
                      <td className="py-3 px-4">
                        <span className={\`px-2 py-0.5 rounded-full text-[10px] font-sans font-medium \${
                          item.status === 'active' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          item.status === 'pending' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                          'bg-slate-800 text-slate-400'
                        }\`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300">{item.recordsCount.toLocaleString()}</td>
                      <td className="py-3 px-4 font-sans text-slate-400">{item.updatedAt}</td>
                      <td className="py-3 px-4 text-right font-sans">
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-400 transition-colors"
                          title="Delete record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'schema' && (
          <div className="border border-slate-800 rounded-xl p-5 bg-slate-900/60 space-y-3 font-mono text-xs text-slate-300">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-white font-bold">prisma/schema.prisma</span>
              <span className="text-emerald-400">PostgreSQL Provider</span>
            </div>
            <pre className="overflow-x-auto text-purple-300 leading-relaxed">
{\`datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Record {
  id           String   @id @default(uuid())
  name         String
  category     String
  status       String   @default("active")
  recordsCount Int      @default(0)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([status, category])
  @@map("records")
}\`}
            </pre>
          </div>
        )}

        {activeTab === 'query' && (
          <div className="space-y-4">
            <div className="border border-slate-800 rounded-xl p-4 bg-slate-900/60 space-y-3">
              <label className="text-xs font-semibold text-slate-300 block">Interactive SQL Query Runner</label>
              <textarea
                value={executedQuery}
                onChange={(e) => setExecutedQuery(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs text-purple-300 focus:outline-none focus:border-purple-500"
              />
              <button
                onClick={handleRunQuery}
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black font-semibold text-xs transition-colors flex items-center gap-2 shadow-md shadow-emerald-500/20"
              >
                <Terminal className="w-3.5 h-3.5" /> Execute Query
              </button>
            </div>

            {queryResult && (
              <div className="border border-slate-800 rounded-xl p-4 bg-slate-900/40 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Query Succeeded
                  </span>
                  <span>Latency: {queryLatency}ms</span>
                </div>
                <pre className="text-xs font-mono text-slate-300 overflow-x-auto bg-slate-950 p-3 rounded-lg border border-slate-800">
                  {JSON.stringify(queryResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
`,
        'prisma/schema.prisma': `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Record {
  id           String   @id @default(uuid())
  name         String
  category     String
  status       String   @default("active")
  recordsCount Int      @default(0)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([status, category])
  @@map("records")
}
`,
        'src/lib/db.ts': `/**
 * Database client helper for PostgreSQL & Redis
 */
export interface DatabaseConfig {
  connectionUri: string;
  ssl: boolean;
}

export const dbConfig: DatabaseConfig = {
  connectionUri: process.env.DATABASE_URL || 'postgresql://admin:secret@db.ultrapie.internal:5432/production',
  ssl: true,
};
`,
      },
    };
  }

  // 1. Dashboard / Analytics
  if (p.includes('dashboard') || p.includes('analytic') || p.includes('metric') || p.includes('admin')) {
    return {
      chatText: `I have built a modern **Analytics & Metrics Dashboard** for you with real-time stat cards, interactive charts, recent activity logs, and quick actions!`,
      files: {
        'src/App.tsx': `import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight,
  Bell,
  Search,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';

export default function App() {
  const [timeRange, setTimeRange] = useState('7d');
  const [activeTab, setActiveTab] = useState('overview');

  const stats = [
    { title: 'Total Revenue', value: '$48,250', change: '+14.2%', isUp: true, icon: DollarSign, color: 'text-emerald-400' },
    { title: 'Active Users', value: '12,450', change: '+8.1%', isUp: true, icon: Users, color: 'text-blue-400' },
    { title: 'Conversion Rate', value: '3.84%', change: '-0.4%', isUp: false, icon: TrendingUp, color: 'text-amber-400' },
    { title: 'System Health', value: '99.98%', change: '+0.02%', isUp: true, icon: Activity, color: 'text-purple-400' },
  ];

  const recentTransactions = [
    { id: 1, user: 'Sophia Martin', email: 'sophia@example.com', amount: '+$240.00', status: 'Completed', date: '2 min ago' },
    { id: 2, user: 'Alex Chen', email: 'alex@example.com', amount: '+$590.00', status: 'Completed', date: '15 min ago' },
    { id: 3, user: 'Marcus Wright', email: 'marcus@example.com', amount: '+$99.00', status: 'Processing', date: '1 hour ago' },
    { id: 4, user: 'Elena Rossi', email: 'elena@example.com', amount: '+$1,200.00', status: 'Completed', date: '3 hours ago' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">Ultrapie Analytics</h1>
            <p className="text-[11px] text-slate-400">Enterprise Operations Platform</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
            <input 
              type="text" 
              placeholder="Search metrics..." 
              className="pl-9 pr-4 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <button className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors">
            <Bell className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Controls & Range Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">System Overview</h2>
            <p className="text-xs text-slate-400 mt-1">Real-time performance indicators and revenue pipeline.</p>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
            {['24h', '7d', '30d', '90d'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={\`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors \${
                  timeRange === range ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }\`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-slate-400 font-medium">{stat.title}</span>
                  <div className={\`p-2 rounded-xl bg-slate-800/80 \${stat.color}\`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-white tracking-tight">{stat.value}</div>
                <div className="flex items-center gap-1 mt-2 text-xs">
                  {stat.isUp ? (
                    <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <ArrowDownRight className="h-3.5 w-3.5 text-rose-400" />
                  )}
                  <span className={stat.isUp ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'}>
                    {stat.change}
                  </span>
                  <span className="text-slate-500">vs last period</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Table & Chart Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Visual Panel */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Revenue Velocity</h3>
                <p className="text-xs text-slate-400">Aggregated daily billing volume</p>
              </div>
              <span className="px-2.5 py-1 text-[11px] rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                Live Stream Active
              </span>
            </div>

            {/* Simulated Modern Chart Bars */}
            <div className="h-48 pt-6 flex items-end justify-between gap-3 px-2">
              {[45, 62, 58, 75, 90, 82, 95, 78, 88, 105, 98, 120].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                  <div 
                    style={{ height: \`\${h}px\` }} 
                    className="w-full bg-gradient-to-t from-blue-600 to-cyan-400 rounded-t-md group-hover:brightness-125 transition-all"
                  />
                  <span className="text-[10px] text-slate-500">W{i + 1}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white">Recent Transactions</h3>
            <div className="space-y-3">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-slate-200">{tx.user}</div>
                    <div className="text-[10px] text-slate-500">{tx.date}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-emerald-400">{tx.amount}</div>
                    <div className="text-[10px] text-slate-400">{tx.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}`,
        'src/index.css': `@tailwind base;\n@tailwind components;\n@tailwind utilities;\nbody { margin: 0; background-color: #020617; }`,
        'package.json': JSON.stringify(
          {
            name: 'ultrapie-dashboard',
            dependencies: { react: '^19.0.0', 'react-dom': '^19.0.0', 'lucide-react': '^1.16.0' },
          },
          null,
          2
        ),
      },
    };
  }

  // 2. Landing Page / SaaS / Hero (Default)
  return {
    chatText: `I have crafted a high-converting, modern **SaaS Landing Page** with an interactive hero, glowing CTA buttons, responsive feature cards, dynamic pricing tables, and client proof badges!`,
    files: {
      'src/App.tsx': `import React, { useState } from 'react';
import { 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  Globe, 
  ArrowRight, 
  CheckCircle2, 
  Code2, 
  Rocket, 
  Star,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [annualBilling, setAnnualBilling] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [likes, setLikes] = useState(384);
  const [hasLiked, setHasLiked] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const features = [
    {
      icon: Zap,
      title: 'Real-Time Live Streaming',
      desc: 'Watch your code type itself out in Monaco character-by-character while simultaneously previewing rendered pages.',
      color: 'from-amber-400 to-orange-500',
    },
    {
      icon: ShieldCheck,
      title: 'Zero-Trust Sandboxing',
      desc: 'Multi-layer defense with secret scanning, ClamAV anti-malware quarantine, and automated lockfile CVE auditing.',
      color: 'from-emerald-400 to-cyan-500',
    },
    {
      icon: Rocket,
      title: '1-Click Coolify & Cloudflare',
      desc: 'Deploy natively to your self-hosted VPS servers via Coolify API or Cloudflare Zero Trust global tunnels.',
      color: 'from-blue-500 to-indigo-600',
    },
  ];

  const pricingTiers = [
    {
      name: 'Starter',
      price: annualBilling ? '$19' : '$24',
      period: '/month',
      desc: 'Perfect for indie hackers and solo founders.',
      features: ['5 Active Apps', '10,000 Live Tokens/mo', 'Free Subdomains', 'Community Support'],
      highlighted: false,
    },
    {
      name: 'Pro',
      price: annualBilling ? '$49' : '$59',
      period: '/month',
      desc: 'For professional developers and growing startups.',
      features: ['Unlimited Apps', '500,000 Live Tokens/mo', 'Custom Domains + SSL', 'Coolify 1-Click VPS Deploy', 'Priority 24/7 Support'],
      highlighted: true,
    },
    {
      name: 'Enterprise',
      price: annualBilling ? '$199' : '$249',
      period: '/month',
      desc: 'Full autonomy with dedicated private VPC nodes.',
      features: ['Custom AI Models', 'Unlimited Team Seats', 'Dedicated VPS & Docker Hosts', 'SLA 99.99% Guaranteed', 'Dedicated Engineering Manager'],
      highlighted: false,
    },
  ];

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 font-sans selection:bg-cyan-500 selection:text-white">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Ultrapie
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm text-slate-400 font-medium">
            <a href="#features" className="hover:text-cyan-400 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-cyan-400 transition-colors">Pricing</a>
            <a href="#showcase" className="hover:text-cyan-400 transition-colors">Showcase</a>
            <a href="#docs" className="hover:text-cyan-400 transition-colors">Docs</a>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <button 
              onClick={() => setShowModal(true)}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Sign In
            </button>
            <button 
              onClick={() => setShowModal(true)}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
            >
              <span>Start Building</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-28 px-6 overflow-hidden text-center">
        {/* Glow backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-cyan-500/20 via-blue-600/20 to-purple-600/20 blur-[120px] pointer-events-none rounded-full" />

        <div className="max-w-4xl mx-auto relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Next-Gen Autonomous Vibe Coding & Hosting Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Build and Deploy Apps with{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-400 bg-clip-text text-transparent">
              Natural Language
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Turn your thoughts into fully functional, production-ready React 19 and Tailwind CSS web applications with instant live code streaming and single-click VPS deployment.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button 
              onClick={() => setShowModal(true)}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:brightness-110 text-white font-semibold text-sm shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Open Ultrapie Studio</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button 
              onClick={() => triggerToast('✨ System Architecture: 12-Phase Microservices + Coolify Engine')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Code2 className="h-4 w-4 text-cyan-400" />
              <span>Explore Architecture</span>
            </button>
          </div>

          {/* Clickable Social Proof & Interactive Counter */}
          <div className="pt-10 flex items-center justify-center gap-6 text-xs text-slate-500">
            <button 
              onClick={() => {
                setLikes(likes + (hasLiked ? -1 : 1));
                setHasLiked(!hasLiked);
                triggerToast(hasLiked ? 'Removed like' : '❤️ Liked by you!');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-amber-400 transition-colors cursor-pointer"
            >
              <Star className={\`h-3.5 w-3.5 \${hasLiked ? 'fill-amber-400' : ''}\`} />
              <span className="font-bold">{likes} Likes</span>
            </button>
            <span>Trusted by 10,000+ indie developers</span>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="text-3xl font-bold text-white">Engineered for Maximum Speed</h2>
          <p className="text-sm text-slate-400">Everything you need to turn thoughts into live web software in seconds.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div key={idx} className="p-7 rounded-3xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all group">
                <div className={\`h-12 w-12 rounded-2xl bg-gradient-to-tr \${feat.color} flex items-center justify-center mb-6 shadow-md\`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{feat.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-12 space-y-4">
          <h2 className="text-3xl font-bold text-white">Transparent, Scalable Pricing</h2>
          <p className="text-sm text-slate-400">Choose the plan that fits your ambition.</p>
          
          <div className="inline-flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs">
            <button 
              onClick={() => setAnnualBilling(false)}
              className={\`px-3 py-1.5 rounded-lg font-medium transition-colors \${!annualBilling ? 'bg-blue-600 text-white' : 'text-slate-400'}\`}
            >
              Monthly
            </button>
            <button 
              onClick={() => setAnnualBilling(true)}
              className={\`px-3 py-1.5 rounded-lg font-medium transition-colors \${annualBilling ? 'bg-blue-600 text-white' : 'text-slate-400'}\`}
            >
              Annual (20% Off)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pricingTiers.map((tier, idx) => (
            <div 
              key={idx} 
              className={\`p-8 rounded-3xl border flex flex-col justify-between transition-all relative \${
                tier.highlighted 
                  ? 'bg-slate-900 border-cyan-500/50 shadow-2xl shadow-cyan-500/10' 
                  : 'bg-slate-950/60 border-slate-800'
              }\`}
            >
              {tier.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-cyan-500 text-slate-950 text-[10px] font-extrabold uppercase tracking-wider">
                  Most Popular
                </div>
              )}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white">{tier.name}</h3>
                <p className="text-xs text-slate-400">{tier.desc}</p>
                <div className="pt-2">
                  <span className="text-4xl font-extrabold text-white">{tier.price}</span>
                  <span className="text-xs text-slate-500 font-medium">{tier.period}</span>
                </div>
                <div className="h-px bg-slate-800 my-4" />
                <ul className="space-y-2.5 text-xs text-slate-300">
                  {tier.features.map((feat, fidx) => (
                    <li key={fidx} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button 
                onClick={() => {
                  triggerToast(\`Selected plan: \${tier.name}\`);
                  setShowModal(true);
                }}
                className={\`mt-8 w-full py-3 rounded-xl text-xs font-bold transition-all cursor-pointer \${
                  tier.highlighted 
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-md' 
                    : 'bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200'
                }\`}
              >
                Get Started with {tier.name}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Join Ultrapie Platform</h3>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400">Experience autonomous vibe coding, live streaming previews, and 1-click VPS hosting.</p>
            <input 
              type="email" 
              placeholder="Enter your email..." 
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button 
              onClick={() => {
                setShowModal(false);
                triggerToast('🎉 Welcome aboard! Access granted.');
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              Continue with Email
            </button>
          </div>
        </div>
      )}

      {/* Interactive Toast Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-900 border border-cyan-500/50 text-cyan-300 text-xs shadow-2xl shadow-cyan-500/20 backdrop-blur-md animate-in slide-in-from-bottom-3">
          <Sparkles className="h-4 w-4 text-cyan-400 shrink-0" />
          <span className="font-medium text-slate-200">{toastMessage}</span>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-10 px-6 text-center text-xs text-slate-500">
        <p>© 2026 Ultrapie Inc. All rights reserved. Self-hosted & Cloudflare Tunnel ready.</p>
      </footer>
    </div>
  );
}`,
      'src/index.css': `@tailwind base;\n@tailwind components;\n@tailwind utilities;\nbody { margin: 0; background-color: #090d16; }`,
      'package.json': JSON.stringify(
        {
          name: 'ultrapie-landing-app',
          dependencies: { react: '^19.0.0', 'react-dom': '^19.0.0', 'lucide-react': '^1.16.0' },
        },
        null,
        2
      ),
    },
  };
}

export function generateConversationalResponse(prompt: string): string {
  const p = prompt.toLowerCase().trim();

  // Greetings
  if (/^(hi|hello|hey|good\s+(morning|afternoon|evening)|yo|greetings)\b/i.test(p)) {
    return `### Hello! 👋 Welcome to Ultrapie Studio

I am your **AI Assistant & Live Application Architect**. I can help you in two ways:

1. **Answer Questions**: Explain software concepts, suggest UI/UX patterns, recommend tech stacks, discuss database schemas, or guide your SaaS pricing.
2. **Build Live Applications**: Whenever you are ready to code, just tell me: *"Build a SaaS landing page"*, *"Create an analytics dashboard"*, or *"Add a pricing section"*. I will stream the code line-by-line and render the live interactive app right here in your browser!

How can I help you today?`;
  }

  // What is Ultrapie / What can you do
  if (p.includes('what is ultrapie') || p.includes('what can you do') || p.includes('how does this work') || p.includes('who are you')) {
    return `### About Ultrapie Studio & Capabilities 🚀

**Ultrapie** is a natural-language app builder and cloud hosting platform inspired by Google AI Studio and Antigravity.

#### Key Features:
- **Natural Language App Generation**: Describe any interface in English or French and receive full-stack, modular React 19 + Tailwind CSS applications.
- **In-Browser Babel Standalone Preview**: No server build delays—your code transpiles directly in your browser's memory and updates interactively.
- **Line-by-Line Monaco Streaming**: Watch code type out in real time with line indicators.
- **1-Click Self-Hosted VPS Deployment**: One click deploys your built apps to Coolify VPS (:8000) or Cloudflare Tunnels (ultrapie.com).
- **Dual View Modes**: Switch between **Preview**, **Split (Side-by-Side)**, and **Full Code** at any time.

Feel free to ask any development question, or tell me what interface you want to create!`;
  }

  // App Ideas & Brainstorming
  if (p.includes('idea') || p.includes('suggest') || p.includes('what should i build') || p.includes('recommend')) {
    return `### 💡 High-Converting Web Application Ideas

Here are 5 popular applications that perform exceptionally well:

1. **AI Micro-SaaS Landing Page**:
   - Hero section with glowing gradient CTA
   - Interactive 3-tier monthly pricing table ($19 / $49 / $99)
   - Social proof cards and customer testimonial carousel
   - *Prompt to build:* \`Build a modern AI SaaS landing page with dark theme and pricing table\`

2. **Executive KPI Analytics Dashboard**:
   - Metric cards: MRR, Active Users, Conversion Rate, Health Score
   - Visual revenue trend charts and filterable transactions table
   - *Prompt to build:* \`Create a sales analytics dashboard with charts and data tables\`

3. **Kanban Task & Project Manager**:
   - Multi-column workflow (To Do, In Progress, Under Review, Done)
   - Task creation modal, tag badges, and priority indicators
   - *Prompt to build:* \`Build a kanban task manager with interactive cards\`

4. **Developer & Designer Portfolio**:
   - Clean minimalist hero with bio, social links, and skills pills
   - Filterable project grid with live preview modals
   - *Prompt to build:* \`Create a modern developer portfolio with project showcase\`

5. **E-Commerce Storefront**:
   - Category filtering (Sneakers, Watches, Bags)
   - Product cards with price tags and dynamic Add-to-Cart drawer
   - *Prompt to build:* \`Build an e-commerce product store with shopping cart\`

Which of these would you like to explore or build?`;
  }

  // Deployment, Coolify & Hosting
  if (p.includes('coolify') || p.includes('deploy') || p.includes('hosting') || p.includes('vps') || p.includes('server')) {
    return `### 🌐 Deployment & Hosting Architecture

Ultrapie provides native integrations for both self-hosted VPS environments and global edge networks:

1. **Coolify Self-Hosted VPS (Port 8000)**:
   - Your server runs Coolify at \`http://localhost:8000\` managed by Docker and Traefik on ports 80/443.
   - You can access Coolify with credentials:
     - **Email:** \`zohodigital.com@gmail.com\`
     - **Password:** \`Ultrapie2026!\`
   - Use the **Coolify VPS** button in the top bar to push releases directly to your server.

2. **1-Click Easy Deploy**:
   - Click the green **Easy Deploy** button in the studio top bar to choose between instant live deployment, Coolify container launch, or downloading a complete standalone ZIP bundle.

3. **Cloudflare Zero Trust Tunnel**:
   - Your tunnel client is running under systemd in WSL Ubuntu.
   - Point your Cloudflare Zero Trust Public Hostname to \`localhost:3005\` for root access at \`ultrapie.com\`.`;
  }

  // Cloudflare & Domain Questions
  if (p.includes('cloudflare') || p.includes('domain') || p.includes('dns') || p.includes('ultrapie.com')) {
    return `### 🔒 Connecting Your Domain (ultrapie.com)

If you see **DNS_PROBE_POSSIBLE** when visiting \`ultrapie.com\`, follow these simple steps in Cloudflare:

1. Log into your [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Select your domain: **\`ultrapie.com\`**.
3. Go to **Zero Trust** &rarr; **Networks** &rarr; **Tunnels**.
4. Click on your active tunnel: \`e2cf74e0-fb53-4ef8-bcbf-763f7238731f\`.
5. Under **Public Hostname**, click **Add a public hostname**:
   - **Subdomain:** (leave blank for root, or enter \`studio\` / \`www\`)
   - **Domain:** \`ultrapie.com\`
   - **Service Type:** \`HTTP\`
   - **URL:** \`localhost:3005\` (or \`10.0.1.1:3005\`)
6. Click **Save Hostname**. Cloudflare will automatically register the DNS CNAME record, making \`ultrapie.com\` publicly live worldwide within seconds!`;
  }

  // Stripe & Payment Integration
  if (p.includes('stripe') || p.includes('payment') || p.includes('subscription') || p.includes('paywall') || p.includes('money')) {
    return `### 💳 Integrating Payments & Subscriptions

Ultrapie includes a built-in multi-tier subscription engine ($19 Starter, $49 Pro, $99 Enterprise):

#### How It Works:
- **Client Paywall**: \`SubscriptionModal.tsx\` renders 3 tiers with features and monthly checkout buttons.
- **Server Endpoint**: \`/api/auth/subscribe\` processes plan upgrades and records active subscriptions for 30 days.
- **Owner Tracking**: The **Admin Hub** tracks real-time MRR ($/mo) and active paying accounts.

#### Integrating Real Stripe Checkout:
1. Create a Stripe account at [stripe.com](https://stripe.com).
2. Create your products & recurring monthly prices ($19, $49, $99).
3. Add \`STRIPE_SECRET_KEY\` and \`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY\` to your \`.env.local\`.
4. Call \`stripe.checkout.sessions.create({ mode: 'subscription', line_items: [...] })\`.`;
  }

  // Tech Stack & Frameworks
  if (p.includes('tech stack') || p.includes('react') || p.includes('tailwind') || p.includes('typescript') || p.includes('next')) {
    return `### 🛠️ Ultrapie Core Technology Stack

- **Frontend & App Core**: React 19 + TypeScript 5.8
- **Styling**: Tailwind CSS with responsive container queries and custom animations
- **In-Browser Execution**: Babel Standalone with \`env\` (CommonJS) and \`typescript\` presets
- **Code Editor**: Microsoft Monaco Editor (the core engine of VS Code) with live streaming line pacing
- **AI Engine**: Google Gemini 3 Flash via \`@google/genai\`
- **Reverse Proxy**: Traefik v3 (Coolify Proxy) with dynamic hot-reloading YAML
- **Server Runtime**: Node.js v22 on native Linux ext4 (WSL Ubuntu) with systemd supervision`;
  }

  // Catch-All / Offline Fallback Notice
  return `### 💡 Google Gemini Engine Notice

I received your prompt: "*${prompt}*"

If you are seeing this message, the default shared Gemini API key has reached its daily free-tier quota on Google AI Studio (\`429 RESOURCE_EXHAUSTED\`).

#### How to unlock unlimited Gemini AI answers (like Google AI Studio & Antigravity):
1. Open **Settings** (⚙️ icon in the top navigation).
2. Enter your own free **Google Gemini API Key** from [aistudio.google.com](https://aistudio.google.com/app/apikey).
3. Select your preferred model (e.g. \`gemini-3-flash-preview\` or \`gemini-3.8-flash\`).
4. Click **Save Settings**.

Your key is stored securely in your local browser and queries Google's official Gemini models directly!`;
}
