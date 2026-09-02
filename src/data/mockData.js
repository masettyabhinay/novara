// PlaceReady & NOVARA Realistic Mock Roadmaps, Daily Tasks, and Initial State

export const SAMPLE_ROADMAPS = {
  sde: {
    id: 'sde-tier1-2026',
    title: 'Top Tech SDE-1 Placement Roadmap (90-Day Sprint)',
    targetRole: 'Software Engineer',
    targetDate: '2026-11-20',
    totalEstimatedHours: 240,
    currentDay: 12,
    totalDays: 90,
    overallProgress: 42,
    extractedSkills: ['Data Structures & Algorithms', 'Operating Systems', 'DBMS & SQL', 'Computer Networks', 'Low Level Design', 'System Design Basics', 'Aptitude & Speed Math', 'STAR Method Behavioral'],
    phases: [
      {
        id: 'phase-1',
        number: '01',
        title: 'Foundation & Fast Aptitude',
        description: 'Time complexity, Bit manipulation, Speed Math, Logical Reasoning & Big-O Masterclass.',
        status: 'completed',
        progress: 100,
        topics: [
          { id: 'p1-t1', name: 'Asymptotic Analysis & Master Theorem', status: 'completed', problemsCount: 15, duration: '6h', difficulty: 'Easy' },
          { id: 'p1-t2', name: 'Bitwise Tricks & Modular Arithmetic', status: 'completed', problemsCount: 22, duration: '8h', difficulty: 'Medium' },
          { id: 'p1-t3', name: 'Quantitative Speed Math & Percentages', status: 'completed', problemsCount: 40, duration: '10h', difficulty: 'Easy' },
          { id: 'p1-t4', name: 'Logical Syllogisms & Critical Reasoning', status: 'completed', problemsCount: 30, duration: '6h', difficulty: 'Medium' }
        ]
      },
      {
        id: 'phase-2',
        number: '02',
        title: 'DSA Mastery & Problem Solving Patterns',
        description: 'Arrays, Two Pointers, Sliding Window, Monotonic Stacks, Trees, Dynamic Programming & Graphs.',
        status: 'in_progress',
        progress: 68,
        topics: [
          { id: 'p2-t1', name: 'Arrays & Prefix Sums (Kadane & Subarrays)', status: 'completed', problemsCount: 35, duration: '14h', difficulty: 'Medium' },
          { id: 'p2-t2', name: 'Sliding Window & Two Pointer Patterns', status: 'completed', problemsCount: 28, duration: '12h', difficulty: 'Medium' },
          { id: 'p2-t3', name: 'Trees, LCA & Diameter of Binary Tree', status: 'completed', problemsCount: 40, duration: '18h', difficulty: 'Hard' },
          { id: 'p2-t4', name: 'Graphs (BFS/DFS, Dijkstra, Topological Sort)', status: 'in_progress', problemsCount: 45, duration: '20h', difficulty: 'Hard' },
          { id: 'p2-t5', name: 'Dynamic Programming (Knapsack, LCS, Digit DP)', status: 'upcoming', problemsCount: 50, duration: '24h', difficulty: 'Hard' },
          { id: 'p2-t6', name: 'Trie & Disjoint Set Union (DSU)', status: 'upcoming', problemsCount: 20, duration: '10h', difficulty: 'Medium' }
        ]
      },
      {
        id: 'phase-3',
        number: '03',
        title: 'Core CS & Low Level Design',
        description: 'OS Concurrency, Memory Management, SQL Indexing, Transactions, Computer Networks, and Clean OOP.',
        status: 'upcoming',
        progress: 25,
        topics: [
          { id: 'p3-t1', name: 'OOP Fundamentals & SOLID Principles', status: 'completed', problemsCount: 12, duration: '8h', difficulty: 'Medium' },
          { id: 'p3-t2', name: 'OS Process vs Thread, Deadlocks & Virtual Memory', status: 'in_progress', problemsCount: 20, duration: '12h', difficulty: 'Medium' },
          { id: 'p3-t3', name: 'DBMS Normalization, B-Trees & SQL Window Analytics', status: 'upcoming', problemsCount: 25, duration: '14h', difficulty: 'Medium' },
          { id: 'p3-t4', name: 'TCP/IP 3-Way Handshake, DNS & HTTP/2 vs HTTP/3', status: 'upcoming', problemsCount: 15, duration: '8h', difficulty: 'Medium' }
        ]
      },
      {
        id: 'phase-4',
        number: '04',
        title: 'Interview Sprints & Live Mocks',
        description: 'System design fundamentals, Rate Limiters, URL Shortener, Live Whiteboard Practice & HR STAR stories.',
        status: 'upcoming',
        progress: 0,
        topics: [
          { id: 'p4-t1', name: 'High Level Design (Load Balancers, Caching, Sharding)', status: 'upcoming', problemsCount: 6, duration: '14h', difficulty: 'Hard' },
          { id: 'p4-t2', name: 'STAR Behavioral Scenarios & Self-Introduction', status: 'upcoming', problemsCount: 10, duration: '6h', difficulty: 'Easy' },
          { id: 'p4-t3', name: 'Live P2P Mock Coding Simulations', status: 'upcoming', problemsCount: 5, duration: '10h', difficulty: 'Hard' }
        ]
      }
    ]
  },
  datascience: {
    id: 'ds-ai-2026',
    title: 'Data Science & Machine Learning Placement Roadmap',
    targetRole: 'Data Scientist / ML Engineer',
    targetDate: '2026-12-15',
    totalEstimatedHours: 210,
    currentDay: 8,
    totalDays: 75,
    overallProgress: 35,
    extractedSkills: ['Python & Vectorization', 'Linear Algebra & Calculus', 'Advanced SQL & Data Warehousing', 'Machine Learning Models', 'Deep Learning Basics', 'A/B Testing & Product Metrics'],
    phases: [
      {
        id: 'ds-p1',
        number: '01',
        title: 'Math & Python Mastery',
        description: 'NumPy, Pandas vectorization, Matrix decompositions, Probability & Statistics.',
        status: 'completed',
        progress: 100,
        topics: [
          { id: 'ds-p1-t1', name: 'Multivariate Calculus & Gradient Descent', status: 'completed', problemsCount: 15, duration: '8h', difficulty: 'Medium' },
          { id: 'ds-p1-t2', name: 'Pandas Performance & Query Optimization', status: 'completed', problemsCount: 25, duration: '10h', difficulty: 'Medium' }
        ]
      },
      {
        id: 'ds-p2',
        number: '02',
        title: 'Classical Machine Learning',
        description: 'Regression, Trees, Ensemble XGBoost/LightGBM, Clustering and Feature Engineering.',
        status: 'in_progress',
        progress: 55,
        topics: [
          { id: 'ds-p2-t1', name: 'Ensemble Learning & Gradient Boosting', status: 'completed', problemsCount: 20, duration: '14h', difficulty: 'Hard' },
          { id: 'ds-p2-t2', name: 'Cross Validation & Regularization (L1/L2)', status: 'in_progress', problemsCount: 18, duration: '8h', difficulty: 'Medium' }
        ]
      },
      {
        id: 'ds-p3',
        number: '03',
        title: 'SQL, A/B Testing & Product Analytics',
        description: 'Window functions, Cohort analysis, Hypothesis testing, Power analysis.',
        status: 'upcoming',
        progress: 0,
        topics: [
          { id: 'ds-p3-t1', name: 'Complex SQL Window Analytics & Self Joins', status: 'upcoming', problemsCount: 35, duration: '16h', difficulty: 'Hard' },
          { id: 'ds-p3-t2', name: 'Hypothesis Testing (Z-test, T-test, Chi-square)', status: 'upcoming', problemsCount: 20, duration: '12h', difficulty: 'Medium' }
        ]
      }
    ]
  }
};

