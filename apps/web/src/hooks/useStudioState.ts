'use client';

import { useState, useCallback, useEffect } from 'react';
import { FilePatch } from '@ultrapie/shared';

export type ViewportMode = 'desktop' | 'tablet' | 'mobile';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isCodeAction?: boolean;
  patches?: FilePatch[];
  timestamp: string;
  isPending?: boolean;
}

const DEFAULT_FILES: Record<string, string> = {};

function parseStreamingMarkdown(rawText: string): {
  chatText: string;
  filesMap: Record<string, string>;
  activeStreamFile: string | null;
} {
  let chatText = '';
  const filesMap: Record<string, string> = {};
  let activeStreamFile: string | null = null;

  // 1. Check if rawText contains explicit FILE: markers
  const hasFileMarkers = /FILE:\s*[^\r\n]+/i.test(rawText);

  if (hasFileMarkers) {
    const fileMarkerIndex = rawText.search(/FILE:\s*[^\r\n]+/i);
    chatText = rawText.substring(0, fileMarkerIndex).trim();

    const segments = rawText.substring(fileMarkerIndex).split(/(?=FILE:\s*[^\r\n]+)/gi);
    for (const seg of segments) {
      const match = seg.match(/FILE:\s*([^\r\n]+)/i);
      if (match) {
        const filePath = match[1].trim();
        activeStreamFile = filePath;

        const fenceIdx = seg.indexOf('```');
        if (fenceIdx !== -1) {
          const afterFence = seg.substring(fenceIdx + 3);
          const nlIdx = afterFence.indexOf('\n');
          if (nlIdx !== -1) {
            let code = afterFence.substring(nlIdx + 1);
            const closeIdx = code.indexOf('```');
            if (closeIdx !== -1) code = code.substring(0, closeIdx);
            filesMap[filePath] = code;
          }
        }
      }
    }
  } else {
    // 2. No explicit FILE: markers.
    // Only parse as an App file if it contains a full standalone React component definition (export default function)
    const isFullComponent =
      /export\s+default\s+(function|class|App)/i.test(rawText) &&
      /```(tsx|jsx|typescript|javascript)/i.test(rawText);

    if (isFullComponent) {
      const fencePattern = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)(?:```|$)/g;
      let match;
      let firstFenceIdx = -1;

      while ((match = fencePattern.exec(rawText)) !== null) {
        const code = match[2];
        if (/export\s+default/i.test(code)) {
          if (firstFenceIdx === -1) firstFenceIdx = match.index;
          activeStreamFile = 'src/App.tsx';
          filesMap['src/App.tsx'] = code;
          break;
        }
      }

      if (firstFenceIdx !== -1) {
        chatText = rawText.substring(0, firstFenceIdx).trim();
        if (!chatText) {
          chatText = 'I have built your application component in `src/App.tsx`. Live preview is ready!';
        }
      } else {
        chatText = rawText.trim();
      }
    } else {
      // It is a conversational explanation or answer to a question (may contain illustrative code snippets)
      // Keep entire text intact in chatText so the user sees the full, rich answer with all code snippets!
      chatText = rawText.trim();
    }
  }

  // If chatText is empty but files were extracted, provide a clear friendly summary
  if (!chatText && Object.keys(filesMap).length > 0) {
    chatText = 'I have built and updated your application files. You can see the live preview on the right!';
  }

  return { chatText, filesMap, activeStreamFile };
}

