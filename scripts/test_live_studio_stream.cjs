const http = require('http');

async function testLiveStudioStream() {
  const payload = JSON.stringify({
    prompt: 'Build a modern digital clock and stopwatch with sleek dark theme in React 19'
  });

  const req = http.request({
    hostname: '127.0.0.1',
    port: 3005,
    path: '/api/studio/stream',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  }, (res) => {
    console.log('Studio HTTP Status:', res.statusCode);
    console.log('Studio Model Header:', res.headers['x-model-used']);
    let chunkCount = 0;
    let fullText = '';
    res.on('data', chunk => {
      chunkCount++;
      fullText += chunk.toString();
    });
    res.on('end', () => {
      console.log(`Stream finished with ${chunkCount} chunks.`);
      console.log('Sample text output (first 300 chars):');
      console.log(fullText.substring(0, 300));
      console.log('Contains FILE: src/App.tsx?', fullText.includes('FILE: src/App.tsx'));
    });
  });

  req.on('error', (e) => console.error('Studio stream error:', e));
  req.write(payload);
  req.end();
}

testLiveStudioStream();