export const INITIAL_TODAY_TASKS = [
  {
    id: 'task-1',
    category: 'DSA',
    name: 'Arrays — Solve 2 problems',
    description: 'Practice two array problems from today\'s roadmap (Kadane\'s algorithm and 2-sum sorted).',
    estimatedDuration: '45 min',
    durationMinutes: 45,
    priority: 'High',
    completed: false,
    problemLinks: ['LeetCode #53 (Maximum Subarray)', 'LeetCode #167 (Two Sum II)'],
    notes: 'Focus on subarray bounds and maintaining running sum variables.',
    subtasks: [
      { id: 'st-1', text: 'Solve Maximum Subarray with Kadane O(N)', done: false },
      { id: 'st-2', text: 'Solve Two Sum II with two pointers approach', done: false }
    ]
  },
  {
    id: 'task-2',
    category: 'Aptitude',
    name: 'Percentages',
    description: '20 practice questions on percentage change, successive discounts, and base conversions.',
    estimatedDuration: '30 min',
    durationMinutes: 30,
    priority: 'Medium',
    completed: false,
    problemLinks: ['20 Speed Math Drill Set on Percentage Multipliers'],
    notes: 'Use decimal fraction multipliers (e.g., 1.15 for +15%) for rapid calculations.',
    subtasks: [
      { id: 'st-3', text: 'Complete 10 percentage change drill problems', done: false },
      { id: 'st-4', text: 'Solve 10 successive discount scenario questions', done: false }
    ]
  },
  {
    id: 'task-3',
    category: 'Core CS',
    name: 'OOP Fundamentals',
    description: 'Revise classes, objects, encapsulation, polymorphism, and inheritance hierarchies.',
    estimatedDuration: '30 min',
    durationMinutes: 30,
    priority: 'High',
    completed: false,
    problemLinks: ['Implement OOP Design for Parking Lot or Deck of Cards'],
    notes: 'Be ready to explain diamond problem in multiple inheritance and virtual functions.',
    subtasks: [
      { id: 'st-5', text: 'Write clean code demonstrating Abstract Class vs Interface', done: false },
      { id: 'st-6', text: 'Review method overloading vs method overriding', done: false }
    ]
  },
  {
    id: 'task-4',
    category: 'Coding',
    name: 'Timed coding practice',
    description: 'Solve one medium graph problem under a strict 30-minute timed environment.',
    estimatedDuration: '30 min',
    durationMinutes: 30,
    priority: 'High',
    completed: false,
    problemLinks: ['LeetCode #200 (Number of Islands)'],
    notes: 'Time yourself. Spend 5 mins analyzing, 15 mins coding, 10 mins testing edge cases.',
    subtasks: [
      { id: 'st-7', text: 'Write BFS/DFS traversal without syntax lookups', done: false }
    ]
  },
  {
    id: 'task-5',
    category: 'Communication',
    name: 'Self introduction',
    description: 'Record a 90-second crisp elevator pitch highlighting your core tech stack and projects.',
    estimatedDuration: '15 min',
    durationMinutes: 15,
    priority: 'Medium',
    completed: false,
    problemLinks: ['STAR Framework Introduction Template'],
    notes: 'Structure: Name + Tech Passion + Flagship Project + Why this role.',
    subtasks: [
      { id: 'st-8', text: 'Rehearse elevator pitch in front of mirror/camera', done: false }
    ]
  },
  {
    id: 'task-6',
    category: 'Revision',
    name: 'Review yesterday’s topic',
    description: 'Quick 20-minute recall review on Binary Search on Answer & search bounds.',
    estimatedDuration: '20 min',
    durationMinutes: 20,
    priority: 'Low',
    completed: false,
    problemLinks: ['LeetCode #875 (Koko Eating Bananas)'],
    notes: 'Verify condition check helper function feasibility logic.',
    subtasks: [
      { id: 'st-9', text: 'Dry run binary search boundary update logic', done: false }
    ]
  }
];

