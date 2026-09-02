const http = require('http');
const path = require('path');
const fs = require('fs');

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ PROD SERVER TEST FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${message}`);
}

async function testEndpoint(url, expectedStatus) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = [];
      res.on('data', (c) => data.push(c));
      res.on('end', () => {
        const body = Buffer.concat(data).toString('utf8');
        resolve({ statusCode: res.statusCode, headers: res.headers, body });
      });
    }).on('error', reject);
  });
}

async function run() {
  console.log('================================================================');
  console.log('🚀 TESTING STANDALONE PRODUCTION SERVER & SPA ROUTING');
  console.log('================================================================\n');

  // Verify dist directory exists
  const distDir = path.resolve('dist');
  assert(fs.existsSync(distDir), 'Production dist/ bundle directory exists');

  // Test GET /
  console.log('[1] Testing GET / (SPA index.html delivery)...');
  const indexRes = await testEndpoint('http://localhost:3000/', 200);
  assert(indexRes.statusCode === 200, 'GET / returns 200');
  assert(indexRes.body.includes('<!doctype html>') || indexRes.body.includes('<html'), 'HTML doctype served');
  assert(indexRes.body.includes('NOVARA'), 'Branding served in index.html');

  // Test GET /api/health
  console.log('\n[2] Testing GET /api/health endpoint...');
  const healthRes = await testEndpoint('http://localhost:3000/api/health', 200);
  assert(healthRes.statusCode === 200, 'GET /api/health returns 200');
  const healthJson = JSON.parse(healthRes.body);
  assert(healthJson.status === 'healthy', 'Health check reports healthy');
  assert(healthJson.services.server === 'online', 'Server reports online');

  // Test GET /manifest.json
  console.log('\n[3] Testing GET /manifest.json...');
  const manifestRes = await testEndpoint('http://localhost:3000/manifest.json', 200);
  assert(manifestRes.statusCode === 200, 'GET /manifest.json returns 200');
  const manifestJson = JSON.parse(manifestRes.body);
  assert(manifestJson.name === 'NOVARA — Placement Preparation', 'Manifest name is exact');

  // Test GET /sw.js
  console.log('\n[4] Testing GET /sw.js (Service Worker)...');
  const swRes = await testEndpoint('http://localhost:3000/sw.js', 200);
  assert(swRes.statusCode === 200, 'GET /sw.js returns 200');
  assert(swRes.body.includes('novara-app-shell'), 'Service worker cache identifier present');

  console.log('\n================================================================');
  console.log('🎉 STANDALONE PRODUCTION SERVER TESTS PASSED!');
  console.log('================================================================');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
