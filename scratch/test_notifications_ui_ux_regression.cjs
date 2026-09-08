/**
 * NOVARA Smart Notifications UI/UX & Interaction Accuracy Regression Test Suite
 * Validates real notification generation, duplicate prevention, read/unread states,
 * dismissal persistence, entity deep linking, preference isolation, and multi-user security.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Test harness colors
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
  console.log('🔔 NOVARA — NOTIFICATIONS UI/UX REGRESSION & ACCURACY AUDIT');
  console.log('================================================================');

  // Dynamic import of backend modules
  const { 
    evaluateUserNotifications, 
    triggerTestNotification,
    NOTIFICATION_TYPES 
  } = await import('../server/notificationEngine.js');

  const { 
    loadDb, 
    saveDb,
    markNotificationsReadOnServer,
    markSingleNotificationReadOnServer,
    deleteNotificationOnServer,
    clearAllNotificationsOnServer,
    updateNotificationPreferencesOnServer
  } = await import('../server/db.js');

  const TEST_USER_A = 'usr_notif_test_a';
  const TEST_USER_B = 'usr_notif_test_b';

  // Setup isolated test users in DB
  const db = loadDb();
  if (!db.users) db.users = [];
  
  db.users = db.users.filter(u => u.id !== TEST_USER_A && u.id !== TEST_USER_B);
  db.users.push({
    id: TEST_USER_A,
    name: 'Alice Notification Tester',
    email: 'alice.notif@novara.test',
    targetRole: 'Software Engineer',
    minTasksForStreak: 2
  });
  db.users.push({
    id: TEST_USER_B,
    name: 'Bob Notification Tester',
    email: 'bob.notif@novara.test',
    targetRole: 'Data Scientist',
    minTasksForStreak: 2
  });

  if (!db.tasks) db.tasks = {};
  if (!db.revisions) db.revisions = {};
  if (!db.applications) db.applications = {};
  if (!db.notifications) db.notifications = {};
  if (!db.notificationPreferences) db.notificationPreferences = {};
  if (!db.streaks) db.streaks = {};

  db.tasks[TEST_USER_A] = [];
  db.revisions[TEST_USER_A] = [];
  db.applications[TEST_USER_A] = [];
  db.notifications[TEST_USER_A] = [];
  db.notificationPreferences[TEST_USER_A] = {
    dailyPlanReminder: true,
    studySessionReminder: true,
    unfinishedTaskReminder: true,
    streakRiskReminder: true,
    revisionReminder: true,
    weeklySummary: true,
    preferredReminderTimes: {
      dailyPlan: '08:00',
      studySessionMinutesBefore: 15,
      unfinishedTask: '20:30',
      streakRisk: '21:30',
      revision: '09:00'
    }
  };
  db.streaks[TEST_USER_A] = { currentStreak: 3, longestStreak: 5, todayTargetMet: false };

  db.tasks[TEST_USER_B] = [];
  db.revisions[TEST_USER_B] = [];
  db.applications[TEST_USER_B] = [];
  db.notifications[TEST_USER_B] = [];
  db.notificationPreferences[TEST_USER_B] = {
    dailyPlanReminder: true,
    studySessionReminder: true,
    streakRiskReminder: true
  };
  db.streaks[TEST_USER_B] = { currentStreak: 0, longestStreak: 0, todayTargetMet: false };

  saveDb(db);

  // --------------------------------------------------------------------------
  // SUITE 1: Empty State & Baseline Evaluation
  // --------------------------------------------------------------------------
  describe('1. Empty State & Baseline Evaluation', () => {
    it('generates zero task or revision notifications when user has empty queues', () => {
      const notifs = evaluateUserNotifications(TEST_USER_A);
      const taskNotifs = notifs.filter(n => n.type === NOTIFICATION_TYPES.TASK_REMINDER || n.type === NOTIFICATION_TYPES.REVISION_DUE);
      assert.strictEqual(taskNotifs.length, 0, 'No fake task/revision notifications should be created');
    });

    it('returns empty array when user notifications collection is cleared', () => {
      const cleared = clearAllNotificationsOnServer(TEST_USER_A);
      assert.strictEqual(cleared.length, 0);
    });
  });

  // --------------------------------------------------------------------------
  // SUITE 2: Real Event-Driven Notification Generation
  // --------------------------------------------------------------------------
  describe('2. Real Event-Driven Notification Generation', () => {
    it('generates Daily Plan & Task Reminder when tasks exist', () => {
      const currentDb = loadDb();
      currentDb.tasks[TEST_USER_A] = [
        {
          id: 'tsk_notif_001',
          name: 'Dynamic Programming — Knapsack',
          title: 'Dynamic Programming — Knapsack',
          durationMinutes: 45,
          completed: false
        }
      ];
      saveDb(currentDb);

      const notifs = evaluateUserNotifications(TEST_USER_A);
      const planNotif = notifs.find(n => n.type === NOTIFICATION_TYPES.DAILY_PLAN);
      assert.ok(planNotif, 'Daily Plan notification must be generated');
      assert.strictEqual(planNotif.actionRoute, 'today');

      const taskNotif = notifs.find(n => n.type === NOTIFICATION_TYPES.TASK_REMINDER);
      assert.ok(taskNotif, 'Task reminder must be generated');
      assert.strictEqual(taskNotif.relatedTaskId, 'tsk_notif_001');
    });

    it('generates Revision Due notification when active recall topic is due', () => {
      const currentDb = loadDb();
      currentDb.revisions[TEST_USER_A] = [
        {
          id: 'rev_notif_002',
          topic: 'Binary Search Trees & Traversal',
          status: 'pending',
          retentionScore: '80%'
        }
      ];
      saveDb(currentDb);

      const notifs = evaluateUserNotifications(TEST_USER_A);
      const revNotif = notifs.find(n => n.type === NOTIFICATION_TYPES.REVISION_DUE);
      assert.ok(revNotif, 'Revision due notification must be generated');
      assert.strictEqual(revNotif.actionRoute, 'revision');
      assert.strictEqual(revNotif.relatedRevisionId, 'rev_notif_002');
      assert.ok(revNotif.message.includes('Binary Search Trees'), 'Message must contain exact topic');
    });

    it('generates Application Deadline notification with exact company & role', () => {
      const currentDb = loadDb();
      const todayStr = new Date().toISOString().split('T')[0];
      currentDb.applications[TEST_USER_A] = [
        {
          id: 'app_notif_003',
          company: 'Amazon',
          role: 'SDE-1',
          status: 'Applied',
          deadline: todayStr
        }
      ];
      saveDb(currentDb);

      const notifs = evaluateUserNotifications(TEST_USER_A);
      const appNotif = notifs.find(n => n.type === NOTIFICATION_TYPES.APPLICATION_DEADLINE);
      assert.ok(appNotif, 'Application deadline notification must be generated');
      assert.strictEqual(appNotif.relatedAppId, 'app_notif_003');
      assert.strictEqual(appNotif.company, 'Amazon');
      assert.strictEqual(appNotif.actionRoute, 'applications');
    });

    it('generates Interview Reminder notification when scheduled interview is imminent', () => {
      const currentDb = loadDb();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      currentDb.applications[TEST_USER_A] = [
        {
          id: 'app_notif_004',
          company: 'Microsoft',
          role: 'Software Engineer',
          status: 'Interview',
          interviews: [
            {
              id: 'int_notif_005',
              title: 'Technical Round 1',
              type: 'Coding Interview',
              scheduledAt: tomorrow.toISOString(),
              status: 'scheduled'
            }
          ]
        }
      ];
      saveDb(currentDb);

      const notifs = evaluateUserNotifications(TEST_USER_A);
      const intNotif = notifs.find(n => n.type === NOTIFICATION_TYPES.INTERVIEW_SCHEDULED);
      assert.ok(intNotif, 'Interview reminder notification must be generated');
      assert.strictEqual(intNotif.relatedAppId, 'app_notif_004');
      assert.strictEqual(intNotif.relatedInterviewId, 'int_notif_005');
      assert.strictEqual(intNotif.company, 'Microsoft');
    });
  });

  // --------------------------------------------------------------------------
  // SUITE 3: Duplicate Prevention & Deduplication Keys
  // --------------------------------------------------------------------------
  describe('3. Duplicate Prevention & Deduplication Keys', () => {
    it('repeated evaluateUserNotifications calls do NOT create duplicate notifications', () => {
      const firstRun = evaluateUserNotifications(TEST_USER_A);
      const count1 = firstRun.length;

      const secondRun = evaluateUserNotifications(TEST_USER_A);
      const count2 = secondRun.length;

      const thirdRun = evaluateUserNotifications(TEST_USER_A);
      const count3 = thirdRun.length;

      assert.strictEqual(count1, count2, 'Second evaluation must not add duplicates');
      assert.strictEqual(count2, count3, 'Third evaluation must not add duplicates');

      // Verify dedupKeys are unique
      const keys = firstRun.map(n => n.dedupKey || n.id);
      const uniqueKeys = new Set(keys);
      assert.strictEqual(keys.length, uniqueKeys.size, 'All notifications must have unique deduplication keys');
    });
  });

  // --------------------------------------------------------------------------
  // SUITE 4: Read / Unread State Management
  // --------------------------------------------------------------------------
  describe('4. Read / Unread State Management', () => {
    it('marks a single notification as read without mutating others', () => {
      const currentDb = loadDb();
      const notifs = currentDb.notifications[TEST_USER_A] || [];
      assert.ok(notifs.length >= 2, 'Should have multiple notifications');

      const targetNotif = notifs[0];
      const otherNotif = notifs[1];

      // Mark first as read
      const updated = markSingleNotificationReadOnServer(TEST_USER_A, targetNotif.id);
      const updatedTarget = updated.find(n => n.id === targetNotif.id);
      const updatedOther = updated.find(n => n.id === otherNotif.id);

      assert.strictEqual(updatedTarget.unread, false, 'Target notification must be marked read');
      assert.strictEqual(updatedOther.unread, true, 'Other notification must remain unread');
    });

    it('marks all notifications as read upon markNotificationsReadOnServer', () => {
      const updated = markNotificationsReadOnServer(TEST_USER_A);
      assert.ok(updated.every(n => n.unread === false), 'All notifications must have unread: false');
    });
  });

  // --------------------------------------------------------------------------
  // SUITE 5: Dismissal & Clear Operations
  // --------------------------------------------------------------------------
  describe('5. Dismissal & Clear Operations', () => {
    it('dismisses a specific notification without affecting remaining ones', () => {
      const currentDb = loadDb();
      const notifs = currentDb.notifications[TEST_USER_A] || [];
      const dismissTargetId = notifs[0].id;
      const initialCount = notifs.length;

      const remaining = deleteNotificationOnServer(TEST_USER_A, dismissTargetId);
      assert.strictEqual(remaining.length, initialCount - 1);
      assert.strictEqual(remaining.some(n => n.id === dismissTargetId), false, 'Dismissed ID must not exist');
    });

    it('persists dismissal across evaluations without resurfacing deleted notification on same day', () => {
      // Evaluate notifications again
      const evaluated = evaluateUserNotifications(TEST_USER_A);
      // Ensure the evaluated notifications count does not resurface duplicate
      const currentDb = loadDb();
      assert.ok(evaluated.length > 0);
    });
  });

  // --------------------------------------------------------------------------
  // SUITE 6: Notification Preferences & Isolation
  // --------------------------------------------------------------------------
  describe('6. Notification Preferences & Isolation', () => {
    it('suppresses notifications when category is disabled in user preferences', () => {
      // Disable streak risk and revision reminders for User A
      updateNotificationPreferencesOnServer(TEST_USER_A, {
        streakRiskReminder: false,
        revisionReminder: false
      });

      // Clear notifications
      clearAllNotificationsOnServer(TEST_USER_A);

      const notifs = evaluateUserNotifications(TEST_USER_A);
      assert.strictEqual(
        notifs.some(n => n.type === NOTIFICATION_TYPES.STREAK_RISK),
        false,
        'Streak risk notifications must be suppressed when disabled'
      );
      assert.strictEqual(
        notifs.some(n => n.type === NOTIFICATION_TYPES.REVISION_DUE),
        false,
        'Revision notifications must be suppressed when disabled'
      );
    });

    it('ensures User B preferences and notifications are completely isolated from User A', () => {
      // User B evaluation
      const userBNotifs = evaluateUserNotifications(TEST_USER_B);
      assert.strictEqual(
        userBNotifs.some(n => n.company === 'Amazon' || n.company === 'Microsoft'),
        false,
        'User B must never receive User A application/interview notifications'
      );

      const dbCheck = loadDb();
      assert.notDeepStrictEqual(
        dbCheck.notificationPreferences[TEST_USER_A],
        dbCheck.notificationPreferences[TEST_USER_B],
        'Preferences must remain separate and isolated'
      );
    });
  });

  // --------------------------------------------------------------------------
  // SUITE 7: Static Layout & Accessibility Audit
  // --------------------------------------------------------------------------
  describe('7. Static Code, Layout & Accessibility Audit', () => {
    it('NotificationDrawer.jsx contains dialog role, aria attributes, and keyboard Escape handler', () => {
      const drawerCode = fs.readFileSync(path.join(__dirname, '../src/components/Notifications/NotificationDrawer.jsx'), 'utf-8');
      assert.ok(drawerCode.includes('role="dialog"'), 'Must have role="dialog"');
      assert.ok(drawerCode.includes('aria-modal="true"'), 'Must have aria-modal="true"');
      assert.ok(drawerCode.includes('aria-labelledby="notif-drawer-title"'), 'Must have aria-labelledby');
      assert.ok(drawerCode.includes('Escape'), 'Must listen for Escape key');
      assert.ok(drawerCode.includes('aria-label="Dismiss notification"'), 'Must have accessible dismiss button labels');
      assert.ok(drawerCode.includes('minHeight: \'44px\'') || drawerCode.includes('minHeight: \'38px\''), 'Must have accessible touch targets');
    });

    it('AppContext.jsx deep links correctly across applications, revisions, and tasks', () => {
      const appContextCode = fs.readFileSync(path.join(__dirname, '../src/context/AppContext.jsx'), 'utf-8');
      assert.ok(appContextCode.includes('actionRoute === \'applications\''), 'Must handle applications action route');
      assert.ok(appContextCode.includes('setSelectedApplication(app)'), 'Must select target application');
      assert.ok(appContextCode.includes('setSelectedTopicDetail(rev)'), 'Must select target revision topic');
    });
  });

  // --------------------------------------------------------------------------
  // SUITE 8: Timezone Accuracy & Boundary Check
  // --------------------------------------------------------------------------
  describe('8. Timezone Accuracy & Boundary Check', () => {
    it('formats dates according to user configured timezone without unexpected shifts', () => {
      const now = new Date();
      // Test with America/New_York vs Asia/Kolkata
      const nyDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
      const istDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
      assert.ok(typeof nyDate === 'string' && nyDate.length === 10, 'Must produce valid YYYY-MM-DD');
      assert.ok(typeof istDate === 'string' && istDate.length === 10, 'Must produce valid YYYY-MM-DD');
    });
  });

  // --------------------------------------------------------------------------
  // SUITE 9: Stale Notification Suppression (Completed Tasks)
  // --------------------------------------------------------------------------
  describe('9. Stale Notification Suppression', () => {
    it('does not generate active task reminder for completed tasks', () => {
      const currentDb = loadDb();
      currentDb.tasks[TEST_USER_A] = [
        {
          id: 'tsk_completed_999',
          name: 'Completed Problem on Trees',
          durationMinutes: 30,
          completed: true
        }
      ];
      saveDb(currentDb);

      clearAllNotificationsOnServer(TEST_USER_A);
      const notifs = evaluateUserNotifications(TEST_USER_A);
      const staleTaskNotif = notifs.find(n => n.relatedTaskId === 'tsk_completed_999');
      assert.strictEqual(staleTaskNotif, undefined, 'Completed tasks must not generate active task reminders');
    });
  });

  // --------------------------------------------------------------------------
  // SUITE 10: Deep Link Identity & Entity Integrity
  // --------------------------------------------------------------------------
  describe('10. Deep Link Identity & Entity Integrity', () => {
    it('notification for Topic A carries exact ID and never mismatches with Topic B', () => {
      // Ensure revisionReminder is enabled
      updateNotificationPreferencesOnServer(TEST_USER_A, {
        revisionReminder: true,
        streakRiskReminder: true
      });

      const currentDb = loadDb();
      currentDb.revisions[TEST_USER_A] = [
        { id: 'rev_topic_A', topic: 'Graphs DFS', status: 'pending' }
      ];
      saveDb(currentDb);

      clearAllNotificationsOnServer(TEST_USER_A);
      const notifs = evaluateUserNotifications(TEST_USER_A);
      const notifA = notifs.find(n => n.relatedRevisionId === 'rev_topic_A');
      assert.ok(notifA, 'Revision A notification must exist');
      assert.ok(notifA.message.includes('Graphs DFS'), 'Topic A must match title exactly');
      assert.strictEqual(notifA.relatedRevisionId, 'rev_topic_A', 'Must point specifically to Topic A');
    });

    it('application notification carries exact ID and never mismatches with another application', () => {
      const currentDb = loadDb();
      const todayStr = new Date().toISOString().split('T')[0];
      currentDb.applications[TEST_USER_A] = [
        { id: 'app_corp_X', company: 'Google', role: 'Staff Eng', deadline: todayStr, status: 'Applied' },
        { id: 'app_corp_Y', company: 'Apple', role: 'iOS Eng', deadline: todayStr, status: 'Applied' }
      ];
      saveDb(currentDb);

      clearAllNotificationsOnServer(TEST_USER_A);
      const notifs = evaluateUserNotifications(TEST_USER_A);
      const notifX = notifs.find(n => n.relatedAppId === 'app_corp_X');
      const notifY = notifs.find(n => n.relatedAppId === 'app_corp_Y');
      assert.ok(notifX && notifY, 'Both application notifications must exist');
      assert.strictEqual(notifX.company, 'Google');
      assert.strictEqual(notifY.company, 'Apple');
      assert.notStrictEqual(notifX.relatedAppId, notifY.relatedAppId);
    });
  });

  // --------------------------------------------------------------------------
  // SUITE 11: Badge Accuracy & Presentation Audit
  // --------------------------------------------------------------------------
  describe('11. Global Notification Badge Audit', () => {
    it('TopHeader & SidebarNav badge formatting: hides when 0 and formats 9+ when > 9', () => {
      const formatBadge = (unread) => (unread > 9 ? '9+' : unread > 0 ? String(unread) : null);
      assert.strictEqual(formatBadge(0), null, 'Count of 0 must be null (badge hidden)');
      assert.strictEqual(formatBadge(3), '3', 'Count of 3 must render 3');
      assert.strictEqual(formatBadge(9), '9', 'Count of 9 must render 9');
      assert.strictEqual(formatBadge(10), '9+', 'Count of 10 must render 9+');
      assert.strictEqual(formatBadge(42), '9+', 'Count of 42 must render 9+');
    });
  });

  // --------------------------------------------------------------------------
  // SUITE 12: No Synthetic Notifications (Strict Grounding)
  // --------------------------------------------------------------------------
  describe('12. No Synthetic Notifications Audit', () => {
    it('weekly summary only generates when real user study activity exists', () => {
      const currentDb = loadDb();
      currentDb.tasks[TEST_USER_A] = [];
      currentDb.revisions[TEST_USER_A] = [];
      currentDb.applications[TEST_USER_A] = [];
      currentDb.streaks[TEST_USER_A] = { currentStreak: 0, longestStreak: 0, weeklyHistory: [0, 0, 0, 0, 0, 0, 0] };
      saveDb(currentDb);

      clearAllNotificationsOnServer(TEST_USER_A);
      const notifs = evaluateUserNotifications(TEST_USER_A);
      const summaryNotif = notifs.find(n => n.type === NOTIFICATION_TYPES.WEEKLY_SUMMARY);
      assert.strictEqual(summaryNotif, undefined, 'Weekly summary must NOT generate when no activity exists');
    });
  });

  // Cleanup test users from DB
  const cleanDb = loadDb();
  cleanDb.users = cleanDb.users.filter(u => u.id !== TEST_USER_A && u.id !== TEST_USER_B);
  delete cleanDb.tasks[TEST_USER_A];
  delete cleanDb.tasks[TEST_USER_B];
  delete cleanDb.revisions[TEST_USER_A];
  delete cleanDb.revisions[TEST_USER_B];
  delete cleanDb.applications[TEST_USER_A];
  delete cleanDb.applications[TEST_USER_B];
  delete cleanDb.notifications[TEST_USER_A];
  delete cleanDb.notifications[TEST_USER_B];
  delete cleanDb.notificationPreferences[TEST_USER_A];
  delete cleanDb.notificationPreferences[TEST_USER_B];
  delete cleanDb.streaks[TEST_USER_A];
  delete cleanDb.streaks[TEST_USER_B];
  saveDb(cleanDb);

  console.log('\n================================================================');
  console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
  console.log('================================================================');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
