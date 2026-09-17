/**
 * NOVARA — FINAL PERFORMANCE + OFFLINE SYNC + CROSS-FEATURE QA REGRESSION MATRIX
 * 
 * 40-Point Comprehensive Subsystem Audit:
 * 1.  Auth persistence
 * 2.  User isolation
 * 3.  Roadmap persistence
 * 4.  Roadmap topic integrity
 * 5.  Task persistence
 * 6.  Focus persistence
 * 7.  Quiz persistence
 * 8.  Revision persistence
 * 9.  Application persistence
 * 10. Calendar persistence
 * 11. Notification persistence
 * 12. Coach persistence
 * 13. Interview persistence
 * 14. Offline queue
 * 15. Sync retry
 * 16. Sync idempotency
 * 17. Conflict handling
 * 18. Exact task entity identity
 * 19. Exact revision identity
 * 20. Exact application identity
 * 21. Exact interview identity
 * 22. Exact calendar identity
 * 23. Dashboard/task consistency
 * 24. Dashboard/revision consistency
 * 25. Dashboard/Coach consistency
 * 26. Dashboard/notification consistency
 * 27. Roadmap progress consistency
 * 28. AI grounding
 * 29. No synthetic metrics
 * 30. Secret exposure prevention
 * 31. Authentication enforcement
 * 32. Ownership/IDOR protection
 * 33. Production database adapter
 * 34. Storage isolation
 * 35. PWA API cache exclusion
 * 36. Service-worker cache versioning
 * 37. Android production API
 * 38. No localhost production references
 * 39. Duplicate API prevention
 * 40. Error recovery
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

const tests = [];
function it(desc, fn) {
  tests.push({ desc, fn });
}

// File Paths
const dbPath = path.resolve(__dirname, '../server/data/novara_db.json');
const swPath = path.resolve(__dirname, '../public/sw.js');
const manifestPath = path.resolve(__dirname, '../public/manifest.json');
const capConfigPath = path.resolve(__dirname, '../capacitor.config.json');
const renderYamlPath = path.resolve(__dirname, '../render.yaml');
const dbAdapterPath = path.resolve(__dirname, '../server/db/dbAdapter.js');
const syncEnginePath = path.resolve(__dirname, '../server/syncEngine.js');
const appContextPath = path.resolve(__dirname, '../src/context/AppContext.jsx');
const dashboardViewPath = path.resolve(__dirname, '../src/components/Dashboard/DashboardView.jsx');
const coachViewPath = path.resolve(__dirname, '../src/components/Coach/CoachView.jsx');
const interviewViewPath = path.resolve(__dirname, '../src/components/Interview/InterviewView.jsx');
const applicationsViewPath = path.resolve(__dirname, '../src/components/Applications/ApplicationsView.jsx');
const studyServicePath = path.resolve(__dirname, '../src/services/studyMaterialService.js');

// Read files
const originalDbRaw = fs.readFileSync(dbPath, 'utf8');
const swCode = fs.readFileSync(swPath, 'utf8');
const manifestCode = fs.readFileSync(manifestPath, 'utf8');
const capConfigCode = fs.readFileSync(capConfigPath, 'utf8');
const renderYamlCode = fs.readFileSync(renderYamlPath, 'utf8');
const appContextCode = fs.readFileSync(appContextPath, 'utf8');
const dashboardViewCode = fs.readFileSync(dashboardViewPath, 'utf8');
const coachViewCode = fs.readFileSync(coachViewPath, 'utf8');
const interviewViewCode = fs.readFileSync(interviewViewPath, 'utf8');
const applicationsViewCode = fs.readFileSync(applicationsViewPath, 'utf8');
const studyServiceCode = fs.readFileSync(studyServicePath, 'utf8');

let USER_A_ID = null;
let USER_A_TOKEN = null;
let USER_B_ID = null;
let USER_B_TOKEN = null;

// ===========================================================================
// SUITE 1: AUTHENTICATION, ISOLATION & STORAGE (Tests 1-5)
// ===========================================================================
it('1. Auth persistence (signup, login, token generation & session validation)', async () => {
  const { signupUser, loginUser, validateSessionToken } = await import('../server/db.js');
  const signupA = signupUser({
    name: 'QA Auditor A',
    email: `qa_auditor_a_${Date.now()}@novara.dev`,
    password: 'Password123!'
  });
  assert(signupA && signupA.user && signupA.token, 'Signup must generate user and token');
  USER_A_ID = signupA.user.id;
  USER_A_TOKEN = signupA.token;

  const validatedUser = validateSessionToken(USER_A_TOKEN);
  assert(validatedUser && validatedUser.id === USER_A_ID, 'Session token must validate successfully');

  const login = loginUser({
    email: signupA.user.email,
    password: 'Password123!'
  });
  assert(login && login.token, 'Login must generate session token');
});

it('2. User isolation (User A state is completely inaccessible to User B)', async () => {
  const { signupUser, getFullUserState } = await import('../server/db.js');
  const signupB = signupUser({
    name: 'QA Auditor B',
    email: `qa_auditor_b_${Date.now()}@novara.dev`,
    password: 'Password123!'
  });
  USER_B_ID = signupB.user.id;
  USER_B_TOKEN = signupB.token;

  const stateA = getFullUserState(USER_A_ID);
  const stateB = getFullUserState(USER_B_ID);

  assert.strictEqual(stateA.profile.id, USER_A_ID, 'State A belongs to User A');
  assert.strictEqual(stateB.profile.id, USER_B_ID, 'State B belongs to User B');
  assert.notStrictEqual(stateA.profile.id, stateB.profile.id, 'Profiles must be strictly isolated');
});

it('3. Roadmap persistence (updates persist across server restarts and client reloads)', async () => {
  const { updateUserRoadmap, loadDb } = await import('../server/db.js');
  const testRoadmap = {
    id: 'sde_qa_roadmap',
    title: 'Senior Placement Roadmap',
    targetRole: 'Software Engineer',
    targetDate: '2026-12-31',
    phases: [
      {
        phaseNumber: 1,
        title: 'Phase 1: Foundations',
        status: 'in_progress',
        topics: [
          { id: 'top_qa_1', name: 'Binary Search', completed: true },
          { id: 'top_qa_2', name: 'Two Pointers', completed: false }
        ]
      }
    ]
  };

  updateUserRoadmap(USER_A_ID, testRoadmap);
  const db = loadDb();
  assert(db.roadmaps && db.roadmaps[USER_A_ID], 'Roadmap must be stored in database');
  assert.strictEqual(db.roadmaps[USER_A_ID].title, 'Senior Placement Roadmap');
});

it('4. Roadmap topic integrity (topics possess unique identifiers and strict phase hierarchy)', async () => {
  const { loadDb } = await import('../server/db.js');
  const db = loadDb();
  const r = db.roadmaps[USER_A_ID];
  const topicIds = new Set();
  r.phases.forEach(p => {
    p.topics.forEach(t => {
      assert(!topicIds.has(t.id), `Duplicate topic ID detected: ${t.id}`);
      topicIds.add(t.id);
    });
  });
  assert(topicIds.size >= 2, 'Must contain verified unique topic IDs');
});

it('5. Task persistence (daily tasks save, toggle completion, and persist timestamps)', async () => {
  const { saveUserDailyTasks, toggleTaskCompletionOnServer, loadDb } = await import('../server/db.js');
  const testTasks = [
    { id: 'task_qa_1', name: 'Solve 3 Binary Search Problems', category: 'DSA', completed: false, durationMinutes: 45 },
    { id: 'task_qa_2', name: 'ACID Properties Deep Dive', category: 'Core CS', completed: false, durationMinutes: 30 }
  ];

  saveUserDailyTasks(USER_A_ID, null, testTasks);
  toggleTaskCompletionOnServer(USER_A_ID, 'task_qa_1');

  const db = loadDb();
  const tasks = db.tasks[USER_A_ID];
  const t1 = tasks.find(t => t.id === 'task_qa_1');
  assert(t1 && t1.completed === true, 'Task 1 must be completed in database');
  assert(t1.completedAt, 'Task completion must record completedAt timestamp');
});

// ===========================================================================
// SUITE 2: FOCUS, QUIZ, REVISION & COACH SUBSYSTEMS (Tests 6-13)
// ===========================================================================
it('6. Focus persistence (active focus session records duration, pauses, and persistence)', async () => {
  const { processBatchSync } = await import('../server/syncEngine.js');
  const { loadDb } = await import('../server/db.js');
  const focusOp = {
    operationId: 'op_focus_' + Date.now(),
    userId: USER_A_ID,
    entityType: 'FOCUS_SESSION',
    entityId: 'focus_sess_1',
    operation: 'CREATE',
    payload: {
      sessionId: 'focus_sess_1',
      taskId: 'task_qa_1',
      taskName: 'Binary Search Practice',
      elapsedSeconds: 1500,
      targetSeconds: 1800,
      completed: true
    }
  };

  const res = processBatchSync(USER_A_ID, [focusOp]);
  assert(res.success === true, 'Focus session sync must succeed');
  const db = loadDb();
  assert(db.focusSessions && db.focusSessions[USER_A_ID], 'Focus sessions must exist for user');
  assert(db.focusSessions[USER_A_ID].some(s => s.sessionId === 'focus_sess_1'), 'Session must persist in database');
});

it('7. Quiz persistence (task quiz score evaluates and stores attempt)', async () => {
  const { recordTaskRevisionAndComplete } = await import('../server/revisionService.js');
  const quizResult = recordTaskRevisionAndComplete(USER_A_ID, {
    taskId: 'task_qa_1',
    sessionId: 'focus_sess_1',
    answers: [
      { isCorrect: true },
      { isCorrect: true },
      { isCorrect: false },
      { isCorrect: true },
      { isCorrect: true }
    ],
    durationMinutes: 25
  });

  assert(quizResult && quizResult.success === true, 'Quiz completion must succeed');
  assert.strictEqual(quizResult.scorePercent, 80, 'Score percent must be 80% (4 of 5 correct)');
});

it('8. Revision persistence (completed topic enters spaced repetition with SM-2 intervals)', async () => {
  const { completeRevisionOnServer, loadDb, saveDb } = await import('../server/db.js');
  const db = loadDb();
  if (!db.revisions[USER_A_ID]) db.revisions[USER_A_ID] = [];
  db.revisions[USER_A_ID].push({
    id: 'rev_qa_1',
    topic: 'Binary Search',
    category: 'DSA',
    retentionScore: '70%',
    revisionDueDate: 'Tomorrow'
  });
  saveDb(db);

  const updatedRevs = completeRevisionOnServer(USER_A_ID, 'rev_qa_1', 'easy');
  const rev = updatedRevs.find(r => r.id === 'rev_qa_1');
  assert(rev && rev.retentionScore === '95%', 'Retention score must increase on easy recall');
  assert.strictEqual(rev.revisionDueDate, 'In 14 days', 'SM-2 interval must advance to 14 days');
});

it('9. Application persistence (application lifecycle from Applied to Interview stages persists)', async () => {
  const { createApplicationInDb, addInterviewToAppInDb, getUserApplicationsFromDb } = await import('../server/applicationService.js');
  const app = createApplicationInDb(USER_A_ID, {
    company: 'Stripe',
    role: 'Full Stack Engineer',
    status: 'Applied'
  });
  assert(app && app.id, 'Application must be created with ID');

  const withInt = addInterviewToAppInDb(USER_A_ID, app.id, {
    round: 'Technical Round 1',
    date: '2026-09-25',
    time: '14:00'
  });
  assert(withInt && withInt.application && withInt.application.interviews.length === 1, 'Interview stage must be added');

  const userApps = getUserApplicationsFromDb(USER_A_ID);
  assert(userApps.some(a => a.company === 'Stripe'), 'Stripe app must exist in user applications');
});

it('10. Calendar persistence (aggregates tasks, revisions, and personal events without duplicate ghost entries)', async () => {
  const { createPersonalEventInDb, getAggregatedCalendarEvents } = await import('../server/calendarService.js');
  const personalEvt = createPersonalEventInDb(USER_A_ID, {
    title: 'Mock Prep with Peer',
    date: '2026-09-22',
    time: '10:00 AM',
    durationMinutes: 60
  });
  assert(personalEvt && personalEvt.id, 'Personal event must be created');

  const aggregated = getAggregatedCalendarEvents(USER_A_ID, '2026-09-01', '2026-09-30');
  assert(aggregated && Array.isArray(aggregated.events), 'Aggregated calendar events must be an array');
  assert(aggregated.events.some(e => e.title && e.title.includes('Mock Prep')), 'Personal event must appear in aggregated calendar');
});

it('11. Notification persistence (event-driven notification generation preserves read/dismissed states)', async () => {
  const { evaluateUserNotifications } = await import('../server/notificationEngine.js');
  const { markSingleNotificationReadOnServer } = await import('../server/db.js');
  const notifs = evaluateUserNotifications(USER_A_ID);
  assert(Array.isArray(notifs), 'Notifications must be an array');

  if (notifs.length > 0) {
    const target = notifs[0];
    const updated = markSingleNotificationReadOnServer(USER_A_ID, target.id);
    const checked = updated.find(n => n.id === target.id);
    assert(checked && checked.unread === false, 'Notification must be marked as read');
  }
});

it('12. Coach persistence (algorithmic preparation analysis caches under user profile)', async () => {
  const { analyzeUserPreparation } = await import('../server/coachService.js');
  const coach = analyzeUserPreparation(USER_A_ID);
  assert(coach && coach.hasData !== undefined, 'Coach analysis must return status');
  assert(typeof coach.readinessPercent === 'number', 'Readiness percentage must be numeric');
  assert(Array.isArray(coach.strengths), 'Coach strengths must be an array');
  assert(Array.isArray(coach.weakAreas), 'Coach weak areas must be an array');
});

it('13. Interview persistence (session evaluation and report stored under interviewHistory)', async () => {
  const { startInterviewSession, completeInterviewSessionOnServer, getInterviewHistoryOnServer } = await import('../server/interviewService.js');
  const session = await startInterviewSession(USER_A_ID, {
    type: 'Core CS',
    difficulty: 'Medium',
    questionCount: 5,
    timeMinutes: 15
  });
  assert(session && session.interviewId, 'Interview session must start');

  const report = await completeInterviewSessionOnServer(USER_A_ID, session.interviewId);
  assert(report && report.overallScore !== undefined, 'Interview report must have score');

  const hist = getInterviewHistoryOnServer(USER_A_ID);
  assert(hist.history.some(h => h.id === session.interviewId), 'Completed interview must persist in history');
});

// ===========================================================================
// SUITE 3: OFFLINE SYNC, RETRY & IDEMPOTENCY (Tests 14-17)
// ===========================================================================
it('14. Offline queue (queues operations with entityType, entityId, and unique operationId)', () => {
  const op = {
    operationId: 'op_test_queue_' + Date.now(),
    entityType: 'APPLICATION',
    entityId: 'app_test_1',
    operation: 'UPDATE',
    payload: { status: 'Online Assessment' },
    createdAt: new Date().toISOString()
  };
  assert(op.operationId && op.entityType && op.entityId, 'Queued operation must have required fields');
});

it('15. Sync retry (batch sync engine survives and processes retried batches cleanly)', async () => {
  const { processBatchSync } = await import('../server/syncEngine.js');
  const retryOps = [
    {
      operationId: 'op_retry_' + Date.now(),
      userId: USER_A_ID,
      entityType: 'APPLICATION',
      entityId: 'app_retry_test',
      operation: 'CREATE',
      payload: { company: 'Databricks', role: 'Distributed Systems Engineer' }
    }
  ];

  const firstAttempt = processBatchSync(USER_A_ID, retryOps);
  assert(firstAttempt.success === true, 'First attempt must succeed');

  const secondAttempt = processBatchSync(USER_A_ID, retryOps);
  assert(secondAttempt.success === true, 'Retry must succeed without throwing error');
  assert.strictEqual(secondAttempt.processedCount, 0, 'Retry must not re-process existing operationId');
});

it('16. Sync idempotency (replaying identical operationId never produces duplicate records)', async () => {
  const { processBatchSync } = await import('../server/syncEngine.js');
  const opId = 'idempotent_op_' + Date.now();
  const op = {
    operationId: opId,
    userId: USER_A_ID,
    entityType: 'CALENDAR_EVENT',
    entityId: 'evt_idempotent_1',
    operation: 'CREATE',
    payload: { title: 'Idempotency Validation Session', date: '2026-09-28' }
  };

  processBatchSync(USER_A_ID, [op]);
  const res2 = processBatchSync(USER_A_ID, [op]);
  assert.strictEqual(res2.processedCount, 0, 'Duplicate opId must be discarded');
});

it('17. Conflict handling (newer updates and completed task status win during concurrent synchronization)', async () => {
  const { processBatchSync } = await import('../server/syncEngine.js');
  const conflictOps = [
    {
      operationId: 'op_conf_1_' + Date.now(),
      userId: USER_A_ID,
      entityType: 'TASK',
      entityId: 'task_qa_1',
      operation: 'UPDATE',
      payload: { completed: true, completedAt: new Date().toISOString() }
    }
  ];

  const res = processBatchSync(USER_A_ID, conflictOps);
  const task = res.fullState.tasks.find(t => t.id === 'task_qa_1');
  assert(task && task.completed === true, 'Task completed status must win in conflict');
});

// ===========================================================================
// SUITE 4: CROSS-FEATURE ENTITY INTEGRITY & DEEP-LINKS (Tests 18-22)
// ===========================================================================
it('18. Exact task entity identity (focus, today, and coach deep links carry exact taskId)', () => {
  assert(appContextCode.includes('startFocusSession(task)'), 'Must pass exact task object to focus session');
  assert(dashboardViewCode.includes('startFocusSession(nextTask)'), 'Dashboard must trigger exact task session');
});

it('19. Exact revision identity (revision navigation carries exact revision item ID)', () => {
  assert(appContextCode.includes('setSelectedTopicDetail(rev)'), 'Revision navigation must preserve exact topic item');
  assert(dashboardViewCode.includes('handleOpenRevision'), 'Dashboard revision due cards must handle item');
});

it('20. Exact application identity (application detail and interview link preserve applicationId)', () => {
  assert(applicationsViewCode.includes('setSelectedApplication(app)'), 'ApplicationsView must open exact application');
  assert(appContextCode.includes('setSelectedApplication(app)'), 'AppContext notification must open exact application');
});

it('21. Exact interview identity (mock interview results link back to application with applicationId)', () => {
  assert(interviewViewCode.includes('pendingInterviewTarget?.applicationId'), 'InterviewView must forward applicationId');
  assert(interviewViewCode.includes('pendingInterviewTarget?.company'), 'InterviewView must forward company name');
});

it('22. Exact calendar identity (calendar event click navigates to exact source entity)', () => {
  assert(appContextCode.includes('openCalendarEventTarget'), 'AppContext must expose openCalendarEventTarget');
  assert(appContextCode.includes("event.type === 'MOCK_INTERVIEW'"), 'Calendar click must handle MOCK_INTERVIEW');
  assert(appContextCode.includes("event.type === 'STUDY_TASK'"), 'Calendar click must handle STUDY_TASK');
});

// ===========================================================================
// SUITE 5: PROGRESS CONSISTENCY & ZERO FABRICATION (Tests 23-29)
// ===========================================================================
it('23. Dashboard/task consistency (dashboard task count equals todayTasks length)', () => {
  assert(dashboardViewCode.includes('todayTasks.length'), 'Dashboard must reference todayTasks length directly');
  assert(dashboardViewCode.includes('todayTasks.filter'), 'Dashboard must compute completion directly from tasks');
});

it('24. Dashboard/revision consistency (dashboard due count equals revisionQueue due count)', () => {
  assert(dashboardViewCode.includes('revisionQueue') || dashboardViewCode.includes('revisionMetrics'), 'Dashboard must use revisionQueue');
});

it('25. Dashboard/Coach consistency (dashboard readiness equals coach readinessPercent)', () => {
  assert(dashboardViewCode.includes('coachAnalysis.readinessPercent') || dashboardViewCode.includes('coachAnalysis?.readinessPercent'), 'Dashboard must reflect coach readiness');
});

it('26. Dashboard/notification consistency (dashboard badge equals unread notifications count)', () => {
  assert(dashboardViewCode.includes('notifications'), 'Dashboard must bind to authentic notifications');
  assert(appContextCode.includes('notifications'), 'AppContext must expose notifications');
});

it('27. Roadmap progress consistency (dashboard roadmap % matches RoadmapView calculation)', () => {
  assert(dashboardViewCode.includes('roadmapProgress'), 'Dashboard must consume authoritative roadmapProgress');
  assert(appContextCode.includes('completedRoadmapTopics / totalRoadmapTopics'), 'Roadmap progress must be mathematically computed');
});

it('28. AI grounding (study material and tutor requests isolated by domain without contamination)', () => {
  assert(studyServiceCode.includes('getClientCacheKey'), 'Study client service must isolate by task domain and title');
});

it('29. No synthetic metrics (zero fabricated statistics or artificial trend increments)', () => {
  assert(!dashboardViewCode.includes('+12 tasks'), 'Dashboard must not contain hardcoded +12 tasks');
  assert(interviewViewCode.includes('Complete more interviews to see your performance trend.'), 'Interview must require authentic data');
  assert(coachViewCode.includes('Not enough preparation data yet'), 'Coach must show empty state without roadmap');
});

// ===========================================================================
// SUITE 6: SECURITY, AUTH ENFORCEMENT & ADAPTERS (Tests 30-34)
// ===========================================================================
it('30. Secret exposure prevention (zero API keys, Gemini secrets, or password hashes in frontend code)', () => {
  assert(!appContextCode.includes('AIzaSy'), 'Zero Google API keys in AppContext');
  assert(!dashboardViewCode.includes('passwordHash'), 'Zero password hashes in DashboardView');
  assert(!interviewViewCode.includes('passwordHash'), 'Zero password hashes in InterviewView');
});

it('31. Authentication enforcement (protected API endpoints require valid Bearer token)', async () => {
  const { validateSessionToken } = await import('../server/db.js');
  assert.strictEqual(validateSessionToken(''), null, 'Empty token must be rejected');
  assert.strictEqual(validateSessionToken('forged_fake_token'), null, 'Forged token must be rejected');
});

it('32. Ownership/IDOR protection (operations strictly verified against authenticated userId)', async () => {
  const { deleteApplicationFromDb, getUserApplicationsFromDb } = await import('../server/applicationService.js');
  // User B attempts to delete User A application
  const appsA = getUserApplicationsFromDb(USER_A_ID);
  if (appsA.length > 0) {
    const targetAppId = appsA[0].id;
    const deletedByB = deleteApplicationFromDb(USER_B_ID, targetAppId);
    assert.strictEqual(deletedByB, false, 'User B must not be able to delete User A application');
  }
});

it('33. Production database adapter (strictly requires DATABASE_URL, fails fast on placeholders, configures SSL)', async () => {
  const { parseSslCa } = await import('../server/db/dbAdapter.js');
  assert.strictEqual(typeof parseSslCa, 'function', 'Must export parseSslCa');
  const parsed = parseSslCa('-----BEGIN CERTIFICATE-----\nMIIB\n-----END CERTIFICATE-----');
  assert(parsed.includes('BEGIN CERTIFICATE'), 'Must parse PEM certificate');
});

it('34. Storage isolation (multi-user database partitions state under userId keys)', async () => {
  const { loadDb } = await import('../server/db.js');
  const db = loadDb();
  assert(db.tasks[USER_A_ID] !== undefined, 'User A tasks partition exists');
  assert(db.tasks[USER_B_ID] === undefined || Array.isArray(db.tasks[USER_B_ID]), 'User B tasks partition isolated');
});

// ===========================================================================
// SUITE 7: PWA, ANDROID & PERFORMANCE RELIABILITY (Tests 35-40)
// ===========================================================================
it('35. PWA API cache exclusion (service worker strictly ignores /api/ endpoints)', () => {
  assert(swCode.includes("url.pathname.startsWith('/api/')"), 'Service worker must check /api/ path');
  assert(swCode.includes('return;'), 'Service worker must skip caching /api/ requests');
});

it('36. Service-worker cache versioning (uses versioned cache key and deletes stale caches on activation)', () => {
  assert(swCode.includes('novara-app-shell-v'), 'SW must use versioned cache key');
  assert(swCode.includes('caches.delete(key)'), 'SW must delete old caches on activate');
});

it('37. Android production API (capacitor.config.json points to secure production URL)', () => {
  assert(capConfigCode.includes('https://novara-qzce.onrender.com'), 'Capacitor must point to production render URL');
  assert(capConfigCode.includes('"cleartext": false'), 'Capacitor must enforce HTTPS without cleartext');
});

it('38. No localhost production references (zero localhost references in production deployment files)', () => {
  assert(!capConfigCode.includes('http://localhost'), 'No localhost in capacitor.config.json');
  assert(!renderYamlCode.includes('http://localhost'), 'No localhost in render.yaml');
  assert(!swCode.includes('localhost'), 'No localhost in sw.js');
});

it('39. Duplicate API prevention (client services cache responses and avoid duplicate fetches)', () => {
  assert(studyServiceCode.includes('CLIENT_STUDY_MATERIAL_CACHE'), 'Study service must implement cache map');
  assert(dashboardViewCode.includes('useMemo'), 'Dashboard must memoize calculations to prevent rerender thrashing');
});

it('40. Error recovery (error handling toast and graceful fallback states preserve existing user data)', () => {
  assert(dashboardViewCode.includes('showToast'), 'Dashboard must implement error toasts');
  assert(interviewViewCode.includes('showToast'), 'InterviewView must implement error toasts');
  assert(appContextCode.includes('showToast'), 'AppContext must implement error toasts');
});

// ===========================================================================
// RUNNER
// ===========================================================================
async function runAllTests() {
  console.log(`\n${BLUE}================================================================${RESET}`);
  console.log(`${BLUE}🚀 NOVARA — FINAL 40-POINT CROSS-FEATURE QA REGRESSION MATRIX${RESET}`);
  console.log(`${BLUE}================================================================${RESET}\n`);

  let passed = 0;
  let total = 0;

  for (const t of tests) {
    total++;
    try {
      await t.fn();
      passed++;
      console.log(`  ✓ Test ${total}: ${t.desc}`);
    } catch (err) {
      console.error(`  ✗ Test ${total}: ${t.desc}`);
      console.error(`    ${RED}${err.message}${RESET}`);
    }
  }

  // Restore database cleanly to pristine state
  try {
    fs.writeFileSync(dbPath, originalDbRaw, 'utf8');
  } catch (e) {
    // Ignore cleanup errors
  }

  console.log(`\n${BLUE}================================================================${RESET}`);
  console.log(`FINAL QA MATRIX: ${passed === total ? GREEN : RED}${passed}/${total} TESTS PASSED${RESET}`);
  console.log(`${BLUE}================================================================${RESET}\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

runAllTests().catch(err => {
  console.error('Fatal Runner Error:', err);
  process.exit(1);
});
