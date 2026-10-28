const http = require('http');

async function testLiveChat() {
  const payload = JSON.stringify({
    messages: [
      {
        role: 'user',
        content: 'ما هو الفرق الجوهري بين التفكير المنطقي والحدس في الذكاء الاصطناعي؟ أجب بعمق ووضوح كـ Google AI Studio.'
      }
    ]
  });

  const req = http.request({
    hostname: '127.0.0.1',
    port: 3005,
    path: '/api/chat',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  }, (res) => {
    console.log('HTTP Status:', res.statusCode);
    console.log('Model Header:', res.headers['x-model-used']);
    let data = '';
    res.on('data', chunk => { data += chunk; });
    res.on('end', () => {
      console.log('\n--- LIVE AI STREAM RESPONSE ---');
      console.log(data);
    });
  });

  req.on('error', (e) => console.error('Request error:', e));
  req.write(payload);
  req.end();
}

testLiveChat();
