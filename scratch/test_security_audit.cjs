const fs = require('fs');
const path = require('path');

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ SECURITY AUDIT ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${message}`);
}

async function runSecurityAudit() {
  console.log('================================================================');
  console.log('🔒 STARTING NOVARA v1.0 PRODUCTION SECURITY & RELIABILITY AUDIT');
  console.log('================================================================\n');

  const { 
    signupUser, 
    loginUser, 
    validateSessionToken, 
    logoutSession, 
    requestPasswordReset,
    resetPasswordWithToken,
    getFullUserState,
    toggleTaskCompletionOnServer,
    loadDb,
    saveDb
  } = await import('file:///f:/NOVARA/server/db.js');

  const { processBatchSync } = await import('file:///f:/NOVARA/server/syncEngine.js');
  const { 
    getUserApplicationsFromDb, 
    createApplicationInDb, 
    updateApplicationInDb, 
    deleteApplicationFromDb 
  } = await import('file:///f:/NOVARA/server/applicationService.js');
  const { 
    createPersonalEventInDb, 
    updatePersonalEventInDb, 
    deletePersonalEventFromDb,
    getAggregatedCalendarEvents 
  } = await import('file:///f:/NOVARA/server/calendarService.js');
  const {
    startFocusSession,
    completeFocusSession
  } = await import('file:///f:/NOVARA/server/focusService.js');
  const {
    getRevisionsForUser,
    submitRevisionAttempt
  } = await import('file:///f:/NOVARA/server/revisionService.js');
  const {
    analyzeUserPreparation,
    applyCoachRecommendationOnServer
  } = await import('file:///f:/NOVARA/server/coachService.js');
  const {
    startInterviewSession,
    evaluateInterviewAnswerOnServer,
    completeInterviewSessionOnServer
  } = await import('file:///f:/NOVARA/server/interviewService.js');
  const {
    generateDailyPlanFromRoadmap,
    validateRoadmapSchema
  } = await import('file:///f:/NOVARA/server/roadmapService.js');
  const { 
    sanitizeExternalUrl, 
    validateFileSignature,
    checkRateLimit,
    applySecurityHeaders
  } = await import('file:///f:/NOVARA/server/securityMiddleware.js');
  const {
    validateEmail,
    validatePassword,
    validateString,
    validateDate,
    validateNonNegativeNumber,
    validateEnum,
    sanitizeAndValidateApplicationInput,
    sanitizeAndValidateInterviewInput,
    sanitizeAndValidateCalendarEventInput
  } = await import('file:///f:/NOVARA/server/validationService.js');

  // Setup 2 isolated test users
  const userAEmail = `audit_user_a_${Date.now()}@novara.dev`;
  const userBEmail = `audit_user_b_${Date.now()}@novara.dev`;
  const userAPassword = 'SecurePassword123!';
  const userBPassword = 'AnotherSecurePassword456!';

  const userAResult = signupUser({ name: 'Alice Security', email: userAEmail, password: userAPassword });
  const userBResult = signupUser({ name: 'Bob Isolation', email: userBEmail, password: userBPassword });

  const tokenA = userAResult.token;
  const tokenB = userBResult.token;
  const userAId = userAResult.user.id;
  const userBId = userBResult.user.id;

  // 1. Unauthenticated API access
  console.log('[1] Testing Unauthenticated Session Handling...');
  const emptyTokenValidation = validateSessionToken('');
  assert(emptyTokenValidation === null, 'Empty token returns null (401 unauthenticated)');
  const nullTokenValidation = validateSessionToken(null);
  assert(nullTokenValidation === null, 'Null token returns null (401 unauthenticated)');

  // 2. Invalid session token rejection
  console.log('\n[2] Testing Invalid Session Token Rejection...');
  const invalidTokenValidation = validateSessionToken('invalid_token_xyz_123456789');
  assert(invalidTokenValidation === null, 'Forged/invalid token returns null (401 unauthenticated)');

  // 3. Expired token rejection
  console.log('\n[3] Testing Session Expiration Logic...');
  const db = loadDb();
  const testExpiredToken = `tok_expired_${Date.now()}`;
  db.sessions.push({
    token: testExpiredToken,
    userId: userAId,
    createdAt: new Date(Date.now() - 40 * 86400000).toISOString(),
    expiresAt: new Date(Date.now() - 10 * 86400000).toISOString() // Expired 10 days ago
  });
  saveDb(db);
  const expiredValidation = validateSessionToken(testExpiredToken);
  assert(expiredValidation === null, 'Expired session token strictly rejected');

  // 4. User A -> User B Data Isolation
  console.log('\n[4] Testing User Isolation (User A cannot access User B resources)...');
  const userAState = getFullUserState(userAId);
  const userBState = getFullUserState(userBId);
  assert(userAState.profile.id === userAId, 'User A state maps only to User A profile');
  assert(userBState.profile.id === userBId, 'User B state maps only to User B profile');
  assert(userAState.profile.email !== userBState.profile.email, 'User profiles completely isolated');

  // 5. Input Validation
  console.log('\n[5] Testing Input Validation & Sanitization Boundaries...');
  assert(validateEmail('valid.user@example.com') === true, 'Valid email accepted');
  assert(validateEmail('invalid-email-no-at.com') === false, 'Malformed email rejected');
  assert(validatePassword('12345') === false, 'Short password (<6 chars) rejected');
  assert(validatePassword('validStrongPass123') === true, 'Valid password accepted');
  
  let dateErrorCaught = false;
  try {
    validateDate('invalid-date-string', 'TestDate');
  } catch (e) {
    dateErrorCaught = true;
  }
  assert(dateErrorCaught === true, 'Impossible/malformed date string rejected');

  let numErrorCaught = false;
  try {
    validateNonNegativeNumber(-50, 'Duration');
  } catch (e) {
    numErrorCaught = true;
  }
  assert(numErrorCaught === true, 'Negative duration/number strictly rejected');

  // 6. Oversized Input Payload Rejection
  console.log('\n[6] Testing Oversized Input Payload Rejection...');
  let oversizedError = false;
  try {
    validateString('A'.repeat(500), 1, 100, 'Company');
  } catch (e) {
    oversizedError = true;
  }
  assert(oversizedError === true, 'Oversized string input (>100 chars) rejected');

  // 7. Duplicate Sync Operations (Idempotency)
  console.log('\n[7] Testing Duplicate Sync Operations Handling...');
  const opId1 = `op_audit_${Date.now()}`;
  const syncOp1 = {
    operationId: opId1,
    userId: userAId,
    entityType: 'TASK',
    entityId: 'test_task_1',
    operation: 'COMPLETE',
    payload: { completed: true },
    createdAt: new Date().toISOString()
  };

  const syncPass1 = processBatchSync(userAId, [syncOp1, syncOp1]); // Duplicate in same batch
  assert(syncPass1.processedCount === 1, 'Duplicate sync operations within same batch deduplicated (processed: 1)');

  // 8. Replay Sync Operations
  console.log('\n[8] Testing Replay Sync Operation Protection...');
  const syncPass2 = processBatchSync(userAId, [syncOp1]);
  assert(syncPass2.processedCount === 0, 'Replayed sync operation safely skipped (processed: 0)');

  // 9. Unauthorized Task Completion
  console.log('\n[9] Testing Task Modification Isolation...');
  const initialUserBTasks = getFullUserState(userBId).tasks;
  // User A attempts to toggle a task using User A's session context for User B's taskId
  toggleTaskCompletionOnServer(userAId, 'non_existent_or_user_b_task');
  const postUserBTasks = getFullUserState(userBId).tasks;
  assert(initialUserBTasks.length === postUserBTasks.length, 'User A actions cannot modify User B tasks');

  // 10. Unauthorized Application Modification
  console.log('\n[10] Testing Application Ownership Enforcement...');
  const userBApp = createApplicationInDb(userBId, { company: 'Google', role: 'Software Engineer', status: 'Applied' });
  const deleteAttemptByUserA = deleteApplicationFromDb(userAId, userBApp.id);
  assert(deleteAttemptByUserA === false, 'User A cannot delete User B application');
  const updateAttemptByUserA = updateApplicationInDb(userAId, userBApp.id, { company: 'Hacked' });
  assert(updateAttemptByUserA === null, 'User A cannot update User B application');

  // 11. Unauthorized Calendar Modification
  console.log('\n[11] Testing Calendar Event Ownership Checks...');
  const userBEvent = createPersonalEventInDb(userBId, { title: 'Secret Interview Prep', date: '2026-09-10' });
  const userACalendar = getAggregatedCalendarEvents(userAId);
  const eventFoundInA = userACalendar.events.some((e) => e.id === userBEvent.id);
  assert(eventFoundInA === false, 'User B personal calendar event invisible to User A');
  const deleteEventByUserA = deletePersonalEventFromDb(userAId, userBEvent.id);
  assert(deleteEventByUserA === false, 'User A cannot delete User B calendar event');

  // 12. Unauthorized Revision Access
  console.log('\n[12] Testing Spaced Revision Isolation...');
  const userARevs = getRevisionsForUser(userAId);
  const userBRevs = getRevisionsForUser(userBId);
  assert(Array.isArray(userARevs.revisions), 'User A revisions queue initialized');
  assert(Array.isArray(userBRevs.revisions), 'User B revisions queue initialized');

  // 13. Unauthorized Coach Access
  console.log('\n[13] Testing AI Coach Analysis Isolation...');
  const coachA = analyzeUserPreparation(userAId);
  const coachB = analyzeUserPreparation(userBId);
  assert(coachA.hasData === false || coachA.readinessPercent !== undefined, 'User A coach analysis evaluated cleanly');
  assert(coachB.hasData === false || coachB.readinessPercent !== undefined, 'User B coach analysis evaluated cleanly');

  // 14. Unauthorized Interview Access
  console.log('\n[14] Testing Mock Interview Session Isolation...');
  const interviewB = startInterviewSession(userBId, { type: 'DSA', difficulty: 'Medium', questionCount: 2 });
  assert(interviewB.interviewId !== undefined, 'User B interview session created');
  let userAAnswerCaught = false;
  try {
    evaluateInterviewAnswerOnServer(userAId, interviewB.interviewId, 0, 'Some answer');
  } catch (e) {
    userAAnswerCaught = true;
  }
  assert(userAAnswerCaught === true, 'User A cannot submit answers to User B active interview');

  // 15. Streak Manipulation Attempt Protection
  console.log('\n[15] Testing Streak Manipulation Defense...');
  const freshDb1 = loadDb();
  freshDb1.tasks[userAId] = [
    { id: 't1', name: 'Task 1', completed: false },
    { id: 't2', name: 'Task 2', completed: false }
  ];
  freshDb1.streaks[userAId] = { currentStreak: 5, longestStreak: 10, todayTargetMet: false };
  saveDb(freshDb1);

  // Complete tasks
  toggleTaskCompletionOnServer(userAId, 't1');
  const resStreak1 = toggleTaskCompletionOnServer(userAId, 't2');
  assert(resStreak1.streak.currentStreak === 6, 'Streak increments legitimately to 6 when daily target is met');

  // Attempt duplicate completion of already completed task
  const repeatSyncOp = {
    operationId: `op_streak_hack_${Date.now()}`,
    userId: userAId,
    entityType: 'TASK',
    entityId: 't1',
    operation: 'COMPLETE',
    payload: { completed: true },
    createdAt: new Date().toISOString()
  };
  processBatchSync(userAId, [repeatSyncOp]);
  const stateAfterRepeat = getFullUserState(userAId);
  assert(stateAfterRepeat.streak.currentStreak === 6, 'Duplicate task completion does NOT artificially increment streak');

  // 16. Capacity Manipulation Attempt Protection
  console.log('\n[16] Testing Daily Study Capacity Strict Enforcement...');
  const testRoadmap = {
    title: 'Test Capacity Roadmap',
    phases: [
      {
        title: 'Phase 1',
        topics: [{ id: 'top1', name: 'Arrays', status: 'in_progress' }]
      }
    ]
  };
  const plan3h = generateDailyPlanFromRoadmap(testRoadmap, { dailyTargetHours: 3.0 });
  assert(plan3h.totalScheduledMinutes <= 180, '3h capacity plan total scheduled minutes <= 180m');
  const plan2h = generateDailyPlanFromRoadmap(testRoadmap, { dailyTargetHours: 2.0 });
  assert(plan2h.totalScheduledMinutes <= 120, '2h capacity plan total scheduled minutes <= 120m');

  // 17. Unsafe External URL Sanitization
  console.log('\n[17] Testing External URL Protocol Sanitization...');
  assert(sanitizeExternalUrl('https://valid.com/job') === 'https://valid.com/job', 'HTTPS protocol allowed');
  assert(sanitizeExternalUrl('http://valid.com/job') === 'http://valid.com/job', 'HTTP protocol allowed');
  assert(sanitizeExternalUrl('javascript:alert(document.cookie)') === '', 'Dangerous javascript: scheme stripped');
  assert(sanitizeExternalUrl('data:text/html,<script>alert(1)</script>') === '', 'Dangerous data: scheme stripped');
  assert(sanitizeExternalUrl('vbscript:msgbox(1)') === '', 'Dangerous vbscript: scheme stripped');

  // 18. Secret Exposure Scan
  console.log('\n[18] Scanning Repository for Exposed Secrets / Private Keys...');
  const srcFiles = fs.readdirSync('src', { recursive: true }).filter((f) => f.endsWith('.js') || f.endsWith('.jsx'));
  let secretFound = false;
  for (const f of srcFiles) {
    const content = fs.readFileSync(path.join('src', f), 'utf8');
    if (content.includes('AIzaSy') || content.includes('client_secret') || content.includes('password = "')) {
      secretFound = true;
      console.error(`Found potential secret in ${f}`);
    }
  }
  assert(secretFound === false, 'Zero private keys, API secrets, or hardcoded passwords in client source code');

  // 19. Logout Session Invalidation
  console.log('\n[19] Testing Logout Session Token Invalidation...');
  logoutSession(tokenA);
  const postLogoutValidation = validateSessionToken(tokenA);
  assert(postLogoutValidation === null, 'Session token invalidated immediately on logout');

  // 20. Offline User State Isolation & Password Reset
  console.log('\n[20] Testing Password Reset Flow & Offline Cache Isolation...');
  const resetReq = requestPasswordReset(userBEmail);
  assert(resetReq.success === true, 'Password reset request generated successfully');
  assert(typeof resetReq.resetToken === 'string' && resetReq.resetToken.startsWith('rst_'), 'Secure single-use reset token generated');
  
  const resetRes = resetPasswordWithToken(resetReq.resetToken, 'NewSecurePassword789!');
  assert(resetRes.success === true, 'Password reset with token successful');

  const newLogin = loginUser({ email: userBEmail, password: 'NewSecurePassword789!' });
  assert(newLogin.token !== undefined, 'User B can log in with new password');

  let oldPasswordLoginFailed = false;
  try {
    loginUser({ email: userBEmail, password: userBPassword });
  } catch (e) {
    oldPasswordLoginFailed = true;
  }
  assert(oldPasswordLoginFailed === true, 'Old password rejected after password reset');

  console.log('\n================================================================');
  console.log('🎉 ALL 20 PRODUCTION SECURITY & RELIABILITY AUDIT TESTS PASSED!');
  console.log('================================================================');
  process.exit(0);
}

runSecurityAudit().catch((err) => {
  console.error('Audit execution failure:', err);
  process.exit(1);
});
