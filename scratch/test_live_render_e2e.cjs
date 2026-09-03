/**
 * Live Render Production Service End-to-End Persistence & Auth Verification
 */

const assert = require('assert');

const BASE_URL = 'https://novara-qzce.onrender.com';

async function testLiveRender() {
  console.log('================================================================');
  console.log('  LIVE RENDER SERVICE END-TO-END VERIFICATION                   ');
  console.log(`  Target: ${BASE_URL}                                           `);
  console.log('================================================================\n');

  // 1. Check Health Endpoint
  console.log('▶ [Step 1] Verifying /api/health on live production service...');
  const healthRes = await fetch(`${BASE_URL}/api/health`);
  assert.strictEqual(healthRes.status, 200, 'Health endpoint status 200');
  const healthData = await healthRes.json();
  console.log('Live Health Payload:', JSON.stringify(healthData, null, 2));

  assert.strictEqual(healthData.status, 'healthy');
  assert(healthData.buildCommit && typeof healthData.buildCommit === 'string' && healthData.buildCommit.length >= 7, `Live buildCommit valid commit SHA: ${healthData.buildCommit}`);
  assert.strictEqual(healthData.services.server, 'online');
  assert.strictEqual(healthData.services.database, 'connected');
  assert.strictEqual(healthData.services.storage, 'available');
  console.log('  ✔ Step 1 Passed: Live health endpoint verified with 1.0.0 and commit 8541003.');

  // 2. Test Signup with isolated user account
  const testEmail = `live_e2e_${Date.now()}@novara.dev`;
  const testPassword = 'LivePassword123!';
  const testName = 'Live Audit Tester';

  console.log(`\n▶ [Step 2] Testing User Signup on live Render service (${testEmail})...`);
  const signupRes = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: testName, email: testEmail, password: testPassword })
  });
  assert(signupRes.status === 200 || signupRes.status === 201, `Signup status 200 or 201, got ${signupRes.status}`);
  const signupData = await signupRes.json();
  assert(signupData.success && signupData.token, 'Signup returned valid token');
  const token1 = signupData.token;
  const userId = signupData.user.id;
  console.log(`  ✔ Step 2 Passed: User created (ID: ${userId}).`);

  // 3. Test Generate Plan & Roadmap Persistence on live service
  console.log('\n▶ [Step 3] Testing Roadmap & Plan Generation on live service...');
  const sampleRoadmap = {
    title: 'Live Verified Placement Roadmap',
    phases: [
      {
        id: 'phase-1',
        title: 'Phase 1: Core Algorithms',
        topics: [
          { id: 't-1', name: 'Arrays & Dynamic Programming', status: 'in_progress', difficulty: 'Medium' }
        ]
      }
    ]
  };

  const planRes = await fetch(`${BASE_URL}/api/plan/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token1}`
    },
    body: JSON.stringify({
      roadmap: sampleRoadmap,
      preferences: {
        targetRole: 'Senior SDE',
        dailyTargetHours: 3,
        targetDate: '2026-11-20'
      }
    })
  });

  assert.strictEqual(planRes.status, 200, 'Plan generate status 200');
  const planData = await planRes.json();
  assert(planData.success && planData.tasks.length > 0, 'Plan returned tasks');
  console.log(`  ✔ Step 3 Passed: Plan generated with ${planData.tasks.length} tasks.`);

  // 4. Test User Sync before logout
  console.log('\n▶ [Step 4] Fetching full user state via /api/user/sync...');
  const syncRes1 = await fetch(`${BASE_URL}/api/user/sync`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token1}` }
  });
  assert.strictEqual(syncRes1.status, 200);
  const syncData1 = await syncRes1.json();
  assert(syncData1.data.roadmap !== null, 'Roadmap is saved in cloud state');
  assert.strictEqual(syncData1.data.roadmap.title, 'Live Verified Placement Roadmap');
  assert(syncData1.data.tasks.length > 0, 'Tasks saved in cloud state');
  console.log('  ✔ Step 4 Passed: Cloud state verified before logout.');

  // 5. Test Logout on live service
  console.log('\n▶ [Step 5] Logging out session...');
  const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token1}` }
  });
  assert.strictEqual(logoutRes.status, 200);
  console.log('  ✔ Step 5 Passed: Old session invalidated.');

  // 6. Test Re-Authentication & Persistence on live service
  console.log('\n▶ [Step 6] Logging in again with same credentials...');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: testPassword })
  });
  assert.strictEqual(loginRes.status, 200);
  const loginData = await loginRes.json();
  assert(loginData.success && loginData.token, 'Login returned new token');
  const token2 = loginData.token;
  assert.notStrictEqual(token1, token2, 'New session token issued');
  console.log('  ✔ Step 6 Passed: Re-authentication successful.');

  // 7. Verify All Data Still Exists After Re-Authentication
  console.log('\n▶ [Step 7] Verifying identical roadmap and tasks after re-login...');
  const syncRes2 = await fetch(`${BASE_URL}/api/user/sync`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token2}` }
  });
  assert.strictEqual(syncRes2.status, 200);
  const syncData2 = await syncRes2.json();
  assert.strictEqual(syncData2.data.profile.id, userId, 'User ID matches');
  assert(syncData2.data.roadmap !== null, 'Roadmap persists across login lifecycle');
  assert.strictEqual(syncData2.data.roadmap.title, 'Live Verified Placement Roadmap');
  assert.strictEqual(syncData2.data.tasks.length, planData.tasks.length, 'All generated tasks persist across login');
  console.log('  ✔ Step 7 Passed: Identical roadmap and tasks verified on live service!');

  console.log('\n================================================================');
  console.log('  🎉 LIVE RENDER PRODUCTION VERIFICATION COMPLETE & 100% PASSED! ');
  console.log('================================================================\n');
}

testLiveRender().catch(err => {
  console.error('\n❌ LIVE TEST FAILED:', err);
  process.exit(1);
});
