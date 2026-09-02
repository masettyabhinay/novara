/**
 * Server-Side Adaptive Smart Revision Engine for NOVARA
 * Implements SM-2 inspired adaptive spaced repetition, retention score decay & update curves,
 * dynamic priority scoring, topic-grounded question generation, and cross-feature integrations.
 */

import crypto from 'crypto';
import { loadDb, saveDb } from './db.js';

// Spaced Repetition Interval Ladder (in days)
const INTERVAL_LADDER = [1, 3, 7, 14, 30];

// Built-in Grounded Topic Question Banks (Comprehensive, Validated, No Hallucinations)
const GROUNDED_QUESTION_BANKS = {
  // DSA - Arrays & Two Pointers / Kadane
  'arrays': [
    {
      id: 'q_arr_1',
      type: 'mcq',
      question: "What is the optimal time and space complexity of Kadane's algorithm for Maximum Subarray?",
      options: [
        'Time: O(N), Space: O(1)',
        'Time: O(N log N), Space: O(1)',
        'Time: O(N²), Space: O(N)',
        'Time: O(N), Space: O(N)'
      ],
      correctAnswer: 'Time: O(N), Space: O(1)',
      explanation: "Kadane's algorithm solves maximum subarray in a single pass O(N) by maintaining current running sum and max sum in O(1) auxiliary space.",
      testedSubconcept: 'Kadane Complexity'
    },
    {
      id: 'q_arr_2',
      type: 'code_output',
      question: 'What is the output of this Two Pointers traversal logic on sorted array [2, 7, 11, 15] targeting sum 9?',
      codeSnippet: 'let left = 0, right = arr.length - 1;\nwhile(left < right) {\n  let sum = arr[left] + arr[right];\n  if (sum === target) return [left, right];\n  else if (sum < target) left++;\n  else right--;\n}',
      options: ['[0, 1]', '[0, 3]', '[1, 2]', '[0, 2]'],
      correctAnswer: '[0, 1]',
      explanation: 'At left=0 (val 2) and right=3 (val 15), sum=17 > 9 so right becomes 2 (val 11). Sum=13 > 9 so right becomes 1 (val 7). At [0, 1], 2+7=9.',
      testedSubconcept: 'Two Pointer Tracing'
    },
    {
      id: 'q_arr_3',
      type: 'true_false',
      question: "In the Two Pointers technique on a sorted array, moving the 'left' pointer forward strictly increases (or keeps same) the two-element sum.",
      options: ['True', 'False'],
      correctAnswer: 'True',
      explanation: 'Because the array is sorted in ascending order, arr[left + 1] >= arr[left], meaning increasing left increases the sum.',
      testedSubconcept: 'Two Pointer Monotonicity'
    },
    {
      id: 'q_arr_4',
      type: 'concept_explain',
      question: "How must Kadane's algorithm be initialized when all numbers in the array are strictly negative (e.g. [-5, -2, -8])?",
      options: [
        'Initialize max_sum = arr[0] (or -Infinity) and current_sum = arr[0]',
        'Initialize max_sum = 0 and return 0',
        'Add all negative numbers together',
        'Sort the array first'
      ],
      correctAnswer: 'Initialize max_sum = arr[0] (or -Infinity) and current_sum = arr[0]',
      explanation: 'Initializing with 0 would return 0 for an all-negative array instead of the least negative number (the maximum single element).',
      testedSubconcept: 'All-Negative Edge Cases'
    },
    {
      id: 'q_arr_5',
      type: 'short_answer',
      question: 'Which technique is optimal for range sum queries on an immutable array in O(1) query time after O(N) preprocessing?',
      options: ['Prefix Sum Array', 'Binary Search', 'Sliding Window', 'Dynamic Programming Matrix'],
      correctAnswer: 'Prefix Sum Array',
      explanation: 'A prefix sum array prefix[i] = prefix[i-1] + arr[i] enables any range sum query (L, R) in O(1) via prefix[R] - prefix[L-1].',
      testedSubconcept: 'Prefix Sums'
    }
  ],

  // DSA - Binary Search
  'binary_search': [
    {
      id: 'q_bs_1',
      type: 'mcq',
      question: 'What is the time complexity of searching an element in a sorted array of size N using Binary Search?',
      options: ['O(log N)', 'O(N)', 'O(N log N)', 'O(1)'],
      correctAnswer: 'O(log N)',
      explanation: 'Binary Search halves the search space in each iteration, resulting in O(log₂ N) time complexity.',
      testedSubconcept: 'Binary Search Complexity'
    },
    {
      id: 'q_bs_2',
      type: 'concept_explain',
      question: 'Why do we compute mid as `low + Math.floor((high - low) / 2)` instead of `(low + high) / 2`?',
      options: [
        'To prevent integer overflow when (low + high) exceeds integer maximum limits',
        'To make the division faster on CPU registers',
        'To handle negative numbers in the array',
        'Because standard division is not supported in binary search'
      ],
      correctAnswer: 'To prevent integer overflow when (low + high) exceeds integer maximum limits',
      explanation: 'If low and high are large numbers near 2^31 - 1, low + high can overflow to negative numbers. `low + (high - low)/2` guarantees no overflow.',
      testedSubconcept: 'Integer Overflow Prevention'
    },
    {
      id: 'q_bs_3',
      type: 'true_false',
      question: 'Binary Search can only be applied to search elements in indexed arrays, never on continuous answer spaces.',
      options: ['True', 'False'],
      correctAnswer: 'False',
      explanation: 'Binary Search on Answer Space (e.g. Koko Eating Bananas, Allocate Books) searches over a monotonic range of possible answers.',
      testedSubconcept: 'Binary Search on Answer'
    },
    {
      id: 'q_bs_4',
      type: 'code_output',
      question: 'In a rotated sorted array [4, 5, 6, 7, 0, 1, 2], what condition determines if the left half [low...mid] is normally sorted?',
      codeSnippet: 'if (arr[low] <= arr[mid]) {\n  // What does this imply?\n}',
      options: [
        'The left half is sorted in normal increasing order',
        'The pivot/rotation index is strictly in the left half',
        'The array is not rotated',
        'The right half is guaranteed sorted'
      ],
      correctAnswer: 'The left half is sorted in normal increasing order',
      explanation: 'If arr[low] <= arr[mid], the subarray from low to mid contains no rotation point and is strictly sorted.',
      testedSubconcept: 'Rotated Sorted Arrays'
    },
    {
      id: 'q_bs_5',
      type: 'mcq',
      question: 'What is the required property of a predicate function `P(x)` to enable Binary Search on Answer?',
      options: [
        'Monotonicity (e.g., False for all x < target, True for all x >= target)',
        'Continuity and Differentiability',
        'The array must contain unique integers',
        'Strictly positive numbers'
      ],
      correctAnswer: 'Monotonicity (e.g., False for all x < target, True for all x >= target)',
      explanation: 'A monotonic predicate allows eliminating half of the search space with each condition evaluation.',
      testedSubconcept: 'Monotonicity Condition'
    }
  ],

  // Core CS - Operating Systems
  'operating_systems': [
    {
      id: 'q_os_1',
      type: 'mcq',
      question: 'Which of the following are the 4 Coffman conditions required for a Deadlock to occur?',
      options: [
        'Mutual Exclusion, Hold & Wait, No Preemption, Circular Wait',
        'Mutual Exclusion, Starvation, Aging, Thrashing',
        'Preemption, Context Switching, Paging, Segmentation',
        'Race Condition, Critical Section, Semaphore, Spinlock'
      ],
      correctAnswer: 'Mutual Exclusion, Hold & Wait, No Preemption, Circular Wait',
      explanation: 'A deadlock can occur if and only if all four Coffman conditions hold simultaneously.',
      testedSubconcept: 'Coffman Deadlock Conditions'
    },
    {
      id: 'q_os_2',
      type: 'concept_explain',
      question: 'What is the primary difference between a Process and a Thread in modern Operating Systems?',
      options: [
        'Processes have separate virtual address spaces; threads in the same process share code, data, and address space',
        'Processes run in kernel mode; threads run in user mode',
        'Threads cannot execute concurrently; processes execute concurrently',
        'Processes do not have a PID'
      ],
      correctAnswer: 'Processes have separate virtual address spaces; threads in the same process share code, data, and address space',
      explanation: 'A process is an isolated execution unit with its own memory space. Threads are lightweight execution units within a process sharing memory.',
      testedSubconcept: 'Process vs Thread Architecture'
    },
    {
      id: 'q_os_3',
      type: 'true_false',
      question: 'A Mutex is a binary semaphore that enforces ownership: only the thread that locked it can unlock it.',
      options: ['True', 'False'],
      correctAnswer: 'True',
      explanation: 'Mutexes have an ownership concept (locked thread must unlock), whereas counting semaphores can be signaled by any thread.',
      testedSubconcept: 'Mutex vs Semaphore'
    },
    {
      id: 'q_os_4',
      type: 'mcq',
      question: 'What is Thrashing in virtual memory management?',
      options: [
        'When the OS spends more time swapping pages in/out of disk than executing instructions',
        'When CPU temperature exceeds thermal limits',
        'When a process is forcibly killed due to out of memory (OOM)',
        'When two threads access the same memory location simultaneously'
      ],
      correctAnswer: 'When the OS spends more time swapping pages in/out of disk than executing instructions',
      explanation: 'Thrashing occurs when the active working set of pages exceeds available physical RAM, causing continuous page faults and disk I/O.',
      testedSubconcept: 'Virtual Memory & Thrashing'
    },
    {
      id: 'q_os_5',
      type: 'concept_explain',
      question: 'How does the OS prevent starvation in Priority Scheduling?',
      options: [
        'Using Aging: gradually increasing the priority of processes that wait for a long time',
        'By killing lower priority processes',
        'By disabling interrupts during execution',
        'By switching to First-Come First-Served scheduling'
      ],
      correctAnswer: 'Using Aging: gradually increasing the priority of processes that wait for a long time',
      explanation: 'Aging ensures that lower priority processes eventually gain high enough priority to be scheduled and execute.',
      testedSubconcept: 'CPU Scheduling & Aging'
    }
  ],

  // Core CS - DBMS & SQL
  'dbms': [
    {
      id: 'q_db_1',
      type: 'mcq',
      question: 'What do the ACID properties stand for in Relational Database Management Systems?',
      options: [
        'Atomicity, Consistency, Isolation, Durability',
        'Availability, Consistency, Integrity, Durability',
        'Authentication, Concurrency, Indexing, Data',
        'Aggregation, Constraints, Isolation, Deadlock'
      ],
      correctAnswer: 'Atomicity, Consistency, Isolation, Durability',
      explanation: 'ACID guarantees database transaction reliability: all-or-nothing (Atomicity), valid state (Consistency), independent execution (Isolation), and persistence (Durability).',
      testedSubconcept: 'ACID Properties'
    },
    {
      id: 'q_db_2',
      type: 'mcq',
      question: 'What is the key difference between RANK() and DENSE_RANK() in SQL window functions?',
      options: [
        'RANK() leaves gaps after ties (e.g. 1, 2, 2, 4); DENSE_RANK() does not leave gaps (e.g. 1, 2, 2, 3)',
        'DENSE_RANK() only works on unique values',
        'RANK() is an aggregate function while DENSE_RANK() is a scalar function',
        'There is no difference'
      ],
      correctAnswer: 'RANK() leaves gaps after ties (e.g. 1, 2, 2, 4); DENSE_RANK() does not leave gaps (e.g. 1, 2, 2, 3)',
      explanation: 'RANK() skips numbers following duplicates, whereas DENSE_RANK() produces consecutive rank numbers.',
      testedSubconcept: 'SQL Window Functions'
    },
    {
      id: 'q_db_3',
      type: 'true_false',
      question: 'A Clustered Index physically reorders the actual table data rows on disk, so a table can have only one clustered index.',
      options: ['True', 'False'],
      correctAnswer: 'True',
      explanation: 'Because the physical rows can only be sorted in one order on disk, a table can possess only one clustered index (usually on the primary key).',
      testedSubconcept: 'Clustered vs Non-Clustered Indexes'
    },
    {
      id: 'q_db_4',
      type: 'concept_explain',
      question: 'In MySQL and PostgreSQL, what concurrency problem does the REPEATABLE READ isolation level prevent?',
      options: [
        'Non-Repeatable Reads and Dirty Reads',
        'All Phantom Reads and Deadlocks',
        'Network timeouts',
        'Write skew in all distributed nodes'
      ],
      correctAnswer: 'Non-Repeatable Reads and Dirty Reads',
      explanation: 'REPEATABLE READ guarantees that if a transaction reads a row twice, it sees identical data values without modification by other transactions.',
      testedSubconcept: 'Transaction Isolation Levels'
    },
    {
      id: 'q_db_5',
      type: 'short_answer',
      question: 'Which SQL clause is used to filter aggregated group results produced by the GROUP BY clause?',
      options: ['HAVING', 'WHERE', 'ORDER BY', 'LIMIT'],
      correctAnswer: 'HAVING',
      explanation: 'WHERE filters rows before aggregation; HAVING filters aggregated groups (e.g. `HAVING COUNT(*) > 5`).',
      testedSubconcept: 'HAVING vs WHERE'
    }
  ],

  // System Design & OOP
  'system_design': [
    {
      id: 'q_sd_1',
      type: 'mcq',
      question: 'What is the difference between Horizontal and Vertical scaling?',
      options: [
        'Horizontal adds more machines/nodes; Vertical upgrades CPU/RAM on an existing machine',
        'Horizontal upgrades CPU/RAM; Vertical adds more machines',
        'Horizontal is only for databases; Vertical is only for web servers',
        'Horizontal requires no load balancer'
      ],
      correctAnswer: 'Horizontal adds more machines/nodes; Vertical upgrades CPU/RAM on an existing machine',
      explanation: 'Horizontal scaling (scale-out) distributes load across multiple servers; vertical scaling (scale-up) increases single hardware capacity.',
      testedSubconcept: 'Scaling Architectures'
    },
    {
      id: 'q_sd_2',
      type: 'concept_explain',
      question: 'In the CAP Theorem for distributed systems, what does the theorem assert during a Network Partition (P)?',
      options: [
        'The system must choose between Consistency (C) and Availability (A)',
        'The system guarantees both Consistency and Availability simultaneously',
        'The system must shut down immediately',
        'Partition tolerance can be disabled via software config'
      ],
      correctAnswer: 'The system must choose between Consistency (C) and Availability (A)',
      explanation: 'Network partitions are inevitable in distributed systems. When a partition occurs, the system must either return consistent data (CP) or remain available (AP).',
      testedSubconcept: 'CAP Theorem'
    },
    {
      id: 'q_sd_3',
      type: 'true_false',
      question: 'Consistent Hashing minimizes the number of keys remapped when nodes are added or removed from a cache cluster.',
      options: ['True', 'False'],
      correctAnswer: 'True',
      explanation: 'Consistent Hashing places nodes and keys on a virtual ring, remapping only K/N keys on node changes rather than all keys.',
      testedSubconcept: 'Consistent Hashing'
    },
    {
      id: 'q_sd_4',
      type: 'mcq',
      question: 'What caching strategy writes data simultaneously to both the cache and the backing database before returning success?',
      options: ['Write-Through Cache', 'Write-Back (Write-Behind) Cache', 'Cache-Aside (Lazy Loading)', 'Read-Through Cache'],
      correctAnswer: 'Write-Through Cache',
      explanation: 'Write-through cache updates cache and DB synchronously, guaranteeing high data consistency at the cost of higher write latency.',
      testedSubconcept: 'Caching Strategies'
    },
    {
      id: 'q_sd_5',
      type: 'short_answer',
      question: 'Which design pattern restricts the instantiation of a class to one single global instance?',
      options: ['Singleton Pattern', 'Factory Pattern', 'Observer Pattern', 'Strategy Pattern'],
      correctAnswer: 'Singleton Pattern',
      explanation: 'The Singleton pattern ensures a class has only one instance and provides a global point of access to it.',
      testedSubconcept: 'Design Patterns'
    }
  ]
};

