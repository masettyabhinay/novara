function assert(condition, msg) {
  if (!condition) {
    console.error(`❌ Assertion failed: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ ${msg}`);
}

async function run() {
  console.log('Testing Roadmap Upload Flow Subsystem...');
  const { validateFileSignature } = await import('file:///f:/NOVARA/server/securityMiddleware.js');
  const { 
    extractTextFromBuffer, 
    parseDocumentTextToRoadmap, 
    validateRoadmapSchema 
  } = await import('file:///f:/NOVARA/server/roadmapService.js');

  // 1. File Magic Bytes Verification
  const pdfHeader = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Title (Placement Roadmap) >>\nendobj\n', 'utf8');
  assert(validateFileSignature(pdfHeader) === true, 'PDF magic bytes signature validated');

  // 2. Text Extraction
  const extractedText = await extractTextFromBuffer(pdfHeader, 'my_roadmap.pdf');
  assert(typeof extractedText === 'string', 'Text extracted from document buffer');

  // 3. Document Parsing
  const sampleDocument = `
# Phase 1: Data Structures & Algorithms
- Arrays & Two Pointers (Medium) - 20 problems
- Binary Search & Sorting (Medium) - 15 problems
# Phase 2: Core Computer Science
- Operating Systems & Concurrency (Hard) - 10 problems
- DBMS & SQL Window Functions (Medium) - 15 problems
  `;

  const parsedRoadmap = parseDocumentTextToRoadmap(sampleDocument, 'my_roadmap.pdf', 'Software Engineer');
  assert(parsedRoadmap.phases.length === 2, 'Extracted 2 distinct curriculum phases');
  assert(parsedRoadmap.phases[0].topics.length === 2, 'Extracted topics in Phase 1');
  assert(parsedRoadmap.phases[1].topics.length === 2, 'Extracted topics in Phase 2');

  // 4. Schema Validation
  const validation = validateRoadmapSchema(parsedRoadmap);
  assert(validation.valid === true, 'Parsed roadmap satisfies strict schema rules');

  console.log('🎉 Roadmap Upload Flow Tests Passed!\n');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
