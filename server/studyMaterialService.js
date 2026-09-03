/**
 * Server-Side Task Study Material Service for NOVARA
 * Deep Study Mode: Provides rich, personalized, domain-grounded study guides,
 * analogies, definitions, formulas, concept mechanisms, visual diagrams,
 * code implementations, practice challenges, and self-check questions.
 */

import { classifyTaskDomain, normalizeText } from './revisionService.js';

// Server-side in-memory cache for generated study materials
const STUDY_MATERIAL_CACHE = new Map();

/**
 * Verified Grounded Study Material Fallbacks for all core curriculum domains.
 * Includes optional Deep Study sections (analogies, definitions, formulas, practice problems, self-checks).
 */
export const GROUNDED_STUDY_MATERIALS = {
  // DSA - Arrays & Strings
  'arrays': {
    title: 'Arrays and String Manipulation Practice',
    subtitle: 'Two Pointers, Sliding Window, Prefix Sums & Contiguous Subarrays',
    overview: 'Arrays and strings form the foundation of technical coding interviews. Problems typically test in-place modifications, contiguous subarray sums, sliding window optimizations, and two-pointer traversals to achieve optimal O(N) linear time and O(1) auxiliary space.',
    learningObjectives: [
      'Master two-pointer traversals on monotonic and sorted collections',
      'Apply dynamic and fixed sliding window techniques for contiguous subarray constraints',
      "Implement Kadane's algorithm for linear-time maximum subarray calculations",
      'Utilize prefix sum precomputations for O(1) range sum queries'
    ],
    realWorldAnalogy: {
      analogy: 'Imagine two librarians walking towards each other from opposite ends of a long alphabetical bookshelf to find two books whose total catalog price matches a budget.',
      explanation: 'Because books are sorted by price, if their combined price is too high, the right librarian steps left to a cheaper book without checking every shelf pair.',
      mappedConcept: 'Two Pointers Technique'
    },
    definitions: [
      { term: 'Contiguous Subarray', definition: 'A slice of an array that occupies unbroken, adjacent memory indices without skips.', context: 'Arrays & Strings' },
      { term: 'Monotonicity', definition: 'A property where a sequence or predicate strictly preserves order (always non-decreasing or non-increasing).', context: 'Algorithm Optimization' }
    ],
    formulas: [
      { name: 'Prefix Range Sum', formula: 'Sum(L, R) = prefix[R] - prefix[L - 1]', variables: 'prefix[i] = prefix[i - 1] + arr[i] (prefix[-1] = 0)', intuition: 'Transforms repeated O(N) range summation into instant O(1) subtraction.' },
      { name: 'Sliding Window Invariant', formula: 'WindowSize = right - left + 1', variables: 'left <= right', intuition: 'Computes current contiguous slice length in constant time.' }
    ],
    concepts: [
      {
        name: 'Two Pointers Technique',
        explanation: 'Maintains two pointer variables (e.g., left and right) moving inward from opposite ends or in the same direction over a sequence.',
        intuition: 'By moving pointers based on comparison logic, each step eliminates candidate pairs without checking all combinations, avoiding O(N²) nested loops.',
        example: 'Finding two numbers that sum to target in a sorted array.'
      },
      {
        name: 'Sliding Window',
        explanation: 'Maintains a dynamic or fixed subarray range [left...right] while tracking window state (sum, character frequencies) in a single linear pass.',
        intuition: 'Instead of recomputing the state from scratch for every subarray, update state incrementally by adding nums[right] and removing nums[left].',
        example: 'Longest Substring Without Repeating Characters or Maximum Sum Subarray of size K.'
      },
      {
        name: "Kadane's Algorithm",
        explanation: 'Calculates the maximum contiguous subarray sum in O(N) time by making a local greedy decision at each index.',
        intuition: 'At index i, the maximum sum ending at i is either the element nums[i] itself or nums[i] plus the best subarray ending at i-1.',
        example: 'For [-2, 1, -3, 4, -1, 2, 1, -5, 4], Kadane returns 6 for [4, -1, 2, 1].'
      },
      {
        name: 'Prefix Sum Array',
        explanation: 'Precomputes cumulative sums prefix[i] = prefix[i-1] + arr[i] to answer any range sum query (L, R) in O(1) time via prefix[R] - prefix[L-1].',
        intuition: 'Transforms repeated range summation queries into instant subtraction of two precalculated boundary values.',
        example: 'Equilibrium index detection or continuous subarray sum divisible by K.'
      }
    ],
    diagrams: [
      {
        id: 'diag_two_pointers',
        conceptName: 'Two Pointers Technique',
        title: 'Two Pointers on Sorted Array',
        purpose: 'Visualize how inward pointer movements eliminate candidate pairs in O(N)',
        type: 'algorithm',
        description: 'Left pointer at index 0 and Right pointer at index 3. Sum is compared against target value.',
        elements: [
          { id: 'el_0', label: '2', sublabel: 'idx 0 (L)', type: 'array', highlight: true },
          { id: 'el_1', label: '7', sublabel: 'idx 1', type: 'array' },
          { id: 'el_2', label: '11', sublabel: 'idx 2', type: 'array' },
          { id: 'el_3', label: '15', sublabel: 'idx 3 (R)', type: 'array', highlight: true }
        ],
        connections: [
          { from: 'el_0', to: 'el_3', label: 'sum = 17 (target = 13)' }
        ],
        steps: [
          {
            step: 1,
            title: 'Initial State: Calculate Boundary Sum',
            description: 'Left at arr[0]=2, Right at arr[3]=15. Sum is 2 + 15 = 17. Since 17 > target (13), decrement Right.',
            activeElementIds: ['el_0', 'el_3'],
            pointerState: { left: 'idx 0 (val 2)', right: 'idx 3 (val 15)' }
          },
          {
            step: 2,
            title: 'Step 2: Decrement Right Pointer',
            description: 'Left at arr[0]=2, Right at arr[2]=11. Sum is 2 + 11 = 13. Target found in O(N)!',
            activeElementIds: ['el_0', 'el_2'],
            pointerState: { left: 'idx 0 (val 2)', right: 'idx 2 (val 11)' }
          }
        ]
      }
    ],
    patterns: [
      {
        name: 'Opposite-End Two Pointers',
        whenToUse: 'Sorted array or palindrome verification where we compare boundaries moving towards center.',
        howItWorks: 'Initialize left=0, right=n-1. If condition < target, advance left; else decrement right.',
        example: 'Two Sum II (Sorted Input), 3Sum, Valid Palindrome'
      },
      {
        name: 'Dynamic Sliding Window (Expand Right, Shrink Left)',
        whenToUse: 'Finding the longest or shortest contiguous subarray satisfying a condition.',
        howItWorks: 'Expand window by advancing right pointer; when condition is violated, shrink from left until valid.',
        example: 'Minimum Size Subarray Sum, Fruit Into Baskets'
      }
    ],
    stepByStep: [
      '1. Clarify constraints: Check array size N, integer bounds (overflow risk), and if negative numbers are allowed.',
      '2. Identify if sorting helps: If original indices do not matter, sorting in O(N log N) enables two pointers or binary search.',
      '3. Choose optimal pattern: Contiguous range sum → Prefix Sum / Sliding Window; Pair comparison → Two Pointers; Subarray extrema → Kadane.',
      '4. Initialize pointers & edge cases: Handle empty array, single element, all-negative values, and boundary pointers.',
      '5. Write traversal logic and trace with small sample input (e.g. [1, 2, 3] and [-1, -2]).',
      '6. State time complexity (O(N) vs O(N log N)) and space complexity (O(1) in-place vs O(N) auxiliary).'
    ],
    codeExamples: [
      {
        title: "Kadane's Maximum Subarray Implementation",
        language: 'javascript',
        code: `function maxSubArray(nums) {
  let currentSum = nums[0];
  let maxSum = nums[0];
  for (let i = 1; i < nums.length; i++) {
    // Either start new subarray at i or extend previous
    currentSum = Math.max(nums[i], currentSum + nums[i]);
    maxSum = Math.max(maxSum, currentSum);
  }
  return maxSum;
}`,
        explanation: 'Maintains running currentSum and global maxSum in a single linear pass.',
        complexity: {
          time: 'O(N)',
          space: 'O(1)'
        }
      },
      {
        title: 'Two Pointers Pair Sum on Sorted Array',
        language: 'javascript',
        code: `function twoSumSorted(arr, target) {
  let left = 0, right = arr.length - 1;
  while (left < right) {
    const sum = arr[left] + arr[right];
    if (sum === target) return [left, right];
    if (sum < target) left++;
    else right--;
  }
  return null;
}`,
        explanation: 'Monotonically narrows search window without extra memory allocations.',
        complexity: {
          time: 'O(N)',
          space: 'O(1)'
        }
      }
    ],
    workedExamples: [
      {
        title: 'Container With Most Water (LeetCode #11)',
        problem: 'Given an integer array height of length n, find two lines that together with the x-axis form a container holding the maximum water.',
        approach: 'Initialize left=0 and right=n-1. The area is (right - left) * min(height[left], height[right]). Move whichever pointer has the shorter height inward, because moving the taller pointer can never increase the area.',
        solution: 'Two pointers achieve optimal O(N) time and O(1) auxiliary space.'
      }
    ],
    practiceProblems: [
      {
        title: 'Two Sum II — Input Array Is Sorted',
        problem: 'Given a 1-indexed array of integers numbers that is already sorted in non-decreasing order, find two numbers such that they add up to a specific target number.',
        difficulty: 'Medium',
        skillTested: 'Opposite-End Two Pointers',
        hint: 'Use two pointers starting at index 0 and index n-1. Since array is sorted, evaluate sum vs target.',
        approach: 'If sum < target, left++; if sum > target, right--; if sum == target, return indices. O(N) time, O(1) space.'
      },
      {
        title: 'Longest Substring Without Repeating Characters',
        problem: 'Given a string s, find the length of the longest substring without duplicate characters.',
        difficulty: 'Medium',
        skillTested: 'Dynamic Sliding Window with Hash Map',
        hint: 'Use a hash map to store the most recent index of each character seen.',
        approach: 'Advance right pointer. If char is in map and index >= left, jump left pointer to map[char] + 1. Track max window length.'
      }
    ],
    selfCheckQuestions: [
      {
        question: "Why does Kadane's algorithm fail if max sum is initialized to 0 when the array contains only negative numbers?",
        answerSummary: '0 is greater than any negative number, so the algorithm will return 0 instead of the maximum single negative element (e.g. -1 in [-3, -1, -5]). Always initialize to arr[0].',
        prompt: "Can you explain why Kadane's algorithm requires initializing currentSum and maxSum to arr[0]?"
      },
      {
        question: 'When is the Sliding Window technique applicable over Two Pointers?',
        answerSummary: 'Sliding window is optimal for contiguous subarray/substring ranges with monotonic expansion/shrinkage. Two pointers from opposite ends requires sorted or monotonic order.',
        prompt: 'How do you decide between Two Pointers and Sliding Window?'
      }
    ],
    commonMistakes: [
      'Initializing max sum to 0 in Kadane algorithm when the array contains only negative numbers (must use arr[0] or -Infinity).',
      'Modifying string directly in immutable languages instead of using char arrays or StringBuilder.',
      'Off-by-one errors when expanding/shrinking sliding window boundaries (forgetting to update character frequencies).',
      'Using nested loops O(N²) when a Hash Table or Two Pointers achieves O(N).'
    ],
    interviewTips: [
      'Always state your time and space complexity upfront before writing code.',
      'Ask the interviewer if the array is sorted and if duplicate values exist.',
      'Walk through edge cases: empty array, 1 element, all negative numbers.'
    ],
    practiceGuidance: [
      'Solve LeetCode #53 (Maximum Subarray)',
      'Solve LeetCode #11 (Container With Most Water)',
      'Solve LeetCode #3 (Longest Substring Without Repeating Characters)'
    ],
    quickRecap: [
      'Two Pointers requires monotonic or sorted data; achieves O(N) time and O(1) space.',
      'Sliding Window is optimal for contiguous subarray / substring conditions.',
      'Prefix Sum enables O(1) range queries after O(N) precomputation.',
      "Kadane's algorithm solves max subarray in a single pass O(N)."
    ],
    keyTakeaways: [
      'Contiguous subarray extrema -> Kadane / Sliding Window',
      'Sorted pair matching -> Two Pointers',
      'Repeated range sums -> Prefix Sum'
    ],
    placementRelevance: 'Arrays and Strings appear in 80%+ of initial technical screening rounds (OA and Round 1). Interviewers evaluate code cleanliness, handling of edge cases (empty array, duplicates), and immediate complexity analysis.',
    domain: 'arrays'
  },

  // DSA - Linked Lists
  'linked_lists': {
    title: 'Linked List Pointer Manipulation',
    subtitle: 'Cycle Detection, In-Place Reversal, Fast & Slow Pointers & Dummy Nodes',
    overview: 'Linked Lists test precise pointer updates, memory reference management, and traversal algorithms without relying on array contiguous indexing. Common interview tasks focus on in-place reversal, cycle detection, and merging.',
    learningObjectives: [
      "Master Floyd's Cycle-Finding (Fast & Slow pointers) algorithm",
      'Implement iterative and recursive in-place linked list reversal in O(1) space',
      'Use dummy/sentinel nodes to simplify boundary edge cases',
      'Understand reference rewiring without memory leaks or lost nodes'
    ],
    realWorldAnalogy: {
      analogy: 'Think of a linked list as a treasure hunt where each clue box contains a coordinate note pointing to the location of the next clue box.',
      explanation: 'You cannot jump straight to clue #5 without reading clue #1 through #4 in order because each node only holds the reference to the next.',
      mappedConcept: 'Sequential Pointer Traversal'
    },
    definitions: [
      { term: 'Sentinel / Dummy Node', definition: 'A temporary pre-head node inserted at the start of a list to eliminate boundary special cases when mutating the head.', context: 'Linked Lists' }
    ],
    formulas: [
      { name: 'Floyd Cycle Distance Formula', formula: 'Distance(Head to Cycle Start) = Distance(Meeting Point to Cycle Start)', variables: 'k = steps in loop', intuition: 'Resetting slow to head while fast stays at meeting point guarantees they collide exactly at cycle entrance.' }
    ],
    concepts: [
      {
        name: "Floyd's Cycle-Finding Algorithm",
        explanation: 'Uses two pointers (Slow moving 1 step, Fast moving 2 steps). If a cycle exists, Fast will meet Slow in O(N) time and O(1) space.',
        intuition: 'In a circular track, a runner moving twice as fast will inevitably lap and meet the slower runner.',
        example: 'Tortoise and Hare algorithm for loop detection in singly linked list.'
      },
      {
        name: 'In-place Iterative Reversal',
        explanation: 'Maintains three pointers (prev, curr, nextNode). In each step, saves nextNode, points curr.next to prev, then advances prev and curr.',
        intuition: 'Reverses the direction of individual pointer arrows one node at a time while keeping track of where to jump next.',
        example: 'Reversing 1 -> 2 -> 3 -> null into 3 -> 2 -> 1 -> null.'
      }
    ],
    diagrams: [
      {
        id: 'diag_ll_reversal',
        conceptName: 'In-place Iterative Reversal',
        title: 'Singly Linked List In-Place Pointer Reversal',
        purpose: 'Visualizes pointer rewiring step: curr.next = prev',
        type: 'structure',
        description: 'Pointer arrows reverse one-by-one while next node reference is preserved in nextNode.',
        elements: [
          { id: 'node_1', label: '[ 1 | • ]', sublabel: 'head', type: 'node' },
          { id: 'node_2', label: '[ 2 | • ]', sublabel: 'curr', type: 'node', highlight: true },
          { id: 'node_3', label: '[ 3 | • ]', sublabel: 'next', type: 'node' }
        ],
        connections: [
          { from: 'node_1', to: 'node_2', label: 'next' },
          { from: 'node_2', to: 'node_3', label: 'next' }
        ],
        steps: []
      }
    ],
    patterns: [
      {
        name: 'Fast and Slow Pointers',
        whenToUse: 'Finding the middle node or detecting cycles.',
        howItWorks: 'Slow moves 1 step; Fast moves 2 steps.',
        example: 'Linked List Cycle, Middle of List'
      }
    ],
    stepByStep: ['1. Use dummy node', '2. Save next reference before rewiring', '3. Handle null checks'],
    codeExamples: [
      {
        title: 'Iterative Singly Linked List Reversal',
        language: 'javascript',
        code: `function reverseList(head) {
  let prev = null, curr = head;
  while (curr !== null) {
    let nextNode = curr.next;
    curr.next = prev;
    prev = curr;
    curr = nextNode;
  }
  return prev;
}`,
        explanation: 'In-place O(1) space reversal.',
        complexity: { time: 'O(N)', space: 'O(1)' }
      }
    ],
    workedExamples: [],
    practiceProblems: [
      {
        title: 'Reverse Linked List (LeetCode #206)',
        problem: 'Given the head of a singly linked list, reverse the list, and return the reversed list.',
        difficulty: 'Easy',
        skillTested: 'Three-pointer in-place rewiring',
        hint: 'Keep track of prev, curr, and nextNode pointers.',
        approach: 'Iteratively set curr.next = prev and advance.'
      }
    ],
    selfCheckQuestions: [
      {
        question: 'Why do we need a dummy node when removing the N-th node from end?',
        answerSummary: 'If the node to delete is the head node, having a dummy node ensures the target node always has a predecessor node (dummy.next = head), avoiding special branching for head deletions.',
        prompt: 'Why do dummy nodes prevent edge-case bugs in linked list mutations?'
      }
    ],
    commonMistakes: ['Losing pointer reference before saving nextNode'],
    interviewTips: ['State O(1) space when implementing in-place iterative algorithms.'],
    practiceGuidance: ['Solve LeetCode #206, #141, and #21'],
    quickRecap: ['Fast & Slow pointers find middle elements and detect cycles in O(1) space.'],
    keyTakeaways: ['Sentinel dummy node eliminates special head cases'],
    placementRelevance: 'Tested heavily at top product companies.',
    domain: 'linked_lists'
  },

  // DSA - Binary Search
  'binary_search': {
    title: 'Binary Search & Monotonic Spaces',
    subtitle: 'Divide & Conquer, Search Space Reduction & Monotonic Predicates',
    overview: 'Binary Search reduces the search space by half in each iteration, achieving O(log N) complexity. It applies not only to sorted arrays, but crucially to monotonic answer spaces.',
    learningObjectives: [
      'Implement overflow-safe boundary calculations',
      'Recognize monotonicity in discrete answer spaces',
      'Formulate boolean predicate functions `isValid(mid)`'
    ],
    realWorldAnalogy: {
      analogy: 'Like guessing a secret number between 1 and 100 where after every guess you are told "higher" or "lower".',
      explanation: 'Guessing 50 immediately eliminates 50% of all possibilities in one question.',
      mappedConcept: 'Divide and Conquer'
    },
    definitions: [
      { term: 'Monotonic Search Space', definition: 'A domain where if condition(x) is true, then condition(y) is guaranteed to be true for all y >= x (or vice versa).', context: 'Binary Search' }
    ],
    formulas: [
      { name: 'Overflow-Safe Midpoint', formula: 'mid = low + Math.floor((high - low) / 2)', variables: 'low <= mid <= high', intuition: 'Prevents 32-bit signed integer overflow caused by (low + high).' }
    ],
    concepts: [
      {
        name: 'Integer Overflow Protection',
        explanation: 'Calculating low + (high - low)/2 prevents integer overflow in typed languages.',
        intuition: 'Guarantees the intermediate sum never exceeds the high bound.',
        example: 'Handling array indices close to max int.'
      }
    ],
    diagrams: [],
    patterns: [
      {
        name: 'Binary Search on Answer Space',
        whenToUse: 'Optimization problems asking for minimum max value or maximum min value.',
        howItWorks: 'Define isValid(mid). If valid, try smaller; else try larger.',
        example: 'Koko Eating Bananas'
      }
    ],
    stepByStep: ['1. Define bounds', '2. Compute mid safely', '3. Adjust boundaries'],
    codeExamples: [
      {
        title: 'Classic Binary Search',
        language: 'javascript',
        code: `function binarySearch(arr, target) {
  let low = 0, high = arr.length - 1;
  while (low <= high) {
    const mid = low + Math.floor((high - low) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) low = mid + 1;
    else high = mid - 1;
  }
  return -1;
}`,
        explanation: 'O(log N) search.',
        complexity: { time: 'O(log N)', space: 'O(1)' }
      }
    ],
    workedExamples: [],
    practiceProblems: [
      {
        title: 'Koko Eating Bananas (LeetCode #875)',
        problem: 'Given piles of bananas and hours h, find minimum eating speed k per hour to eat all bananas within h hours.',
        difficulty: 'Medium',
        skillTested: 'Binary Search on Monotonic Answer Space',
        hint: 'The search space for speed k is [1, max(piles)]. Check if hoursNeeded(mid) <= h.',
        approach: 'Binary search over [1, max(piles)] with monotonic predicate function.'
      }
    ],
    selfCheckQuestions: [
      {
        question: 'Why does low = mid (instead of low = mid + 1) cause infinite loops in binary search?',
        answerSummary: 'When high - low = 1, mid evaluates to low. If low = mid is executed, the search space never shrinks, creating an infinite loop.',
        prompt: 'Why is updating low = mid + 1 and high = mid - 1 required?'
      }
    ],
    commonMistakes: ['Infinite loops from incorrect pointer increments'],
    interviewTips: ['Mention Binary Search applies to answer spaces, not just sorted arrays.'],
    practiceGuidance: ['Solve LeetCode #704 and #875'],
    quickRecap: ['Halves search space every iteration in O(log N) time.'],
    keyTakeaways: ['At least one half is always sorted in rotated arrays'],
    placementRelevance: 'Tier-1 company interview favorite.',
    domain: 'binary_search'
  },

  // Core CS - DBMS
  'dbms': {
    title: 'DBMS Fundamentals & ACID Properties',
    subtitle: 'Transactions, Normalization, Indexing Structures & Concurrency Control',
    overview: 'Database Management Systems ensure data reliability, concurrency control, and persistent storage in backend architectures.',
    learningObjectives: ['Master ACID properties', 'Understand B+ Tree indexing', 'Analyze transaction isolation levels'],
    realWorldAnalogy: {
      analogy: 'A Clustered Index is like the alphabetical page order of words in a printed dictionary. A Non-Clustered Index is like the index section at the back listing page numbers.',
      explanation: 'A book can only have one physical page order (Clustered), but multiple index lookup tables (Non-Clustered).',
      mappedConcept: 'Clustered vs Non-Clustered Indexing'
    },
    definitions: [
      { term: 'ACID', definition: 'Atomicity (all-or-nothing), Consistency (schema valid), Isolation (independent transactions), Durability (persisted on disk).', context: 'Transactions' }
    ],
    formulas: [],
    concepts: [
      {
        name: 'ACID Properties',
        explanation: 'Atomicity (all-or-nothing), Consistency, Isolation, Durability.',
        intuition: 'Guarantees reliable state transitions even under hardware crash.',
        example: 'Bank transfer transaction.'
      }
    ],
    diagrams: [],
    patterns: [],
    stepByStep: ['1. Review transactions', '2. Understand isolation levels', '3. Index selection'],
    codeExamples: [
      {
        title: 'ACID Transaction Block in SQL',
        language: 'sql',
        code: `BEGIN TRANSACTION;
UPDATE accounts SET balance = balance - 500 WHERE id = 'A';
UPDATE accounts SET balance = balance + 500 WHERE id = 'B';
COMMIT;`,
        explanation: 'Atomic funds transfer.',
        complexity: { time: 'O(log N) index lookup', space: 'O(1)' }
      }
    ],
    workedExamples: [],
    practiceProblems: [],
    selfCheckQuestions: [
      {
        question: 'Why can a database table have at most ONE clustered index?',
        answerSummary: 'Because a clustered index defines the physical order of data rows on disk, and physical disk blocks can only be ordered in one way.',
        prompt: 'Why is there a limit of 1 clustered index per table?'
      }
    ],
    commonMistakes: ['Over-indexing low cardinality columns'],
    interviewTips: ['Explain why B+ Trees are preferred over BSTs for disk storage.'],
    practiceGuidance: ['Review 1NF to BCNF rules'],
    quickRecap: ['ACID ensures transaction reliability and consistency.'],
    keyTakeaways: ['Tables have exactly 1 clustered index'],
    placementRelevance: 'Tested in backend and software engineering rounds.',
    domain: 'dbms'
  },

  // Core CS - SQL
  'sql': {
    title: 'SQL Joins, Aggregations & Window Functions',
    subtitle: 'Relational Queries, Common Table Expressions, Window Partitions & Grouping',
    overview: 'SQL queries enable powerful relational data extraction, aggregation, filtering, and analytical window calculations.',
    learningObjectives: ['Master INNER and LEFT joins', 'Differentiate WHERE vs HAVING', 'Write analytical window functions'],
    realWorldAnalogy: {
      analogy: 'WHERE is like a bouncer checking IDs at the club entrance (filters individuals before entry). HAVING is like checking if a party inside the VIP room has more than 5 guests (filters groups after aggregation).',
      explanation: 'WHERE filters rows before GROUP BY; HAVING filters aggregate metrics after GROUP BY.',
      mappedConcept: 'WHERE vs HAVING Filtering'
    },
    definitions: [
      { term: 'Window Function', definition: 'Performs a calculation across a set of table rows that are related to the current row without collapsing them into a single row.', context: 'SQL' }
    ],
    formulas: [
      { name: 'Cartesian Product Bound', formula: '|A ⋈ B| <= |A| * |B|', variables: '|A| = rows in table A, |B| = rows in table B', intuition: 'An unconstrained CROSS JOIN produces the full multiplicative combination of all rows.' }
    ],
    concepts: [
      {
        name: 'INNER vs LEFT JOIN',
        explanation: 'INNER JOIN returns matching keys; LEFT JOIN preserves all left records with NULLs for unmatched right records.',
        intuition: 'Determines whether unmatched left table rows are retained or discarded.',
        example: 'Employees LEFT JOIN Departments.'
      }
    ],
    diagrams: [],
    patterns: [],
    stepByStep: ['1. Base join', '2. WHERE filter', '3. GROUP BY and HAVING'],
    codeExamples: [
      {
        title: 'Nth Highest Salary using DENSE_RANK',
        language: 'sql',
        code: `WITH Ranked AS (
  SELECT employee_id, salary, DENSE_RANK() OVER (ORDER BY salary DESC) as rnk
  FROM employees
)
SELECT employee_id, salary FROM Ranked WHERE rnk = 2;`,
        explanation: 'CTE window rank query.',
        complexity: { time: 'O(N log N)', space: 'O(N)' }
      }
    ],
    workedExamples: [],
    practiceProblems: [
      {
        title: 'Customers Who Never Order (LeetCode #183)',
        problem: 'Find all customers who never placed an order.',
        difficulty: 'Easy',
        skillTested: 'LEFT JOIN with NULL filter',
        hint: 'Perform LEFT JOIN from Customers to Orders on customerId, then check WHERE Orders.id IS NULL.',
        approach: '`SELECT c.name FROM Customers c LEFT JOIN Orders o ON c.id = o.customerId WHERE o.id IS NULL;`'
      }
    ],
    selfCheckQuestions: [
      {
        question: 'Why does SELECT dept, COUNT(*) FROM emp WHERE COUNT(*) > 5 fail syntax validation?',
        answerSummary: 'WHERE executes before GROUP BY has aggregated rows, so COUNT(*) does not exist yet. You must use HAVING COUNT(*) > 5.',
        prompt: 'Why is WHERE invalid with aggregate functions?'
      }
    ],
    commonMistakes: ['Using WHERE with aggregate functions instead of HAVING'],
    interviewTips: ['Always use table aliases to keep complex queries readable.'],
    practiceGuidance: ['Practice LeetCode SQL 50'],
    quickRecap: ['INNER JOIN excludes unmatched rows; LEFT JOIN preserves left table.'],
    keyTakeaways: ['DENSE_RANK leaves no gaps on duplicate ties'],
    placementRelevance: 'Standard for backend and data engineering rounds.',
    domain: 'sql'
  },

  // Core CS - Operating Systems
  'operating_systems': {
    title: 'Operating Systems — Processes, Threads & Concurrency',
    subtitle: 'Process Scheduling, Deadlocks, Synchronization Primitives & Virtual Memory',
    overview: 'Operating Systems manage CPU execution, concurrent threads, memory allocation, and hardware synchronization.',
    learningObjectives: ['Understand process vs thread architecture', 'Identify 4 Coffman deadlock conditions', 'Differentiate Mutex and Semaphore'],
    realWorldAnalogy: {
      analogy: 'A Process is like a private house with its own kitchen, living room, and yard. Threads are family members living in that house who share the common kitchen (Heap) but have private bedrooms (Call Stacks).',
      explanation: 'Threads share memory space cheaply; processes are completely isolated.',
      mappedConcept: 'Process vs Thread Memory Architecture'
    },
    definitions: [
      { term: 'Critical Section', definition: 'A piece of code that accesses shared mutable variables and must not be concurrently executed by more than one thread.', context: 'Concurrency' }
    ],
    formulas: [],
    concepts: [
      {
        name: 'Process vs Thread',
        explanation: 'Processes have private address spaces; threads share heap, code, and data segments.',
        intuition: 'Thread creation is lightweight because memory pages are shared.',
        example: 'Browser tabs running as isolated processes.'
      }
    ],
    diagrams: [],
    patterns: [],
    stepByStep: ['1. Process states', '2. CPU scheduling', '3. Deadlock prevention'],
    codeExamples: [
      {
        title: 'Deadlock Prevention via Strict Lock Ordering',
        language: 'javascript',
        code: `function transfer(acc1, acc2, amount) {
  const first = acc1.id < acc2.id ? acc1 : acc2;
  const second = acc1.id < acc2.id ? acc2 : acc1;
  first.lock();
  second.lock();
  try {
    acc1.balance -= amount;
    acc2.balance += amount;
  } finally {
    second.unlock();
    first.unlock();
  }
}`,
        explanation: 'Global lock ordering eliminates Circular Wait.',
        complexity: { time: 'O(1)', space: 'O(1)' }
      }
    ],
    workedExamples: [],
    practiceProblems: [],
    selfCheckQuestions: [
      {
        question: 'What are the 4 Coffman conditions required for a Deadlock?',
        answerSummary: 'Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait. Breaking any one condition prevents deadlocks.',
        prompt: 'Can you name the 4 Coffman conditions?'
      }
    ],
    commonMistakes: ['Confusing Deadlock with Starvation'],
    interviewTips: ['Explain the 4 Coffman conditions and how global lock ordering breaks circular wait.'],
    practiceGuidance: ['Trace Round Robin scheduling with time quantum calculations'],
    quickRecap: ['Threads share memory space; processes have isolated virtual address spaces.'],
    keyTakeaways: ['Global lock ordering prevents circular wait'],
    placementRelevance: 'Core systems evaluation for engineering roles.',
    domain: 'operating_systems'
  },

  // Development - React
  'react': {
    title: 'React Basics & Modern Component Architecture',
    subtitle: 'Declarative State, Hooks Lifecycle, Reconciliation & Virtual DOM',
    overview: 'React builds declarative user interfaces using component composition, reactive state, and the Virtual DOM.',
    learningObjectives: ['Master unidirectional data flow', 'Implement useEffect cleanups', 'Understand Virtual DOM reconciliation'],
    realWorldAnalogy: {
      analogy: 'Unidirectional data flow is like a waterfall flowing down a multi-tiered fountain. Water (Props) cascades downwards, while sensors at lower tiers press buttons (Callbacks) to change the pump speed at the top.',
      explanation: 'Props flow down from parent to child; actions and events bubble up.',
      mappedConcept: 'Unidirectional Data Flow'
    },
    definitions: [
      { term: 'Virtual DOM', definition: 'A lightweight in-memory JavaScript representation of the actual DOM used to compute minimal batched mutations.', context: 'React' }
    ],
    formulas: [],
    concepts: [
      {
        name: 'State Immutability',
        explanation: 'Update state by creating new object copies rather than mutating existing references.',
        intuition: 'React relies on shallow object comparison (prev !== next) to trigger re-renders.',
        example: 'setItems(prev => [...prev, newItem]).'
      }
    ],
    diagrams: [],
    patterns: [],
    stepByStep: ['1. Unidirectional flow', '2. Pick hook', '3. Add cleanup function'],
    codeExamples: [
      {
        title: 'Custom Hook with Clean Effect Lifecycle',
        language: 'javascript',
        code: `import { useState, useEffect } from 'react';
export function useWindowSize() {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  useEffect(() => {
    const handleResize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return size;
}`,
        explanation: 'Guarantees cleanup on unmount.',
        complexity: { time: 'O(1)', space: 'O(1)' }
      }
    ],
    workedExamples: [],
    practiceProblems: [],
    selfCheckQuestions: [
      {
        question: 'Why does mutating state directly (e.g. state.count = 5) fail to trigger a UI re-render?',
        answerSummary: 'React performs a shallow equality check (prevObject === newObject). Mutating the object in-place keeps the reference identical, so React assumes nothing changed and skips rendering.',
        prompt: 'Why must state updates be immutable in React?'
      }
    ],
    commonMistakes: ['Mutating state directly bypassing change detection'],
    interviewTips: ['Explain how React 18 automatic batching groups setState calls into a single render.'],
    practiceGuidance: ['Build an auto-completing search input with debouncing'],
    quickRecap: ['Update state immutably to trigger Virtual DOM reconciliation.'],
    keyTakeaways: ['State flows down; Events flow up'],
    placementRelevance: 'Standard evaluation for Frontend and Full Stack positions.',
    domain: 'react'
  },

  // Core CS - Computer Networks
  'computer_networks': {
    title: 'Computer Networks — TCP/IP & Protocol Suite',
    subtitle: 'OSI Reference Model, TCP Handshake, UDP Differences & DNS Resolution',
    overview: 'Computer networking protocols govern end-to-end communication across the internet.',
    learningObjectives: ['Trace TCP 3-way handshake', 'Differentiate L2, L3, L4 addressing', 'Compare TCP vs UDP'],
    realWorldAnalogy: {
      analogy: 'A TCP 3-Way Handshake is like making a phone call: "Hello, can you hear me?" (SYN) -> "Yes, I hear you, can you hear me?" (SYN-ACK) -> "Yes, I can hear you!" (ACK).',
      explanation: 'Synchronizes communication capability and sequence numbers on both sides before sending real data.',
      mappedConcept: 'TCP Connection Handshake'
    },
    definitions: [
      { term: 'Round Trip Time (RTT)', definition: 'The duration in milliseconds it takes for a data packet to travel from sender to destination and back.', context: 'Networking' }
    ],
    formulas: [],
    concepts: [
      {
        name: 'TCP 3-Way Handshake',
        explanation: 'SYN -> SYN-ACK -> ACK establishes full-duplex reliable connection.',
        intuition: 'Synchronizes initial sequence numbers on both ends.',
        example: 'Initial connection setup before sending HTTP requests.'
      }
    ],
    diagrams: [],
    patterns: [],
    stepByStep: ['1. DNS lookup', '2. TCP handshake', '3. TLS handshake', '4. HTTP request'],
    codeExamples: [
      {
        title: 'TCP Handshake Sequence',
        language: 'text',
        code: `Client -> Server: SYN (seq=x)
Server -> Client: SYN-ACK (seq=y, ack=x+1)
Client -> Server: ACK (ack=y+1) -> ESTABLISHED`,
        explanation: 'Full duplex sequence number sync.',
        complexity: { time: '1.5 RTT', space: 'O(1)' }
      }
    ],
    workedExamples: [],
    practiceProblems: [],
    selfCheckQuestions: [
      {
        question: 'Why do TCP initial sequence numbers (ISNs) start at random numbers instead of 0?',
        answerSummary: 'Random ISNs prevent delayed packets from previous old connections from being accidentally accepted as valid data by a newly created connection with the same port numbers.',
        prompt: 'Why are TCP initial sequence numbers randomized?'
      }
    ],
    commonMistakes: ['Placing HTTP at the Transport layer instead of Application layer'],
    interviewTips: ['Always mention RTT when discussing handshake latency.'],
    practiceGuidance: ['Review the 7 OSI layers and protocol mappings'],
    quickRecap: ['TCP handshake: SYN -> SYN-ACK -> ACK.'],
    keyTakeaways: ['TCP guarantees ordering; UDP prioritizes latency'],
    placementRelevance: 'Core systems topic across tech interviews.',
    domain: 'computer_networks'
  },

  // Development - Git & GitHub
  'git_github': {
    title: 'Git Version Control & Collaboration Workflows',
    subtitle: 'Branching, Commits, Merge vs Rebase & Pull Request Standards',
    overview: 'Git provides distributed version control tracking snapshots of files over time.',
    learningObjectives: ['Master the Three-Tree Architecture', 'Understand Merge vs Rebase', 'Apply safe collaboration workflows'],
    realWorldAnalogy: {
      analogy: 'Branching is like exploring alternate timelines. Git Merge combines two timelines by creating a historic meeting point. Git Rebase rewrites history to look like everything happened in a single clean timeline.',
      explanation: 'Merge preserves exact history; Rebase linearizes commit history.',
      mappedConcept: 'Git Merge vs Rebase'
    },
    definitions: [
      { term: 'Fast-Forward Merge', definition: 'A merge where the target branch pointer simply moves forward to the tip of the feature branch without creating a merge commit.', context: 'Git' }
    ],
    formulas: [],
    concepts: [
      {
        name: 'Merge vs Rebase',
        explanation: 'Merge creates a merge commit preserving full history; Rebase reapplies commits on top of another base.',
        intuition: 'Rebase linearizes feature branch history before PR creation.',
        example: 'Rebasing local feature branch onto main.'
      }
    ],
    diagrams: [],
    patterns: [],
    stepByStep: ['1. Branch', '2. Stage', '3. Commit', '4. Rebase', '5. Push'],
    codeExamples: [
      {
        title: 'Daily Feature Branch Workflow',
        language: 'bash',
        code: `git checkout -b feature/name
git add .
git commit -m "feat: implement feature"
git fetch origin && git rebase origin/main
git push origin feature/name`,
        explanation: 'Clean linear commit workflow.',
        complexity: { time: 'O(1)', space: 'O(1)' }
      }
    ],
    workedExamples: [],
    practiceProblems: [],
    selfCheckQuestions: [
      {
        question: 'Why should you NEVER run `git rebase` on a public shared branch like `main`?',
        answerSummary: 'Rebase rewrites commit SHA-1 hashes. Rebasing a shared branch forces other collaborators to have divergent histories and causes severe merge conflicts.',
        prompt: 'Why is rebasing public branches dangerous?'
      }
    ],
    commonMistakes: ['Rebasing public shared branches'],
    interviewTips: ['Explain why git rebase should never be run on public shared branches.'],
    practiceGuidance: ['Practice interactive rebase and merge conflict resolution'],
    quickRecap: ['Merge preserves history; Rebase linearizes history.'],
    keyTakeaways: ['Never rebase shared public branches'],
    placementRelevance: 'Essential collaborative competency for software engineering roles.',
    domain: 'git_github'
  },

  // Aptitude
  'aptitude': {
    title: 'Aptitude & Quantitative Problem Solving',
    subtitle: 'Time & Work, Speed & Distance, Percentages & Probability Shortcuts',
    overview: 'Quantitative aptitude tests mathematical problem-solving speed, numerical reasoning, and logical deduction in initial company placement screening rounds.',
    learningObjectives: ['Solve Time and Work problems', 'Calculate Relative Speed', 'Apply percentage shortcuts'],
    realWorldAnalogy: {
      analogy: 'If Worker A can paint 2 rooms a day and Worker B can paint 3 rooms a day, working together they paint 5 rooms a day. Always think in terms of daily rate.',
      explanation: 'Work rates are directly additive.',
      mappedConcept: 'Additive Work Rates'
    },
    definitions: [
      { term: 'Work Rate', definition: 'The fraction of total work completed per unit of time (Rate = Total Work / Total Time).', context: 'Quantitative Aptitude' }
    ],
    formulas: [
      { name: 'Combined Work Shortcut', formula: 'CombinedDays = (A * B) / (A + B)', variables: 'A = days taken by worker 1, B = days taken by worker 2', intuition: 'Derivation of 1/T = 1/A + 1/B.' },
      { name: 'Speed Unit Conversion', formula: 'Speed(m/s) = Speed(km/h) * (5 / 18)', variables: '1000m / 3600s = 5/18', intuition: 'Instantly converts km/h to SI units m/s.' }
    ],
    concepts: [
      {
        name: 'Time and Work Equations',
        explanation: 'If Person A finishes work in X days, 1 day work = 1/X. Combined days = (A * B) / (A + B).',
        intuition: 'Work is additive in terms of rates.',
        example: 'A takes 6 days, B takes 12 days. Combined = (6 * 12) / 18 = 4 days.'
      }
    ],
    diagrams: [],
    patterns: [],
    stepByStep: ['1. Normalize units', '2. Rate equation', '3. Solve'],
    codeExamples: [
      {
        title: 'Time & Work Formula Shortcut',
        language: 'javascript',
        code: `const daysA = 6, daysB = 12;
const combinedDays = (daysA * daysB) / (daysA + daysB); // 4 days`,
        explanation: 'Combined duration.',
        complexity: { time: 'O(1)', space: 'O(1)' }
      }
    ],
    workedExamples: [],
    practiceProblems: [
      {
        title: 'Two Pipes Filling a Cistern',
        problem: 'Pipe A can fill a tank in 10 hours and Pipe B can fill it in 15 hours. How long will it take to fill the tank if both pipes are opened together?',
        difficulty: 'Easy',
        skillTested: 'Time & Work Combined Rate',
        hint: 'Use the shortcut formula (A * B) / (A + B).',
        approach: '(10 * 15) / (10 + 15) = 150 / 25 = 6 hours.'
      }
    ],
    selfCheckQuestions: [
      {
        question: 'Two trains travel towards each other at 60 km/h and 40 km/h. What is their relative speed?',
        answerSummary: 'When moving in opposite directions towards each other, relative speed is the sum: 60 + 40 = 100 km/h.',
        prompt: 'How do you calculate relative speed when moving towards each other?'
      }
    ],
    commonMistakes: ['Forgetting to multiply km/h by 5/18 when converting to m/s'],
    interviewTips: ['Use LCM of given days to assign a total integer work unit, making arithmetic fast.'],
    practiceGuidance: ['Solve 10 problems on Time & Work and Speed & Distance'],
    quickRecap: ['Combined days for two workers = (A * B) / (A + B).'],
    keyTakeaways: ['Convert km/h to m/s by multiplying with 5/18'],
    placementRelevance: 'First round screening test for campus and off-campus placements.',
    domain: 'aptitude'
  },

  // Resume & Interview Preparation (No diagrams needed - diagrams: [])
  'resume_interview': {
    title: 'Resume Preparation & STAR Interview Framework',
    subtitle: 'Behavioral Communication, Project Impact Quantification & Pitch Delivery',
    overview: 'Behavioral and technical interviews evaluate structured communication, project ownership, problem-solving methodologies, and cultural alignment.',
    learningObjectives: [
      'Structure behavioral responses using the STAR (Situation, Task, Action, Result) methodology',
      'Quantify resume achievements with concrete business and performance metrics',
      'Deliver a concise 2-minute elevator pitch highlighting technical strengths',
      'Articulate architectural trade-offs made in academic and personal projects'
    ],
    realWorldAnalogy: {
      analogy: 'A STAR story is like a 90-second movie trailer: 10s setting the stakes (Situation), 10s explaining your mission (Task), 50s showing your hero engineering moves (Action), and 20s showing the triumphant finale with numbers (Result).',
      explanation: 'Keeps the interviewer engaged while highlighting your personal engineering actions.',
      mappedConcept: 'STAR Response Structure'
    },
    definitions: [
      { term: 'STAR Methodology', definition: 'Situation (context), Task (goal), Action (your specific technical execution), Result (measurable outcome).', context: 'Behavioral Interviews' }
    ],
    formulas: [
      { name: 'Google XYZ Resume Formula', formula: 'Accomplished [X] as measured by [Y], by doing [Z]', variables: 'X = outcome, Y = metric, Z = technical action', intuition: 'Transforms vague duty descriptions into high-impact engineering accomplishments.' }
    ],
    concepts: [
      {
        name: 'STAR Response Framework',
        explanation: 'Situation -> Task -> Action -> Result.',
        intuition: 'Gives interviewers a clear narrative arc proving positive outcomes resulted from your engineering actions.',
        example: 'Optimizing API latency by 40% with Redis cache.'
      }
    ],
    diagrams: [],
    patterns: [
      {
        name: 'Google XYZ Resume Formula',
        whenToUse: 'Writing bullet points for resume project descriptions.',
        howItWorks: 'Accomplished [X] as measured by [Y], by doing [Z].',
        example: 'Decreased page load time by 42% (Y) by implementing lazy loading and WebP compression (Z).'
      }
    ],
    stepByStep: ['1. Pick challenge', '2. State action', '3. Quantify result'],
    codeExamples: [],
    workedExamples: [
      {
        title: 'STAR Behavioral Story Response Example',
        problem: 'Interviewer asks: "Tell me about a time you resolved a difficult technical bug in a team project."',
        approach: 'Apply Situation (dashboard API latency was 1.8s), Task (improve latency under 500ms), Action (analyzed query execution plan, added composite index, introduced Redis cache), Result (latency dropped to 240ms, an 86% improvement).',
        solution: 'Answers question concisely in 90 seconds highlighting personal engineering ownership.'
      }
    ],
    practiceProblems: [],
    selfCheckQuestions: [
      {
        question: 'What percentage of your STAR response time should be spent on Action and Result?',
        answerSummary: 'Approximately 60-70% of your time should focus on Action (what YOU specifically coded/architected) and Result (metrics and impact). Keep Situation and Task concise.',
        prompt: 'How should you distribute time across STAR phases?'
      }
    ],
    commonMistakes: ['Speaking in generic terms without explaining YOUR specific individual contribution (using "we" exclusively instead of "I").'],
    interviewTips: ['Spend 60% of your STAR response time on the Action and Result stages.'],
    practiceGuidance: ['Draft 4 STAR stories with metrics'],
    quickRecap: ['STAR: Situation, Task, Action, Result.'],
    keyTakeaways: ['Focus heavily on individual Action and measurable Result'],
    placementRelevance: 'Evaluated in HR and Engineering Manager interview rounds.',
    domain: 'resume_interview'
  },

  // Development - REST APIs
  'rest_apis': {
    title: 'RESTful API Architecture & HTTP Semantics',
    subtitle: 'Resource URIs, HTTP Verbs, Idempotency, Status Codes & Statelessness',
    overview: 'REST APIs standardize client-server communication using HTTP protocols, resource URIs, standardized HTTP methods, and status codes.',
    learningObjectives: ['Understand idempotency across verbs', 'Apply standard HTTP status codes', 'Design resource-oriented endpoints'],
    realWorldAnalogy: {
      analogy: 'An idempotent operation is like the elevator "Call" button: pressing it once calls the elevator; pressing it 10 times leaves the elevator in the exact same state.',
      explanation: 'PUT and DELETE are idempotent; POST is not idempotent because pressing submit 10 times could create 10 separate charges.',
      mappedConcept: 'Idempotency'
    },
    definitions: [
      { term: 'Idempotence', definition: 'The property of certain operations in mathematics and computer science whereby they can be applied multiple times without changing the result beyond the initial application.', context: 'REST APIs' }
    ],
    formulas: [],
    concepts: [
      {
        name: 'HTTP Method Semantics & Idempotency',
        explanation: 'GET (safe read), POST (create), PUT (idempotent replace), PATCH (partial update), DELETE (idempotent remove).',
        intuition: 'Calling an idempotent operation N times produces the exact same server state as calling it once.',
        example: 'PUT /users/123 with full payload.'
      }
    ],
    diagrams: [],
    patterns: [],
    stepByStep: ['1. Resource URIs', '2. Map HTTP verbs', '3. Return status codes'],
    codeExamples: [
      {
        title: 'RESTful Endpoint Matrix',
        language: 'text',
        code: `GET    /api/v1/tasks          -> List all tasks (200 OK)
POST   /api/v1/tasks          -> Create new task (201 Created)
GET    /api/v1/tasks/:id      -> Get task details (200 OK / 404 Not Found)
PATCH  /api/v1/tasks/:id      -> Update task fields (200 OK)
DELETE /api/v1/tasks/:id      -> Delete task (204 No Content)`,
        explanation: 'Standard REST conventions.',
        complexity: { time: 'O(1) routing', space: 'O(1)' }
      }
    ],
    workedExamples: [],
    practiceProblems: [],
    selfCheckQuestions: [
      {
        question: 'What is the key difference between 401 Unauthorized and 403 Forbidden?',
        answerSummary: '401 Unauthorized means Unauthenticated (who are you? Missing/invalid token). 403 Forbidden means Authenticated but lacking permission (we know who you are, but you cannot access this).',
        prompt: 'How do you differentiate 401 and 403 HTTP status codes?'
      }
    ],
    commonMistakes: ['Using verbs in URIs (/api/deleteUser instead of DELETE /api/users/123)'],
    interviewTips: ['Differentiate 401 Unauthorized vs 403 Forbidden.'],
    practiceGuidance: ['Design a complete REST API schema for an e-commerce platform'],
    quickRecap: ['PUT is idempotent; POST is non-idempotent.'],
    keyTakeaways: ['Stateless architecture enables seamless horizontal scaling'],
    placementRelevance: 'API design is evaluated across all backend technical rounds.',
    domain: 'rest_apis'
  },

  // System Design
  'system_design': {
    title: 'System Design & High-Level Scalability',
    subtitle: 'Horizontal Scaling, CAP Theorem, Caching & Load Balancing',
    overview: 'System Design evaluations test how to architect scalable, resilient, distributed software systems handling millions of users and high throughput.',
    learningObjectives: ['Master horizontal vs vertical scaling', 'Apply CAP theorem', 'Design caching layers'],
    realWorldAnalogy: {
      analogy: 'Vertical scaling is like buying a bigger, faster truck. Horizontal scaling is like hiring a fleet of 50 standard vans coordinated by a central dispatcher (Load Balancer).',
      explanation: 'A fleet can easily grow or shrink based on package volume and has no single point of catastrophic failure.',
      mappedConcept: 'Horizontal vs Vertical Scaling'
    },
    definitions: [
      { term: 'CAP Theorem', definition: 'In any distributed data store, you can only guarantee at most two out of three: Consistency, Availability, and Partition Tolerance.', context: 'Distributed Systems' }
    ],
    formulas: [],
    concepts: [
      {
        name: 'Horizontal vs Vertical Scaling',
        explanation: 'Horizontal scaling adds more server nodes; Vertical scaling adds CPU/RAM to a single server.',
        intuition: 'Horizontal scaling allows virtually infinite scaling with high availability.',
        example: 'Stateless web application servers scaled with NGINX.'
      }
    ],
    diagrams: [],
    patterns: [],
    stepByStep: ['1. Requirements & scale', '2. High-level architecture', '3. Bottlenecks'],
    codeExamples: [],
    workedExamples: [],
    practiceProblems: [],
    selfCheckQuestions: [
      {
        question: 'Why do distributed systems have to choose between Consistency (CP) and Availability (AP) during a network partition?',
        answerSummary: 'Because when network communication between nodes is severed, you must either reject writes to keep data consistent across partitions (CP) or accept writes on available nodes and accept divergent data (AP).',
        prompt: 'Why does a network partition force a trade-off between Consistency and Availability?'
      }
    ],
    commonMistakes: ['Jumping into microservices before clarifying scale requirements.'],
    interviewTips: ['Always clarify read-to-write ratio before designing database and caching tiers.'],
    practiceGuidance: ['Design URL Shortener (TinyURL) and Rate Limiter'],
    quickRecap: ['Scale horizontally for stateless web servers behind load balancers.'],
    keyTakeaways: ['CAP theorem forces CP vs AP trade-off during network partitions'],
    placementRelevance: 'Standard evaluation for software engineering roles.',
    domain: 'system_design'
  }
};

