'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Monitor,
  Tablet,
  Smartphone,
  Play,
  GitBranch,
  ArrowUpRight,
  Sparkles,
  Layers,
  Save,
  Settings,
  Server,
  RotateCcw,
  Rocket,
  User,
  Crown,
  LogOut,
  CreditCard,
  ChevronDown,
  Eye,
  Split,
  Code2,
  Sun,
  Moon,
  ShieldAlert,
  ShieldCheck,
  LayoutDashboard,
  Download,
} from 'lucide-react';
import { ViewportMode } from '@/hooks/useStudioState';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

interface TopBarProps {
  projectName: string;
  viewport: ViewportMode;
  onViewportChange: (vp: ViewportMode) => void;
  activeTab?: 'editor' | 'preview' | 'split';
  onActiveTabChange?: (tab: 'editor' | 'preview' | 'split') => void;
  onDeploy: () => void;
  onOpenSettings?: () => void;
  onOpenGitHub?: () => void;
  onOpenCoolify?: () => void;
  onOpenEasyDeploy?: () => void;
  onOpenTemplates?: () => void;
  onExportZip?: () => void;
  onResetStudio?: () => void;
  isDeploying?: boolean;
}

export function TopBar({
  projectName,
  viewport,
  onViewportChange,
  activeTab,
  onActiveTabChange,
  onDeploy,
  onOpenSettings,
  onOpenGitHub,
  onOpenCoolify,
  onOpenEasyDeploy,
  onOpenTemplates,
  onExportZip,
  onResetStudio,
  isDeploying,
}: TopBarProps) {
  const { user, isAdmin, openAuthModal, openSubscriptionModal, openAdminModal, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  return (
    <header
      className={`h-14 border-b px-4 flex items-center justify-between select-none transition-colors duration-200 ${
        isLight
          ? 'bg-white border-slate-200 text-slate-800 shadow-sm'
          : 'bg-slate-950 border-slate-800 text-slate-100'
      }`}
    >
      {/* Left: Branding & Project Title */}
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">ultrapie</span>
        </Link>
        <span className={isLight ? 'text-slate-300' : 'text-slate-600'}>/</span>
        <div className="flex items-center gap-2 text-sm font-medium">
          <Layers className={`h-4 w-4 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
          <span className={isLight ? 'text-slate-900' : 'text-slate-300'}>{projectName}</span>
          <span className="text-xs px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 font-mono flex items-center gap-1">
            <Sparkles className="h-2.5 w-2.5" />
            <span>AI Studio</span>
          </span>
          {onResetStudio && (
            <button
              onClick={onResetStudio}
              className={`p-1 rounded transition-colors ml-1 ${
                isLight ? 'hover:bg-slate-100 text-slate-400 hover:text-slate-700' : 'hover:bg-slate-800 text-slate-500 hover:text-slate-300'
              }`}
              title="Reset to Empty Studio"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Middle: Studio View Mode & Viewport Switcher */}
      <div className="flex items-center gap-3">
        {onActiveTabChange && (
          <div
            className={`flex items-center gap-1 p-1 rounded-xl border shadow-inner ${
              isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}
          >
            <button
              onClick={() => onActiveTabChange('preview')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'preview'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Full Preview"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Preview</span>
            </button>
            <button
              onClick={() => onActiveTabChange('split')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'split'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Split Code & Preview"
            >
              <Split className="h-3.5 w-3.5" />
              <span>Split</span>
            </button>
            <button
              onClick={() => onActiveTabChange('editor')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'editor'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Full Code Editor"
            >
              <Code2 className="h-3.5 w-3.5" />
              <span>Code</span>
            </button>
          </div>
        )}

        {/* Viewport Selector */}
        <div
          className={`flex items-center gap-1 p-1 rounded-xl border shadow-inner ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}
        >
          <button
            onClick={() => onViewportChange('desktop')}
            className={`p-1.5 rounded-lg transition-colors ${
              viewport === 'desktop'
                ? isLight
                  ? 'bg-white text-cyan-600 shadow-sm'
                  : 'bg-slate-800 text-cyan-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-900'
            }`}
            title="Desktop View (100%)"
          >
            <Monitor className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onViewportChange('tablet')}
            className={`p-1.5 rounded-lg transition-colors ${
              viewport === 'tablet'
                ? isLight
                  ? 'bg-white text-cyan-600 shadow-sm'
                  : 'bg-slate-800 text-cyan-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-900'
            }`}
            title="Tablet View (768px)"
          >
            <Tablet className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onViewportChange('mobile')}
            className={`p-1.5 rounded-lg transition-colors ${
              viewport === 'mobile'
                ? isLight
                  ? 'bg-white text-cyan-600 shadow-sm'
                  : 'bg-slate-800 text-cyan-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-900'
            }`}
            title="Mobile View (375px)"
          >
            <Smartphone className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Right: Actions, Theme Switcher & User Account */}
      <div className="flex items-center gap-2">
        {/* White / Dark Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-xl border transition-all ${
            isLight
              ? 'bg-slate-100 border-slate-300 text-amber-600 hover:bg-slate-200'
              : 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800'
          }`}
          title={isLight ? 'Switch to Dark Mode' : 'Switch to White / Light Mode'}
        >
          {isLight ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
        </button>

        {/* Dedicated Admin Control Button (Visible to Master Owner / Admin) */}
        {isAdmin && (
          <button
            onClick={openAdminModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 shadow-md shadow-amber-500/20 hover:brightness-110 transition-all"
            title="Open Master Owner Admin Control Center"
          >
            <Crown className="h-3.5 w-3.5 fill-current" />
            <span>Admin Hub</span>
          </button>
        )}

        {/* Starter Templates Gallery */}
        {onOpenTemplates && (
          <button
            onClick={onOpenTemplates}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border transition-colors ${
              isLight
                ? 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'
                : 'bg-slate-900 border-purple-800/70 text-purple-300 hover:bg-slate-800'
            }`}
            title="Browse and fork starter templates"
          >
            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            <span>Templates</span>
          </button>
        )}

        {/* 1-Click Project ZIP Export */}
        {onExportZip && (
          <button
            onClick={onExportZip}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border transition-colors ${
              isLight
                ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
            title="Download complete runnable project as .ZIP"
          >
            <Download className="h-3.5 w-3.5 text-emerald-400" />
            <span>Export</span>
          </button>
        )}

        {onOpenEasyDeploy && (
          <button
            onClick={onOpenEasyDeploy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:brightness-110 text-white shadow-lg shadow-emerald-500/25 transition-all"
            title="1-Click Easy Deploy to Production"
          >
            <Rocket className="h-3.5 w-3.5 text-white" />
            <span>Easy Deploy</span>
          </button>
        )}

        {onOpenGitHub && (
          <button
            onClick={onOpenGitHub}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border transition-colors ${
              isLight
                ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
            title="Connect and push to GitHub repository"
          >
            <GitBranch className="h-3.5 w-3.5 text-cyan-400" />
            <span>GitHub</span>
          </button>
        )}

        <button
          onClick={onOpenCoolify}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border transition-colors ${
            isLight
              ? 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'
              : 'bg-slate-900 border-purple-800/70 text-purple-300 hover:bg-slate-800'
          }`}
          title="Deploy project to your Coolify Server"
        >
          <Server className="h-3.5 w-3.5 text-purple-500" />
          <span>Coolify VPS</span>
        </button>

        <button
          onClick={onOpenSettings}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border transition-colors ${
            isLight
              ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
              : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
          }`}
          title="AI & API Settings"
        >
          <Settings className="h-3.5 w-3.5 text-cyan-500" />
          <span>Settings</span>
        </button>

        {/* User Account / Profile or Sign In / Register Buttons */}
        {user ? (
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs transition-all ${
                isLight
                  ? 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'
                  : 'bg-slate-900 border-slate-800 text-white hover:border-slate-700'
              }`}
            >
              <div className="h-5 w-5 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
                {user.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <span className="max-w-[120px] truncate font-medium">{user.email}</span>
              {user.isSubscribed ? (
                <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold flex items-center gap-1">
                  <Crown className="h-2.5 w-2.5" />
                  <span>{user.plan || 'PRO'}</span>
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800 text-[10px] font-bold">
                  Unpaid
                </span>
              )}
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div
                className={`absolute right-0 mt-2 w-64 rounded-2xl border shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 ${
                  isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-100'
                }`}
              >
                <div className={`p-3 border-b ${isLight ? 'border-slate-100' : 'border-slate-800'}`}>
                  <div className="font-bold text-xs truncate">{user.name || user.email}</div>
                  <div className="text-[11px] text-slate-500 truncate">{user.email}</div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[10px] text-slate-400">Plan:</span>
                    <span className="text-[11px] font-bold text-cyan-500">
                      {user.isSubscribed ? `${user.plan || 'PRO'} ($49/mo)` : 'Subscription Inactive'}
                    </span>
                  </div>
                </div>

                <div className="py-1 space-y-1">
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        openAdminModal();
                      }}
                      className={`w-full px-3 py-2 text-left text-xs rounded-lg flex items-center gap-2 font-bold ${
                        isLight
                          ? 'text-amber-700 hover:bg-amber-50'
                          : 'text-amber-400 hover:bg-amber-950/30'
                      }`}
                    >
                      <Crown className="h-3.5 w-3.5 fill-current" />
                      <span>Owner Admin Panel</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      openSubscriptionModal();
                    }}
                    className={`w-full px-3 py-2 text-left text-xs rounded-lg flex items-center gap-2 transition-colors ${
                      isLight
                        ? 'text-slate-700 hover:bg-slate-100'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <CreditCard className="h-3.5 w-3.5 text-cyan-500" />
                    <span>{user.isSubscribed ? 'Manage Monthly Plan' : 'Subscribe Monthly ($19 / $49)'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full px-3 py-2 text-left text-xs text-red-500 hover:bg-red-500/10 rounded-lg flex items-center gap-2 transition-colors font-medium"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
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
      </div>
    </header>
  );
}
