'use client';

import React, { useState } from 'react';
import {
  FileCode2,
  FileJson,
  FileText,
  FilePlus,
  Trash2,
  FolderOpen,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';

interface FileExplorerProps {
  files: Record<string, string>;
  activeFile: string;
  onSelectFile: (path: string) => void;
  onCreateFile: (path: string) => void;
  onDeleteFile: (path: string) => void;
}

export function FileExplorer({
  files,
  activeFile,
  onSelectFile,
  onCreateFile,
  onDeleteFile,
}: FileExplorerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newPath, setNewPath] = useState('');

  const fileList = Object.keys(files).sort();

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPath.trim()) {
      onCreateFile(newPath.trim());
      setNewPath('');
      setIsCreating(false);
    }
  };

  const getFileIcon = (path: string) => {
    if (path.endsWith('.tsx') || path.endsWith('.ts') || path.endsWith('.jsx') || path.endsWith('.js')) {
      return <FileCode2 className="h-4 w-4 text-cyan-400" />;
    }
    if (path.endsWith('.json')) {
      return <FileJson className="h-4 w-4 text-amber-400" />;
    }
    return <FileText className="h-4 w-4 text-slate-400" />;
  };

  return (
    <aside className="w-60 border-r border-slate-800 bg-slate-950 flex flex-col h-full select-none">
      {/* Header */}
      <div className="h-10 border-b border-slate-800/80 px-3 flex items-center justify-between text-xs font-semibold text-slate-400">
        <div className="flex items-center gap-1.5">
          <FolderOpen className="h-3.5 w-3.5 text-blue-400" />
          <span>PROJECT FILES</span>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          title="New File"
        >
          <FilePlus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* New file input form */}
      {isCreating && (
        <form onSubmit={handleCreateSubmit} className="p-2 border-b border-slate-800">
          <input
            type="text"
            placeholder="src/components/MyComponent.tsx"
            value={newPath}
            onChange={(e) => setNewPath(e.target.value)}
            autoFocus
            className="w-full px-2 py-1 text-xs bg-slate-900 border border-blue-500 rounded text-slate-200 outline-none"
            onBlur={() => !newPath && setIsCreating(false)}
          />
        </form>
      )}

      {/* File Tree List */}
      <div className="flex-1 overflow-y-auto py-2 px-1 space-y-0.5 text-xs">
        {fileList.length === 0 ? (
          <div className="p-4 text-center text-slate-500 text-[11px] space-y-2 mt-4">
            <p className="font-medium text-slate-400">Workspace is empty</p>
            <p className="text-[10px] text-slate-600 leading-relaxed">
              Files created by Gemini or added manually will appear here.
            </p>
            <button
              onClick={() => setIsCreating(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white text-[11px] transition-colors"
            >
              <FilePlus className="h-3 w-3 text-cyan-400" />
              <span>New File</span>
            </button>
          </div>
        ) : (
          fileList.map((filePath) => {
            const isActive = filePath === activeFile;
            return (
              <div
                key={filePath}
                onClick={() => onSelectFile(filePath)}
                className={`group flex items-center justify-between px-2.5 py-1.5 rounded-md cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-300 font-medium'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {getFileIcon(filePath)}
                  <span className="truncate">{filePath}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteFile(filePath);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
                  title="Delete file"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
