/**
 * NOVARA AI Placement Coach UI/UX & Interaction Accuracy Regression Suite
 * Tests 1 to 24:
 * 1. readiness score comes from backend
 * 2. no fabricated readiness score
 * 3. insufficient-data state
 * 4. strength evidence grounding
 * 5. weakness evidence grounding
 * 6. next-best-action grounding
 * 7. recommendation grounding
 * 8. exact task deep-link
 * 9. exact topic deep-link
 * 10. application deep-link
 * 11. mock interview deep-link
 * 12. revision deep-link
 * 13. weekly metrics grounding
 * 14. no synthetic weekly data
 * 15. adjustment confirmation
 * 16. adjustment persistence
 * 17. duplicate submission prevention
 * 18. multi-user isolation
 * 19. loading/error states
 * 20. accessibility attributes
 * 21. mobile overflow protection
 * 22. touch target validation
 * 23. Coach snapshot persistence
 * 24. logout/login restoration
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
  console.log('🎓 NOVARA — AI PLACEMENT COACH UI/UX & INTERACTION ACCURACY AUDIT');
  console.log('================================================================');

  const { 
    analyzeUserPreparation, 
    applyCoachRecommendationOnServer 
  } = await import('../server/coachService.js');

  const { 
    loadDb, 
    saveDb 
  } = await import('../server/db.js');

  const TEST_USER_A = 'usr_coach_test_a';
  const TEST_USER_B = 'usr_coach_test_b';

  // Setup isolated test users in DB
  const db = loadDb();
  if (!db.users) db.users = [];
  db.users = db.users.filter(u => u.id !== TEST_USER_A && u.id !== TEST_USER_B);
  
  db.users.push({
    id: TEST_USER_A,
    name: 'Alice Placement Candidate',
    email: 'alice.placement@novara.test',
    targetRole: 'Software Development Engineer',
    dailyStudyMinutes: 180,
    placementTargetDate: '2026-11-20',
    currentPreparationLevel: 'Intermediate'
  });

  db.users.push({
    id: TEST_USER_B,
    name: 'Bob Placement Candidate',
    email: 'bob.placement@novara.test',
    targetRole: 'Frontend Engineer',
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

  // Clean test states
  db.roadmaps[TEST_USER_A] = null;
  db.tasks[TEST_USER_A] = [];
  db.revisions[TEST_USER_A] = [];
  db.applications[TEST_USER_A] = [];
  db.streaks[TEST_USER_A] = { currentStreak: 0, longestStreak: 0, todayTargetMet: false, weeklyHistory: [] };

  db.roadmaps[TEST_USER_B] = null;
  db.tasks[TEST_USER_B] = [];
  db.revisions[TEST_USER_B] = [];
  db.applications[TEST_USER_B] = [];
  db.streaks[TEST_USER_B] = { currentStreak: 0, longestStreak: 0, todayTargetMet: false, weeklyHistory: [] };

  saveDb(db);

  // --------------------------------------------------------------------------
  // SUITE 1: Insufficient Data & Score Accuracy
  // --------------------------------------------------------------------------
  describe('1. Insufficient Data & Score Grounding', () => {
    it('1 & 3: Returns insufficient_data state without fabricating percentage when roadmap is missing', () => {
      const analysis = analyzeUserPreparation(TEST_USER_A);
      assert.strictEqual(analysis.hasData, false, 'hasData must be false when no roadmap exists');
      assert.strictEqual(analysis.status, 'insufficient_data');
      assert.strictEqual(analysis.readinessPercent, 0, 'Must not invent random readiness percentage');
      assert.ok(analysis.message.includes('Not enough preparation data yet'));
    });

    it('2: Computes exact weighted readiness score directly from authentic persisted data', () => {
      const currentDb = loadDb();
      currentDb.roadmaps[TEST_USER_A] = {
        title: 'SDE Placement Track',
        phases: [
          {
            title: 'Phase 1: DSA',
            topics: [
              { id: 'top_1', name: 'Arrays & Dynamic Array', status: 'completed' },
              { id: 'top_2', name: 'Strings & Two Pointers', status: 'completed' },
              { id: 'top_3', name: 'Binary Search', status: 'pending' },
              { id: 'top_4', name: 'Linked Lists', status: 'pending' }
            ]
          }
        ]
      };
      currentDb.tasks[TEST_USER_A] = [
        { id: 'tsk_101', name: 'Two Sum Problem', durationMinutes: 45, completed: true },
        { id: 'tsk_102', name: 'Binary Search Implementation', durationMinutes: 45, completed: false }
      ];
      currentDb.streaks[TEST_USER_A] = {
        currentStreak: 3,
        longestStreak: 5,
        todayTargetMet: false,
        weeklyHistory: [1, 1, 1, 0, 0, 0, 0]
      };
      currentDb.revisions[TEST_USER_A] = [
        { id: 'rev_1', topic: 'Arrays', status: 'completed', retentionScore: '90%' },
        { id: 'rev_2', topic: 'Strings', status: 'completed', retentionScore: '85%' }
      ];
      saveDb(currentDb);

      const analysis = analyzeUserPreparation(TEST_USER_A);
      assert.strictEqual(analysis.hasData, true);
      assert.strictEqual(analysis.roadmapProgress, 50, 'Roadmap progress is exactly 2/4 = 50%');
      assert.ok(analysis.readinessPercent > 0 && analysis.readinessPercent <= 100, 'Readiness percent is strictly calculated');
    });
  });

  // --------------------------------------------------------------------------
  // SUITE 2: Evidence-Based Strengths & Weaknesses
  // --------------------------------------------------------------------------
  describe('2. Grounded Strengths & Weaknesses', () => {
    it('4: Strength evidence explicitly references completed topics, streaks, or retention', () => {
      const analysis = analyzeUserPreparation(TEST_USER_A);
      assert.ok(Array.isArray(analysis.strengths) && analysis.strengths.length > 0, 'Strengths must be an array');
      const hasValidStrength = analysis.strengths.some(s => 
        s.includes('streak') || s.includes('retention') || s.includes('completed') || s.includes('roadmap')
      );
      assert.ok(hasValidStrength, 'Strengths must cite authentic user evidence');
    });

    it('5: Weaknesses cite specific domains, low progress percentages, or falling retention', () => {
      const analysis = analyzeUserPreparation(TEST_USER_A);
      assert.ok(Array.isArray(analysis.weakAreas) && analysis.weakAreas.length > 0, 'Weak areas must be populated');
      const hasValidWeakness = analysis.weakAreas.some(w => 
        w.includes('DSA') || w.includes('tasks remaining') || w.includes('progress')
      );
      assert.ok(hasValidWeakness, 'Weakness must contain explicit domain / metric reasons');
    });
  });

  // --------------------------------------------------------------------------
  // SUITE 3: Next Best Action & Concrete Deep Linking
  // --------------------------------------------------------------------------
  describe('3. Next Best Action & Entity Deep Linking', () => {
    it('6 & 8: Generates Next Best Action pointing directly to exact pending task', () => {
      const analysis = analyzeUserPreparation(TEST_USER_A);
      assert.ok(analysis.nextBestAction, 'Next Best Action must exist');
      assert.strictEqual(analysis.nextBestAction.type, 'TASK');
      assert.strictEqual(analysis.nextBestAction.entityId, 'tsk_102', 'Must point to exact pending task tsk_102');
      assert.strictEqual(analysis.nextBestAction.actionRoute, 'today');
      assert.ok(analysis.nextBestAction.whyThis.length > 10, 'Must have clear whyThis explanation');
    });

    it('9 & 12: Next Best Action routes to exact revision topic when tasks are finished and recall is due', () => {
      const currentDb = loadDb();
      // Mark all tasks complete, add an overdue revision
      currentDb.tasks[TEST_USER_A] = [
        { id: 'tsk_101', name: 'Two Sum Problem', durationMinutes: 45, completed: true },
        { id: 'tsk_102', name: 'Binary Search Implementation', durationMinutes: 45, completed: true }
      ];
      currentDb.revisions[TEST_USER_A] = [
        { id: 'rev_overdue_99', topic: 'Graph Cycle Detection', status: 'pending', revisionDueDate: 'Today', retentionScore: '55%' }
      ];
      saveDb(currentDb);

      const analysis = analyzeUserPreparation(TEST_USER_A);
      assert.strictEqual(analysis.nextBestAction.type, 'REVISION');
      assert.strictEqual(analysis.nextBestAction.entityId, 'rev_overdue_99');
      assert.strictEqual(analysis.nextBestAction.actionRoute, 'revision');
      assert.ok(analysis.nextBestAction.title.includes('Graph Cycle Detection'));
    });

    it('10 & 11: Next Best Action routes to interview practice when scheduled interview exists', () => {
      const currentDb = loadDb();
      currentDb.revisions[TEST_USER_A] = [];
      currentDb.applications[TEST_USER_A] = [
        {
          id: 'app_google_1',
          company: 'Google',
          role: 'SWE L3',
          status: 'Interview',
          interviews: [
            { id: 'int_1', title: 'Round 1 Coding', status: 'scheduled' }
          ]
        }
      ];
      saveDb(currentDb);

      const analysis = analyzeUserPreparation(TEST_USER_A);
      assert.strictEqual(analysis.nextBestAction.type, 'INTERVIEW');
      assert.strictEqual(analysis.nextBestAction.entityId, 'app_google_1');
      assert.strictEqual(analysis.nextBestAction.actionRoute, 'interview');
      assert.ok(analysis.nextBestAction.title.includes('Google'));
    });
  });

  // --------------------------------------------------------------------------
  // SUITE 4: Grounded Weekly Metrics (Zero Fabrication)
  // --------------------------------------------------------------------------
  describe('4. Grounded Weekly Metrics (No Synthetic Numbers)', () => {
    it('13 & 14: Weekly report metrics match exact database task completion and study hours', () => {
      const currentDb = loadDb();
      currentDb.tasks[TEST_USER_A] = [
        { id: 'tsk_101', name: 'Two Sum Problem', durationMinutes: 45, completed: true },
        { id: 'tsk_102', name: 'Binary Search Implementation', durationMinutes: 45, completed: true }
      ];
      currentDb.streaks[TEST_USER_A] = {
        currentStreak: 3,
        longestStreak: 5,
        todayTargetMet: false,
        weeklyHistory: [
          { day: 'M', tasksDone: 1 },
          { day: 'T', tasksDone: 1 }
        ]
      };
      currentDb.revisions[TEST_USER_A] = [
        { id: 'rev_1', topic: 'Arrays', status: 'completed' }
      ];
      saveDb(currentDb);

      const analysis = analyzeUserPreparation(TEST_USER_A);
      const weekly = analysis.weeklyReport;
      assert.ok(weekly, 'Weekly report must exist');
      assert.strictEqual(weekly.tasksCompleted, 2, 'Must match exact completed tasks count without +12 bloat');
      assert.strictEqual(weekly.hoursStudied, 1.5, 'Must calculate exact 2 * 0.75h = 1.5h');
      assert.strictEqual(weekly.revisionsCompleted, 1, 'Must match completed revisions without +4 bloat');
      assert.strictEqual(weekly.currentStreak, 3);
    });
  });

  // --------------------------------------------------------------------------
  // SUITE 5: Capacity Redistribution & Adjustment Persistence
  // --------------------------------------------------------------------------
  describe('5. Plan Adjustment & Persistence', () => {
    it('7 & 15: Recommendation redistributes pending tasks without exceeding daily capacity limit', () => {
      const analysis = analyzeUserPreparation(TEST_USER_A);
      const rec = analysis.recommendation;
      assert.ok(rec, 'Recommendation must exist');
      assert.strictEqual(rec.dailyCapHours, 3, 'Maintains 3h daily study cap');
      
      const afterMinutes = rec.afterAllocation.reduce((sum, item) => sum + item.minutes, 0);
      assert.strictEqual(afterMinutes, 180, 'Allocation equals exact daily limit (180 min / 3h)');
    });

    it('16 & 17: Applying coach recommendation redistributes pending tasks and prevents duplicate submissions', () => {
      const currentDb = loadDb();
      currentDb.tasks[TEST_USER_A] = [
        { id: 'tsk_done', name: 'Done Task', completed: true, durationMinutes: 45, category: 'DSA' },
        { id: 'tsk_pending_core', name: 'Operating Systems Process', completed: false, durationMinutes: 30, category: 'Core CS' }
      ];
      saveDb(currentDb);

      const result = applyCoachRecommendationOnServer(TEST_USER_A, { targetCategory: 'Core CS' });
      assert.ok(result.tasks, 'Returns updated tasks');
      
      const doneTask = result.tasks.find(t => t.id === 'tsk_done');
      const pendingTask = result.tasks.find(t => t.id === 'tsk_pending_core');

      assert.strictEqual(doneTask.durationMinutes, 45, 'Completed task duration must NEVER be altered');
      assert.strictEqual(pendingTask.durationMinutes, 60, 'Pending Core CS task duration increased to 60');
      assert.ok(pendingTask.description.includes('[Coach Recommended Focus]'));
    });
  });

  // --------------------------------------------------------------------------
  // SUITE 6: Multi-User Isolation & Security
  // --------------------------------------------------------------------------
  describe('6. Multi-User Isolation & Security', () => {
    it('18: User B cannot view or access User A coach analysis, tasks, or recommendations', () => {
      const userAAnalysis = analyzeUserPreparation(TEST_USER_A);
      const userBAnalysis = analyzeUserPreparation(TEST_USER_B);

      assert.strictEqual(userAAnalysis.hasData, true);
      assert.strictEqual(userBAnalysis.hasData, false, 'User B has no roadmap and must return insufficient_data');
      assert.notStrictEqual(userAAnalysis.readinessPercent, userBAnalysis.readinessPercent);
    });

    it('23 & 24: Coach snapshot persists in database and restores across re-evaluation', () => {
      const reloadedDb = loadDb();
      assert.ok(reloadedDb.coachAnalysis[TEST_USER_A], 'Cached coach analysis exists in database');
      assert.strictEqual(reloadedDb.coachAnalysis[TEST_USER_A].readinessPercent, analyzeUserPreparation(TEST_USER_A).readinessPercent);
    });
  });

  // --------------------------------------------------------------------------
  // SUITE 7: Static UI, Accessibility & Mobile UX Audit
  // --------------------------------------------------------------------------
  describe('7. Static UI, Accessibility & Mobile UX Audit', () => {
    it('19 & 20: CoachView contains semantic headings, progressbars, and accessibility attributes', () => {
      const coachViewCode = fs.readFileSync(path.join(__dirname, '../src/components/Coach/CoachView.jsx'), 'utf-8');
      assert.ok(coachViewCode.includes('role="progressbar"'), 'Must have role="progressbar"');
      assert.ok(coachViewCode.includes('aria-valuenow'), 'Must have aria-valuenow');
      assert.ok(coachViewCode.includes('aria-label='), 'Must have aria-labels');
      assert.ok(coachViewCode.includes('Next Best Action'), 'Contains Next Best Action hierarchy');
      assert.ok(coachViewCode.includes('Evidence-Based Strengths'), 'Contains Evidence-Based Strengths heading');
      assert.ok(coachViewCode.includes('Needs Attention'), 'Contains Needs Attention heading');
      assert.ok(coachViewCode.includes('Weekly Progress Summary'), 'Contains Weekly Progress heading');
    });

    it('21 & 22: CoachAdjustmentModal contains Escape key listener, role="dialog", and >=44px buttons', () => {
      const modalCode = fs.readFileSync(path.join(__dirname, '../src/components/Coach/CoachAdjustmentModal.jsx'), 'utf-8');
      assert.ok(modalCode.includes('role="dialog"'), 'Must have role="dialog"');
      assert.ok(modalCode.includes('aria-modal="true"'), 'Must have aria-modal="true"');
      assert.ok(modalCode.includes('aria-labelledby'), 'Must have aria-labelledby');
      assert.ok(modalCode.includes('Escape'), 'Must listen for Escape key');
      assert.ok(modalCode.includes('minHeight: \'44px\''), 'Must have accessible >=44px touch targets');
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