/**
 * Returns grounded fallback study material based on deterministic domain classification.
 */
export function getFallbackStudyMaterial(taskContextOrTopic) {
  const domain = classifyTaskDomain(taskContextOrTopic);
  if (domain && GROUNDED_STUDY_MATERIALS[domain]) {
    const base = GROUNDED_STUDY_MATERIALS[domain];
    const taskTitle = typeof taskContextOrTopic === 'object' && taskContextOrTopic !== null
      ? (taskContextOrTopic.taskTitle || taskContextOrTopic.name || taskContextOrTopic.topic || base.title)
      : (taskContextOrTopic || base.title);

    return {
      ...base,
      title: taskTitle,
      diagrams: Array.isArray(base.diagrams) ? base.diagrams : [],
      definitions: Array.isArray(base.definitions) ? base.definitions : [],
      formulas: Array.isArray(base.formulas) ? base.formulas : [],
      practiceProblems: Array.isArray(base.practiceProblems) ? base.practiceProblems : [],
      selfCheckQuestions: Array.isArray(base.selfCheckQuestions) ? base.selfCheckQuestions : [],
      realWorldAnalogy: base.realWorldAnalogy || null,
      domain: domain
    };
  }
  return null;
}

/**
 * Generates a stable fingerprint cache key for a task's study material.
 */
