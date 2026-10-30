const http = require('http');

function del(uuid) {
  const req = http.request(
    {
      hostname: '127.0.0.1',
      port: 8000,
      path: `/api/v1/applications/${uuid}`,
      method: 'DELETE',
      headers: {
        Authorization: 'Bearer 6|9gNNiFPNnxeA3Yk7O83K5ijExdoQpMP2zTIYoJBi',
      },
    },
    (res) => console.log('Delete status:', res.statusCode)
  );
  req.end();
}

del('jud54iz9agoe6nr9hc675wfv');
