import JSZip from 'jszip';

export interface ProjectExportOptions {
  projectName?: string;
  files: Record<string, string>;
}

export async function exportProjectToZip({
  projectName = 'ultrapie-project',
  files,
}: ProjectExportOptions): Promise<void> {
  const zip = new JSZip();

  // Clean slug for filename
  const cleanName = projectName
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-');

  // Add all existing workspace files (sanitizing dependencies to pinned compatible versions)
  for (const [filePath, content] of Object.entries(files)) {
    if (filePath === 'package.json') {
      const sanitizedPkg = content
        .replace(/"lucide-react":\s*"[^"]*"/g, '"lucide-react": "^0.475.0"')
        .replace(/"react":\s*"\^?18[^"]*"/g, '"react": "^19.0.0"')
        .replace(/"react-dom":\s*"\^?18[^"]*"/g, '"react-dom": "^19.0.0"');
      zip.file(filePath, sanitizedPkg);
    } else {
      zip.file(filePath, content);
    }
  }

  // Ensure essential Vite + React 19 boilerplate files exist so the ZIP is runnable out-of-the-box
  if (!files['package.json']) {
    zip.file(
      'package.json',
      JSON.stringify(
        {
          name: cleanName,
          private: true,
          version: '1.0.0',
          type: 'module',
          scripts: {
            dev: 'vite',
            build: 'tsc && vite build',
            preview: 'vite preview',
          },
          dependencies: {
            react: '^19.0.0',
            'react-dom': '^19.0.0',
            'lucide-react': '^0.475.0',
            clsx: '^2.1.1',
            'tailwind-merge': '^3.0.2',
          },
          devDependencies: {
            '@types/react': '^19.0.10',
            '@types/react-dom': '^19.0.4',
            '@vitejs/plugin-react': '^4.3.4',
            typescript: '^5.8.2',
            vite: '^6.2.0',
            tailwindcss: '^3.4.17',
            postcss: '^8.5.3',
            autoprefixer: '^10.4.20',
          },
        },
        null,
        2
      )
    );
  }

  if (!files['vite.config.ts'] && !files['vite.config.js']) {
    zip.file(
      'vite.config.ts',
      `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
});
`
    );
  }

  if (!files['index.html']) {
    zip.file(
      'index.html',
      `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
  </head>
  <body class="bg-slate-950 text-slate-100 antialiased">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`
    );
  }

  if (!files['src/main.tsx'] && !files['src/index.tsx']) {
    zip.file(
      'src/main.tsx',
      `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`
    );
  }

  if (!files['src/index.css']) {
    zip.file(
      'src/index.css',
      `@tailwind base;
@tailwind components;
@tailwind utilities;
`
    );
  }

  if (!files['tailwind.config.js']) {
    zip.file(
      'tailwind.config.js',
      `/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
`
    );
  }

  if (!files['postcss.config.js']) {
    zip.file(
      'postcss.config.js',
      `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`
    );
  }

  if (!files['README.md']) {
    zip.file(
      'README.md',
      `# ${projectName}

Generated with **Ultrapie** ([ultrapie.com](https://ultrapie.com)).

## Quickstart

\`\`\`bash
# 1. Install dependencies
npm install

# 2. Start local development server
npm run dev

# 3. Build for production
npm run build
\`\`\`
`
    );
  }

  // Generate binary ZIP blob
  const blob = await zip.generateAsync({ type: 'blob' });

  // Trigger client download
  if (typeof window !== 'undefined') {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cleanName}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
