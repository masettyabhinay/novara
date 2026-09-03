/**
 * Server-Side Task Study Material Service for NOVARA
 * Provides rich, domain-grounded study guides, concept intuitions,
 * algorithmic patterns, code examples, worked problem examples,
 * and intelligent visual diagrams with step-by-step visualizations.
 */

import { classifyTaskDomain } from './revisionService.js';

// Server-side in-memory cache for generated study materials
const STUDY_MATERIAL_CACHE = new Map();

/**
 * Verified Grounded Study Material Fallbacks for all core curriculum domains.
 * Includes structured visual diagrams for algorithmic, architectural, and data structure topics.
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
      },
      {
        id: 'diag_sliding_window',
        conceptName: 'Sliding Window',
        title: 'Dynamic Sliding Window Subarray Range',
        purpose: 'Visualizes expanding right boundary and contracting left boundary',
        type: 'algorithm',
        description: 'Window expands right to include elements, and contracts left when condition is exceeded.',
        elements: [
          { id: 'w_0', label: 'a', sublabel: '0', type: 'array' },
          { id: 'w_1', label: 'b', sublabel: '1 (L)', type: 'array', highlight: true },
          { id: 'w_2', label: 'c', sublabel: '2', type: 'array', highlight: true },
          { id: 'w_3', label: 'a', sublabel: '3 (R)', type: 'array', highlight: true },
          { id: 'w_4', label: 'b', sublabel: '4', type: 'array' }
        ],
        connections: [
          { from: 'w_1', to: 'w_3', label: 'Valid unique window [b, c, a]' }
        ],
        steps: [
          {
            step: 1,
            title: 'Window Expansion',
            description: 'Advance right pointer R. Add arr[R] to frequency hash map.',
            activeElementIds: ['w_1', 'w_2', 'w_3'],
            pointerState: { left: 'idx 1', right: 'idx 3' }
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
      },
      {
        name: 'Dummy / Sentinel Node Pattern',
        explanation: 'Creates a temporary pre-head node (dummy.next = head) to simplify head deletion, insertion, and edge case list mergers.',
        intuition: 'Gives the head node a predecessor so head modifications use the exact same logic as interior node modifications.',
        example: 'Removing the N-th node from end or merging two sorted lists.'
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
          { id: 'node_3', label: '[ 3 | • ]', sublabel: 'next', type: 'node' },
          { id: 'node_null', label: 'null', sublabel: 'tail', type: 'node' }
        ],
        connections: [
          { from: 'node_1', to: 'node_2', label: 'next' },
          { from: 'node_2', to: 'node_3', label: 'next' },
          { from: 'node_3', to: 'node_null', label: 'next' }
        ],
        steps: [
          {
            step: 1,
            title: 'Save Next Reference',
            description: 'Save nextNode = curr.next before rewiring curr pointer.',
            activeElementIds: ['node_2', 'node_3']
          },
          {
            step: 2,
            title: 'Rewire Pointer to Prev',
            description: 'Set curr.next = prev (points arrow left).',
            activeElementIds: ['node_1', 'node_2']
          },
          {
            step: 3,
            title: 'Advance Pointers',
            description: 'Set prev = curr, curr = nextNode.',
            activeElementIds: ['node_2', 'node_3']
          }
        ]
      }
    ],
    patterns: [
      {
        name: 'Fast and Slow Pointers (Tortoise and Hare)',
        whenToUse: 'Finding the middle node, detecting cycles, or finding cycle start node.',
        howItWorks: 'Slow moves 1 step; Fast moves 2 steps. When Fast reaches end, Slow is at middle.',
        example: 'Middle of Linked List, Linked List Cycle II'
      }
    ],
    stepByStep: [
      '1. Draw the node connections on paper or visualize next pointers.',
      '2. Use a dummy node whenever the head pointer might change or be deleted.',
      '3. Always save next node references in a temporary variable before rewiring curr.next.',
      '4. Watch out for null pointer dereferencing (curr !== null && curr.next !== null).',
      '5. Handle edge cases: empty list (head === null), single-node list, and 2-node list.'
    ],
    codeExamples: [
      {
        title: 'Iterative Singly Linked List Reversal',
        language: 'javascript',
        code: `function reverseList(head) {
  let prev = null;
  let curr = head;
  while (curr !== null) {
    let nextNode = curr.next; // Save next reference
    curr.next = prev;         // Reverse pointer direction
    prev = curr;              // Advance prev pointer
    curr = nextNode;          // Advance curr pointer
  }
  return prev; // New head of reversed list
}`,
        explanation: 'Reverses all next pointers in-place with zero auxiliary heap allocations.',
        complexity: {
          time: 'O(N)',
          space: 'O(1)'
        }
      }
    ],
    workedExamples: [
      {
        title: 'Detect Cycle and Find Loop Start (LeetCode #142)',
        problem: 'Given a linked list, return the node where the cycle begins. If there is no cycle, return null.',
        approach: 'Use Floyd cycle detection. Once fast meets slow, reset slow to head. Move both pointers 1 step at a time; their meeting point is the exact cycle entry node.',
        solution: 'Mathematically proven O(N) time and O(1) space.'
      }
    ],
    commonMistakes: [
      'Losing reference to the rest of the list by overwriting curr.next before saving nextNode.',
      'Creating infinite loops by forgetting to null-terminate the original head node.',
      'Not checking if fast or fast.next is null before accessing fast.next.next in cycle detection.'
    ],
    interviewTips: [
      'Always ask if the list is singly or doubly linked.',
      'Clarify whether modifying node values is permitted or if pointers must be physically rewired.',
      'State O(1) space when implementing in-place iterative algorithms.'
    ],
    practiceGuidance: [
      'Solve LeetCode #206 (Reverse Linked List)',
      'Solve LeetCode #141 (Linked List Cycle)',
      'Solve LeetCode #21 (Merge Two Sorted Lists)'
    ],
    quickRecap: [
      'Fast & Slow pointers find middle elements and detect cycles in O(1) space.',
      'Always save curr.next into a temporary variable before rewiring.',
      'Use a dummy node to eliminate special cases when manipulating head nodes.'
    ],
    keyTakeaways: [
      'Never rewire curr.next without storing temp next',
      'Sentinel dummy node eliminates special head cases'
    ],
    placementRelevance: 'Pointer manipulation tests your understanding of heap memory and clean reference handling. Top product companies frequently ask variants of list reversal and reordering (e.g. Palindrome Linked List, LRU Cache).',
    domain: 'linked_lists'
  },

  // DSA - Binary Search
  'binary_search': {
    title: 'Binary Search & Monotonic Spaces',
    subtitle: 'Divide & Conquer, Search Space Reduction & Monotonic Predicates',
    overview: 'Binary Search reduces the search space by half in each iteration, achieving O(log N) complexity. It applies not only to sorted arrays, but crucially to monotonic answer spaces (e.g. capacity allocation, rate minimization).',
    learningObjectives: [
      'Implement overflow-safe boundary calculations',
      'Recognize monotonicity in discrete answer spaces',
      'Formulate boolean predicate functions `isValid(mid)`'
    ],
    concepts: [
      {
        name: 'Integer Overflow Protection',
        explanation: 'In typed environments, calculating `low + Math.floor((high - low) / 2)` avoids numeric overflow caused by `(low + high)`.',
        intuition: 'Prevents 32-bit signed integer wrapping when low and high are large positive numbers.',
        example: 'Handling array indices when low and high are close to 2^31 - 1.'
      },
      {
        name: 'Binary Search on Answer Space',
        explanation: 'Defines a monotonic predicate function `isValid(mid)` that returns boolean feasibility over a bounded range [minVal, maxVal].',
        intuition: 'If capacity X is valid, any capacity > X is also valid. Binary search finds the transition boundary.',
        example: 'Capacity To Ship Packages Within D Days or Koko Eating Bananas.'
      }
    ],
    diagrams: [
      {
        id: 'diag_bs_partition',
        conceptName: 'Binary Search on Answer Space',
        title: 'Monotonic Search Space Reduction',
        purpose: 'Visualizes eliminating half of search space per step',
        type: 'algorithm',
        description: 'Compares mid with target and cuts the unneeded half of search space.',
        elements: [
          { id: 'b_0', label: '1', sublabel: 'Low', type: 'array', highlight: true },
          { id: 'b_1', label: '3', sublabel: '1', type: 'array' },
          { id: 'b_2', label: '5', sublabel: 'Mid', type: 'array', highlight: true },
          { id: 'b_3', label: '8', sublabel: '3', type: 'array' },
          { id: 'b_4', label: '12', sublabel: 'High', type: 'array', highlight: true }
        ],
        connections: [
          { from: 'b_0', to: 'b_4', label: 'mid = 5 < target (8) -> low = mid + 1' }
        ],
        steps: [
          {
            step: 1,
            title: 'Evaluate Mid',
            description: 'Check arr[mid] = 5 against target = 8. Since 5 < 8, target must lie in right half.',
            activeElementIds: ['b_0', 'b_2', 'b_4'],
            pointerState: { low: 'idx 0 (1)', mid: 'idx 2 (5)', high: 'idx 4 (12)' }
          },
          {
            step: 2,
            title: 'Narrow Boundary to Right Half',
            description: 'Set low = mid + 1 (idx 3). Search space reduced to [8, 12].',
            activeElementIds: ['b_3', 'b_4'],
            pointerState: { low: 'idx 3 (8)', high: 'idx 4 (12)' }
          }
        ]
      }
    ],
    patterns: [
      {
        name: 'Monotonic Predicate Binary Search',
        whenToUse: 'Optimization problems asking for minimum max value or maximum min value.',
        howItWorks: 'Define low and high bounds. Check isValid(mid). If valid, record candidate and try smaller; else try larger.',
        example: 'Koko Eating Bananas, Split Array Largest Sum'
      }
    ],
    stepByStep: [
      '1. Identify monotonicity: Verify that if condition(x) is true, condition(x+1) is also true.',
      '2. Define search boundaries: low = minimum possible answer, high = maximum possible answer.',
      '3. In while(low <= high), compute mid safely.',
      '4. If isValid(mid) is true, store mid as candidate and adjust search boundary.',
      '5. Return the optimal stored candidate.'
    ],
    codeExamples: [
      {
        title: 'Classic Binary Search Implementation',
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
        explanation: 'Standard search with low <= high condition returning target index in O(log N).',
        complexity: {
          time: 'O(log N)',
          space: 'O(1)'
        }
      }
    ],
    workedExamples: [
      {
        title: 'Search in Rotated Sorted Array (LeetCode #33)',
        problem: 'Given rotated sorted array nums and target, return index of target or -1.',
        approach: 'At least one half of the array [low...mid] or [mid...high] is always strictly sorted. Check if target lies within the sorted half; if so, narrow search there; otherwise search the other half.',
        solution: 'Maintains O(log N) time despite array rotation.'
      }
    ],
    commonMistakes: [
      'Infinite loops caused by updating low = mid instead of low = mid + 1 (or high = mid instead of high = mid - 1).',
      'Incorrect boundary initialization on answer spaces.',
      'Applying binary search on unsorted arrays without checking monotonicity.'
    ],
    interviewTips: [
      'Mention that Binary Search is not restricted to arrays and can search continuous monotonic function spaces.',
      'Explain how mid calculation prevents integer overflow.'
    ],
    practiceGuidance: [
      'Solve LeetCode #704 (Binary Search)',
      'Solve LeetCode #33 (Search in Rotated Sorted Array)',
      'Solve LeetCode #875 (Koko Eating Bananas)'
    ],
    quickRecap: [
      'Halves search space every iteration: O(log N) time.',
      'Use mid = low + (high - low) / 2 to avoid overflow.',
      'Applies whenever a boolean feasibility function exhibits monotonicity.'
    ],
    keyTakeaways: [
      'At least one half is always sorted in rotated arrays',
      'Monotonic answer spaces enable binary search on results'
    ],
    placementRelevance: 'Binary search on answer spaces is a tier-1 interview favorite (Google, Amazon, Microsoft). Recognizing that a problem is a binary search problem is the primary evaluation hurdle.',
    domain: 'binary_search'
  },

  // Core CS - DBMS
  'dbms': {
    title: 'DBMS Fundamentals & ACID Properties',
    subtitle: 'Transactions, Normalization, Indexing Structures & Concurrency Control',
    overview: 'Database Management Systems ensure data reliability, concurrency control, and persistent storage in backend architectures. Placement rounds evaluate ACID semantics, indexing structures, and transaction isolation.',
    learningObjectives: [
      'Master ACID properties and transaction rollback mechanics',
      'Understand B+ Tree clustered vs non-clustered indexing trade-offs',
      'Analyze transaction isolation levels and concurrency anomalies (Dirty / Non-repeatable / Phantom reads)'
    ],
    concepts: [
      {
        name: 'ACID Properties',
        explanation: 'Atomicity (all-or-nothing), Consistency (schema constraints respected), Isolation (concurrent transactions execute independently), Durability (committed changes persist).',
        intuition: 'Guarantees that database state transitions remain completely dependable even under sudden hardware power failures or network crashes.',
        example: 'Bank transfer debiting Account A and crediting Account B in a single atomic transaction.'
      },
      {
        name: 'Clustered vs Non-Clustered Indexes',
        explanation: 'Clustered index physically sorts and stores data rows on disk (only 1 per table); Non-clustered index stores index keys with pointers to data rows.',
        intuition: 'Clustered index is like the alphabetical page order of a dictionary; non-clustered index is like the index section at the back with page numbers.',
        example: 'Primary key creates the clustered B+ Tree index by default in MySQL InnoDB.'
      }
    ],
    diagrams: [
      {
        id: 'diag_dbms_indexes',
        conceptName: 'Clustered vs Non-Clustered Indexes',
        title: 'Clustered Index vs Non-Clustered Index Architecture',
        purpose: 'Contrasts physical row storage vs pointer reference lookup',
        type: 'comparison',
        description: 'Clustered index stores actual data rows at leaf nodes; non-clustered index stores pointers (row IDs).',
        elements: [
          { id: 'c_index', label: 'Clustered Index (1 per table)', sublabel: 'Leaf nodes contain actual table data rows sorted by PK' },
          { id: 'nc_index', label: 'Non-Clustered Index (Multiple)', sublabel: 'Leaf nodes contain index keys + pointers to clustered PK' }
        ],
        connections: [],
        steps: []
      }
    ],
    patterns: [
      {
        name: 'Two-Phase Locking (2PL)',
        whenToUse: 'Ensuring serializability in concurrent transaction execution.',
        howItWorks: 'Growing phase: acquire locks, release none. Shrinking phase: release locks, acquire none.',
        example: 'Strict 2PL used in enterprise relational databases.'
      }
    ],
    stepByStep: [
      '1. Review transaction boundaries (BEGIN TRANSACTION ... COMMIT / ROLLBACK).',
      '2. Understand concurrency anomalies: Dirty Read, Non-Repeatable Read, Phantom Read.',
      '3. Analyze index selection: High cardinality columns make strong candidates for B+ Tree indexes.',
      '4. Normalize tables (1NF, 2NF, 3NF, BCNF) to eliminate transitive dependencies and update anomalies.'
    ],
    codeExamples: [
      {
        title: 'ACID Transaction Block in SQL',
        language: 'sql',
        code: `BEGIN TRANSACTION;
UPDATE accounts SET balance = balance - 500 WHERE account_id = 'A101';
UPDATE accounts SET balance = balance + 500 WHERE account_id = 'B202';
-- If any statement fails, ROLLBACK is triggered automatically
COMMIT;`,
        explanation: 'Executes atomic funds transfer with automatic rollback on error.',
        complexity: {
          time: 'O(log N) index lookup',
          space: 'O(1)'
        }
      }
    ],
    workedExamples: [
      {
        title: 'Preventing Dirty Reads with Read Committed',
        problem: 'Transaction 1 updates a balance from $100 to $200 but has not committed. Transaction 2 reads $200. Transaction 1 rolls back. Transaction 2 operated on dirty data.',
        approach: 'Set isolation level to READ COMMITTED. Transaction 2 will only read the snapshot of the latest committed data ($100).',
        solution: 'Enforces data integrity without requiring full table locks.'
      }
    ],
    commonMistakes: [
      'Over-indexing: creating indexes on low-cardinality columns (e.g. boolean gender) which degrades write latency without improving read speed.',
      'Confusing Clustered Index (physical data ordering) with Non-Clustered Index (separate pointer lookup).',
      'Not knowing default isolation levels in major databases (MySQL InnoDB: Repeatable Read; PostgreSQL: Read Committed).'
    ],
    interviewTips: [
      'Be prepared to write out the 4 isolation levels from least to most strict.',
      'Explain why B+ Trees are preferred over Binary Search Trees or Hash tables for disk databases (range queries and block caching).'
    ],
    practiceGuidance: [
      'Review normalization rules from 1NF to BCNF',
      'Practice drawing B+ Tree split and merge operations'
    ],
    quickRecap: [
      'ACID ensures transaction reliability and consistency.',
      'Tables have exactly ONE clustered index because physical disk rows have only one physical sort order.',
      'Repeatable Read prevents dirty and non-repeatable reads.'
    ],
    keyTakeaways: [
      'Atomicity = all or nothing',
      'B+ Tree leaves are linked for fast range scans',
      'Isolation levels trade throughput for consistency'
    ],
    placementRelevance: 'DBMS fundamentals are tested in almost every technical interview for software engineering and backend roles.',
    domain: 'dbms'
  },

  // Core CS - SQL
  'sql': {
    title: 'SQL Joins, Aggregations & Window Functions',
    subtitle: 'Relational Queries, Common Table Expressions, Window Partitions & Grouping',
    overview: 'SQL queries enable powerful relational data extraction, aggregation, filtering, and analytical window calculations across enterprise database schemas.',
    learningObjectives: [
      'Master INNER, LEFT, RIGHT, and FULL OUTER joins',
      'Differentiate WHERE (row-level) vs HAVING (aggregate-level) filtering',
      'Write analytical window functions with PARTITION BY and ORDER BY',
      'Use CTEs (Common Table Expressions) for multi-step data transformations'
    ],
    concepts: [
      {
        name: 'INNER vs LEFT vs FULL JOIN',
        explanation: 'INNER JOIN returns matching rows from both tables; LEFT JOIN returns all rows from left table with NULLs for unmatched right-table records.',
        intuition: 'Join type determines how unmatched records from either table are preserved or discarded.',
        example: 'Employees LEFT JOIN Departments to show all employees even if unassigned to a department.'
      },
      {
        name: 'HAVING vs WHERE',
        explanation: 'WHERE filters individual records before aggregation; HAVING filters aggregated group metrics generated by GROUP BY.',
        intuition: 'WHERE cannot see aggregate results like COUNT(*) because aggregation has not happened yet.',
        example: 'SELECT dept, COUNT(*) FROM emp WHERE salary > 50000 GROUP BY dept HAVING COUNT(*) > 5;'
      }
    ],
    diagrams: [
      {
        id: 'diag_sql_joins',
        conceptName: 'INNER vs LEFT vs FULL JOIN',
        title: 'Relational SQL JOIN Venn Comparison',
        purpose: 'Contrasts matching records vs preserving unmatched table rows',
        type: 'flow',
        description: 'INNER JOIN keeps only intersection A ∩ B. LEFT JOIN preserves entire table A.',
        elements: [
          { id: 't_a', label: 'Table A (Left)', sublabel: 'All records preserved in LEFT JOIN', highlight: true },
          { id: 't_match', label: 'A ∩ B (Matching Keys)', sublabel: 'Returned in INNER & LEFT JOIN', highlight: true },
          { id: 't_b', label: 'Table B (Right)', sublabel: 'NULL filled if unmatched in LEFT JOIN' }
        ],
        connections: [
          { from: 't_a', to: 't_match', label: 'ON A.id = B.a_id' }
        ],
        steps: []
      }
    ],
    patterns: [
      {
        name: 'Common Table Expression (CTE) with Window Partition',
        whenToUse: 'Finding Top-N records per category or Nth highest salary.',
        howItWorks: 'Define WITH RankedTable AS (...), compute rank using DENSE_RANK(), then filter where rank = N in outer query.',
        example: 'Second highest salary per department'
      }
    ],
    stepByStep: [
      '1. Identify the base table and required JOIN relationships.',
      '2. Apply WHERE filters for row-level exclusions.',
      '3. Group by primary categorical dimensions if calculating aggregates.',
      '4. Filter group metrics using HAVING.',
      '5. Apply Window Functions (e.g. RANK() OVER (PARTITION BY ... ORDER BY ...)) for ranking or cumulative metrics.'
    ],
    codeExamples: [
      {
        title: 'Finding Nth Highest Salary per Department using DENSE_RANK',
        language: 'sql',
        code: `WITH RankedSalaries AS (
  SELECT 
    employee_id, 
    department_id, 
    salary,
    DENSE_RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) as rank_num
  FROM employees
)
SELECT employee_id, department_id, salary
FROM RankedSalaries
WHERE rank_num = 2;`,
        explanation: 'Common interview SQL query using Common Table Expressions (CTE) and window functions.',
        complexity: {
          time: 'O(N log N) partition sorting',
          space: 'O(N)'
        }
      }
    ],
    workedExamples: [
      {
        title: 'Find Customers Who Never Placed an Order',
        problem: 'Given Customers table (id, name) and Orders table (id, customerId), find names of all customers who never ordered.',
        approach: 'Perform a LEFT JOIN from Customers to Orders on Customers.id = Orders.customerId. Filter where Orders.id IS NULL.',
        solution: '`SELECT c.name FROM Customers c LEFT JOIN Orders o ON c.id = o.customerId WHERE o.id IS NULL;`'
      }
    ],
    commonMistakes: [
      'Using WHERE with aggregate functions (e.g. WHERE COUNT(*) > 5 is invalid; must use HAVING).',
      'Assuming JOIN eliminates duplicates automatically without DISTINCT or proper primary keys.',
      'Mixing up RANK() (gaps on duplicate) and DENSE_RANK() (consecutive ranks).'
    ],
    interviewTips: [
      'Always use aliases (e.g., `FROM employees e`) to keep complex joins readable.',
      'Remember that NULL comparisons require `IS NULL` or `IS NOT NULL`, never `= NULL`.'
    ],
    practiceGuidance: [
      'Practice LeetCode SQL 50 study plan',
      'Write queries for Department Highest Salary and Consecutive Numbers'
    ],
    quickRecap: [
      'INNER JOIN excludes unmatched records; LEFT JOIN preserves all left table records.',
      'WHERE runs before GROUP BY; HAVING runs after GROUP BY.',
      'Window functions compute running metrics without collapsing rows.'
    ],
    keyTakeaways: [
      'Use CTEs to make complex nested subqueries readable',
      'DENSE_RANK() does not leave numeric gaps on ties'
    ],
    placementRelevance: 'Live SQL query coding rounds are standard for Backend, Full Stack, and Data Analyst roles.',
    domain: 'sql'
  },

  // Core CS - Operating Systems
  'operating_systems': {
    title: 'Operating Systems — Processes, Threads & Concurrency',
    subtitle: 'Process Scheduling, Deadlocks, Synchronization Primitives & Virtual Memory',
    overview: 'Operating Systems manage CPU execution, concurrent threads, memory allocation, and hardware synchronization. Core placement topics focus on process scheduling, deadlock prevention, and virtual memory paging.',
    learningObjectives: [
      'Understand process vs thread architecture and shared memory implications',
      'Identify the 4 Coffman deadlock conditions and methods to prevent them',
      'Differentiate Mutex and Semaphore synchronization primitives',
      'Explain virtual memory paging, page faults, and thrashing mechanics'
    ],
    concepts: [
      {
        name: 'Process vs Thread',
        explanation: 'A Process is an isolated execution unit with its own address space. Threads within the same process share code, data, and heap memory but have private call stacks.',
        intuition: 'Processes are separate buildings with private resources; threads are workers inside the same building sharing the common kitchen.',
        example: 'Web browser tabs running as separate processes for fault isolation; worker threads rendering background components.'
      }
    ],
    diagrams: [
      {
        id: 'diag_os_process_threads',
        conceptName: 'Process vs Thread',
        title: 'Process Address Space vs Multithreading Topology',
        purpose: 'Visualizes shared heap and data memory vs isolated thread stacks',
        type: 'architecture',
        description: 'Process contains shared Code, Data, and Heap. Threads T1 and T2 each own private Registers and Stack.',
        elements: [
          { id: 'p_shared', label: 'Process Shared Memory', sublabel: 'Code Segment • Data Segment • Global Heap', highlight: true },
          { id: 't_1', label: 'Thread 1', sublabel: 'Registers • Call Stack' },
          { id: 't_2', label: 'Thread 2', sublabel: 'Registers • Call Stack' }
        ],
        connections: [
          { from: 'p_shared', to: 't_1', label: 'Shared Memory Access' },
          { from: 'p_shared', to: 't_2', label: 'Shared Memory Access' }
        ],
        steps: []
      }
    ],
    patterns: [
      {
        name: 'Strict Lock Ordering Hierarchy',
        whenToUse: 'Preventing deadlocks in multithreaded systems with multiple shared resources.',
        howItWorks: 'Assign unique integer IDs to all locks. Always acquire locks in ascending order of their IDs.',
        example: 'Dining Philosophers Solution, Bank Account Transfer'
      }
    ],
    stepByStep: [
      '1. Understand process states: New, Ready, Running, Waiting/Blocked, Terminated.',
      '2. Analyze CPU scheduling tradeoffs: FCFS, Shortest Job First (SJF), Round Robin (time quantum), Priority with Aging.',
      '3. Trace critical sections and race conditions when multiple threads read/write shared variables.',
      '4. Break at least one Coffman condition to prevent deadlocks (e.g. acquire locks in globally ordered sequence).'
    ],
    codeExamples: [
      {
        title: 'Deadlock Prevention via Strict Lock Ordering',
        language: 'javascript',
        code: `// Process A & Process B both acquire Lock 1 before Lock 2
function transferFunds(acc1, acc2, amount) {
  const firstLock = acc1.id < acc2.id ? acc1 : acc2;
  const secondLock = acc1.id < acc2.id ? acc2 : acc1;
  
  firstLock.lock();
  secondLock.lock();
  try {
    acc1.balance -= amount;
    acc2.balance += amount;
  } finally {
    secondLock.unlock();
    firstLock.unlock();
  }
}`,
        explanation: 'Acquiring locks in a deterministic global order eliminates the Circular Wait condition.',
        complexity: {
          time: 'O(1) lock acquisition',
          space: 'O(1)'
        }
      }
    ],
    workedExamples: [
      {
        title: 'Dining Philosophers Deadlock Prevention',
        problem: '5 philosophers sit around a table with 5 chopsticks. Each philosopher needs both left and right chopsticks to eat. If all pick up their left chopstick simultaneously, deadlock occurs.',
        approach: 'Break symmetry: have philosopher 1-4 pick up left then right, but philosopher 5 pick up right then left. This eliminates Circular Wait.',
        solution: 'Guarantees at least one philosopher can eat and release chopsticks.'
      }
    ],
    commonMistakes: [
      'Confusing Deadlock (threads permanently blocked waiting on each other) with Starvation (thread ready but perpetually bypassed by higher priority jobs).',
      'Assuming threads have separate memory heaps (threads share heap; processes do not).',
      'Thinking Mutex and Binary Semaphore are identical (Mutex has thread ownership and priority inversion protection).'
    ],
    interviewTips: [
      'Be prepared to list the 4 Coffman conditions and describe how Banker algorithm detects safe states.',
      'Explain the purpose of the Translation Lookaside Buffer (TLB) in virtual memory address translation.'
    ],
    practiceGuidance: [
      'Trace Round Robin scheduling with time quantum calculations',
      'Review LRU page replacement algorithm mechanics'
    ],
    quickRecap: [
      'Threads share memory space; Processes have isolated virtual address spaces.',
      'Deadlocks require Mutual Exclusion, Hold & Wait, No Preemption, Circular Wait.',
      'Aging prevents starvation in priority scheduling systems.'
    ],
    keyTakeaways: [
      'Global lock ordering prevents circular wait',
      'Virtual memory abstracts physical RAM limits using disk paging'
    ],
    placementRelevance: 'Operating Systems concepts are heavily tested by tier-1 product companies to evaluate core computer science foundation and systems thinking.',
    domain: 'operating_systems'
  },

  // Development - React
  'react': {
    title: 'React Basics & Modern Component Architecture',
    subtitle: 'Declarative State, Hooks Lifecycle, Reconciliation & Virtual DOM',
    overview: 'React builds declarative user interfaces using component composition, reactive state, and the Virtual DOM. Core placement topics include hooks, state immutability, reconciliation, and effect lifecycles.',
    learningObjectives: [
      'Master unidirectional data flow and props vs state boundaries',
      'Implement useEffect dependency management and cleanup lifecycles',
      'Understand Virtual DOM diffing heuristics and key prop requirements',
      'Avoid stale closures and memory leaks in custom hooks'
    ],
    concepts: [
      {
        name: 'State vs Props & Immutability',
        explanation: 'Props are read-only inputs passed downwards from parent to child. State is private mutable data managed locally. State must be updated immutably to trigger reconciliation.',
        intuition: 'React compares object references (prev === next); mutating an existing array in-place preserves the old reference and skips UI re-renders.',
        example: 'Updating array state with `setList(prev => [...prev, newItem])` rather than `list.push()`. '
      }
    ],
    diagrams: [
      {
        id: 'diag_react_flow',
        conceptName: 'State vs Props & Immutability',
        title: 'Unidirectional Data Flow & State Reconciliation',
        purpose: 'Visualizes parent props flowing down and child event callbacks firing up',
        type: 'flow',
        description: 'State changes trigger Virtual DOM diffing, applying minimal batched mutations to Real DOM.',
        elements: [
          { id: 'parent', label: 'Parent Component (State Owner)', sublabel: 'Holds state & handlers', highlight: true },
          { id: 'vdom', label: 'Virtual DOM Diffing', sublabel: 'Reconciliation algorithm (heuristic O(N))' },
          { id: 'child', label: 'Child Component', sublabel: 'Receives props, fires callbacks' },
          { id: 'dom', label: 'Browser Real DOM', sublabel: 'Batched mutations applied' }
        ],
        connections: [
          { from: 'parent', to: 'child', label: 'Props (Data Flow Down)' },
          { from: 'child', to: 'parent', label: 'Events (Callbacks Up)' },
          { from: 'parent', to: 'vdom', label: 'State change re-render' },
          { from: 'vdom', to: 'dom', label: 'Minimal commit patch' }
        ],
        steps: []
      }
    ],
    patterns: [
      {
        name: 'Custom Hook Encapsulation',
        whenToUse: 'Sharing stateful logic across multiple components without duplicating effect code.',
        howItWorks: 'Extract state and effects into a function prefixed with `use` (e.g. useFetch, useWindowSize).',
        example: 'useDebounce, useLocalStorage'
      }
    ],
    stepByStep: [
      '1. Structure components with unidirectional data flow (state flows down, actions flow up).',
      '2. Choose appropriate hooks: useState for local state, useEffect for side-effects, useMemo for expensive calculations.',
      '3. Always provide cleanup functions in useEffect for timers, subscriptions, and event listeners.',
      '4. Use unique, stable keys when rendering dynamic lists (avoid using array index as key if list can be reordered).'
    ],
    codeExamples: [
      {
        title: 'Custom Hook with Clean Effect Lifecycle',
        language: 'javascript',
        code: `import { useState, useEffect } from 'react';

export function useWindowDimensions() {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handleResize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    
    // Cleanup function prevents memory leaks on unmount
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Empty dependency array = run on mount

  return size;
}`,
        explanation: 'Demonstrates window event listener subscription and guaranteed unmount cleanup.',
        complexity: {
          time: 'O(1) render overhead',
          space: 'O(1)'
        }
      }
    ],
    workedExamples: [
      {
        title: 'Debounced Search Input Component',
        problem: 'Typing in a search box sends an API request on every keystroke, overwhelming the server.',
        approach: 'Create a useDebounce hook with a setTimeout inside useEffect that resets on every keystroke and only triggers state update after 300ms of typing inactivity.',
        solution: 'Eliminates 90%+ of redundant network calls.'
      }
    ],
    commonMistakes: [
      'Mutating state directly (e.g. state.count = 5) which bypasses React change detection and prevents re-rendering.',
      'Missing dependencies in the useEffect dependency array leading to stale closures.',
      'Setting state inside useEffect without a dependency array causing infinite re-render loops.'
    ],
    interviewTips: [
      'Explain how React 18 automatic batching groups multiple setState calls into a single render.',
      'Describe the difference between useMemo (caches calculated value) and useCallback (caches function reference).'
    ],
    practiceGuidance: [
      'Build an auto-completing search input with debouncing',
      'Implement an infinite scroll component using Intersection Observer'
    ],
    quickRecap: [
      'Update state immutably to trigger Virtual DOM reconciliation.',
      'Return a cleanup function from useEffect to prevent memory leaks.',
      'Use unique, permanent keys for list items.'
    ],
    keyTakeaways: [
      'State flows down; Events flow up',
      'Clean up timers and subscriptions in useEffect'
    ],
    placementRelevance: 'Frontend and Full Stack roles heavily test React fundamentals, state management, and performance optimization.',
    domain: 'react'
  },

  // Core CS - Computer Networks
  'computer_networks': {
    title: 'Computer Networks — TCP/IP & Protocol Suite',
    subtitle: 'OSI Reference Model, TCP Handshake, UDP Differences & DNS Resolution',
    overview: 'Computer networking protocols govern end-to-end communication across the internet. Placement questions center on the OSI reference model, TCP connection mechanics, UDP differences, and DNS/TLS handshakes.',
    learningObjectives: [
      'Trace the TCP 3-way handshake and connection teardown sequences',
      'Differentiate Layer 2 (Data Link), Layer 3 (Network/IP), and Layer 4 (Transport/Port)',
      'Explain DNS hierarchical resolution from Root to Authoritative servers',
      'Compare TCP reliable byte-streams vs UDP low-latency datagrams'
    ],
    concepts: [
      {
        name: 'TCP 3-Way Handshake',
        explanation: 'Client sends SYN; Server responds with SYN-ACK; Client sends ACK to establish a reliable, sequenced, full-duplex byte stream.',
        intuition: 'Synchronizes initial sequence numbers on both sides so missing packets can be detected and retransmitted in order.',
        example: 'Initial connection setup before sending HTTP requests.'
      }
    ],
    diagrams: [
      {
        id: 'diag_tcp_handshake',
        conceptName: 'TCP 3-Way Handshake',
        title: 'TCP 3-Way Handshake Connection Sequence',
        purpose: 'Visualizes client-server sequence number synchronization',
        type: 'sequence',
        description: 'SYN (seq=x) -> SYN-ACK (seq=y, ack=x+1) -> ACK (ack=y+1). Connection established.',
        elements: [
          { id: 'client', label: 'Client', sublabel: 'Initiator' },
          { id: 'server', label: 'Server', sublabel: 'Receiver' }
        ],
        connections: [
          { from: 'Client', to: 'Server', label: 'SYN (seq=100)' },
          { from: 'Server', to: 'Client', label: 'SYN-ACK (seq=300, ack=101)' },
          { from: 'Client', to: 'Server', label: 'ACK (ack=301) -> ESTABLISHED' }
        ],
        steps: [
          {
            step: 1,
            title: 'SYN Packet',
            description: 'Client chooses random initial sequence number X and sends SYN.',
            activeElementIds: ['client']
          },
          {
            step: 2,
            title: 'SYN-ACK Packet',
            description: 'Server acknowledges X (ack=X+1) and sends its own sequence number Y.',
            activeElementIds: ['server']
          },
          {
            step: 3,
            title: 'ACK Packet',
            description: 'Client acknowledges Y (ack=Y+1). Socket state transitions to ESTABLISHED.',
            activeElementIds: ['client', 'server']
          }
        ]
      }
    ],
    patterns: [],
    stepByStep: [
      '1. Trace packet journey: Browser URL enter → DNS lookup → TCP handshake → TLS handshake → HTTP GET → Browser render.',
      '2. Differentiate Layer 2 (MAC) vs Layer 3 (IP) vs Layer 4 (Port) addressing.',
      '3. Understand TCP reliability mechanics: Sequence numbers, ACK numbers, sliding window flow control, congestion window.'
    ],
    codeExamples: [
      {
        title: 'TCP 3-Way Handshake Diagram',
        language: 'text',
        code: `Client                Server
  |--- SYN (seq=100) --->|  (Client requests connection)
  |<-- SYN-ACK ---------|  (Server acknowledges seq=100, sends seq=300)
  |    (ack=101,seq=300) |
  |--- ACK (ack=301) --->|  (Connection ESTABLISHED)`,
        explanation: 'Sequence number synchronization between Client and Server.',
        complexity: {
          time: '1.5 RTT (Round Trip Time)',
          space: 'O(1)'
        }
      }
    ],
    workedExamples: [
      {
        title: 'URL to Page Render Flow',
        problem: 'Explain what happens under the hood when typing https://google.com in a browser.',
        approach: '1. DNS cache & hierarchical resolution -> 2. TCP 3-way handshake -> 3. TLS cryptographic handshake -> 4. HTTP GET request -> 5. Server responds 200 OK -> 6. Browser parses HTML/CSS DOM tree.',
        solution: 'Classic full-stack interview explanation covering L7 to L3.'
      }
    ],
    commonMistakes: [
      'Placing HTTP at the Transport layer (HTTP is Application Layer 7; TCP is Transport Layer 4).',
      'Thinking UDP is unreliable because it is flawed (UDP deliberately trades retransmission overhead for speed).'
    ],
    interviewTips: [
      'Always mention RTT (Round Trip Time) when discussing connection handshakes.',
      'Explain how DNS uses UDP for fast single-packet queries.'
    ],
    practiceGuidance: ['Review the 7 OSI layers and their protocol mappings'],
    quickRecap: [
      'TCP handshake: SYN → SYN-ACK → ACK.',
      'Routers operate at Layer 3 (IP); Switches operate at Layer 2 (MAC).'
    ],
    keyTakeaways: ['TCP guarantees ordering and reliability; UDP prioritizes latency'],
    placementRelevance: 'Networking questions are standard across all tech interviews.',
    domain: 'computer_networks'
  },

  // Development - Git & GitHub
  'git_github': {
    title: 'Git Version Control & Collaboration Workflows',
    subtitle: 'Branching, Commits, Merge vs Rebase & Pull Request Standards',
    overview: 'Git provides distributed version control tracking snapshots of files over time. Teams rely on branching, merge/rebase strategies, and Pull Requests for continuous integration.',
    learningObjectives: [
      'Master the Three-Tree Architecture (Working Tree, Index/Staging, Commit History)',
      'Understand Git Merge vs Git Rebase trade-offs',
      'Apply safe remote collaboration workflows (fetch vs pull)'
    ],
    concepts: [
      {
        name: 'Merge vs Rebase',
        explanation: '`git merge` creates a non-destructive merge commit preserving full branching history. `git rebase` reapplies commits on top of another base tip, creating a linear history.',
        intuition: 'Merge records what actually happened in chronological branch time; Rebase rewrites history to make it read like a single clean line.',
        example: 'Using rebase on local feature branch before creating a PR.'
      }
    ],
    diagrams: [
      {
        id: 'diag_git_merge_rebase',
        conceptName: 'Merge vs Rebase',
        title: 'Git Merge Commit vs Linear Git Rebase',
        purpose: 'Contrasts 3-way merge commit topology with linear rebase history',
        type: 'comparison',
        description: 'Merge creates a diamond commit preserving chronological history; Rebase linearizes commits.',
        elements: [
          { id: 'git_merge', label: 'git merge feature', sublabel: 'Creates dedicated merge commit (Preserves non-linear history)' },
          { id: 'git_rebase', label: 'git rebase main', sublabel: 'Replays commits onto main tip (Creates clean linear history)', highlight: true }
        ],
        connections: [],
        steps: []
      }
    ],
    patterns: [],
    stepByStep: ['1. Branch -> 2. Stage -> 3. Commit -> 4. Fetch/Rebase -> 5. PR.'],
    codeExamples: [
      {
        title: 'Daily Feature Branch Workflow',
        language: 'bash',
        code: `git checkout -b feature/topic-name
git add .
git commit -m "feat: implement feature"
git fetch origin
git rebase origin/main
git push origin feature/topic-name`,
        explanation: 'Linear commit history workflow.',
        complexity: {
          time: 'O(1)',
          space: 'O(1)'
        }
      }
    ],
    workedExamples: [],
    commonMistakes: ['Rebasing public shared branches like main.'],
    interviewTips: ['Explain why git rebase should never be run on public shared branches.'],
    practiceGuidance: ['Practice interactive rebase and merge conflict resolution'],
    quickRecap: ['Merge preserves history; Rebase linearizes history.'],
    keyTakeaways: ['Never rebase shared public branches'],
    placementRelevance: 'Essential collaborative competency for software engineering roles.',
    domain: 'git_github'
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
    concepts: [
      {
        name: 'STAR Response Framework',
        explanation: 'Situation (context & challenge) → Task (your specific responsibility) → Action (technical decisions and tools used) → Result (measurable impact & metrics).',
        intuition: 'Gives interviewers a clear narrative arc proving that positive outcomes resulted directly from your engineering actions.',
        example: 'Explaining how you optimized an API endpoint response time by 40% using Redis caching.'
      },
      {
        name: 'Project Quantification & Metric Impact',
        explanation: 'Always quantify achievements on your resume (e.g. "reduced latency by 35%", "scaled to 10k users", "improved test coverage from 60% to 90%").',
        intuition: 'Numbers provide objective proof of project scale, efficiency, and engineering maturity.',
        example: 'Action Verb + Technical Tool + Problem + Quantified Business Outcome.'
      },
      {
        name: 'The 2-Minute Elevator Pitch',
        explanation: 'A structured introduction: 1. Academic & current status, 2. Core technical strengths & languages, 3. Highlight project win, 4. Career aspiration for the role.',
        intuition: 'Sets a confident, professional tone for the entire interview without reciting your high school history.',
        example: 'Answering "Tell me about yourself" crisply in under 120 seconds.'
      }
    ],
    diagrams: [],
    patterns: [
      {
        name: 'Google XYZ Resume Formula',
        whenToUse: 'Writing bullet points for resume experience and project descriptions.',
        howItWorks: 'Accomplished [X] as measured by [Y], by doing [Z].',
        example: 'Decreased page load time by 42% (Y) by implementing lazy loading and WebP compression (Z).'
      }
    ],
    stepByStep: [
      '1. Map each resume project to a STAR story with verified metrics.',
      '2. Prepare clear technical rationales: Why did you choose React vs Vanilla JS? Why PostgreSQL vs MongoDB?',
      '3. Rehearse the 2-minute elevator pitch under a timer.',
      '4. Prepare 2-3 thoughtful questions for the interviewer regarding engineering culture and tech stack.'
    ],
    codeExamples: [],
    workedExamples: [
      {
        title: 'STAR Behavioral Story Response Example',
        problem: 'Interviewer asks: "Tell me about a time you resolved a difficult technical bug in a team project."',
        approach: 'Apply Situation (dashboard API latency was 1.8s), Task (improve latency under 500ms), Action (analyzed query execution plan, added composite index, introduced Redis cache), Result (latency dropped to 240ms, an 86% improvement).',
        solution: 'Answers question concisely in 90 seconds highlighting personal engineering ownership.'
      }
    ],
    commonMistakes: [
      'Speaking in generic terms without explaining YOUR specific individual contribution (using "we" exclusively instead of "I").',
      'Listing technologies on your resume that you cannot explain the internal workings of.',
      'Not quantifying results with numbers, percentages, or concrete metrics.'
    ],
    interviewTips: [
      'Spend 60% of your STAR response time on the Action and Result stages.',
      'Always have a polite, curious question ready when asked: "Do you have any questions for us?"'
    ],
    practiceGuidance: [
      'Write out 4 STAR stories: (1) Technical Challenge, (2) Team Conflict, (3) Innovation, (4) Failure & Learning',
      'Record your elevator pitch on video and evaluate clarity and pacing'
    ],
    quickRecap: [
      'STAR: Situation, Task, Action, Result.',
      'Quantify project outcomes with concrete impact numbers and percentages.',
      'State clear technical justifications for every architecture and technology choice.'
    ],
    keyTakeaways: [
      'Focus heavily on individual Action and measurable Result',
      'Prepare XYZ formula bullet points for every project'
    ],
    placementRelevance: 'HR and Technical Manager rounds evaluate your problem-solving maturity and communication skills using behavioral questions.',
    domain: 'resume_interview'
  },

  // Development - REST APIs
  'rest_apis': {
    title: 'RESTful API Architecture & HTTP Semantics',
    subtitle: 'Resource URIs, HTTP Verbs, Idempotency, Status Codes & Statelessness',
    overview: 'REST APIs standardize client-server communication using HTTP protocols, resource URIs, standardized HTTP methods, and status codes.',
    learningObjectives: [
      'Understand idempotency across GET, POST, PUT, PATCH, and DELETE',
      'Apply standard HTTP status codes (2xx, 3xx, 4xx, 5xx)',
      'Design resource-oriented RESTful endpoints'
    ],
    concepts: [
      {
        name: 'HTTP Method Semantics & Idempotency',
        explanation: 'GET (safe/idempotent read), POST (non-idempotent create), PUT (idempotent full replace), PATCH (partial update), DELETE (idempotent remove).',
        intuition: 'Calling an idempotent operation N times produces the exact same server resource state as calling it once.',
        example: 'PUT /users/123 with full payload sets exact state regardless of how many times it retries.'
      }
    ],
    diagrams: [],
    patterns: [],
    stepByStep: ['1. Design resource-oriented URIs using plural nouns (/api/v1/tasks).', '2. Map CRUD operations to HTTP methods.', '3. Return appropriate status codes and error payloads.'],
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
    commonMistakes: ['Using verbs in URIs (/api/deleteUser instead of DELETE /api/users/123)'],
    interviewTips: ['Differentiate 401 Unauthorized (Unauthenticated) vs 403 Forbidden (Unauthorized permissions).'],
    practiceGuidance: ['Design a complete REST API schema for an e-commerce platform'],
    quickRecap: ['PUT is idempotent; POST is non-idempotent.'],
    keyTakeaways: ['Stateless architecture enables seamless horizontal scaling'],
    placementRelevance: 'API design is evaluated across all backend and full-stack technical rounds.',
    domain: 'rest_apis'
  },

  // Aptitude
  'aptitude': {
    title: 'Aptitude & Quantitative Problem Solving',
    subtitle: 'Time & Work, Speed & Distance, Percentages & Probability Shortcuts',
    overview: 'Quantitative aptitude tests mathematical problem-solving speed, numerical reasoning, and logical deduction in initial company placement screening rounds.',
    learningObjectives: [
      'Solve Time and Work problems using unitary and LCM methods',
      'Calculate Relative Speed and Distance conversions (km/h to m/s)',
      'Apply percentage profit/loss and probability shortcut formulas'
    ],
    concepts: [
      {
        name: 'Time and Work Equations',
        explanation: 'If Person A finishes work in X days, 1 day work = 1/X. Combined days = (A * B) / (A + B).',
        intuition: 'Work is additive in terms of rates (units of work per day).',
        example: 'A takes 6 days, B takes 12 days. Combined = (6 * 12) / 18 = 4 days.'
      }
    ],
    diagrams: [],
    patterns: [],
    stepByStep: ['1. Normalize units -> 2. Formulate rate equation -> 3. Simplify fractions -> 4. Check bounds.'],
    codeExamples: [
      {
        title: 'Time & Work Formula Shortcut',
        language: 'javascript',
        code: `const daysA = 6, daysB = 12;
const combinedDays = (daysA * daysB) / (daysA + daysB); // 4 days`,
        explanation: 'Calculates combined duration.',
        complexity: { time: 'O(1)', space: 'O(1)' }
      }
    ],
    workedExamples: [],
    commonMistakes: ['Forgetting to multiply km/h by 5/18 when converting to m/s.'],
    interviewTips: ['Use LCM of given days to assign a total integer work unit, making arithmetic fast.'],
    practiceGuidance: ['Solve 10 problems each on Time & Work, Speed & Distance, and Percentages'],
    quickRecap: ['Combined days for two workers = (A * B) / (A + B).'],
    keyTakeaways: ['Convert km/h to m/s by multiplying with 5/18'],
    placementRelevance: 'Campus placement and off-campus recruitment tests use aptitude as the first filtering round.',
    domain: 'aptitude'
  },

  // System Design
  'system_design': {
    title: 'System Design & High-Level Scalability',
    subtitle: 'Horizontal Scaling, CAP Theorem, Caching & Load Balancing',
    overview: 'System Design evaluations test how to architect scalable, resilient, distributed software systems handling millions of users and high throughput.',
    learningObjectives: [
      'Master horizontal vs vertical scaling architecture trade-offs',
      'Apply the CAP theorem during distributed network partitions',
      'Design caching layers using Redis with Cache-Aside pattern'
    ],
    concepts: [
      {
        name: 'Horizontal vs Vertical Scaling',
        explanation: 'Horizontal scaling (scale-out) adds more server nodes behind a load balancer; Vertical scaling (scale-up) adds CPU/RAM to a single server.',
        intuition: 'Vertical scaling has hardware limits and single points of failure; horizontal scaling allows virtually infinite scaling.',
        example: 'Stateless web application servers scaled horizontally with NGINX.'
      }
    ],
    diagrams: [
      {
        id: 'diag_sys_architecture',
        conceptName: 'Horizontal vs Vertical Scaling',
        title: 'Distributed Tiered Web Architecture',
        purpose: 'Visualizes client -> load balancer -> stateless app nodes -> cache -> db',
        type: 'architecture',
        description: 'Load Balancer distributes client traffic across horizontal App Servers.',
        elements: [
          { id: 'client', label: 'Clients (Web/Mobile)', sublabel: 'HTTPS Requests' },
          { id: 'lb', label: 'Load Balancer (NGINX / ALB)', sublabel: 'Round-Robin / Least Connections', highlight: true },
          { id: 'app1', label: 'App Server 1', sublabel: 'Stateless Node' },
          { id: 'app2', label: 'App Server 2', sublabel: 'Stateless Node' },
          { id: 'cache', label: 'Redis Cache', sublabel: 'Sub-millisecond read cache', highlight: true },
          { id: 'db', label: 'Primary DB / Replicas', sublabel: 'Persistent Storage' }
        ],
        connections: [
          { from: 'client', to: 'lb', label: 'Requests' },
          { from: 'lb', to: 'app1', label: 'Balanced load' },
          { from: 'lb', to: 'app2', label: 'Balanced load' },
          { from: 'app1', to: 'cache', label: 'Cache-Aside' },
          { from: 'app1', to: 'db', label: 'Read/Write' }
        ],
        steps: []
      }
    ],
    patterns: [],
    stepByStep: ['1. Clarify requirements & scale -> 2. High-level diagram -> 3. Deep-dive into bottlenecks.'],
    codeExamples: [],
    workedExamples: [],
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
      domain: domain
    };
  }
  return null;
}

/**
 * Generates a stable fingerprint cache key for a task's study material.
 */
export function getStudyMaterialCacheKey(taskContext = {}) {
  const taskId = taskContext.taskId || taskContext.id || '';
  const taskTitle = taskContext.taskTitle || taskContext.taskName || taskContext.name || '';
  const topic = taskContext.roadmapTopic || taskContext.topic || '';
  const desc = taskContext.taskDescription || taskContext.description || '';
  const objectives = Array.isArray(taskContext.learningObjectives)
    ? taskContext.learningObjectives.join(',')
    : (taskContext.learningObjectives || '');
  
  return `study_${taskId}_${taskTitle}_${topic}_${desc.slice(0, 30)}_${objectives.slice(0, 30)}`.trim().toLowerCase().replace(/\s+/g, '_');
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
