/**
 * NOVARA AI Placement Coach UI/UX & Interaction Accuracy Regression Suite
 * 24-Point Comprehensive Regression Test Suite:
 * 1.  Readiness Grounding: computes exact weighted readiness score directly from authentic database metrics
 * 2.  Insufficient Data: returns insufficient_data status without fabricating percentage when roadmap is missing
 * 3.  Evidence-Based Strengths: strengths explicitly cite authentic completed topics, streaks, or retention
 * 4.  Needs Attention: weak areas cite specific low-progress domains, falling retention, or streak risks
 * 5.  Next Best Action Prioritization: prioritizes pending tasks > overdue revisions > scheduled interviews > roadmap
 * 6.  Why This Grounding & Collapsible UI: provides algorithmic justification with accessible collapsible toggle
 * 7.  Weekly Metrics Grounding: weekly metrics match exact database task completions, study hours, and streak
 * 8.  Zero Fabricated Metrics: verifies zero synthetic bloat (+12 tasks or +4 revisions) in weekly report
 * 9.  Domain Breakdown: categorizes roadmap topics into authentic domains with accurate completed/total percentages
 * 10. Recommendation Grounding: redistributes focus to lowest domain while strictly preserving daily study cap
 * 11. Task Deep-Link: Next Best Action for task routes to 'today' and initiates focus session for exact entity ID
 * 12. Revision Deep-Link: Next Best Action for revision routes to 'revision' and opens topic detail modal
 * 13. Application & Interview Deep-Link: Next Best Action routes to interview or application detail for exact entity ID
 * 14. Plan Adjustment Execution: server redistributes pending task duration and tags focus without altering completed tasks
 * 15. Duplicate Submission Prevention: disables confirm button and displays loading state while adjustment is in flight
 * 16. Persistence: adjusted plan and confirmation notification are saved to disk in novara_db.json
 * 17. Multi-User Isolation: User B cannot access User A coach analysis, roadmap, tasks, or recommendations
 * 18. Accessibility Audit: CoachView and CoachAdjustmentModal implement semantic ARIA roles, labels, and dialog modal attributes
 * 19. Mobile Overflow Protection: views and modals enforce flexible layout, responsive grid, and viewport bounds
 * 20. Touch Target Sizing: interactive buttons satisfy WCAG >=44px touch target guidelines
 * 21. Loading and Error States: handles loading spinner and gracefully catches evaluation errors without crashing
 * 22. Snapshot / Cache Behavior: coach analysis is cached under db.coachAnalysis[userId] for offline and fast reloads
 * 23. Logout/Login Restoration: logout clears user coach state and login restores cached coach analysis
 * 24. Exact Entity ID Correctness: Next Best Action entityId strictly corresponds to an authentic existing entity in DB
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
  console.log('🎓 NOVARA — AI PLACEMENT COACH 24-POINT REGRESSION AUDIT');
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
  if (!db.notifications) db.notifications = {};

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
  // SUITE 1: Readiness & Insufficient Data Grounding
  // --------------------------------------------------------------------------
  describe('Suite 1: Readiness & Insufficient Data Grounding', () => {
    it('1. Readiness Grounding: computes exact weighted readiness score directly from authentic database metrics', () => {
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
      assert.strictEqual(analysis.hasData, true, 'hasData must be true when roadmap exists');
      assert.strictEqual(analysis.roadmapProgress, 50, 'Roadmap progress is exactly 2/4 = 50%');
      // Weighting formula: 50 * 0.45 (22.5) + 50 * 0.25 (12.5) + 24 * 0.15 (3.6) + 100 * 0.15 (15) = 53.6 -> Math.round = 54%
      assert.strictEqual(analysis.readinessPercent, 54, 'Readiness score matches exact formula weighting (54%)');
    });

    it('2. Insufficient Data: returns insufficient_data status without fabricating percentage when roadmap is missing', () => {
      const emptyDb = loadDb();
      emptyDb.roadmaps[TEST_USER_A] = null;
      saveDb(emptyDb);

      const analysis = analyzeUserPreparation(TEST_USER_A);
      assert.strictEqual(analysis.hasData, false, 'hasData must be false when no roadmap exists');
      assert.strictEqual(analysis.status, 'insufficient_data');
      assert.strictEqual(analysis.readinessPercent, 0, 'Must not invent random readiness percentage');
      assert.strictEqual(analysis.categories.length, 0, 'Categories must be empty in insufficient_data state');
      assert.ok(analysis.message.includes('Not enough preparation data yet'));

      // Restore data for subsequent tests
      emptyDb.roadmaps[TEST_USER_A] = {
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
          },
          {
            title: 'Phase 2: Core CS',
            topics: [
              { id: 'top_5', name: 'Operating Systems Process Management', status: 'pending' },
              { id: 'top_6', name: 'DBMS Indexing and Normalization', status: 'pending' }
            ]
          }
        ]
      };
      saveDb(emptyDb);
    });
  });

  // --------------------------------------------------------------------------
  // SUITE 2: Evidence-Based Strengths & Needs Attention
  // --------------------------------------------------------------------------
  describe('Suite 2: Evidence-Based Strengths & Needs Attention', () => {
    it('3. Evidence-Based Strengths: strengths explicitly cite authentic completed topics, streaks, or retention', () => {
      const analysis = analyzeUserPreparation(TEST_USER_A);
      assert.ok(Array.isArray(analysis.strengths) && analysis.strengths.length > 0, 'Strengths must be an array');
      const hasValidStrength = analysis.strengths.some(s => 
        s.includes('streak') || s.includes('retention') || s.includes('completed') || s.includes('consistency')
      );
      assert.ok(hasValidStrength, 'Strengths must cite authentic user evidence from DB');
      assert.ok(!analysis.strengths.some(s => s.includes('Lorem ipsum') || s.includes('dummy')), 'Zero dummy strengths');
    });

    it('4. Needs Attention: weak areas cite specific low-progress domains, falling retention, or streak risks', () => {
      const analysis = analyzeUserPreparation(TEST_USER_A);
      assert.ok(Array.isArray(analysis.weakAreas) && analysis.weakAreas.length > 0, 'Weak areas must be populated');
      const hasValidWeakness = analysis.weakAreas.some(w => 
        w.includes('Core CS') || w.includes('DSA') || w.includes('tasks remaining') || w.includes('progress')
      );
      assert.ok(hasValidWeakness, 'Weakness must contain explicit domain / metric reasons');
      assert.strictEqual(analysis.weakestCategory, 'Core CS', 'Correctly identifies Core CS as lowest domain (0%)');
    });
  });

  // --------------------------------------------------------------------------
  // SUITE 3: Next Best Action & "Why This" Reasoning
  // --------------------------------------------------------------------------
  describe('Suite 3: Next Best Action & "Why This" Reasoning', () => {
    it('5. Next Best Action Prioritization: prioritizes pending tasks > overdue revisions > scheduled interviews > roadmap', () => {
      const analysis = analyzeUserPreparation(TEST_USER_A);
      assert.ok(analysis.nextBestAction, 'Next Best Action must exist');
      assert.strictEqual(analysis.nextBestAction.type, 'TASK', 'Unfinished task takes immediate top priority');
      assert.strictEqual(analysis.nextBestAction.entityId, 'tsk_102', 'Points to exact unfinished task');
      assert.strictEqual(analysis.nextBestAction.badge, 'Immediate Priority');
    });

    it('6. Why This Grounding & Collapsible UI: provides algorithmic justification with accessible collapsible toggle', () => {
      const analysis = analyzeUserPreparation(TEST_USER_A);
      assert.ok(typeof analysis.nextBestAction.whyThis === 'string' && analysis.nextBestAction.whyThis.length > 15, 'Must contain substantive whyThis text');
      assert.ok(analysis.nextBestAction.whyThis.includes('streak') || analysis.nextBestAction.whyThis.includes('mission'), 'whyThis explains streak/mission reason');

      const coachViewCode = fs.readFileSync(path.join(__dirname, '../src/components/Coach/CoachView.jsx'), 'utf-8');
      assert.ok(coachViewCode.includes('Why this action?'), 'CoachView contains "Why this action?" toggle');
      assert.ok(coachViewCode.includes('aria-expanded='), 'CoachView toggle includes aria-expanded accessibility attribute');
      assert.ok(coachViewCode.includes('toggleWhyThis'), 'CoachView provides toggle handler');
    });
  });

  // --------------------------------------------------------------------------
  // SUITE 4: Grounded Weekly Metrics (Zero Fabrication)
  // --------------------------------------------------------------------------
  describe('Suite 4: Grounded Weekly Metrics (No Synthetic Numbers)', () => {
    it('7. Weekly Metrics Grounding: weekly metrics match exact database task completions, study hours, and streak', () => {
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
      assert.strictEqual(weekly.tasksCompleted, 2, '2 tasks completed in DB streak weeklyHistory');
      assert.strictEqual(weekly.hoursStudied, 1.5, 'Exact 2 * 0.75h = 1.5h studied');
      assert.strictEqual(weekly.revisionsCompleted, 1, '1 completed revision in DB');
      assert.strictEqual(weekly.currentStreak, 3, 'Streak matches DB');
    });

    it('8. Zero Fabricated Metrics: verifies zero synthetic bloat (+12 tasks or +4 revisions) in weekly report', () => {
      const analysis = analyzeUserPreparation(TEST_USER_A);
      const weekly = analysis.weeklyReport;
      // Legacy code had `tasksCompleted: realWeeklyTasks + 12` and `revisionsCompleted: realCompletedRevisions + 4`
      assert.notStrictEqual(weekly.tasksCompleted, 14, 'Must NOT contain legacy +12 task fabrication');
      assert.notStrictEqual(weekly.revisionsCompleted, 5, 'Must NOT contain legacy +4 revision fabrication');
      assert.strictEqual(weekly.tasksCompleted, 2, 'Authentic count strictly preserved');
      assert.strictEqual(weekly.revisionsCompleted, 1, 'Authentic revision count strictly preserved');
    });
  });

  // --------------------------------------------------------------------------
  // SUITE 5: Domain Breakdown & Recommendation Grounding
  // --------------------------------------------------------------------------
  describe('Suite 5: Domain Breakdown & Recommendation Grounding', () => {
    it('9. Domain Breakdown: categorizes roadmap topics into authentic domains with accurate completed/total percentages', () => {
      const analysis = analyzeUserPreparation(TEST_USER_A);
      assert.ok(Array.isArray(analysis.categories), 'Categories must be an array');
      assert.strictEqual(analysis.categories.length, 2, 'Must have DSA and Core CS');

      const dsa = analysis.categories.find(c => c.name === 'DSA');
      const core = analysis.categories.find(c => c.name === 'Core CS');

      assert.ok(dsa, 'DSA category exists');
      assert.strictEqual(dsa.total, 4);
      assert.strictEqual(dsa.completed, 2);
      assert.strictEqual(dsa.percentage, 50);

      assert.ok(core, 'Core CS category exists');
      assert.strictEqual(core.total, 2);
      assert.strictEqual(core.completed, 0);
      assert.strictEqual(core.percentage, 0);
    });

    it('10. Recommendation Grounding: redistributes focus to lowest domain while strictly preserving daily study cap', () => {
      const analysis = analyzeUserPreparation(TEST_USER_A);
      const rec = analysis.recommendation;
      assert.ok(rec, 'Recommendation must exist');
      assert.strictEqual(rec.targetCategory, 'Core CS', 'Targets lowest progress category');
      assert.strictEqual(rec.dailyCapHours, 3, 'Preserves 3-hour daily capacity from user profile');
      
      const beforeMinutes = rec.beforeAllocation.reduce((sum, item) => sum + item.minutes, 0);
      const afterMinutes = rec.afterAllocation.reduce((sum, item) => sum + item.minutes, 0);
      assert.strictEqual(beforeMinutes, 180, 'Before allocation totals 180m (3h)');
      assert.strictEqual(afterMinutes, 180, 'After allocation totals 180m (3h)');
    });
  });

  // --------------------------------------------------------------------------
  // SUITE 6: Concrete Deep Linking & Entity ID Correctness
  // --------------------------------------------------------------------------
  describe('Suite 6: Concrete Deep Linking & Entity ID Correctness', () => {
    it('11. Task Deep-Link: Next Best Action for task routes to "today" and initiates focus session for exact entity ID', () => {
      const currentDb = loadDb();
      currentDb.tasks[TEST_USER_A] = [
        { id: 'tsk_101', name: 'Two Sum Problem', durationMinutes: 45, completed: true },
        { id: 'tsk_102', name: 'Binary Search Implementation', durationMinutes: 45, completed: false }
      ];
      saveDb(currentDb);

      const analysis = analyzeUserPreparation(TEST_USER_A);
      assert.strictEqual(analysis.nextBestAction.actionRoute, 'today');
      assert.strictEqual(analysis.nextBestAction.entityId, 'tsk_102');

      const appContextCode = fs.readFileSync(path.join(__dirname, '../src/context/AppContext.jsx'), 'utf-8');
      assert.ok(appContextCode.includes('action.actionRoute === \'today\' || action.type === \'TASK\''), 'AppContext checks task route');
      assert.ok(appContextCode.includes('startFocusSession(task)'), 'AppContext triggers focus session for target task');
    });

    it('12. Revision Deep-Link: Next Best Action for revision routes to "revision" and opens topic detail modal', () => {
      const currentDb = loadDb();
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

      const appContextCode = fs.readFileSync(path.join(__dirname, '../src/context/AppContext.jsx'), 'utf-8');
      assert.ok(appContextCode.includes('action.actionRoute === \'revision\' || action.type === \'REVISION\''));
      assert.ok(appContextCode.includes('setIsTopicDetailOpen(true)'));
    });

    it('13. Application & Interview Deep-Link: Next Best Action routes to interview or application detail for exact entity ID', () => {
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

      const appContextCode = fs.readFileSync(path.join(__dirname, '../src/context/AppContext.jsx'), 'utf-8');
      assert.ok(appContextCode.includes('action.actionRoute === \'interview\' || action.type === \'INTERVIEW\''));
      assert.ok(appContextCode.includes('action.actionRoute === \'applications\' || action.entityType === \'application\''));
    });

    it('14. Exact Entity ID Correctness: Next Best Action entityId strictly corresponds to an authentic existing entity in DB', () => {
      const currentDb = loadDb();
      const analysis = analyzeUserPreparation(TEST_USER_A);
      const nba = analysis.nextBestAction;

      if (nba.type === 'INTERVIEW' || nba.entityType === 'interview') {
        const app = (currentDb.applications[TEST_USER_A] || []).find(a => a.id === nba.entityId);
        assert.ok(app, `Target interview entityId "${nba.entityId}" must exist in database`);
      } else if (nba.type === 'TASK') {
        const tsk = (currentDb.tasks[TEST_USER_A] || []).find(t => t.id === nba.entityId);
        assert.ok(tsk, `Target task entityId "${nba.entityId}" must exist in database`);
      } else if (nba.type === 'REVISION') {
        const rev = (currentDb.revisions[TEST_USER_A] || []).find(r => r.id === nba.entityId);
        assert.ok(rev, `Target revision entityId "${nba.entityId}" must exist in database`);
      }
    });
  });

  // --------------------------------------------------------------------------
  // SUITE 7: Plan Adjustment, Duplicate Prevention & Persistence
  // --------------------------------------------------------------------------
  describe('Suite 7: Plan Adjustment, Duplicate Prevention & Persistence', () => {
    it('15. Plan Adjustment Execution: server redistributes pending task duration and tags focus without altering completed tasks', () => {
      const currentDb = loadDb();
      currentDb.tasks[TEST_USER_A] = [
        { id: 'tsk_done', name: 'Done Task', completed: true, durationMinutes: 45, category: 'DSA', description: 'Done Problem' },
        { id: 'tsk_pending_core', name: 'Operating Systems Process', completed: false, durationMinutes: 30, category: 'Core CS', description: 'Core CS Concept' }
      ];
      saveDb(currentDb);

      const result = applyCoachRecommendationOnServer(TEST_USER_A, { targetCategory: 'Core CS' });
      assert.ok(result.tasks, 'Returns updated tasks');
      
      const doneTask = result.tasks.find(t => t.id === 'tsk_done');
      const pendingTask = result.tasks.find(t => t.id === 'tsk_pending_core');

      assert.strictEqual(doneTask.durationMinutes, 45, 'Completed task duration must NEVER be altered');
      assert.strictEqual(pendingTask.durationMinutes, 60, 'Pending Core CS task duration increased to 60');
      assert.ok(pendingTask.description.includes('[Coach Recommended Focus]'), 'Tags pending task with focus label');
    });

    it('16. Duplicate Submission Prevention: disables confirm button and displays loading state while adjustment is in flight', () => {
      const modalCode = fs.readFileSync(path.join(__dirname, '../src/components/Coach/CoachAdjustmentModal.jsx'), 'utf-8');
      assert.ok(modalCode.includes('disabled={isSubmitting}'), 'Disables button when isSubmitting is true');
      assert.ok(modalCode.includes('if (isSubmitting) return;'), 'Guards onConfirm callback against multiple submissions');
      assert.ok(modalCode.includes('Applying Changes...'), 'Renders loading text during submission');
      assert.ok(modalCode.includes('Loader2'), 'Displays loading spinner during submission');

      const coachViewCode = fs.readFileSync(path.join(__dirname, '../src/components/Coach/CoachView.jsx'), 'utf-8');
      assert.ok(coachViewCode.includes('isApplyingAdjustment'), 'CoachView tracks adjustment submission state');
      assert.ok(coachViewCode.includes('isSubmitting={isApplyingAdjustment}'), 'Passes submission state to modal');
    });

    it('17. Persistence: adjusted plan and confirmation notification are saved to disk in novara_db.json', () => {
      const reloadedDb = loadDb();
      const updatedPendingTask = (reloadedDb.tasks[TEST_USER_A] || []).find(t => t.id === 'tsk_pending_core');
      assert.ok(updatedPendingTask, 'Updated task persists in DB');
      assert.strictEqual(updatedPendingTask.durationMinutes, 60);

      const userNotifs = reloadedDb.notifications[TEST_USER_A] || [];
      const coachNotif = userNotifs.find(n => n.title.includes('Plan Adjusted by Coach'));
      assert.ok(coachNotif, 'Plan adjustment notification persisted in DB');
      assert.strictEqual(coachNotif.type, 'SYSTEM');
    });
  });

  // --------------------------------------------------------------------------
  // SUITE 8: Multi-User Isolation, Cache & Restoration
  // --------------------------------------------------------------------------
  describe('Suite 8: Multi-User Isolation, Cache & Restoration', () => {
    it('18. Multi-User Isolation: User B cannot access User A coach analysis, roadmap, tasks, or recommendations', () => {
      const userAAnalysis = analyzeUserPreparation(TEST_USER_A);
      const userBAnalysis = analyzeUserPreparation(TEST_USER_B);

      assert.strictEqual(userAAnalysis.hasData, true, 'User A has full preparation data');
      assert.strictEqual(userBAnalysis.hasData, false, 'User B has no roadmap and must return insufficient_data');
      assert.strictEqual(userBAnalysis.readinessPercent, 0);
      assert.notStrictEqual(userAAnalysis.readinessPercent, userBAnalysis.readinessPercent);
    });

    it('19. Snapshot / Cache Behavior: coach analysis is cached under db.coachAnalysis[userId] for offline and fast reloads', () => {
      const reloadedDb = loadDb();
      assert.ok(reloadedDb.coachAnalysis[TEST_USER_A], 'Cached coach analysis exists in database');
      assert.strictEqual(reloadedDb.coachAnalysis[TEST_USER_A].readinessPercent, analyzeUserPreparation(TEST_USER_A).readinessPercent);
      assert.strictEqual(reloadedDb.coachAnalysis[TEST_USER_A].weakestCategory, 'Core CS');
    });

    it('20. Logout/Login Restoration: logout clears user coach state and login restores cached coach analysis', () => {
      const appContextCode = fs.readFileSync(path.join(__dirname, '../src/context/AppContext.jsx'), 'utf-8');
      assert.ok(appContextCode.includes('setCoachAnalysis(null)'), 'handleLogout clears in-memory coachAnalysis state');
      assert.ok(appContextCode.includes('clearCachedUserData(prevUserId)'), 'handleLogout wipes offline cached user data');
      assert.ok(appContextCode.includes('fetchCoachAnalysis()'), 'hydrate/sync fetches authenticated user coach analysis');
    });
  });

  // --------------------------------------------------------------------------
  // SUITE 9: UI Accessibility, Responsive Layout & Touch Targets
  // --------------------------------------------------------------------------
  describe('Suite 9: UI Accessibility, Responsive Layout & Touch Targets', () => {
    it('21. Accessibility Audit: CoachView and CoachAdjustmentModal implement semantic ARIA roles, labels, and dialog modal attributes', () => {
      const coachViewCode = fs.readFileSync(path.join(__dirname, '../src/components/Coach/CoachView.jsx'), 'utf-8');
      assert.ok(coachViewCode.includes('role="progressbar"'), 'Must have role="progressbar"');
      assert.ok(coachViewCode.includes('aria-valuenow='), 'Must have aria-valuenow');
      assert.ok(coachViewCode.includes('aria-valuemin="0"'), 'Must have aria-valuemin');
      assert.ok(coachViewCode.includes('aria-valuemax="100"'), 'Must have aria-valuemax');
      assert.ok(coachViewCode.includes('aria-label='), 'Must have aria-labels');
      assert.ok(coachViewCode.includes('role="region"'), 'Uses semantic region landmarks');

      const modalCode = fs.readFileSync(path.join(__dirname, '../src/components/Coach/CoachAdjustmentModal.jsx'), 'utf-8');
      assert.ok(modalCode.includes('role="dialog"'), 'Must have role="dialog"');
      assert.ok(modalCode.includes('aria-modal="true"'), 'Must have aria-modal="true"');
      assert.ok(modalCode.includes('aria-labelledby="coach-adjustment-modal-title"'), 'Must have aria-labelledby');
      assert.ok(modalCode.includes('e.key === \'Escape\''), 'Must handle Escape key dismissal');
    });

    it('22. Mobile Overflow Protection: views and modals enforce flexible layout, responsive grid, and viewport bounds', () => {
      const modalCode = fs.readFileSync(path.join(__dirname, '../src/components/Coach/CoachAdjustmentModal.jsx'), 'utf-8');
      assert.ok(modalCode.includes('maxHeight: \'90vh\''), 'Enforces 90vh maximum height to prevent viewport clipping');
      assert.ok(modalCode.includes('overflowY: \'auto\''), 'Enforces internal scroll on overflow');

      const coachViewCode = fs.readFileSync(path.join(__dirname, '../src/components/Coach/CoachView.jsx'), 'utf-8');
      assert.ok(coachViewCode.includes('gridTemplateColumns: \'repeat(3, 1fr)\''), 'Uses responsive 3-column grid for weekly metrics');
      assert.ok(coachViewCode.includes('flexDirection: \'column\''), 'Uses column flex layouts preventing horizontal overflow');
    });

    it('23. Touch Target Sizing: interactive buttons satisfy WCAG >=44px touch target guidelines', () => {
      const coachViewCode = fs.readFileSync(path.join(__dirname, '../src/components/Coach/CoachView.jsx'), 'utf-8');
      assert.ok(coachViewCode.includes('minHeight: \'44px\''), 'CoachView action buttons enforce minHeight 44px');

      const modalCode = fs.readFileSync(path.join(__dirname, '../src/components/Coach/CoachAdjustmentModal.jsx'), 'utf-8');
      assert.ok(modalCode.includes('minHeight: \'44px\''), 'CoachAdjustmentModal buttons enforce minHeight 44px');
      assert.ok(modalCode.includes('minWidth: \'44px\''), 'Close button enforces minWidth 44px');
    });

    it('24. Loading and Error States: handles loading spinner and gracefully catches evaluation errors without crashing', () => {
      const coachViewCode = fs.readFileSync(path.join(__dirname, '../src/components/Coach/CoachView.jsx'), 'utf-8');
      assert.ok(coachViewCode.includes('isCoachLoading && !coachAnalysis'), 'Checks loading condition');
      assert.ok(coachViewCode.includes('Evaluating Placement Readiness...'), 'Renders evaluating heading');
      assert.ok(coachViewCode.includes('RotateCw'), 'Renders rotating loading spinner');

      const appContextCode = fs.readFileSync(path.join(__dirname, '../src/context/AppContext.jsx'), 'utf-8');
      assert.ok(appContextCode.includes('setIsCoachLoading(true)'));
      assert.ok(appContextCode.includes('setIsCoachLoading(false)'));
      assert.ok(appContextCode.includes('Adjustment Failed'));
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
  saveDb(cleanDb);

  console.log('\n================================================================');
  console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
  console.log('================================================================');

  if (passedTests !== 24 || totalTests !== 24) {
    console.error(`${RED}Assertion failure: Expected exactly 24 tests, got ${totalTests} (passed: ${passedTests})${RESET}`);
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
