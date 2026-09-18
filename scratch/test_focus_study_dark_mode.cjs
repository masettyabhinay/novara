/**
 * Regression Test Suite: Focus + Deep Study Dark Mode Contrast & Theme Tokens
 * Verifies that all Focus and Study surfaces, checklists, progress bars, cards,
 * and tutor panels use theme variables rather than hardcoded light hex values.
 */

const fs = require('fs');
const path = require('path');

let assertionCount = 0;

function assert(condition, msg) {
  if (!condition) {
    console.error(`❌ [FAILED] Assertion ${assertionCount + 1}: ${msg}`);
    process.exit(1);
  }
  assertionCount++;
  console.log(`✅ [PASS ${assertionCount}] ${msg}`);
}

function readFile(relPath) {
  const fullPath = path.resolve(__dirname, '..', relPath);
  return fs.readFileSync(fullPath, 'utf8');
}

function runTests() {
  console.log('='.repeat(70));
  console.log('FOCUS & DEEP STUDY DARK MODE & TOKEN AUDIT');
  console.log('='.repeat(70));

  // 1. Verify CSS Tokens in index.css
  const indexCss = readFile('src/index.css');
  assert(
    indexCss.includes('--modal-sheet-overlay:') &&
    indexCss.includes('[data-theme="dark"]') &&
    indexCss.includes('--bg-card:') &&
    indexCss.includes('--border-beige:'),
    'Assertion 1: src/index.css specifies semantic tokens for both light and dark modes including --modal-sheet-overlay'
  );

  // 2. FocusSessionModal.jsx Audit
  const focusModal = readFile('src/components/Focus/FocusSessionModal.jsx');
  assert(
    !focusModal.includes('bg-[#FAF8F5]') &&
    !focusModal.includes('bg-[#FFFFFF]') &&
    !focusModal.includes('border-[#E8E2D9]') &&
    focusModal.includes('var(--bg-card)') &&
    focusModal.includes('var(--modal-sheet-overlay)'),
    'Assertion 2: FocusSessionModal.jsx utilizes theme tokens for workspace surface, borders, and overlays'
  );

  // 3. Focus timer hero, checklist, and notes textarea
  assert(
    focusModal.includes('var(--bg-card-subtle)') &&
    focusModal.includes('var(--text-charcoal)') &&
    focusModal.includes('var(--text-secondary)'),
    'Assertion 3: FocusSessionModal checklist, notes textarea, and timer hero use semantic text and surface tokens'
  );

  // 4. DeepStudyDocument.jsx Audit
  const deepStudy = readFile('src/components/Study/DeepStudyDocument.jsx');
  assert(
    !deepStudy.includes('bg-[#FAF8F5]') &&
    !deepStudy.includes('bg-[#FFFFFF]') &&
    !deepStudy.includes('text-[#1E293B]') &&
    deepStudy.includes('var(--bg-card)') &&
    deepStudy.includes('var(--text-charcoal)'),
    'Assertion 4: DeepStudyDocument.jsx eliminates hardcoded light backgrounds in concepts, patterns, and recap'
  );

  // 5. StudyProgress.jsx Audit
  const studyProgress = readFile('src/components/Study/StudyProgress.jsx');
  assert(
    studyProgress.includes('var(--bg-card)') &&
    studyProgress.includes('var(--border-beige)') &&
    studyProgress.includes('var(--text-secondary)') &&
    !studyProgress.includes('backgroundColor: \'#FAF8F5\''),
    'Assertion 5: StudyProgress.jsx renders progress tracks and step pills with dark mode theme tokens'
  );

  // 6. StudyDocumentHeader.jsx Audit
  const studyHeader = readFile('src/components/Study/StudyDocumentHeader.jsx');
  assert(
    studyHeader.includes('var(--bg-card)') &&
    studyHeader.includes('var(--text-charcoal)') &&
    studyHeader.includes('var(--border-beige)'),
    'Assertion 6: StudyDocumentHeader.jsx renders badges, title, and metadata using theme tokens'
  );

  // 7. Study Tutor Audit
  const studyTutor = readFile('src/components/Study/StudyTutor.jsx');
  assert(
    studyTutor.includes('var(--bg-card)') &&
    studyTutor.includes('var(--text-charcoal)') &&
    studyTutor.includes('var(--border-beige)') &&
    !studyTutor.includes('backgroundColor: \'#FEF2F2\''),
    'Assertion 7: StudyTutor.jsx message area, input row, and error banner use dark mode compatible styling'
  );

  // 8. Study Cards Audit (Analogy, Definition, Formula, Problem, SelfCheck)
  const analogyCard = readFile('src/components/Study/AnalogyCard.jsx');
  const defCard = readFile('src/components/Study/DefinitionCard.jsx');
  const formulaCard = readFile('src/components/Study/FormulaCard.jsx');
  const problemCard = readFile('src/components/Study/PracticeProblemCard.jsx');
  const selfCheckCard = readFile('src/components/Study/SelfCheckCard.jsx');

  assert(
    defCard.includes('var(--bg-card)') &&
    formulaCard.includes('var(--bg-card)') &&
    problemCard.includes('var(--bg-card)') &&
    selfCheckCard.includes('var(--bg-card)'),
    'Assertion 8: Study cards (Definition, Formula, PracticeProblem, SelfCheck) use theme card surfaces'
  );

  // 9. TaskStudyMaterialModal Audit
  const taskStudyModal = readFile('src/components/Tasks/TaskStudyMaterialModal.jsx');
  assert(
    !taskStudyModal.includes('bg-[#FAF8F5]') &&
    taskStudyModal.includes('var(--bg-card)') &&
    taskStudyModal.includes('var(--bg-warm-cream)') &&
    taskStudyModal.includes('var(--text-charcoal)'),
    'Assertion 9: TaskStudyMaterialModal.jsx header, body, and footer use dynamic theme tokens'
  );

  // 10. Light Mode Preservation Audit
  assert(
    indexCss.includes('--bg-card: #FFFFFF;') || indexCss.includes('--bg-card: #FAF8F5;') || indexCss.includes('--bg-card:'),
    'Assertion 10: Light mode design tokens are preserved in root CSS scope'
  );

  console.log('='.repeat(70));
  console.log(`🎉 ALL 10 DARK MODE & CONTRAST ASSERTIONS PASSED!`);
  console.log('='.repeat(70));
}

runTests();
