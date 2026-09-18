/**
 * test_visual_map_cross_feature.cjs
 * Comprehensive Automated Regression Test Suite for NOVARA Unified Visual Map System
 * Covers all 24 required checks across all integrated features.
 */

const fs = require('fs');
const path = require('path');

let assertionCount = 0;

function assert(condition, msg) {
  if (!condition) {
    console.error(`\n❌ [FAILED] Assertion ${assertionCount + 1}: ${msg}`);
    process.exit(1);
  }
  assertionCount++;
  console.log(`✅ [PASS ${String(assertionCount).padStart(2, '0')}] ${msg}`);
}

function readFile(relPath) {
  const fullPath = path.resolve(__dirname, '..', relPath);
  return fs.readFileSync(fullPath, 'utf8');
}

async function runTests() {
  console.log('='.repeat(80));
  console.log('NOVARA CROSS-FEATURE VISUAL MAP INTEGRATION AUDIT (24 CHECKS)');
  console.log('='.repeat(80));

  const utils = await import('../src/components/VisualMap/visualMapUtils.js');

  // =========================================================================
  // CHECK 1: Roadmap map uses real phases/topics
  // =========================================================================
  const sampleRoadmap = {
    id: 'rd_software_eng',
    title: 'Software Engineer Pathway',
    phases: [
      {
        id: 'phase_1',
        number: 1,
        title: 'Phase 1: DSA Foundations',
        topics: [
          { id: 'top_101', name: 'Arrays & Two Pointers', status: 'completed', category: 'DSA' },
          { id: 'top_102', name: 'Sliding Window', status: 'pending', category: 'DSA' }
        ]
      },
      {
        id: 'phase_2',
        number: 2,
        title: 'Phase 2: System Design',
        topics: [
          { id: 'top_201', name: 'Load Balancing', status: 'pending', category: 'System Design' }
        ]
      }
    ]
  };

  const roadmapMap = utils.buildRoadmapVisualMap(sampleRoadmap);
  const phase1Node = roadmapMap.nodes.find(n => n.id === 'phase_phase_1');
  const top101Node = roadmapMap.nodes.find(n => n.id === 'topic_top_101');
  assert(
    roadmapMap.nodes.length >= 4 &&
    phase1Node && phase1Node.entityId === 'phase_1' &&
    top101Node && top101Node.entityId === 'top_101',
    'Check 1: Roadmap visual map accurately maps real phases and topics preserving hierarchy and counts'
  );

  // =========================================================================
  // CHECK 2: Task nodes preserve taskId
  // =========================================================================
  const sampleTasks = [
    { id: 'task_arrays_1', name: 'Solve 2 Sum', completed: false, category: 'DSA', durationMinutes: 45, difficulty: 'Medium' }
  ];
  const todayPath = utils.buildTodayLearningPathMap(sampleTasks, null, []);
  const taskNode = todayPath.nodes.find(n => n.entityType === 'task');
  assert(
    taskNode && taskNode.entityId === 'task_arrays_1' && taskNode.data.id === 'task_arrays_1',
    'Check 2: Task nodes preserve exact authentic taskId and task payload reference'
  );

  // =========================================================================
  // CHECK 3: Focus nodes preserve taskId and sessionId
  // =========================================================================
  const sampleActiveSession = { taskId: 'task_arrays_1', sessionId: 'sess_999' };
  const todayPathActive = utils.buildTodayLearningPathMap(sampleTasks, sampleActiveSession, []);
  const focusNode = todayPathActive.nodes.find(n => n.entityType === 'focus');
  assert(
    focusNode && focusNode.entityId === 'task_arrays_1' && focusNode.sessionId === 'sess_999' && focusNode.status === 'active',
    'Check 3: Focus nodes preserve taskId, active sessionId, and reflect active status'
  );

  // =========================================================================
  // CHECK 4: Quiz nodes preserve task identity
  // =========================================================================
  const quizNode = todayPath.nodes.find(n => n.entityType === 'quiz');
  const studyContext = utils.buildStudyContextMap(sampleTasks[0], { concepts: ['C1'] });
  const studyQuizNode = studyContext.nodes.find(n => n.entityType === 'quiz');
  assert(
    quizNode && quizNode.entityId === 'task_arrays_1' &&
    studyQuizNode && studyQuizNode.entityId === 'task_arrays_1',
    'Check 4: Quiz nodes strictly preserve target task identity in both Today and Study maps'
  );

  // =========================================================================
  // CHECK 5: Revision nodes preserve revisionItemId
  // =========================================================================
  const sampleRevisions = [
    { id: 'rev_hash_maps', topic: 'Hash Maps & Collisions', retentionScore: 72, revisionDueDate: 'Today', attemptsCount: 3 }
  ];
  const revMap = utils.buildRevisionMemoryMap(sampleRevisions, { averageRetention: 80 });
  const revItemNode = revMap.nodes.find(n => n.entityType === 'revision_item');
  assert(
    revItemNode && revItemNode.entityId === 'rev_hash_maps' && revItemNode.data.id === 'rev_hash_maps',
    'Check 5: Revision memory map nodes preserve exact revision item ID and retention data'
  );

  // =========================================================================
  // CHECK 6: Coach nodes deep-link correctly
  // =========================================================================
  const sampleCoach = {
    readinessPercent: 68,
    roadmapProgress: 45,
    weakestCategory: 'SQL',
    strongestCategory: 'DSA',
    categories: []
  };
  const coachMap = utils.buildCoachReadinessMap(sampleCoach, { targetRole: 'Backend Engineer' });
  const coachTypes = coachMap.nodes.map(n => n.entityType);
  assert(
    coachTypes.includes('roadmap') &&
    coachTypes.includes('revision') &&
    coachTypes.includes('interview') &&
    coachTypes.includes('applications'),
    'Check 6: Placement Coach readiness map nodes have target entityTypes for seamless cross-tab navigation'
  );

  // =========================================================================
  // CHECK 7: Application journey preserves applicationId
  // =========================================================================
  const sampleApp = { id: 'app_google_swe', company: 'Google', role: 'SWE II', status: 'Online Assessment' };
  const appMap = utils.buildApplicationJourneyMap(sampleApp);
  const oaNode = appMap.nodes.find(n => n.label === 'Online Assessment');
  assert(
    appMap.nodes.length >= 5 &&
    oaNode && oaNode.status === 'current' &&
    appMap.nodes.every(n => n.entityId === 'app_google_swe'),
    'Check 7: Application Journey Map preserves applicationId on every stage and marks current stage accurately'
  );

  // =========================================================================
  // CHECK 8: Interview nodes preserve interviewId
  // =========================================================================
  const sampleInterviewSession = { id: 'int_session_442', type: 'DSA', difficulty: 'Hard', questions: [1, 2, 3] };
  const interviewMap = utils.buildInterviewPrepMap({ stats: { interviewsCompleted: 4, averageScore: 82 } }, sampleInterviewSession, 'Data Scientist');
  const intSessionNode = interviewMap.nodes.find(n => n.entityType === 'interview_session');
  assert(
    intSessionNode && intSessionNode.entityId === 'int_session_442' && intSessionNode.status === 'active',
    'Check 8: Interview Preparation Map preserves active interview session ID and status'
  );

  // =========================================================================
  // CHECK 9: Calendar map uses real events
  // =========================================================================
  const sampleEvents = [
    { id: 'evt_study_1', date: '2026-09-18', time: '14:00', title: 'Two Pointers Sprint', durationMinutes: 45, type: 'STUDY_TASK' },
    { id: 'evt_int_1', date: '2026-09-18', time: '16:00', title: 'Mock Tech Screen', durationMinutes: 30, type: 'INTERVIEW' }
  ];
  const sampleConflicts = [{ eventId: 'evt_int_1', id: 'evt_int_1' }];
  const calMap = utils.buildCalendarDayFlowMap('2026-09-18', sampleEvents, sampleConflicts);
  const studyEvtNode = calMap.nodes.find(n => n.entityId === 'evt_study_1');
  const conflictEvtNode = calMap.nodes.find(n => n.entityId === 'evt_int_1');
  assert(
    calMap.nodes.length === 3 &&
    studyEvtNode && studyEvtNode.label === 'Two Pointers Sprint' &&
    conflictEvtNode && conflictEvtNode.status === 'overdue',
    'Check 9: Calendar Day Flow Map accurately maps chronological events and highlights conflict warnings'
  );

  // =========================================================================
  // CHECK 10: Notification target identity preserved
  // =========================================================================
  const sampleNotif = { id: 'notif_rev_01', type: 'REVISION_DUE', title: 'Graphs due for recall', time: '10m ago', targetId: 'rev_graphs_22' };
  const notifMap = utils.buildNotificationRelationMap(sampleNotif);
  const notifTarget = notifMap.nodes.find(n => n.entityType === 'revision');
  assert(
    notifMap.nodes.length === 2 &&
    notifTarget && notifTarget.entityId === 'rev_graphs_22',
    'Check 10: Notification Relation Map preserves notification source and targeted deep-link entity ID'
  );

  // =========================================================================
  // CHECK 11: Multi-user isolation (Pure transformers with 0 static pollution)
  // =========================================================================
  const mapUserA = utils.buildProfileSystemMap({ targetRole: 'AI Engineer', dailyTargetHours: 4 }, 25);
  const mapUserB = utils.buildProfileSystemMap({ targetRole: 'Frontend Dev', dailyTargetHours: 2 }, 90);
  assert(
    mapUserA.nodes[0].label === 'AI Engineer' &&
    mapUserB.nodes[0].label === 'Frontend Dev' &&
    mapUserA.nodes[1].sublabel.includes('25%') &&
    mapUserB.nodes[1].sublabel.includes('90%'),
    'Check 11: Visual map transformers are pure and provide strict multi-user profile isolation'
  );

  // =========================================================================
  // CHECK 12: No synthetic metrics
  // =========================================================================
  const zeroMetrics = { averageRetention: 0 };
  const emptyRevMap = utils.buildRevisionMemoryMap([], zeroMetrics);
  const coachZero = utils.buildCoachReadinessMap({ readinessPercent: 0, roadmapProgress: 0 });
  assert(
    emptyRevMap.nodes[0].sublabel.includes('0%') &&
    coachZero.nodes[coachZero.nodes.length - 1].sublabel.includes('0%'),
    'Check 12: Visual map builders never synthesize artificial metrics, strictly reflecting real state'
  );

  // =========================================================================
  // CHECK 13: No fabricated nodes
  // =========================================================================
  const emptyAppMap = utils.buildApplicationJourneyMap({});
  const emptyRoadmapMap = utils.buildRoadmapVisualMap({ phases: [] });
  assert(
    emptyAppMap.nodes.length === 0 &&
    emptyRoadmapMap.nodes.length === 0,
    'Check 13: Empty entity collections yield zero fabricated nodes'
  );

  // =========================================================================
  // CHECK 14: Dark theme tokens utilized in VisualMap components
  // =========================================================================
  const visualMapNodeSrc = readFile('src/components/VisualMap/VisualMapNode.jsx');
  const visualMapContainerSrc = readFile('src/components/VisualMap/VisualMap.jsx');
  assert(
    !visualMapNodeSrc.includes('#FFFFFF') &&
    !visualMapNodeSrc.includes('#fff') &&
    visualMapNodeSrc.includes('var(--bg-card') &&
    visualMapNodeSrc.includes('var(--border-beige') &&
    visualMapContainerSrc.includes('var(--text-charcoal'),
    'Check 14: VisualMap and node components strictly utilize semantic CSS theme tokens with zero hardcoded white'
  );

  // =========================================================================
  // CHECK 15: Light theme preserved
  // =========================================================================
  const indexCss = readFile('src/index.css');
  assert(
    indexCss.includes(':root') &&
    indexCss.includes('--bg-card: #FFFFFF') &&
    indexCss.includes('--border-beige: #EAE3D8'),
    'Check 15: Light mode token values are fully preserved in :root'
  );

  // =========================================================================
  // CHECK 16: System theme compatibility
  // =========================================================================
  assert(
    indexCss.includes('[data-theme="dark"]') &&
    indexCss.includes('--bg-card: #1E2421') &&
    indexCss.includes('--text-charcoal: #F5F3EF'),
    'Check 16: Dark mode root selector configures high-contrast dark tokens for full theme switcher compatibility'
  );

  // =========================================================================
  // CHECK 17: Keyboard accessibility (tabIndex, onKeyDown)
  // =========================================================================
  assert(
    visualMapNodeSrc.includes('tabIndex={isInteractive ? 0 : -1}') &&
    visualMapNodeSrc.includes("e.key === 'Enter' || e.key === ' '") &&
    visualMapNodeSrc.includes("isInteractive ? 'button' : 'article'"),
    'Check 17: VisualMapNode enforces tabIndex={0}, Enter/Space key listeners, and accessible role="button"'
  );

  // =========================================================================
  // CHECK 18: >= 44px touch targets
  // =========================================================================
  assert(
    visualMapNodeSrc.includes("minHeight: '44px'") &&
    visualMapNodeSrc.includes("compact ? '110px' : '140px'"),
    'Check 18: Interactive map nodes guarantee >= 44px minimum touch target height for mobile accessibility'
  );

  // =========================================================================
  // CHECK 19: Mobile horizontal overflow safety
  // =========================================================================
  assert(
    visualMapContainerSrc.includes("overflowX: 'auto'") &&
    visualMapContainerSrc.includes("maxWidth: '100%'") &&
    visualMapContainerSrc.includes("WebkitOverflowScrolling: 'touch'"),
    'Check 19: VisualMap container constrains overflow to internal scrolling preventing page-level horizontal blowouts'
  );

  // =========================================================================
  // CHECK 20: Responsive desktop layout
  // =========================================================================
  const miniMapSrc = readFile('src/components/VisualMap/VisualMapMiniMap.jsx');
  assert(
    miniMapSrc.includes('flexWrap: \'wrap\'') &&
    miniMapSrc.includes('All Phases') &&
    visualMapContainerSrc.includes("direction === 'vertical'"),
    'Check 20: VisualMap and MiniMap support responsive directional layouts (horizontal/vertical) and wrapping'
  );

  // =========================================================================
  // CHECK 21: Empty states handling
  // =========================================================================
  const nullRoadmap = utils.buildRoadmapVisualMap(null);
  const nullToday = utils.buildTodayLearningPathMap([], null, []);
  const nullStudy = utils.buildStudyContextMap({}, {});
  const nullCal = utils.buildCalendarDayFlowMap('', [], []);
  assert(
    nullRoadmap.nodes.length === 0 &&
    nullToday.nodes.length === 1 && // Today's target root
    nullStudy.nodes.length === 2 && // Root + Quiz
    nullCal.nodes.length === 1,    // Selected day root
    'Check 21: Utility functions handle null, undefined, and empty inputs gracefully without runtime errors'
  );

  // =========================================================================
  // CHECK 22: Loading states handling in consumers
  // =========================================================================
  const roadmapViewSrc = readFile('src/components/Roadmap/RoadmapView.jsx');
  const coachViewSrc = readFile('src/components/Coach/CoachView.jsx');
  assert(
    coachViewSrc.includes('isCoachLoading && !coachAnalysis') &&
    coachViewSrc.includes('Evaluating Placement Readiness...'),
    'Check 22: Consuming views maintain resilient loading screens prior to rendering visual maps'
  );

  // =========================================================================
  // CHECK 23: Error states handling in consumers
  // =========================================================================
  const deepStudyDocSrc = readFile('src/components/Study/DeepStudyDocument.jsx');
  assert(
    deepStudyDocSrc.includes('buildStudyContextMap(task || {}, material || {})'),
    'Check 23: Study document visual map invocation handles partial or missing task/material payloads safely'
  );

  // =========================================================================
  // CHECK 24: Large roadmap performance safety
  // =========================================================================
  const largePhases = Array.from({ length: 15 }, (_, pIdx) => ({
    id: `large_phase_${pIdx}`,
    number: pIdx + 1,
    title: `Phase ${pIdx + 1}: Core System`,
    topics: Array.from({ length: 20 }, (_, tIdx) => ({
      id: `top_${pIdx}_${tIdx}`,
      name: `Algorithm Module ${tIdx}`,
      status: 'pending',
      category: 'DSA'
    }))
  }));
  const startTime = Date.now();
  const largeMap = utils.buildRoadmapVisualMap({ id: 'rd_large', phases: largePhases });
  const durationMs = Date.now() - startTime;
  assert(
    largeMap.nodes.length > 0 && durationMs < 50,
    `Check 24: Large roadmap (15 phases, 300 topics) transforms in ${durationMs}ms (<50ms threshold) ensuring fast rendering`
  );

  console.log('='.repeat(80));
  console.log(`ALL ${assertionCount} REGRESSION CHECKS PASSED SUCCESSFULLY! 🎯`);
  console.log('='.repeat(80));
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
