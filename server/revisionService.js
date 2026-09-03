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
  // DSA - Arrays & Two Pointers / Kadane / Sliding Window / Prefix Sum
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
      correctAnswer: 0,
      correctAnswerText: 'Time: O(N), Space: O(1)',
      explanation: "Kadane's algorithm solves maximum subarray in a single pass O(N) by maintaining current running sum and max sum in O(1) auxiliary space.",
      testedSubconcept: 'Kadane Complexity'
    },
    {
      id: 'q_arr_2',
      type: 'code_output',
      question: 'What is the output of this Two Pointers traversal logic on sorted array [2, 7, 11, 15] targeting sum 9?',
      codeSnippet: 'let left = 0, right = arr.length - 1;\nwhile(left < right) {\n  let sum = arr[left] + arr[right];\n  if (sum === target) return [left, right];\n  else if (sum < target) left++;\n  else right--;\n}',
      options: ['[0, 1]', '[0, 3]', '[1, 2]', '[0, 2]'],
      correctAnswer: 0,
      correctAnswerText: '[0, 1]',
      explanation: 'At left=0 (val 2) and right=3 (val 15), sum=17 > 9 so right becomes 2 (val 11). Sum=13 > 9 so right becomes 1 (val 7). At [0, 1], 2+7=9.',
      testedSubconcept: 'Two Pointer Tracing'
    },
    {
      id: 'q_arr_3',
      type: 'mcq',
      question: "In the Two Pointers technique on a sorted array, why does moving the 'left' pointer forward increase the pair sum?",
      options: [
        'Because the array elements are sorted in non-decreasing order (arr[left+1] >= arr[left])',
        'Because the right pointer automatically decreases',
        'Because arrays only hold positive integers',
        'Because two pointers requires hash maps'
      ],
      correctAnswer: 0,
      correctAnswerText: 'Because the array elements are sorted in non-decreasing order (arr[left+1] >= arr[left])',
      explanation: 'Because the array is sorted in ascending order, advancing the left index guarantees the new element is greater than or equal to the previous element.',
      testedSubconcept: 'Two Pointer Monotonicity'
    },
    {
      id: 'q_arr_4',
      type: 'mcq',
      question: "How must Kadane's algorithm be initialized when all numbers in the array are strictly negative (e.g. [-5, -2, -8])?",
      options: [
        'Initialize max_sum = arr[0] (or -Infinity) and current_sum = arr[0]',
        'Initialize max_sum = 0 and return 0',
        'Add all negative numbers together',
        'Sort the array first'
      ],
      correctAnswer: 0,
      correctAnswerText: 'Initialize max_sum = arr[0] (or -Infinity) and current_sum = arr[0]',
      explanation: 'Initializing with 0 would incorrectly return 0 for an all-negative array instead of the maximum single negative element (e.g. -2).',
      testedSubconcept: 'All-Negative Edge Cases'
    },
    {
      id: 'q_arr_5',
      type: 'mcq',
      question: 'Which technique is optimal for range sum queries on an immutable array in O(1) query time after O(N) preprocessing?',
      options: ['Prefix Sum Array', 'Binary Search', 'Sliding Window', 'Dynamic Programming Matrix'],
      correctAnswer: 0,
      correctAnswerText: 'Prefix Sum Array',
      explanation: 'A prefix sum array prefix[i] = prefix[i-1] + arr[i] enables any range sum query (L, R) in O(1) via prefix[R] - prefix[L-1].',
      testedSubconcept: 'Prefix Sums'
    }
  ],

  // DSA - Linked Lists
  'linked_lists': [
    {
      id: 'q_ll_1',
      type: 'mcq',
      question: "What is the primary algorithm used to detect a cycle in a Singly Linked List in O(N) time and O(1) memory?",
      options: [
        "Floyd's Cycle-Finding Algorithm (Fast & Slow Pointers)",
        "Depth-First Search with an adjacency list",
        "Binary Search over memory pointers",
        "Kadane's pointer algorithm"
      ],
      correctAnswer: 0,
      correctAnswerText: "Floyd's Cycle-Finding Algorithm (Fast & Slow Pointers)",
      explanation: "Floyd's Tortoise and Hare uses two pointers moving at speeds of 1 and 2 steps. If a cycle exists, fast meets slow in O(N) time and O(1) space.",
      testedSubconcept: 'Cycle Detection'
    },
    {
      id: 'q_ll_2',
      type: 'code_output',
      question: 'When reversing a singly linked list iteratively (1 -> 2 -> 3 -> null), which pointer sequence correctly updates current node pointers without losing the rest of the list?',
      codeSnippet: 'let nextNode = curr.next;\ncurr.next = prev;\nprev = curr;\ncurr = nextNode;',
      options: [
        'Save curr.next in temporary variable before rewiring curr.next to prev',
        'Rewire curr.next to prev first, then read curr.next',
        'Set prev = curr before rewiring curr.next',
        'Set curr = curr.next without a temporary pointer'
      ],
      correctAnswer: 0,
      correctAnswerText: 'Save curr.next in temporary variable before rewiring curr.next to prev',
      explanation: 'Saving nextNode = curr.next prevents losing the reference to the remaining unreversed chain when curr.next is pointed backwards to prev.',
      testedSubconcept: 'Iterative List Reversal'
    },
    {
      id: 'q_ll_3',
      type: 'mcq',
      question: 'What is the time complexity of finding the middle element of a linked list of length N using the Fast and Slow pointer technique?',
      options: [
        'Time: O(N), Space: O(1)',
        'Time: O(N log N), Space: O(1)',
        'Time: O(N²), Space: O(N)',
        'Time: O(1), Space: O(N)'
      ],
      correctAnswer: 0,
      correctAnswerText: 'Time: O(N), Space: O(1)',
      explanation: 'Slow moves 1 step while fast moves 2 steps in a single pass O(N). When fast reaches the end, slow is at the middle in O(1) auxiliary space.',
      testedSubconcept: 'Middle Element Detection'
    },
    {
      id: 'q_ll_4',
      type: 'mcq',
      question: 'Why is inserting or deleting an element at the beginning (head) of a Linked List O(1), while in an Array it is O(N)?',
      options: [
        'Linked List only updates head pointer; Arrays must shift all N elements in contiguous memory',
        'Arrays are stored on disk; Linked lists are in CPU registers',
        'Linked Lists do not support indexing',
        'Array memory cannot be modified'
      ],
      correctAnswer: 0,
      correctAnswerText: 'Linked List only updates head pointer; Arrays must shift all N elements in contiguous memory',
      explanation: 'Inserting at head of linked list simply points new_node.next = head and head = new_node in O(1). Arrays require shifting every element right by 1 index.',
      testedSubconcept: 'Array vs Linked List Tradeoffs'
    },
    {
      id: 'q_ll_5',
      type: 'mcq',
      question: 'In a Doubly Linked List, what is the main advantage over a Singly Linked List during node deletion when given a pointer to the target node directly?',
      options: [
        'Deletion is O(1) because node.prev allows rewiring without traversing from head',
        'Doubly linked lists require 50% less memory',
        'Doubly linked lists enable binary search in O(log N)',
        'Doubly linked lists cannot have cycles'
      ],
      correctAnswer: 0,
      correctAnswerText: 'Deletion is O(1) because node.prev allows rewiring without traversing from head',
      explanation: 'With a pointer to the target node in a doubly linked list, node.prev.next = node.next and node.next.prev = node.prev in O(1) time.',
      testedSubconcept: 'Doubly Linked List Deletion'
    }
  ],

  // DSA - Binary Search
  'binary_search': [
    {
      id: 'q_bs_1',
      type: 'mcq',
      question: 'What is the time complexity of searching an element in a sorted array of size N using Binary Search?',
      options: ['O(log N)', 'O(N)', 'O(N log N)', 'O(1)'],
      correctAnswer: 0,
      correctAnswerText: 'O(log N)',
      explanation: 'Binary Search halves the search space in each iteration, resulting in O(log₂ N) time complexity.',
      testedSubconcept: 'Binary Search Complexity'
    },
    {
      id: 'q_bs_2',
      type: 'mcq',
      question: 'Why do we compute mid as `low + Math.floor((high - low) / 2)` instead of `(low + high) / 2` in typed languages?',
      options: [
        'To prevent integer overflow when (low + high) exceeds maximum integer boundary limits',
        'To make CPU instruction pipelining faster',
        'To support floating point arrays',
        'Because standard division is not supported in binary search'
      ],
      correctAnswer: 0,
      correctAnswerText: 'To prevent integer overflow when (low + high) exceeds maximum integer boundary limits',
      explanation: 'If low and high are large numbers near 2^31 - 1, low + high can overflow to negative numbers. `low + (high - low)/2` guarantees arithmetic safety.',
      testedSubconcept: 'Integer Overflow Prevention'
    },
    {
      id: 'q_bs_3',
      type: 'mcq',
      question: 'Can Binary Search be applied to monotonic answer spaces (e.g. minimum capacity, book allocation) rather than indexed arrays?',
      options: [
        'Yes, Binary Search on Answer Space works whenever the feasibility predicate function is monotonic',
        'No, Binary Search only works on sorted in-memory arrays',
        'No, answer spaces always require Dynamic Programming',
        'Only if the array contains prime numbers'
      ],
      correctAnswer: 0,
      correctAnswerText: 'Yes, Binary Search on Answer Space works whenever the feasibility predicate function is monotonic',
      explanation: 'Binary Search on Answer Space searches over a monotonic range of candidate answers using a boolean validation check (e.g. FFFTTT).',
      testedSubconcept: 'Binary Search on Answer'
    },
    {
      id: 'q_bs_4',
      type: 'mcq',
      question: 'In a rotated sorted array [4, 5, 6, 7, 0, 1, 2], what condition determines if the left half [low...mid] is normally sorted?',
      options: [
        'arr[low] <= arr[mid]',
        'arr[mid] <= arr[high]',
        'arr[low] > arr[high]',
        'arr[mid] === target'
      ],
      correctAnswer: 0,
      correctAnswerText: 'arr[low] <= arr[mid]',
      explanation: 'If arr[low] <= arr[mid], the subarray from low to mid contains no rotation pivot and is guaranteed to be strictly sorted in increasing order.',
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
      correctAnswer: 0,
      correctAnswerText: 'Monotonicity (e.g., False for all x < target, True for all x >= target)',
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
      correctAnswer: 0,
      correctAnswerText: 'Mutual Exclusion, Hold & Wait, No Preemption, Circular Wait',
      explanation: 'A deadlock can occur if and only if all four Coffman conditions hold simultaneously.',
      testedSubconcept: 'Coffman Deadlock Conditions'
    },
    {
      id: 'q_os_2',
      type: 'mcq',
      question: 'What is the primary difference between a Process and a Thread in modern Operating Systems?',
      options: [
        'Processes have separate virtual address spaces; threads in the same process share code, data, and heap memory',
        'Processes run in kernel mode; threads run in user mode',
        'Threads cannot execute concurrently; processes execute concurrently',
        'Processes do not have a PID'
      ],
      correctAnswer: 0,
      correctAnswerText: 'Processes have separate virtual address spaces; threads in the same process share code, data, and heap memory',
      explanation: 'A process is an isolated execution unit with its own virtual memory space. Threads share memory within a process, enabling lightweight context switching.',
      testedSubconcept: 'Process vs Thread Architecture'
    },
    {
      id: 'q_os_3',
      type: 'mcq',
      question: 'What is the key difference between a Mutex and a Counting Semaphore?',
      options: [
        'A Mutex has an ownership mechanism (only the locking thread can unlock); a Semaphore can be signaled by any thread',
        'A Semaphore is strictly faster on CPU registers',
        'A Mutex allows multiple threads to enter simultaneously',
        'Semaphores cannot prevent race conditions'
      ],
      correctAnswer: 0,
      correctAnswerText: 'A Mutex has an ownership mechanism (only the locking thread can unlock); a Semaphore can be signaled by any thread',
      explanation: 'Mutexes enforce locking thread ownership, while counting semaphores act as signaling mechanisms for resource counts.',
      testedSubconcept: 'Mutex vs Semaphore'
    },
    {
      id: 'q_os_4',
      type: 'mcq',
      question: 'What is Thrashing in virtual memory management?',
      options: [
        'When the OS spends more time swapping pages in/out of disk than executing CPU instructions',
        'When CPU temperature exceeds thermal limits',
        'When a process is forcibly killed due to out of memory (OOM)',
        'When two threads access the same memory location simultaneously'
      ],
      correctAnswer: 0,
      correctAnswerText: 'When the OS spends more time swapping pages in/out of disk than executing CPU instructions',
      explanation: 'Thrashing occurs when the active working set of pages exceeds available physical RAM, causing continuous page faults and disk I/O.',
      testedSubconcept: 'Virtual Memory & Thrashing'
    },
    {
      id: 'q_os_5',
      type: 'mcq',
      question: 'How does the OS prevent starvation in Priority Scheduling?',
      options: [
        'Using Aging: gradually increasing the priority of processes that wait for a long time',
        'By killing lower priority processes',
        'By disabling interrupts during execution',
        'By switching to First-Come First-Served scheduling'
      ],
      correctAnswer: 0,
      correctAnswerText: 'Using Aging: gradually increasing the priority of processes that wait for a long time',
      explanation: 'Aging ensures that lower priority processes eventually gain high enough priority to be scheduled and execute.',
      testedSubconcept: 'CPU Scheduling & Aging'
    }
  ],

  // Core CS - DBMS
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
      correctAnswer: 0,
      correctAnswerText: 'Atomicity, Consistency, Isolation, Durability',
      explanation: 'ACID guarantees database transaction reliability: all-or-nothing (Atomicity), valid state (Consistency), independent execution (Isolation), and persistence (Durability).',
      testedSubconcept: 'ACID Properties'
    },
    {
      id: 'q_db_2',
      type: 'mcq',
      question: 'Why can a database table have only ONE Clustered Index?',
      options: [
        'Because the clustered index defines the physical sorting order of actual data rows on disk',
        'Because SQL syntax restricts it to primary keys only',
        'Because multiple indexes cause disk corruption',
        'Because secondary indexes are faster than clustered indexes'
      ],
      correctAnswer: 0,
      correctAnswerText: 'Because the clustered index defines the physical sorting order of actual data rows on disk',
      explanation: 'Physical rows on disk can only be arranged in one physical sorted sequence, hence a table can only have one clustered index.',
      testedSubconcept: 'Clustered vs Non-Clustered Indexes'
    },
    {
      id: 'q_db_3',
      type: 'mcq',
      question: 'In relational database transactions, what concurrency anomaly does the REPEATABLE READ isolation level prevent?',
      options: [
        'Non-Repeatable Reads and Dirty Reads',
        'All Phantom Reads in standard ANSI SQL',
        'Network connection timeouts',
        'Write skew in all distributed partition topologies'
      ],
      correctAnswer: 0,
      correctAnswerText: 'Non-Repeatable Reads and Dirty Reads',
      explanation: 'REPEATABLE READ guarantees that if a transaction re-reads a row, it sees identical values without modifications made by other committed transactions.',
      testedSubconcept: 'Transaction Isolation Levels'
    },
    {
      id: 'q_db_4',
      type: 'mcq',
      question: 'What is the primary objective of Database Normalization (e.g. 1NF, 2NF, 3NF, BCNF)?',
      options: [
        'To reduce data redundancy and eliminate insertion, update, and deletion anomalies',
        'To maximize disk space consumption',
        'To merge all database tables into a single large table',
        'To disable primary key constraints'
      ],
      correctAnswer: 0,
      correctAnswerText: 'To reduce data redundancy and eliminate insertion, update, and deletion anomalies',
      explanation: 'Normalization organizes relational tables to eliminate redundant data and avoid data modification anomalies by enforcing functional dependencies.',
      testedSubconcept: 'Database Normalization'
    },
    {
      id: 'q_db_5',
      type: 'mcq',
      question: 'Why are B+ Trees preferred over Binary Search Trees or Hash Tables for database indexing?',
      options: [
        'B+ Trees have high fanout minimizing disk I/O seek operations and linked leaf nodes for fast range queries',
        'B+ Trees require zero disk storage',
        'Hash tables cannot store numeric integers',
        'Binary search trees are faster on disk'
      ],
      correctAnswer: 0,
      correctAnswerText: 'B+ Trees have high fanout minimizing disk I/O seek operations and linked leaf nodes for fast range queries',
      explanation: 'High branching factor keeps tree depth shallow (2-3 disk reads) while sequential leaf pointers enable efficient range scans (e.g. BETWEEN, >, <).',
      testedSubconcept: 'B+ Tree Indexing'
    }
  ],

  // Core CS - SQL
  'sql': [
    {
      id: 'q_sql_1',
      type: 'mcq',
      question: 'What is the key difference between INNER JOIN and LEFT OUTER JOIN in SQL?',
      options: [
        'INNER JOIN returns only matching rows from both tables; LEFT JOIN returns all rows from left table plus matched rows from right table (with NULLs for unmatched)',
        'INNER JOIN returns all rows from right table only',
        'LEFT JOIN is only used for temporary tables',
        'INNER JOIN creates a Cartesian product by default'
      ],
      correctAnswer: 0,
      correctAnswerText: 'INNER JOIN returns only matching rows from both tables; LEFT JOIN returns all rows from left table plus matched rows from right table (with NULLs for unmatched)',
      explanation: 'INNER JOIN filters out rows that lack matching keys in both tables. LEFT OUTER JOIN retains every record from the left table and inserts NULL for missing right-table columns.',
      testedSubconcept: 'SQL Joins'
    },
    {
      id: 'q_sql_2',
      type: 'mcq',
      question: 'What is the key difference between RANK() and DENSE_RANK() in SQL window functions?',
      options: [
        'RANK() leaves gaps after ties (e.g. 1, 2, 2, 4); DENSE_RANK() does not leave gaps (e.g. 1, 2, 2, 3)',
        'DENSE_RANK() only works on unique values',
        'RANK() is an aggregate function while DENSE_RANK() is a scalar function',
        'There is no difference'
      ],
      correctAnswer: 0,
      correctAnswerText: 'RANK() leaves gaps after ties (e.g. 1, 2, 2, 4); DENSE_RANK() does not leave gaps (e.g. 1, 2, 2, 3)',
      explanation: 'RANK() skips rank values following duplicates, whereas DENSE_RANK() produces consecutive rank numbers.',
      testedSubconcept: 'SQL Window Functions'
    },
    {
      id: 'q_sql_3',
      type: 'mcq',
      question: 'Which SQL clause is used to filter aggregated group results produced by the GROUP BY clause?',
      options: ['HAVING', 'WHERE', 'ORDER BY', 'LIMIT'],
      correctAnswer: 0,
      correctAnswerText: 'HAVING',
      explanation: 'WHERE filters individual records before aggregation; HAVING filters aggregated groups after GROUP BY (e.g. `HAVING COUNT(*) > 5`).',
      testedSubconcept: 'HAVING vs WHERE'
    },
    {
      id: 'q_sql_4',
      type: 'mcq',
      question: 'What is the purpose of the `COALESCE(column, default_value)` function in SQL?',
      options: [
        'Returns the first non-null value in a list of arguments',
        'Calculates the cumulative sum of a column',
        'Converts strings to uppercase',
        'Deletes null rows from disk'
      ],
      correctAnswer: 0,
      correctAnswerText: 'Returns the first non-null value in a list of arguments',
      explanation: 'COALESCE evaluates arguments in order and returns the current value of the first expression that does not evaluate to NULL.',
      testedSubconcept: 'COALESCE & NULL Handling'
    },
    {
      id: 'q_sql_5',
      type: 'mcq',
      question: 'In SQL window functions, what clause partitions the result set into subsets before applying the window calculation?',
      options: ['PARTITION BY', 'GROUP BY', 'DISTINCT BY', 'SPLIT BY'],
      correctAnswer: 0,
      correctAnswerText: 'PARTITION BY',
      explanation: 'PARTITION BY divides query rows into groups (partitions) over which the window function operates independently.',
      testedSubconcept: 'PARTITION BY Clause'
    }
  ],

  // Core CS - Computer Networks
  'computer_networks': [
    {
      id: 'q_net_1',
      type: 'mcq',
      question: 'What is the correct packet sequence in the TCP 3-Way Handshake connection establishment?',
      options: [
        'SYN → SYN-ACK → ACK',
        'ACK → SYN → SYN-ACK',
        'SYN → ACK → FIN',
        'CONNECT → ACCEPT → READY'
      ],
      correctAnswer: 0,
      correctAnswerText: 'SYN → SYN-ACK → ACK',
      explanation: 'The client sends SYN (synchronize), server responds with SYN-ACK (acknowledge SYN), and client replies with ACK (acknowledge server SYN).',
      testedSubconcept: 'TCP 3-Way Handshake'
    },
    {
      id: 'q_net_2',
      type: 'mcq',
      question: 'At which OSI layer do Routers primarily operate, using IP addresses to forward packets across networks?',
      options: [
        'Network Layer (Layer 3)',
        'Data Link Layer (Layer 2)',
        'Transport Layer (Layer 4)',
        'Application Layer (Layer 7)'
      ],
      correctAnswer: 0,
      correctAnswerText: 'Network Layer (Layer 3)',
      explanation: 'Routers operate at the Network Layer (Layer 3) to route packets based on logical IP addressing. Switches operate at Layer 2 (MAC addresses).',
      testedSubconcept: 'OSI Reference Model'
    },
    {
      id: 'q_net_3',
      type: 'mcq',
      question: 'What is the primary difference between TCP and UDP transport protocols?',
      options: [
        'TCP is connection-oriented, reliable, and ordered; UDP is connectionless, faster, with no delivery guarantee',
        'UDP supports encryption while TCP does not',
        'TCP operates on Layer 3; UDP operates on Layer 4',
        'TCP is only used for video streaming'
      ],
      correctAnswer: 0,
      correctAnswerText: 'TCP is connection-oriented, reliable, and ordered; UDP is connectionless, faster, with no delivery guarantee',
      explanation: 'TCP guarantees delivery, ordering, and retransmission with flow control overhead. UDP offers lightweight, fast delivery suitable for live streaming and gaming.',
      testedSubconcept: 'TCP vs UDP'
    },
    {
      id: 'q_net_4',
      type: 'mcq',
      question: 'What is the function of the Domain Name System (DNS) in computer networking?',
      options: [
        'Translates human-readable domain names (e.g. google.com) into numerical IP addresses',
        'Encrypts HTTP traffic into HTTPS',
        'Assigns MAC addresses to local network interfaces',
        'Balances HTTP requests across web servers'
      ],
      correctAnswer: 0,
      correctAnswerText: 'Translates human-readable domain names (e.g. google.com) into numerical IP addresses',
      explanation: 'DNS acts as the internet directory, resolving human-friendly domain names to machine-routable IP addresses.',
      testedSubconcept: 'DNS Resolution'
    },
    {
      id: 'q_net_5',
      type: 'mcq',
      question: 'What security enhancement does HTTPS provide over plain HTTP?',
      options: [
        'TLS/SSL cryptographic encryption, data integrity verification, and server authentication',
        'Automatic SQL injection prevention',
        'Faster transmission speed by eliminating TCP handshakes',
        'Infinite browser cache retention'
      ],
      correctAnswer: 0,
      correctAnswerText: 'TLS/SSL cryptographic encryption, data integrity verification, and server authentication',
      explanation: 'HTTPS wraps HTTP traffic in TLS/SSL, encrypting packet payloads to protect against eavesdropping, tampering, and man-in-the-middle attacks.',
      testedSubconcept: 'HTTPS & TLS'
    }
  ],

  // Development - React Basics
  'react': [
    {
      id: 'q_react_1',
      type: 'mcq',
      question: 'In React, what is the purpose of the dependency array in the `useEffect` hook?',
      options: [
        'Specifies state/prop values that trigger re-execution of the effect when they change',
        'Declares imported third-party npm packages',
        'Defines the component CSS stylesheets',
        'Stores JSX child nodes'
      ],
      correctAnswer: 0,
      correctAnswerText: 'Specifies state/prop values that trigger re-execution of the effect when they change',
      explanation: 'When dependencies in the array change across renders, React runs the effect. An empty array [] runs the effect only once on initial mount.',
      testedSubconcept: 'useEffect Hook'
    },
    {
      id: 'q_react_2',
      type: 'mcq',
      question: 'Why must state updates never be mutated directly in React (e.g. `state.count = 5`)?',
      options: [
        'Direct mutations do not trigger a component re-render because React checks shallow object reference changes',
        'Direct mutations crash the JavaScript runtime engine',
        'React state is read-only in memory hardware',
        'Direct mutations bypass Redux actions'
      ],
      correctAnswer: 0,
      correctAnswerText: 'Direct mutations do not trigger a component re-render because React checks shallow object reference changes',
      explanation: 'React relies on immutable state updates (setter functions) to detect reference equality changes and schedule Virtual DOM reconciliation.',
      testedSubconcept: 'State Immutability'
    },
    {
      id: 'q_react_3',
      type: 'mcq',
      question: 'How does React optimize DOM updates using the Virtual DOM?',
      options: [
        'Calculates a diff between previous and current Virtual DOM trees and applies only minimal batched changes to the real DOM',
        'Replaces the entire browser DOM tree on every state update',
        'Translates JSX directly into native C++ instructions',
        'Disables CSS recalculations in the browser'
      ],
      correctAnswer: 0,
      correctAnswerText: 'Calculates a diff between previous and current Virtual DOM trees and applies only minimal batched changes to the real DOM',
      explanation: 'React creates an in-memory Virtual DOM tree, computes diffs with the reconciliation algorithm, and performs targeted real DOM updates efficiently.',
      testedSubconcept: 'Virtual DOM & Reconciliation'
    },
    {
      id: 'q_react_4',
      type: 'mcq',
      question: 'What is the purpose of the cleanup function returned from a `useEffect` callback?',
      options: [
        'Cleans up subscriptions, timers, or event listeners before the component unmounts or before the effect re-runs',
        'Deletes the component from local storage',
        'Resets state variables to initial default values',
        'Cleans browser cookies'
      ],
      correctAnswer: 0,
      correctAnswerText: 'Cleans up subscriptions, timers, or event listeners before the component unmounts or before the effect re-runs',
      explanation: 'Returning a cleanup function prevents memory leaks by unsubscribing from event listeners, clearing setIntervals, or cancelling async requests.',
      testedSubconcept: 'Effect Cleanup'
    },
    {
      id: 'q_react_5',
      type: 'mcq',
      question: 'What is the difference between `props` and `state` in React component architecture?',
      options: [
        'Props are immutable inputs passed from parent to child; State is mutable data managed locally within the component',
        'Props are stored in database; State is stored in URL params',
        'Props can be changed by child components directly; State cannot',
        'There is no difference between props and state'
      ],
      correctAnswer: 0,
      correctAnswerText: 'Props are immutable inputs passed from parent to child; State is mutable data managed locally within the component',
      explanation: 'Props provide external configuration flowing downwards (unidirectional data flow), while state represents private internal component state.',
      testedSubconcept: 'Props vs State'
    }
  ],

  // Development - REST APIs
  'rest_apis': [
    {
      id: 'q_rest_1',
      type: 'mcq',
      question: 'Which HTTP method is idempotent and used to replace an entire resource at a given URL?',
      options: ['PUT', 'POST', 'PATCH', 'OPTIONS'],
      correctAnswer: 0,
      correctAnswerText: 'PUT',
      explanation: 'PUT is idempotent (multiple identical requests have the exact same side-effect as a single request) and replaces the entire target resource.',
      testedSubconcept: 'HTTP Methods & Idempotency'
    },
    {
      id: 'q_rest_2',
      type: 'mcq',
      question: 'Which HTTP status code signifies that a new resource was successfully created on the server?',
      options: ['201 Created', '200 OK', '204 No Content', '304 Not Modified'],
      correctAnswer: 0,
      correctAnswerText: '201 Created',
      explanation: 'HTTP 201 indicates successful resource creation (typically in response to a POST request), often accompanied by a Location header.',
      testedSubconcept: 'HTTP Status Codes'
    },
    {
      id: 'q_rest_3',
      type: 'mcq',
      question: 'What does Statelessness mean in REST architectural constraints?',
      options: [
        'Each request from client to server must contain all information necessary to understand and process the request',
        'The server stores client session state in server memory',
        'The database must never persist user records',
        'All client requests must use HTTP GET'
      ],
      correctAnswer: 0,
      correctAnswerText: 'Each request from client to server must contain all information necessary to understand and process the request',
      explanation: 'Statelessness requires that no client session context is stored on the server between requests; authentication and context are sent per request (e.g. JWT tokens).',
      testedSubconcept: 'REST Stateless Constraint'
    },
    {
      id: 'q_rest_4',
      type: 'mcq',
      question: 'What is the difference between 401 Unauthorized and 403 Forbidden HTTP status codes?',
      options: [
        '401 means authentication is missing or invalid; 403 means authenticated user lacks permission to access the resource',
        '401 means server error; 403 means client error',
        '401 is only used for payment gateways',
        'There is no distinction'
      ],
      correctAnswer: 0,
      correctAnswerText: '401 means authentication is missing or invalid; 403 means authenticated user lacks permission to access the resource',
      explanation: '401 Unauthorized (Unauthenticated) asks for valid credentials; 403 Forbidden (Unauthorized) indicates credentials are known but access is refused.',
      testedSubconcept: '401 vs 403 Status'
    },
    {
      id: 'q_rest_5',
      type: 'mcq',
      question: 'What is the primary difference between PATCH and PUT HTTP methods in RESTful design?',
      options: [
        'PATCH applies partial modifications to a resource; PUT replaces the full resource representation',
        'PATCH is safe and readonly; PUT is destructive',
        'PATCH cannot accept JSON payloads',
        'PUT is only used for authentication'
      ],
      correctAnswer: 0,
      correctAnswerText: 'PATCH applies partial modifications to a resource; PUT replaces the full resource representation',
      explanation: 'PATCH updates specific fields of a resource without requiring the client to send the entire object payload.',
      testedSubconcept: 'PATCH vs PUT'
    }
  ],

  // Development - Git & GitHub
  'git_github': [
    {
      id: 'q_git_1',
      type: 'mcq',
      question: 'What is the primary difference between `git merge` and `git rebase`?',
      options: [
        'Merge creates a merge commit preserving full branch history; Rebase reapplies commits on top of another base, creating a linear history',
        'Rebase deletes old commits permanently; Merge stores commits on remote server only',
        'Merge can only be used on main branch; Rebase only on feature branches',
        'There is no difference'
      ],
      correctAnswer: 0,
      correctAnswerText: 'Merge creates a merge commit preserving full branch history; Rebase reapplies commits on top of another base, creating a linear history',
      explanation: 'Git merge joins branches with a dedicated merge commit. Git rebase rewrites project history by moving the base of a feature branch to the target tip.',
      testedSubconcept: 'Git Merge vs Rebase'
    },
    {
      id: 'q_git_2',
      type: 'mcq',
      question: 'What command is used to stage modified and newly created files to the Git staging index?',
      options: ['git add .', 'git commit -m "update"', 'git push origin main', 'git init'],
      correctAnswer: 0,
      correctAnswerText: 'git add .',
      explanation: '`git add .` stages all changes in the current directory, preparing them for the next commit snapshot.',
      testedSubconcept: 'Git Staging'
    },
    {
      id: 'q_git_3',
      type: 'mcq',
      question: 'What is the difference between `git fetch` and `git pull`?',
      options: [
        'git fetch downloads remote changes without merging; git pull fetches and immediately merges into current branch',
        'git fetch updates local commit history; git pull only updates tags',
        'git pull is only used on GitHub web interface',
        'git fetch requires repository administrator rights'
      ],
      correctAnswer: 0,
      correctAnswerText: 'git fetch downloads remote changes without merging; git pull fetches and immediately merges into current branch',
      explanation: '`git fetch` safely inspects remote changes without modifying working directory. `git pull` executes `git fetch` followed by `git merge`.',
      testedSubconcept: 'Fetch vs Pull'
    },
    {
      id: 'q_git_4',
      type: 'mcq',
      question: 'What does `git checkout -b feature/auth` (or `git switch -c feature/auth`) accomplish?',
      options: [
        'Creates a new branch named `feature/auth` and switches HEAD to it',
        'Deletes the `feature/auth` branch',
        'Merges `feature/auth` into main',
        'Rolls back the last commit'
      ],
      correctAnswer: 0,
      correctAnswerText: 'Creates a new branch named `feature/auth` and switches HEAD to it',
      explanation: 'The `-b` / `-c` flag creates a new branch pointer and switches the working branch in a single command.',
      testedSubconcept: 'Branch Creation'
    },
    {
      id: 'q_git_5',
      type: 'mcq',
      question: 'What is a Pull Request (PR) in collaborative GitHub development?',
      options: [
        'A proposed set of changes submitted for code review, automated testing, and discussion before merging into a target branch',
        'A command that forcibly downloads files to local storage',
        'A Git error when branches diverge',
        'A private key authentication certificate'
      ],
      correctAnswer: 0,
      correctAnswerText: 'A proposed set of changes submitted for code review, automated testing, and discussion before merging into a target branch',
      explanation: 'Pull Requests enable team members to review code diffs, run CI/CD checks, and approve changes prior to merging into production branches.',
      testedSubconcept: 'Pull Request Workflow'
    }
  ],

  // Aptitude & Quantitative Problem Solving
  'aptitude': [
    {
      id: 'q_apt_1',
      type: 'mcq',
      question: 'If Person A can complete a task in 6 days and Person B can complete it in 12 days, how many days will they take working together?',
      options: ['4 days', '3 days', '5 days', '9 days'],
      correctAnswer: 0,
      correctAnswerText: '4 days',
      explanation: 'Rate = 1/6 + 1/12 = 3/12 = 1/4 task per day. Total time = 1 / (1/4) = 4 days.',
      testedSubconcept: 'Time & Work'
    },
    {
      id: 'q_apt_2',
      type: 'mcq',
      question: 'A train traveling at 72 km/h crosses a 200-meter platform in 20 seconds. What is the length of the train?',
      options: ['200 meters', '160 meters', '240 meters', '300 meters'],
      correctAnswer: 0,
      correctAnswerText: '200 meters',
      explanation: 'Speed in m/s = 72 * (5/18) = 20 m/s. Total distance = Speed * Time = 20 * 20 = 400m. Train length = 400m - 200m platform = 200m.',
      testedSubconcept: 'Speed, Time & Distance'
    },
    {
      id: 'q_apt_3',
      type: 'mcq',
      question: 'If the price of an item increases by 25%, by what percentage must consumption be reduced to keep total expenditure constant?',
      options: ['20%', '25%', '15%', '30%'],
      correctAnswer: 0,
      correctAnswerText: '20%',
      explanation: 'Formula: [r / (100 + r)] * 100 = [25 / 125] * 100 = 1/5 * 100 = 20%.',
      testedSubconcept: 'Percentages & Expenditure'
    },
    {
      id: 'q_apt_4',
      type: 'mcq',
      question: 'What is the probability of getting a sum of 7 when rolling two fair 6-sided dice simultaneously?',
      options: ['1/6 (6/36)', '1/12 (3/36)', '1/9 (4/36)', '1/4 (9/36)'],
      correctAnswer: 0,
      correctAnswerText: '1/6 (6/36)',
      explanation: 'Pairs giving sum 7: (1,6), (2,5), (3,4), (4,3), (5,2), (6,1) = 6 favorable outcomes out of 36 total = 6/36 = 1/6.',
      testedSubconcept: 'Probability'
    },
    {
      id: 'q_apt_5',
      type: 'mcq',
      question: 'In how many different ways can the letters of the word "LEADER" be arranged?',
      options: ['360 ways', '720 ways', '120 ways', '480 ways'],
      correctAnswer: 0,
      correctAnswerText: '360 ways',
      explanation: '"LEADER" has 6 letters with "E" repeating 2 times. Total permutations = 6! / 2! = 720 / 2 = 360.',
      testedSubconcept: 'Permutations & Combinations'
    }
  ],

  // Interview & Resume Preparation
  'resume_interview': [
    {
      id: 'q_res_1',
      type: 'mcq',
      question: 'What does the STAR framework stand for in behavioral and technical placement interviews?',
      options: [
        'Situation, Task, Action, Result',
        'Skills, Tools, Abilities, Roles',
        'Structure, Testing, Architecture, Review',
        'Summary, Timeline, Assessment, Revision'
      ],
      correctAnswer: 0,
      correctAnswerText: 'Situation, Task, Action, Result',
      explanation: 'STAR is the industry standard framework for answering behavioral interview questions: describe the Situation, Task objective, Action taken, and measurable Result.',
      testedSubconcept: 'STAR Framework'
    },
    {
      id: 'q_res_2',
      type: 'mcq',
      question: 'What is the most effective way to quantify project achievements on a Software Engineering resume?',
      options: [
        'Action Verb + Task Context + Measurable Metric (e.g. "Optimized SQL queries, reducing API latency by 45%")',
        'List all programming languages in alphabetical order',
        'Include full source code in appendix',
        'Write long paragraphs without bullet points'
      ],
      correctAnswer: 0,
      correctAnswerText: 'Action Verb + Task Context + Measurable Metric (e.g. "Optimized SQL queries, reducing API latency by 45%")',
      explanation: 'Strong resume bullet points use the XYZ formula (Accomplished [X] as measured by [Y], by doing [Z]) with quantifiable impact metrics.',
      testedSubconcept: 'Resume Impact Quantification'
    },
    {
      id: 'q_res_3',
      type: 'mcq',
      question: 'When presenting a technical full-stack project in an interview, what should you articulate first?',
      options: [
        'High-level architecture, problem statement, and key architectural choices before deep-diving into specific code blocks',
        'Every line of CSS styling',
        'The exact date the project was started',
        'Why third-party libraries are not needed'
      ],
      correctAnswer: 0,
      correctAnswerText: 'High-level architecture, problem statement, and key architectural choices before deep-diving into specific code blocks',
      explanation: 'Interviewers look for structured communication: start with the problem solved, system architecture diagram/tradeoffs, and then highlight technical challenges.',
      testedSubconcept: 'Project Presentation Structure'
    },
    {
      id: 'q_res_4',
      type: 'mcq',
      question: 'If you do not know the immediate optimal answer to an algorithmic interview problem, what is the best strategy?',
      options: [
        'Communicate your thought process, state a working brute-force solution, analyze its complexity, and collaborate on optimizing bottlenecks',
        'Stay completely silent until you have the final optimal solution',
        'Guess randomly without explaining your reasoning',
        'Ask the interviewer to solve the question for you'
      ],
      correctAnswer: 0,
      correctAnswerText: 'Communicate your thought process, state a working brute-force solution, analyze its complexity, and collaborate on optimizing bottlenecks',
      explanation: 'Technical interviews evaluate problem-solving thought process and communication. Starting with a clear baseline and explaining optimization paths is highly valued.',
      testedSubconcept: 'Interview Problem Solving Strategy'
    },
    {
      id: 'q_res_5',
      type: 'mcq',
      question: 'When answering "Tell me about yourself" in a technical interview, what should you focus on?',
      options: [
        'A concise 2-minute narrative highlighting education, core technical strengths, relevant project accomplishments, and placement aspirations',
        'A complete chronological history starting from primary school',
        'Personal hobbies unrelated to the software engineering role',
        'A list of all previous exam percentages'
      ],
      correctAnswer: 0,
      correctAnswerText: 'A concise 2-minute narrative highlighting education, core technical strengths, relevant project accomplishments, and placement aspirations',
      explanation: 'The introduction should be a targeted elevator pitch connecting your background, key technical skills, project wins, and passion for the target role.',
      testedSubconcept: 'Interview Introduction'
    }
  ],

  // System Design & Architecture
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
      correctAnswer: 0,
      correctAnswerText: 'Horizontal adds more machines/nodes; Vertical upgrades CPU/RAM on an existing machine',
      explanation: 'Horizontal scaling (scale-out) distributes load across multiple servers; vertical scaling (scale-up) increases single hardware capacity.',
      testedSubconcept: 'Scaling Architectures'
    },
    {
      id: 'q_sd_2',
      type: 'mcq',
      question: 'In the CAP Theorem for distributed systems, what does the theorem assert during a Network Partition (P)?',
      options: [
        'The system must choose between Consistency (C) and Availability (A)',
        'The system guarantees both Consistency and Availability simultaneously',
        'The system must shut down immediately',
        'Partition tolerance can be disabled via software config'
      ],
      correctAnswer: 0,
      correctAnswerText: 'The system must choose between Consistency (C) and Availability (A)',
      explanation: 'Network partitions are inevitable in distributed systems. When a partition occurs, the system must either return consistent data (CP) or remain available (AP).',
      testedSubconcept: 'CAP Theorem'
    },
    {
      id: 'q_sd_3',
      type: 'mcq',
      question: 'What is the primary benefit of Consistent Hashing in distributed cache clusters?',
      options: [
        'Minimizes the number of keys remapped when cache nodes are added or removed',
        'Encrypts cache payloads automatically',
        'Eliminates need for cache eviction algorithms',
        'Guarantees zero cache misses'
      ],
      correctAnswer: 0,
      correctAnswerText: 'Minimizes the number of keys remapped when cache nodes are added or removed',
      explanation: 'Consistent Hashing places nodes and keys on a virtual ring, remapping only K/N keys on node additions/removals rather than almost all keys with modulo hashing.',
      testedSubconcept: 'Consistent Hashing'
    },
    {
      id: 'q_sd_4',
      type: 'mcq',
      question: 'What caching strategy writes data simultaneously to both the cache and the backing database before returning success?',
      options: ['Write-Through Cache', 'Write-Back (Write-Behind) Cache', 'Cache-Aside (Lazy Loading)', 'Read-Through Cache'],
      correctAnswer: 0,
      correctAnswerText: 'Write-Through Cache',
      explanation: 'Write-through cache updates cache and DB synchronously, guaranteeing high data consistency at the cost of higher write latency.',
      testedSubconcept: 'Caching Strategies'
    },
    {
      id: 'q_sd_5',
      type: 'mcq',
      question: 'Which design pattern restricts the instantiation of a class to one single global instance across the application lifecycle?',
      options: ['Singleton Pattern', 'Factory Pattern', 'Observer Pattern', 'Strategy Pattern'],
      correctAnswer: 0,
      correctAnswerText: 'Singleton Pattern',
      explanation: 'The Singleton pattern ensures a class has only one instance and provides a global point of access to it.',
      testedSubconcept: 'Design Patterns'
    }
  ]
};

