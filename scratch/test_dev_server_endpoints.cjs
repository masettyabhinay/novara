const http = require('http');

function testEndpoint(path, expectedStatus, expectedMime) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3000${path}`, (res) => {
      let data = [];
      res.on('data', (chunk) => data.push(chunk));
      res.on('end', () => {
        const body = Buffer.concat(data);
        if (res.statusCode === expectedStatus) {
          console.log(`✅ [HTTP ${res.statusCode}] ${path} - Content-Type: ${res.headers['content-type']} (${body.length} bytes)`);
          resolve({ status: res.statusCode, headers: res.headers, body });
        } else {
          console.error(`❌ [HTTP ${res.statusCode} (Expected ${expectedStatus})] ${path}`);
          reject(new Error(`Failed status for ${path}: ${res.statusCode}`));
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function run() {
  console.log('Testing Running Dev Server Endpoints...');
  await testEndpoint('/', 200);
  await testEndpoint('/manifest.json', 200);
  await testEndpoint('/sw.js', 200);
  await testEndpoint('/favicon.svg', 200);
  await testEndpoint('/icons/icon-192.png', 200);
  await testEndpoint('/icons/icon-512.png', 200);
  await testEndpoint('/icons/icon-maskable-192.png', 200);
  await testEndpoint('/icons/icon-maskable-512.png', 200);
  console.log('🎉 All Dev Server PWA Endpoints Verified!\n');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
