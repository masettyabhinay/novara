const assert = require('assert');

async function testAdapter() {
  console.log('Testing PostgreSQL Adapter & Production Fail-Fast Guarantees...');

  // 1. Verify 'pg' package can be imported directly
  const pg = require('pg');
  assert(typeof pg.Pool === 'function', "pg.Pool must be a valid constructor");
  console.log("✅ 'pg' module imported successfully.");

  // 2. Test development fallback when not in production
  process.env.NODE_ENV = 'development';
  delete process.env.DATABASE_URL;
  const { dbAdapter } = await import('../server/db/dbAdapter.js');
  dbAdapter.initialized = false;
  await dbAdapter.init();
  const devHealth = await dbAdapter.healthCheck();
  assert.strictEqual(devHealth.provider, 'local_document_store', "In development, local store is allowed");
  console.log("✅ Development mode successfully initializes local document store when DATABASE_URL is not set.");

  // 3. Test production fail-fast when DATABASE_URL is missing
  process.env.NODE_ENV = 'production';
  delete process.env.DATABASE_URL;
  dbAdapter.initialized = false;
  let errorCaught = false;
  try {
    await dbAdapter.init();
  } catch (err) {
    errorCaught = true;
    assert(err.message.includes('PRODUCTION_DATABASE_URL_MISSING'), `Error must be PRODUCTION_DATABASE_URL_MISSING, got: ${err.message}`);
  }
  assert(errorCaught, "Production must throw when DATABASE_URL is missing");
  console.log("✅ Production correctly rejects missing DATABASE_URL without silent fallback.");

  // 4. Test production fail-fast when DATABASE_URL is unreachable
  process.env.NODE_ENV = 'production';
  process.env.DATABASE_URL = 'postgresql://invalid_user:invalid_pass@127.0.0.1:54321/invalid_db?sslmode=disable';
  dbAdapter.initialized = false;
  let connErrorCaught = false;
  try {
    await dbAdapter.init();
  } catch (err) {
    connErrorCaught = true;
    assert(err.message.includes('PRODUCTION_DATABASE_CONNECTION_FAILED'), `Error must be PRODUCTION_DATABASE_CONNECTION_FAILED, got: ${err.message}`);
  }
  assert(connErrorCaught, "Production must throw when PostgreSQL connection fails (NO silent fallback)");
  console.log("✅ Production correctly fails loudly when PostgreSQL cannot connect (NO silent fallback).");

  // Reset to development
  process.env.NODE_ENV = 'development';
  delete process.env.DATABASE_URL;
  dbAdapter.initialized = false;
  await dbAdapter.init();

  console.log('🎉 All PostgreSQL Adapter verification assertions PASSED!');
}

testAdapter().catch((e) => {
  console.error(e);
  process.exit(1);
});
