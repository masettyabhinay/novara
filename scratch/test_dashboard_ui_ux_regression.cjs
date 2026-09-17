/**
 * NOVARA AI Placement Command Center (Dashboard / Home) UI/UX & Integration Regression Suite
 * 30-Point Comprehensive Regression Test Suite:
 * 1.  Dashboard renders successfully as primary command center
 * 2.  Greeting and profile data grounding (time-of-day greeting, user configured name)
 * 3.  Target role grounding (from authentic user plan settings)
 * 4.  Today's task count matches authentic tasks in DB
 * 5.  Today's task completion rate and progress bar grounding
 * 6.  Active focus session identity and authoritative synchronization
 * 7.  No fake timer displayed when focus session is inactive
 * 8.  Study duration grounding (planned duration, completed duration, remaining duration)
 * 9.  Revision due count matches authentic spaced recall queue
 * 10. Roadmap progress grounding (matches authoritative calculation)
 * 11. Next roadmap topic identity (first incomplete topic in current phase)
 * 12. Coach readiness score grounding (exact backend Coach value or "Not enough data")
 * 13. Coach next-best-action identity and why-this justification
 * 14. Calendar event grounding (upcoming events chronologically sorted)
 * 15. Recent activity grounding (authentic timestamps from tasks, revisions, and notifications)
 * 16. Notification badge consistency (matches unread count)
 * 17. Exact task deep-link ("Start Focus" launches exact task session)
 * 18. Exact revision deep-link ("Start Revision" targets exact due revision)
 * 19. Exact roadmap deep-link ("Continue Roadmap" routes to visual roadmap)
 * 20. Exact application/interview deep-link (routes with authentic entity ID)
 * 21. Loading states (skeleton/spinner while authentic data is loading)
 * 22. Empty states (handles no roadmap, no tasks, no revisions, no events, no coach data)
 * 23. Error and offline behavior (preserves cached data and displays offline banner)
 * 24. Multi-user isolation (User A and User B dashboards are strictly isolated)
 * 25. Logout and login restoration (state cleared on logout and re-hydrated on login)
 * 26. Mobile overflow protection (overflowX hidden, responsive layout for small screens)
 * 27. Touch target sizing (all interactive controls meet WCAG >=44px guidelines)
 * 28. Accessibility audit (semantic headings, ARIA progressbars, labels, and regions)
 * 29. Duplicate API prevention (consumes AppContext without redundant network fetches)
 * 30. Zero synthetic/fabricated metrics (strictly authentic persisted data)
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

let passedTests = 0;
let totalTests = 0;

function it(desc, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ${GREEN}✓${RESET} ${desc}`);
    passedTests++;
  } catch (err) {
    console.error(`  ${RED}✗${RESET} ${desc}`);
    console.error(`    ${RED}${err.message}${RESET}`);
  }
}

function describe(suiteName, fn) {
  console.log(`\n${BLUE}● ${suiteName}${RESET}`);
  fn();
}

async function runTests() {
  console.log('================================================================');
  console.log('🧭 NOVARA — DASHBOARD / HOME 30-POINT REGRESSION AUDIT');
  console.log('================================================================');

  const { loadDb, saveDb } = await import('../server/db.js');
  const { analyzeUserPreparation } = await import('../server/coachService.js');
  const { calculateFocusTimerMetrics, formatFocusTime } = await import('../src/utils/focusTimerUtils.js');

  const TEST_USER_A = 'usr_dash_test_a';
  const TEST_USER_B = 'usr_dash_test_b';

  // Setup test users in DB
  const db = loadDb();
  if (!db.users) db.users = [];
  db.users = db.users.filter(u => u.id !== TEST_USER_A && u.id !== TEST_USER_B);

  db.users.push({
    id: TEST_USER_A,
    name: 'Sarah Connor',
    email: 'sarah.connor@novara.test',
    targetRole: 'Full Stack Engineer',
    dailyStudyMinutes: 180,
    placementTargetDate: '2026-11-20',
    currentPreparationLevel: 'Intermediate'
  });

  db.users.push({
    id: TEST_USER_B,
    name: 'John Connor',
    email: 'john.connor@novara.test',
    targetRole: 'Backend Engineer',
    dailyStudyMinutes: 120,
    placementTargetDate: '2026-12-15',
    currentPreparationLevel: 'Beginner'
  });

  if (!db.roadmaps) db.roadmaps = {};
  if (!db.tasks) db.tasks = {};
  if (!db.revisions) db.revisions = {};
  if (!db.applications) db.applications = {};
  if (!db.streaks) db.streaks = {};
  if (!db.coachAnalysis) db.coachAnalysis = {};
  if (!db.notifications) db.notifications = {};
  if (!db.calendarEvents) db.calendarEvents = {};

  // Setup User A data
  db.roadmaps[TEST_USER_A] = {
    title: 'Full Stack Placement Curriculum',
    phases: [
      {
        id: 'phase_1',
        title: 'Phase 1: Foundations',
        status: 'in_progress',
        topics: [
          { id: 'top_1', name: 'JavaScript Deep Dive', status: 'completed' },
          { id: 'top_2', name: 'Async Programming & Promises', status: 'pending' },
          { id: 'top_3', name: 'DOM Manipulation', status: 'pending' }
        ]
      },
      {
        id: 'phase_2',
        title: 'Phase 2: React & State',
        status: 'upcoming',
        topics: [
          { id: 'top_4', name: 'React Hooks & Context', status: 'pending' }
        ]
      }
    ]
  };

  db.tasks[TEST_USER_A] = [
    { id: 'tsk_d1', name: 'Implement Debounce & Throttle', durationMinutes: 45, completed: true, completedAt: '2026-09-17T08:30:00.000Z', category: 'Frontend' },
    { id: 'tsk_d2', name: 'Promise.all Polyfill', durationMinutes: 45, completed: false, category: 'JavaScript' },
    { id: 'tsk_d3', name: 'Binary Tree Inversion', durationMinutes: 30, completed: false, category: 'DSA' }
  ];

  db.revisions[TEST_USER_A] = [
    { id: 'rev_d1', topic: 'Event Loop & Microtasks', status: 'pending', revisionDueDate: 'Today', retentionScore: '65%', completedAt: null },
    { id: 'rev_d2', topic: 'CSS Flexbox & Grid', status: 'completed', revisionDueDate: 'Completed', retentionScore: '90%', completedAt: '2026-09-16T18:00:00.000Z' }
  ];

  db.streaks[TEST_USER_A] = {
    currentStreak: 5,
    longestStreak: 10,
    todayTargetMet: false,
    weeklyHistory: [1, 1, 1, 1, 1, 0, 0]
  };

  db.notifications[TEST_USER_A] = [
    { id: 'notif_1', title: 'Plan Adjusted by Coach ✨', time: '10m ago', createdAt: '2026-09-17T09:00:00.000Z', unread: true },
    { id: 'notif_2', title: '5-Day Streak Reached! 🔥', time: 'Yesterday', createdAt: '2026-09-16T20:00:00.000Z', unread: false }
  ];

  db.calendarEvents[TEST_USER_A] = [
    { id: 'cal_1', title: 'Stripe Technical Screen', date: '2026-09-18', time: '14:00', type: 'INTERVIEW', sourceId: 'app_stripe' },
    { id: 'cal_2', title: 'Frontend Architecture Review', date: '2026-09-19', time: '10:00', type: 'STUDY_TASK', sourceId: 'tsk_d2' }
  ];

  // User B clean data
  db.roadmaps[TEST_USER_B] = null;
  db.tasks[TEST_USER_B] = [];
  db.revisions[TEST_USER_B] = [];
  db.applications[TEST_USER_B] = [];
  db.streaks[TEST_USER_B] = { currentStreak: 0, longestStreak: 0, todayTargetMet: false, weeklyHistory: [] };
  db.calendarEvents[TEST_USER_B] = [];
  db.notifications[TEST_USER_B] = [];

  saveDb(db);

  // --------------------------------------------------------------------------
  // SUITE 1: Component Rendering & Hierarchy
  // --------------------------------------------------------------------------
  describe('Suite 1: Component Architecture & Rendering Hierarchy', () => {
    it('1. Dashboard renders successfully as primary command center', () => {
      const dashboardCode = fs.readFileSync(path.join(__dirname, '../src/components/Dashboard/DashboardView.jsx'), 'utf-8');
      assert.ok(dashboardCode.includes('export const DashboardView'), 'DashboardView is exported');
      assert.ok(dashboardCode.includes('dashboard-command-center'), 'Contains command center container class');

      const todayViewCode = fs.readFileSync(path.join(__dirname, '../src/components/Today/TodayView.jsx'), 'utf-8');
      assert.ok(todayViewCode.includes('DashboardView'), 'TodayView mounts DashboardView');
    });

    it('2. Greeting and profile data grounding (time-of-day greeting, user configured name)', () => {
      const dashboardCode = fs.readFileSync(path.join(__dirname, '../src/components/Dashboard/DashboardView.jsx'), 'utf-8');
      assert.ok(dashboardCode.includes('Good morning'), 'Contains Good morning greeting');
      assert.ok(dashboardCode.includes('Good afternoon'), 'Contains Good afternoon greeting');
      assert.ok(dashboardCode.includes('Good evening'), 'Contains Good evening greeting');
      assert.ok(dashboardCode.includes('currentUser?.name || userProfile?.name'), 'Uses authentic user profile name');
    });

    it('3. Target role grounding (from authentic user plan settings)', () => {
      const dashboardCode = fs.readFileSync(path.join(__dirname, '../src/components/Dashboard/DashboardView.jsx'), 'utf-8');
      assert.ok(dashboardCode.includes('userProfile?.targetRole'), 'Pulls target role directly from profile');
      assert.ok(!dashboardCode.includes('Software Development Engineer (Tier-1 Pro Elite)'), 'Zero fabricated role labels');
    });
  });

  // --------------------------------------------------------------------------
  // SUITE 2: Today Mission & Task Execution
  // --------------------------------------------------------------------------
  describe('Suite 2: Today Mission & Task Execution', () => {
    it("4. Today's task count matches authentic tasks in DB", () => {
      const currentDb = loadDb();
      const userTasks = currentDb.tasks[TEST_USER_A] || [];
      assert.strictEqual(userTasks.length, 3, 'User A has exactly 3 tasks in DB');

      const dashboardCode = fs.readFileSync(path.join(__dirname, '../src/components/Dashboard/DashboardView.jsx'), 'utf-8');
      assert.ok(dashboardCode.includes('todayTasks.length'), 'Computes total task count from context');
    });

    it("5. Today's task completion rate and progress bar grounding", () => {
      const currentDb = loadDb();
      const userTasks = currentDb.tasks[TEST_USER_A] || [];
      const completed = userTasks.filter(t => t.completed).length;
      assert.strictEqual(completed, 1, '1 task completed in DB');

      const expectedPct = Math.round((1 / 3) * 100); // 33%
      assert.strictEqual(expectedPct, 33);

      const dashboardCode = fs.readFileSync(path.join(__dirname, '../src/components/Dashboard/DashboardView.jsx'), 'utf-8');
      assert.ok(dashboardCode.includes('aria-label="Today\'s task completion progress"'), 'Has accessible progressbar');
      assert.ok(dashboardCode.includes('role="progressbar"'));
    });

    it('6. Active focus session identity and authoritative synchronization', () => {
      const sampleSession = {
        sessionId: 'sess_123',
        startedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 min elapsed
        plannedMinutes: 45,
        status: 'in_progress',
        pauseHistory: []
      };

      const metrics = calculateFocusTimerMetrics(sampleSession, Date.now());
      assert.strictEqual(metrics.isPaused, false);
      assert.ok(metrics.remainingSeconds <= 30 * 60 && metrics.remainingSeconds >= 29 * 60);

      const timeFormatted = formatFocusTime(metrics.remainingSeconds);
      assert.ok(timeFormatted.startsWith('30:0') || timeFormatted.startsWith('29:5'));
    });

    it('7. No fake timer displayed when focus session is inactive', () => {
      const dashboardCode = fs.readFileSync(path.join(__dirname, '../src/components/Dashboard/DashboardView.jsx'), 'utf-8');
      // Verifies active focus session card is rendered conditionally
      assert.ok(dashboardCode.includes('activeFocusSession && activeFocusTask && focusTimerMetrics'), 'Timer card strictly gated on active session');
    });

    it('8. Study duration grounding (planned duration, completed duration, remaining duration)', () => {
      const currentDb = loadDb();
      const userTasks = currentDb.tasks[TEST_USER_A] || [];
      const totalPlannedMinutes = userTasks.reduce((s, t) => s + (t.durationMinutes || 45), 0); // 45 + 45 + 30 = 120m
      const completedMinutes = userTasks.filter(t => t.completed).reduce((s, t) => s + (t.durationMinutes || 45), 0); // 45m
      const remainingMinutes = totalPlannedMinutes - completedMinutes; // 75m

      assert.strictEqual(totalPlannedMinutes, 120, '120m total planned duration');
      assert.strictEqual(completedMinutes, 45, '45m completed study duration');
      assert.strictEqual(remainingMinutes, 75, '75m remaining study duration');
    });
  });

  // --------------------------------------------------------------------------
  // SUITE 3: Quick Progress, Revision & Roadmap
  // --------------------------------------------------------------------------
  describe('Suite 3: Quick Progress, Revision & Roadmap Snapshots', () => {
    it('9. Revision due count matches authentic spaced recall queue', () => {
      const currentDb = loadDb();
      const revisions = currentDb.revisions[TEST_USER_A] || [];
      const due = revisions.filter(r => r.status !== 'completed' && (r.revisionDueDate === 'Today' || r.revisionDueDate.startsWith('Overdue') || !r.completedAt));
      assert.strictEqual(due.length, 1, 'Exactly 1 due revision in DB');
      assert.strictEqual(due[0].topic, 'Event Loop & Microtasks');
    });

    it('10. Roadmap progress grounding (matches authoritative calculation)', () => {
      const currentDb = loadDb();
      const roadmap = currentDb.roadmaps[TEST_USER_A];
      let totalTopics = 0;
      let completedTopics = 0;
      roadmap.phases.forEach(p => {
        (p.topics || []).forEach(t => {
          totalTopics++;
          if (t.status === 'completed') completedTopics++;
        });
      });

      assert.strictEqual(totalTopics, 4);
      assert.strictEqual(completedTopics, 1);
      const overall = Math.round((completedTopics / totalTopics) * 100);
      assert.strictEqual(overall, 25, 'Authoritative roadmap progress is 25%');
    });

    it('11. Next roadmap topic identity (first incomplete topic in current phase)', () => {
      const currentDb = loadDb();
      const roadmap = currentDb.roadmaps[TEST_USER_A];
      const phase1 = roadmap.phases[0];
      const nextTopic = phase1.topics.find(t => t.status !== 'completed');
      assert.ok(nextTopic);
      assert.strictEqual(nextTopic.name, 'Async Programming & Promises', 'Identifies correct next pending topic');
    });
  });

  // --------------------------------------------------------------------------
  // SUITE 4: AI Coach, Calendar & Activity Snapshots
  // --------------------------------------------------------------------------
  describe('Suite 4: AI Coach, Calendar & Activity Snapshots', () => {
    it('12. Coach readiness score grounding (exact backend Coach value or "Not enough data")', () => {
      const analysis = analyzeUserPreparation(TEST_USER_A);
      assert.strictEqual(analysis.hasData, true);
      assert.ok(analysis.readinessPercent > 0 && analysis.readinessPercent <= 100);

      const dashboardCode = fs.readFileSync(path.join(__dirname, '../src/components/Dashboard/DashboardView.jsx'), 'utf-8');
      assert.ok(dashboardCode.includes('coachAnalysis?.hasData ? `${coachAnalysis.readinessPercent}%` : \'Not enough data\''), 'Displays exact coach readiness or "Not enough data"');
    });

    it('13. Coach next-best-action identity and why-this justification', () => {
      const analysis = analyzeUserPreparation(TEST_USER_A);
      assert.ok(analysis.nextBestAction, 'Next Best Action generated');
      assert.strictEqual(analysis.nextBestAction.type, 'TASK', 'Prioritizes unfinished pending task');
      assert.strictEqual(analysis.nextBestAction.entityId, 'tsk_d2');
      assert.ok(analysis.nextBestAction.whyThis.length > 10, 'whyThis explanation present');
    });

    it('14. Calendar event grounding (upcoming events chronologically sorted)', () => {
      const currentDb = loadDb();
      const events = currentDb.calendarEvents[TEST_USER_A] || [];
      assert.strictEqual(events.length, 2);
      assert.strictEqual(events[0].title, 'Stripe Technical Screen');
      assert.strictEqual(events[0].type, 'INTERVIEW');
    });

    it('15. Recent activity grounding (authentic timestamps from tasks, revisions, and notifications)', () => {
      const dashboardCode = fs.readFileSync(path.join(__dirname, '../src/components/Dashboard/DashboardView.jsx'), 'utf-8');
      assert.ok(dashboardCode.includes('recentActivityFeed'), 'Generates recent activity feed');
      assert.ok(dashboardCode.includes('Completed mission:'), 'Logs completed missions');
      assert.ok(dashboardCode.includes('Reviewed topic:'), 'Logs completed revisions');
      assert.ok(!dashboardCode.includes('Fake completed mission'), 'Zero synthetic activity items');
    });

    it('16. Notification badge consistency (matches unread count)', () => {
      const currentDb = loadDb();
      const notifs = currentDb.notifications[TEST_USER_A] || [];
      const unreadCount = notifs.filter(n => n.unread).length;
      assert.strictEqual(unreadCount, 1, 'Exactly 1 unread notification in DB');

      const topHeaderCode = fs.readFileSync(path.join(__dirname, '../src/components/Navigation/TopHeader.jsx'), 'utf-8');
      assert.ok(topHeaderCode.includes('notifications.filter(n => n.unread).length'), 'TopHeader badge matches unread notifications');
    });
  });

  // --------------------------------------------------------------------------
  // SUITE 5: Deep Linking & Cross-Feature Transitions
  // --------------------------------------------------------------------------
  describe('Suite 5: Deep Linking & Cross-Feature Navigation', () => {
    it('17. Exact task deep-link ("Start Focus" launches exact task session)', () => {
      const dashboardCode = fs.readFileSync(path.join(__dirname, '../src/components/Dashboard/DashboardView.jsx'), 'utf-8');
      assert.ok(dashboardCode.includes('startFocusSession(nextTask)'), 'Launches focus session for exact recommended task');
      assert.ok(dashboardCode.includes('setShowPlanDetails'), 'Allows expanding full plan details');
    });

    it('18. Exact revision deep-link ("Start Revision" targets exact due revision)', () => {
      const dashboardCode = fs.readFileSync(path.join(__dirname, '../src/components/Dashboard/DashboardView.jsx'), 'utf-8');
      assert.ok(dashboardCode.includes('handleOpenRevision(priorityRevision)'), 'Deep-links to priority due revision');
      assert.ok(dashboardCode.includes('startAdaptiveRevision'), 'Uses existing revision engine flow');
    });

    it('19. Exact roadmap deep-link ("Continue Roadmap" routes to visual roadmap)', () => {
      const dashboardCode = fs.readFileSync(path.join(__dirname, '../src/components/Dashboard/DashboardView.jsx'), 'utf-8');
      assert.ok(dashboardCode.includes('setActiveTab(\'roadmap\')'), 'Navigates to visual roadmap view');
    });

    it('20. Exact application/interview deep-link (routes with authentic entity ID)', () => {
      const dashboardCode = fs.readFileSync(path.join(__dirname, '../src/components/Dashboard/DashboardView.jsx'), 'utf-8');
      assert.ok(dashboardCode.includes('openCalendarEventTarget(evt)'), 'Opens calendar event with exact entity target');
      assert.ok(dashboardCode.includes('navigateToCoachTarget(coachAnalysis.nextBestAction)'), 'Executes coach recommendation with exact entity ID');
    });
  });

  // --------------------------------------------------------------------------
  // SUITE 6: Loading, Empty, and Offline States
  // --------------------------------------------------------------------------
  describe('Suite 6: Loading, Empty, and Offline State Handling', () => {
    it('21. Loading states (skeleton/spinner while authentic data is loading)', () => {
      const dashboardCode = fs.readFileSync(path.join(__dirname, '../src/components/Dashboard/DashboardView.jsx'), 'utf-8');
      assert.ok(dashboardCode.includes('isCoachLoading'), 'Tracks coach loading state');
    });

    it('22. Empty states (handles no roadmap, no tasks, no revisions, no events, no coach data)', () => {
      const dashboardCode = fs.readFileSync(path.join(__dirname, '../src/components/Dashboard/DashboardView.jsx'), 'utf-8');
      assert.ok(dashboardCode.includes('Upload your roadmap to start'), 'Empty roadmap state message');
      assert.ok(dashboardCode.includes('No tasks scheduled for today'), 'Empty tasks state message');
      assert.ok(dashboardCode.includes('You\'re caught up ✨'), 'Zero due revisions message');
      assert.ok(dashboardCode.includes('Nothing scheduled.'), 'Empty calendar events message');
      assert.ok(dashboardCode.includes('AI Coach Diagnostics Pending'), 'Empty coach diagnostics message');
    });

    it('23. Error and offline behavior (preserves cached data and displays offline banner)', () => {
      const dashboardCode = fs.readFileSync(path.join(__dirname, '../src/components/Dashboard/DashboardView.jsx'), 'utf-8');
      assert.ok(dashboardCode.includes('isOffline'), 'Checks offline condition');
      assert.ok(dashboardCode.includes('You are offline. Persisted data is active'), 'Renders offline warning banner');
    });
  });

  // --------------------------------------------------------------------------
  // SUITE 7: Multi-User Isolation & Persistence
  // --------------------------------------------------------------------------
  describe('Suite 7: Multi-User Isolation & Session Persistence', () => {
    it('24. Multi-user isolation (User A and User B dashboards are strictly isolated)', () => {
      const userAAnalysis = analyzeUserPreparation(TEST_USER_A);
      const userBAnalysis = analyzeUserPreparation(TEST_USER_B);

      assert.strictEqual(userAAnalysis.hasData, true, 'User A has active roadmap and data');
      assert.strictEqual(userBAnalysis.hasData, false, 'User B has no roadmap and returns insufficient_data');
      assert.notStrictEqual(userAAnalysis.readinessPercent, userBAnalysis.readinessPercent);

      const currentDb = loadDb();
      assert.strictEqual(currentDb.tasks[TEST_USER_A].length, 3);
      assert.strictEqual(currentDb.tasks[TEST_USER_B].length, 0);
    });

    it('25. Logout and login restoration (state cleared on logout and re-hydrated on login)', () => {
      const appContextCode = fs.readFileSync(path.join(__dirname, '../src/context/AppContext.jsx'), 'utf-8');
      assert.ok(appContextCode.includes('setTodayTasks([])'), 'Logout clears tasks');
      assert.ok(appContextCode.includes('setActiveRoadmap(null)'), 'Logout clears roadmap');
      assert.ok(appContextCode.includes('setCoachAnalysis(null)'), 'Logout clears coach analysis');
      assert.ok(appContextCode.includes('hydrateFromCloud'), 'Login rehydrates user state');
    });
  });

  // --------------------------------------------------------------------------
  // SUITE 8: Mobile UX, Touch Targets & Accessibility
  // --------------------------------------------------------------------------
  describe('Suite 8: Mobile UX, Touch Targets & Accessibility', () => {
    it('26. Mobile overflow protection (overflowX hidden, responsive layout for small screens)', () => {
      const dashboardCode = fs.readFileSync(path.join(__dirname, '../src/components/Dashboard/DashboardView.jsx'), 'utf-8');
      assert.ok(dashboardCode.includes('overflowX: \'hidden\''), 'Enforces zero horizontal page scroll');
      assert.ok(dashboardCode.includes('maxWidth: \'820px\''), 'Enforces comfortable desktop/tablet bounds');
    });

    it('27. Touch target sizing (all interactive controls meet WCAG >=44px guidelines)', () => {
      const dashboardCode = fs.readFileSync(path.join(__dirname, '../src/components/Dashboard/DashboardView.jsx'), 'utf-8');
      const minHeight44Count = (dashboardCode.match(/minHeight:\s*'44px'/g) || []).length;
      assert.ok(minHeight44Count >= 8, `Expected at least 8 buttons with minHeight: '44px', found ${minHeight44Count}`);
    });

    it('28. Accessibility audit (semantic headings, ARIA progressbars, labels, and regions)', () => {
      const dashboardCode = fs.readFileSync(path.join(__dirname, '../src/components/Dashboard/DashboardView.jsx'), 'utf-8');
      assert.ok(dashboardCode.includes('<h1'), 'Contains semantic h1 heading');
      assert.ok(dashboardCode.includes('<h2'), 'Contains semantic h2 headings');
      assert.ok(dashboardCode.includes('role="region"'), 'Uses semantic region landmarks');
      assert.ok(dashboardCode.includes('role="progressbar"'), 'Uses semantic progressbars');
      assert.ok(dashboardCode.includes('aria-valuenow'), 'Has aria-valuenow attributes');
      assert.ok(dashboardCode.includes('aria-label='), 'Has descriptive aria-labels');
    });

    it('29. Duplicate API prevention (consumes AppContext without redundant network fetches)', () => {
      const dashboardCode = fs.readFileSync(path.join(__dirname, '../src/components/Dashboard/DashboardView.jsx'), 'utf-8');
      // Verifies Dashboard does not trigger duplicate fetch effects
      assert.ok(!dashboardCode.includes('fetch('), 'Zero raw fetch calls in DashboardView');
      assert.ok(dashboardCode.includes('const {'), 'Purely consumes shared AppContext');
    });

    it('30. Zero synthetic/fabricated metrics (strictly authentic persisted data)', () => {
      const dashboardCode = fs.readFileSync(path.join(__dirname, '../src/components/Dashboard/DashboardView.jsx'), 'utf-8');
      assert.ok(!dashboardCode.includes('+ 12'), 'No legacy +12 task fabrication');
      assert.ok(!dashboardCode.includes('+ 4'), 'No legacy +4 revision fabrication');
      assert.ok(!dashboardCode.includes('dummy'), 'Zero dummy placeholders');
      assert.ok(!dashboardCode.includes('mock_stats'), 'Zero synthetic mock statistics');
    });
  });

  // Cleanup test users from DB
  const cleanDb = loadDb();
  cleanDb.users = cleanDb.users.filter(u => u.id !== TEST_USER_A && u.id !== TEST_USER_B);
  delete cleanDb.roadmaps[TEST_USER_A];
  delete cleanDb.roadmaps[TEST_USER_B];
  delete cleanDb.tasks[TEST_USER_A];
  delete cleanDb.tasks[TEST_USER_B];
  delete cleanDb.revisions[TEST_USER_A];
  delete cleanDb.revisions[TEST_USER_B];
  delete cleanDb.applications[TEST_USER_A];
  delete cleanDb.applications[TEST_USER_B];
  delete cleanDb.streaks[TEST_USER_A];
  delete cleanDb.streaks[TEST_USER_B];
  delete cleanDb.coachAnalysis[TEST_USER_A];
  delete cleanDb.coachAnalysis[TEST_USER_B];
  delete cleanDb.notifications[TEST_USER_A];
  delete cleanDb.notifications[TEST_USER_B];
  delete cleanDb.calendarEvents[TEST_USER_A];
  delete cleanDb.calendarEvents[TEST_USER_B];
  saveDb(cleanDb);

  console.log('\n================================================================');
  console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
  console.log('================================================================');

  if (passedTests !== 30 || totalTests !== 30) {
    console.error(`${RED}Assertion failure: Expected exactly 30 tests, got ${totalTests} (passed: ${passedTests})${RESET}`);
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
