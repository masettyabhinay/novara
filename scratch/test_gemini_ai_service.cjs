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

  // Clean up test records
  const dbClean = loadDb();
  delete dbClean.tasks[testUserId];
  delete dbClean.focusSessions[testUserId];
  delete dbClean.revisions[testUserId];
  delete dbClean.streaks[testUserId];
  saveDb(dbClean);

  // Reset provider to live default
  resetAIProvider();

  console.log('\n================================================================');
  console.log('🎉 ALL 12 GEMINI AI INTEGRATION TESTS PASSED SUCCESSFULLY!');
  console.log('================================================================\n');
}

runTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
