/**
 * NOVARA Comprehensive User Data Persistence & Auth Security Regression Test Suite
 * Tests:
 * - Test A: Single user persistence across logout / login lifecycle
 * - Test B: Cross-device login (different session token, same user data)
 * - Test C: Multi-user isolation (User A data completely inaccessible to User B)
 * - Test D: File upload persistence & user isolation
 * - Test E: Duplicate plan protection & task progress preservation
 * - Test F: Session expiration handling
 * - Test G: Password security (passwords hashed, never plaintext anywhere in db)
 */

const assert = require('assert');
const crypto = require('crypto');

async function runTestSuite() {
  console.log('===============================================================');
  console.log('  NOVARA USER DATA PERSISTENCE & SECURITY REGRESSION SUITE     ');
  console.log('===============================================================\n');

  const {
    signupUser,
    loginUser,
    validateSessionToken,
    logoutSession,
    updateUserProfile,
    updateUserRoadmap,
    saveUserDailyTasks,
    getFullUserState,
    toggleTaskCompletionOnServer,
    recordUploadedFile,
    getUserUploadedFiles,
    loadDb
  } = await import('file:///f:/NOVARA/server/db.js');

  const { fileStorageService } = await import('file:///f:/NOVARA/server/storageService.js');

  // ---------------------------------------------------------------------------
  // TEST A: Single user persistence across logout / login
  // ---------------------------------------------------------------------------
  console.log('▶ [TEST A] Single user persistence across logout/login...');
  const userAEmail = `tester_a_${Date.now()}@novara.dev`;
  const userAPassword = 'SecurePassword123!';
  const userAName = 'User Alpha';

  const userASignup = signupUser({ name: userAName, email: userAEmail, password: userAPassword });
  assert(userASignup && userASignup.token, 'Test A: Signup successful');
  const userAId = userASignup.user.id;
  const userAToken1 = userASignup.token;

  const testRoadmapA = {
    title: 'Alpha SDE Placement Roadmap',
    phases: [
      {
        id: 'phase-1',
        title: 'Phase 1: DSA',
        topics: [
          { id: 'topic-1', name: 'Arrays & Strings', status: 'in_progress', difficulty: 'Medium' }
        ]
      }
    ]
  };

  const testTasksA = [
    {
      id: 'task-a-1',
      name: 'Arrays and strings — Solve 2 problems',
      durationMinutes: 45,
      completed: false,
      subtasks: [{ id: 'st-1', title: 'Two Pointers', done: false }]
    }
  ];

  updateUserProfile(userAId, { targetRole: 'Backend Engineer', dailyStudyMinutes: 240, hasCompletedOnboarding: true });
  updateUserRoadmap(userAId, testRoadmapA);
  saveUserDailyTasks(userAId, testRoadmapA, testTasksA);

  // Mark task completed
  toggleTaskCompletionOnServer(userAId, 'task-a-1');

  // Verify state before logout
  const stateA1 = getFullUserState(userAId);
  assert.strictEqual(stateA1.profile.targetRole, 'Backend Engineer');
  assert.strictEqual(stateA1.roadmap.title, 'Alpha SDE Placement Roadmap');
  assert.strictEqual(stateA1.tasks[0].completed, true, 'Task completed state must be true');

  // Logout
  logoutSession(userAToken1);
  assert.strictEqual(validateSessionToken(userAToken1), null, 'Old token invalidated on logout');

  // Login again
  const userALogin = loginUser({ email: userAEmail, password: userAPassword });
  assert(userALogin && userALogin.token, 'Login successful');
  assert.strictEqual(userALogin.user.id, userAId, 'User ID matches across sessions');

  // Hydrate user state with new token
  const userAToken2 = userALogin.token;
  const authUserA2 = validateSessionToken(userAToken2);
  assert(authUserA2 && authUserA2.id === userAId);

  const stateA2 = getFullUserState(userAId);
  assert.strictEqual(stateA2.profile.hasCompletedOnboarding, true);
  assert.strictEqual(stateA2.profile.targetRole, 'Backend Engineer');
  assert.strictEqual(stateA2.roadmap.title, 'Alpha SDE Placement Roadmap');
  assert.strictEqual(stateA2.tasks.length, 1);
  assert.strictEqual(stateA2.tasks[0].completed, true, 'Task completed state persisted across logout/login');
  console.log('  ✔ TEST A PASSED: All user data, roadmap, and task progress persisted across login.\n');

  // ---------------------------------------------------------------------------
  // TEST B: Cross-device login (different token, same user data)
  // ---------------------------------------------------------------------------
  console.log('▶ [TEST B] Cross-device login (multiple active sessions)...');
  const userALoginDevice2 = loginUser({ email: userAEmail, password: userAPassword });
  const userATokenDevice2 = userALoginDevice2.token;
  assert.notStrictEqual(userATokenDevice2, userAToken2, 'Device 2 gets unique session token');

  const authUserDevice2 = validateSessionToken(userATokenDevice2);
  assert.strictEqual(authUserDevice2.id, userAId, 'Device 2 session maps to same user');

  const stateDevice2 = getFullUserState(authUserDevice2.id);
  assert.strictEqual(stateDevice2.roadmap.title, 'Alpha SDE Placement Roadmap');
  assert.strictEqual(stateDevice2.tasks[0].id, 'task-a-1');
  console.log('  ✔ TEST B PASSED: Cross-device sessions access identical authoritative data.\n');

  // ---------------------------------------------------------------------------
  // TEST C: Multi-user data isolation (User A vs User B)
  // ---------------------------------------------------------------------------
  console.log('▶ [TEST C] Multi-user data isolation...');
  const userBEmail = `tester_b_${Date.now()}@novara.dev`;
  const userBPassword = 'SecurePassword456!';
  const userBName = 'User Beta';

  const userBSignup = signupUser({ name: userBName, email: userBEmail, password: userBPassword });
  const userBId = userBSignup.user.id;
  assert.notStrictEqual(userBId, userAId, 'User B has distinct unique user ID');

  const testRoadmapB = {
    title: 'Beta Data Science Roadmap',
    phases: [{ id: 'phase-b1', title: 'Phase 1: ML Basics', topics: [{ id: 't-b1', name: 'Pandas & Numpy' }] }]
  };
  const testTasksB = [{ id: 'task-b-1', name: 'Pandas Dataframes', completed: false }];

  updateUserRoadmap(userBId, testRoadmapB);
  saveUserDailyTasks(userBId, testRoadmapB, testTasksB);

  const stateB = getFullUserState(userBId);
  const stateA = getFullUserState(userAId);

  assert.strictEqual(stateB.roadmap.title, 'Beta Data Science Roadmap');
  assert.strictEqual(stateA.roadmap.title, 'Alpha SDE Placement Roadmap');
  assert.notStrictEqual(stateB.tasks[0].id, stateA.tasks[0].id);
  assert.strictEqual(stateB.tasks[0].completed, false);
  assert.strictEqual(stateA.tasks[0].completed, true);
  console.log('  ✔ TEST C PASSED: Absolute user data isolation verified.\n');

  // ---------------------------------------------------------------------------
  // TEST D: Upload file persistence & user ownership
  // ---------------------------------------------------------------------------
  console.log('▶ [TEST D] File upload persistence & user ownership...');
  const samplePdfBuffer = Buffer.from('%PDF-1.4 sample pdf content for novara testing');
  const uploaded = await fileStorageService.uploadUserRoadmapFile(userAId, samplePdfBuffer, 'my_syllabus.pdf');
  assert(uploaded && uploaded.fileId, 'File uploaded to storage');
  recordUploadedFile(userAId, uploaded);

  const userAFiles = getUserUploadedFiles(userAId);
  const userBFiles = getUserUploadedFiles(userBId);

  assert(userAFiles.length >= 1, 'User A has uploaded file recorded');
  assert.strictEqual(userBFiles.length, 0, 'User B cannot see User A uploaded files');
  assert.strictEqual(userAFiles[0].fileName, 'my_syllabus.pdf');
  console.log('  ✔ TEST D PASSED: Uploaded file recorded with verified user ownership.\n');

  // ---------------------------------------------------------------------------
  // TEST E: Duplicate plan protection & task progress preservation
  // ---------------------------------------------------------------------------
  console.log('▶ [TEST E] Duplicate plan protection & task progress preservation...');
  const existingCompletedTask = stateA.tasks[0];
  assert.strictEqual(existingCompletedTask.completed, true);

  // Generate plan again with identical roadmap
  saveUserDailyTasks(userAId, testRoadmapA, [
    {
      id: 'task-a-1',
      name: 'Arrays and strings — Solve 2 problems',
      durationMinutes: 45,
      completed: false // raw incoming task is false
    },
    {
      id: 'task-a-2',
      name: 'Linked Lists — Solve 2 problems',
      durationMinutes: 45,
      completed: false
    }
  ]);

  const stateAAfterRegen = getFullUserState(userAId);
  assert.strictEqual(stateAAfterRegen.tasks.length, 2);
  const preservedTask = stateAAfterRegen.tasks.find(t => t.id === 'task-a-1');
  assert(preservedTask, 'Task a-1 found');
  assert.strictEqual(preservedTask.completed, true, 'Task a-1 completion was preserved!');
  console.log('  ✔ TEST E PASSED: Duplicate plan generation preserved completed progress.\n');

  // ---------------------------------------------------------------------------
  // TEST F: Session expiration handling
  // ---------------------------------------------------------------------------
  console.log('▶ [TEST F] Session expiration validation...');
  const db = loadDb();
  const expiredToken = `session_${userAId}_expired_test`;
  db.sessions.push({
    token: expiredToken,
    userId: userAId,
    expiresAt: new Date(Date.now() - 1000 * 60).toISOString() // expired 1 min ago
  });
  // Note: we don't need to saveDb for this in-memory test if loadDb reads from disk,
  // but let's test validateSessionToken behavior
  const { saveDb } = await import('file:///f:/NOVARA/server/db.js');
  saveDb(db);

  const expiredResult = validateSessionToken(expiredToken);
  assert.strictEqual(expiredResult, null, 'Expired session token rejected');
  console.log('  ✔ TEST F PASSED: Expired session tokens safely rejected.\n');

  // ---------------------------------------------------------------------------
  // TEST G: Password security (Never plaintext, securely hashed)
  // ---------------------------------------------------------------------------
  console.log('▶ [TEST G] Password security audit...');
  const currentDb = loadDb();
  const foundUserA = currentDb.users.find(u => u.id === userAId);
  assert(foundUserA, 'User A exists in DB');
  assert.strictEqual(foundUserA.password, undefined, 'Plaintext password field MUST NOT exist');
  assert(foundUserA.passwordHash, 'Password hash exists');
  assert.notStrictEqual(foundUserA.passwordHash, userAPassword, 'Password hash is NOT plaintext');
  assert(foundUserA.passwordHash.startsWith('pbkdf2$100000$'), 'Password hash uses salted PBKDF2 with 100,000 iterations');
  const hashParts = foundUserA.passwordHash.split('$');
  assert.strictEqual(hashParts.length, 4, 'PBKDF2 hash has 4 sections');
  assert.strictEqual(hashParts[2].length, 32, 'Salt is 16 bytes hex');
  assert.strictEqual(hashParts[3].length, 128, 'Key is 64 bytes SHA-512 hex');

  const sanitized = getFullUserState(userAId).profile;
  assert.strictEqual(sanitized.password, undefined);
  assert.strictEqual(sanitized.passwordHash, undefined, 'Password hash is stripped from public API user object');
  console.log('  ✔ TEST G PASSED: Passwords securely hashed with zero plaintext exposure.\n');

  console.log('===============================================================');
  console.log('  ALL PERSISTENCE & SECURITY REGRESSION TESTS PASSED (100%)    ');
  console.log('===============================================================\n');
}

runTestSuite().catch(err => {
  console.error('\n❌ TEST SUITE FAILED:', err);
  process.exit(1);
});
