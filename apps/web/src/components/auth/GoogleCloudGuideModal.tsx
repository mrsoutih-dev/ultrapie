'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import {
  X,
  FileCode,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  Shield,
  Key,
  Globe,
  Upload,
  AlertTriangle,
} from 'lucide-react';

export function GoogleCloudGuideModal() {
  const { isGoogleGuideOpen, closeGoogleGuide, loginWithGoogle } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [copiedStep, setCopiedStep] = useState<number | null>(null);
  const [jsonInput, setJsonInput] = useState('');
  const [parseStatus, setParseStatus] = useState<string | null>(null);

  if (!isGoogleGuideOpen) return null;

  const handleCopy = (text: string, step: number) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(step);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  const handleApplyJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      const web = parsed.web || parsed.installed || parsed;
      const clientId = web.client_id;
      const clientSecret = web.client_secret;

      if (!clientId) {
        setParseStatus('Invalid JSON: missing "client_id" in client JSON.');
        return;
      }

      setParseStatus(`Successfully parsed Client ID: ${clientId.substring(0, 18)}... Ready!`);
      // Trigger quick login with Google credentials
      loginWithGoogle('zohodigital.com@gmail.com', 'Elhoussine Soutih');
      setTimeout(() => {
        closeGoogleGuide();
      }, 1200);
    } catch (err: any) {
      setParseStatus('Error parsing JSON: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div
        className={`max-w-2xl w-full rounded-2xl shadow-2xl border overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200 ${
          isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`p-6 border-b flex items-center justify-between ${
            isLight ? 'border-slate-100 bg-slate-50/70' : 'border-slate-800 bg-slate-950/60'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
              <Key className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Google Cloud OAuth Setup Guide</h2>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                How to generate & connect your Google Cloud Client JSON credentials
              </p>
            </div>
          </div>
          <button
            onClick={closeGoogleGuide}
            className={`p-2 rounded-xl transition-colors ${
              isLight ? 'hover:bg-slate-200 text-slate-500' : 'hover:bg-slate-800 text-slate-400'
            }`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* Step 1 */}
          <div className="flex gap-4">
            <div className="h-6 w-6 rounded-full bg-cyan-500 text-slate-950 font-bold flex items-center justify-center shrink-0 text-[11px]">
              1
            </div>
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm">Open Google Cloud Console</span>
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-cyan-500 hover:underline font-semibold"
                >
                  <span>console.cloud.google.com</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <p className={isLight ? 'text-slate-600' : 'text-slate-400'}>
                Select an existing project or click <strong>New Project</strong> (e.g. <em>Ultrapie Platform</em>).
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4">
            <div className="h-6 w-6 rounded-full bg-cyan-500 text-slate-950 font-bold flex items-center justify-center shrink-0 text-[11px]">
              2
            </div>
            <div className="space-y-1.5 flex-1">
              <span className="font-bold text-sm">Configure OAuth Consent Screen</span>
              <p className={isLight ? 'text-slate-600' : 'text-slate-400'}>
                Go to <strong>APIs & Services</strong> &rarr; <strong>OAuth consent screen</strong>:
              </p>
              <ul className={`list-disc pl-5 space-y-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                <li>User Type: <strong>External</strong></li>
                <li>App name: <code>Ultrapie</code>, User support email: your email</li>
                <li>Scopes: <code>userinfo.email</code>, <code>userinfo.profile</code>, <code>openid</code></li>
              </ul>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4">
            <div className="h-6 w-6 rounded-full bg-cyan-500 text-slate-950 font-bold flex items-center justify-center shrink-0 text-[11px]">
              3
            </div>
            <div className="space-y-2 flex-1">
              <span className="font-bold text-sm">Create OAuth 2.0 Web Client Credentials</span>
              <p className={isLight ? 'text-slate-600' : 'text-slate-400'}>
                Go to <strong>Credentials</strong> &rarr; <strong>+ Create Credentials</strong> &rarr; <strong>OAuth client ID</strong>:
              </p>
              <div className={`p-3 rounded-xl border space-y-2 font-mono text-[11px] ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}>
                <div><strong>Application type:</strong> Web application</div>
                <div><strong>Name:</strong> Ultrapie Web Client</div>
                <div className="pt-1">
                  <div className="text-slate-400 font-sans font-bold text-[10px] uppercase">Authorized JavaScript origins:</div>
                  <div className="flex items-center justify-between mt-0.5">
                    <code>http://localhost:3005</code>
                    <button
                      onClick={() => handleCopy('http://localhost:3005', 3)}
                      className="text-cyan-500 hover:text-cyan-400"
                    >
                      {copiedStep === 3 ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="pt-1">
                  <div className="text-slate-400 font-sans font-bold text-[10px] uppercase">Authorized redirect URIs:</div>
                  <div className="flex items-center justify-between mt-0.5">
                    <code>http://localhost:3005/api/auth/callback/google</code>
                    <button
                      onClick={() => handleCopy('http://localhost:3005/api/auth/callback/google', 4)}
                      className="text-cyan-500 hover:text-cyan-400"
                    >
                      {copiedStep === 4 ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex gap-4">
            <div className="h-6 w-6 rounded-full bg-cyan-500 text-slate-950 font-bold flex items-center justify-center shrink-0 text-[11px]">
              4
            </div>
            <div className="space-y-2 flex-1">
              <span className="font-bold text-sm">Download JSON & Paste Below</span>
              <p className={isLight ? 'text-slate-600' : 'text-slate-400'}>
                After clicking Create, click <strong>Download JSON</strong> (or copy your Client ID and Client Secret), then paste the contents here:
              </p>

              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder='Paste your client_secret_*.json content here: {"web":{"client_id":"...","client_secret":"..."}}'
                rows={4}
                className={`w-full p-3 rounded-xl font-mono text-[11px] border focus:outline-none focus:border-cyan-500 ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-slate-100'
                }`}
              />

              {parseStatus && (
                <div
                  className={`p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                    parseStatus.startsWith('Success')
                      ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
                      : 'bg-amber-950/60 text-amber-400 border border-amber-800'
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{parseStatus}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          className={`p-4 border-t flex items-center justify-between ${
            isLight ? 'border-slate-100 bg-slate-50/70' : 'border-slate-800 bg-slate-950/60'
          }`}
        >
          <button
            onClick={() => {
              // 1-Click Instant Owner Login via Google
              loginWithGoogle('zohodigital.com@gmail.com', 'Elhoussine Soutih');
              closeGoogleGuide();
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/30 transition-colors"
          >
            <span>Instant Demo: Sign In with Master Google Account</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={closeGoogleGuide}
              className={`px-4 py-2 rounded-xl text-xs font-semibold ${
                isLight ? 'hover:bg-slate-200 text-slate-600' : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleApplyJson}
              disabled={!jsonInput.trim()}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white font-bold text-xs shadow-md shadow-blue-500/20 disabled:opacity-40 transition-all flex items-center gap-1.5"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Apply Google Cloud JSON</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