// Fallback topic matcher
function matchQuestionBank(topicName = '', category = '') {
  const norm = `${topicName} ${category}`.toLowerCase();
  if (norm.includes('binary search') || norm.includes('searching')) return GROUNDED_QUESTION_BANKS['binary_search'];
  if (norm.includes('array') || norm.includes('sliding') || norm.includes('two pointer') || norm.includes('kadane')) return GROUNDED_QUESTION_BANKS['arrays'];
  if (norm.includes('os') || norm.includes('operating') || norm.includes('concurrency') || norm.includes('deadlock') || norm.includes('process')) return GROUNDED_QUESTION_BANKS['operating_systems'];
  if (norm.includes('sql') || norm.includes('dbms') || norm.includes('database') || norm.includes('transaction')) return GROUNDED_QUESTION_BANKS['dbms'];
  if (norm.includes('system design') || norm.includes('oop') || norm.includes('design') || norm.includes('lld') || norm.includes('hashing')) return GROUNDED_QUESTION_BANKS['system_design'];
  return GROUNDED_QUESTION_BANKS['arrays'];
}

/**
 * Calculates dynamic priority score for a revision item.
 * Higher score = higher priority.
 */
export function calculateRevisionPriority(item, userInterviews = [], coachAnalysis = null) {
  let priority = 0;
  const reasons = [];

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // 1. Overdue days weight
  if (item.scheduledDate) {
    const schedTime = new Date(item.scheduledDate).getTime();
    const nowTime = new Date(todayStr).getTime();
    const diffDays = Math.floor((nowTime - schedTime) / (1000 * 60 * 60 * 24));
    if (diffDays > 0) {
      priority += Math.min(60, diffDays * 20);
      reasons.push(`Overdue by ${diffDays} day${diffDays > 1 ? 's' : ''}`);
    } else if (diffDays === 0) {
      priority += 30;
      reasons.push('Due today for spaced recall');
    }
  }

  // 2. Retention score weight (Low retention <60% needs urgent revision)
  const retention = item.retentionScore || 70;
  if (retention < 50) {
    priority += 35;
    reasons.push('Retention estimate is critically low (<50%)');
  } else if (retention < 65) {
    priority += 20;
    reasons.push('Retention estimate below benchmark (65%)');
  }

  // 3. Mock interview weakness integration
  const isInterviewWeakness = (userInterviews || []).some(
    (iv) => Array.isArray(iv.weakAreas) && iv.weakAreas.some((wa) => wa.toLowerCase().includes(item.topic.toLowerCase()) || item.topic.toLowerCase().includes(wa.toLowerCase()))
  ) || item.mockInterviewWeakness;

  if (isInterviewWeakness) {
    priority += 25;
    reasons.push('Identified as weak area in recent mock interview');
  }

  // 4. Coach weakest category integration
  if (coachAnalysis && coachAnalysis.weakestCategory && coachAnalysis.weakestCategory.toLowerCase().includes(item.category.toLowerCase())) {
    priority += 15;
    reasons.push(`Targeted by Placement Coach for ${item.category} boost`);
  }

  // 5. Difficulty weighting
  if (item.difficulty === 'Hard') priority += 10;
  else if (item.difficulty === 'Medium') priority += 5;

  return {
    priorityScore: priority,
    priorityReason: reasons.length > 0 ? reasons[0] : 'Scheduled active recall review'
  };
}

