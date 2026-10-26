function parseStreamingMarkdown(rawText) {
  let chatText = '';
  const filesMap = {};
  let activeStreamFile = null;

  // Check if rawText contains explicit FILE: markers
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
    // Check for standard markdown code blocks without FILE: tag
    const fencePattern = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)(?:```|$)/g;
    let match;
    let firstFenceIdx = -1;

    while ((match = fencePattern.exec(rawText)) !== null) {
      if (firstFenceIdx === -1) firstFenceIdx = match.index;
      const lang = (match[1] || '').toLowerCase().trim();
      let code = match[2];

      let targetPath = 'src/App.tsx';
      const firstLine = code.trim().split('\n')[0] || '';
      const commentMatch = firstLine.match(/^\/\/\s*([a-zA-Z0-9_\-\.\/]+)/);

      if (commentMatch && commentMatch[1].includes('.')) {
        targetPath = commentMatch[1];
      } else if (lang === 'css') {
        targetPath = 'src/index.css';
      } else if (lang === 'html') {
        targetPath = 'index.html';
      } else if (lang === 'json') {
        targetPath = 'package.json';
      }

      activeStreamFile = targetPath;
      filesMap[targetPath] = code;
    }

    if (firstFenceIdx !== -1) {
      chatText = rawText.substring(0, firstFenceIdx).trim();
    } else {
      chatText = rawText.trim();
    }
  }

  // Fallback for chatText if empty but files were generated
  if (!chatText && Object.keys(filesMap).length > 0) {
    chatText = 'I have built and updated your application files. You can see the live preview on the right!';
  }

  return { chatText, filesMap, activeStreamFile };
}

const sample1 = "Here is your simple landing page!\n\n```tsx\nimport React from 'react';\nexport default function App() {\n  return <h1>Hello Landing</h1>;\n}\n```";
console.log('--- Test 1 (Gemini standard markdown without FILE tag) ---');
const r1 = parseStreamingMarkdown(sample1);
console.log('chatText:', r1.chatText);
console.log('filesMap keys:', Object.keys(r1.filesMap));
console.log('App.tsx content:', r1.filesMap['src/App.tsx']);

const sample2 = "Hello! I am ready to help you brainstorm ideas or answer any questions. What would you like to build?";
console.log('\n--- Test 2 (Pure conversational query) ---');
const r2 = parseStreamingMarkdown(sample2);
console.log('chatText:', r2.chatText);
console.log('filesMap keys:', Object.keys(r2.filesMap));