/**
 * Safe text normalization helper
 * Handles string, array, object, number, boolean, null, undefined without throwing TypeError
 */
export function normalizeText(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeText(item))
      .filter(Boolean)
      .join(' ');
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (typeof value === 'object') {
    try {
      const extracted = value.name || value.title || value.text || value.code || value.description || value.label || value.query || '';
      if (extracted) return normalizeText(extracted);
      return Object.values(value)
        .map((v) => normalizeText(v))
        .filter(Boolean)
        .join(' ');
    } catch {
      return '';
    }
  }
  return String(value);
}

// Deterministic Task-to-Domain Classifier
export function classifyTaskDomain(topicOrContext = '', fallbackCategory = '') {
  let topicOnly = '';
  let cat = normalizeText(fallbackCategory).toLowerCase();
  let text = '';

  if (typeof topicOrContext === 'object' && topicOrContext !== null) {
    const topicRaw = `${topicOrContext.roadmapTopic || ''} ${topicOrContext.taskTitle || ''} ${topicOrContext.topic || ''} ${topicOrContext.name || ''}`;
    topicOnly = normalizeText(topicRaw).toLowerCase();
    cat = normalizeText(topicOrContext.taskCategory || topicOrContext.category || fallbackCategory || '').toLowerCase();
    const desc = normalizeText(topicOrContext.taskDescription || topicOrContext.description || '').toLowerCase();
    const objectives = normalizeText(topicOrContext.learningObjectives || '').toLowerCase();
    text = `${topicOnly} ${desc} ${objectives} ${cat}`.toLowerCase();
  } else if (typeof topicOrContext === 'string') {
    topicOnly = topicOrContext.trim().toLowerCase();
    text = `${topicOnly} ${cat}`.toLowerCase();
  }

  // 1. PRIMARY: Match specific curriculum topic & task title directly (Highest Precedence)

  // DSA - Linked Lists
  if (topicOnly.includes('linked list') || topicOnly.includes('pointer manipulation') || topicOnly.includes('singly') || topicOnly.includes('doubly linked') || topicOnly.includes('linkedlist')) {
    return 'linked_lists';
  }

  // DSA - Binary Search
  if (topicOnly.includes('binary search') || topicOnly.includes('search space') || topicOnly.includes('rotated array') || topicOnly.includes('monotonic')) {
    return 'binary_search';
  }

  // DSA - Arrays & Strings
  if (
    topicOnly.includes('array') ||
    topicOnly.includes('string') ||
    topicOnly.includes('two pointer') ||
    topicOnly.includes('sliding window') ||
    topicOnly.includes('kadane') ||
    topicOnly.includes('prefix sum') ||
    topicOnly.includes('subarray') ||
    topicOnly.includes('anagram') ||
    topicOnly.includes('palindrome')
  ) {
    return 'arrays';
  }

  // Core CS - SQL (Specific query concepts)
  if (
    topicOnly.includes('sql') ||
    topicOnly.includes('join') ||
    topicOnly.includes('window function') ||
    topicOnly.includes('having') ||
    topicOnly.includes('group by') ||
    topicOnly.includes('queries') ||
    topicOnly.includes('subquery') ||
    topicOnly.includes('coalesce')
  ) {
    return 'sql';
  }

  // Core CS - DBMS (Architecture & transactions)
  if (
    topicOnly.includes('dbms') ||
    topicOnly.includes('database') ||
    topicOnly.includes('acid') ||
    topicOnly.includes('transaction') ||
    topicOnly.includes('normalization') ||
    topicOnly.includes('clustered index') ||
    topicOnly.includes('b-tree') ||
    topicOnly.includes('concurrency control') ||
    topicOnly.includes('rdbms')
  ) {
    return 'dbms';
  }

  // Core CS - Operating Systems
  if (
    topicOnly.includes('operating system') ||
    topicOnly.includes('os ') ||
    topicOnly === 'os' ||
    topicOnly.includes('process') ||
    topicOnly.includes('thread') ||
    topicOnly.includes('deadlock') ||
    topicOnly.includes('paging') ||
    topicOnly.includes('virtual memory') ||
    topicOnly.includes('cpu scheduling') ||
    topicOnly.includes('mutex') ||
    topicOnly.includes('semaphore') ||
    topicOnly.includes('thrashing')
  ) {
    return 'operating_systems';
  }

  // Core CS - Computer Networks
  if (
    topicOnly.includes('network') ||
    topicOnly.includes('tcp') ||
    topicOnly.includes('udp') ||
    topicOnly.includes('osi') ||
    topicOnly.includes('dns') ||
    topicOnly.includes('ip address') ||
    topicOnly.includes('3-way handshake') ||
    topicOnly.includes('router') ||
    topicOnly.includes('subnet') ||
    topicOnly.includes('tls') ||
    topicOnly.includes('socket')
  ) {
    return 'computer_networks';
  }

  // Development - React
  if (
    topicOnly.includes('react') ||
    topicOnly.includes('hook') ||
    topicOnly.includes('useeffect') ||
    topicOnly.includes('usestate') ||
    topicOnly.includes('jsx') ||
    topicOnly.includes('virtual dom') ||
    topicOnly.includes('component')
  ) {
    return 'react';
  }

  // Development - REST APIs
  if (
    topicOnly.includes('rest') ||
    topicOnly.includes('api') ||
    topicOnly.includes('endpoint') ||
    topicOnly.includes('http method') ||
    topicOnly.includes('status code') ||
    topicOnly.includes('idempotent')
  ) {
    return 'rest_apis';
  }

  // Development - Git & GitHub
  if (
    topicOnly.includes('git') ||
    topicOnly.includes('github') ||
    topicOnly.includes('branch') ||
    topicOnly.includes('merge') ||
    topicOnly.includes('rebase') ||
    topicOnly.includes('pull request') ||
    topicOnly.includes('staging')
  ) {
    return 'git_github';
  }

  // Aptitude
  if (
    topicOnly.includes('aptitude') ||
    topicOnly.includes('speed math') ||
    topicOnly.includes('time and work') ||
    topicOnly.includes('speed and distance') ||
    topicOnly.includes('percentage') ||
    topicOnly.includes('probability') ||
    topicOnly.includes('permutation') ||
    topicOnly.includes('quantitative')
  ) {
    return 'aptitude';
  }

  // Resume & Interview Preparation (Strict: NEVER match on generic word "interview" alone)
  if (
    topicOnly.includes('resume') ||
    topicOnly.includes('star framework') ||
    topicOnly.includes('star method') ||
    topicOnly.includes('elevator pitch') ||
    topicOnly.includes('behavioral interview') ||
    topicOnly.includes('hr interview') ||
    topicOnly === 'resume preparation' ||
    topicOnly === 'resume prep' ||
    topicOnly === 'interview preparation'
  ) {
    return 'resume_interview';
  }

  // System Design
  if (
    topicOnly.includes('system design') ||
    topicOnly.includes('cap theorem') ||
    topicOnly.includes('consistent hashing') ||
    topicOnly.includes('horizontal scaling') ||
    topicOnly.includes('load balancer') ||
    topicOnly.includes('caching')
  ) {
    return 'system_design';
  }

  // 2. SECONDARY: Match on detailed task description / objectives if topic was generic
  if (text.includes('linked list') || text.includes('pointer manipulation')) return 'linked_lists';
  if (text.includes('binary search')) return 'binary_search';
  if (text.includes('array') || text.includes('string') || text.includes('sliding window') || text.includes('two pointer') || text.includes('kadane')) return 'arrays';
  if (text.includes('sql') || text.includes('window function') || text.includes('join')) return 'sql';
  if (text.includes('dbms') || text.includes('acid') || text.includes('normalization') || text.includes('transaction')) return 'dbms';
  if (text.includes('operating system') || text.includes('deadlock') || text.includes('mutex') || text.includes('paging') || text.includes('virtual memory')) return 'operating_systems';
  if (text.includes('tcp') || text.includes('osi layer') || text.includes('dns resolution') || text.includes('computer network')) return 'computer_networks';
  if (text.includes('react') || text.includes('useeffect') || text.includes('jsx')) return 'react';
  if (text.includes('rest api') || text.includes('http status') || text.includes('idempotent')) return 'rest_apis';
  if (text.includes('git') || text.includes('github') || text.includes('rebase')) return 'git_github';
  if (text.includes('aptitude') || text.includes('speed math') || text.includes('probability')) return 'aptitude';
  if (text.includes('resume') || text.includes('star framework') || text.includes('behavioral question')) return 'resume_interview';
  if (text.includes('system design') || text.includes('cap theorem')) return 'system_design';

  // 3. TERTIARY: Match category only if topic wasn't classified
  if (cat === 'dsa') return 'arrays';
  if (cat === 'sql') return 'sql';
  if (cat === 'core cs') return 'dbms';
  if (cat === 'development') return 'react';
  if (cat === 'aptitude') return 'aptitude';
  if (cat === 'interview' && (topicOnly.includes('resume') || topicOnly.includes('star'))) return 'resume_interview';

  return null;
}

