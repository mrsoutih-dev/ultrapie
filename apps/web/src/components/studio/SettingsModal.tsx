'use client';

import React, { useState } from 'react';
import { KeyRound, Check, X, Sliders, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentApiKey: string;
  currentModel: string;
  onSave: (apiKey: string, model: string) => void;
}

const AVAILABLE_MODELS = [
  { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash Lite (Fast & Active Free Quota)' },
  { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite (High Speed & Reliability)' },
  { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash (Official Flagship Flash)' },
  { id: 'gemini-flash-lite-latest', name: 'Gemini Flash Lite Latest' },
  { id: 'gemma-4-26b-a4b-it', name: 'Gemma 4 26B Instruct (Open Model)' },
  { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash' },
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash Preview' },
];

export function SettingsModal({
  isOpen,
  onClose,
  currentApiKey,
  currentModel,
  onSave,
}: SettingsModalProps) {
  const [apiKey, setApiKey] = useState(currentApiKey);
  const [model, setModel] = useState(currentModel || 'gemini-3.5-flash-lite');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', content: 'Ping' }],
          model,
          apiKey: apiKey.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      setTestResult({
        success: true,
        message: 'Connection successful! Gemini API is active and responding.',
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Failed to connect. Please check the API key.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    onSave(apiKey.trim(), model);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="h-14 border-b border-slate-800 px-5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <KeyRound className="h-4 w-4 text-cyan-400" />
            <span>AI & Gemini Settings</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 text-xs">
          {/* API Key Input */}
          <div className="flex flex-col gap-2">
            <label className="text-slate-300 font-semibold flex items-center justify-between">
              <span>Google Gemini API Key</span>
              <span className="text-[11px] text-slate-500 font-normal">Stored in local browser</span>
            </label>
            <input
              type="password"
              placeholder="Enter your Gemini API key (e.g. AIzaSy...)"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl text-slate-100 font-mono text-xs outline-none transition-colors"
            />
            <p className="text-[11px] text-slate-500">
              Leave empty to use the platform default key, or enter your personal Gemini API key.
            </p>
          </div>

          {/* Model Selector */}
          <div className="flex flex-col gap-2">
            <label className="text-slate-300 font-semibold">Gemini Model</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl text-slate-200 text-xs outline-none cursor-pointer"
            >
              {AVAILABLE_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Connection Test Result */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                testResult.success
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <span className="text-[11px] leading-relaxed">{testResult.message}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-800 bg-slate-950/80 px-5 py-3 flex items-center justify-between">
          <button
            onClick={handleTestConnection}
            disabled={isTesting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors disabled:opacity-50"
          >
            {isTesting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-400" />
                <span>Testing...</span>
              </>
            ) : (
              <span>Test Connection</span>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 transition-all"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Save Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
