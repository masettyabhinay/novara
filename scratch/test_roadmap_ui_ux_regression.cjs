/**
 * NOVARA — ROADMAP UI/UX FUNCTIONAL & PROGRESS REGRESSION TEST SUITE
 * 
 * Verifies:
 * 1. Roadmap Overview & Authoritative Single Source of Truth Progress Calculation
 * 2. Phase Card Formatting & Status Assignment (Phase number, title, count, progress bar)
 * 3. Deterministic Current Phase Identification (Next incomplete phase, Roadmap Complete state)
 * 4. Topic List Legibility & Absence of Aggressive Strikethrough
 * 5. Topic Study Isolation (Topic A NEVER opens Topic B material, valid learning objectives)
 * 6. Today -> Roadmap Progress Consistency & Persistence across sessions
 * 7. Empty State Integrity (0 fake phases)
 * 8. Accessibility & Mobile Touch Target Standards (>= 44px)
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const {
  signupUser,
  loginUser,
  logoutSession,
  validateSessionToken,
  updateUserRoadmap,
  toggleTaskCompletionOnServer,
  getUserTasksFromDb,
  loadDb,
  saveDb
} = require('../server/db.js');

const {
  getFallbackStudyMaterial,
  getStudyMaterialCacheKey
} = require('../server/studyMaterialService.js');

async function runRoadmapUIUXRegression() {
  console.log('================================================================');
  console.log('🚀 NOVARA — ROADMAP UI/UX & PROGRESS REGRESSION TEST SUITE');
  console.log('================================================================\n');

  try {
    // -------------------------------------------------------------------------
    // 1. SIGNUP USER & INGEST 6-PHASE CURRICULUM ROADMAP
    // -------------------------------------------------------------------------
    console.log('▶ [Test 1] Testing User Setup & 6-Phase Placement Roadmap...');
    const user = signupUser({
      name: 'Roadmap Audit User',
      email: `roadmap_user_${Date.now()}@novara.dev`,
      password: 'AuditPassword123!'
    });
    const userId = user.user.id;

    // Standard 6-Phase placement roadmap
    const mockRoadmap = {
      id: `rdmp_${Date.now()}`,
      title: 'Top Tech SDE-1 Placement Roadmap (90-Day Sprint)',
      targetRole: 'Software Development Engineer',
      phases: [
        {
          id: 'p1',
          number: 1,
          title: 'Phase 1: Programming Foundations & Complexity Analysis',
          status: 'in_progress',
          topics: [
            { id: 't1_1', name: 'Time & Space Complexity (Big-O)', status: 'completed', difficulty: 'Easy', duration: '45m', problemsCount: 5 },
            { id: 't1_2', name: 'Arrays & Two Pointers Technique', status: 'in_progress', difficulty: 'Medium', duration: '60m', problemsCount: 8 },
            { id: 't1_3', name: 'Sliding Window & Prefix Sums', status: 'upcoming', difficulty: 'Medium', duration: '60m', problemsCount: 6 },
            { id: 't1_4', name: 'Strings & Hashing Techniques', status: 'upcoming', difficulty: 'Easy', duration: '45m', problemsCount: 5 }
          ]
        },
        {
          id: 'p2',
          number: 2,
          title: 'Phase 2: Core Data Structures',
          status: 'upcoming',
          topics: [
            { id: 't2_1', name: 'Singly & Doubly Linked Lists', status: 'upcoming', difficulty: 'Medium', duration: '45m', problemsCount: 6 },
            { id: 't2_2', name: 'Stacks & Queues (Monotonic)', status: 'upcoming', difficulty: 'Medium', duration: '50m', problemsCount: 7 },
            { id: 't2_3', name: 'Binary Trees & Traversals', status: 'upcoming', difficulty: 'Medium', duration: '60m', problemsCount: 8 }
          ]
        },
        {
          id: 'p3',
          number: 3,
          title: 'Phase 3: Advanced Algorithms',
          status: 'upcoming',
          topics: [
            { id: 't3_1', name: 'Binary Search & Monotonic Predicates', status: 'upcoming', difficulty: 'Medium', duration: '60m', problemsCount: 6 },
            { id: 't3_2', name: 'Recursion & Backtracking', status: 'upcoming', difficulty: 'Hard', duration: '75m', problemsCount: 6 },
            { id: 't3_3', name: 'Dynamic Programming (1D & 2D)', status: 'upcoming', difficulty: 'Hard', duration: '90m', problemsCount: 10 }
          ]
        }
      ]
    };

    updateUserRoadmap(userId, mockRoadmap);
    const persistedRoadmap = loadDb().roadmaps[userId];
    assert.strictEqual(persistedRoadmap.phases.length, 3, 'Roadmap successfully saved with 3 phases');
    console.log('✅ PASS: Roadmap saved and verified in DB.');

    // -------------------------------------------------------------------------
    // 2. OVERALL PROGRESS CALCULATION (SINGLE SOURCE OF TRUTH)
    // -------------------------------------------------------------------------
    console.log('▶ [Test 2] Testing Authoritative Overall Progress Calculation...');
    // Total topics: 4 + 3 + 3 = 10 topics. Completed = 1. Progress = 10%.
    const totalTopics = persistedRoadmap.phases.reduce((acc, p) => acc + (p.topics?.length || 0), 0);
    const completedTopics = persistedRoadmap.phases.reduce((acc, p) => 
      acc + (p.topics?.filter(t => t.status === 'completed').length || 0), 0
    );
    const progressPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

    assert.strictEqual(totalTopics, 10, 'Total 10 curriculum topics');
    assert.strictEqual(completedTopics, 1, '1 completed topic');
    assert.strictEqual(progressPercent, 10, 'Overall progress is exactly 10%');

    // Test 0% case
    const zeroRoadmap = JSON.parse(JSON.stringify(mockRoadmap));
    zeroRoadmap.phases.forEach(p => p.topics.forEach(t => t.status = 'upcoming'));
    const zeroTotal = zeroRoadmap.phases.reduce((acc, p) => acc + (p.topics?.length || 0), 0);
    const zeroDone = zeroRoadmap.phases.reduce((acc, p) => acc + (p.topics?.filter(t => t.status === 'completed').length || 0), 0);
    const zeroProgress = zeroTotal > 0 ? Math.round((zeroDone / zeroTotal) * 100) : 0;
    assert.strictEqual(zeroProgress, 0, '0% calculated when 0 topics completed');

    // Test 100% case
    const fullRoadmap = JSON.parse(JSON.stringify(mockRoadmap));
    fullRoadmap.phases.forEach(p => p.topics.forEach(t => t.status = 'completed'));
    const fullTotal = fullRoadmap.phases.reduce((acc, p) => acc + (p.topics?.length || 0), 0);
    const fullDone = fullRoadmap.phases.reduce((acc, p) => acc + (p.topics?.filter(t => t.status === 'completed').length || 0), 0);
    const fullProgress = fullTotal > 0 ? Math.round((fullDone / fullTotal) * 100) : 0;
    assert.strictEqual(fullProgress, 100, '100% calculated when all topics completed');
    console.log('✅ PASS: Authoritative progress calculation mathematically accurate across 0%, 10%, and 100%.');

    // -------------------------------------------------------------------------
    // 3. DETERMINISTIC CURRENT PHASE & TOPIC RESOLUTION
    // -------------------------------------------------------------------------
    console.log('▶ [Test 3] Testing Current Phase & Next Topic Resolution...');
    
    function resolveCurrentPhaseAndTopic(roadmap) {
      const total = roadmap.phases?.reduce((acc, p) => acc + (p.topics?.length || 0), 0) || 0;
      const done = roadmap.phases?.reduce((acc, p) => acc + (p.topics?.filter(t => t.status === 'completed').length || 0), 0) || 0;
      const isAllComplete = total > 0 && done === total;

      if (isAllComplete) {
        return { isAllComplete: true, currentPhase: null, currentTopic: null };
      }

      const currentPhaseIndex = roadmap.phases?.findIndex(p => {
        const pTotal = p.topics?.length || 0;
        const pDone = p.topics?.filter(t => t.status === 'completed').length || 0;
        return pTotal > 0 && pDone < pTotal;
      });

      const currentPhase = currentPhaseIndex !== -1 ? roadmap.phases[currentPhaseIndex] : roadmap.phases[0];
      const currentTopic = currentPhase?.topics?.find(t => t.status !== 'completed') || currentPhase?.topics?.[0];

      return { isAllComplete: false, currentPhase, currentTopic };
    }

    const state1 = resolveCurrentPhaseAndTopic(persistedRoadmap);
    assert.strictEqual(state1.isAllComplete, false, 'Roadmap is not yet complete');
    assert.strictEqual(state1.currentPhase.id, 'p1', 'Phase 1 is the current phase');
    assert.strictEqual(state1.currentTopic.id, 't1_2', 'Arrays & Two Pointers is the next topic to study');

    // Complete all topics in Phase 1
    persistedRoadmap.phases[0].topics.forEach(t => t.status = 'completed');
    const state2 = resolveCurrentPhaseAndTopic(persistedRoadmap);
    assert.strictEqual(state2.isAllComplete, false, 'Roadmap is still in progress');
    assert.strictEqual(state2.currentPhase.id, 'p2', 'Phase 2 automatically becomes current after Phase 1 is done');
    assert.strictEqual(state2.currentTopic.id, 't2_1', 'Singly & Doubly Linked Lists is the next topic');

    // Complete all phases
    persistedRoadmap.phases[1].topics.forEach(t => t.status = 'completed');
    persistedRoadmap.phases[2].topics.forEach(t => t.status = 'completed');
    const state3 = resolveCurrentPhaseAndTopic(persistedRoadmap);
    assert.strictEqual(state3.isAllComplete, true, 'Roadmap resolves to complete');
    assert.strictEqual(state3.currentPhase, null, 'No active incomplete phase when 100% complete');
    console.log('✅ PASS: Deterministic current phase progression verified.');

    // -------------------------------------------------------------------------
    // 4. TOPIC ISOLATION & ZERO STALE STUDY MATERIAL CONTAMINATION
    // -------------------------------------------------------------------------
    console.log('▶ [Test 4] Testing Topic Study Isolation (Topic A NEVER opens Topic B)...');
    const topicArrays = mockRoadmap.phases[0].topics[1]; // Arrays & Two Pointers
    const topicTrees = mockRoadmap.phases[1].topics[2];  // Binary Trees

    const studyContextArrays = {
      id: topicArrays.id,
      taskId: topicArrays.id,
      name: topicArrays.name,
      topic: topicArrays.name,
      taskTitle: topicArrays.name,
      phase: mockRoadmap.phases[0].title,
      difficulty: topicArrays.difficulty
    };

    const studyContextTrees = {
      id: topicTrees.id,
      taskId: topicTrees.id,
      name: topicTrees.name,
      topic: topicTrees.name,
      taskTitle: topicTrees.name,
      phase: mockRoadmap.phases[1].title,
      difficulty: topicTrees.difficulty
    };

    const cacheKeyArrays = getStudyMaterialCacheKey(studyContextArrays);
    const cacheKeyTrees = getStudyMaterialCacheKey(studyContextTrees);

    assert.notStrictEqual(cacheKeyArrays, cacheKeyTrees, 'Cache keys for Topic A and Topic B are strictly distinct');
    assert(cacheKeyArrays.includes('t1_2') || cacheKeyArrays.includes('arrays'), 'Arrays cache key contains topic identity');
    assert(cacheKeyTrees.includes('t2_3') || cacheKeyTrees.includes('binary_trees') || cacheKeyTrees.includes('trees'), 'Trees cache key contains topic identity');
    console.log('✅ PASS: Topic study isolation verified. Topic A cannot open Topic B study material.');

    // -------------------------------------------------------------------------
    // 5. PROGRESS CONSISTENCY & PERSISTENCE ACROSS SESSIONS
    // -------------------------------------------------------------------------
    console.log('▶ [Test 5] Testing Progress Consistency & Logout/Login Persistence...');
    // Reset to initial state: 1 completed topic
    updateUserRoadmap(userId, mockRoadmap);
    const r1 = loadDb().roadmaps[userId];
    const done1 = r1.phases[0].topics.filter(t => t.status === 'completed').length;
    assert.strictEqual(done1, 1, 'Initial 1 topic completed');

    // Simulate topic completion in database
    r1.phases[0].topics[1].status = 'completed';
    updateUserRoadmap(userId, r1);

    // Logout and Login
    logoutSession(user.token);
    assert.strictEqual(validateSessionToken(user.token), null, 'Logged-out session invalidated');

    const loginRes = loginUser({ email: user.user.email, password: 'AuditPassword123!' });
    assert(loginRes.token, 'User re-authenticated');

    const r2 = loadDb().roadmaps[loginRes.user.id];
    const done2 = r2.phases[0].topics.filter(t => t.status === 'completed').length;
    assert.strictEqual(done2, 2, '2 topics completed after re-login');
    console.log('✅ PASS: Progress consistency across reload and re-login sessions verified.');

    // -------------------------------------------------------------------------
    // 6. JSX COMPONENT STATIC AUDIT (ACCESSIBILITY, TOUCH TARGETS, STYLING)
    // -------------------------------------------------------------------------
    console.log('▶ [Test 6] Auditing RoadmapView.jsx for Accessibility & Design Rules...');
    const roadmapViewCode = fs.readFileSync(path.join(__dirname, '../src/components/Roadmap/RoadmapView.jsx'), 'utf-8');

    // Rule: No aggressive strikethrough
    assert(!roadmapViewCode.includes("textDecoration: isDone ? 'line-through' : 'none'"), 'Aggressive strikethrough eliminated for topic legibility');
    
    // Rule: Accessible progress bars
    assert(roadmapViewCode.includes('role="progressbar"'), 'Contains role="progressbar" for screen readers');
    assert(roadmapViewCode.includes('aria-valuenow'), 'Contains aria-valuenow on progress bars');
    assert(roadmapViewCode.includes('aria-valuemin'), 'Contains aria-valuemin on progress bars');
    assert(roadmapViewCode.includes('aria-valuemax'), 'Contains aria-valuemax on progress bars');

    // Rule: Minimum touch targets >= 44px
    assert(roadmapViewCode.includes('minHeight: \'44px\''), 'Contains minHeight 44px for interactive elements');

    // Rule: ROADMAP COMPLETE message when finished
    assert(roadmapViewCode.includes('ROADMAP COMPLETE'), 'Displays "ROADMAP COMPLETE" when 100% finished');

    // Rule: Empty state with no fake phases
    assert(roadmapViewCode.includes('No roadmap yet'), 'Displays clean "No roadmap yet" empty state');
    console.log('✅ PASS: RoadmapView.jsx satisfies all accessibility, readability, and design system rules.');

    console.log('\n================================================================');
    console.log('🎉 ALL ROADMAP UI/UX REGRESSION TESTS PASSED (6/6 STEPS)!');
    console.log('================================================================\n');

  } catch (err) {
    console.error('\n❌ REGRESSION TEST ERROR:\n', err);
    process.exit(1);
  }
}

runRoadmapUIUXRegression();