export function getStudyMaterialCacheKey(taskContext = {}) {
  const taskId = normalizeText(taskContext.taskId || taskContext.id || '');
  const taskTitle = normalizeText(taskContext.taskTitle || taskContext.taskName || taskContext.name || '');
  const topic = normalizeText(taskContext.roadmapTopic || taskContext.topic || '');
  const desc = normalizeText(taskContext.taskDescription || taskContext.description || '');
  const duration = normalizeText(taskContext.durationMinutes || taskContext.estimatedMinutes || taskContext.duration || '');
  const objectives = normalizeText(taskContext.learningObjectives || '');
  
  return `study_${taskId}_${taskTitle}_${topic}_${desc.slice(0, 30)}_${duration}_${objectives.slice(0, 30)}`.trim().toLowerCase().replace(/\s+/g, '_');
}

/**
 * Retrieves cached study material if available.
 */
export function getCachedStudyMaterial(cacheKey) {
  if (!cacheKey) return null;
  return STUDY_MATERIAL_CACHE.get(cacheKey) || null;
}

/**
 * Stores study material in cache.
 */
export function setCachedStudyMaterial(cacheKey, material) {
  if (!cacheKey || !material) return;
  STUDY_MATERIAL_CACHE.set(cacheKey, material);
}

/**
 * Deterministic Grounded Fallback Tutor Generator for NOVARA
 * Supplies high-yield structured answers when AI is offline or unavailable.
 */
