const http = require('http');

function post(path) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 8000,
        path: path,
        method: 'POST',
        headers: {
          Authorization: 'Bearer 6|9gNNiFPNnxeA3Yk7O83K5ijExdoQpMP2zTIYoJBi',
          'Content-Type': 'application/json',
          'Content-Length': 0,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (d) => (data += d));
        res.on('end', () => resolve({ status: res.statusCode, data }));
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  const res = await post('/api/v1/deploy?uuid=hnpum9vvaqmxef2m6ps62lsc');
  console.log('STATUS:', res.status);
  console.log('DATA:', res.data);
}

run();
