function sanitizeCodeForPreview(code) {
  if (!code) return '';
  return code
    .replace(/import\s+React\s*,\s*\{([\s\S]*?)\}\s*from\s*['"]react['"];?/g, 'const {$1} = React;')
    .replace(/import\s+React\s+from\s*['"]react['"];?/g, '')
    .replace(/import\s*\{([\s\S]*?)\}\s*from\s*['"]react['"];?/g, 'const {$1} = React;')
    .replace(/import\s*\{([\s\S]*?)\}\s*from\s*['"]lucide-react['"];?/g, (match, names) => {
      const identifiers = names.split(',').map((n) => n.trim()).filter(Boolean);
      return 'const { ' + identifiers.join(', ') + ' } = LucideProxy;';
    })
    .replace(/import\s+[\s\S]*?from\s*['"][^'"]+['"];?/g, '')
    .replace(/import\s*['"][^'"]+['"];?/g, '')
    .replace(/export\s+default\s+function\s+([A-Za-z0-9_]+)/g, 'function $1')
    .replace(/export\s+default\s+/g, 'const AppRoot = ')
    .replace(/export\s+function\s+/g, 'function ')
    .replace(/export\s+const\s+/g, 'const ');
}

const input = `import React, { useState } from 'react';
import { Coffee, MapPin } from 'lucide-react';
import './index.css';

export default function App() {
  const [count, setCount] = useState(0);
  return <div onClick={() => setCount(c => c + 1)}>Clicks: {count} <Coffee /></div>;
}`;

console.log('Sanitized output:');
console.log(sanitizeCodeForPreview(input));
