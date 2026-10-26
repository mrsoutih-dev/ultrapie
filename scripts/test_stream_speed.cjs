const http = require('http');

async function testPrompt(prompt) {
  const start = Date.now();
  console.log(`\n=== Testing Prompt: "${prompt}" ===`);

  const payload = JSON.stringify({
    prompt: prompt,
    existingFiles: {}
  });

  return new Promise((resolve) => {
    const req = http.request('http://localhost:3005/api/studio/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      console.log(`Headers received in ${Date.now() - start}ms, status: ${res.statusCode}`);
      let fullText = '';

      res.on('data', (chunk) => {
        fullText += chunk.toString();
      });

      res.on('end', () => {
        console.log(`Finished in ${Date.now() - start}ms. Total characters: ${fullText.length}`);
        const lines = fullText.split('\n\n').filter(l => l.startsWith('data:'));
        let parsedText = '';
        for (const l of lines) {
          try {
            const data = JSON.parse(l.replace('data: ', ''));
            if (data.text) parsedText += data.text;
          } catch {}
        }
        console.log(`Extracted text preview (${parsedText.length} chars):\n${parsedText.slice(0, 200)}...`);
        resolve(parsedText);
      });
    });

    req.write(payload);
    req.end();
  });
}

async function run() {
  await testPrompt('Hello, what can you do?');
  await testPrompt('Build a simple landing page');
  await testPrompt('Add a pricing section');
}

run();
