const { execSync } = require('child_process');

async function testPostgres() {
  console.log('Testing live connection to PostgreSQL container...');
  try {
    const res = execSync(
      `docker exec ultrapie-postgres psql -U ultrapie -d ultrapie_dev -t -A -c "SELECT json_agg(t) FROM (SELECT tablename FROM pg_tables WHERE schemaname = 'public' LIMIT 5) t;"`,
      { encoding: 'utf-8' }
    );
    console.log('PostgreSQL live query result:', res.trim());
    return true;
  } catch (e) {
    console.error('Failed to query PostgreSQL:', e.message);
    return false;
  }
}

testPostgres();
