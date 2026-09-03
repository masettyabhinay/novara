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
assert.strictEqual = function(actual, expected, message) {
  assert(actual === expected, message || `${actual} === ${expected}`);
};

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
    generateRevisionQuestionsWithAI,
    generateTaskRevisionQuiz
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

  // 2.6 Smart Revision Questions (5 questions)
  const mockRevisionQsResponse = {
    questions: [
      {
        question: 'What is the time complexity of searching in a Balanced Binary Search Tree?',
        options: ['O(log N)', 'O(N)', 'O(1)', 'O(N²)'],
        correctAnswer: 0,
        explanation: 'Balanced BST halves the search space at each depth level.',
        topic: 'Binary Search Trees'
      },
      {
        question: 'In a BST, the in-order traversal of nodes visits keys in what order?',
        options: ['Sorted ascending order', 'Reverse sorted order', 'Random order', 'Level by level'],
        correctAnswer: 0,
        explanation: 'In-order traversal visits left subtree, root, right subtree, yielding sorted order.',
        topic: 'Binary Search Trees'
      },
      {
        question: 'What is the worst-case time complexity of BST operations when the tree becomes skewed?',
        options: ['O(N)', 'O(log N)', 'O(1)', 'O(N log N)'],
        correctAnswer: 0,
        explanation: 'When unbalanced/skewed, tree height equals N leading to O(N) operations.',
        topic: 'Binary Search Trees'
      },
      {
        question: 'Which self-balancing binary search tree maintains a height difference of at most 1 between left and right subtrees?',
        options: ['AVL Tree', 'B-Tree', 'Trie', 'Segment Tree'],
        correctAnswer: 0,
        explanation: 'AVL trees strictly enforce a balance factor in {-1, 0, 1}.',
        topic: 'Binary Search Trees'
      },
      {
        question: 'What node replaces a deleted node with two children in a standard BST deletion algorithm?',
        options: ['In-order successor (minimum in right subtree)', 'The root node', 'Any leaf node', 'The parent node'],
        correctAnswer: 0,
        explanation: 'The in-order successor maintains BST property when replacing a 2-child node.',
        topic: 'Binary Search Trees'
      }
    ]
  };
  mockProvider.mockResponses.json = mockRevisionQsResponse;
  const revisionQuestions = await generateRevisionQuestionsWithAI({
    topicName: 'Binary Search Trees',
    category: 'DSA',
    difficulty: 'Medium'
  });
  assert(revisionQuestions !== null && revisionQuestions.length === 5, 'Smart revision questions generated (5 questions)');
  assert(revisionQuestions[0].correctAnswer === 0, 'Correct answer index present');
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

  // ---------------------------------------------------------------------------
  // TEST 11: Faithful Curriculum Validation (Anti-Consolidation & Needs Review)
  // ---------------------------------------------------------------------------
  console.log('\n[Test 11] Testing Faithful Curriculum Validation & Anti-Consolidation Enforcement...');
  const { validateCurriculumFaithfulness, extractSourceCurriculumBullets } = await import('file:///f:/NOVARA/server/roadmapService.js');

  const sourceText = `Phase 2 — Data Structures
• Arrays and strings
• Linked Lists
• Stacks
• Queues
• Hash Tables`;

  const sourceBullets = extractSourceCurriculumBullets(sourceText);

  // Case A: Merged topic in AI response (e.g. "Stacks and Queues")
  const mergedAiRoadmap = {
    title: 'Data Structures Roadmap',
    phases: [
      {
        number: '01',
        title: 'Phase 2: Data Structures',
        topics: [
          { name: 'Arrays and strings' },
          { name: 'Linked Lists' },
          { name: 'Stacks and Queues' },
          { name: 'Hash Tables' }
        ]
      }
    ]
  };

  const mergeValidation = validateCurriculumFaithfulness(sourceBullets, mergedAiRoadmap);
  assert(mergeValidation.valid === false, 'Validator correctly detects merged topics ("Stacks" and "Queues" combined into "Stacks and Queues")');
  assert(mergeValidation.reason.includes('Stacks') && mergeValidation.reason.includes('Queues'), 'Validation error explicitly names merged topics');

  // Case B: Faithful preservation of separate topics
  const faithfulAiRoadmap = {
    title: 'Data Structures Roadmap',
    phases: [
      {
        number: '01',
        title: 'Phase 2: Data Structures',
        topics: [
          { name: 'Arrays and strings' },
          { name: 'Linked Lists' },
          { name: 'Stacks' },
          { name: 'Queues' },
          { name: 'Hash Tables' }
        ]
      }
    ]
  };

  const faithfulValidation = validateCurriculumFaithfulness(sourceBullets, faithfulAiRoadmap);
  assert(faithfulValidation.valid === true, 'Validator accepts faithfully preserved individual topics');

  // Case C: End-to-end AI Parsing with Merged Topic triggers needsReview=true
  const mockAiProvider = new MockAIProvider({ configured: true });
  mockAiProvider.mockResponses.json = mergedAiRoadmap;
  setAIProvider(mockAiProvider);

  const parsedWithReview = await parseRoadmapWithAI(sourceText, 'Software Engineer', 'curriculum.txt');
  assert(parsedWithReview !== null, 'AI parsing returns structured object');
  assert(parsedWithReview.needsReview === true, 'Roadmap with merged topics is marked needsReview=true');
  assert(parsedWithReview.reviewReason.includes('Stacks'), 'reviewReason explains why review is needed');

  // ---------------------------------------------------------------------------
  // TEST 12: Generic Task Revision Quiz Across All 10 Task Domains & Authoritative Task Completion
  // ---------------------------------------------------------------------------
  console.log('\n[Test 12] Testing Generic Task Revision Quiz Across All 10 Task Domains & Task Completion...');
  const {
    generateRevisionQuestions,
    recordTaskRevisionAndComplete
  } = await import('file:///f:/NOVARA/server/revisionService.js');

  const taskDomains = [
    {
      taskTitle: 'Arrays and String Manipulation Practice',
      taskDescription: 'Solve sliding window and two pointers problems on contiguous subarrays',
      roadmapPhase: 'Phase 1: Programming Foundations',
      roadmapTopic: 'Arrays and strings',
      taskCategory: 'DSA',
      difficulty: 'Medium'
    },
    {
      taskTitle: 'Linked List Pointer Manipulation',
      taskDescription: 'Implement Floyd cycle detection and iterative list reversal',
      roadmapPhase: 'Phase 2: Data Structures',
      roadmapTopic: 'Linked Lists',
      taskCategory: 'DSA',
      difficulty: 'Medium'
    },
    {
      taskTitle: 'DBMS Fundamentals & ACID Properties',
      taskDescription: 'Understand transaction isolation levels, atomicity, and indexing',
      roadmapPhase: 'Phase 4: Core CS',
      roadmapTopic: 'DBMS',
      taskCategory: 'Core CS',
      difficulty: 'Medium'
    },
    {
      taskTitle: 'SQL Joins & Window Functions',
      taskDescription: 'Write complex queries with INNER/LEFT joins and RANK() window functions',
      roadmapPhase: 'Phase 4: Core CS',
      roadmapTopic: 'SQL',
      taskCategory: 'SQL',
      difficulty: 'Medium'
    },
    {
      taskTitle: 'Operating Systems — Processes and Threads',
      taskDescription: 'Study virtual memory paging, deadlock Coffman conditions, and mutexes',
      roadmapPhase: 'Phase 4: Core CS',
      roadmapTopic: 'Operating Systems',
      taskCategory: 'Core CS',
      difficulty: 'Medium'
    },
    {
      taskTitle: 'Computer Networks — TCP/IP Protocol Suite',
      taskDescription: 'Understand TCP 3-way handshake, OSI layers, and DNS resolution',
      roadmapPhase: 'Phase 4: Core CS',
      roadmapTopic: 'Computer Networks',
      taskCategory: 'Core CS',
      difficulty: 'Medium'
    },
    {
      taskTitle: 'React Basics & Hook Architecture',
      taskDescription: 'Understand component state, useEffect dependency arrays, and Virtual DOM',
      roadmapPhase: 'Phase 5: Development',
      roadmapTopic: 'React basics',
      taskCategory: 'Development',
      difficulty: 'Medium'
    },
    {
      taskTitle: 'REST APIs & HTTP Protocols',
      taskDescription: 'Learn idempotency of HTTP methods, status codes, and statelessness',
      roadmapPhase: 'Phase 5: Development',
      roadmapTopic: 'REST APIs',
      taskCategory: 'Development',
      difficulty: 'Medium'
    },
    {
      taskTitle: 'Git & GitHub Workflow',
      taskDescription: 'Master git merge vs rebase, staging index, and pull request reviews',
      roadmapPhase: 'Phase 5: Development',
      roadmapTopic: 'Git & GitHub',
      taskCategory: 'Tools',
      difficulty: 'Easy'
    },
    {
      taskTitle: 'Aptitude & Quantitative Problem Solving',
      taskDescription: 'Solve speed, time & distance, work equations, and probability problems',
      roadmapPhase: 'Phase 6: Interview Preparation',
      roadmapTopic: 'Aptitude practice',
      taskCategory: 'Aptitude',
      difficulty: 'Medium'
    },
    {
      taskTitle: 'Resume Preparation & STAR Method',
      taskDescription: 'Structure STAR behavioral responses and quantify project impact metrics',
      roadmapPhase: 'Phase 6: Interview Preparation',
      roadmapTopic: 'Resume preparation',
      taskCategory: 'Interview',
      difficulty: 'Easy'
    }
  ];

  // A. Verify Grounded Fallback Question Generation across all 10+ domains
  for (const taskCtx of taskDomains) {
    const fallbackQuestions = generateRevisionQuestions(taskCtx);
    assert(fallbackQuestions !== null, `Fallback question bank exists for task "${taskCtx.taskTitle}"`);
    assert.strictEqual(fallbackQuestions.length, 5, `Fallback produces exactly 5 questions for "${taskCtx.taskTitle}"`);

    for (let i = 0; i < fallbackQuestions.length; i++) {
      const q = fallbackQuestions[i];
      assert(q.question && q.question.length > 5, `Question ${i + 1} has valid text`);
      assert.strictEqual(q.options.length, 4, `Question ${i + 1} has exactly 4 options`);
      assert(typeof q.correctAnswer === 'number' && q.correctAnswer >= 0 && q.correctAnswer <= 3, `Question ${i + 1} correctAnswer is 0-3 index`);
      assert(q.explanation && q.explanation.length > 5, `Question ${i + 1} has educational explanation`);
      assert(q.topic.length > 0, `Question ${i + 1} corresponds to task topic`);
    }
  }

  // B. Verify ungrounded unknown topic returns null (never fabricates random content)
  const unknownFallback = generateRevisionQuestions({ taskTitle: 'Quantum Teleportation of Asteroids', taskCategory: 'Astrophysics' });
  assert(unknownFallback === null, 'Ungrounded unknown topic returns null without fabricating random content');

  // C. Verify AI-powered generic task quiz generation with strict schema enforcement
  const dynamicAiProvider = new MockAIProvider({ configured: true });
  setAIProvider(dynamicAiProvider);

  for (const taskCtx of taskDomains.slice(0, 3)) {
    const mockAiQuizResponse = {
      questions: [
        {
          question: `Sample objective question for ${taskCtx.roadmapTopic} concept 1`,
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswer: 0,
          explanation: `Thorough explanation for ${taskCtx.roadmapTopic} concept 1`,
          topic: taskCtx.roadmapTopic
        },
        {
          question: `Sample objective question for ${taskCtx.roadmapTopic} concept 2`,
          options: ['Choice 1', 'Choice 2', 'Choice 3', 'Choice 4'],
          correctAnswer: 1,
          explanation: `Thorough explanation for ${taskCtx.roadmapTopic} concept 2`,
          topic: taskCtx.roadmapTopic
        },
        {
          question: `Sample objective question for ${taskCtx.roadmapTopic} concept 3`,
          options: ['Answer X', 'Answer Y', 'Answer Z', 'Answer W'],
          correctAnswer: 2,
          explanation: `Thorough explanation for ${taskCtx.roadmapTopic} concept 3`,
          topic: taskCtx.roadmapTopic
        },
        {
          question: `Sample objective question for ${taskCtx.roadmapTopic} concept 4`,
          options: ['Alpha', 'Beta', 'Gamma', 'Delta'],
          correctAnswer: 3,
          explanation: `Thorough explanation for ${taskCtx.roadmapTopic} concept 4`,
          topic: taskCtx.roadmapTopic
        },
        {
          question: `Sample objective question for ${taskCtx.roadmapTopic} concept 5`,
          options: ['Alpha 2', 'Beta 2', 'Gamma 2', 'Delta 2'],
          correctAnswer: 0,
          explanation: `Thorough explanation for ${taskCtx.roadmapTopic} concept 5`,
          topic: taskCtx.roadmapTopic
        }
      ]
    };
    dynamicAiProvider.mockResponses.json = mockAiQuizResponse;

    const aiGeneratedQuiz = await generateTaskRevisionQuiz(taskCtx);
    assert(aiGeneratedQuiz !== null, `generateTaskRevisionQuiz succeeded for ${taskCtx.taskTitle}`);
    assert.strictEqual(aiGeneratedQuiz.length, 5, `Generated exactly 5 questions for ${taskCtx.taskTitle}`);
    assert.strictEqual(aiGeneratedQuiz[0].options.length, 4, 'Has 4 options');
    assert.strictEqual(aiGeneratedQuiz[0].topic, taskCtx.roadmapTopic, 'Grounded in task roadmap topic');
  }

  // D. Verify Authoritative Task Completion & Deterministic SM-2 Revision Scheduling
  const testUserId = `user_test_quiz_${Date.now()}`;
  const taskId = `task_quiz_${Date.now()}`;
  const sessionId = `session_quiz_${Date.now()}`;

  // Seed user task and focus session in DB
  const { loadDb, saveDb } = await import('file:///f:/NOVARA/server/db.js');
  const db = loadDb();
  if (!db.tasks) db.tasks = {};
  db.tasks[testUserId] = [
    {
      id: taskId,
      userId: testUserId,
      name: 'Linked List Pointer Manipulation',
      category: 'DSA',
      completed: false,
      actualMinutesStudied: 0
    }
  ];
  if (!db.focusSessions) db.focusSessions = {};
  db.focusSessions[testUserId] = [
    {
      sessionId: sessionId,
      userId: testUserId,
      taskId: taskId,
      status: 'active',
      actualMinutes: 45
    }
  ];
  if (!db.streaks) db.streaks = {};
  db.streaks[testUserId] = {
    userId: testUserId,
    currentStreak: 4,
    longestStreak: 5,
    todayTargetMet: false,
    completedDays: 4
  };
  saveDb(db);

  // Submit quiz answers (4 out of 5 correct = 80%)
  const mockQuizAnswers = [
    { questionId: 'q_1', selectedAnswer: 'Floyd\'s Cycle-Finding Algorithm (Fast & Slow Pointers)', isCorrect: true },
    { questionId: 'q_2', selectedAnswer: 'Save curr.next in temporary variable before rewiring curr.next to prev', isCorrect: true },
    { questionId: 'q_3', selectedAnswer: 'Time: O(N), Space: O(1)', isCorrect: true },
    { questionId: 'q_4', selectedAnswer: 'Linked List only updates head pointer; Arrays must shift all N elements in contiguous memory', isCorrect: true },
    { questionId: 'q_5', selectedAnswer: 'Wrong Option', isCorrect: false }
  ];

  const completionResult = recordTaskRevisionAndComplete(testUserId, {
    taskId,
    sessionId,
    answers: mockQuizAnswers,
    durationMinutes: 45,
    taskContext: taskDomains[1]
  });

  assert(completionResult.success === true, 'recordTaskRevisionAndComplete returns success');
  assert.strictEqual(completionResult.scorePercent, 80, 'Server-side score calculated as 80%');
  assert.strictEqual(completionResult.correctCount, 4, '4 correct answers recorded');
  assert.strictEqual(completionResult.totalQuestions, 5, '5 total questions');
  assert(completionResult.task.completed === true, 'Task is officially finalized as completed');
  assert.strictEqual(completionResult.session.status, 'completed', 'Focus session marked as completed');
  assert(completionResult.revision.retentionScore >= 75, 'Deterministic SM-2 retention score boosted');
  assert(completionResult.nextIntervalDays >= 1, 'Spaced interval scheduled deterministically');

  // Idempotency verification: duplicate completion does not double-increment streak
  const initialStreak = completionResult.streak?.currentStreak || 4;
  const duplicateCompletion = recordTaskRevisionAndComplete(testUserId, {
    taskId,
    sessionId,
    answers: mockQuizAnswers,
    durationMinutes: 45,
    taskContext: taskDomains[1]
  });
  assert.strictEqual(duplicateCompletion.streak.currentStreak, initialStreak, 'Duplicate completion is idempotent');

  // E. Regression Test: "Arrays and strings" Grounding & Anti-STAR Framework
  console.log('\n[Regression Test] Verifying "Arrays and strings" grounding & zero STAR framework leakage...');
  const arraysTaskContext = {
    taskTitle: 'Arrays and strings',
    taskDescription: 'Solve 2 medium problems on subarray sums and string manipulation',
    roadmapPhase: 'Phase 1 - Programming Foundations',
    roadmapTopic: 'Arrays and strings',
    taskCategory: 'DSA',
    difficulty: 'Medium',
    learningObjectives: 'Master two pointers, sliding window, and Kadane algorithm'
  };

  const arraysGroundedQuestions = generateRevisionQuestions(arraysTaskContext);
  assert(arraysGroundedQuestions !== null, 'Grounded questions generated for "Arrays and strings"');
  assert.strictEqual(arraysGroundedQuestions.length, 5, 'Exactly 5 questions generated');

  for (const q of arraysGroundedQuestions) {
    const fullQText = `${q.question} ${(q.options || []).join(' ')} ${q.explanation || ''}`.toLowerCase();
    assert(!fullQText.includes('star framework'), 'Question must NOT contain "STAR framework"');
    assert(!fullQText.includes('star method'), 'Question must NOT contain "STAR method"');
    assert(!fullQText.includes('resume'), 'Question must NOT contain "resume"');
    assert(!fullQText.includes('elevator pitch'), 'Question must NOT contain "elevator pitch"');
    assert(!fullQText.includes('behavioral interview'), 'Question must NOT contain "behavioral interview"');
    assert(!fullQText.includes('hr interview'), 'Question must NOT contain "HR interview"');
    assert(
      fullQText.includes('array') ||
      fullQText.includes('subarray') ||
      fullQText.includes('two pointers') ||
      fullQText.includes('pointer') ||
      fullQText.includes('kadane') ||
      fullQText.includes('prefix sum') ||
      fullQText.includes('sliding window') ||
      fullQText.includes('sort'),
      'Question is strictly relevant to Arrays and strings'
    );
  }

  // F. Regression Test: Unrelated Gemini Response is Caught & Rejected by Relevance Validator
  console.log('\n[Regression Test] Testing that Unrelated Gemini Question is Rejected & Retried/Failsafe...');
  const { validateTaskQuizRelevance } = await import('file:///f:/NOVARA/server/aiService.js');
  const contaminatedGeminiResponse = {
    questions: [
      {
        question: 'What does the STAR framework stand for in behavioral and technical placement interviews?',
        options: [
          'Situation, Task, Action, Result',
          'System, Timing, Algorithm, Response',
          'Scope, Technique, Analysis, Review',
          'Source, Testing, Assertion, Release'
        ],
        correctAnswer: 0,
        explanation: 'STAR stands for Situation, Task, Action, Result.',
        topic: 'Arrays and strings'
      },
      {
        question: 'What is the time complexity of Kadane\'s algorithm?',
        options: ['O(N)', 'O(N^2)', 'O(log N)', 'O(1)'],
        correctAnswer: 0,
        explanation: 'Kadane runs in O(N).',
        topic: 'Arrays and strings'
      },
      {
        question: 'How do two pointers work on a sorted array?',
        options: ['Move left right based on sum', 'Random swap', 'Hash search', 'Sort twice'],
        correctAnswer: 0,
        explanation: 'Pointers move towards center.',
        topic: 'Arrays and strings'
      },
      {
        question: 'What is a prefix sum array?',
        options: ['Cumulative sum array', 'Reverse array', 'Binary tree', 'Bitset'],
        correctAnswer: 0,
        explanation: 'Prefix sum stores cumulative sums.',
        topic: 'Arrays and strings'
      },
      {
        question: 'What is the space complexity of in-place array reversal?',
        options: ['O(1)', 'O(N)', 'O(N^2)', 'O(log N)'],
        correctAnswer: 0,
        explanation: 'In-place reversal uses constant memory.',
        topic: 'Arrays and strings'
      }
    ]
  };

  const relevanceCheck = validateTaskQuizRelevance(contaminatedGeminiResponse, arraysTaskContext, 'arrays');
  assert(relevanceCheck.valid === false, 'Relevance validator successfully rejects contaminated STAR question in Arrays task');
  assert(relevanceCheck.reason.includes('Question 1'), 'Validator explicitly flags Question 1 as cross-domain / unrelated');

  // H. TASK-SPECIFIC STUDY MATERIAL TESTS
  console.log('\n================================================================');
  console.log('📚 TESTING TASK-SPECIFIC STUDY MATERIAL GENERATION & GROUNDING');
  console.log('================================================================');

  const {
    generateTaskStudyMaterial,
    validateTaskStudyMaterialSchema,
    validateTaskStudyMaterialRelevance,
    validateTaskStudyMaterialQuality
  } = await import('file:///f:/NOVARA/server/aiService.js');
  const {
    getFallbackStudyMaterial,
    getStudyMaterialCacheKey,
    getCachedStudyMaterial,
    setCachedStudyMaterial
  } = await import('file:///f:/NOVARA/server/studyMaterialService.js');

  const studyDomains = [
    {
      taskTitle: 'Arrays and String Manipulation Practice',
      roadmapTopic: 'Arrays and strings',
      taskCategory: 'DSA',
      expectedKeywords: ['two pointers', 'sliding window', 'kadane', 'prefix sum']
    },
    {
      taskTitle: 'Linked List Pointer Manipulation',
      roadmapTopic: 'Linked lists',
      taskCategory: 'DSA',
      expectedKeywords: ['floyd', 'cycle', 'reversal', 'dummy']
    },
    {
      taskTitle: 'SQL Joins, Aggregations & Window Functions',
      roadmapTopic: 'SQL',
      taskCategory: 'SQL',
      expectedKeywords: ['join', 'having', 'rank', 'dense_rank']
    },
    {
      taskTitle: 'React Basics & Modern Component Architecture',
      roadmapTopic: 'React',
      taskCategory: 'Development',
      expectedKeywords: ['hooks', 'state', 'useeffect', 'virtual dom']
    },
    {
      taskTitle: 'Resume Preparation & STAR Method',
      roadmapTopic: 'Resume preparation',
      taskCategory: 'Interview',
      expectedKeywords: ['star', 'metrics', 'elevator pitch', 'behavioral']
    }
  ];

  // 1. Verify Fallback Study Material for all required domains
  for (const item of studyDomains) {
    const fallbackMat = getFallbackStudyMaterial(item);
    assert(fallbackMat !== null, `Fallback study material exists for "${item.taskTitle}"`);
    assert(fallbackMat.title && fallbackMat.title.length > 0, 'Has title');
    assert(fallbackMat.overview && fallbackMat.overview.length > 20, 'Has rich overview');
    assert(Array.isArray(fallbackMat.codeExamples) || Array.isArray(fallbackMat.examples), 'Has code examples or examples array');
    assert(Array.isArray(fallbackMat.commonMistakes) && fallbackMat.commonMistakes.length >= 1, 'Has common mistakes');
    assert(
      (Array.isArray(fallbackMat.quickRecap) && fallbackMat.quickRecap.length >= 1) ||
      (Array.isArray(fallbackMat.keyTakeaways) && fallbackMat.keyTakeaways.length >= 1),
      'Has quick recap or key takeaways'
    );

    const fullText = JSON.stringify(fallbackMat).toLowerCase();
    const hasExpectedKeyword = item.expectedKeywords.some(kw => fullText.includes(kw));
    assert(hasExpectedKeyword, `Study material contains domain-relevant terminology for ${item.taskTitle}`);
    console.log(`✅ PASS: Grounded Study Material validated for ${item.taskTitle}`);
  }

  // 2. Test Contamination Rejection (Arrays task + STAR framework response)
  console.log('\n[Regression Test] Verifying that Contaminated Study Material is Rejected & Retried/Failsafe...');
  const contaminatedStudyResponse = {
    title: 'Arrays and String Manipulation Practice',
    overview: 'The STAR framework is essential for behavioral interviews when discussing array problems.',
    concepts: [
      {
        name: 'STAR Method in Tech Rounds',
        explanation: 'Situation, Task, Action, Result for explaining algorithmic decisions.',
        example: 'Describe how you solved an array problem using STAR.'
      }
    ],
    stepByStep: ['Step 1: Explain the Situation', 'Step 2: Define your Task', 'Step 3: Detail your Action', 'Step 4: Quantify Result'],
    examples: [
      {
        title: 'STAR Story',
        explanation: 'Behavioral response template',
        code: 'Situation -> Task -> Action -> Result'
      }
    ],
    commonMistakes: ['Not quantifying the result metric in the STAR response.'],
    placementRelevance: 'Evaluates behavioral communication.',
    quickRecap: ['Always use STAR for interview answers.']
  };

  const studyRelevanceCheck = validateTaskStudyMaterialRelevance(contaminatedStudyResponse, {
    taskTitle: 'Arrays and String Manipulation Practice',
    roadmapTopic: 'Arrays and strings',
    taskCategory: 'DSA'
  }, 'arrays');

  assert(studyRelevanceCheck.valid === false, 'Study material relevance validator rejects contaminated STAR framework in Arrays task');
  console.log('✅ PASS: Study material relevance validator successfully caught and rejected STAR contamination');

  // 3. Test End-to-End AI Generation across all requested domains
  console.log('\n[AI Generation] Testing Gemini Study Material Generation across Domains...');
  const studyAiProvider = new MockAIProvider({ configured: true });
  setAIProvider(studyAiProvider);

  const testDomainResponses = [
    {
      ctx: { taskTitle: 'Arrays and String Manipulation Practice', roadmapTopic: 'Arrays and strings', taskCategory: 'DSA' },
      resp: {
        title: 'Arrays and String Manipulation Practice',
        subtitle: 'Two Pointers and Sliding Window',
        overview: 'Arrays are linear contiguous memory blocks optimized for O(1) index access.',
        learningObjectives: ['Master Two Pointers', 'Implement Kadane algorithm'],
        concepts: [
          { name: 'Two Pointers', explanation: 'Move pointers inward in O(N).', intuition: 'Eliminates brute-force combinations.', example: 'Two sum sorted.' }
        ],
        diagrams: [
          {
            id: 'diag_two_pointers',
            conceptName: 'Two Pointers',
            title: 'Two Pointers on Sorted Array',
            purpose: 'Visualize inward pointer movements in O(N)',
            type: 'algorithm',
            description: 'Left pointer at idx 0, Right pointer at idx 3.',
            elements: [
              { id: 'el_0', label: '2', sublabel: 'idx 0', type: 'array', highlight: true },
              { id: 'el_3', label: '15', sublabel: 'idx 3', type: 'array', highlight: true }
            ],
            connections: [{ from: 'el_0', to: 'el_3', label: 'sum = 17' }],
            steps: [{ step: 1, title: 'Check boundary sum', description: '2 + 15 = 17 > target 13. Move right pointer left.' }]
          }
        ],
        realWorldAnalogy: {
          analogy: 'Two librarians moving inward on sorted bookshelf.',
          explanation: 'Comparing boundaries eliminates search space without nested loops.',
          mappedConcept: 'Two Pointers'
        },
        definitions: [
          { term: 'Contiguous Subarray', definition: 'Adjacent unbroken elements.', context: 'DSA' }
        ],
        formulas: [
          { name: 'Prefix Sum', formula: 'Sum(L, R) = prefix[R] - prefix[L-1]', variables: 'prefix[i]', intuition: 'O(1) range queries' }
        ],
        practiceProblems: [
          { title: 'Two Sum II', problem: 'Sorted pair sum', difficulty: 'Medium', skillTested: 'Two Pointers', hint: 'Check bounds', approach: 'Two pointers' }
        ],
        selfCheckQuestions: [
          { question: 'Why does Kadane fail if initialized to 0 on negative array?', answerSummary: '0 is larger than negative numbers.', prompt: 'Kadane initialization check' }
        ],
        patterns: [{ name: 'Sliding Window', whenToUse: 'Contiguous ranges', howItWorks: 'Expand right, shrink left', example: 'Longest substring' }],
        stepByStep: ['1. Bounds check', '2. Pointer setup', '3. Edge cases'],
        codeExamples: [{ title: 'Kadane Max Subarray', language: 'javascript', code: 'function maxSubArray(nums) {}', explanation: 'Linear scan', complexity: { time: 'O(N)', space: 'O(1)' } }],
        workedExamples: [{ title: 'Two Sum II', problem: 'Sorted array pair sum', approach: 'Two pointers from ends', solution: 'O(N) time' }],
        commonMistakes: ['Not handling all negative array in Kadane'],
        interviewTips: ['State time and space complexity upfront'],
        practiceGuidance: ['LeetCode #53 and #11'],
        quickRecap: ['Two pointers requires sorted input'],
        keyTakeaways: ['O(N) time and O(1) space'],
        placementRelevance: 'Tested in 80%+ of initial screening rounds.',
        domain: 'arrays'
      }
    },
    {
      ctx: { taskTitle: 'Linked List Pointer Manipulation', roadmapTopic: 'Linked lists', taskCategory: 'DSA' },
      resp: {
        title: 'Linked List Pointer Manipulation',
        subtitle: 'Fast & Slow Pointers and Reversal',
        overview: 'Linked lists use node pointers to form dynamic chains without contiguous memory.',
        learningObjectives: ['Implement Floyd cycle detection', 'Reverse list in-place'],
        concepts: [{ name: 'Fast & Slow Pointers', explanation: 'Tortoise and hare detection.', intuition: 'Faster pointer laps slower pointer in loop.', example: 'Cycle detection.' }],
        diagrams: [
          {
            id: 'diag_ll_rev',
            conceptName: 'Fast & Slow Pointers',
            title: 'Pointer Rewiring Traversal',
            purpose: 'Visualizes pointer updates in-place',
            type: 'structure',
            description: 'In-place next pointer rewiring.',
            elements: [
              { id: 'node_1', label: '[ 1 | • ]', sublabel: 'head', type: 'node' },
              { id: 'node_2', label: '[ 2 | • ]', sublabel: 'curr', type: 'node', highlight: true }
            ],
            connections: [{ from: 'node_1', to: 'node_2', label: 'next' }],
            steps: []
          }
        ],
        patterns: [{ name: 'Dummy Head', whenToUse: 'Head deletions', howItWorks: 'Pre-head node', example: 'Merge lists' }],
        stepByStep: ['1. Save nextNode', '2. Rewire curr.next', '3. Advance pointers'],
        codeExamples: [{ title: 'Reverse List', language: 'javascript', code: 'function reverseList(head) {}', explanation: 'In-place reversal', complexity: { time: 'O(N)', space: 'O(1)' } }],
        workedExamples: [{ title: 'Cycle Start Node', problem: 'Find loop entry', approach: 'Floyd algorithm', solution: 'O(N) time' }],
        commonMistakes: ['Losing pointer reference before saving nextNode'],
        interviewTips: ['Ask if singly or doubly linked'],
        practiceGuidance: ['LeetCode #206 and #141'],
        quickRecap: ['Floyd algorithm runs in O(1) auxiliary space'],
        keyTakeaways: ['Never overwrite curr.next without temp storage'],
        placementRelevance: 'Core data structure evaluated at top tech firms.',
        domain: 'linked_lists'
      }
    },
    {
      ctx: { taskTitle: 'SQL Joins, Aggregations & Window Functions', roadmapTopic: 'SQL', taskCategory: 'SQL' },
      resp: {
        title: 'SQL Joins, Aggregations & Window Functions',
        subtitle: 'Relational Queries and Window Partitions',
        overview: 'SQL standardizes relational queries and analytical calculations.',
        learningObjectives: ['Master INNER and LEFT joins', 'Write DENSE_RANK window queries'],
        concepts: [{ name: 'Window Functions', explanation: 'Computes metrics without collapsing rows.', intuition: 'Partitions dataset on the fly.', example: 'DENSE_RANK() OVER (PARTITION BY dept_id ORDER BY sal DESC).' }],
        diagrams: [
          {
            id: 'diag_sql',
            conceptName: 'Window Functions',
            title: 'SQL Relational JOIN Logic',
            purpose: 'Contrasts matching vs unmatched rows',
            type: 'flow',
            description: 'INNER vs LEFT JOIN result sets.',
            elements: [
              { id: 't_a', label: 'Table A', sublabel: 'Left table' },
              { id: 't_b', label: 'Table B', sublabel: 'Right table' }
            ],
            connections: [{ from: 'Table A', to: 'Table B', label: 'ON A.id = B.a_id' }],
            steps: []
          }
        ],
        patterns: [{ name: 'CTE with Partition', whenToUse: 'Top-N per group', howItWorks: 'Rank with CTE then filter', example: 'Nth highest salary' }],
        stepByStep: ['1. Base join', '2. WHERE filter', '3. PARTITION ranking'],
        codeExamples: [{ title: 'Nth Highest Salary', language: 'sql', code: 'WITH Ranked AS (...) SELECT ...', explanation: 'CTE window rank', complexity: { time: 'O(N log N)', space: 'O(N)' } }],
        workedExamples: [{ title: 'Customers Without Orders', problem: 'Find unassigned customers', approach: 'LEFT JOIN with WHERE IS NULL', solution: 'O(N) scan' }],
        commonMistakes: ['Using WHERE with aggregate functions instead of HAVING'],
        interviewTips: ['Always use table aliases'],
        practiceGuidance: ['LeetCode SQL 50'],
        quickRecap: ['WHERE filters rows; HAVING filters aggregates'],
        keyTakeaways: ['DENSE_RANK leaves no gaps on duplicate ties'],
        placementRelevance: 'Tested in backend and data engineering interviews.',
        domain: 'sql'
      }
    },
    {
      ctx: { taskTitle: 'React Basics & Modern Component Architecture', roadmapTopic: 'React', taskCategory: 'Development' },
      resp: {
        title: 'React Basics & Modern Component Architecture',
        subtitle: 'Hooks, Immutability & Reconciliation',
        overview: 'React builds declarative UIs with reactive state and Virtual DOM diffing.',
        learningObjectives: ['Manage useEffect cleanups', 'Understand state immutability'],
        concepts: [{ name: 'State Immutability', explanation: 'Update state via pure copies.', intuition: 'Enables shallow reference comparisons in Virtual DOM.', example: 'setItems(prev => [...prev, item]).' }],
        diagrams: [
          {
            id: 'diag_react',
            conceptName: 'State Immutability',
            title: 'Unidirectional Data Flow & Reconciliation',
            purpose: 'Visualizes parent props down, child events up',
            type: 'flow',
            description: 'Unidirectional state flow.',
            elements: [
              { id: 'parent', label: 'Parent Component', sublabel: 'State Owner' },
              { id: 'child', label: 'Child Component', sublabel: 'Props receiver' }
            ],
            connections: [{ from: 'Parent', to: 'Child', label: 'Props' }],
            steps: []
          }
        ],
        patterns: [{ name: 'Custom Hook', whenToUse: 'Reusable effect logic', howItWorks: 'Extract stateful function', example: 'useWindowSize' }],
        stepByStep: ['1. Unidirectional data flow', '2. Pick hook', '3. Add cleanup function'],
        codeExamples: [{ title: 'useWindowSize Custom Hook', language: 'javascript', code: 'export function useWindowSize() {}', explanation: 'Resize listener with cleanup', complexity: { time: 'O(1)', space: 'O(1)' } }],
        workedExamples: [{ title: 'Debounced Search', problem: 'Throttle keystroke API calls', approach: 'Timeout inside useEffect', solution: '300ms debounce' }],
        commonMistakes: ['Mutating state directly bypassing React change detection'],
        interviewTips: ['Explain how React 18 batches state updates'],
        practiceGuidance: ['Build debounced search input'],
        quickRecap: ['Return a cleanup function from useEffect to avoid memory leaks'],
        keyTakeaways: ['State flows down; Events flow up'],
        placementRelevance: 'Heavily tested for Frontend and Full Stack positions.',
        domain: 'react'
      }
    },
    {
      ctx: { taskTitle: 'Resume Preparation & STAR Method', roadmapTopic: 'Resume preparation', taskCategory: 'Interview' },
      resp: {
        title: 'Resume Preparation & STAR Method',
        subtitle: 'Behavioral Communication & Metric Impact',
        overview: 'Structured communication and project impact demonstrate technical ownership.',
        learningObjectives: ['Structure STAR stories', 'Quantify project metrics'],
        concepts: [{ name: 'STAR Framework', explanation: 'Situation, Task, Action, Result.', intuition: 'Proves individual engineering ownership with objective outcomes.', example: 'API latency reduction story.' }],
        diagrams: [], // Resume correctly returns empty diagrams array
        patterns: [{ name: 'Google XYZ Resume Formula', whenToUse: 'Resume bullet points', howItWorks: 'Accomplished X by doing Z as measured by Y', example: 'Reduced latency by 40%' }],
        stepByStep: ['1. Pick project challenge', '2. Define personal action', '3. State metric outcome'],
        codeExamples: [],
        workedExamples: [{ title: 'Behavioral Conflict Story', problem: 'Resolving architecture disagreement', approach: 'Benchmark data and proof of concept', solution: 'Team alignment' }],
        commonMistakes: ['Using "we" exclusively instead of stating your own individual contribution'],
        interviewTips: ['Spend 60% of STAR response on Action and Result'],
        practiceGuidance: ['Draft 4 STAR stories with metrics'],
        quickRecap: ['STAR: Situation, Task, Action, Result'],
        keyTakeaways: ['Quantify project outcomes with concrete numbers and percentages'],
        placementRelevance: 'Evaluated in behavioral and engineering manager rounds.',
        domain: 'resume_interview'
      }
    }
  ];

  for (const testCase of testDomainResponses) {
    studyAiProvider.mockResponses.json = testCase.resp;
    const generated = await generateTaskStudyMaterial(testCase.ctx);
    assert(generated !== null, `generateTaskStudyMaterial succeeded for ${testCase.ctx.taskTitle}`);
    assert.strictEqual(generated.title, testCase.resp.title, `Title matches for ${testCase.ctx.taskTitle}`);
    assert(generated.overview.length > 20, 'Has comprehensive overview');
    assert(Array.isArray(generated.concepts) && generated.concepts.length >= 1, 'Contains concepts');
    assert(Array.isArray(generated.learningObjectives), 'Contains learning objectives');
    assert(Array.isArray(generated.diagrams), 'Contains valid diagrams array');
    if (testCase.resp.realWorldAnalogy) {
      assert(generated.realWorldAnalogy !== null, 'Contains real-world analogy');
      assert(generated.realWorldAnalogy.analogy.length > 10, 'Analogy text is descriptive');
    }
    if (testCase.resp.practiceProblems) {
      assert(Array.isArray(generated.practiceProblems) && generated.practiceProblems.length >= 1, 'Contains practice problems');
      assert(generated.practiceProblems[0].hint.length > 5, 'Practice problem contains hint');
    }
    if (testCase.resp.selfCheckQuestions) {
      assert(Array.isArray(generated.selfCheckQuestions) && generated.selfCheckQuestions.length >= 1, 'Contains self check questions');
    }
    console.log(`✅ PASS: Gemini Deep Study document generated & validated for ${testCase.ctx.taskTitle}`);
  }

  // 3b. Test Contaminated Diagram Rejection
  console.log('\n[Diagram Quality Test] Testing Contaminated Diagram in Technical Task is Rejected...');
  const contaminatedDiagramResponse = {
    title: 'Arrays and String Manipulation Practice',
    subtitle: 'Two Pointers Practice',
    overview: 'Arrays are linear contiguous memory blocks.',
    learningObjectives: ['Master Two Pointers'],
    concepts: [{ name: 'Two Pointers', explanation: 'Pointers move inward.', intuition: 'Avoids O(N2).', example: 'Sorted pair.' }],
    diagrams: [
      {
        id: 'diag_bad',
        title: 'STAR Framework in Arrays',
        type: 'flow',
        description: 'Behavioral interview and STAR method flow chart.',
        elements: [{ id: '1', label: 'STAR Framework' }]
      }
    ],
    patterns: [{ name: 'Two Pointers', whenToUse: 'Sorted array', howItWorks: 'Inward shift', example: 'Two Sum II' }],
    stepByStep: ['1. Sort', '2. Pointers'],
    codeExamples: [{ title: 'Code', language: 'js', code: 'function () {}', explanation: 'Code', complexity: { time: 'O(N)', space: 'O(1)' } }],
    workedExamples: [{ title: 'Ex', problem: 'P', approach: 'A', solution: 'S' }],
    commonMistakes: ['None'],
    interviewTips: ['Tip'],
    practiceGuidance: ['Practice'],
    quickRecap: ['Recap'],
    keyTakeaways: ['Takeaways'],
    placementRelevance: 'High',
    domain: 'arrays'
  };

  const diagramContaminationCheck = validateTaskStudyMaterialQuality(contaminatedDiagramResponse, {
    taskTitle: 'Arrays and String Manipulation Practice',
    roadmapTopic: 'Arrays and strings',
    taskCategory: 'DSA'
  });
  assert(diagramContaminationCheck.valid === false, 'Contaminated diagram caught and rejected by validator');
  console.log('✅ PASS: Cross-domain / STAR contaminated diagram successfully caught and rejected');

  // 4. Test Server-side Cache Layer with Fingerprinting
  const cacheKey = getStudyMaterialCacheKey({ taskTitle: 'Arrays and strings', roadmapTopic: 'Arrays and strings', taskDescription: 'Practice sliding window' });
  const sampleDoc = testDomainResponses[0].resp;
  setCachedStudyMaterial(cacheKey, sampleDoc);
  const retrievedCached = getCachedStudyMaterial(cacheKey);
  assert(retrievedCached !== null, 'Retrieved cached study material from in-memory cache');
  assert.strictEqual(retrievedCached.title, sampleDoc.title, 'Cached title matches');
  console.log('✅ PASS: Server-side in-memory study material fingerprint cache verified');

  // 5. Full End-to-End Task Lifecycle Test (Today Task -> Study Material -> Focus Session -> Task Quiz -> Spaced Repetition -> Task Complete)
  console.log('\n[End-to-End Test] Testing Full Task Lifecycle: Study -> Focus -> Quiz -> Spaced Repetition...');
  const e2eUserId = `user_e2e_${Date.now()}`;
  const e2eTaskId = `task_e2e_${Date.now()}`;
  const e2eSessionId = `session_e2e_${Date.now()}`;

  const { loadDb: loadDbE2E, saveDb: saveDbE2E } = await import('file:///f:/NOVARA/server/db.js');
  const dbE2E = loadDbE2E();
  if (!dbE2E.tasks) dbE2E.tasks = {};
  dbE2E.tasks[e2eUserId] = [
    {
      id: e2eTaskId,
      userId: e2eUserId,
      name: 'Arrays and strings — Solve 2 problems',
      category: 'DSA',
      completed: false,
      actualMinutesStudied: 0
    }
  ];
  if (!dbE2E.focusSessions) dbE2E.focusSessions = {};
  dbE2E.focusSessions[e2eUserId] = [
    {
      sessionId: e2eSessionId,
      userId: e2eUserId,
      taskId: e2eTaskId,
      status: 'active',
      actualMinutes: 45
    }
  ];
  if (!dbE2E.streaks) dbE2E.streaks = {};
  dbE2E.streaks[e2eUserId] = {
    userId: e2eUserId,
    currentStreak: 5,
    longestStreak: 5,
    todayTargetMet: false,
    completedDays: 5
  };
  saveDbE2E(dbE2E);

  // Step A: Study Material fetched
  const e2eStudyMaterial = getFallbackStudyMaterial({ taskTitle: 'Arrays and strings', taskCategory: 'DSA' });
  assert(e2eStudyMaterial !== null && e2eStudyMaterial.domain === 'arrays', 'Study material available for task');

  // Step B: Task Quiz generated & submitted
  const e2eQuizAnswers = [
    { questionId: 'q_arr_1', selectedAnswer: 'Time: O(N), Space: O(1)', isCorrect: true },
    { questionId: 'q_arr_2', selectedAnswer: 'Two Pointers with Left and Right moving inward', isCorrect: true },
    { questionId: 'q_arr_3', selectedAnswer: 'prefix[R] - prefix[L-1]', isCorrect: true },
    { questionId: 'q_arr_4', selectedAnswer: 'Dynamic / Sliding Window', isCorrect: true },
    { questionId: 'q_arr_5', selectedAnswer: 'max(nums[i], current_sum + nums[i])', isCorrect: true }
  ];

  const e2eResult = recordTaskRevisionAndComplete(e2eUserId, {
    taskId: e2eTaskId,
    sessionId: e2eSessionId,
    answers: e2eQuizAnswers,
    durationMinutes: 45,
    taskContext: { taskTitle: 'Arrays and strings', roadmapTopic: 'Arrays and strings', taskCategory: 'DSA' }
  });

  assert(e2eResult.success === true, 'Task completed successfully after quiz');
  assert.strictEqual(e2eResult.scorePercent, 100, 'Score is 100%');
  assert.strictEqual(e2eResult.task.completed, true, 'Task marked completed');
  assert.strictEqual(e2eResult.session.status, 'completed', 'Focus session completed');
  assert(e2eResult.revision.retentionScore >= 80, 'Deterministic SM-2 retention score boosted');
  console.log('✅ PASS: Complete end-to-end task lifecycle verified');

  // Clean up
  const dbCleanE2E = loadDbE2E();
  delete dbCleanE2E.tasks[e2eUserId];
  delete dbCleanE2E.focusSessions[e2eUserId];
  delete dbCleanE2E.revisions[e2eUserId];
  delete dbCleanE2E.streaks[e2eUserId];
  saveDbE2E(dbCleanE2E);

  // 6. INTERACTIVE AI TUTOR TESTS (ASK NOVARA)
  console.log('\n================================================================');
  console.log('🤖 TESTING INTERACTIVE AI TUTOR (ASK NOVARA) & GROUNDING');
  console.log('================================================================');

  const {
    validateTaskTutorResponse,
    generateTaskTutorResponse
  } = await import('file:///f:/NOVARA/server/aiService.js');
  const { getFallbackTutorResponse } = await import('file:///f:/NOVARA/server/studyMaterialService.js');

  // 6a. Test Tutor Response Validation
  console.log('\n[Tutor Validation] Testing Validation & Anti-Contamination Rules...');

  const validArrayAnswer = `### Two Pointers Technique\n\n**Definition:**\nTwo pointers move inward from boundaries.\n\n**Why it matters:**\nPrunes search space from O(N2) to O(N).\n\n**Complexity:**\n- Time: O(N)\n- Space: O(1)`;
  const validArrayCheck = validateTaskTutorResponse(validArrayAnswer, {
    taskTitle: 'Arrays and String Manipulation Practice',
    roadmapTopic: 'Arrays and strings',
    taskCategory: 'DSA'
  });
  assert(validArrayCheck.valid === true, 'Valid Arrays tutor response passes validation');
  console.log('✅ PASS: Valid domain-grounded tutor answer accepted');

  // Deflection check
  const outOfScopeAnswer = 'That is outside this study topic. Ask me something about **Arrays and strings**.';
  const outOfScopeCheck = validateTaskTutorResponse(outOfScopeAnswer, {
    taskTitle: 'Arrays and String Manipulation Practice',
    roadmapTopic: 'Arrays and strings',
    taskCategory: 'DSA'
  });
  assert(outOfScopeCheck.valid === true, 'Out-of-scope standard deflection message passes validation');
  console.log('✅ PASS: Standard out-of-scope deflection passes validation');

  // STAR contamination in technical task
  const contaminatedTutorAnswer = `To answer this problem, use the STAR framework: Situation, Task, Action, Result. In your behavioral interview, explain how you resolved the bug.`;
  const contaminatedCheck = validateTaskTutorResponse(contaminatedTutorAnswer, {
    taskTitle: 'Arrays and String Manipulation Practice',
    roadmapTopic: 'Arrays and strings',
    taskCategory: 'DSA'
  });
  assert(contaminatedCheck.valid === false, 'Tutor validator catches and rejects STAR framework in technical task');
  console.log('✅ PASS: Cross-domain / STAR contaminated tutor answer rejected in technical task');

  // 6b. Test Grounded Fallback Tutor Generator across 11 Domains
  console.log('\n[Tutor Fallbacks] Testing Grounded Fallbacks across all 11 Core Domains...');
  const all11Domains = [
    { title: 'Arrays and String Manipulation Practice', topic: 'Arrays and strings', domain: 'arrays' },
    { title: 'Linked List Pointer Manipulation', topic: 'Linked lists', domain: 'linked_lists' },
    { title: 'Binary Search & Monotonic Spaces', topic: 'Binary search', domain: 'binary_search' },
    { title: 'SQL Joins, Aggregations & Window Functions', topic: 'SQL', domain: 'sql' },
    { title: 'DBMS Fundamentals & ACID Properties', topic: 'DBMS', domain: 'dbms' },
    { title: 'Operating Systems — Processes & Threads', topic: 'Operating systems', domain: 'operating_systems' },
    { title: 'Computer Networks — TCP/IP', topic: 'Computer networks', domain: 'computer_networks' },
    { title: 'React Basics & Modern Component Architecture', topic: 'React', domain: 'react' },
    { title: 'Git Version Control & Workflows', topic: 'Git', domain: 'git_github' },
    { title: 'Aptitude & Quantitative Problem Solving', topic: 'Aptitude', domain: 'aptitude' },
    { title: 'Resume Preparation & STAR Method', topic: 'Resume preparation', domain: 'resume_interview' }
  ];

  for (const item of all11Domains) {
    // 1. Explain simpler
    const simplerResp = getFallbackTutorResponse({ taskTitle: item.title, roadmapTopic: item.topic, actionType: 'explain_simpler' });
    assert(simplerResp && simplerResp.answer.length > 20, `Explain simpler works for ${item.title}`);

    // 2. Another example
    const exampleResp = getFallbackTutorResponse({ taskTitle: item.title, roadmapTopic: item.topic, actionType: 'another_example' });
    assert(exampleResp && exampleResp.answer.length > 20, `Another example works for ${item.title}`);

    // 3. Practice problem
    const practiceResp = getFallbackTutorResponse({ taskTitle: item.title, roadmapTopic: item.topic, actionType: 'practice_problem' });
    assert(practiceResp && practiceResp.answer.length > 20, `Practice problem works for ${item.title}`);

    // 4. Step by step
    const stepResp = getFallbackTutorResponse({ taskTitle: item.title, roadmapTopic: item.topic, actionType: 'step_by_step' });
    assert(stepResp && stepResp.answer.length > 20, `Step by step works for ${item.title}`);

    // 5. Explain code
    const codeResp = getFallbackTutorResponse({ taskTitle: item.title, roadmapTopic: item.topic, actionType: 'explain_code', codeContext: 'function test() {}' });
    assert(codeResp && codeResp.answer.includes('Complexity Analysis'), `Code explanation has complexity for ${item.title}`);

    console.log(`✅ PASS: Grounded tutor actions verified for ${item.title} (${item.domain})`);
  }

  // Out of scope query in technical task
  const outOfScopeFallback = getFallbackTutorResponse({
    taskTitle: 'Arrays and strings',
    roadmapTopic: 'Arrays and strings',
    userQuery: 'What is the weather in Tokyo today?'
  });
  assert(outOfScopeFallback.answer.includes('outside this study topic'), 'Unrelated query deflected with topic guidance');
  console.log('✅ PASS: Unrelated question cleanly deflected to current task');

  // STAR question in Arrays task deflected
  const starInArrayFallback = getFallbackTutorResponse({
    taskTitle: 'Arrays and strings',
    roadmapTopic: 'Arrays and strings',
    userQuery: 'How to structure STAR method for interview'
  });
  assert(starInArrayFallback.answer.includes('outside this study topic'), 'STAR question in Arrays task deflected');
  console.log('✅ PASS: STAR question in technical task cleanly deflected');

  // 6c. Test AI Tutor Generation with Mock Provider
  console.log('\n[AI Tutor Generation] Testing Gemini AI Tutor Generation with Conversation History...');
  const tutorAiProvider = new MockAIProvider({ configured: true });
  setAIProvider(tutorAiProvider);

  tutorAiProvider.mockResponses.text = `### Explanation: Two Pointers\n\n**Definition:**\nTwo pointers technique maintains two boundary variables moving towards each other.\n\n**Why it matters:**\nEliminates O(N2) nested search passes into O(N) linear time.\n\n**Example:**\n\`\`\`javascript\nlet l = 0, r = arr.length - 1;\nwhile (l < r) {\n  if (arr[l] + arr[r] === target) return [l, r];\n  if (arr[l] + arr[r] < target) l++;\n  else r--;\n}\n\`\`\`\n\n**Complexity:**\n- Time Complexity: O(N)\n- Space Complexity: O(1)\n\n**Key Takeaway:**\nRequires sorted or monotonic input to guarantee correctness.`;

  const aiTutorResult = await generateTaskTutorResponse({
    taskTitle: 'Arrays and String Manipulation Practice',
    roadmapTopic: 'Arrays and strings',
    taskCategory: 'DSA',
    userQuery: 'Explain two pointers simply',
    actionType: 'explain_simpler',
    conversationHistory: [
      { role: 'user', text: 'What is two pointers?' },
      { role: 'model', text: 'Two pointers moves boundary variables inward.' }
    ]
  });

  assert(aiTutorResult !== null, 'Tutor AI generation succeeded');
  assert(aiTutorResult.answer.includes('Two Pointers'), 'Answer is grounded in task');
  assert(aiTutorResult.answer.includes('Time Complexity: O(N)'), 'Answer includes verified complexity');
  console.log('✅ PASS: Gemini AI Tutor generation succeeded with conversation context & complexity analysis');

  // Reset provider to live default
  resetAIProvider();

  console.log('\n================================================================');
  console.log('🎉 ALL GEMINI AI & STUDY MATERIAL INTEGRATION TESTS PASSED!');
  console.log('================================================================\n');
}

runTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});

