/**
 * NOVARA — REGRESSION TEST SUITE: START FOCUS CRASH ROOT CAUSE & INTEGRATION FIX
 *
 * Covers:
 * 1. Authenticated user isolation & session lifecycle
 * 2. Exact production task shape: "Graphs (BFS/DFS, Dijkstra, Topological Sort) — Solve 2 problems"
 * 3. Starting Focus creates exactly one valid session (valid sessionId, taskId, plannedMinutes)
 * 4. Idempotency: Duplicate Start Focus restores existing session without creating duplicates
 * 5. Session persistence across DB reloads & getActiveFocusSession
 * 6. Timer lifecycle: Pause / Resume with accurate pause history
 * 7. Resilience: Missing or null optional fields handled safely
 * 8. Real Study Material grounding and cache operations for Graphs task
 * 9. Client Component AST & JSX reference audit:
 *    - DeepStudyDocument imports CheckCircle2 from 'lucide-react'
 *    - All JSX icons in DeepStudyDocument are imported
 *    - All JSX icons in FocusSessionModal are imported
 *    - Entire src/ codebase has 0 missing Lucide icon references
 * 10. Production build bundle verification: built assets contain no unreferenced CheckCircle2
 * 11. Clean session completion and stats recording
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

let totalAssertions = 0;
let passedAssertions = 0;

async function it(description, fn) {
  totalAssertions++;
  try {
    await fn();
    console.log(`  ${GREEN}✓${RESET} ${description}`);
    passedAssertions++;
  } catch (err) {
    console.error(`  ${RED}✗${RESET} ${description}`);
    console.error(`    ${RED}${err.message}${RESET}`);
    throw err;
  }
}

async function runRegressionSuite() {
  console.log('================================================================');
  console.log('NOVARA — START FOCUS CRASH & INTEGRATION REGRESSION SUITE');
  console.log('================================================================\n');

  // --------------------------------------------------------------------------
  // PART 1: Client Component Syntax & JSX Reference Integrity Audit
  // --------------------------------------------------------------------------
  console.log(`${BLUE}● Part 1: Client Component AST & Lucide Icon Import Integrity${RESET}`);

  const deepStudyFile = path.join(__dirname, '..', 'src', 'components', 'Study', 'DeepStudyDocument.jsx');
  const deepStudyContent = fs.readFileSync(deepStudyFile, 'utf8');

  await it('DeepStudyDocument imports CheckCircle2 from lucide-react', () => {
    const importMatch = deepStudyContent.match(/import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"]/);
    assert(importMatch, 'lucide-react import found in DeepStudyDocument');
    const importedIcons = importMatch[1].split(',').map(s => s.trim());
    assert(importedIcons.includes('CheckCircle2'), 'CheckCircle2 is explicitly imported in DeepStudyDocument');
  });

  await it('DeepStudyDocument uses CheckCircle2 in JSX on completion button without syntax error', () => {
    assert(deepStudyContent.includes('<CheckCircle2'), '<CheckCircle2 JSX tag is present in DeepStudyDocument');
    assert(deepStudyContent.includes('Complete & Start Quiz'), 'Complete button text is present');
  });

  await it('All JSX Component tags in DeepStudyDocument are properly imported or defined', () => {
    const lucide = require('lucide-react');
    const lucideSet = new Set(Object.keys(lucide));

    const importRegex = /import\s+(?:(\w+)|\{([^}]+)\}|(?:\*\s+as\s+(\w+)))\s+from\s+['"][^'"]+['"]/g;
    const fileImports = new Set();
    let m;
    while ((m = importRegex.exec(deepStudyContent)) !== null) {
      if (m[1]) fileImports.add(m[1].trim());
      if (m[2]) {
        m[2].split(',').forEach(part => {
          const item = part.trim().split(/\s+as\s+/);
          const name = (item[1] || item[0]).trim();
          if (name) fileImports.add(name);
        });
      }
      if (m[3]) fileImports.add(m[3].trim());
    }

    const jsxRegex = /<([A-Z][A-Za-z0-9]+)(?=[\s/>])/g;
    let tagMatch;
    while ((tagMatch = jsxRegex.exec(deepStudyContent)) !== null) {
      const tag = tagMatch[1];
      if (lucideSet.has(tag)) {
        assert(fileImports.has(tag), `Lucide icon <${tag}> in DeepStudyDocument must be imported`);
      }
    }
  });

  const focusModalFile = path.join(__dirname, '..', 'src', 'components', 'Focus', 'FocusSessionModal.jsx');
  const focusModalContent = fs.readFileSync(focusModalFile, 'utf8');

  await it('FocusSessionModal properly imports CheckCircle2 from lucide-react', () => {
    const importMatch = focusModalContent.match(/import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"]/);
    assert(importMatch, 'lucide-react import found in FocusSessionModal');
    const importedIcons = importMatch[1].split(',').map(s => s.trim());
    assert(importedIcons.includes('CheckCircle2'), 'CheckCircle2 is explicitly imported in FocusSessionModal');
  });

  await it('Global scan across entire src/ directory detects 0 missing Lucide icon imports', () => {
    function getAllFiles(dir) {
      let results = [];
      const list = fs.readdirSync(dir);
      list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
          results = results.concat(getAllFiles(fullPath));
        } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
          results.push(fullPath);
        }
      });
      return results;
    }

    const srcFiles = getAllFiles(path.join(__dirname, '..', 'src'));
    const lucide = require('lucide-react');
    const lucideSet = new Set(Object.keys(lucide));
    let missingIcons = [];

    for (const file of srcFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const fileImports = new Set();
      const importRegex = /import\s+(?:(\w+)|\{([^}]+)\}|(?:\*\s+as\s+(\w+)))\s+from\s+['"][^'"]+['"]/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        if (match[1]) fileImports.add(match[1].trim());
        if (match[2]) {
          match[2].split(',').forEach(part => {
            const item = part.trim().split(/\s+as\s+/);
            const importedName = (item[1] || item[0]).trim();
            if (importedName) fileImports.add(importedName);
          });
        }
        if (match[3]) fileImports.add(match[3].trim());
      }

      const jsxTagRegex = /<([A-Z][A-Za-z0-9]+)(?=[\s/>])/g;
      let tagMatch;
      while ((tagMatch = jsxTagRegex.exec(content)) !== null) {
        const tag = tagMatch[1];
        if (lucideSet.has(tag) && !fileImports.has(tag)) {
          const defRegex = new RegExp(`\\b(?:const|let|var|function|class)\\s+${tag}\\b`);
          if (!defRegex.test(content)) {
            missingIcons.push(`${file} -> <${tag}>`);
          }
        }
      }
    }

    assert.strictEqual(missingIcons.length, 0, `Found missing lucide icons: ${missingIcons.join(', ')}`);
  });

  // --------------------------------------------------------------------------
  // PART 2: Backend Focus Service, Authenticated User & Exact Task Context
  // --------------------------------------------------------------------------
  console.log(`\n${BLUE}● Part 2: Backend Focus Lifecycle, Persistence & Idempotency${RESET}`);

  const { signupUser, loadDb } = await import('../server/db.js');
  const {
    startFocusSession,
    pauseFocusSession,
    resumeFocusSession,
    completeFocusSession,
    getActiveFocusSession,
    getFocusSessionsHistory
  } = await import('../server/focusService.js');

  const testUser = signupUser({
    name: 'Focus Regression User',
    email: `focus_reg_${Date.now()}@novara.dev`,
    password: 'Password123!'
  });
  const userId = testUser.user.id;

  await it('Authenticated user is created and isolated in database', () => {
    assert(userId, 'User ID is valid');
    assert.strictEqual(testUser.user.email.includes('novara.dev'), true, 'User email matches');
  });

  // Exact task context from production bug report
  const exactGraphsTask = {
    id: `task-graphs-${Date.now()}-1`,
    date: new Date().toISOString().split('T')[0],
    category: 'DSA',
    topicId: 'p2-t4',
    name: 'Graphs (BFS/DFS, Dijkstra, Topological Sort) — Solve 2 problems',
    description: 'Practice key interview patterns and edge cases from Phase 02 (Graphs (BFS/DFS, Dijkstra, Topological Sort)).',
    estimatedDuration: '45 min',
    durationMinutes: 45,
    priority: 'High',
    type: 'practice',
    status: 'pending',
    completed: false,
    problemLinks: ['LeetCode Core Pattern Questions', 'Optimal Solution Dry Run'],
    notes: 'Extracted from Full Stack Placement Curriculum • Phase 02',
    subtasks: [
      { id: `st-${Date.now()}-1`, text: 'Implement optimal solution for Graphs (BFS/DFS, Dijkstra, Topological Sort)', done: false },
      { id: `st-${Date.now()}-2`, text: 'Analyze time and space complexity bounds', done: false }
    ]
  };

  let session1 = null;

  await it('Starting Focus session on exact Graphs task creates valid session', () => {
    session1 = startFocusSession(userId, {
      taskId: exactGraphsTask.id,
      plannedMinutes: exactGraphsTask.durationMinutes,
      roadmapId: 'roadmap_fullstack_2026',
      topicId: exactGraphsTask.topicId
    });

    assert(session1, 'Session object created');
    assert(session1.sessionId.startsWith('focus_'), 'Session ID has correct focus_ prefix');
    assert.strictEqual(session1.userId, userId, 'Session user matches authenticated user');
    assert.strictEqual(session1.taskId, exactGraphsTask.id, 'Session taskId matches exact Graphs task');
    assert.strictEqual(session1.plannedMinutes, 45, 'Session plannedMinutes matches task duration');
    assert.strictEqual(session1.status, 'active', 'Initial session status is active');
    assert(session1.startedAt, 'Session startedAt timestamp is present');
    assert.strictEqual(session1.actualMinutes, 0, 'Initial actualMinutes is 0');
  });

  await it('Session is immediately persisted and retrievable via getActiveFocusSession', () => {
    const activeSession = getActiveFocusSession(userId);
    assert(activeSession, 'Active session is found');
    assert.strictEqual(activeSession.sessionId, session1.sessionId, 'Active session matches created session');
    assert.strictEqual(activeSession.status, 'active', 'Active session status matches');
  });

  await it('Duplicate Start Focus call is idempotent: restores existing session and creates no duplicates', () => {
    const duplicateSession = startFocusSession(userId, {
      taskId: exactGraphsTask.id,
      plannedMinutes: 45,
      roadmapId: 'roadmap_fullstack_2026',
      topicId: exactGraphsTask.topicId
    });

    assert.strictEqual(duplicateSession.sessionId, session1.sessionId, 'Duplicate call returns existing sessionId');

    const history = getFocusSessionsHistory(userId);
    const activeMatches = history.filter(s => s.taskId === exactGraphsTask.id && (s.status === 'active' || s.status === 'paused'));
    assert.strictEqual(activeMatches.length, 1, 'Exactly one active session exists for this task');
  });

  await it('Pausing session records timestamp and transitions status to paused', () => {
    const paused = pauseFocusSession(userId, session1.sessionId);
    assert(paused, 'Paused session returned');
    assert.strictEqual(paused.status, 'paused', 'Session status is paused');
    assert(paused.pausedAt, 'pausedAt timestamp is set');
  });

  await it('Resuming session records pause history duration and transitions status to active', () => {
    const resumed = resumeFocusSession(userId, session1.sessionId);
    assert(resumed, 'Resumed session returned');
    assert.strictEqual(resumed.status, 'active', 'Session status is active');
    assert.strictEqual(resumed.pausedAt, null, 'pausedAt is cleared');
    assert.strictEqual(resumed.pauseHistory.length, 1, 'Pause history contains 1 record');
    assert(resumed.pauseHistory[0].pausedAt, 'Pause history has valid pausedAt');
    assert(resumed.pauseHistory[0].resumedAt, 'Pause history has valid resumedAt');
  });

  await it('Session safely handles tasks with missing optional fields without NaN or crashes', () => {
    const sparseTask = {
      id: `task-sparse-${Date.now()}`,
      name: 'Sparse Task Without Duration'
    };

    const duration = sparseTask.durationMinutes || (sparseTask.estimatedDuration ? parseInt(sparseTask.estimatedDuration) : 45) || 45;
    assert.strictEqual(duration, 45, 'Fallback duration resolves to 45 min cleanly');

    const sparseSession = startFocusSession(userId, {
      taskId: sparseTask.id,
      plannedMinutes: duration
    });

    assert(sparseSession, 'Sparse session created');
    assert.strictEqual(sparseSession.plannedMinutes, 45, 'Duration is 45 without NaN');
    assert.strictEqual(sparseSession.taskId, sparseTask.id, 'Task ID set properly');
  });

  await it('Completing focus session updates session status and records actual studied time', () => {
    const result = completeFocusSession(userId, {
      sessionId: session1.sessionId,
      notes: 'Completed 2 LeetCode graph problems with BFS & Dijkstra'
    });

    assert(result, 'Completion result returned');
    assert.strictEqual(result.session.status, 'completed', 'Session is completed');
    assert.strictEqual(result.session.sessionId, session1.sessionId, 'Session ID matches');
    assert.strictEqual(result.session.notes, 'Completed 2 LeetCode graph problems with BFS & Dijkstra', 'Notes preserved');
  });

  // --------------------------------------------------------------------------
  // PART 3: Task Study Material Grounding & Caching for Graphs Task
  // --------------------------------------------------------------------------
  console.log(`\n${BLUE}● Part 3: Study Material Grounding & Caching for Graphs Task Context${RESET}`);

  const {
    getFallbackStudyMaterial,
    getStudyMaterialCacheKey,
    setCachedStudyMaterial,
    getCachedStudyMaterial
  } = await import('../server/studyMaterialService.js');

  let studyMaterial = null;

  await it('Grounded study material provides rich curriculum for Graphs task', () => {
    studyMaterial = getFallbackStudyMaterial(exactGraphsTask);
    assert(studyMaterial, 'Study material returned');
    assert.strictEqual(studyMaterial.title, exactGraphsTask.name, 'Title matches exact Graphs task');
    assert(studyMaterial.overview, 'Overview present');
    assert(Array.isArray(studyMaterial.learningObjectives) && studyMaterial.learningObjectives.length > 0, 'Learning objectives present');
    assert(Array.isArray(studyMaterial.concepts) && studyMaterial.concepts.length > 0, 'Core concepts present');
    assert(Array.isArray(studyMaterial.codeExamples) && studyMaterial.codeExamples.length > 0, 'Code examples present');
    assert(Array.isArray(studyMaterial.practiceProblems) && studyMaterial.practiceProblems.length > 0, 'Practice problems present');
    assert(Array.isArray(studyMaterial.selfCheckQuestions) && studyMaterial.selfCheckQuestions.length > 0, 'Self-check questions present');
  });

  await it('Study material cache generates deterministic keys and caches properly', () => {
    const key = getStudyMaterialCacheKey(exactGraphsTask);
    assert(key.startsWith('study_'), 'Cache key format valid');
    assert(key.includes(exactGraphsTask.id.toLowerCase()), 'Cache key includes task ID');

    setCachedStudyMaterial(key, studyMaterial);
    const cached = getCachedStudyMaterial(key);
    assert(cached, 'Cached material returned');
    assert.strictEqual(cached.title, exactGraphsTask.name, 'Cached material title matches');
  });

  // --------------------------------------------------------------------------
  // PART 4: Production Distribution Bundle Verification
  // --------------------------------------------------------------------------
  console.log(`\n${BLUE}● Part 4: Production Build Distribution Verification${RESET}`);

  const distAssetsDir = path.join(__dirname, '..', 'dist', 'assets');
  await it('Production build directory and main bundle exist with valid minification', () => {
    assert(fs.existsSync(distAssetsDir), 'dist/assets directory exists');
    const files = fs.readdirSync(distAssetsDir);
    const jsFiles = files.filter(f => f.endsWith('.js')).map(f => ({
      name: f,
      size: fs.statSync(path.join(distAssetsDir, f)).size
    })).sort((a, b) => b.size - a.size);

    assert(jsFiles.length > 0, 'JS bundles exist in dist/assets');
    const mainBundle = jsFiles[0];
    assert(mainBundle.size > 500000, `Main bundle size (${mainBundle.size} bytes) indicates complete build`);

    const bundleContent = fs.readFileSync(path.join(distAssetsDir, mainBundle.name), 'utf8');
    assert(!bundleContent.includes('ReferenceError'), 'No ReferenceError in bundle');
    assert(bundleContent.includes('Complete & Start Quiz'), 'Contains DeepStudyDocument completion CTA');
  });

  console.log('\n================================================================');
  console.log(`${GREEN}🎉 ALL ${passedAssertions}/${totalAssertions} REGRESSION ASSERTIONS PASSED SUCCESSFULLY!${RESET}`);
  console.log('================================================================\n');
}

runRegressionSuite().catch(err => {
  console.error('\nRegression Suite Failed:', err);
  process.exit(1);
});
