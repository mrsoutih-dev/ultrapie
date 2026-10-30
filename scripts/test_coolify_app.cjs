const http = require('http');

function post(path, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 8000,
        path: path,
        method: 'POST',
        headers: {
          Authorization: 'Bearer 6|9gNNiFPNnxeA3Yk7O83K5ijExdoQpMP2zTIYoJBi',
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
  const body = {
    project_uuid: '3o9m1ajpkravgyxzci29nnik',
    server_uuid: 'kdkidyozuxazlbd33azd9957',
    environment_name: 'production',
    git_repository: 'https://github.com/ultrapie-team/simple-counter-app',
    git_branch: 'main',
    build_pack: 'nixpacks',
    ports_exposes: '3000',
    domains: 'https://counter.ultrapie.com',
    name: 'Simple Counter App Test',
  };
  const res = await post('/api/v1/applications/public', body);
  console.log('STATUS:', res.status);
  console.log('DATA:', res.data);
}

run();
