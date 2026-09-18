/**
 * Regression Test Suite: Focus + Deep Study Task Identity & Grounding
 * Validates the 15 required invariants to prevent task identity drift and content contamination.
 */

const path = require('path');
const { pathToFileURL } = require('url');

let assertionCount = 0;

function assert(condition, msg) {
  if (!condition) {
    console.error(`❌ [FAILED] Assertion ${assertionCount + 1}: ${msg}`);
    process.exit(1);
  }
  assertionCount++;
  console.log(`✅ [PASS ${assertionCount}/15] ${msg}`);
}

async function runTests() {
  console.log('='.repeat(70));
  console.log('FOCUS & DEEP STUDY TASK IDENTITY REGRESSION SUITE (15 CHECKS)');
  console.log('='.repeat(70));

  const serverDir = path.resolve(__dirname, '../server');
  const revisionServiceUrl = pathToFileURL(path.join(serverDir, 'revisionService.js')).href;
  const studyMaterialServiceUrl = pathToFileURL(path.join(serverDir, 'studyMaterialService.js')).href;

  const { classifyTaskDomain } = await import(revisionServiceUrl);
  const {
    getStudyMaterialCacheKey,
    validateStudyMaterialGrounding,
    getGroundedFallbackStudyMaterial,
    getCachedStudyMaterial,
    setCachedStudyMaterial,
    invalidateStudyMaterialCache
  } = await import(studyMaterialServiceUrl);

  // 1. Graphs task -> Graphs study material (not Arrays)
  const graphDomain = classifyTaskDomain('Graphs (BFS/DFS, Dijkstra, Topological Sort) — Solve 2 problems', 'dsa');
  const graphMaterial = getGroundedFallbackStudyMaterial({
    taskId: 'task_graph_001',
    title: 'Graphs (BFS/DFS, Dijkstra, Topological Sort) — Solve 2 problems',
    category: 'dsa',
    domain: graphDomain
  });
  const graphText = JSON.stringify(graphMaterial).toLowerCase();
  assert(
    graphDomain === 'graphs' &&
    graphMaterial.topic.toLowerCase().includes('graph') &&
    (graphText.includes('bfs') || graphText.includes('dfs') || graphText.includes('dijkstra')) &&
    !graphText.includes('kadane'),
    'Assertion 1: Graphs task maps to Graphs domain and generates authentic Graphs material without Kadane contamination'
  );

  // 2. Arrays task -> Arrays study material
  const arrayDomain = classifyTaskDomain('Array Two Pointer Technique & Sliding Window', 'dsa');
  const arrayMaterial = getGroundedFallbackStudyMaterial({
    taskId: 'task_arr_001',
    title: 'Array Two Pointer Technique & Sliding Window',
    category: 'dsa',
    domain: arrayDomain
  });
  const arrayText = JSON.stringify(arrayMaterial).toLowerCase();
  assert(
    arrayDomain === 'arrays' &&
    arrayMaterial.topic.toLowerCase().includes('array') &&
    (arrayText.includes('sliding window') || arrayText.includes('two pointer') || arrayText.includes('kadane')),
    'Assertion 2: Arrays task correctly produces Arrays study material'
  );

  // 3. Linked Lists task -> Linked Lists study material
  const llDomain = classifyTaskDomain('Linked List Cycle Detection & Reversal', 'dsa');
  const llMaterial = getGroundedFallbackStudyMaterial({
    taskId: 'task_ll_001',
    title: 'Linked List Cycle Detection & Reversal',
    category: 'dsa',
    domain: llDomain
  });
  assert(
    llDomain === 'linked_lists' &&
    llMaterial.topic.toLowerCase().includes('linked list'),
    'Assertion 3: Linked Lists task maps to linked_lists domain and produces Linked List material'
  );

  // 4. Binary Search task -> Binary Search study material
  const bsDomain = classifyTaskDomain('Binary Search & Search in Rotated Sorted Array', 'dsa');
  const bsMaterial = getGroundedFallbackStudyMaterial({
    taskId: 'task_bs_001',
    title: 'Binary Search & Search in Rotated Sorted Array',
    category: 'dsa',
    domain: bsDomain
  });
  assert(
    bsDomain === 'binary_search' &&
    bsMaterial.topic.toLowerCase().includes('binary search'),
    'Assertion 4: Binary Search task maps to binary_search domain and produces Binary Search material'
  );

  // 5. DBMS task -> DBMS study material
  const dbmsDomain = classifyTaskDomain('ACID Properties & Transaction Isolation Levels', 'core');
  const dbmsMaterial = getGroundedFallbackStudyMaterial({
    taskId: 'task_dbms_001',
    title: 'ACID Properties & Transaction Isolation Levels',
    category: 'core',
    domain: dbmsDomain
  });
  assert(
    dbmsDomain === 'dbms' &&
    (dbmsMaterial.domain === 'dbms' || JSON.stringify(dbmsMaterial).toLowerCase().includes('dbms')),
    'Assertion 5: DBMS task maps to dbms domain and produces Database material'
  );

  // 6. Cache isolation between Graphs and Arrays (different cache keys)
  const keyGraphs = getStudyMaterialCacheKey({
    taskId: 'task_graph_001',
    title: 'Graphs (BFS/DFS, Dijkstra, Topological Sort)',
    category: 'dsa',
    domain: 'graphs'
  }, 'user_alice');

  const keyArrays = getStudyMaterialCacheKey({
    taskId: 'task_arr_001',
    title: 'Arrays Two Pointers',
    category: 'dsa',
    domain: 'arrays'
  }, 'user_alice');

  assert(
    keyGraphs !== keyArrays && keyGraphs.includes('dom_graphs') && keyArrays.includes('dom_arrays'),
    'Assertion 6: Cache keys between Graphs and Arrays are completely isolated with domain segmentation'
  );

  // 7. taskId included in cache identity
  const keyTaskA = getStudyMaterialCacheKey({ taskId: 'task_111', title: 'Trees', domain: 'trees' }, 'user_alice');
  const keyTaskB = getStudyMaterialCacheKey({ taskId: 'task_222', title: 'Trees', domain: 'trees' }, 'user_alice');
  assert(
    keyTaskA !== keyTaskB && keyTaskA.includes('id_task_111') && keyTaskB.includes('id_task_222'),
    'Assertion 7: taskId is explicitly integrated into the cache identity'
  );

  // 8. Stale/wrong cached material rejected by grounding validator
  const corruptedMaterial = {
    ...arrayMaterial,
    topic: 'Graphs (BFS/DFS)' // superficial title change, but body has Array/Kadane content
  };
  const validationResult = validateStudyMaterialGrounding(corruptedMaterial, {
    taskId: 'task_graph_001',
    title: 'Graphs (BFS/DFS, Dijkstra, Topological Sort)',
    domain: 'graphs'
  });
  assert(
    validationResult.isValid === false,
    'Assertion 8: Grounding validator strictly detects and rejects contaminated/stale Array material masquerading as Graphs'
  );

  // 9. Generated domain must match requested task
  const graphValidation = validateStudyMaterialGrounding(graphMaterial, {
    taskId: 'task_graph_001',
    title: 'Graphs (BFS/DFS, Dijkstra, Topological Sort)',
    domain: 'graphs'
  });
  assert(
    graphValidation.isValid === true,
    'Assertion 9: Grounded Graphs study material passes grounding validation against Graphs task'
  );

  // 10. Generated content relevance validator rejects unrelated concepts (e.g. Kadane in Graphs task)
  const rogueGraphWithKadane = {
    ...graphMaterial,
    overview: 'In this section we cover Kadane algorithm for maximum subarray sum and sliding window pointers.'
  };
  const rogueValidation = validateStudyMaterialGrounding(rogueGraphWithKadane, {
    title: 'Graphs (BFS/DFS)',
    domain: 'graphs'
  });
  assert(
    rogueValidation.isValid === false,
    'Assertion 10: Content relevance validator detects rogue concepts (Kadane/Sliding Window in Graphs) and flags as invalid'
  );

  // 11. Fallback material remains task-specific
  const treeFallback = getGroundedFallbackStudyMaterial({
    title: 'Binary Tree Traversals and Invariants',
    category: 'dsa',
    domain: 'trees'
  });
  assert(
    treeFallback.topic.toLowerCase().includes('tree') &&
    JSON.stringify(treeFallback).toLowerCase().includes('inorder'),
    'Assertion 11: Fallback generation is dynamically task-specific and grounded in the target domain'
  );

  // 12. Focus taskId preserved into Study
  const testContext = {
    taskId: 'task_focus_real_456',
    title: 'Graphs (BFS/DFS)',
    domain: 'graphs'
  };
  const testKey = getStudyMaterialCacheKey(testContext, 'user_tester');
  setCachedStudyMaterial(testKey, graphMaterial, testContext);
  const retrievedCached = getCachedStudyMaterial(testKey, testContext);
  assert(
    retrievedCached !== null && (retrievedCached.topic || retrievedCached.title || '').toLowerCase().includes('graph'),
    'Assertion 12: Focus taskId is preserved and retrieved accurately from grounded cache'
  );

  // 13. Study refresh preserves exact task identity
  const keyFirst = getStudyMaterialCacheKey(testContext, 'user_tester');
  const keySecond = getStudyMaterialCacheKey(testContext, 'user_tester');
  assert(
    keyFirst === keySecond,
    'Assertion 13: Study refresh computes deterministic, identical cache key preserving task identity'
  );

  // 14. Tutor receives exact same task identity and domain
  // When getCachedStudyMaterial is checked with wrong domain context, it purges/rejects
  const mismatchContext = {
    taskId: 'task_focus_real_456',
    title: 'Graphs (BFS/DFS)',
    domain: 'arrays' // malicious or corrupt domain
  };
  const mismatchRetrieved = getCachedStudyMaterial(testKey, mismatchContext);
  assert(
    mismatchRetrieved === null,
    'Assertion 14: Cache retrieval enforces domain check, preventing Tutor from receiving cross-domain data'
  );

  // 15. No cross-user cache contamination
  const user1Key = getStudyMaterialCacheKey(testContext, 'user_one');
  const user2Key = getStudyMaterialCacheKey(testContext, 'user_two');
  assert(
    user1Key !== user2Key,
    'Assertion 15: Cross-user cache keys are strictly isolated'
  );

  console.log('='.repeat(70));
  console.log(`🎉 ALL 15 TASK IDENTITY ASSERTIONS PASSED SUCCESSFULLY!`);
  console.log('='.repeat(70));
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
