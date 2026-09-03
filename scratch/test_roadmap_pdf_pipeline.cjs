const assert = require('assert');
const PdfParse = require('pdf-parse/lib/pdf-parse.js');

// Valid PDF generator with exact 20-byte CRLF xref entries for test purposes
function createTestPdf(lines) {
  let stream = 'BT\n/F1 12 Tf\n72 720 Td\n';
  for (let l of lines) {
    const cleanLine = l.replace(/[—–]/g, ' - ').replace(/[()]/g, '');
    stream += '(' + cleanLine + ') Tj\n0 -20 Td\n';
  }
  stream += 'ET\n';
  const streamBuf = Buffer.from(stream, 'utf8');

  let body = '%PDF-1.4\n';
  let o1 = Buffer.byteLength(body, 'utf8'); body += '1 0 obj\n<</Type /Catalog /Pages 2 0 R>>\nendobj\n';
  let o2 = Buffer.byteLength(body, 'utf8'); body += '2 0 obj\n<</Type /Pages /Kids [3 0 R] /Count 1>>\nendobj\n';
  let o3 = Buffer.byteLength(body, 'utf8'); body += '3 0 obj\n<</Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources <</Font <</F1 5 0 R>>>>>>\nendobj\n';
  let o4 = Buffer.byteLength(body, 'utf8'); body += '4 0 obj\n<</Length ' + streamBuf.length + '>>\nstream\n' + stream + '\nendstream\nendobj\n';
  let o5 = Buffer.byteLength(body, 'utf8'); body += '5 0 obj\n<</Type /Font /Subtype /Type1 /BaseFont /Helvetica>>\nendobj\n';
  let xrefPos = Buffer.byteLength(body, 'utf8');
  body += 'xref\n0 6\n';
  body += '0000000000 65535 f \r\n';
  body += String(o1).padStart(10, '0') + ' 00000 n \r\n';
  body += String(o2).padStart(10, '0') + ' 00000 n \r\n';
  body += String(o3).padStart(10, '0') + ' 00000 n \r\n';
  body += String(o4).padStart(10, '0') + ' 00000 n \r\n';
  body += String(o5).padStart(10, '0') + ' 00000 n \r\n';
  body += 'trailer\n<</Size 6 /Root 1 0 R>>\nstartxref\n' + xrefPos + '\n%%EOF\n';
  return Buffer.from(body, 'utf8');
}

