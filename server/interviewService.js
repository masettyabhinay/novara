/**
 * Server-Side AI Mock Interview Engine for NOVARA
 * Generates personalized interview questions based on:
 * - Target Role
 * - Uploaded Roadmap & Topics
 * - Placement Coach Weak Areas
 * - Difficulty & Settings
 * 
 * Evaluates submitted answers with structured multi-dimensional rubrics:
 * - Correctness, Relevance, Completeness, Clarity, Technical Depth
 * - Zero hallucination (no fake voice tone / emotion claims)
 * - Persists interview history and performance trends.
 */

import { loadDb, saveDb } from './db.js';

// Question Bank with topic mappings and expected evaluation rubrics
const INTERVIEW_QUESTION_BANK = [
  // DSA
  {
    id: 'q-dsa-1',
    category: 'DSA',
    topic: 'Binary Search & Arrays',
    difficulty: 'Medium',
    question: 'Explain how Binary Search works. Under what preconditions can it be applied, and what is its time and space complexity?',
    expectedKeywords: ['sorted array', 'logarithmic time', 'O(log n)', 'divide and conquer', 'midpoint', 'two pointers', 'O(1) space'],
    idealAnswerOutline: 'Binary search operates on sorted collections by repeatedly dividing the search space in half. Precondition: elements must be sorted or have monotonic search space. Time complexity: O(log n), Space complexity: O(1) iterative or O(log n) recursive.'
  },
  {
    id: 'q-dsa-2',
    category: 'DSA',
    topic: 'Trees & Graph Traversal',
    difficulty: 'Medium',
    question: 'Explain the difference between Breadth-First Search (BFS) and Depth-First Search (DFS). When would you choose one over the other?',
    expectedKeywords: ['queue', 'stack', 'recursion', 'level order', 'shortest path', 'unweighted graph', 'backtracking', 'cycle detection'],
    idealAnswerOutline: 'BFS explores neighbor by neighbor using a Queue, making it ideal for shortest path in unweighted graphs. DFS explores deep along each branch using a Stack/recursion, ideal for backtracking, cycle detection, and topological sorting.'
  },
  {
    id: 'q-dsa-3',
    category: 'DSA',
    topic: 'Dynamic Programming',
    difficulty: 'Hard',
    question: 'What is Dynamic Programming? How does Memoization (top-down) differ from Tabulation (bottom-up)?',
    expectedKeywords: ['optimal substructure', 'overlapping subproblems', 'memoization', 'tabulation', 'recursion', 'call stack', 'space optimization'],
    idealAnswerOutline: 'Dynamic Programming solves optimization problems by breaking them into overlapping subproblems with optimal substructure. Top-down uses recursion + cache; bottom-up builds iteratively from base cases to avoid stack overflow.'
  },
  {
    id: 'q-dsa-4',
    category: 'DSA',
    topic: 'Hashing & HashMaps',
    difficulty: 'Easy',
    question: 'How does a HashMap work internally? How are hash collisions resolved in Java or standard libraries?',
    expectedKeywords: ['hash function', 'buckets', 'collision', 'chaining', 'linked list', 'red-black tree', 'open addressing', 'load factor', 'O(1) average'],
    idealAnswerOutline: 'HashMaps use a hash function to map keys to bucket indices. Collisions are handled via separate chaining (linked list / balanced tree) or open addressing (linear probing). Average time complexity is O(1) for get/put.'
  },

  // Core CS (OS, DBMS, Networks)
  {
    id: 'q-core-1',
    category: 'Core CS',
    topic: 'Operating Systems & Concurrency',
    difficulty: 'Medium',
    question: 'Explain the difference between a Process and a Thread. What is a Race Condition and how can it be prevented?',
    expectedKeywords: ['memory space', 'address space', 'shared memory', 'context switch', 'mutex', 'semaphore', 'lock', 'atomic operation'],
    idealAnswerOutline: 'A process is an executing program with independent memory address space. A thread is a lightweight execution unit sharing the parent process memory. A race condition occurs when concurrent threads access shared data without synchronization; prevented via mutexes, semaphores, or atomic locks.'
  },
  {
    id: 'q-core-2',
    category: 'Core CS',
    topic: 'DBMS & Database Architecture',
    difficulty: 'Medium',
    question: 'What are the ACID properties in database management systems? Explain why each property is critical for data integrity.',
    expectedKeywords: ['atomicity', 'consistency', 'isolation', 'durability', 'all-or-nothing', 'transactions', 'crash recovery', 'WAL'],
    idealAnswerOutline: 'Atomicity (all or nothing), Consistency (valid state transitions), Isolation (concurrent transactions do not interfere), Durability (committed changes persist despite crashes).'
  },
  {
    id: 'q-core-3',
    category: 'Core CS',
    topic: 'Computer Networks',
    difficulty: 'Easy',
    question: 'What happens when you type a URL like "https://novara.dev" into a browser and press Enter? Trace the major network steps.',
    expectedKeywords: ['DNS lookup', 'IP address', 'TCP handshake', 'SYN-ACK', 'TLS handshake', 'HTTPS encryption', 'HTTP request', 'DOM rendering'],
    idealAnswerOutline: '1. DNS resolution to find IP address. 2. TCP 3-way handshake. 3. TLS handshake for HTTPS security. 4. HTTP GET request sent. 5. Server responds with HTML/assets. 6. Browser parses and renders the DOM.'
  },

  // SQL & Data
  {
    id: 'q-sql-1',
    category: 'SQL',
    topic: 'SQL Querying & Joins',
    difficulty: 'Medium',
    question: 'Explain the difference between WHERE and HAVING clauses in SQL. In what order does SQL execute them relative to GROUP BY?',
    expectedKeywords: ['row-level filtering', 'aggregate filtering', 'group by', 'count', 'sum', 'execution order', 'pre-aggregation', 'post-aggregation'],
    idealAnswerOutline: 'WHERE filters individual rows before aggregation (GROUP BY). HAVING filters aggregated groups after GROUP BY and works with aggregate functions like COUNT, SUM, AVG.'
  },
  {
    id: 'q-sql-2',
    category: 'SQL',
    topic: 'Indexing & Performance',
    difficulty: 'Hard',
    question: 'What is a Database Index (e.g., B-Tree index)? What are the trade-offs of adding too many indexes to a table?',
    expectedKeywords: ['B-Tree', 'lookup speed', 'binary search', 'write penalty', 'insert/update overhead', 'storage cost', 'clustered vs non-clustered'],
    idealAnswerOutline: 'An index is a data structure (commonly B-Tree) that speeds up data retrieval. Trade-off: indexes accelerate SELECT queries but slow down INSERT, UPDATE, and DELETE operations due to index maintenance overhead and consume extra disk space.'
  },

  // AI / ML
  {
    id: 'q-aiml-1',
    category: 'AI / ML',
    topic: 'Machine Learning Fundamentals',
    difficulty: 'Medium',
    question: 'What is the Bias-Variance tradeoff in Machine Learning? How do Overfitting and Underfitting relate to it?',
    expectedKeywords: ['bias', 'variance', 'overfitting', 'underfitting', 'generalization', 'regularization', 'cross-validation', 'model complexity'],
    idealAnswerOutline: 'High bias causes underfitting (model is too simple). High variance causes overfitting (model memorizes noise). The goal is finding the optimal balance minimizing total test error via regularization, cross-validation, and appropriate model complexity.'
  },

  // HR & Behavioral (STAR format)
  {
    id: 'q-hr-1',
    category: 'HR & Behavioral',
    topic: 'Introduction & Career Alignment',
    difficulty: 'Easy',
    question: 'Tell me about yourself, your technical background, and what motivates you to pursue this placement role.',
    expectedKeywords: ['education', 'projects', 'problem solving', 'role motivation', 'technical skills', 'passion', 'collaboration'],
    idealAnswerOutline: 'Clear concise summary of academic/technical journey, relevant projects built, core strengths, and genuine alignment with the target role and company vision.'
  },
  {
    id: 'q-hr-2',
    category: 'HR & Behavioral',
    topic: 'Conflict & Problem Solving (STAR)',
    difficulty: 'Medium',
    question: 'Describe a challenging technical problem or team conflict you faced during a project and how you resolved it using the STAR approach.',
    expectedKeywords: ['situation', 'task', 'action', 'result', 'communication', 'tradeoff', 'ownership', 'learning outcome'],
    idealAnswerOutline: 'Structured using STAR: Situation (context), Task (goal), Action (specific actions taken, problem solved collaboratively), Result (measurable positive outcome and lessons learned).'
  }
];

