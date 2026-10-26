'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Terminal,
  Code2,
  Globe,
  Cpu,
  ShieldCheck,
  ArrowRight,
  Server,
  Zap,
  Crown,
  Building,
  Check,
  User,
  CreditCard,
  Sun,
  Moon,
  Shield,
  LayoutDashboard,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

export default function Home() {
  const { user, isAdmin, openAuthModal, openSubscriptionModal, openAdminModal, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  return (
    <div
      className={`flex flex-col min-h-screen transition-colors duration-200 ${
        isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#090d16] text-slate-100'
      }`}
    >
      {/* Header */}
      <header
        className={`border-b sticky top-0 z-50 backdrop-blur transition-colors ${
          isLight
            ? 'border-slate-200/80 bg-white/80 shadow-sm'
            : 'border-slate-800/80 bg-slate-950/60'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className={`font-bold text-xl tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              ultrapie
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/90 text-cyan-400 border border-cyan-800/80 font-mono font-semibold">
              Gemini 3 Powered
            </span>
          </div>

          <nav className="flex items-center gap-3">
            {/* White / Dark Theme Switcher Button */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl border transition-all ${
                isLight
                  ? 'bg-slate-100 border-slate-300 text-amber-600 hover:bg-slate-200'
                  : 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800'
              }`}
              title={isLight ? 'Switch to Dark Mode' : 'Switch to White / Light Mode'}
            >
              {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>

            <a
              href="#pricing"
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
              }`}
            >
              Pricing & Plans
            </a>

            <Link
              href="/hosting"
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 shadow-sm ${
                isLight
                  ? 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'
                  : 'bg-slate-900 border-purple-800/60 text-purple-400 hover:text-purple-300'
              }`}
            >
              <Server className="h-3.5 w-3.5 text-purple-500" />
              <span>Coolify Hosting</span>
            </Link>

            <Link
              href="/chatbot"
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 shadow-sm ${
                isLight
                  ? 'bg-slate-100 border-slate-300 text-cyan-700 hover:bg-slate-200'
                  : 'bg-slate-900 border-slate-700/80 text-cyan-400 hover:text-cyan-300'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>AI Chatbot</span>
            </Link>

            {/* Master Owner Admin Button */}
            {isAdmin && (
              <button
                onClick={openAdminModal}
                className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 shadow-md shadow-amber-500/20 hover:brightness-110 transition-all flex items-center gap-1.5"
                title="Open Master Owner Admin Portal"
              >
                <Crown className="h-3.5 w-3.5 fill-current" />
                <span>Admin Hub</span>
              </button>
            )}

            {user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={openSubscriptionModal}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-colors flex items-center gap-1.5 ${
                    isLight
                      ? 'bg-slate-100 border-cyan-400 text-cyan-700'
                      : 'bg-slate-900 border-cyan-800/80 text-cyan-400'
                  }`}
                >
                  <Crown className="h-3.5 w-3.5" />
                  <span>{user.isSubscribed ? `${user.plan} Active` : 'Subscribe Monthly'}</span>
                </button>
                <Link
                  href="/studio"
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:brightness-110 text-white transition-all flex items-center gap-1.5 shadow-lg shadow-blue-500/25"
                >
                  <span>Open Studio</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <button
                  onClick={logout}
                  className={`p-2 text-xs rounded-xl border transition-colors ${
                    isLight
                      ? 'bg-slate-100 border-slate-300 text-slate-500 hover:text-rose-600 hover:bg-slate-200'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-800'
                  }`}
                  title={`Logged in as ${user.name} (${user.email}). Click to Sign Out.`}
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAuthModal('login')}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-xl border transition-colors ${
                    isLight
                      ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => openAuthModal('register')}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white shadow-md shadow-blue-500/20 transition-all"
                >
                  Register
                </button>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-20 flex flex-col items-center text-center">
        <div
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs mb-8 shadow-inner border ${
            isLight
              ? 'bg-cyan-50 border-cyan-200 text-cyan-800'
              : 'bg-slate-900/90 border-cyan-900/60 text-cyan-400'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5 text-cyan-500 animate-spin" />
          <span>Google AI Studio Experience &bull; Antigravity Live Coding &bull; Zero Configuration</span>
        </div>

        <h1
          className={`text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl leading-tight ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}
        >
          Describe the app. <br />
          <span className="bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Build, edit, and ship
          </span>{' '}
          in seconds.
        </h1>

        <p
          className={`mt-6 text-base md:text-lg max-w-2xl leading-relaxed ${
            isLight ? 'text-slate-600' : 'text-slate-400'
          }`}
        >
          Ultrapie turns natural language into production-grade multi-file applications with an in-browser live studio, line-by-line Monaco streaming, and 1-click hosting to Coolify & Cloudflare Tunnels.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="/studio"
            className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:brightness-110 text-white font-bold text-sm shadow-xl shadow-blue-500/25 transition-all flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            <span>Launch AI Studio Live</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <button
            onClick={openSubscriptionModal}
            className={`px-6 py-3.5 rounded-2xl border font-semibold text-sm transition-all flex items-center gap-2 ${
              isLight
                ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800 shadow-sm'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-200'
            }`}
          >
            <CreditCard className="h-4 w-4 text-cyan-500" />
            <span>View Monthly Plans (From $19/mo)</span>
          </button>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          <div
            className={`p-6 rounded-2xl border transition-all ${
              isLight
                ? 'bg-white border-slate-200 hover:border-cyan-400 shadow-sm'
                : 'bg-slate-900/60 border-slate-800 hover:border-cyan-500/50'
            }`}
          >
            <div className="h-10 w-10 rounded-xl bg-cyan-950 border border-cyan-800/60 flex items-center justify-center text-cyan-400 mb-4">
              <Cpu className="h-5 w-5" />
            </div>
            <h3 className={`text-base font-bold mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Gemini 3-First AI Gateway
            </h3>
            <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Multi-file generation, streaming diffs, and structured patch management with automated validation and repair loops.
            </p>
          </div>

          <div
            className={`p-6 rounded-2xl border transition-all ${
              isLight
                ? 'bg-white border-slate-200 hover:border-blue-400 shadow-sm'
                : 'bg-slate-900/60 border-slate-800 hover:border-blue-500/50'
            }`}
          >
            <div className="h-10 w-10 rounded-xl bg-blue-950 border border-blue-800/60 flex items-center justify-center text-blue-400 mb-4">
              <Code2 className="h-5 w-5" />
            </div>
            <h3 className={`text-base font-bold mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Google AI Studio Experience
            </h3>
            <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Monaco-powered editing, interactive previews, automated GitHub synchronization, and zero-reload in-memory compiler.
            </p>
          </div>

          <div
            className={`p-6 rounded-2xl border transition-all ${
              isLight
                ? 'bg-white border-slate-200 hover:border-indigo-400 shadow-sm'
                : 'bg-slate-900/60 border-slate-800 hover:border-indigo-500/50'
            }`}
          >
            <div className="h-10 w-10 rounded-xl bg-indigo-950 border border-indigo-800/60 flex items-center justify-center text-indigo-400 mb-4">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className={`text-base font-bold mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              1-Click Global Deployment
            </h3>
            <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Zero-config self-hosting on your Coolify VPS or global Cloudflare Tunnels (ultrapie.com) with automated HTTPS.
            </p>
          </div>
        </div>

        {/* Pricing & Monthly Subscription Section */}
        <div id="pricing" className="mt-28 w-full">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400 text-xs font-semibold">
              <Crown className="h-3.5 w-3.5" />
              <span>Simple, Transparent Pricing</span>
            </div>
            <h2 className={`text-3xl md:text-4xl font-extrabold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Monthly Subscription Plans
            </h2>
            <p className={`text-sm ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Anyone wanting to use Ultrapie can register an account and choose a monthly subscription to build and deploy without limits.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {/* Starter Plan */}
            <div
              className={`rounded-3xl p-8 border flex flex-col justify-between transition-all ${
                isLight ? 'bg-white border-slate-200 shadow-sm hover:border-slate-300' : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="h-10 w-10 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div className="text-right">
                    <span className={`text-3xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>$19</span>
                    <span className="text-xs text-slate-400">/mo</span>
                  </div>
                </div>
                <h3 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Starter</h3>
                <p className="text-xs text-slate-400 mt-1 mb-6">Great for individual developers building prototypes.</p>
                <div className={`space-y-3 border-t pt-6 ${isLight ? 'border-slate-100' : 'border-slate-800'}`}>
                  <div className="flex items-center gap-2 text-xs">
                    <Check className="h-4 w-4 text-cyan-400 shrink-0" />
                    <span>50 AI App Generations / mo</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Check className="h-4 w-4 text-cyan-400 shrink-0" />
                    <span>Google AI Studio Monaco IDE</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Check className="h-4 w-4 text-cyan-400 shrink-0" />
                    <span>In-Browser Live React Sandbox</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Check className="h-4 w-4 text-cyan-400 shrink-0" />
                    <span>Deploy to 1 Custom Domain</span>
                  </div>
                </div>
              </div>

              <button
                onClick={openSubscriptionModal}
                className={`mt-8 w-full py-3 rounded-xl border text-xs font-bold transition-all ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-white'
                }`}
              >
                Subscribe Monthly ($19)
              </button>
            </div>

            {/* Pro Unlimited Plan */}
            <div
              className={`rounded-3xl p-8 border-2 flex flex-col justify-between relative shadow-2xl transition-all ${
                isLight
                  ? 'bg-white border-cyan-500 shadow-cyan-500/10'
                  : 'bg-slate-900 border-cyan-500 shadow-cyan-500/15'
              }`}
            >
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[10px] font-black uppercase tracking-wider shadow-md">
                Most Popular
              </div>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="h-10 w-10 rounded-xl bg-cyan-950 text-cyan-400 flex items-center justify-center">
                    <Crown className="h-5 w-5" />
                  </div>
                  <div className="text-right">
                    <span className={`text-3xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>$49</span>
                    <span className="text-xs text-slate-400">/mo</span>
                  </div>
                </div>
                <h3 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Pro Unlimited</h3>
                <p className="text-xs text-slate-400 mt-1 mb-6">For power creators and teams launching production apps.</p>
                <div className={`space-y-3 border-t pt-6 ${isLight ? 'border-slate-100' : 'border-slate-800'}`}>
                  <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
                    <Check className="h-4 w-4 shrink-0" />
                    <span>Unlimited AI Generations (Gemini 3 Flash)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Check className="h-4 w-4 text-cyan-400 shrink-0" />
                    <span>1-Click Coolify VPS Deployment</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Check className="h-4 w-4 text-cyan-400 shrink-0" />
                    <span>Automated GitHub Sync & Webhooks</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Check className="h-4 w-4 text-cyan-400 shrink-0" />
                    <span>Unlimited Cloudflare Custom Domains</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Check className="h-4 w-4 text-cyan-400 shrink-0" />
                    <span>Priority Response Line Pacing</span>
                  </div>
                </div>
              </div>

              <button
                onClick={openSubscriptionModal}
                className="mt-8 w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:brightness-110 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition-all"
              >
                Subscribe Monthly ($49)
              </button>
            </div>

            {/* Business Enterprise Plan */}
            <div
              className={`rounded-3xl p-8 border flex flex-col justify-between transition-all ${
                isLight ? 'bg-white border-slate-200 shadow-sm hover:border-slate-300' : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="h-10 w-10 rounded-xl bg-purple-950 text-purple-400 flex items-center justify-center">
                    <Building className="h-5 w-5" />
                  </div>
                  <div className="text-right">
                    <span className={`text-3xl font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>$99</span>
                    <span className="text-xs text-slate-400">/mo</span>
                  </div>
                </div>
                <h3 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Enterprise VPS</h3>
                <p className="text-xs text-slate-400 mt-1 mb-6">Dedicated server environments with custom model finetuning.</p>
                <div className={`space-y-3 border-t pt-6 ${isLight ? 'border-slate-100' : 'border-slate-800'}`}>
                  <div className="flex items-center gap-2 text-xs">
                    <Check className="h-4 w-4 text-purple-400 shrink-0" />
                    <span>Dedicated Coolify Isolated Instance</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Check className="h-4 w-4 text-purple-400 shrink-0" />
                    <span>Custom API Keys & Anthropic Claude 3.7</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Check className="h-4 w-4 text-purple-400 shrink-0" />
                    <span>24/7 Monitoring & Automated Backups</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Check className="h-4 w-4 text-purple-400 shrink-0" />
                    <span>Dedicated VIP Support</span>
                  </div>
                </div>
              </div>

              <button
                onClick={openSubscriptionModal}
                className={`mt-8 w-full py-3 rounded-xl border text-xs font-bold transition-all ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-white'
                }`}
              >
                Subscribe Monthly ($99)
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        className={`border-t py-8 transition-colors ${
          isLight ? 'border-slate-200 bg-white text-slate-500' : 'border-slate-800/80 bg-slate-950 text-slate-500'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between text-xs gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">Ultrapie Cloud</span>
            <span>&bull;</span>
            <span>WSL Self-Hosted Edition</span>
          </div>
          <div>&copy; 2026 Ultrapie Platform. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
