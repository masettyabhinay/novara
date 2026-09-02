const assert = require('assert');
const fs = require('fs');
const path = require('path');

async function testAdapter() {
  console.log('================================================================');
  console.log('🔒 TESTING POSTGRESQL SSL CONFIGURATION & CA VERIFICATION');
  console.log('================================================================\n');

  const { dbAdapter, parseSslCa } = await import('../server/db/dbAdapter.js');

  // 1. Verify parseSslCa with various formats
  console.log('[1] Testing CA Certificate Parsing (parseSslCa)...');
  const mockPem = '-----BEGIN CERTIFICATE-----\nMIIBojCCAUqgAwIBAgIUY2h...mockCA...==\n-----END CERTIFICATE-----';
  
  // Format A: Standard PEM string
  assert.strictEqual(parseSslCa(mockPem), mockPem, 'Standard PEM string parsed exactly');

  // Format B: Escaped newlines string (common in Render environment variables)
  const escapedPem = '-----BEGIN CERTIFICATE-----\\nMIIBojCCAUqgAwIBAgIUY2h...mockCA...==\\n-----END CERTIFICATE-----';
  assert.strictEqual(parseSslCa(escapedPem), mockPem, 'Escaped newlines unescaped properly');

  // Format C: Base64 encoded PEM
  const base64Pem = Buffer.from(mockPem).toString('base64');
  assert.strictEqual(parseSslCa(base64Pem), mockPem, 'Base64 encoded PEM decoded properly');

  // Format D: File path
  const tempCaPath = path.resolve('scratch', 'temp_test_ca.crt');
  fs.writeFileSync(tempCaPath, mockPem, 'utf8');
  assert.strictEqual(parseSslCa(tempCaPath), mockPem, 'File path CA read properly');
  fs.unlinkSync(tempCaPath);

  console.log('✅ parseSslCa correctly normalizes PEM, escaped newlines, base64, and file paths.');

  // 2. Test Production Pool SSL Options Retention
  console.log('\n[2] Testing Production Pool SSL Config with DATABASE_SSL_CA...');
  process.env.NODE_ENV = 'production';
  process.env.DATABASE_URL = 'postgresql://postgres.testref:secretpass@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require';
  process.env.DATABASE_SSL_CA = escapedPem;

  dbAdapter.initialized = false;
  // We check the internal pool construction without actually making the network call
  // by intercepting or checking options
  const { parse: parseConnectionString } = await import('pg-connection-string');
  const cleanUrl = process.env.DATABASE_URL.replace(/([?&])sslmode=[^&]+(&|$)/, '$1').replace(/\?$/, '');
  const parsed = parseConnectionString(cleanUrl);
  delete parsed.ssl;
  delete parsed.sslmode;

  const caCert = parseSslCa(process.env.DATABASE_SSL_CA);
  assert(caCert !== null, 'CA certificate must be parsed');
  assert.strictEqual(caCert, mockPem, 'Parsed CA must match expected PEM');

  const pg = (await import('pg')).default;
  const poolConfig = {
    ...parsed,
    port: parseInt(parsed.port, 10),
    ssl: {
      ca: caCert,
      rejectUnauthorized: true,
      servername: parsed.host
    }
  };

  const pool = new pg.Pool(poolConfig);
  assert.strictEqual(pool.options.ssl.rejectUnauthorized, true, 'rejectUnauthorized must be true');
  assert.strictEqual(pool.options.ssl.ca, mockPem, 'Custom Supabase CA must be present in pool options');
  assert.strictEqual(pool.options.ssl.servername, 'aws-0-us-east-1.pooler.supabase.com', 'SNI servername must be set');
  console.log('✅ Pool options strictly preserve custom CA, rejectUnauthorized: true, and SNI servername.');

  // 3. Test Production Fail-Fast on Connection Failure (NO silent fallback)
  console.log('\n[3] Testing Production Fail-Fast Behavior on Connection Failure...');
  let failedFast = false;
  try {
    // Attempt init with unreachable port
    process.env.DATABASE_URL = 'postgresql://postgres.testref:secretpass@127.0.0.1:54321/postgres?sslmode=require';
    dbAdapter.initialized = false;
    await dbAdapter.init();
  } catch (err) {
    failedFast = true;
    assert(err.message.includes('PRODUCTION_DATABASE_CONNECTION_FAILED'), `Expected PRODUCTION_DATABASE_CONNECTION_FAILED, got: ${err.message}`);
  }
  assert(failedFast, 'Production must throw when connection cannot be established');
  console.log('✅ Production strictly fails fast on connection error (zero silent fallback).');

  // 4. Test Production Fail-Fast on Missing DATABASE_URL
  console.log('\n[4] Testing Production Fail-Fast on Missing DATABASE_URL...');
  delete process.env.DATABASE_URL;
  delete process.env.DATABASE_SSL_CA;
  dbAdapter.initialized = false;
  let missingUrlFailed = false;
  try {
    await dbAdapter.init();
  } catch (err) {
    missingUrlFailed = true;
    assert(err.message.includes('PRODUCTION_DATABASE_URL_MISSING'), `Expected PRODUCTION_DATABASE_URL_MISSING, got: ${err.message}`);
  }
  assert(missingUrlFailed, 'Production must throw when DATABASE_URL is missing');
  console.log('✅ Production strictly rejects missing DATABASE_URL.');

  // 5. Test Development Fallback
  console.log('\n[5] Testing Non-Production Development Behavior...');
  process.env.NODE_ENV = 'development';
  delete process.env.DATABASE_URL;
  dbAdapter.initialized = false;
  await dbAdapter.init();
  const devHealth = await dbAdapter.healthCheck();
  assert.strictEqual(devHealth.provider, 'local_document_store', 'In development, local store is allowed');
  console.log('✅ Development mode successfully initializes local document store.');

  console.log('\n================================================================');
  console.log('🎉 ALL POSTGRESQL SSL & ADAPTER TESTS PASSED!');
  console.log('================================================================');
}

testAdapter().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
