/**
 * WSL Port Relay
 * Bridges Windows localhost:3005 and localhost:4000 to the WSL2 virtual machine IP.
 */

const net = require('net');
const { execSync } = require('child_process');

function getWslIp() {
  try {
    const output = execSync('wsl -d Ubuntu-24.04 -e ip -4 addr show eth0', { encoding: 'utf-8' });
    const match = output.match(/inet\s+(\d+\.\d+\.\d+\.\d+)/);
    if (match && match[1]) {
      return match[1];
    }
  } catch (err) {
    console.error('Failed to resolve WSL IP:', err.message);
  }
  return '127.0.0.1';
}

const wslIp = getWslIp();
console.log(`WSL Target IP resolved: ${wslIp}`);

function createRelay(localPort, targetPort) {
  const server = net.createServer((clientSocket) => {
    const targetSocket = net.connect({ host: wslIp, port: targetPort }, () => {
      clientSocket.pipe(targetSocket);
      targetSocket.pipe(clientSocket);
    });

    targetSocket.on('error', (err) => {
      // ignore ECONNRESET on client disconnect
      clientSocket.destroy();
    });

    clientSocket.on('error', (err) => {
      targetSocket.destroy();
    });
  });

  server.listen(localPort, '0.0.0.0', () => {
    console.log(`✓ Port Relay Active: 0.0.0.0:${localPort} -> ${wslIp}:${targetPort}`);
  });

  server.on('error', (err) => {
    console.error(`Port ${localPort} relay error:`, err.message);
  });

  return server;
}

createRelay(3005, 3005);
createRelay(4000, 4000);
