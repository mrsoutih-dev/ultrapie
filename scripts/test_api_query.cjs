const http = require('http');

const req = http.request(
  {
    hostname: 'localhost',
    port: 3005,
    path: '/api/databases',
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
  },
  (res) => {
    let data = '';
    res.on('data', (d) => (data += d));
    res.on('end', () => {
      console.log('HTTP Status:', res.statusCode);
      console.log('Response Payload:', data);
    });
  }
);

req.write(
  JSON.stringify({
    id: 'db-pg-core',
    action: 'query',
    query: 'SELECT id, email, name FROM users LIMIT 5;',
  })
);
req.end();
