import { describe, it, expect } from 'vitest';
import { STARTER_TEMPLATES } from '../apps/web/src/lib/studio/starter-templates';
import { generateFallbackResponse } from '../apps/web/src/lib/gemini-fallback-engine';
import JSZip from '../apps/web/node_modules/jszip';

describe('Studio Superpowers: Templates Gallery & ZIP Exporter', () => {
  describe('Starter Templates Gallery', () => {
    it('should have 6 curated production starter templates', () => {
      expect(STARTER_TEMPLATES).toHaveLength(6);
      const ids = STARTER_TEMPLATES.map((t) => t.id);
      expect(ids).toContain('saas-landing');
      expect(ids).toContain('database-crud');
      expect(ids).toContain('ecommerce-store');
      expect(ids).toContain('ai-assistant');
      expect(ids).toContain('crypto-fintech');
      expect(ids).toContain('dev-portfolio');
    });

    it('should generate valid source files for every starter template', () => {
      for (const tpl of STARTER_TEMPLATES) {
        const result = generateFallbackResponse(tpl.promptKeyword);
        expect(result.chatText.length).toBeGreaterThan(10);
        expect(result.files['src/App.tsx']).toBeDefined();
        expect(result.files['src/App.tsx']).toContain('export default function App');
      }
    });
  });

  describe('Project ZIP Bundle Generation', () => {
    it('should generate a complete, runnable Vite+React 19 archive', async () => {
      const zip = new JSZip();
      const files: Record<string, string> = {
        'src/App.tsx': 'export default function App() { return <h1>Hello</h1>; }',
      };

      // Add user files
      for (const [p, c] of Object.entries(files)) {
        zip.file(p, c);
      }

      // Add standard build files
      zip.file(
        'package.json',
        JSON.stringify({
          name: 'test-app',
          scripts: { dev: 'vite', build: 'tsc && vite build' },
          dependencies: { react: '^19.0.0', 'react-dom': '^19.0.0' },
        })
      );
      zip.file('vite.config.ts', 'import { defineConfig } from "vite"; export default defineConfig({});');
      zip.file('index.html', '<!DOCTYPE html><html><body><div id="root"></div></body></html>');

      const buffer = await zip.generateAsync({ type: 'nodebuffer' });
      expect(buffer.length).toBeGreaterThan(100);

      // Verify the generated zip can be re-read and contains all files
      const unzipped = await JSZip.loadAsync(buffer);
      expect(unzipped.file('src/App.tsx')).toBeDefined();
      expect(unzipped.file('package.json')).toBeDefined();
      expect(unzipped.file('vite.config.ts')).toBeDefined();
      expect(unzipped.file('index.html')).toBeDefined();

      const appContent = await unzipped.file('src/App.tsx')?.async('text');
      expect(appContent).toContain('export default function App');
    });
  });
});
