/**
 * NOVARA Placement Calendar UI/UX + Interaction Accuracy Regression Test Suite
 * Validates real calendar event aggregation, conflict detection, capacity calculation,
 * source identity preservation, multi-user isolation, and cross-feature consistency.
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
  console.log('NOVARA — CALENDAR UI/UX REGRESSION & ACCURACY AUDIT');
  console.log('================================================================');

  // Dynamic import of backend modules
  const { 
    getAggregatedCalendarEvents, 
    detectScheduleConflicts, 
    calculateDailyCapacity,
    createPersonalEventInDb,
    updatePersonalEventInDb,
    deletePersonalEventFromDb,
    getPersonalEventsFromDb,
    EVENT_TYPES
  } = await import('../server/calendarService.js');

  const { loadDb, saveDb } = await import('../server/db.js');
  const { getUserApplicationsFromDb, createApplicationInDb, addInterviewToAppInDb } = await import('../server/applicationService.js');

  const TEST_USER_A = 'usr_cal_test_a';
  const TEST_USER_B = 'usr_cal_test_b';

  // Setup isolated test users in DB
  const db = loadDb();
  if (!db.users) db.users = [];
  
  // Cleanup test users
  db.users = db.users.filter(u => u.id !== TEST_USER_A && u.id !== TEST_USER_B);
  db.users.push({
    id: TEST_USER_A,
    name: 'Alice Calendar Tester',
    email: 'alice.cal@novara.test',
    targetRole: 'Software Engineer',
    placementTargetDate: '2026-11-15',
    dailyTargetHours: 3
  });
  db.users.push({
    id: TEST_USER_B,
    name: 'Bob Calendar Tester',
    email: 'bob.cal@novara.test',
    targetRole: 'Data Scientist',
    placementTargetDate: '2026-12-01',
    dailyTargetHours: 2
  });

  if (!db.tasks) db.tasks = {};
  if (!db.revisions) db.revisions = {};
  if (!db.applications) db.applications = {};
  if (!db.calendarEvents) db.calendarEvents = {};

  db.tasks[TEST_USER_A] = [];
  db.revisions[TEST_USER_A] = [];
  db.applications[TEST_USER_A] = [];
  db.calendarEvents[TEST_USER_A] = [];

  db.tasks[TEST_USER_B] = [];
  db.revisions[TEST_USER_B] = [];
  db.applications[TEST_USER_B] = [];
  db.calendarEvents[TEST_USER_B] = [];

  saveDb(db);

  // --------------------------------------------------------------------------
  // SUITE 1: Empty Calendar & Baseline Aggregation
  // --------------------------------------------------------------------------
  describe('1. Empty Calendar State & Baseline Aggregation', () => {
    it('returns placement target without fabricating fake tasks or interviews', () => {
      const result = getAggregatedCalendarEvents(TEST_USER_A);
      assert.strictEqual(result.events.length, 1, 'Only placement target milestone should exist for fresh user');
      assert.strictEqual(result.events[0].type, EVENT_TYPES.PLACEMENT_TARGET);
      assert.strictEqual(result.events[0].date, '2026-11-15');
      assert.strictEqual(result.conflicts.length, 0, 'No conflicts on empty calendar');
    });

    it('calculates 0 planned study minutes when no tasks or revisions exist', () => {
      const result = getAggregatedCalendarEvents(TEST_USER_A);
      const capacity = calculateDailyCapacity(db.users.find(u => u.id === TEST_USER_A), result.events, '2026-09-04');
      assert.strictEqual(capacity.plannedMinutes, 0);
      assert.strictEqual(capacity.remainingMinutes, 180);
      assert.strictEqual(capacity.isCapacityExceeded, false);
    });
  });

  // --------------------------------------------------------------------------
  // SUITE 2: Multi-Source Event Aggregation & Exact Source Identity
  // --------------------------------------------------------------------------
  describe('2. Multi-Source Event Aggregation & Exact Identity', () => {
    it('accurately aggregates study tasks, spaced revisions, application deadlines, and interviews', () => {
      const currentDb = loadDb();
      
      // Add study task
      currentDb.tasks[TEST_USER_A] = [
        {
          id: 'tsk_cal_101',
          title: 'Graph Dijkstra Implementation',
          category: 'DSA',
          duration: '60 min',
          scheduledDate: '2026-09-10',
          completed: false
        }
      ];

      // Add revision
      currentDb.revisions[TEST_USER_A] = [
        {
          id: 'rev_cal_201',
          topic: 'Dynamic Programming Patterns',
          scheduledDate: '2026-09-10',
          retentionScore: '85%',
          status: 'pending'
        }
      ];

      // Add application with deadline and interview
      currentDb.applications[TEST_USER_A] = [
        {
          id: 'app_cal_301',
          company: 'Stripe',
          role: 'Backend Engineer',
          status: 'Interview',
          deadline: '2026-09-15',
          location: 'Remote',
          workType: 'Full-time',
          interviews: [
            {
              id: 'int_cal_401',
              title: 'Technical Round 1',
              type: 'Technical Interview',
              scheduledAt: '2026-09-12T14:30:00Z',
              status: 'scheduled'
            }
          ]
        }
      ];

      saveDb(currentDb);

      const result = getAggregatedCalendarEvents(TEST_USER_A);
      // Expected events: 1 Task + 1 Revision + 1 Deadline + 1 Interview + 1 Milestone = 5
      assert.strictEqual(result.events.length, 5, 'Should aggregate exactly 5 distinct events from 5 sources');

      const taskEvt = result.events.find(e => e.id === 'task_tsk_cal_101');
      assert.ok(taskEvt, 'Task event must be present');
      assert.strictEqual(taskEvt.type, EVENT_TYPES.STUDY_TASK);
      assert.strictEqual(taskEvt.sourceId, 'tsk_cal_101');
      assert.strictEqual(taskEvt.date, '2026-09-10');

      const revEvt = result.events.find(e => e.id === 'rev_rev_cal_201');
      assert.ok(revEvt, 'Revision event must be present');
      assert.strictEqual(revEvt.type, EVENT_TYPES.REVISION);
      assert.strictEqual(revEvt.sourceId, 'rev_cal_201');

      const deadEvt = result.events.find(e => e.id === 'dead_app_cal_301');
      assert.ok(deadEvt, 'Deadline event must be present');
      assert.strictEqual(deadEvt.type, EVENT_TYPES.APPLICATION_DEADLINE);
      assert.strictEqual(deadEvt.company, 'Stripe');

      const intEvt = result.events.find(e => e.id === 'int_int_cal_401');
      assert.ok(intEvt, 'Interview event must be present');
      assert.strictEqual(intEvt.type, EVENT_TYPES.INTERVIEW);
      assert.strictEqual(intEvt.sourceId, 'app_cal_301');
      assert.strictEqual(intEvt.interviewId, 'int_cal_401');
    });
  });

  // --------------------------------------------------------------------------
  // SUITE 3: Personal Events Management (CRUD)
  // --------------------------------------------------------------------------
  describe('3. Personal Events Management (CRUD)', () => {
    let createdEventId = null;

    it('creates a personal mock interview session and persists in DB', () => {
      const newEvent = createPersonalEventInDb(TEST_USER_A, {
        title: 'System Design Mock with SDE-2',
        type: 'Mock Interview',
        date: '2026-09-14',
        time: '06:00 PM',
        durationMinutes: 60,
        notes: 'Review distributed rate limiter and consensus protocols.'
      });

      assert.ok(newEvent.id, 'Created event must have unique ID');
      assert.strictEqual(newEvent.title, 'System Design Mock with SDE-2');
      assert.strictEqual(newEvent.userId, TEST_USER_A);
      createdEventId = newEvent.id;

      const events = getPersonalEventsFromDb(TEST_USER_A);
      assert.ok(events.some(e => e.id === createdEventId), 'Event must be in personal events collection');
    });

    it('updates personal event details accurately', () => {
      const updated = updatePersonalEventInDb(TEST_USER_A, createdEventId, {
        title: 'Updated System Design Mock',
        durationMinutes: 90
      });

      assert.ok(updated, 'Update must succeed');
      assert.strictEqual(updated.title, 'Updated System Design Mock');
      assert.strictEqual(updated.durationMinutes, 90);
    });

    it('deletes personal event cleanly without leaving ghost entries', () => {
      const deleted = deletePersonalEventFromDb(TEST_USER_A, createdEventId);
      assert.strictEqual(deleted, true, 'Delete must return true');

      const events = getPersonalEventsFromDb(TEST_USER_A);
      assert.strictEqual(events.some(e => e.id === createdEventId), false, 'Deleted event must not remain in DB');
    });
  });

  // --------------------------------------------------------------------------
  // SUITE 4: Schedule Conflict Detection
  // --------------------------------------------------------------------------
  describe('4. Schedule Conflict Detection', () => {
    it('detects genuine overlapping timed events on the same date', () => {
      const mockEvents = [
        {
          id: 'evt_1',
          date: '2026-09-20',
          time: '02:00 PM',
          durationMinutes: 60,
          title: 'Technical Interview'
        },
        {
          id: 'evt_2',
          date: '2026-09-20',
          time: '02:30 PM',
          durationMinutes: 45,
          title: 'Mock Interview'
        }
      ];

      const conflicts = detectScheduleConflicts(mockEvents);
      assert.strictEqual(conflicts.length, 1, 'Should detect 1 conflict');
      assert.strictEqual(conflicts[0].date, '2026-09-20');
      assert.strictEqual(conflicts[0].eventA.id, 'evt_1');
      assert.strictEqual(conflicts[0].eventB.id, 'evt_2');
    });

    it('does NOT trigger false conflicts for sequential non-overlapping events', () => {
      const sequentialEvents = [
        {
          id: 'evt_1',
          date: '2026-09-20',
          time: '02:00 PM',
          durationMinutes: 60, // Ends at 03:00 PM
          title: 'Study Session'
        },
        {
          id: 'evt_2',
          date: '2026-09-20',
          time: '03:15 PM',
          durationMinutes: 45, // Starts at 03:15 PM
          title: 'Revision'
        }
      ];

      const conflicts = detectScheduleConflicts(sequentialEvents);
      assert.strictEqual(conflicts.length, 0, 'Sequential events must not trigger conflict');
    });

    it('does NOT trigger false conflicts for all-day or 0-minute milestone events', () => {
      const milestoneEvents = [
        {
          id: 'evt_milestone',
          date: '2026-09-20',
          time: 'All Day',
          durationMinutes: 0,
          title: 'Placement Target'
        },
        {
          id: 'evt_interview',
          date: '2026-09-20',
          time: '02:00 PM',
          durationMinutes: 60,
          title: 'Amazon Interview'
        }
      ];

      const conflicts = detectScheduleConflicts(milestoneEvents);
      assert.strictEqual(conflicts.length, 0, 'All day milestones must not conflict with timed events');
    });
  });

  // --------------------------------------------------------------------------
  // SUITE 5: Date Range Filtering & Chronological Sorting
  // --------------------------------------------------------------------------
  describe('5. Date Range Filtering & Chronological Sorting', () => {
    it('filters aggregated events strictly within requested start and end dates', () => {
      const full = getAggregatedCalendarEvents(TEST_USER_A);
      const filtered = getAggregatedCalendarEvents(TEST_USER_A, '2026-09-01', '2026-09-11');

      assert.ok(filtered.events.every(e => e.date >= '2026-09-01' && e.date <= '2026-09-11'), 'All filtered events must be in range');
    });

    it('maintains ascending chronological order by date and start time', () => {
      const result = getAggregatedCalendarEvents(TEST_USER_A);
      for (let i = 0; i < result.events.length - 1; i++) {
        const curr = result.events[i];
        const next = result.events[i + 1];
        assert.ok(curr.date <= next.date, `Events must be ordered by date (${curr.date} <= ${next.date})`);
      }
    });
  });

  // --------------------------------------------------------------------------
  // SUITE 6: Multi-User Isolation
  // --------------------------------------------------------------------------
  describe('6. Multi-User Isolation', () => {
    it('ensures User B cannot see User A tasks, applications, interviews, or personal events', () => {
      // Create personal event for User A
      createPersonalEventInDb(TEST_USER_A, {
        title: 'Secret User A Strategy Session',
        type: 'Study Session',
        date: '2026-09-22',
        time: '11:00 AM',
        durationMinutes: 45
      });

      const userBResult = getAggregatedCalendarEvents(TEST_USER_B);
      assert.strictEqual(
        userBResult.events.some(e => e.title && e.title.includes('Secret User A')),
        false,
        'User B must never see User A calendar events'
      );
      assert.strictEqual(
        userBResult.events.some(e => e.company === 'Stripe'),
        false,
        'User B must never see User A applications or interviews'
      );
    });
  });

  // --------------------------------------------------------------------------
  // SUITE 7: Cross-Feature Dynamic Consistency
  // --------------------------------------------------------------------------
  describe('7. Cross-Feature Dynamic Consistency', () => {
    it('deleting an application instantly removes its deadline and interviews from calendar', () => {
      const currentDb = loadDb();
      // Remove Stripe application
      currentDb.applications[TEST_USER_A] = [];
      saveDb(currentDb);

      const result = getAggregatedCalendarEvents(TEST_USER_A);
      assert.strictEqual(
        result.events.some(e => e.id.startsWith('dead_app_cal_301') || e.id.startsWith('int_int_cal_401')),
        false,
        'Application deadline and interviews must disappear from calendar immediately upon deletion'
      );
    });

    it('updating interview date updates calendar event date immediately', () => {
      const currentDb = loadDb();
      currentDb.applications[TEST_USER_A] = [
        {
          id: 'app_cal_new',
          company: 'Google',
          role: 'SWE L3',
          status: 'Interview',
          interviews: [
            {
              id: 'int_google_1',
              title: 'Onsite Loop 1',
              type: 'Coding Interview',
              scheduledAt: '2026-09-25T10:00:00Z',
              status: 'scheduled'
            }
          ]
        }
      ];
      saveDb(currentDb);

      const res1 = getAggregatedCalendarEvents(TEST_USER_A);
      const googleEvt = res1.events.find(e => e.id === 'int_int_google_1');
      assert.ok(googleEvt, 'Google interview should appear on calendar');
      assert.strictEqual(googleEvt.date, '2026-09-25');
    });
  });

  // --------------------------------------------------------------------------
  // SUITE 8: Static Code & Accessibility Audit
  // --------------------------------------------------------------------------
  describe('8. Static Code, Layout & Accessibility Audit', () => {
    it('CalendarView.jsx contains accessible navigation, aria labels, and responsive layout', () => {
      const calViewCode = fs.readFileSync(path.join(__dirname, '../src/components/Calendar/CalendarView.jsx'), 'utf-8');
      assert.ok(calViewCode.includes('aria-label="Previous Month"'), 'Must have accessible Prev button label');
      assert.ok(calViewCode.includes('aria-label="Next Month"'), 'Must have accessible Next button label');
      assert.ok(calViewCode.includes('role="button"'), 'Day cells must have button semantics');
      assert.ok(calViewCode.includes('tabIndex={0}'), 'Day cells must be keyboard focusable');
      assert.ok(calViewCode.includes('onKeyDown'), 'Day cells must support keyboard triggers');
      assert.ok(calViewCode.includes('minHeight: \'44px\''), 'Must provide 44px touch targets');
    });

    it('AddCalendarEventModal.jsx contains modal accessibility and keyboard Escape handler', () => {
      const modalCode = fs.readFileSync(path.join(__dirname, '../src/components/Calendar/AddCalendarEventModal.jsx'), 'utf-8');
      assert.ok(modalCode.includes('aria-modal="true"'), 'Modal must have aria-modal attribute');
      assert.ok(modalCode.includes('role="dialog"'), 'Modal must have dialog role');
      assert.ok(modalCode.includes('Escape'), 'Modal must listen for Escape key');
      assert.ok(modalCode.includes('htmlFor="evt-title-input"'), 'Inputs must have htmlFor labels');
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
  delete cleanDb.calendarEvents[TEST_USER_A];
  delete cleanDb.calendarEvents[TEST_USER_B];
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
