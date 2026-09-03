/**
 * NOVARA Version & Deployment Consistency Verification Test
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

async function testVersionConsistency() {
  console.log('================================================================');
  console.log('  NOVARA VERSION & DEPLOYMENT CONSISTENCY VERIFICATION         ');
  console.log('================================================================\n');

  // 1. Check package.json canonical version
  const pkgPath = path.resolve(__dirname, '..', 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const canonicalVersion = pkg.version;
  console.log(`[1] Canonical package.json version: ${canonicalVersion}`);
  assert.strictEqual(canonicalVersion, '1.0.0', 'Canonical package.json version must be 1.0.0');

  // 2. Check getAppVersion helper and getBuildCommit helper
  const { getAppVersion, getBuildCommit, apiMiddlewareHandler } = await import('file:///f:/NOVARA/server/apiMiddleware.js');
  const appVersion = getAppVersion();
  const buildCommit = getBuildCommit();
  console.log(`[2] API derived appVersion: ${appVersion}, buildCommit: ${buildCommit}`);
  assert.strictEqual(appVersion, canonicalVersion, 'API appVersion must match package.json version');
  assert(buildCommit && typeof buildCommit === 'string' && buildCommit.length > 0, 'buildCommit must be non-empty string');

  // 3. Check /api/health endpoint response structure and version
  let healthResponse = null;
  const mockReq = {
    url: '/api/health',
    method: 'GET',
    headers: {}
  };
  const mockRes = {
    statusCode: 200,
    headers: {},
    setHeader(k, v) { this.headers[k] = v; },
    end(body) {
      if (body) healthResponse = JSON.parse(body);
    }
  };

  await apiMiddlewareHandler(mockReq, mockRes, () => {});
  assert(healthResponse, 'Health endpoint returned response');
  console.log('[3] Health response:', JSON.stringify(healthResponse, null, 2));
  assert.strictEqual(healthResponse.status, 'healthy');
  assert.strictEqual(healthResponse.version, canonicalVersion, 'Health version must equal 1.0.0');
  assert.strictEqual(healthResponse.buildCommit, buildCommit, 'Health buildCommit must match git/env commit');
  assert.strictEqual(healthResponse.password, undefined, 'No secrets in health response');
  assert.strictEqual(healthResponse.DATABASE_URL, undefined, 'No DATABASE_URL in health response');

  // 4. Check Android build.gradle
  const gradlePath = path.resolve(__dirname, '..', 'android', 'app', 'build.gradle');
  const gradleContent = fs.readFileSync(gradlePath, 'utf8');
  const versionNameMatch = gradleContent.match(/versionName\s+["']([^"']+)["']/);
  const versionCodeMatch = gradleContent.match(/versionCode\s+(\d+)/);
  const appIdMatch = gradleContent.match(/applicationId\s+["']([^"']+)["']/);

  console.log(`[4] Android build.gradle -> versionName: ${versionNameMatch?.[1]}, versionCode: ${versionCodeMatch?.[1]}, appId: ${appIdMatch?.[1]}`);
  assert(versionNameMatch, 'versionName found in build.gradle');
  assert.strictEqual(versionNameMatch[1], canonicalVersion, 'Android versionName must be 1.0.0');
  assert(versionCodeMatch, 'versionCode found in build.gradle');
  assert.strictEqual(versionCodeMatch[1], '1', 'Android versionCode must be 1');
  assert.strictEqual(appIdMatch[1], 'com.novara.placement', 'Android applicationId must be com.novara.placement');

  // 5. Check Capacitor configuration
  const capPath = path.resolve(__dirname, '..', 'capacitor.config.json');
  const cap = JSON.parse(fs.readFileSync(capPath, 'utf8'));
  console.log(`[5] Capacitor config -> appId: ${cap.appId}, appName: ${cap.appName}`);
  assert.strictEqual(cap.appId, 'com.novara.placement');
  assert.strictEqual(cap.appName, 'NOVARA');

  // 6. Check Service Worker cache identifier
  const swPath = path.resolve(__dirname, '..', 'public', 'sw.js');
  const swContent = fs.readFileSync(swPath, 'utf8');
  assert(swContent.includes('novara-app-shell-v1.0.0'), 'Service worker cache identifier matches v1.0.0');
  console.log('[6] Service Worker Cache Identifier: novara-app-shell-v1.0.0');

  console.log('\n================================================================');
  console.log('  ALL VERSION & DEPLOYMENT CONSISTENCY CHECKS PASSED (100%)    ');
  console.log('================================================================\n');
}

testVersionConsistency().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
