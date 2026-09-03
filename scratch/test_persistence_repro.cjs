/**
 * Reproduction & Verification Test for Auth & User Data Persistence
 */
const assert = require('assert');

async function runRepro() {
  console.log('--- REPRODUCING USER PERSISTENCE LIFECYCLE ---');

  const {
    signupUser,
    loginUser,
    validateSessionToken,
    logoutSession,
    updateUserProfile,
    updateUserRoadmap,
    saveUserDailyTasks,
    getFullUserState,
    loadDb,
    saveDb
  } = await import('file:///f:/NOVARA/server/db.js');

  const testEmail = `persistence_test_${Date.now()}@novara.dev`;
  const testPassword = 'TestPassword123!';
  const testName = 'Persistence Tester';

  // 1. Signup
  console.log('\n[Step 1] Signup User...');
  const signupResult = signupUser({ name: testName, email: testEmail, password: testPassword });
  assert(signupResult && signupResult.token, 'Signup returned token');
  const userId = signupResult.user.id;
  const token1 = signupResult.token;
  console.log(`User created: ${userId}, Token: ${token1.slice(0, 20)}...`);

  // 2. Validate session token
  const authUser1 = validateSessionToken(token1);
  assert(authUser1 && authUser1.id === userId, 'Session token is valid');

  // 3. User uploads roadmap and generates plan
  console.log('\n[Step 2] Upload Roadmap & Generate Tasks...');
  const sampleRoadmap = {
    title: 'Custom Placement Roadmap',
    phases: [
      {
        id: 'phase-1',
        title: 'Phase 1: Core DSA',
        topics: [
          { id: 'topic-1', name: 'Arrays and strings', status: 'in_progress', difficulty: 'Medium' },
          { id: 'topic-2', name: 'Linked Lists', status: 'upcoming', difficulty: 'Easy' }
        ]
      }
    ]
  };

  const sampleTasks = [
    {
      id: 'task-1',
      name: 'Arrays and strings — Practice 2 problems',
      durationMinutes: 45,
      completed: false
    }
  ];

  updateUserProfile(userId, {
    targetRole: 'Software Engineer',
    hasCompletedOnboarding: true
  });
  updateUserRoadmap(userId, sampleRoadmap);
  saveUserDailyTasks(userId, sampleRoadmap, sampleTasks);

  // 4. Verify user state before logout
  console.log('\n[Step 3] Verify User State Before Logout...');
  const stateBeforeLogout = getFullUserState(userId);
  assert.strictEqual(stateBeforeLogout.profile.hasCompletedOnboarding, true, 'hasCompletedOnboarding is true');
  assert(stateBeforeLogout.roadmap !== null, 'Roadmap is saved');
  assert.strictEqual(stateBeforeLogout.roadmap.title, 'Custom Placement Roadmap', 'Roadmap title matches');
  assert.strictEqual(stateBeforeLogout.tasks.length, 1, 'Tasks length is 1');
  console.log('State before logout is complete and valid.');

  // 5. Logout
  console.log('\n[Step 4] Logout User...');
  logoutSession(token1);
  const authUserAfterLogout = validateSessionToken(token1);
  assert.strictEqual(authUserAfterLogout, null, 'Old token is invalidated');

  // 6. Login Again with SAME Credentials
  console.log('\n[Step 5] Login Again with Same Credentials...');
  const loginResult = loginUser({ email: testEmail, password: testPassword });
  assert(loginResult && loginResult.token, 'Login returned token');
  assert.strictEqual(loginResult.user.id, userId, 'User ID matches original user');
  const token2 = loginResult.token;
  console.log(`Logged in again. User ID: ${loginResult.user.id}, New Token: ${token2.slice(0, 20)}...`);

  // 7. Validate new token & Fetch full user state
  console.log('\n[Step 6] Validate New Token & Fetch Full User State...');
  const authUser2 = validateSessionToken(token2);
  assert(authUser2 && authUser2.id === userId, 'New session token belongs to same user');

  const stateAfterLogin = getFullUserState(authUser2.id);
  console.log('State after login:');
  console.log('- Profile hasCompletedOnboarding:', stateAfterLogin.profile.hasCompletedOnboarding);
  console.log('- Roadmap:', stateAfterLogin.roadmap ? stateAfterLogin.roadmap.title : 'NULL');
  console.log('- Tasks count:', stateAfterLogin.tasks ? stateAfterLogin.tasks.length : 0);

  assert.strictEqual(stateAfterLogin.profile.hasCompletedOnboarding, true, 'hasCompletedOnboarding must be preserved');
  assert(stateAfterLogin.roadmap !== null, 'Roadmap must not be null');
  assert.strictEqual(stateAfterLogin.roadmap.title, 'Custom Placement Roadmap', 'Roadmap title must match');
  assert.strictEqual(stateAfterLogin.tasks.length, 1, 'Tasks count must match');

  console.log('\n🎉 BACKEND PERSISTENCE LIFECYCLE VERIFIED!');
}

runRepro().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
