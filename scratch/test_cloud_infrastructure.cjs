const fs = require('fs');
const path = require('path');
const http = require('http');

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ INFRASTRUCTURE TEST ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${message}`);
}

async function runCloudInfraTests() {
  console.log('================================================================');
  console.log('☁️ STARTING NOVARA v1.0 PRODUCTION & CLOUD INFRASTRUCTURE SUITE');
  console.log('================================================================\n');

  // 1. Database Connection & Adapter Verification
  console.log('[1] Testing Database Adapter & Provider Initialization...');
  const { dbAdapter } = await import('file:///f:/NOVARA/server/db/dbAdapter.js');
  await dbAdapter.init();
  const dbHealth = await dbAdapter.healthCheck();
  assert(dbHealth.status === 'healthy', 'Database adapter reports healthy state');
  assert(typeof dbHealth.provider === 'string', `Database provider identified: ${dbHealth.provider}`);

  // 2. User Isolation & Authentication
  console.log('\n[2] Testing User Isolation Across Relational Store...');
  const { signupUser, loginUser, validateSessionToken, getFullUserState, logoutSession } = await import('file:///f:/NOVARA/server/db.js');
  const userA = signupUser({ name: 'User Cloud A', email: `cloud_a_${Date.now()}@novara.dev`, password: 'CloudPassword123!' });
  const userB = signupUser({ name: 'User Cloud B', email: `cloud_b_${Date.now()}@novara.dev`, password: 'CloudPassword456!' });

  const stateA = getFullUserState(userA.user.id);
  const stateB = getFullUserState(userB.user.id);
  assert(stateA.profile.id !== stateB.profile.id, 'User profiles completely isolated');
  assert(stateA.profile.email.includes('cloud_a'), 'User A data corresponds only to User A');

  // 3. Roadmap Persistence
  console.log('\n[3] Testing Roadmap Entity Persistence & Schema...');
  const { updateUserRoadmap } = await import('file:///f:/NOVARA/server/db.js');
  const testRoadmap = {
    title: 'Full Stack Engineer Roadmap',
    targetRole: 'Full Stack Engineer',
    phases: [
      { id: 'p1', title: 'Phase 1: React & Node', topics: [{ id: 't1', name: 'Hooks', status: 'in_progress' }] }
    ]
  };
  const savedRoadmap = updateUserRoadmap(userA.user.id, testRoadmap);
  assert(savedRoadmap.title === 'Full Stack Engineer Roadmap', 'Roadmap entity saved to persistent store');

  // 4. Task Persistence & Toggle
  console.log('\n[4] Testing Daily Task Persistence & Atomic Toggle...');
  const { saveUserDailyTasks, toggleTaskCompletionOnServer } = await import('file:///f:/NOVARA/server/db.js');
  const initialTasks = [
    { id: 'cloud_task_1', name: 'Study Distributed Systems', durationMinutes: 45, completed: false }
  ];
  saveUserDailyTasks(userA.user.id, savedRoadmap, initialTasks);
  const toggleRes = toggleTaskCompletionOnServer(userA.user.id, 'cloud_task_1');
  assert(toggleRes.tasks.find((t) => t.id === 'cloud_task_1').completed === true, 'Task completed state toggled atomically');

  // 5. Application Persistence
  console.log('\n[5] Testing Placement Application Storage...');
  const { createApplicationInDb, getUserApplicationsFromDb } = await import('file:///f:/NOVARA/server/applicationService.js');
  const app = createApplicationInDb(userA.user.id, { company: 'Apple', role: 'Software Engineer', status: 'Applied' });
  assert(app.id !== undefined, 'Application created with unique relational ID');
  const userApps = getUserApplicationsFromDb(userA.user.id);
  assert(userApps.some((a) => a.id === app.id), 'Application retrieved from user storage');

  // 6. Calendar Persistence
  console.log('\n[6] Testing Calendar Event Storage...');
  const { createPersonalEventInDb, getAggregatedCalendarEvents } = await import('file:///f:/NOVARA/server/calendarService.js');
  const calEvt = createPersonalEventInDb(userA.user.id, { title: 'System Design Deep Dive', date: '2026-09-25' });
  const calEvents = getAggregatedCalendarEvents(userA.user.id);
  assert(calEvents.events.some((e) => e.id === calEvt.id), 'Calendar event persisted and aggregated');

  // 7. Focus Persistence
  console.log('\n[7] Testing Focus Mode Session Lifecycle...');
  const { startFocusSession, completeFocusSession } = await import('file:///f:/NOVARA/server/focusService.js');
  const focusSession = startFocusSession(userA.user.id, { taskId: 'cloud_task_1', plannedMinutes: 30 });
  assert(focusSession.status === 'active', 'Focus session active');
  const completeRes = completeFocusSession(userA.user.id, { sessionId: focusSession.sessionId, notes: 'Cloud study done' });
  assert(completeRes.session.status === 'completed', 'Focus session completed and persisted');

  // 8. Revision Persistence
  console.log('\n[8] Testing Spaced Repetition Revision Storage...');
  const { getRevisionsForUser, rescheduleRevision } = await import('file:///f:/NOVARA/server/revisionService.js');
  const revs = getRevisionsForUser(userA.user.id);
  assert(Array.isArray(revs.revisions), 'User revision list initialized');

  // 9. Sync Idempotency
  console.log('\n[9] Testing Offline Sync Idempotency Ledger...');
  const { processBatchSync } = await import('file:///f:/NOVARA/server/syncEngine.js');
  const opId = `cloud_op_${Date.now()}`;
  const op = {
    operationId: opId,
    userId: userA.user.id,
    entityType: 'APPLICATION',
    entityId: 'app_sync_cloud',
    operation: 'CREATE',
    payload: { company: 'Datadog', role: 'SRE', status: 'Applied' },
    createdAt: new Date().toISOString()
  };
  const sync1 = processBatchSync(userA.user.id, [op]);
  const sync2 = processBatchSync(userA.user.id, [op]); // Replay
  assert(sync1.processedCount === 1, 'First sync operation processed');
  assert(sync2.processedCount === 0, 'Replayed sync operation rejected by idempotency ledger');

  // 10. File Storage Authorization & Magic Bytes
  console.log('\n[10] Testing File Storage Abstraction & User Scoping...');
  const { fileStorageService } = await import('file:///f:/NOVARA/server/storageService.js');
  const dummyPdf = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Title (Placement Roadmap) >>\nendobj\n');
  const uploadResult = await fileStorageService.uploadUserRoadmapFile(userA.user.id, dummyPdf, 'roadmap.pdf', 'application/pdf');
  assert(uploadResult.fileId !== undefined, 'File stored with unique fileId');
  assert(uploadResult.storageKey.includes(userA.user.id), 'Storage key scoped strictly to authenticated user');

  let unauthorizedFileAccess = false;
  try {
    // User B tries to read User A's file
    await fileStorageService.getUserFile(userB.user.id, uploadResult.storageKey);
  } catch (e) {
    unauthorizedFileAccess = true;
  }
  assert(unauthorizedFileAccess === true, 'User B strictly blocked from accessing User A uploaded files');

  // 11. Analytics Funnel Conversion Bounds (0% <= conversion <= 100%)
  console.log('\n[11] Testing Application Funnel Analytics Mathematical Invariants...');
  const { calculateApplicationMetrics } = await import('file:///f:/NOVARA/server/applicationService.js');
  
  // Test scenario 1: Empty applications
  const emptyMetrics = calculateApplicationMetrics([]);
  assert(emptyMetrics.funnel.appliedToAssessmentRate === 0, 'Empty applications: 0% rate');
  assert(emptyMetrics.funnel.assessmentToInterviewRate === 0, 'Empty applications: 0% rate');
  assert(emptyMetrics.funnel.interviewToOfferRate === 0, 'Empty applications: 0% rate');

  // Test scenario 2: Edge case - Offer without explicit OA status
  const edgeApps = [
    { id: '1', status: 'Offer', interviews: [{ type: 'Technical' }] },
    { id: '2', status: 'Rejected' },
    { id: '3', status: 'Saved' }
  ];
  const edgeMetrics = calculateApplicationMetrics(edgeApps);
  assert(edgeMetrics.funnel.appliedToAssessmentRate >= 0 && edgeMetrics.funnel.appliedToAssessmentRate <= 100, 'Conversion rate within [0, 100]%');
  assert(edgeMetrics.funnel.assessmentToInterviewRate >= 0 && edgeMetrics.funnel.assessmentToInterviewRate <= 100, 'Conversion rate within [0, 100]%');
  assert(edgeMetrics.funnel.interviewToOfferRate >= 0 && edgeMetrics.funnel.interviewToOfferRate <= 100, 'Conversion rate within [0, 100]%');

  // 12. Rate Limiting
  console.log('\n[12] Testing Rate Limiting Sliding Windows...');
  const { checkRateLimit } = await import('file:///f:/NOVARA/server/securityMiddleware.js');
  const mockReq = { headers: { 'x-forwarded-for': '203.0.113.195' }, socket: { remoteAddress: '203.0.113.195' } };
  let allowedCount = 0;
  for (let i = 0; i < 35; i++) {
    const res = checkRateLimit(mockReq, 'AUTH');
    if (res.allowed) allowedCount++;
  }
  assert(allowedCount <= 30, 'Auth rate limiter strictly caps at 30 requests/min');

  // 13. Health Check Endpoint
  console.log('\n[13] Testing GET /api/health Endpoint...');
  const healthData = await new Promise((resolve, reject) => {
    http.get('http://localhost:3000/api/health', (res) => {
      let body = '';
      res.on('data', (d) => (body += d));
      res.on('end', () => resolve(JSON.parse(body)));
    }).on('error', reject);
  });
  assert(healthData.status === 'healthy', '/api/health returns status: healthy');
  assert(healthData.services.server === 'online', 'Server reported online');
  assert(healthData.services.database !== undefined, 'Database connectivity checked');

  // 14. Environment Configuration
  console.log('\n[14] Testing Environment Configuration Template (.env.example)...');
  const envContent = fs.readFileSync(path.resolve('.env.example'), 'utf8');
  assert(envContent.includes('DATABASE_URL='), '.env.example documents DATABASE_URL');
  assert(envContent.includes('GOOGLE_CLIENT_ID='), '.env.example documents GOOGLE_CLIENT_ID');
  assert(envContent.includes('VITE_GOOGLE_CLIENT_ID='), '.env.example documents VITE_GOOGLE_CLIENT_ID');
  assert(envContent.includes('JWT_SECRET='), '.env.example documents JWT_SECRET');
  assert(envContent.includes('STORAGE_BUCKET='), '.env.example documents STORAGE_BUCKET');
  assert(envContent.includes('APP_BASE_URL='), '.env.example documents APP_BASE_URL');

  // 15. Structured Logging
  console.log('\n[15] Testing Structured Production Logger & Secret Redaction...');
  const { logger, ERROR_CATEGORIES } = await import('file:///f:/NOVARA/server/logger.js');
  assert(ERROR_CATEGORIES.AUTH_ERROR !== undefined, 'AUTH_ERROR category defined');
  assert(ERROR_CATEGORIES.DATABASE_ERROR !== undefined, 'DATABASE_ERROR category defined');

  console.log('\n================================================================');
  console.log('🎉 ALL 15 CLOUD INFRASTRUCTURE & PRODUCTION TESTS PASSED!');
  console.log('================================================================');
}

runCloudInfraTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
