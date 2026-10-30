const { execSync } = require('child_process');

try {
  // Quote wildcards to prevent bash shell glob expansion
  const sanitized = 'KEYS *'.replace(/\*/g, "'*'");
  const raw = execSync(`docker exec ultrapie-redis redis-cli ${sanitized}`, { encoding: 'utf-8' });
  console.log('Redis result:', raw.trim());
} catch (e) {
  console.error('Error:', e.message);
}