/**
 * Start and configure a personalized mock interview session.
 */
export function startInterviewSession(userId, config = {}) {
  const db = loadDb();
  const user = db.users.find((u) => u.id === userId);
  if (!user) throw new Error('User not found');

  const roadmap = db.roadmaps[userId] || null;
  const history = db.interviewHistory?.[userId] || [];
  const coachData = db.coachAnalysis?.[userId] || null;

  const type = config.type || 'Technical'; // 'Technical' | 'DSA' | 'Core CS' | 'SQL' | 'AI / ML' | 'HR & Behavioral'
  const difficulty = config.difficulty || 'Medium'; // 'Easy' | 'Medium' | 'Hard' | 'Mixed'
  const count = parseInt(config.questionCount || 5);
  const timeMinutes = parseInt(config.timeMinutes || 15);

  // Filter questions matching type & user's preparation context
  let pool = INTERVIEW_QUESTION_BANK.filter((q) => {
    if (type === 'Technical') {
      return q.category !== 'HR & Behavioral';
    }
    return q.category.toLowerCase() === type.toLowerCase();
  });

  if (pool.length === 0) {
    pool = INTERVIEW_QUESTION_BANK;
  }

  // Filter by difficulty if not 'Mixed'
  if (difficulty !== 'Mixed') {
    const diffPool = pool.filter((q) => q.difficulty.toLowerCase() === difficulty.toLowerCase());
    if (diffPool.length >= 2) pool = diffPool;
  }

  // Prioritize Coach Weak Category (e.g., Core CS or DBMS)
  if (coachData?.weakestCategory) {
    const weakCategoryName = coachData.weakestCategory.toLowerCase();
    pool.sort((a, b) => {
      const aMatch = a.category.toLowerCase().includes(weakCategoryName) || a.topic.toLowerCase().includes(weakCategoryName);
      const bMatch = b.category.toLowerCase().includes(weakCategoryName) || b.topic.toLowerCase().includes(weakCategoryName);
      return bMatch - aMatch;
    });
  }

  // Pick questions: use custom AI questions if provided, otherwise filter question bank
  let selected = [];
  if (Array.isArray(config.customQuestions) && config.customQuestions.length > 0) {
    selected = config.customQuestions.slice(0, count);
  } else {
    const askedIds = new Set(history.flatMap((h) => h.questions?.map((q) => q.id) || []));
    const unasked = pool.filter((q) => !askedIds.has(q.id));
    const candidatePool = unasked.length >= count ? unasked : pool;
    selected = [...candidatePool].sort(() => 0.5 - Math.random()).slice(0, count);
  }

  const interviewId = `mock-int-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const activeSession = {
    id: interviewId,
    userId,
    type,
    difficulty,
    targetRole: user.targetRole || 'Software Engineer',
    timeLimitMinutes: timeMinutes,
    timeLimitSeconds: timeMinutes * 60,
    startTime: new Date().toISOString(),
    status: 'in_progress',
    currentQuestionIndex: 0,
    totalQuestions: selected.length,
    questions: selected.map((q, idx) => ({
      id: q.id,
      index: idx,
      category: q.category,
      topic: q.topic,
      difficulty: q.difficulty,
      question: q.question,
      expectedKeywords: q.expectedKeywords,
      idealAnswerOutline: q.idealAnswerOutline || '',
      userAnswer: '',
      skipped: false,
      evaluation: null
    }))
  };

  if (!db.activeInterviews) db.activeInterviews = {};
  db.activeInterviews[userId] = activeSession;
  saveDb(db);

  return {
    interviewId,
    type: activeSession.type,
    difficulty: activeSession.difficulty,
    targetRole: activeSession.targetRole,
    timeLimitMinutes: activeSession.timeLimitMinutes,
    totalQuestions: activeSession.totalQuestions,
    currentQuestionIndex: 0,
    currentQuestion: sanitizeQuestionForClient(activeSession.questions[0])
  };
}

/**
 * Submit an answer for the current question and evaluate using structured rubric.
 */
export function evaluateInterviewAnswerOnServer(userId, interviewId, questionIndex, answerText = '', customEvaluation = null) {
  const db = loadDb();
  const session = db.activeInterviews?.[userId];
  if (!session || session.id !== interviewId) {
    throw new Error('Active interview session not found.');
  }

  const q = session.questions[questionIndex];
  if (!q) throw new Error('Question not found in active session.');

  const trimmedAnswer = (answerText || '').trim();
  const isSkipped = trimmedAnswer.length === 0;

  let evaluation = null;

  if (isSkipped) {
    evaluation = {
      score: 0,
      correctness: 0,
      relevance: 0,
      completeness: 0,
      clarity: 0,
      technicalDepth: 0,
      isSkipped: true,
      strengths: ['Question skipped during live timed session.'],
      improvements: [`Review core concepts for ${q.topic}: ${q.expectedKeywords.slice(0, 3).join(', ')}.`],
      missingConcepts: q.expectedKeywords.slice(0, 4)
    };
  } else if (customEvaluation) {
    evaluation = customEvaluation;
  } else {
    // Evidence-based evaluation matching expected keywords & structural clarity
    const lowerAnswer = trimmedAnswer.toLowerCase();
    const matchedKeywords = q.expectedKeywords.filter((kw) => lowerAnswer.includes(kw.toLowerCase()));
    const matchRatio = matchedKeywords.length / q.expectedKeywords.length;

    // Word count & structural depth
    const wordCount = trimmedAnswer.split(/\s+/).length;
    let lengthScore = Math.min(100, Math.round((wordCount / 40) * 100));
    if (wordCount < 15) lengthScore = Math.max(30, lengthScore);

    const correctness = Math.min(100, Math.round(matchRatio * 70 + (wordCount > 25 ? 30 : 15)));
    const completeness = Math.min(100, Math.round(matchRatio * 80 + 20));
    const clarity = Math.min(100, Math.max(60, Math.round(85 - (wordCount < 15 ? 20 : 0))));
    const relevance = Math.min(100, Math.round(correctness * 0.9 + 10));
    const technicalDepth = Math.min(100, Math.round(matchRatio * 100));

    // Overall composite score
    const compositeScore = Math.min(100, Math.max(25, Math.round(
      correctness * 0.35 +
      completeness * 0.25 +
      clarity * 0.20 +
      technicalDepth * 0.20
    )));

    // Generate evidence-based strengths
    const strengths = [];
    if (matchedKeywords.length >= 2) {
      strengths.push(`Accurately addressed key technical terminology (${matchedKeywords.slice(0, 3).join(', ')}).`);
    } else if (wordCount >= 25) {
      strengths.push('Provided a structured explanation with good conceptual framing.');
    } else {
      strengths.push('Attempted direct conceptual answer.');
    }

    if (q.category === 'HR & Behavioral') {
      strengths.push('Professional communication with clear role alignment.');
    }

    // Generate actionable improvement points
    const missingKeywords = q.expectedKeywords.filter((kw) => !lowerAnswer.includes(kw.toLowerCase()));
    const improvements = [];
    if (missingKeywords.length > 0) {
      improvements.push(`Expand on ${missingKeywords.slice(0, 2).join(' and ')} to provide greater technical depth.`);
    }
    if (wordCount < 30) {
      improvements.push('Consider elaborating with concrete real-world use cases or trade-offs.');
    }
    if (q.category === 'DSA' && !lowerAnswer.includes('o(') && !lowerAnswer.includes('complexity') && !lowerAnswer.includes('time')) {
      improvements.push('Explicitly mention time and space complexity (e.g. O(log n), O(1)).');
    }

    evaluation = {
      score: compositeScore,
      correctness,
      relevance,
      completeness,
      clarity,
      technicalDepth,
      isSkipped: false,
      strengths,
      improvements,
      missingConcepts: missingKeywords.slice(0, 3)
    };
  }

  q.userAnswer = trimmedAnswer;
  q.skipped = isSkipped;
  q.evaluation = evaluation;

  saveDb(db);

  const nextIndex = questionIndex + 1;
  const isLastQuestion = nextIndex >= session.questions.length;

  return {
    evaluation,
    isLastQuestion,
    nextQuestionIndex: isLastQuestion ? null : nextIndex,
    nextQuestion: isLastQuestion ? null : sanitizeQuestionForClient(session.questions[nextIndex])
  };
}

/**
 * Complete the interview session, compute summary analytics, and persist in history.
 */
export function completeInterviewSessionOnServer(userId, interviewId) {
  const db = loadDb();
  const session = db.activeInterviews?.[userId];
  if (!session || session.id !== interviewId) {
    throw new Error('Active interview session not found.');
  }

  session.status = 'completed';
  session.completedAt = new Date().toISOString();

  // Calculate composite metrics across questions
  const evaluatedQuestions = session.questions.filter((q) => q.evaluation);
  const totalScore = evaluatedQuestions.reduce((sum, q) => sum + (q.evaluation?.score || 0), 0);
  const overallScore = evaluatedQuestions.length > 0 ? Math.round(totalScore / evaluatedQuestions.length) : 0;

  const correctnessAvg = Math.round(evaluatedQuestions.reduce((sum, q) => sum + (q.evaluation?.correctness || 0), 0) / (evaluatedQuestions.length || 1));
  const completenessAvg = Math.round(evaluatedQuestions.reduce((sum, q) => sum + (q.evaluation?.completeness || 0), 0) / (evaluatedQuestions.length || 1));
  const clarityAvg = Math.round(evaluatedQuestions.reduce((sum, q) => sum + (q.evaluation?.clarity || 0), 0) / (evaluatedQuestions.length || 1));
  const technicalDepthAvg = Math.round(evaluatedQuestions.reduce((sum, q) => sum + (q.evaluation?.technicalDepth || 0), 0) / (evaluatedQuestions.length || 1));

  // Determine strongest and weakest topics
  const sortedQuestions = [...evaluatedQuestions].sort((a, b) => (b.evaluation?.score || 0) - (a.evaluation?.score || 0));
  const strongestTopic = sortedQuestions[0]?.topic || 'Technical Fundamentals';
  const weakestTopic = sortedQuestions[sortedQuestions.length - 1]?.topic || 'Complexity Analysis';

  const completedReport = {
    id: session.id,
    userId,
    type: session.type,
    difficulty: session.difficulty,
    targetRole: session.targetRole,
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    completedAt: session.completedAt,
    overallScore,
    metrics: {
      technical: technicalDepthAvg,
      communication: clarityAvg,
      correctness: correctnessAvg,
      completeness: completenessAvg
    },
    strongestTopic,
    weakestTopic,
    questionsCount: session.questions.length,
    questions: session.questions.map((q) => ({
      id: q.id,
      category: q.category,
      topic: q.topic,
      difficulty: q.difficulty,
      question: q.question,
      userAnswer: q.userAnswer,
      score: q.evaluation?.score || 0,
      evaluation: q.evaluation
    }))
  };

  // Persist to user's interview history
  if (!db.interviewHistory) db.interviewHistory = {};
  if (!db.interviewHistory[userId]) db.interviewHistory[userId] = [];
  db.interviewHistory[userId].unshift(completedReport);

  // Clean active session
  delete db.activeInterviews[userId];

  // Proactive notification for completed interview
  if (!db.notifications[userId]) db.notifications[userId] = [];
  db.notifications[userId].unshift({
    id: `notif-${Date.now()}-mock-done`,
    dedupKey: `interview-completed-${Date.now()}`,
    userId,
    type: 'SYSTEM',
    icon: '🎯',
    title: 'Mock Interview Complete 🎯',
    message: `${session.type} Mock Interview finished with a score of ${overallScore}/100. Strongest: ${strongestTopic}.`,
    time: 'Just now',
    createdAt: new Date().toISOString(),
    unread: true,
    actionRoute: 'coach'
  });

  saveDb(db);

  return completedReport;
}

/**
 * Returns user's interview history, aggregate scores, and performance trends.
 */
export function getInterviewHistoryOnServer(userId) {
  const db = loadDb();
  const history = db.interviewHistory?.[userId] || [];

  const completedCount = history.length;
  const avgScore = completedCount > 0
    ? Math.round(history.reduce((sum, h) => sum + h.overallScore, 0) / completedCount)
    : 0;

  const bestScore = completedCount > 0
    ? Math.max(...history.map((h) => h.overallScore))
    : 0;

  const latestScore = completedCount > 0 ? history[0].overallScore : 0;
  const previousScore = completedCount > 1 ? history[1].overallScore : latestScore;
  const trendPoints = latestScore - previousScore;

  return {
    history,
    stats: {
      interviewsCompleted: completedCount,
      averageScore: avgScore,
      bestScore: bestScore,
      latestScore: latestScore,
      trendPoints: trendPoints,
      trendLabel: trendPoints > 0 ? `+${trendPoints} pts improvement` : trendPoints < 0 ? `${trendPoints} pts` : 'Stable'
    }
  };
}

function sanitizeQuestionForClient(q) {
  if (!q) return null;
  return {
    id: q.id,
    index: q.index,
    category: q.category,
    topic: q.topic,
    difficulty: q.difficulty,
    question: q.question
  };
}