export function getFallbackTutorResponse(tutorContext = {}) {
  const taskTitle = normalizeText(tutorContext.taskTitle || tutorContext.topic || 'Current Topic');
  const roadmapTopic = normalizeText(tutorContext.roadmapTopic || tutorContext.topic || taskTitle);
  const userQuery = normalizeText(tutorContext.userQuery || tutorContext.prompt || tutorContext.message || '').toLowerCase();
  const actionType = tutorContext.actionType || 'custom_query';
  const codeContext = typeof tutorContext.codeContext === 'string'
    ? tutorContext.codeContext
    : (tutorContext.codeContext?.code ? String(tutorContext.codeContext.code) : normalizeText(tutorContext.codeContext));
  const domain = classifyTaskDomain(tutorContext);
  const material = GROUNDED_STUDY_MATERIALS[domain] || null;

  // 1. Check for cross-domain or completely unrelated questions in technical tasks
  if (domain !== 'resume_interview') {
    if (
      userQuery.includes('star framework') ||
      userQuery.includes('star method') ||
      userQuery.includes('behavioral interview') ||
      userQuery.includes('tell me about yourself') ||
      userQuery.includes('elevator pitch') ||
      userQuery.includes('salary negotiation')
    ) {
      return {
        answer: `That is outside this study topic. Ask me something about **${roadmapTopic}**.`,
        actionType,
        isFallback: true,
        groundedDomain: domain
      };
    }
  }

  // 2. Unrelated random topic checks
  if (
    userQuery.includes('weather') ||
    userQuery.includes('recipe') ||
    userQuery.includes('movie') ||
    userQuery.includes('capital of') ||
    userQuery.includes('who is the president')
  ) {
    return {
      answer: `That is outside this study topic. Ask me something about **${roadmapTopic}**.`,
      actionType,
      isFallback: true,
      groundedDomain: domain
    };
  }

  // 3. Action Type Handling
  if (actionType === 'explain_simpler' || userQuery.includes('explain simpler') || userQuery.includes('simple') || userQuery.includes('layman')) {
    if (material && material.realWorldAnalogy) {
      return {
        answer: `### 🌟 Simplified Concept: ${roadmapTopic}\n\n**Real-World Analogy:**\n${material.realWorldAnalogy.analogy}\n\n**Why it works in plain terms:**\n${material.realWorldAnalogy.explanation}\n\n**Key Takeaway:**\nInstead of checking every single possibility (which is slow), we use structural rules to skip work intelligently.`,
        actionType: 'explain_simpler',
        isFallback: true
      };
    }
    return {
      answer: `### 🌟 Simplified Concept: ${roadmapTopic}\n\n**Definition:**\n${roadmapTopic} allows you to organize and process information step-by-step with optimal efficiency.\n\n**Why it matters:**\nIt prevents brute-force operations and saves both CPU processing time and memory.\n\n**Key Takeaway:**\nFocus on maintaining clean boundary invariants and updating state incrementally.`,
      actionType: 'explain_simpler',
      isFallback: true
    };
  }

  if (actionType === 'another_example' || userQuery.includes('another example') || userQuery.includes('more examples')) {
    if (material && material.workedExamples && material.workedExamples.length > 0) {
      const ex = material.workedExamples[0];
      return {
        answer: `### 💡 Additional Grounded Example\n\n**Problem Scenario:**\n${ex.problem || ex.title}\n\n**Approach:**\n${ex.approach}\n\n**Optimal Solution:**\n\`\`\`\n${ex.solution}\n\`\`\`\n\n**Key Takeaway:**\nNotice how the data invariants allow us to reach the solution in optimal linear or logarithmic time.`,
        actionType: 'another_example',
        isFallback: true
      };
    }
    return {
      answer: `### 💡 Additional Grounded Example for ${roadmapTopic}\n\n**Scenario:**\nConsider processing a sequence of inputs sequentially while checking if the current condition meets the required threshold.\n\n**Step-by-Step Flow:**\n1. Initialize tracking variables at initial boundaries.\n2. Ingest elements one-by-one.\n3. Update the running metric and compare against the goal.\n\n**Key Takeaway:**\nMaintaining running state eliminates redundant nested iterations.`,
      actionType: 'another_example',
      isFallback: true
    };
  }

  if (actionType === 'practice_problem' || userQuery.includes('practice problem') || userQuery.includes('give me a problem')) {
    if (material && material.practiceProblems && material.practiceProblems.length > 0) {
      const p = material.practiceProblems[0];
      return {
        answer: `### 🧩 Practice Challenge: ${p.title}\n\n**Problem:**\n${p.problem}\n\n**Skill Tested:**\n${p.skillTested || roadmapTopic}\n\n**💡 Hint:**\n${p.hint}\n\n**🔍 Optimal Approach Direction:**\n${p.approach}`,
        actionType: 'practice_problem',
        isFallback: true
      };
    }
    return {
      answer: `### 🧩 Practice Challenge: ${roadmapTopic}\n\n**Problem:**\nGiven an input sequence, implement an optimal O(N) or O(log N) algorithm to find the target condition without auxiliary memory allocations.\n\n**💡 Hint:**\nThink about whether sorting or maintaining two boundary pointers helps prune the search space.\n\n**Approach:**\nInitialize boundary pointers and narrow the range based on comparative evaluations.`,
      actionType: 'practice_problem',
      isFallback: true
    };
  }

  if (actionType === 'step_by_step' || userQuery.includes('step by step') || userQuery.includes('steps')) {
    if (material && material.stepByStep && material.stepByStep.length > 0) {
      const stepsFormatted = material.stepByStep.map((s, idx) => `**Step ${idx + 1}:** ${s.replace(/^\d+\.\s*/, '')}`).join('\n\n');
      return {
        answer: `### 🔍 Step-by-Step Problem Solving Framework\n\n${stepsFormatted}\n\n**Key Takeaway:**\nAlways verify boundary constraints (empty input, single element, negative numbers) before finalizing code.`,
        actionType: 'step_by_step',
        isFallback: true
      };
    }
    return {
      answer: `### 🔍 Step-by-Step Framework for ${roadmapTopic}\n\n**Step 1:** Clarify constraints, input size, and edge cases.\n\n**Step 2:** Formulate the mathematical or structural invariant.\n\n**Step 3:** Implement the traversal or update mechanism.\n\n**Step 4:** Analyze Time and Space complexity explicitly.`,
      actionType: 'step_by_step',
      isFallback: true
    };
  }

  if (actionType === 'explain_code' || userQuery.includes('explain this code') || userQuery.includes('explain code') || codeContext) {
    const targetCode = codeContext || (material?.codeExamples?.[0]?.code) || '// Code implementation';
    const complexityTime = material?.codeExamples?.[0]?.complexity?.time || 'O(N)';
    const complexitySpace = material?.codeExamples?.[0]?.complexity?.space || 'O(1)';

    return {
      answer: `### 💻 Code Walkthrough & Line-by-Line Analysis\n\n\`\`\`javascript\n${targetCode}\n\`\`\`\n\n**Line-by-Line Explanation:**\n1. **Initialization:** Sets up primary boundary pointers and tracking variables in O(1) space.\n2. **Loop Condition:** Iterates while the search window or pointers remain within valid bounds.\n3. **State Transition:** Updates state monotonically based on comparison logic, pruning non-viable candidates.\n4. **Return:** Returns the calculated result or index location.\n\n**Complexity Analysis:**\n- **Time Complexity:** ${complexityTime} (single pass traversal)\n- **Space Complexity:** ${complexitySpace} (in-place auxiliary memory)`,
      actionType: 'explain_code',
      isFallback: true
    };
  }

  // 4. Default Grounded Query Response
  const conceptSummary = material?.concepts?.map(c => `• **${c.name}:** ${c.explanation}`).join('\n') || `• **Core Mechanism:** Master fundamental invariants for ${roadmapTopic}.`;
  return {
    answer: `### 🎯 Grounded Insights: ${taskTitle}\n\n**Overview:**\n${material?.overview || `Study and practice core principles of ${roadmapTopic}.`}\n\n**Core Concepts:**\n${conceptSummary}\n\n**Key Takeaway:**\n${material?.keyTakeaways?.[0] || material?.quickRecap?.[0] || `Apply optimal linear or logarithmic strategies to solve ${roadmapTopic} problems.`}`,
    actionType: 'custom_query',
    isFallback: true
  };
}

