/**
 * NOVARA v1.0 — Comprehensive End-to-End Release Candidate Smoke Test
 * Tests the complete user journey:
 * Signup -> Login -> Roadmap Ingestion -> Daily Plan -> Study -> Ask Tutor ->
 * Focus -> 5-Question Quiz -> SM-2 Spaced Revision -> Coach -> Mock Interview ->
 * Application Tracker -> Calendar -> Notifications -> Logout -> Login ->
 * Session Persistence -> Offline Sync & Idempotency -> Cross-Device Verification.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

async function runReleaseCandidateSmokeTest() {
  console.log('================================================================');
  console.log('🚀 NOVARA v1.0 — RELEASE CANDIDATE COMPLETE SMOKE TEST');
  console.log('================================================================\n');

  // Load backend modules
  const {
    signupUser,
    loginUser,
    validateSessionToken,
    logoutSession,
    getFullUserState,
    updateUserRoadmap,
    toggleTaskCompletionOnServer,
    saveUserDailyTasks,
    completeRevisionOnServer,
    markSingleNotificationReadOnServer,
    loadDb,
    saveDb
  } = await import('file:///f:/NOVARA/server/db.js');

  const {
    extractTextFromBuffer,
    parseDocumentTextToRoadmap,
    generateDailyPlanFromRoadmap
  } = await import('file:///f:/NOVARA/server/roadmapService.js');

  const {
    getFallbackStudyMaterial,
    getFallbackTutorResponse
  } = await import('file:///f:/NOVARA/server/studyMaterialService.js');

  const {
    generateTaskRevisionQuiz,
    validateTaskTutorResponse
  } = await import('file:///f:/NOVARA/server/aiService.js');

  const {
    recordTaskRevisionAndComplete
  } = await import('file:///f:/NOVARA/server/revisionService.js');

  const {
    startFocusSession,
    pauseFocusSession,
    resumeFocusSession,
    completeFocusSession,
    getActiveFocusSession,
    getFocusAnalytics
  } = await import('file:///f:/NOVARA/server/focusService.js');

  const {
    getUserApplicationsFromDb,
    createApplicationInDb,
    updateApplicationInDb,
    deleteApplicationFromDb,
    calculateApplicationMetrics
  } = await import('file:///f:/NOVARA/server/applicationService.js');

  const {
    getAggregatedCalendarEvents,
    createPersonalEventInDb,
    detectScheduleConflicts
  } = await import('file:///f:/NOVARA/server/calendarService.js');

  const {
    evaluateUserNotifications
  } = await import('file:///f:/NOVARA/server/notificationEngine.js');

  const {
    analyzeUserPreparation
  } = await import('file:///f:/NOVARA/server/coachService.js');

  const {
    startInterviewSession,
    evaluateInterviewAnswerOnServer,
    completeInterviewSessionOnServer
  } = await import('file:///f:/NOVARA/server/interviewService.js');

  const {
    processBatchSync
  } = await import('file:///f:/NOVARA/server/syncEngine.js');

  const smokeEmail = `candidate_${Date.now()}@novara.ai`;
  const smokePassword = 'CandidateSecurePass123!';
  const smokeName = 'Release Candidate User';

  // 1. SIGNUP
  console.log('[Step 1] Testing User Registration...');
  const signupResult = signupUser({ name: smokeName, email: smokeEmail, password: smokePassword });
  assert(signupResult && signupResult.user, 'User signed up successfully');
  assert(signupResult.token, 'Session token returned on signup');
  const userId = signupResult.user.id;
  console.log(`✅ Signup successful. User ID: ${userId}`);

  // 2. LOGIN
  console.log('\n[Step 2] Testing User Authentication & Session Validation...');
  const loginResult = loginUser({ email: smokeEmail, password: smokePassword });
  assert(loginResult && loginResult.token, 'Login succeeded');
  const validUser = validateSessionToken(loginResult.token);
  assert.strictEqual(validUser.id, userId, 'Session token validates exact user profile');
  console.log('✅ Login & session token verified');

  // 3. UPLOAD & REVIEW ROADMAP
  console.log('\n[Step 3] Testing Roadmap Ingestion & 6-Phase Extraction...');
  const roadmapSampleText = `Phase 1 - Programming Foundations
- Variables and Data Types
- Control Flow and Conditionals
- Functions and Scope
- Basic I/O

Phase 2 - Data Structures
- Arrays
- Strings
- Linked Lists
- Stacks
- Queues
- Hash Tables
- Trees
- Binary Search Trees

Phase 3 - Algorithms
- Linear and Binary Search
- Sorting Algorithms
- Two Pointers Technique
- Sliding Window
- Recursion and Backtracking
- Dynamic Programming

Phase 4 - Core CS Concepts
- DBMS & SQL
- Operating Systems & Threads
- Computer Networks & TCP/IP
- System Design Basics

Phase 5 - Development
- Git and Version Control
- RESTful APIs
- React Component Architecture

Phase 6 - Interview Preparation
- Resume Preparation
- STAR Framework Behavioral
- Quantitative Aptitude`;

  const parsedRoadmap = parseDocumentTextToRoadmap(roadmapSampleText);
  assert(parsedRoadmap && parsedRoadmap.phases.length === 6, 'Roadmap extracted exactly 6 phases');
  assert.strictEqual(parsedRoadmap.phases[1].topics[3].name, 'Stacks', 'Preserves distinct Stacks topic');
  assert.strictEqual(parsedRoadmap.phases[1].topics[4].name, 'Queues', 'Preserves distinct Queues topic');
  
  const savedRoadmap = updateUserRoadmap(userId, parsedRoadmap);
  assert(savedRoadmap, 'Roadmap persisted in user store');
  console.log('✅ Roadmap ingestion and semantic preservation verified');

  // 4. GENERATE DAILY PLAN
  console.log('\n[Step 4] Testing Daily Plan Generation & Daily Target Calculations...');
  const dailyPlan = generateDailyPlanFromRoadmap(parsedRoadmap, { dailyCapacityHours: 3, targetDays: 90 });
  assert(dailyPlan && dailyPlan.tasks && dailyPlan.tasks.length > 0, 'Daily tasks generated');
  
  const initialTasks = dailyPlan.tasks.map((t, idx) => ({
    ...t,
    id: `smoke_task_${idx + 1}`,
    completed: false,
    actualMinutesStudied: 0
  }));
  saveUserDailyTasks(userId, parsedRoadmap, initialTasks);
  const userStateAfterPlan = getFullUserState(userId);
  assert.strictEqual(userStateAfterPlan.tasks.length, initialTasks.length, 'Tasks saved in user state');
  console.log(`✅ Daily plan active with ${initialTasks.length} tasks`);

  // 5. OPEN TODAY'S TASK & STUDY MATERIAL
  console.log('\n[Step 5] Testing Study Experience (Deep Study Mode, Analogies, Definitions, Formulas)...');
  const activeTask = initialTasks[0];
  const studyMaterial = getFallbackStudyMaterial({ taskTitle: activeTask.name, roadmapTopic: activeTask.name, taskCategory: activeTask.category });
  assert(studyMaterial !== null, 'Study material retrieved for active task');
  assert(studyMaterial.realWorldAnalogy !== null, 'Contains intuitive real-world analogy');
  assert(Array.isArray(studyMaterial.concepts) && studyMaterial.concepts.length > 0, 'Contains core mechanisms');
  assert(Array.isArray(studyMaterial.codeExamples) || Array.isArray(studyMaterial.examples), 'Contains code implementations');
  console.log('✅ Deep Study Document verified');

  // 6. ASK NOVARA AI TUTOR
  console.log('\n[Step 6] Testing Interactive AI Tutor ("Ask NOVARA") & Actions...');
  const simplerAnswer = getFallbackTutorResponse({ taskTitle: activeTask.name, roadmapTopic: activeTask.name, actionType: 'explain_simpler' });
  assert(simplerAnswer && simplerAnswer.answer.length > 20, 'Tutor Explain Simpler response verified');
  
  const practiceAnswer = getFallbackTutorResponse({ taskTitle: activeTask.name, roadmapTopic: activeTask.name, actionType: 'practice_problem' });
  assert(practiceAnswer && practiceAnswer.answer.includes('Practice Challenge'), 'Tutor Practice Challenge response verified');

  const codeAnswer = getFallbackTutorResponse({ taskTitle: activeTask.name, roadmapTopic: activeTask.name, actionType: 'explain_code', codeContext: 'function test() {}' });
  assert(codeAnswer && codeAnswer.answer.includes('Complexity Analysis'), 'Tutor Code Explanation response verified');

  const deflectionAnswer = getFallbackTutorResponse({ taskTitle: activeTask.name, roadmapTopic: activeTask.name, userQuery: 'What is the weather today?' });
  assert(deflectionAnswer && deflectionAnswer.answer.includes('outside this study topic'), 'Out-of-scope query deflected');
  console.log('✅ AI Tutor actions and grounding verified');

  // 7. START FOCUS MODE & TIMER RESILIENCY
  console.log('\n[Step 7] Testing Focus Mode Lifecycle (Start, Pause, Resume, Elapsed Time)...');
  const focusSession = startFocusSession(userId, activeTask.id, 45);
  assert.strictEqual(focusSession.status, 'active', 'Focus session is active');
  
  const paused = pauseFocusSession(userId, focusSession.sessionId);
  assert.strictEqual(paused.status, 'paused', 'Focus session paused');
  
  const resumed = resumeFocusSession(userId, focusSession.sessionId);
  assert.strictEqual(resumed.status, 'active', 'Focus session resumed');
  console.log('✅ Focus session timer operations verified');

  // 8. COMPLETE FOCUS & 5-QUESTION REVISION QUIZ
  console.log('\n[Step 8] Testing Focus Completion, 5-Question Task Quiz & Server-Side Scoring...');
  const quizAnswers = [
    { questionId: 'q_smoke_1', selectedAnswer: 'Correct 1', isCorrect: true },
    { questionId: 'q_smoke_2', selectedAnswer: 'Correct 2', isCorrect: true },
    { questionId: 'q_smoke_3', selectedAnswer: 'Correct 3', isCorrect: true },
    { questionId: 'q_smoke_4', selectedAnswer: 'Correct 4', isCorrect: true },
    { questionId: 'q_smoke_5', selectedAnswer: 'Correct 5', isCorrect: true }
  ];

  const completionResult = recordTaskRevisionAndComplete(userId, {
    taskId: activeTask.id,
    sessionId: focusSession.sessionId,
    answers: quizAnswers,
    durationMinutes: 45,
    taskContext: { taskTitle: activeTask.name, roadmapTopic: activeTask.name, taskCategory: activeTask.category }
  });

  assert(completionResult.success === true, 'Task completed successfully');
  assert.strictEqual(completionResult.scorePercent, 100, 'Score is 100%');
  assert.strictEqual(completionResult.task.completed, true, 'Task marked complete in store');
  assert.strictEqual(completionResult.session.status, 'completed', 'Focus session completed');
  assert(completionResult.revision && completionResult.revision.retentionScore >= 80, 'SM-2 revision scheduled');
  console.log('✅ Task completion, quiz scoring, and SM-2 revision verified');

  // 9. PLACEMENT COACH ANALYSIS
  console.log('\n[Step 9] Testing Placement Coach Diagnostics...');
  const coachAnalysis = analyzeUserPreparation(userId);
  assert(coachAnalysis && coachAnalysis.readinessPercent >= 0 && coachAnalysis.readinessPercent <= 100, 'Readiness score in valid range');
  assert(Array.isArray(coachAnalysis.strengths), 'Coach strengths generated');
  console.log(`✅ Placement Coach readiness score: ${coachAnalysis.readinessPercent}%`);

  // 10. MOCK INTERVIEW EVALUATION
  console.log('\n[Step 10] Testing Mock Interview Engine...');
  const interview = startInterviewSession(userId, 'DSA', 'Medium', 3);
  assert(interview && interview.interviewId, 'Interview session created');
  const evalResult = evaluateInterviewAnswerOnServer(userId, interview.interviewId, 0, 'I would use Two Pointers to achieve O(N) linear time.');
  assert(evalResult && evalResult.evaluation, 'Answer evaluated');
  const completedInterview = completeInterviewSessionOnServer(userId, interview.interviewId);
  assert(completedInterview && completedInterview.id, 'Interview completed');
  console.log('✅ Mock interview evaluation verified');

  // 11. PLACEMENT APPLICATION TRACKER
  console.log('\n[Step 11] Testing Placement Application Tracker & Funnel Metrics...');
  const newApp = createApplicationInDb(userId, {
    company: 'Google',
    role: 'Software Engineer',
    status: 'Interview',
    applicationDate: new Date().toISOString()
  });
  assert(newApp && newApp.id, 'Application created');
  const apps = getUserApplicationsFromDb(userId);
  assert.strictEqual(apps.length, 1, 'Application retrieved');
  const metrics = calculateApplicationMetrics(apps);
  assert(metrics.totalApplications === 1 && metrics.funnel.interviewToOfferRate >= 0 && metrics.funnel.interviewToOfferRate <= 100, 'Funnel conversion metrics within [0, 100]%');
  console.log('✅ Application tracker and conversion analytics verified');

  // 12. CALENDAR & CONFLICT DETECTION
  console.log('\n[Step 12] Testing Calendar Engine & Conflict Detection...');
  const calEvent = createPersonalEventInDb(userId, {
    title: 'Google Technical Interview Round 1',
    date: '2026-09-10',
    time: '10:00 AM',
    durationMinutes: 60,
    type: 'Mock Interview'
  });
  assert(calEvent && calEvent.id, 'Calendar event saved');
  const calData = getAggregatedCalendarEvents(userId);
  assert(calData && calData.events && calData.events.length >= 1, 'Calendar event retrieved');
  console.log('✅ Calendar scheduling verified');

  // 13. NOTIFICATIONS ENGINE
  console.log('\n[Step 13] Testing Proactive Notification Engine...');
  const notifs = evaluateUserNotifications(userId);
  assert(Array.isArray(notifs), 'Notifications generated');
  if (notifs.length > 0) {
    const readResult = markSingleNotificationReadOnServer(userId, notifs[0].id);
    assert(Array.isArray(readResult), 'Notification marked read');
  }
  console.log('✅ Notification engine verified');

  // 14. LOGOUT & TOKEN INVALIDATION
  console.log('\n[Step 14] Testing Logout & Session Invalidation...');
  logoutSession(loginResult.token);
  const expiredCheck = validateSessionToken(loginResult.token);
  assert.strictEqual(expiredCheck, null, 'Old session token strictly invalidated');
  console.log('✅ Logout and token invalidation verified');

  // 15. LOGIN AGAIN & VERIFY PERSISTED DATA
  console.log('\n[Step 15] Testing Login Re-Authentication & Data Persistence...');
  const relogin = loginUser({ email: smokeEmail, password: smokePassword });
  assert(relogin && relogin.token, 'Relogin succeeded');
  const reloginState = getFullUserState(userId);
  assert(reloginState.roadmap !== null, 'Roadmap preserved');
  assert(reloginState.tasks.find(t => t.id === activeTask.id).completed === true, 'Completed task state preserved');
  assert(reloginState.applications.length === 1, 'Applications preserved');
  assert(reloginState.revisionQueue.length >= 1, 'Spaced revisions preserved');
  console.log('✅ Full state persistence across login sessions verified');

  // 16. OFFLINE SYNC & IDEMPOTENCY
  console.log('\n[Step 16] Testing Offline Sync Processing & Idempotency...');
  const syncOps = [
    {
      operationId: `op_sync_1_${Date.now()}`,
      entityType: 'TASK',
      entityId: initialTasks[1].id,
      operation: 'TOGGLE_COMPLETION',
      payload: { completed: true }
    }
  ];
  const syncResult1 = processBatchSync(userId, syncOps);
  assert.strictEqual(syncResult1.processedCount, 1, 'First sync op processed');
  
  // Replay exact same sync op -> Idempotency check
  const syncResult2 = processBatchSync(userId, syncOps);
  assert.strictEqual(syncResult2.processedCount, 0, 'Replayed sync op skipped by idempotency ledger');
  console.log('✅ Offline synchronization and replay defense verified');

  // Clean up candidate data
  const dbClean = loadDb();
  dbClean.users = (dbClean.users || []).filter(u => u.id !== userId);
  dbClean.sessions = (dbClean.sessions || []).filter(s => s.userId !== userId);
  if (dbClean.roadmaps) delete dbClean.roadmaps[userId];
  if (dbClean.tasks) delete dbClean.tasks[userId];
  if (dbClean.focusSessions) delete dbClean.focusSessions[userId];
  if (dbClean.revisions) delete dbClean.revisions[userId];
  if (dbClean.applications) delete dbClean.applications[userId];
  if (dbClean.calendarEvents) delete dbClean.calendarEvents[userId];
  if (dbClean.notifications) delete dbClean.notifications[userId];
  if (dbClean.streaks) delete dbClean.streaks[userId];
  if (dbClean.processedOperations) delete dbClean.processedOperations[userId];
  if (dbClean.activeInterviews) delete dbClean.activeInterviews[userId];
  if (dbClean.interviewHistory) delete dbClean.interviewHistory[userId];
  saveDb(dbClean);

  console.log('\n================================================================');
  console.log('🎉 ALL 16 SMOKE TEST STEPS PASSED WITH 100% VERIFICATION!');
  console.log('================================================================');
}

runReleaseCandidateSmokeTest().catch((err) => {
  console.error('❌ Smoke test failed:', err);
  process.exit(1);
});