export const INITIAL_REVISION_QUEUE = [
  {
    id: 'rev-1',
    topic: 'Arrays & Kadane’s Algorithm',
    category: 'DSA',
    originalCompletionDate: 'Aug 28, 2026',
    revisionDueDate: 'Today',
    retentionScore: '85%',
    flashcards: [
      { q: 'What is Kadane’s algorithm optimal time and space complexity?', a: 'Time: O(N), Space: O(1). We maintain current_sum = max(num, current_sum + num) and max_sum = max(max_sum, current_sum).' },
      { q: 'How do you handle all-negative arrays in Kadane’s algorithm?', a: 'Initialize max_sum to the first element (or negative infinity) instead of 0, so the maximum single negative number is returned.' }
    ]
  },
  {
    id: 'rev-2',
    topic: 'OOP Basics & Virtual Functions',
    category: 'Core CS',
    originalCompletionDate: 'Aug 26, 2026',
    revisionDueDate: 'Today',
    retentionScore: '78%',
    flashcards: [
      { q: 'What is runtime polymorphism and how is it implemented?', a: 'Runtime polymorphism (dynamic method dispatch) allows a subclass method to be called through a base class pointer/reference using virtual function tables (vtable).' },
      { q: 'Why do we make base class destructors virtual?', a: 'To ensure that when deleting a derived object via a base pointer, the derived destructor executes first, preventing resource leaks.' }
    ]
  },
  {
    id: 'rev-3',
    topic: 'SQL Joins & Window Functions',
    category: 'SQL',
    originalCompletionDate: 'Aug 24, 2026',
    revisionDueDate: 'Today',
    retentionScore: '82%',
    flashcards: [
      { q: 'What is the difference between DENSE_RANK() and RANK()?', a: 'RANK() leaves gaps in ranking when values are tied (e.g. 1, 2, 2, 4), while DENSE_RANK() does not leave gaps (e.g. 1, 2, 2, 3).' },
      { q: 'What happens in a FULL OUTER JOIN?', a: 'It returns all rows when there is a match in either left or right table, filling unmatched columns with NULLs.' }
    ]
  },
  {
    id: 'rev-4',
    topic: 'Binary Search on Answer Space',
    category: 'DSA',
    originalCompletionDate: 'Aug 20, 2026',
    revisionDueDate: 'Today',
    retentionScore: '90%',
    flashcards: [
      { q: 'What property must a problem satisfy to use Binary Search on Answer?', a: 'Monotonicity: if speed/capacity `x` is valid, all values `>= x` (or `<= x`) must also be valid.' }
    ]
  }
];

