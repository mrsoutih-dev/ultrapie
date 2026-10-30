const http = require('http');

function post(path, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 3005,
        path: path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (d) => (data += d));
        res.on('end', () => resolve({ status: res.statusCode, data }));
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function run() {
  console.log('Sending createApp request to Next.js API on port 3005...');
  const res = await post('/api/coolify', {
    action: 'createApp',
    payload: {
      name: 'Simple Counter App',
      git_repository: 'https://github.com/ultrapie-team/simple-counter-app',
      git_branch: 'main',
      build_pack: 'nixpacks',
      fqdn: 'https://app.yourdomain.com',
      ports_exposes: '3000',
      autoDeploy: true,
    },
  });

  console.log('HTTP Status:', res.status);
  console.log('Response Payload:', res.data);
}

run();
