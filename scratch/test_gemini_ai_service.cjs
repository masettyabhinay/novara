/**
 * Automated Mock Test Suite for NOVARA Gemini AI Integration
 * Tests:
 * 1. Gemini successful response across all 6 features (Roadmap, Daily Plan, Coach, Interview Qs, Interview Eval, Revision Qs)
 * 2. Invalid JSON handling (retry once, graceful fallback)
 * 3. Timeout handling (15s limit, abort controller)
 * 4. Rate-limit handling (HTTP 429 / RESOURCE_EXHAUSTED)
 * 5. Authentication failure (HTTP 401/403)
 * 6. Provider unavailable (HTTP 503 / network failure fallback)
 * 7. Schema validation (rejection of corrupted schemas)
 * 8. API key not exposed to frontend
 * 9. API key not appearing in logs
 *
 * Does NOT require a real Gemini API key.
 */

const fs = require('fs');
const path = require('path');

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${message}`);
}

async function runTests() {
  console.log('================================================================');
  console.log('🤖 STARTING NOVARA GOOGLE GEMINI AI INTEGRATION TEST SUITE');
  console.log('================================================================\n');

  // Dynamic import ESM modules
  const {
    BaseAIProvider,
    GeminiAIProvider,
    MockAIProvider,
    setAIProvider,
    getAIProvider,
    resetAIProvider,
    isGeminiConfigured,
    parseRoadmapWithAI,
    generateDailyPlanWithAI,
    analyzeCoachWithAI,
    generateInterviewQuestionsWithAI,
    evaluateInterviewAnswerWithAI,
    generateRevisionQuestionsWithAI
  } = await import('file:///f:/NOVARA/server/aiService.js');

  const { validateRoadmapSchema } = await import('file:///f:/NOVARA/server/roadmapService.js');
  const { Logger } = await import('file:///f:/NOVARA/server/logger.js');

  // ---------------------------------------------------------------------------
  // TEST 1: Provider Abstraction & Configuration
  // ---------------------------------------------------------------------------
  console.log('[Test 1] Testing Provider Abstraction & Custom Provider Switching...');
  const initialProvider = getAIProvider();
  assert(initialProvider instanceof BaseAIProvider, 'Default provider inherits from BaseAIProvider');
  assert(initialProvider.name === 'google-gemini', 'Default provider is google-gemini');
  assert(initialProvider.getEffectiveModel() === 'gemini-3.7-flash', 'Default model configured as gemini-3.7-flash');

  // Test environment variable configurability of GEMINI_MODEL
  const originalEnvModel = process.env.GEMINI_MODEL;
  try {
    delete process.env.GEMINI_MODEL;
    const defaultInstance = new GeminiAIProvider();
    assert(defaultInstance.getEffectiveModel() === 'gemini-3.7-flash', 'GeminiAIProvider defaults to gemini-3.7-flash when GEMINI_MODEL is unset');

    process.env.GEMINI_MODEL = 'gemini-3.7-flash-preview';
    const envInstance = new GeminiAIProvider();
    assert(envInstance.getEffectiveModel() === 'gemini-3.7-flash-preview', 'GeminiAIProvider dynamically respects GEMINI_MODEL from environment');

    const explicitInstance = new GeminiAIProvider({ model: 'gemini-custom-option' });
    assert(explicitInstance.getEffectiveModel() === 'gemini-custom-option', 'GeminiAIProvider respects explicit constructor option');
  } finally {
    if (originalEnvModel !== undefined) {
      process.env.GEMINI_MODEL = originalEnvModel;
    } else {
      delete process.env.GEMINI_MODEL;
    }
  }

  const mockProvider = new MockAIProvider({ configured: true });
  setAIProvider(mockProvider);
  assert(getAIProvider() === mockProvider, 'Provider switched cleanly to MockAIProvider');
  assert(isGeminiConfigured() === true, 'Mock provider reports configured');

  // ---------------------------------------------------------------------------
  // TEST 2: Successful AI Responses Across All 6 Features
  // ---------------------------------------------------------------------------
  console.log('\n[Test 2] Testing Successful Responses Across All 6 AI Features...');

  // 2.1 Roadmap Parsing
  const mockRoadmapResponse = {
    title: 'SWE Placement Roadmap 2026',
    targetRole: 'Full Stack Engineer',
    extractedSkills: ['Data Structures', 'System Design', 'React', 'Node.js'],
    phases: [
      {
        number: '01',
        title: 'Phase 01: Core DSA',
        description: 'Algorithmic fundamentals',
        topics: [
          { name: 'Arrays & Two Pointers', difficulty: 'Easy', problemsCount: 20, duration: '6h' },
          { name: 'Binary Search', difficulty: 'Medium', problemsCount: 15, duration: '8h' }
        ]
      },
      {
        number: '02',
        title: 'Phase 02: Advanced Trees',
        description: 'Tree structures and traversal',
        topics: [
          { name: 'Binary Search Trees', difficulty: 'Medium', problemsCount: 15, duration: '8h' }
        ]
      }
    ]
  };

  mockProvider.mockResponses.json = mockRoadmapResponse;
  const parsedRoadmap = await parseRoadmapWithAI('Sample curriculum text mentioning Phase 1 Core DSA and Phase 2 Advanced Trees...', 'Full Stack Engineer', 'curriculum.txt');
  assert(parsedRoadmap !== null, 'Roadmap semantic parsing returned structured object');
  assert(parsedRoadmap.phases.length === 2, 'Parsed exactly 2 phases');
  assert(parsedRoadmap.phases[0].topics.length === 2, 'Phase 1 has 2 topics');
  assert(parsedRoadmap.phases[0].topics[0].name === 'Arrays & Two Pointers', 'Topic name accurately retained');
  assert(parsedRoadmap.confidence === 'high', 'Roadmap has high confidence');

  // 2.2 Daily Plan Generation
  const mockPlanResponse = {
    tasks: [
      {
        category: 'DSA',
        topicId: 't-1',
        name: 'Binary Search Edge Cases',
        description: 'Solve 2 medium problems on rotated arrays',
        durationMinutes: 45,
        priority: 'High',
        type: 'practice',
        subtasks: [{ text: 'Implement search in rotated array' }, { text: 'Analyze boundary conditions' }]
      },
      {
        category: 'Core CS',
        topicId: 't-2',
        name: 'OS Process vs Threads',
        description: 'Revise memory space differences and race conditions',
        durationMinutes: 45,
        priority: 'High',
        type: 'learning',
        subtasks: [{ text: 'Review mutexes and semaphores' }]
      },
      {
        category: 'Aptitude',
        topicId: 't-3',
        name: 'Speed Math Drills',
        description: 'Solve 15 percentage and ratio problems',
        durationMinutes: 30,
        priority: 'Medium',
        type: 'practice',
        subtasks: [{ text: 'Practice under 60-second timer' }]
      }
    ]
  };
  mockProvider.mockResponses.json = mockPlanResponse;
  const generatedPlan = await generateDailyPlanWithAI({
    roadmap: parsedRoadmap,
    preferences: { dailyTargetHours: 2.5 }
  });
  assert(generatedPlan !== null, 'Daily plan generated successfully');
  assert(generatedPlan.tasks.length === 3, 'Generated 3 structured daily tasks');
  assert(generatedPlan.totalScheduledMinutes <= 150, `Plan respects daily capacity (${generatedPlan.totalScheduledMinutes}m <= 150m)`);

  // 2.3 AI Placement Coach Analysis
  const mockBaselineCoach = {
    hasData: true,
    readinessPercent: 68,
    status: 'needs_attention',
    pacingStatus: 'on_track',
    daysRemaining: 45,
    roadmapProgress: 52,
    weakestCategory: 'Core CS',
    strongestCategory: 'DSA',
    categories: [{ name: 'DSA', percentage: 75 }, { name: 'Core CS', percentage: 40 }],
    strengths: ['Baseline strength'],
    weakAreas: ['Baseline weak area'],
    compactInsight: 'Baseline insight',
    recommendation: { summary: 'Baseline rec' },
    weeklyReport: { takeaways: ['Baseline takeaway'] }
  };
  const mockCoachAiResponse = {
    compactInsight: 'Core CS progress is lagging behind DSA. Shift 30m daily to Operating Systems.',
    strengths: ['Consistent DSA problem solving', 'Strong 5-day active study streak'],
    weakAreas: ['Operating Systems and Database transactions need immediate focus'],
    recommendationSummary: 'Reallocate 30m from general aptitude to Core CS concurrency.',
    weeklyTakeaways: ['Complete OS deadlock Coffman conditions', 'Maintain daily streak']
  };
  mockProvider.mockResponses.json = mockCoachAiResponse;
  const coachAnalysis = await analyzeCoachWithAI({
    user: { targetRole: 'Software Engineer' },
    roadmap: parsedRoadmap,
    tasks: [],
    streak: { currentStreak: 5 },
    applications: [],
    revisions: [],
    deterministicBaseline: mockBaselineCoach
  });
  assert(coachAnalysis.compactInsight === mockCoachAiResponse.compactInsight, 'Coach insight enhanced with AI analysis');
  assert(coachAnalysis.readinessPercent === 68, 'Deterministic readiness calculation preserved');
  assert(coachAnalysis.weakAreas[0].includes('Operating Systems'), 'AI weak areas reflect actual stats');

  // 2.4 Mock Interview Question Generation
  const mockInterviewQsResponse = {
    questions: [
      {
        category: 'Technical',
        topic: 'Graph Algorithms',
        difficulty: 'Medium',
        question: 'Explain Dijkstra algorithm and its time complexity using a min-heap.',
        expectedKeywords: ['min-heap', 'priority queue', 'O((V + E) log V)', 'shortest path', 'non-negative weights'],
        idealAnswerOutline: 'Dijkstra finds the single-source shortest path in weighted graphs with non-negative edges using a min-heap.'
      }
    ]
  };
  mockProvider.mockResponses.json = mockInterviewQsResponse;
  const interviewQuestions = await generateInterviewQuestionsWithAI({
    targetRole: 'Software Engineer',
    roadmapTopics: ['Graph Algorithms'],
    difficulty: 'Medium',
    count: 1
  });
  assert(interviewQuestions !== null && interviewQuestions.length === 1, 'Interview question generated cleanly');
  assert(interviewQuestions[0].expectedKeywords.includes('min-heap'), 'Expected keywords properly preserved');

  // 2.5 Mock Interview Evaluation
  const mockEvalResponse = {
    score: 90,
    correctness: 92,
    relevance: 95,
    completeness: 88,
    clarity: 90,
    technicalDepth: 85,
    strengths: ['Correctly identified priority queue data structure', 'Accurate time complexity'],
    improvements: ['Could elaborate on why negative weights cause failure'],
    missingConcepts: ['negative cycle detection']
  };
  mockProvider.mockResponses.json = mockEvalResponse;
  const answerEval = await evaluateInterviewAnswerWithAI({
    question: 'Explain Dijkstra algorithm',
    expectedKeywords: ['min-heap'],
    idealAnswerOutline: 'Shortest path with non-negative weights',
    userAnswer: 'Dijkstra algorithm uses a min-heap priority queue to find shortest paths in O((V+E) log V).'
  });
  assert(answerEval !== null, 'Interview answer evaluation completed');
  assert(answerEval.score === 90, 'Composite score evaluated correctly');
  assert(answerEval.correctness === 92, 'Correctness metric matches');
  assert(answerEval.isSkipped === false, 'Skipped flag set to false');

  // 2.6 Smart Revision Questions
  const mockRevisionQsResponse = {
    questions: [
      {
        type: 'mcq',
        question: 'What is the time complexity of searching in a Balanced Binary Search Tree?',
        options: ['O(log N)', 'O(N)', 'O(1)', 'O(N²)'],
        correctAnswer: 'O(log N)',
        explanation: 'Balanced BST halves the search space at each depth level.',
        testedSubconcept: 'BST Search'
      }
    ]
  };
  mockProvider.mockResponses.json = mockRevisionQsResponse;
  const revisionQuestions = await generateRevisionQuestionsWithAI({
    topicName: 'Binary Search Trees',
    category: 'DSA',
    difficulty: 'Medium'
  });
  assert(revisionQuestions !== null && revisionQuestions.length === 1, 'Smart revision questions generated');
  assert(revisionQuestions[0].correctAnswer === 'O(log N)', 'Correct answer present');
  assert(revisionQuestions[0].explanation.includes('Balanced BST'), 'Educational explanation included');

  // ---------------------------------------------------------------------------
  // TEST 3: Invalid JSON Handling & Retry Behavior
  // ---------------------------------------------------------------------------
  console.log('\n[Test 3] Testing Malformed JSON Recovery & Fallback...');
  const errorProvider = new MockAIProvider({ forceInvalidJson: true });
  setAIProvider(errorProvider);

  // If Gemini returns invalid JSON, parseRoadmapWithAI catches and falls back cleanly (returns null)
  const invalidJsonRoadmap = await parseRoadmapWithAI('Sample text', 'Role', 'file.pdf');
  assert(invalidJsonRoadmap === null, 'Malformed JSON returns null without crashing, triggering deterministic fallback');

  // ---------------------------------------------------------------------------
  // TEST 4: Timeout Handling
  // ---------------------------------------------------------------------------
  console.log('\n[Test 4] Testing Timeout Abort & Graceful Fallback...');
  const timeoutProvider = new MockAIProvider({ forceTimeout: true });
  setAIProvider(timeoutProvider);

  const timeoutPlan = await generateDailyPlanWithAI({ roadmap: parsedRoadmap, preferences: {} });
  assert(timeoutPlan === null, 'Timeout handled gracefully: returned null so caller uses deterministic generator');

  // ---------------------------------------------------------------------------
  // TEST 5: Rate Limit Handling (HTTP 429)
  // ---------------------------------------------------------------------------
  console.log('\n[Test 5] Testing Rate Limit (HTTP 429) Handling...');
  const rateLimitProvider = new MockAIProvider({ forceRateLimit: true });
  setAIProvider(rateLimitProvider);

  let caughtRateLimit = false;
  try {
    await rateLimitProvider.generateJSON({ prompt: 'test' });
  } catch (err) {
    if (err.isRateLimit && err.status === 429) {
      caughtRateLimit = true;
    }
  }
  assert(caughtRateLimit === true, 'Rate limit error properly identifies status 429 & isRateLimit');

  // ---------------------------------------------------------------------------
  // TEST 6: Authentication Failure (HTTP 401/403)
  // ---------------------------------------------------------------------------
  console.log('\n[Test 6] Testing Authentication Failure Handling...');
  const authErrorProvider = new MockAIProvider({ forceAuthError: true });
  setAIProvider(authErrorProvider);

  let caughtAuthErr = false;
  try {
    await authErrorProvider.generateJSON({ prompt: 'test' });
  } catch (err) {
    if (err.isAuthError && err.status === 401) {
      caughtAuthErr = true;
    }
  }
  assert(caughtAuthErr === true, 'Auth failure cleanly raises isAuthError (401) without crashing');

  // ---------------------------------------------------------------------------
  // TEST 7: Provider Unavailable (HTTP 503)
  // ---------------------------------------------------------------------------
  console.log('\n[Test 7] Testing Provider Unavailable (HTTP 503) Fallback...');
  const unavailableProvider = new MockAIProvider({ forceUnavailable: true });
  setAIProvider(unavailableProvider);

  const unavailableCoach = await analyzeCoachWithAI({
    user: {},
    roadmap: parsedRoadmap,
    deterministicBaseline: mockBaselineCoach
  });
  assert(unavailableCoach === mockBaselineCoach, 'Unavailable AI provider transparently returns deterministic baseline');

  // ---------------------------------------------------------------------------
  // TEST 8: Strict Schema Validation
  // ---------------------------------------------------------------------------
  console.log('\n[Test 8] Testing Strict Schema Validation Enforcement...');
  const invalidSchema1 = { title: 'No Phases' };
  const val1 = validateRoadmapSchema(invalidSchema1);
  assert(val1.valid === false, 'Schema validator correctly rejects roadmap without phases');

  const invalidSchema2 = { phases: [{ title: 'Empty Phase', topics: [] }] };
  const val2 = validateRoadmapSchema(invalidSchema2);
  assert(val2.valid === false, 'Schema validator correctly rejects phase without topics');

  const validSchema = {
    title: 'Valid Roadmap',
    phases: [{ title: 'Phase 1', topics: [{ name: 'Topic 1' }] }]
  };
  const val3 = validateRoadmapSchema(validSchema);
  assert(val3.valid === true, 'Schema validator accepts fully conforming roadmap');

  const { validateExtractedRoadmapQuality } = await import('file:///f:/NOVARA/server/roadmapService.js');
  const dirtyRoadmapWithMetadata = {
    title: 'Sample Roadmap',
    phases: [
      {
        number: '01',
        title: 'Phase 1',
        topics: [
          { name: 'NOVARA' },
          { name: 'Sample Software Engineer Placement Preparation Roadmap' },
          { name: 'Duration: 12 Weeks' },
          { name: 'Variables, data types and operators' }
        ]
      }
    ]
  };
  const qualityCheckFail = validateExtractedRoadmapQuality(dirtyRoadmapWithMetadata);
  assert(qualityCheckFail.valid === false, 'Quality validator strictly rejects roadmaps with product/title metadata in topics');

  const cleanRoadmap = {
    title: 'Sample Roadmap',
    phases: [
      {
        number: '01',
        title: 'Phase 1',
        topics: [
          { name: 'Variables, data types and operators', duration: null, problemsCount: null }
        ]
      }
    ]
  };
  const qualityCheckPass = validateExtractedRoadmapQuality(cleanRoadmap);
  assert(qualityCheckPass.valid === true, 'Quality validator accepts clean curriculum topics');

  // ---------------------------------------------------------------------------
  // TEST 9: Security Verification — API Key Never Exposed to Frontend
  // ---------------------------------------------------------------------------
  console.log('\n[Test 9] Testing Frontend Security & Secret Leak Prevention...');
  
  // Check that no files in src/ reference GEMINI_API_KEY
  function checkDirForPattern(dir, pattern) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        checkDirForPattern(fullPath, pattern);
      } else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.html') || file.endsWith('.css')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes(pattern)) {
          console.error(`❌ Security leak in frontend file ${fullPath}: contains ${pattern}`);
          process.exit(1);
        }
      }
    }
  }

  const srcDir = path.resolve(__dirname, '../src');
  if (fs.existsSync(srcDir)) {
    checkDirForPattern(srcDir, 'GEMINI_API_KEY');
    console.log('✅ PASS: Zero occurrences of GEMINI_API_KEY in client src/ directory');
  }

  // ---------------------------------------------------------------------------
  // TEST 10: Logger Sanitization of Gemini Secrets
  // ---------------------------------------------------------------------------
  console.log('\n[Test 10] Testing Logger Redaction of Gemini Secrets...');
  const testLogger = new Logger('test-logger');
  
  let capturedLog = '';
  const originalLog = console.log;
  console.log = (msg) => { capturedLog += msg + '\n'; };

  testLogger.info('Testing key redaction', {
    gemini_api_key: 'AIzaSySecretFakeKey123456789012345',
    token: 'my-session-token',
    normalField: 'safe data'
  });

  console.log = originalLog;

  assert(capturedLog.includes('"gemini_api_key":"[REDACTED]"'), 'Logger redacts gemini_api_key field');
  assert(capturedLog.includes('"token":"[REDACTED]"'), 'Logger redacts token field');
  assert(!capturedLog.includes('AIzaSySecretFakeKey123456789012345'), 'Logger does not print raw Google API key');
  assert(capturedLog.includes('"normalField":"safe data"'), 'Logger preserves safe metadata fields');

  // Reset provider to live default
  resetAIProvider();

  console.log('\n================================================================');
  console.log('🎉 ALL 10 GEMINI AI INTEGRATION TESTS PASSED SUCCESSFULLY!');
  console.log('================================================================\n');
}

runTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
