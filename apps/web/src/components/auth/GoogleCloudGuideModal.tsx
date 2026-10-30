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
  Info,
} from 'lucide-react';

export function GoogleCloudGuideModal() {
  const { isGoogleGuideOpen, closeGoogleGuide } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [copiedStep, setCopiedStep] = useState<number | null>(null);
  const [jsonInput, setJsonInput] = useState('');
  const [parseStatus, setParseStatus] = useState<string | null>(null);
  const [parsedCreds, setParsedCreds] = useState<{ clientId: string; clientSecret?: string } | null>(null);

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
        setParseStatus('Invalid JSON: missing "client_id" in provided Google OAuth JSON.');
        setParsedCreds(null);
        return;
      }

      setParsedCreds({ clientId, clientSecret });
      setParseStatus(`Client ID: ${clientId.substring(0, 22)}... parsed successfully! Add the environment snippet below to your .env to enable real Google Login.`);
    } catch (err: any) {
      setParseStatus('Error parsing JSON: ' + err.message);
      setParsedCreds(null);
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
                How to configure genuine Google OAuth for Ultrapie & all subdomains
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
          {/* Notice */}
          <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-800/60 text-cyan-200 flex items-start gap-2.5">
            <Info className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-xs block">Production OAuth Note:</span>
              <p className="text-[11px] text-cyan-300/90 leading-relaxed">
                Google Login requires your Google Cloud OAuth Client ID & Secret. If you haven't set up Google OAuth yet, users can sign up and log in using regular <strong>Email & Password</strong> right now!
              </p>
            </div>
          </div>

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
                Select your existing project or click <strong>New Project</strong> (e.g. <em>Ultrapie Platform</em>).
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
                
                <div className="pt-2">
                  <div className="text-slate-400 font-sans font-bold text-[10px] uppercase">Authorized JavaScript origins:</div>
                  <div className="space-y-1 mt-1">
                    {['https://www.ultrapie.com', 'https://ultrapie.com', 'https://studio.ultrapie.com', 'http://localhost:3005'].map((uri, idx) => (
                      <div key={uri} className="flex items-center justify-between text-[10px]">
                        <code>{uri}</code>
                        <button
                          type="button"
                          onClick={() => handleCopy(uri, 10 + idx)}
                          className="text-cyan-500 hover:text-cyan-400"
                        >
                          {copiedStep === 10 + idx ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <div className="text-slate-400 font-sans font-bold text-[10px] uppercase">Authorized redirect URIs:</div>
                  <div className="space-y-1 mt-1">
                    {['https://www.ultrapie.com/api/auth/callback/google', 'https://ultrapie.com/api/auth/callback/google', 'http://localhost:3005/api/auth/callback/google'].map((uri, idx) => (
                      <div key={uri} className="flex items-center justify-between text-[10px]">
                        <code>{uri}</code>
                        <button
                          type="button"
                          onClick={() => handleCopy(uri, 20 + idx)}
                          className="text-cyan-500 hover:text-cyan-400"
                        >
                          {copiedStep === 20 + idx ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4: Paste Client JSON */}
          <div className="flex gap-4">
            <div className="h-6 w-6 rounded-full bg-cyan-500 text-slate-950 font-bold flex items-center justify-center shrink-0 text-[11px]">
              4
            </div>
            <div className="space-y-3 flex-1">
              <span className="font-bold text-sm">Download JSON & Paste Here</span>
              <p className={isLight ? 'text-slate-600' : 'text-slate-400'}>
                After clicking <strong>Create</strong>, download the client JSON file and paste its contents below:
              </p>

              <textarea
                rows={4}
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder='{"web":{"client_id":"...","client_secret":"..."}}'
                className={`w-full p-3 font-mono text-[11px] rounded-xl border focus:outline-none focus:border-cyan-500 ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    : 'bg-slate-950 border-slate-800 text-slate-200 placeholder-slate-600'
                }`}
              />

              <button
                type="button"
                onClick={handleApplyJson}
                disabled={!jsonInput.trim()}
                className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:brightness-110 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Parse Google OAuth JSON</span>
              </button>

              {parseStatus && (
                <div
                  className={`p-3 rounded-xl border text-xs font-semibold ${
                    parsedCreds
                      ? 'bg-emerald-950/60 border-emerald-800 text-emerald-200'
                      : 'bg-red-950/60 border-red-800 text-red-200'
                  }`}
                >
                  {parseStatus}
                </div>
              )}

              {parsedCreds && (
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="font-bold text-xs text-slate-200 block">Copy & Paste into .env:</span>
                  <div className="p-2.5 rounded-lg bg-slate-900 font-mono text-[10px] text-cyan-300 space-y-1">
                    <div>GOOGLE_CLIENT_ID="{parsedCreds.clientId}"</div>
                    {parsedCreds.clientSecret && <div>GOOGLE_CLIENT_SECRET="{parsedCreds.clientSecret}"</div>}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const snippet = `GOOGLE_CLIENT_ID="${parsedCreds.clientId}"\n${
                        parsedCreds.clientSecret ? `GOOGLE_CLIENT_SECRET="${parsedCreds.clientSecret}"` : ''
                      }`;
                      handleCopy(snippet, 99);
                    }}
                    className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    {copiedStep === 99 ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>Copy .env snippet</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