export const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'Your daily mission is ready 🎯',
    message: 'Today • 6 tasks scheduled totaling 2h 50m. Knock out your DSA session first!',
    time: '8:00 AM',
    type: 'plan',
    unread: true
  },
  {
    id: 'notif-2',
    title: 'DSA session reminder ⏰',
    message: 'Starts in 15 minutes. Practice 2 Array problems from today’s roadmap.',
    time: '10:30 AM',
    type: 'reminder',
    unread: true
  },
  {
    id: 'notif-3',
    title: 'Your streak is at risk 🔥',
    message: '2 tasks remaining to extend your momentum to Day 13 before midnight.',
    time: '6:15 PM',
    type: 'streak',
    unread: false
  },
  {
    id: 'notif-4',
    title: 'Revision due 🧠',
    message: '4 topics need revision today (Arrays, OOP Basics, SQL Joins, Binary Search).',
    time: 'Yesterday',
    type: 'revision',
    unread: false
  }
];

export const INITIAL_READINESS_METRICS = {
  overallScore: 76,
  benchmarkLabel: 'Tier-1 Tech Ready (Top 12%)',
  categories: [
    { name: 'DSA & Problem Solving', percentage: 84, color: 'terracotta', totalProblems: 245, targetProblems: 300 },
    { name: 'Core Computer Science', percentage: 72, color: 'navy', completedTopics: 18, targetTopics: 25 },
    { name: 'System Design & LLD', percentage: 60, color: 'sage', completedTopics: 6, targetTopics: 10 },
    { name: 'Aptitude & Speed Math', percentage: 88, color: 'amber', completedTopics: 14, targetTopics: 16 },
    { name: 'SQL & Database Design', percentage: 80, color: 'purple', completedTopics: 20, targetTopics: 25 },
    { name: 'Interview & Behavioral', percentage: 65, color: 'terracotta', completedStories: 7, targetStories: 10 }
  ],
  stats: {
    tasksCompleted: 148,
    studyHoursLogged: 84.5,
    problemsSolved: 312,
    daysCompleted: 34,
    currentStreak: 12,
    longestStreak: 18
  },
  weeklyStudyHours: [
    { day: 'Mon', hours: 3.5, target: 3.0 },
    { day: 'Tue', hours: 4.0, target: 3.0 },
    { day: 'Wed', hours: 2.8, target: 3.0 },
    { day: 'Thu', hours: 3.2, target: 3.0 },
    { day: 'Fri', hours: 3.8, target: 3.0 },
    { day: 'Sat', hours: 5.0, target: 4.0 },
    { day: 'Sun', hours: 2.5, target: 3.0 }
  ]
};