// Fallback topic matcher using deterministic classifier
export function matchQuestionBank(topicOrContext = '', category = '') {
  const domain = classifyTaskDomain(topicOrContext, category);
  if (domain && GROUNDED_QUESTION_BANKS[domain]) {
    return GROUNDED_QUESTION_BANKS[domain];
  }
  return null;
}

export { GROUNDED_QUESTION_BANKS };

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
 * Returns null if no grounded question bank matches (never fabricates random questions).
 */
export function generateRevisionQuestions(taskOrTopic, category = 'DSA', difficulty = 'Medium') {
  let topicName = 'Core Concept';
  let taskCat = category;
  let taskDiff = difficulty;

  if (typeof taskOrTopic === 'object' && taskOrTopic !== null) {
    topicName = taskOrTopic.roadmapTopic || taskOrTopic.taskTitle || taskOrTopic.topic || topicName;
    taskCat = taskOrTopic.taskCategory || taskOrTopic.category || taskCat;
    taskDiff = taskOrTopic.difficulty || taskDiff;
  } else if (typeof taskOrTopic === 'string') {
    topicName = taskOrTopic;
  }

  const bank = matchQuestionBank(taskOrTopic, taskCat);
  if (!bank || !Array.isArray(bank) || bank.length === 0) {
    return null;
  }
  
  // Clone questions with fresh IDs and normalized schema
  return bank.map((q, idx) => ({
    id: `q_${Date.now()}_${idx + 1}`,
    type: q.type || 'mcq',
    question: q.question,
    codeSnippet: q.codeSnippet || null,
    options: [...q.options],
    correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
    correctAnswerText: q.correctAnswerText || q.options[0],
    explanation: q.explanation,
    difficulty: (taskDiff || 'Medium').toLowerCase(),
    topic: topicName,
    testedSubconcept: q.testedSubconcept || topicName
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
    const isAnsCorrect = ans.isCorrect || 
      ans.selectedAnswer === ans.correctAnswer || 
      ans.selectedAnswer === ans.correctAnswerText ||
      (typeof ans.correctAnswer === 'number' && ans.selectedAnswer === ans.options?.[ans.correctAnswer]);
    if (isAnsCorrect) {
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
 * Authoritative end-to-end task completion finalized ONLY after quiz submission.
 * Receives quiz answers, calculates server-side score, feeds deterministic SM-2 revision engine,
 * finalizes task completion in db.tasks and focus session in db.focusSessions, and updates streak/readiness.
 */
export function recordTaskRevisionAndComplete(userId, { taskId, sessionId, revisionId, answers = [], durationMinutes = 15, taskContext = {} }) {
  const db = loadDb();
  if (!db.tasks) db.tasks = {};
  if (!db.tasks[userId]) db.tasks[userId] = [];
  if (!db.revisions) db.revisions = {};
  if (!db.revisions[userId]) db.revisions[userId] = [];
  if (!db.focusSessions) db.focusSessions = {};
  if (!db.focusSessions[userId]) db.focusSessions[userId] = [];

  const nowIso = new Date().toISOString();
  const todayStr = nowIso.split('T')[0];

  // 1. Calculate Server-Side Quiz Score
  let correctCount = 0;
  const totalQuestions = Math.max(1, answers.length);

  answers.forEach((ans) => {
    const isAnsCorrect = ans.isCorrect || 
      ans.selectedAnswer === ans.correctAnswer || 
      ans.selectedAnswer === ans.correctAnswerText ||
      (typeof ans.correctAnswer === 'number' && ans.selectedAnswer === ans.options?.[ans.correctAnswer]);
    if (isAnsCorrect) {
      correctCount += 1;
    }
  });

  const scorePercent = Math.round((correctCount / totalQuestions) * 100);

  // 2. Locate or Create Revision Item in db.revisions[userId]
  let rev = null;
  if (revisionId) {
    rev = db.revisions[userId].find((r) => r.id === revisionId);
  }
  if (!rev && (taskContext.roadmapTopic || taskContext.taskTitle || taskContext.topic)) {
    const targetTopicName = (taskContext.roadmapTopic || taskContext.taskTitle || taskContext.topic || '').trim().toLowerCase();
    rev = db.revisions[userId].find((r) => (r.topic || '').trim().toLowerCase() === targetTopicName);
  }

  if (!rev) {
    const topicName = taskContext.roadmapTopic || taskContext.taskTitle || taskContext.topic || 'Curriculum Concept';
    rev = {
      id: `rev_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      userId,
      topicId: taskContext.topicId || `topic_${Date.now()}`,
      topic: topicName,
      category: taskContext.taskCategory || taskContext.category || 'DSA',
      difficulty: taskContext.difficulty || 'Medium',
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
    db.revisions[userId].push(rev);
  }

  // 3. Deterministic SM-2 Repetition Ladder
  const currentRetention = rev.retentionScore || 65;
  const currentLevel = rev.intervalLevel || 1;

  let newLevel = currentLevel;
  let newRetention = currentRetention;
  let performanceGrade = 'good';

  if (scorePercent >= 80) {
    newLevel = Math.min(5, currentLevel + 1);
    const boost = Math.round(10 + (scorePercent - 80) * 0.2);
    newRetention = Math.min(98, currentRetention + boost);
    performanceGrade = 'strong';
  } else if (scorePercent >= 60) {
    newLevel = Math.min(5, currentLevel);
    newRetention = Math.min(95, currentRetention + 5);
    performanceGrade = 'good';
  } else {
    newLevel = 1;
    newRetention = Math.max(35, currentRetention - 15);
    performanceGrade = 'weak';
  }

  const nextIntervalDays = INTERVAL_LADDER[newLevel - 1] || 3;
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + nextIntervalDays);
  const nextDateStr = nextDate.toISOString().split('T')[0];

  const attemptRecord = {
    attemptId: `att_${Date.now()}`,
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    score: correctCount,
    totalQuestions,
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

  // 4. Officially Finalize Task Completion in db.tasks
  let completedTask = null;
  if (taskId && db.tasks[userId]) {
    const task = db.tasks[userId].find((t) => t.id === taskId);
    if (task) {
      task.completed = true;
      task.completedAt = nowIso;
      task.actualMinutesStudied = Math.max(1, durationMinutes || 45);
      if (task.subtasks) {
        task.subtasks.forEach((st) => (st.done = true));
      }
      completedTask = task;
    }
  }

  // 5. Officially Finalize Focus Session in db.focusSessions
  let finalizedSession = null;
  if (sessionId && db.focusSessions[userId]) {
    const session = db.focusSessions[userId].find((s) => s.sessionId === sessionId);
    if (session) {
      session.status = 'completed';
      session.endedAt = nowIso;
      session.actualMinutes = Math.max(1, durationMinutes || session.actualMinutes || 45);
      finalizedSession = session;
    }
  }

  // 6. Idempotent Streak & Daily Target Update
  let userStreak = (db.streaks && db.streaks[userId]) || null;
  if (userStreak && db.tasks[userId]) {
    const userTasks = db.tasks[userId];
    const completedTasksCount = userTasks.filter((t) => t.completed).length;

    if (completedTasksCount >= Math.min(3, userTasks.length) && !userStreak.todayTargetMet) {
      userStreak.todayTargetMet = true;
      userStreak.currentStreak += 1;
      userStreak.longestStreak = Math.max(userStreak.longestStreak, userStreak.currentStreak);
      userStreak.lastCompletedDate = todayStr;
      userStreak.completedDays = (userStreak.completedDays || 0) + 1;
    }
  }

  saveDb(db);

  return {
    success: true,
    task: completedTask,
    tasks: db.tasks[userId] || [],
    session: finalizedSession,
    revision: rev,
    attempt: attemptRecord,
    streak: userStreak,
    readiness: (db.readiness && db.readiness[userId]) || null,
    scorePercent,
    correctCount,
    totalQuestions,
    retentionBefore: currentRetention,
    retentionAfter: newRetention,
    nextIntervalDays,
    nextRevisionDate: nextDateStr,
    strongFeedback: performanceGrade === 'strong' ? '✓ Core concept & problem solving mastered' : '✓ Good baseline recall on core properties',
    improveFeedback: performanceGrade === 'weak' ? '⚠ Reset to 1-day interval: review edge cases & core principles' : '⚠ Practice rapid active recall drills'
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