/**
 * Ensures user's revision queue is hydrated with real completed roadmap topics.
 */
export function syncRoadmapTopicsToRevisionQueue(userId) {
  const db = loadDb();
  if (!db.revisions) db.revisions = {};
  if (!db.revisions[userId]) db.revisions[userId] = [];

  const userRevisions = db.revisions[userId];
  const existingTopicNames = new Set(userRevisions.map((r) => (r.topic || '').toLowerCase()));

  const roadmap = db.roadmaps && db.roadmaps[userId];
  const userInterviews = (db.interviews && db.interviews[userId]) || [];

  if (roadmap && Array.isArray(roadmap.phases)) {
    const todayStr = new Date().toISOString().split('T')[0];

    roadmap.phases.forEach((phase) => {
      (phase.topics || []).forEach((topic) => {
        if (topic.status === 'completed' && !existingTopicNames.has(topic.name.toLowerCase())) {
          const newRev = {
            id: `rev_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
            userId,
            topicId: topic.id || `topic_${Date.now()}`,
            topic: topic.name,
            category: phase.title?.includes('DSA') ? 'DSA' : phase.title?.includes('Core') ? 'Core CS' : phase.title?.includes('SQL') ? 'SQL' : 'DSA',
            difficulty: topic.difficulty || 'Medium',
            originalCompletionDate: todayStr,
            scheduledDate: todayStr,
            revisionDueDate: 'Today',
            retentionScore: 68,
            previousScore: null,
            intervalLevel: 1,
            intervalDays: 1,
            status: 'due',
            lastRevisedAt: null,
            totalAttempts: 0,
            history: [],
            weakSubtopics: [],
            mockInterviewWeakness: false
          };

          userRevisions.push(newRev);
          existingTopicNames.add(topic.name.toLowerCase());
        }
      });
    });
  }

  // Update dynamic priority and due dates for all revisions
  const todayDate = new Date();
  const todayStr = todayDate.toISOString().split('T')[0];

  userRevisions.forEach((rev) => {
    // Normalize retentionScore to number
    if (typeof rev.retentionScore === 'string') {
      rev.retentionScore = parseInt(rev.retentionScore, 10) || 70;
    }

    if (!rev.scheduledDate) {
      rev.scheduledDate = todayStr;
    }

    const schedDate = new Date(rev.scheduledDate);
    const diffDays = Math.floor((new Date(todayStr) - schedDate) / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      rev.revisionDueDate = `Overdue (${diffDays}d)`;
      rev.status = 'due';
    } else if (diffDays === 0) {
      rev.revisionDueDate = 'Today';
      rev.status = 'due';
    } else if (diffDays === 1) {
      rev.revisionDueDate = 'Tomorrow';
      rev.status = 'upcoming';
    } else {
      rev.revisionDueDate = `In ${Math.abs(diffDays)} days`;
      rev.status = 'upcoming';
    }

    const priorityInfo = calculateRevisionPriority(rev, userInterviews);
    rev.priorityScore = priorityInfo.priorityScore;
    rev.priorityReason = priorityInfo.priorityReason;
  });

  // Sort queue by priorityScore descending
  userRevisions.sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));

  saveDb(db);
  return userRevisions;
}

/**
 * Returns today's active revisions and dashboard metrics.
 */
export function getRevisionsForUser(userId) {
  const revisions = syncRoadmapTopicsToRevisionQueue(userId);

  const dueToday = revisions.filter((r) => r.revisionDueDate === 'Today');
  const overdue = revisions.filter((r) => (r.revisionDueDate || '').startsWith('Overdue'));
  const strong = revisions.filter((r) => (r.retentionScore || 0) >= 80);
  const needsReview = revisions.filter((r) => (r.retentionScore || 0) < 65 || (r.revisionDueDate || '').startsWith('Overdue'));

  return {
    revisions,
    metrics: {
      dueTodayCount: dueToday.length,
      overdueCount: overdue.length,
      strongCount: strong.length,
      needsReviewCount: needsReview.length,
      averageRetention: revisions.length > 0 
        ? Math.round(revisions.reduce((acc, r) => acc + (r.retentionScore || 70), 0) / revisions.length) 
        : 85
    }
  };
}

/**
 * Generates verified, topic-grounded questions for a revision session.
 */
export function generateRevisionQuestions(topicName, category, difficulty = 'Medium') {
  const bank = matchQuestionBank(topicName, category);
  
  // Clone questions with fresh IDs
  return bank.map((q, idx) => ({
    id: `q_${Date.now()}_${idx}`,
    type: q.type,
    question: q.question,
    codeSnippet: q.codeSnippet || null,
    options: [...q.options],
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
    testedSubconcept: q.testedSubconcept
  }));
}

/**
 * Evaluates and completes a revision attempt, calculates SM-2 spaced interval advancement,
 * and updates retention estimates.
 */
export function submitRevisionAttempt(userId, { revisionId, answers = [], durationMinutes = 15 }) {
  const db = loadDb();
  if (!db.revisions || !db.revisions[userId]) {
    throw new Error('Revision records not found.');
  }

  const rev = db.revisions[userId].find((r) => r.id === revisionId);
  if (!rev) {
    throw new Error('Revision item not found.');
  }

  // Calculate Score
  let correctCount = 0;
  const totalQuestions = Math.max(1, answers.length);

  answers.forEach((ans) => {
    if (ans.isCorrect || ans.selectedAnswer === ans.correctAnswer) {
      correctCount += 1;
    }
  });

  const scorePercent = Math.round((correctCount / totalQuestions) * 100);
  const currentRetention = rev.retentionScore || 65;
  const currentLevel = rev.intervalLevel || 1;

  let newLevel = currentLevel;
  let newRetention = currentRetention;
  let performanceGrade = 'good';

  // Adaptive SM-2 Interval Calculation
  if (scorePercent >= 80) {
    // Strong Recall: Advance Interval Ladder
    newLevel = Math.min(5, currentLevel + 1);
    const boost = Math.round(10 + (scorePercent - 80) * 0.2);
    newRetention = Math.min(98, currentRetention + boost);
    performanceGrade = 'strong';
  } else if (scorePercent >= 60) {
    // Satisfactory Recall: Maintain or advance 1 level
    newLevel = Math.min(5, currentLevel);
    newRetention = Math.min(95, currentRetention + 5);
    performanceGrade = 'good';
  } else {
    // Weak Recall (<60%): Reset Interval to Level 1 (1 day)
    newLevel = 1;
    newRetention = Math.max(35, currentRetention - 15);
    performanceGrade = 'weak';
  }

  const nextIntervalDays = INTERVAL_LADDER[newLevel - 1] || 3;
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + nextIntervalDays);
  const nextDateStr = nextDate.toISOString().split('T')[0];

  const nowIso = new Date().toISOString();
  const attemptRecord = {
    attemptId: `att_${Date.now()}`,
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    score: correctCount,
    totalQuestions: totalQuestions,
    scorePercent,
    retentionBefore: currentRetention,
    retentionAfter: newRetention,
    durationMinutes: durationMinutes || 12,
    performanceGrade
  };

  if (!Array.isArray(rev.history)) rev.history = [];
  rev.history.unshift(attemptRecord);

  rev.previousScore = currentRetention;
  rev.retentionScore = newRetention;
  rev.intervalLevel = newLevel;
  rev.intervalDays = nextIntervalDays;
  rev.scheduledDate = nextDateStr;
  rev.revisionDueDate = nextIntervalDays === 1 ? 'Tomorrow' : `In ${nextIntervalDays} days`;
  rev.status = 'completed';
  rev.lastRevisedAt = nowIso;
  rev.totalAttempts = (rev.totalAttempts || 0) + 1;
  rev.mockInterviewWeakness = false; // Resolved in revision

  // Update Focus study minutes if focus session is linked
  if (db.focusSessions && db.focusSessions[userId]) {
    db.focusSessions[userId].push({
      sessionId: `focus_rev_${Date.now()}`,
      userId,
      taskId: rev.id,
      taskName: `Revision: ${rev.topic}`,
      category: rev.category,
      startedAt: new Date(Date.now() - (durationMinutes || 12) * 60000).toISOString(),
      endedAt: nowIso,
      plannedMinutes: durationMinutes || 15,
      actualMinutes: durationMinutes || 12,
      status: 'completed',
      notes: `Adaptive revision completed with ${scorePercent}% score.`
    });
  }

  saveDb(db);

  return {
    revision: rev,
    attempt: attemptRecord,
    scorePercent,
    correctCount,
    totalQuestions,
    retentionBefore: currentRetention,
    retentionAfter: newRetention,
    nextIntervalDays,
    nextRevisionDate: nextDateStr,
    strongFeedback: performanceGrade === 'strong' ? '✓ Core algorithm & complexity mastered' : '✓ Good baseline recall on core properties',
    improveFeedback: performanceGrade === 'weak' ? '⚠ Reset to 1-day interval: review edge cases & boundary conditions' : '⚠ Practice rapid dry runs under 2 minutes'
  };
}

/**
 * Reschedules a revision item to a specified future date.
 */
export function rescheduleRevision(userId, { revisionId, daysAhead = 1, targetDate = null }) {
  const db = loadDb();
  if (!db.revisions || !db.revisions[userId]) {
    throw new Error('Revision records not found.');
  }

  const rev = db.revisions[userId].find((r) => r.id === revisionId);
  if (!rev) {
    throw new Error('Revision item not found.');
  }

  let finalDateStr = targetDate;
  if (!finalDateStr) {
    const d = new Date();
    d.setDate(d.getDate() + (daysAhead || 1));
    finalDateStr = d.toISOString().split('T')[0];
  }

  rev.scheduledDate = finalDateStr;
  rev.revisionDueDate = daysAhead === 1 ? 'Tomorrow' : `In ${daysAhead} days`;
  rev.status = 'rescheduled';

  saveDb(db);
  return rev;
}
