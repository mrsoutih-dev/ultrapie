'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { TopBar } from '@/components/studio/TopBar';
import { FileExplorer } from '@/components/studio/FileExplorer';
import { AIChatPane } from '@/components/studio/AIChatPane';
import { PreviewSandbox } from '@/components/studio/PreviewSandbox';
import { SettingsModal } from '@/components/studio/SettingsModal';
import { GitHubDeployModal } from '@/components/studio/GitHubDeployModal';
import { CoolifyStudioDeployModal } from '@/components/studio/CoolifyStudioDeployModal';
import { EasyDeployModal } from '@/components/studio/EasyDeployModal';
import { TemplateGalleryModal } from '@/components/studio/TemplateGalleryModal';
import { StudioDatabaseModal } from '@/components/studio/StudioDatabaseModal';
import { exportProjectToZip } from '@/lib/studio/zip-export';
import { useStudioState } from '@/hooks/useStudioState';
import { useTheme } from '@/context/ThemeContext';
import { Code2, Eye, Split, FileCheck } from 'lucide-react';

// Dynamic Monaco editor import to prevent SSR hydration mismatches
const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center text-xs text-slate-500">
      Loading Monaco Editor...
    </div>
  ),
});

export default function StudioPage() {
  const {
    files,
    activeFile,
    setActiveFile,
    viewport,
    setViewport,
    isGenerating,
    liveStreamingFile,
    streamingLineCount,
    pendingPatches,
    messages,
    previewKey,
    geminiApiKey,
    geminiModel,
    saveSettings,
    updateFileContent,
    createFile,
    deleteFile,
    applyPendingPatches,
    rejectPendingPatches,
    resetStudio,
    loadTemplate,
    sendPrompt,
  } = useStudioState();

  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'split'>('split');
  const [isDeploying, setIsDeploying] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGitHubOpen, setIsGitHubOpen] = useState(false);
  const [isCoolifyOpen, setIsCoolifyOpen] = useState(false);
  const [isEasyDeployOpen, setIsEasyDeployOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isDatabaseOpen, setIsDatabaseOpen] = useState(false);

  const handleExportZip = async () => {
    await exportProjectToZip({
      projectName: 'Ultrapie App',
      files,
    });
  };

  const editorRef = React.useRef<any>(null);

  // Auto-scroll Monaco editor line-by-line while live code is streaming
  React.useEffect(() => {
    if (liveStreamingFile && editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        const lineCount = model.getLineCount();
        editorRef.current.revealLine(lineCount);
        editorRef.current.setPosition({
          lineNumber: lineCount,
          column: model.getLineMaxColumn(lineCount),
        });
      }
    }
  }, [files, liveStreamingFile, activeFile]);

  const getLanguage = (filename: string) => {
    if (filename.endsWith('.tsx') || filename.endsWith('.ts')) return 'typescript';
    if (filename.endsWith('.jsx') || filename.endsWith('.js')) return 'javascript';
    if (filename.endsWith('.css')) return 'css';
    if (filename.endsWith('.json')) return 'json';
    if (filename.endsWith('.html')) return 'html';
    return 'plaintext';
  };

  return (
    <div
      className={`h-screen w-screen flex flex-col overflow-hidden transition-colors duration-200 ${
        isLight ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'
      }`}
    >
      {/* 1. Global Studio Navigation */}
      <TopBar
        projectName="Untitled Web App"
        viewport={viewport}
        onViewportChange={setViewport}
        activeTab={activeTab}
        onActiveTabChange={setActiveTab}
        onDeploy={() => setIsEasyDeployOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenGitHub={() => setIsGitHubOpen(true)}
        onOpenCoolify={() => setIsCoolifyOpen(true)}
        onOpenEasyDeploy={() => setIsEasyDeployOpen(true)}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        onOpenDatabase={() => setIsDatabaseOpen(true)}
        onExportZip={handleExportZip}
        onResetStudio={resetStudio}
        isDeploying={isDeploying}
      />

      {/* 2. Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Leftmost: Dynamic Project File Explorer */}
        <FileExplorer
          files={files}
          activeFile={activeFile}
          onSelectFile={setActiveFile}
          onCreateFile={createFile}
          onDeleteFile={deleteFile}
        />

        {/* Center-Left: AI Vibe Coding Chat Pane */}
        <AIChatPane
          messages={messages}
          isGenerating={isGenerating}
          pendingPatches={pendingPatches}
          geminiModel={geminiModel}
          onSendPrompt={sendPrompt}
          onApplyPatches={applyPendingPatches}
          onRejectPatches={rejectPendingPatches}
        />

        {/* Center: Monaco Code Editor Pane */}
        {(activeTab === 'editor' || activeTab === 'split') && (
          <div
            className={`flex-1 flex flex-col h-full border-r transition-colors ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}
          >
            {/* Editor File Tab Header */}
            <div
              className={`h-10 border-b px-3 flex items-center justify-between text-xs select-none ${
                isLight ? 'border-slate-200 bg-slate-50 text-slate-800' : 'border-slate-800 bg-slate-950 text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 font-mono text-cyan-500">
                <Code2 className="h-4 w-4" />
                <span className="font-semibold">{activeFile || 'No file selected'}</span>
                {liveStreamingFile && (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-950/90 border border-cyan-800 text-[10px] text-cyan-300 font-sans shadow-inner">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                    <span>Live Coding Line {streamingLineCount || 1}...</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                {liveStreamingFile ? (
                  <span className="text-cyan-500 text-xs font-sans animate-pulse font-mono">
                    Writing line by line...
                  </span>
                ) : (
                  <>
                    <FileCheck className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Saved</span>
                  </>
                )}
              </div>
            </div>

            {/* Monaco Component */}
            <div className="flex-1 w-full h-full">
              {activeFile && files[activeFile] !== undefined ? (
                <Editor
                  height="100%"
                  language={getLanguage(activeFile)}
                  theme={isLight ? 'light' : 'vs-dark'}
                  value={files[activeFile]}
                  onMount={(editor) => {
                    editorRef.current = editor;
                  }}
                  onChange={(val) => updateFileContent(activeFile, val || '')}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    wordWrap: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                  }}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-500">
                  <Code2 className="h-10 w-10 text-slate-400 mb-2" />
                  <p className="text-xs font-medium text-slate-500">Workspace is empty</p>
                  <p className="text-[11px] text-slate-400 max-w-xs mt-1">
                    Describe your app in the AI chat to generate files, or click + in the file explorer.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Right: Live Preview Sandbox Pane */}
        {(activeTab === 'preview' || activeTab === 'split') && (
          <PreviewSandbox
            files={files}
            viewport={viewport}
            previewKey={previewKey}
            onSendPrompt={sendPrompt}
            isStreaming={Boolean(liveStreamingFile)}
            streamingLineCount={streamingLineCount}
            onOpenEasyDeploy={() => setIsEasyDeployOpen(true)}
          />
        )}
      </div>

      {/* 3. Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentApiKey={geminiApiKey}
        currentModel={geminiModel}
        onSave={saveSettings}
      />

      {/* 4. GitHub Deploy Modal */}
      <GitHubDeployModal
        isOpen={isGitHubOpen}
        onClose={() => setIsGitHubOpen(false)}
        files={files}
      />

      {/* 5. Coolify Deploy Modal */}
      <CoolifyStudioDeployModal
        isOpen={isCoolifyOpen}
        onClose={() => setIsCoolifyOpen(false)}
        files={files}
        projectName="Ultrapie App"
      />

      {/* 6. 1-Click Easy Deploy Modal */}
      <EasyDeployModal
        isOpen={isEasyDeployOpen}
        onClose={() => setIsEasyDeployOpen(false)}
        files={files}
        projectName="Ultrapie App"
      />

      {/* 7. Starter Template Gallery Modal */}
      <TemplateGalleryModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onSelectTemplate={(tplFiles, name) => loadTemplate(tplFiles, name)}
      />

      {/* 8. Live Database Explorer Modal */}
      <StudioDatabaseModal
        isOpen={isDatabaseOpen}
        onClose={() => setIsDatabaseOpen(false)}
        onSendPrompt={sendPrompt}
      />
    </div>
  );
}
