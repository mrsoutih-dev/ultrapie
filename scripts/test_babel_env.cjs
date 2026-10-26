const { chromium } = require('playwright-core');

async function testBabelEnv() {
  const chromePath = 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe';
  const browser = await chromium.launch({ executablePath: chromePath, headless: true });
  const page = await browser.newPage();

  page.on('console', (msg) => console.log('BROWSER LOG:', msg.type(), msg.text()));
  page.on('pageerror', (err) => console.log('PAGE ERROR:', err.message));

  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
        <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
        <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
      </head>
      <body>
        <div id="root"></div>
        <script>
          window.runTranspile = (sourceCode) => {
            const transformed = Babel.transform(sourceCode, {
              presets: ['typescript', ['env', { modules: 'commonjs' }], ['react', { runtime: 'classic' }]],
              filename: 'App.tsx'
            }).code;

            console.log('Transpiled code:', transformed.substring(0, 300));

            const require = (name) => {
              if (name === 'react') return React;
              if (name === 'react-dom') return ReactDOM;
              if (name === 'lucide-react') return LucideProxy;
              return {};
            };

            const LucideProxy = new Proxy({}, {
              get: () => (props) => React.createElement('svg', null)
            });

            const exports = {};
            const module = { exports };

            const fn = new Function('React', 'ReactDOM', 'require', 'exports', 'module', transformed);
            fn(React, ReactDOM, require, exports, module);

            const TargetComp = exports.default || module.exports.default || exports.App || window.App;
            try {
              const el = React.createElement(TargetComp);
              if (!window.__root) window.__root = ReactDOM.createRoot(document.getElementById('root'));
              window.__root.render(el);
              return 'SUCCESS: rendered ' + (TargetComp ? TargetComp.name || 'Component' : 'null');
            } catch (err) {
              return 'RENDER ERROR: ' + err.message;
            }
          };
        </script>
      </body>
    </html>
  `);

  await page.waitForFunction(() => !!window.Babel && !!window.React);

  const testCode = `
    import React, { useState } from 'react';
    import { Coffee, Star } from 'lucide-react';

    interface Props {
      title?: string;
    }

    type Status = 'active' | 'idle';

    export default function App({ title = 'Coffee App' }: Props) {
      const [count, setCount] = useState<number>(42);
      return <h1>Hello from {title}! Count: {count}</h1>;
    }
  `;

  const result = await page.evaluate((code) => window.runTranspile(code), testCode);
  console.log('Result of Babel transform with presets [react, env]:', result);

  await page.waitForSelector('h1');
  const rootText = await page.textContent('#root');
  console.log('Root HTML text:', rootText);

  await browser.close();
}

testBabelEnv().catch(console.error);