export function useStudioState() {
  const [files, setFiles] = useState<Record<string, string>>(DEFAULT_FILES);
  const [activeFile, setActiveFile] = useState<string>('');
  const [viewport, setViewport] = useState<ViewportMode>('desktop');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [liveStreamingFile, setLiveStreamingFile] = useState<string | null>(null);
  const [streamingLineCount, setStreamingLineCount] = useState<number>(0);
  const [pendingPatches, setPendingPatches] = useState<FilePatch[] | null>(null);
  const [previewKey, setPreviewKey] = useState<number>(1);

  // Settings
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');
  const [geminiModel, setGeminiModel] = useState<string>('gemini-3-flash-preview');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedKey = localStorage.getItem('ultrapie_gemini_api_key');
      const storedModel = localStorage.getItem('ultrapie_gemini_model');
      if (storedKey) setGeminiApiKey(storedKey);
      if (storedModel) setGeminiModel(storedModel);

      // Restore saved studio workspace files
      const storedFiles = localStorage.getItem('ultrapie_studio_files');
      if (storedFiles) {
        try {
          const parsed = JSON.parse(storedFiles);
          if (parsed && Object.keys(parsed).length > 0) {
            setFiles(parsed);
            const mainFile =
              Object.keys(parsed).find((p) => p === 'src/App.tsx' || p.endsWith('.tsx')) ||
              Object.keys(parsed)[0];
            if (mainFile) setActiveFile(mainFile);
          }
        } catch {
          // Ignore parse errors
        }
      }
    }
  }, []);

  const saveSettings = useCallback((newKey: string, newModel: string) => {
    setGeminiApiKey(newKey);
    setGeminiModel(newModel);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ultrapie_gemini_api_key', newKey);
      localStorage.setItem('ultrapie_gemini_model', newModel);
    }
  }, []);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Welcome to Ultrapie Studio! What app or website would you like to build today? You can describe any idea (e.g., a SaaS landing page, portfolio, dashboard, or store), or ask questions to get started.',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);

  const updateFileContent = useCallback((path: string, content: string) => {
    setFiles((prev) => ({
      ...prev,
      [path]: content,
    }));
  }, []);

  const createFile = useCallback((path: string, content = '') => {
    setFiles((prev) => ({
      ...prev,
      [path]: content,
    }));
    setActiveFile(path);
  }, []);

  const deleteFile = useCallback((path: string) => {
    setFiles((prev) => {
      const copy = { ...prev };
      delete copy[path];
      return copy;
    });
    if (activeFile === path) {
      const remaining = Object.keys(files).filter((k) => k !== path);
      setActiveFile(remaining[0] || '');
    }
  }, [activeFile, files]);

  const applyPendingPatches = useCallback(() => {
    if (!pendingPatches) return;
    setFiles((prev) => {
      const copy = { ...prev };
      for (const patch of pendingPatches) {
        if (patch.operation === 'delete') {
          delete copy[patch.path];
        } else if (patch.content !== undefined) {
          copy[patch.path] = patch.content;
        }
      }
      return copy;
    });

    const patchPaths = pendingPatches.map((p) => p.path);
    const mainFile =
      patchPaths.find((p) => p === 'src/App.tsx' || p.endsWith('.tsx') || p === 'index.html') ||
      patchPaths[0];
    if (mainFile) {
      setActiveFile(mainFile);
    }

    setPendingPatches(null);
    setPreviewKey((k) => k + 1);
  }, [pendingPatches]);

  const rejectPendingPatches = useCallback(() => {
    setPendingPatches(null);
  }, []);

  const resetStudio = useCallback(() => {
    setFiles({});
    setActiveFile('');
    setPendingPatches(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ultrapie_studio_files');
    }
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content:
          'Welcome to Ultrapie Studio! What app or website would you like to build today? You can describe any idea (e.g., a SaaS landing page, portfolio, dashboard, or store), or ask questions to get started.',
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
    setPreviewKey((k) => k + 1);
  }, []);

  const sendPrompt = useCallback(
    async (promptText: string) => {
      const text = promptText.trim();
      if (!text) return;

      const userMsgId = 'user-' + Math.random().toString(36).substring(2, 9);
      const assistantMsgId = 'asst-' + Math.random().toString(36).substring(2, 9);
      const time = new Date().toLocaleTimeString();

      const userMsg: ChatMessage = {
        id: userMsgId,
        role: 'user',
        content: text,
        timestamp: time,
      };

      const pendingAssistantMsg: ChatMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        isPending: true,
        timestamp: time,
      };

      setMessages((prev) => [...prev, userMsg, pendingAssistantMsg]);
      setIsGenerating(true);

      try {
        const response = await fetch('/api/studio/stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(geminiApiKey ? { 'x-gemini-api-key': geminiApiKey } : {}),
          },
          body: JSON.stringify({
            prompt: text,
            existingFiles: files,
            apiKey: geminiApiKey || undefined,
            model: geminiModel,
            chatHistory: messages.slice(-6).map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        });

        if (!response.ok || !response.body) {
          throw new Error(`HTTP ${response.status}: Failed to connect to code stream`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedText = '';
        let sseBuffer = '';
        let lastPreviewTrigger = Date.now();

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          sseBuffer += decoder.decode(value, { stream: true });
          const lines = sseBuffer.split('\n\n');
          sseBuffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const jsonStr = trimmed.replace(/^data:\s*/, '');
            try {
              const parsed = JSON.parse(jsonStr);
              if (parsed.text) {
                accumulatedText += parsed.text;

                const { chatText, filesMap, activeStreamFile } = parseStreamingMarkdown(accumulatedText);

                // 1. Update chat message in real time
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMsgId
                      ? {
                          ...msg,
                          content: chatText || 'Building your application...',
                          isPending: false,
                        }
                      : msg
                  )
                );

                // 2. Stream code directly into files and Monaco editor in real time!
                if (activeStreamFile) {
                  setLiveStreamingFile(activeStreamFile);
                  setActiveFile((current) => current || activeStreamFile);

                  if (Object.keys(filesMap).length > 0) {
                    setFiles((prev) => ({
                      ...prev,
                      ...filesMap,
                    }));

                    // Update live line count for line-by-line visual indicator
                    const activeContent = filesMap[activeStreamFile] || '';
                    const totalLines = activeContent.split('\n').length;
                    setStreamingLineCount(totalLines);
                  }
                }
              }
            } catch {
              // Ignore partial JSON parse errors during stream
            }
          }
        }

        // Stream completed: finalize all files and trigger live page preview
        const finalParsed = parseStreamingMarkdown(accumulatedText);
        setLiveStreamingFile(null);
        setStreamingLineCount(0);

        if (Object.keys(finalParsed.filesMap).length > 0) {
          setFiles((prev) => {
            const merged = { ...prev, ...finalParsed.filesMap };
            if (typeof window !== 'undefined') {
              localStorage.setItem('ultrapie_studio_files', JSON.stringify(merged));
            }
            return merged;
          });

          const mainFile =
            Object.keys(finalParsed.filesMap).find(
              (p) => p === 'src/App.tsx' || p.endsWith('.tsx') || p === 'index.html'
            ) || Object.keys(finalParsed.filesMap)[0];

          if (mainFile) {
            setActiveFile(mainFile);
          }

          // Trigger live page preview refresh!
          setPreviewKey((k) => k + 1);
        }

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  content: finalParsed.chatText || 'Application built successfully.',
                  isPending: false,
                }
              : msg
          )
        );
      } catch (error: any) {
        console.error('Studio stream error:', error);
        setLiveStreamingFile(null);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  content: `⚠️ Error during code generation: ${error.message || 'Please check connection.'}`,
                  isPending: false,
                }
              : msg
          )
        );
      } finally {
        setLiveStreamingFile(null);
        setMessages((prev) => {
          const hasPending = prev.some((m) => m.isPending);
          if (!hasPending) {
            setIsGenerating(false);
          }
          return prev;
        });
      }
    },
    [files, geminiApiKey, geminiModel, messages]
  );

  return {
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
    sendPrompt,
  };
}