async function runTests() {
  console.log('================================================================');
  console.log('🚀 TESTING ROADMAP PDF EXTRACTION & PARSING PIPELINE');
  console.log('================================================================\n');

  const {
    extractTextFromBuffer,
    sanitizeExtractedText,
    evaluateExtractionQuality,
    parseDocumentTextToRoadmap,
    validateRoadmapSchema
  } = await import('../server/roadmapService.js');

  // -------------------------------------------------------------------------
  // TEST 1: Real 6-Phase Text-Based PDF (Requirement 8)
  // -------------------------------------------------------------------------
  console.log('[Test 1] Testing 6-Phase Text-Based PDF Extraction...');
  const realCurriculum = [
    'Phase 1 — Programming Foundations',
    '- Syntax, Variables, Data Types & Control Flow (Easy) - 15 problems',
    '- Functions, Scope, Recursion & Memory Management (Medium) - 20 problems',
    'Phase 2 — Data Structures',
    '- Arrays, Strings & Two Pointers (Medium) - 25 problems',
    '- Linked Lists, Stacks & Queues (Medium) - 20 problems',
    '- Binary Trees & Binary Search Trees (Hard) - 30 problems',
    'Phase 3 — Algorithms',
    '- Sorting, Binary Search & Divide and Conquer (Medium) - 25 problems',
    '- Graph Traversal BFS & DFS (Hard) - 25 problems',
    '- Dynamic Programming & Memoization (Hard) - 35 problems',
    'Phase 4 — Core CS',
    '- Operating Systems, Processes, Threads & Concurrency (Medium) - 15 problems',
    '- Database Management Systems & SQL Queries (Medium) - 20 problems',
    '- Computer Networks & TCP/IP Protocols (Medium) - 10 problems',
    'Phase 5 — Development',
    '- RESTful API Architecture & Backend Design (Medium) - 10 problems',
    '- Frontend State Management & Component Lifecycle (Medium) - 10 problems',
    'Phase 6 — Interview Preparation',
    '- Behavioral STAR Method & Technical Resume Walkthrough (Easy) - 10 problems',
    '- Full Mock Technical Coding Interview (Hard) - 5 problems'
  ];

  const pdfBuffer = createTestPdf(realCurriculum);
  const extractedText = await extractTextFromBuffer(pdfBuffer, 'placement_roadmap.pdf');

  // Verify no raw PDF internals leaked
  assert(!extractedText.includes('/PDF-1.4'), 'Must not contain /PDF-1.4');
  assert(!extractedText.includes('/BaseFont'), 'Must not contain /BaseFont');
  assert(!extractedText.includes('/MediaBox'), 'Must not contain /MediaBox');
  assert(!extractedText.includes('/Contents'), 'Must not contain /Contents');
  assert(!extractedText.includes('0 0 612 792'), 'Must not contain coordinates');

  const roadmap = parseDocumentTextToRoadmap(extractedText, 'placement_roadmap.pdf', 'Software Engineer');

  console.log(`Extracted phase count: ${roadmap.phases.length}`);
  roadmap.phases.forEach((p, i) => console.log(`  Phase ${i + 1}: "${p.title}" (${p.topics.length} topics)`));

  assert.strictEqual(roadmap.phases.length, 6, 'Must extract EXACTLY 6 phases (not 89 phases)');
  assert(roadmap.phases[0].title.includes('Programming Foundations'), 'Phase 1 matches title');
  assert(roadmap.phases[1].title.includes('Data Structures'), 'Phase 2 matches title');
  assert(roadmap.phases[2].title.includes('Algorithms'), 'Phase 3 matches title');
  assert(roadmap.phases[3].title.includes('Core CS'), 'Phase 4 matches title');
  assert(roadmap.phases[4].title.includes('Development'), 'Phase 5 matches title');
  assert(roadmap.phases[5].title.includes('Interview Preparation'), 'Phase 6 matches title');

  // Verify topics
  assert(roadmap.phases[0].topics.some(t => t.name.includes('Syntax, Variables')), 'Phase 1 has Foundations topics');
  assert(roadmap.phases[1].topics.some(t => t.name.includes('Arrays, Strings')), 'Phase 2 has DSA topics');
  assert(roadmap.phases[2].topics.some(t => t.name.includes('Dynamic Programming')), 'Phase 3 has DP topics');
  assert(roadmap.phases[3].topics.some(t => t.name.includes('Operating Systems')), 'Phase 4 has OS topics');
  assert(roadmap.phases[4].topics.some(t => t.name.includes('RESTful API')), 'Phase 5 has API topics');
  assert(roadmap.phases[5].topics.some(t => t.name.includes('Behavioral STAR')), 'Phase 6 has Interview topics');

  // Verify no PDF internals in topics
  for (const phase of roadmap.phases) {
    for (const topic of phase.topics) {
      assert(!topic.name.startsWith('/'), `Topic name must not start with /: "${topic.name}"`);
      assert(!topic.name.includes('MediaBox'), 'Topic name must not contain MediaBox');
      assert(!topic.name.includes('BaseFont'), 'Topic name must not contain BaseFont');
    }
  }

  const validation = validateRoadmapSchema(roadmap);
  assert(validation.valid, 'Roadmap schema is strictly valid');
  console.log('✅ Test 1 Passed: Exactly 6 phases extracted with zero PDF syntax leakage!\n');

  // -------------------------------------------------------------------------
  // TEST 2: Scanned/Image PDF Detection (Requirement 9)
  // -------------------------------------------------------------------------
  console.log('[Test 2] Testing Scanned/Image PDF Detection...');
  // A scanned PDF has no text stream, only image XObjects
  const scannedPdf = Buffer.from(`%PDF-1.4
1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj
2 0 obj <</Type /Pages /Kids [3 0 R] /Count 1>> endobj
3 0 obj <</Type /Page /Parent 2 0 R /MediaBox [0 0 612 792]>> endobj
xref
0 4
trailer <</Size 4 /Root 1 0 R>>
%%EOF`, 'utf8');

  const scannedText = await extractTextFromBuffer(scannedPdf, 'scanned_scan.pdf');
  const quality = evaluateExtractionQuality(scannedText, 'scanned_scan.pdf');
  console.log('Scanned PDF extraction quality:', quality);
  assert.strictEqual(quality.confidence, 'low', 'Scanned PDF must be marked LOW confidence');
  assert.strictEqual(quality.needsReview, true, 'Scanned PDF must be marked needsReview: true');
  console.log('✅ Test 2 Passed: Scanned PDF correctly flagged as low confidence & needs review!\n');

  // -------------------------------------------------------------------------
  // TEST 3: Text / Markdown Format (Requirement 9)
  // -------------------------------------------------------------------------
  console.log('[Test 3] Testing Markdown Roadmap Parsing...');
  const mdContent = Buffer.from(`# Phase 1: Machine Learning Foundations
- Linear Algebra and Matrix Operations (Medium) - 10 problems
- Probability & Statistics for Data Science (Medium) - 15 problems

# Phase 2: Deep Learning & Neural Networks
- Feedforward Networks & Backpropagation (Hard) - 20 problems
- Convolutional Neural Networks for Vision (Hard) - 15 problems
`, 'utf8');

  const mdText = await extractTextFromBuffer(mdContent, 'ml_roadmap.md');
  const mdRoadmap = parseDocumentTextToRoadmap(mdText, 'ml_roadmap.md', 'Data Scientist');
  assert.strictEqual(mdRoadmap.phases.length, 2, 'Markdown roadmap has 2 phases');
  assert.strictEqual(mdRoadmap.phases[0].topics.length, 2, 'Phase 1 has 2 topics');
  assert.strictEqual(mdRoadmap.phases[1].topics.length, 2, 'Phase 2 has 2 topics');
  console.log('✅ Test 3 Passed: Markdown roadmap parsed cleanly!\n');

  // -------------------------------------------------------------------------
  // TEST 4: DOCX Format Extraction (Requirement 9)
  // -------------------------------------------------------------------------
  console.log('[Test 4] Testing DOCX Extraction Fallback...');
  const docxXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:t>Phase 1 - Frontend Development</w:t></w:p>
    <w:p><w:t>- HTML5, Semantic Elements & CSS Grid (Easy) - 10 problems</w:t></w:p>
    <w:p><w:t>- JavaScript ES6+, Async/Await & Promises (Medium) - 15 problems</w:t></w:p>
  </w:body>
</w:document>`;
  const docxBuffer = Buffer.from(docxXml, 'utf8');
  const docxText = await extractTextFromBuffer(docxBuffer, 'frontend.docx');
  const docxRoadmap = parseDocumentTextToRoadmap(docxText, 'frontend.docx', 'Frontend Engineer');
  assert(docxRoadmap.phases.length >= 1, 'DOCX roadmap parsed at least 1 phase');
  assert(docxRoadmap.phases[0].topics.length >= 1, 'DOCX has topics');
  console.log('✅ Test 4 Passed: DOCX parsing handled cleanly!\n');

  // -------------------------------------------------------------------------
  // TEST 5: Malformed / High Noise PDF (Requirement 9)
  // -------------------------------------------------------------------------
  console.log('[Test 5] Testing Malformed PDF Safeguards (Prevent 89-Phase Bug)...');
  const noisyPdfContent = [
    '/PDF-1.4',
    '/F12 0 R /F23 0 R',
    '/BaseFont /Helvetica',
    '/Contents 4 0 R',
    '/MediaBox [0 0 595.2756 841.8898]',
    '/Type /Page',
    '0 0 595.2756 841.8898',
    '4 0 obj <</Length 20>> stream endstream endobj',
    'trailer <</Size 10 /Root 1 0 R>>',
    '%%EOF'
  ].join('\n');

  const sanitized = sanitizeExtractedText(noisyPdfContent);
  console.log('Sanitized noisy text output length:', sanitized.length);
  assert.strictEqual(sanitized.length, 0, 'Sanitization must discard 100% of PDF internal noise');

  const noisyRoadmap = parseDocumentTextToRoadmap(noisyPdfContent, 'corrupted.pdf', 'Software Engineer');
  console.log('Noisy roadmap phase count:', noisyRoadmap.phases.length);
  assert(noisyRoadmap.phases.length <= 2, 'Noisy PDF must NEVER produce dozens or 89 phases');
  assert.strictEqual(noisyRoadmap.needsReview, true, 'Noisy PDF must be marked needsReview: true');
  // -------------------------------------------------------------------------
  // TEST 6: Production Sample PDF Regression Test (Zero-Hallucination & Faithful Topic Preservation)
  // -------------------------------------------------------------------------
  console.log('[Test 6] Testing NOVARA Production Sample Roadmap PDF Regression...');
  const samplePdfLines = [
    'NOVARA',
    'Sample Software Engineer Placement Preparation Roadmap',
    'Duration12 Weeks',
    'Daily Study Time2 - 3 hours',
    'Target RoleSoftware Engineer / SDE Placement',
    'Phase 1 — Programming Foundations (Weeks 1–2)',
    'Topics• Variables, data types and operators',
    '• Conditional statements',
    '• Loops',
    '• Functions',
    '• Arrays and strings',
    '• Basic input/output',
    '• Time and space complexity',
    '• Basic problem solving',
    'Practice: 15–20 coding problems',
    'Phase 2 — Data Structures (Weeks 3–5)',
    'Topics• Arrays and strings',
    '• Linked Lists',
    '• Stacks',
    '• Queues',
    '• Hash Tables',
    '• Recursion',
    '• Trees',
    '• Binary Search Trees',
    '• Heaps',
    'Practice: 40–50 coding problems',
    'Phase 3 — Algorithms (Weeks 6–7)',
    'Topics• Searching',
    '• Sorting',
    '• Binary Search',
    '• Two Pointers',
    '• Sliding Window',
    '• Prefix Sum',
    '• Greedy Algorithms',
    '• Backtracking',
    '• Basic Dynamic Programming',
    'Practice: 40 coding problems',
    'Phase 4 — Core CS (Weeks 8–9)',
    'Topics• Object-Oriented Programming',
    '• DBMS',
    '• SQL',
    '• Operating Systems',
    '• Computer Networks',
    '• Software Engineering basics',
    'Practice: 30 SQL queries and Core CS interview questions',
    'Phase 5 — Development (Weeks 10–11)',
    'Topics• HTML & CSS fundamentals',
    '• JavaScript',
    '• React basics',
    '• REST APIs',
    '• Git & GitHub',
    '• Build a small full-stack project',
    'Project: Placement Preparation Dashboard',
    'Phase 6 — Interview Preparation (Week 12)',
    'Topics• Resume preparation',
    '• Aptitude practice',
    '• Coding interview practice',
    '• Technical interview questions',
    '• HR questions',
    '• Mock interviews',
    '• Project explanation',
    '• Final revision',
    'Focus: interview readiness and revision',
    'Final Goals',
    '• 120+ coding problems',
    '• 30+ SQL queries',
    '• 1 full-stack project',
    '• 2 mock interviews',
    '• 1 polished resume',
    '• Revise all major CS fundamentals',
    'Suggested Weekly Routine',
    'DayPrimary Focus',
    'Monday–ThursdayLearn concepts + solve coding problems',
    'FridayRevision + SQL/Core CS',
    'SaturdayProject work + mock interview practice',
    'SundayWeekly revision + progress review',
    'Sample roadmap for testing NOVARA roadmap upload, parsing, review, plan generation, and progress tracking.'
  ];

  const samplePdfBuffer = createTestPdf(samplePdfLines);
  const sampleExtracted = await extractTextFromBuffer(samplePdfBuffer, 'novara_sample_placement_roadmap.pdf');
  const sampleSanitized = sanitizeExtractedText(sampleExtracted);

  // Normalization verification
  assert(!sampleSanitized.includes('Duration12'), 'Duration12 must be normalized with boundary');
  assert(!sampleSanitized.includes('Daily Study Time2'), 'Daily Study Time2 must be normalized with boundary');
  assert(!sampleSanitized.includes('Topics•'), 'Topics• must be stripped from bullet topics');

  const { validateExtractedRoadmapQuality, validateCurriculumFaithfulness, extractSourceCurriculumBullets } = await import('../server/roadmapService.js');
  const sampleRoadmap = parseDocumentTextToRoadmap(sampleExtracted, 'novara_sample_placement_roadmap.pdf', 'Software Engineer');

  // Hierarchy verification: Exactly 6 phases
  assert.strictEqual(sampleRoadmap.phases.length, 6, 'Must extract EXACTLY 6 phases (no phantom Phase 01)');
  assert(!sampleRoadmap.phases.some(p => p.title.includes('Core Curriculum & Foundations')), 'Must NOT create phantom Core Curriculum & Foundations phase');

  // Phase 1 verification (8 topics)
  const p1 = sampleRoadmap.phases[0];
  assert(p1.title.includes('Programming Foundations'), 'Phase 1 must be Programming Foundations');
  assert.strictEqual(p1.topics.length, 8, `Phase 1 must contain exactly 8 topics (got ${p1.topics.length})`);
  assert.strictEqual(p1.topics[0].name, 'Variables, data types and operators', 'Phase 1 Topic 1 matches');
  assert.strictEqual(p1.topics[7].name, 'Basic problem solving', 'Phase 1 Topic 8 matches');

  // Phase 2 verification (9 topics - distinct Stacks and Queues preserved)
  const p2 = sampleRoadmap.phases[1];
  assert(p2.title.includes('Data Structures'), 'Phase 2 must be Data Structures');
  assert.strictEqual(p2.topics.length, 9, `Phase 2 must contain exactly 9 topics (got ${p2.topics.length})`);
  const p2Names = p2.topics.map(t => t.name);
  assert(p2Names.includes('Stacks'), 'Phase 2 must contain separate "Stacks" topic');
  assert(p2Names.includes('Queues'), 'Phase 2 must contain separate "Queues" topic');
  assert(!p2Names.includes('Stacks and Queues'), 'Phase 2 must NOT merge into "Stacks and Queues"');
  assert(p2Names.includes('Binary Search Trees'), 'Phase 2 contains Binary Search Trees');
  assert(p2Names.includes('Heaps'), 'Phase 2 contains Heaps');

  // Phase 3 verification (9 topics - distinct Searching and Sorting preserved)
  const p3 = sampleRoadmap.phases[2];
  assert(p3.title.includes('Algorithms'), 'Phase 3 must be Algorithms');
  assert.strictEqual(p3.topics.length, 9, `Phase 3 must contain exactly 9 topics (got ${p3.topics.length})`);
  const p3Names = p3.topics.map(t => t.name);
  assert(p3Names.includes('Searching'), 'Phase 3 must contain separate "Searching" topic');
  assert(p3Names.includes('Sorting'), 'Phase 3 must contain separate "Sorting" topic');
  assert(!p3Names.includes('Searching and sorting'), 'Phase 3 must NOT merge into "Searching and sorting"');
  assert(p3Names.includes('Basic Dynamic Programming'), 'Phase 3 contains Basic Dynamic Programming');

  // Phase 4 verification (6 topics)
  const p4 = sampleRoadmap.phases[3];
  assert(p4.title.includes('Core CS'), 'Phase 4 must be Core CS');
  assert.strictEqual(p4.topics.length, 6, `Phase 4 must contain exactly 6 topics (got ${p4.topics.length})`);
  const p4Names = p4.topics.map(t => t.name);
  assert(p4Names.includes('Object-Oriented Programming'), 'Phase 4 contains OOP');
  assert(p4Names.includes('Operating Systems'), 'Phase 4 contains OS');
  assert(p4Names.includes('Software Engineering basics'), 'Phase 4 contains SE basics');

  // Phase 5 verification (6 topics)
  const p5 = sampleRoadmap.phases[4];
  assert(p5.title.includes('Development'), 'Phase 5 must be Development');
  assert.strictEqual(p5.topics.length, 6, `Phase 5 must contain exactly 6 topics (got ${p5.topics.length})`);
  const p5Names = p5.topics.map(t => t.name);
  assert(p5Names.includes('HTML & CSS fundamentals'), 'Phase 5 contains HTML & CSS');
  assert(p5Names.includes('Build a small full-stack project'), 'Phase 5 contains full-stack project');

  // Phase 6 verification (8 topics)
  const p6 = sampleRoadmap.phases[5];
  assert(p6.title.includes('Interview Preparation'), 'Phase 6 must be Interview Preparation');
  assert.strictEqual(p6.topics.length, 8, `Phase 6 must contain exactly 8 topics (got ${p6.topics.length})`);
  const p6Names = p6.topics.map(t => t.name);
  assert(p6Names.includes('Resume preparation'), 'Phase 6 contains Resume preparation');
  assert(p6Names.includes('Final revision'), 'Phase 6 contains Final revision');

  // Total topics: 8 + 9 + 9 + 6 + 6 + 8 = 46 topics
  const totalExtractedTopics = sampleRoadmap.phases.reduce((acc, p) => acc + p.topics.length, 0);
  assert.strictEqual(totalExtractedTopics, 46, `Sample roadmap must produce exactly 46 topics (got ${totalExtractedTopics})`);

  // Metadata isolation verification across all topics
  const allTopicNames = sampleRoadmap.phases.flatMap(p => p.topics.map(t => t.name));
  assert(!allTopicNames.includes('NOVARA'), 'Product name NOVARA must never be a topic');
  assert(!allTopicNames.some(t => t.includes('Placement Preparation Roadmap')), 'Document title must never be a topic');
  assert(!allTopicNames.some(t => /duration/i.test(t)), 'Duration metadata must never be a topic');
  assert(!allTopicNames.some(t => /daily study/i.test(t)), 'Daily study time metadata must never be a topic');
  assert(!allTopicNames.some(t => /target role/i.test(t)), 'Target role metadata must never be a topic');
  assert(!allTopicNames.some(t => t.startsWith('Topics')), 'Topic name must not start with Topics');
  assert(!allTopicNames.some(t => /^Practice\s*:/i.test(t)), 'Practice section note must not be a topic');
  assert(!allTopicNames.some(t => /^Project\s*:/i.test(t)), 'Project section note must not be a topic');
  assert(!allTopicNames.some(t => /^Focus\s*:/i.test(t)), 'Focus section note must not be a topic');
  assert(!allTopicNames.some(t => /Final Goals/i.test(t)), 'Final Goals header must not be a topic');
  assert(!allTopicNames.some(t => /Suggested Weekly Routine/i.test(t)), 'Weekly Routine header must not be a topic');
  assert(!allTopicNames.some(t => /DayPrimary Focus/i.test(t)), 'Table header must not be a topic');
  assert(!allTopicNames.some(t => /Sample roadmap for testing/i.test(t)), 'Document trailer must not be a topic');

  // Zero-hallucination durations and problem counts
  for (const phase of sampleRoadmap.phases) {
    for (const topic of phase.topics) {
      assert.strictEqual(topic.duration, null, `Topic "${topic.name}" duration must be null, not 6h`);
      assert.strictEqual(topic.problemsCount, null, `Topic "${topic.name}" problemsCount must be null`);
    }
  }

  // Schema & Quality validation
  const sampleQuality = validateExtractedRoadmapQuality(sampleRoadmap);
  assert(sampleQuality.valid, `Roadmap must pass quality validation: ${sampleQuality.reason}`);

  const sourceCurriculum = extractSourceCurriculumBullets(sampleSanitized, 'novara_sample_placement_roadmap.pdf', 'Software Engineer');
  const faithfulness = validateCurriculumFaithfulness(sourceCurriculum, sampleRoadmap);
  assert(faithfulness.valid, `Roadmap must pass curriculum faithfulness validation: ${faithfulness.reason}`);

  const schemaValidation = validateRoadmapSchema(sampleRoadmap);
  assert(schemaValidation.valid, `Roadmap must pass schema validation: ${schemaValidation.error}`);

  console.log('✅ Test 6 Passed: Production sample PDF parsed with exact 6 phases (8, 9, 9, 6, 6, 8 topics), zero metadata pollution, and zero topic consolidation!\n');

  console.log('================================================================');
  console.log('🎉 ALL ROADMAP PDF PIPELINE TESTS PASSED SUCCESSFULLY!');
  console.log('================================================================\n');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
