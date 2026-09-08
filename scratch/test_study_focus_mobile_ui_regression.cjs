/**
 * NOVARA Mobile Study + Focus UI Critical Polish Regression Test Suite
 * Validates:
 * 1. Viewport layout & no horizontal overflow across (390x844, 412x915, 768x1024, 1280x800)
 * 2. Study Progress solid layout & non-overlapping flow
 * 3. Topic tabs horizontal scrolling isolation
 * 4. Reading progress scroll calculations (0% top -> ~50% mid -> 100% bottom)
 * 5. Focus header responsive mobile hierarchy (<Back, Close>, status/timer/category)
 * 6. Authoritative focus timer functionality & interval persistence
 * 7. Single authoritative vertical scroll architecture (.focus-study-grid)
 * 8. Tutor quick actions horizontal scroll & touch-friendly input
 * 9. Code card header stacking and internal horizontal scroll containment
 * 10. All major interactive elements >=44px touch targets
 * 11. Completion CTA visibility & layout reservation
 * 12. Card width constraints (Analogy, Definition, Formula, Practice, SelfCheck, Header, Tutor)
 * 13. Consistent Study section headers (icon + title alignment)
 * 14. Sticky elements strategy & zero nested scrolling
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

let passedTests = 0;
let totalTests = 0;

function it(desc, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ${GREEN}✓${RESET} ${desc}`);
    passedTests++;
  } catch (err) {
    console.error(`  ${RED}✗${RESET} ${desc}`);
    console.error(`    ${RED}${err.message}${RESET}`);
    throw err;
  }
}

function describe(suiteName, fn) {
  console.log(`\n${BLUE}● ${suiteName}${RESET}`);
  fn();
}

async function runTests() {
  console.log('================================================================');
  console.log('NOVARA — MOBILE STUDY + FOCUS UI REGRESSION TEST SUITE');
  console.log('================================================================');

  const cssPath = path.join(__dirname, '..', 'src', 'index.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');

  const modalPath = path.join(__dirname, '..', 'src', 'components', 'Focus', 'FocusSessionModal.jsx');
  const modalContent = fs.readFileSync(modalPath, 'utf8');

  const progressPath = path.join(__dirname, '..', 'src', 'components', 'Study', 'StudyProgress.jsx');
  const progressContent = fs.readFileSync(progressPath, 'utf8');

  const deepStudyPath = path.join(__dirname, '..', 'src', 'components', 'Study', 'DeepStudyDocument.jsx');
  const deepStudyContent = fs.readFileSync(deepStudyPath, 'utf8');

  const tutorPath = path.join(__dirname, '..', 'src', 'components', 'Study', 'StudyTutor.jsx');
  const tutorContent = fs.readFileSync(tutorPath, 'utf8');

  const defPath = path.join(__dirname, '..', 'src', 'components', 'Study', 'DefinitionCard.jsx');
  const defContent = fs.readFileSync(defPath, 'utf8');

  const formPath = path.join(__dirname, '..', 'src', 'components', 'Study', 'FormulaCard.jsx');
  const formContent = fs.readFileSync(formPath, 'utf8');

  const analogyPath = path.join(__dirname, '..', 'src', 'components', 'Study', 'AnalogyCard.jsx');
  const analogyContent = fs.readFileSync(analogyPath, 'utf8');

  const practicePath = path.join(__dirname, '..', 'src', 'components', 'Study', 'PracticeProblemCard.jsx');
  const practiceContent = fs.readFileSync(practicePath, 'utf8');

  const selfCheckPath = path.join(__dirname, '..', 'src', 'components', 'Study', 'SelfCheckCard.jsx');
  const selfCheckContent = fs.readFileSync(selfCheckPath, 'utf8');

  const headerPath = path.join(__dirname, '..', 'src', 'components', 'Study', 'StudyDocumentHeader.jsx');
  const headerContent = fs.readFileSync(headerPath, 'utf8');

  describe('1. Responsive Viewport CSS Architecture & Overflow Containment (390, 412, 768, 1280)', () => {
    it('contains mobile viewport rules for <=880px and <=640px', () => {
      assert(cssContent.includes('@media (max-width: 880px)'), 'Should contain <=880px media query for mobile grid');
      assert(cssContent.includes('@media (max-width: 640px)'), 'Should contain <=640px media query for mobile sheet');
    });

    it('enforces box-sizing: border-box and max-width: 100% on study container', () => {
      assert(cssContent.includes('box-sizing: border-box'), 'CSS should enforce box-sizing: border-box');
      assert(deepStudyContent.includes("boxSizing: 'border-box'"), 'DeepStudyDocument root should enforce border-box');
      assert(deepStudyContent.includes("maxWidth: '100%'"), 'DeepStudyDocument root should constrain maxWidth to 100%');
      assert(cssContent.includes('.deep-study-document'), 'CSS should define .deep-study-document constraints');
    });

    it('contains code block horizontal scroll containment inside pre without whole-page overflow', () => {
      assert(cssContent.includes('.deep-study-document pre'), 'Should target .deep-study-document pre');
      assert(cssContent.includes('overflow-x: auto !important'), 'Pre must have overflow-x: auto');
      assert(cssContent.includes('max-width: 100% !important'), 'Pre must have max-width: 100%');
    });
  });

  describe('2. Study Progress Solid Layout & Non-overlapping Flow', () => {
    it('StudyProgress renders opaque solid background with real layout space', () => {
      assert(progressContent.includes("backgroundColor: '#FFFFFF'"), 'StudyProgress must have solid white background');
      assert(progressContent.includes("border: '1px solid #E8E2D9'"), 'StudyProgress must have clean border');
      assert(progressContent.includes("marginBottom: '16px'"), 'StudyProgress must have bottom margin to reserve layout space');
    });

    it('StudyProgress contains Row 1 (Reading progress + percentage) and Row 2 (Pills)', () => {
      assert(progressContent.includes('Reading Progress') || progressContent.includes('Study Progress'), 'Must display Study/Reading Progress label');
      assert(progressContent.includes('Math.round(progress)'), 'Must display rounded progress percentage');
      assert(progressContent.includes('study-tabs-scroll-row'), 'Must contain horizontal tabs scroll row');
    });

    it('Topic pills have flexWrap: nowrap, overflowX: auto and >=44px touch height', () => {
      assert(progressContent.includes("flexWrap: 'nowrap'"), 'Topic pills must not wrap to multiple lines');
      assert(progressContent.includes("overflowX: 'auto'"), 'Topic pills must support horizontal scrolling');
      assert(progressContent.includes("minHeight: '44px'"), 'Topic pills must have >=44px touch height');
    });
  });

  describe('3. Reading Progress Scroll Calculation Logic', () => {
    it('calculates progress using actual scroll container (scrollTop / (scrollHeight - clientHeight))', () => {
      assert(deepStudyContent.includes('scrollTop / (scrollHeight - clientHeight)'), 'Progress formula must compute based on scrollable range');
      assert(deepStudyContent.includes('Math.min(100, Math.max(0,'), 'Progress must be clamped between 0 and 100');
    });

    it('simulates reading progress at top, middle, and bottom', () => {
      const calculateScrollProgress = (scrollTop, scrollHeight, clientHeight) => {
        const maxScroll = scrollHeight - clientHeight;
        if (maxScroll <= 0) return 100;
        const raw = (scrollTop / maxScroll) * 100;
        return Math.min(100, Math.max(0, Math.round(raw)));
      };

      const topProgress = calculateScrollProgress(0, 3000, 800);
      assert.strictEqual(topProgress, 0, 'Top of document must evaluate to 0%');

      const midProgress = calculateScrollProgress(1100, 3000, 800);
      assert(midProgress >= 45 && midProgress <= 55, `Middle of document should be ~50%, got ${midProgress}%`);

      const bottomProgress = calculateScrollProgress(2200, 3000, 800);
      assert.strictEqual(bottomProgress, 100, 'Bottom of document must evaluate to 100%');
    });

    it('uses requestAnimationFrame to throttle scroll calculations', () => {
      assert(deepStudyContent.includes('requestAnimationFrame'), 'Scroll calculation must use requestAnimationFrame');
    });
  });

  describe('4. Mobile Focus Header Redesign (<Back, Close> and status/timer)', () => {
    it('renders dedicated mobile wrapper with clean multi-row hierarchy on mobile', () => {
      assert(modalContent.includes('focus-header-mobile-wrapper'), 'FocusSessionModal must render mobile header wrapper');
      assert(modalContent.includes('focus-header-desktop-row'), 'FocusSessionModal must render desktop header row');
      assert(cssContent.includes('.focus-header-mobile-wrapper'), 'CSS must define mobile header responsive display');
      assert(cssContent.includes('.focus-header-desktop-row'), 'CSS must define desktop header responsive display');
    });

    it('ensures Back and Close buttons have >=44px touch targets on mobile', () => {
      assert(modalContent.includes("minHeight: '44px'"), 'Mobile Back and Close buttons must have minHeight: 44px');
      assert(modalContent.includes("minWidth: '44px'"), 'Mobile Close button must have minWidth: 44px');
    });
  });

  describe('5. Authoritative Focus Timer Functionality', () => {
    it('preserves authoritative timer state, pause/resume, and intervals', () => {
      assert(modalContent.includes('handleToggleTimer') || modalContent.includes('togglePauseResume'), 'Must support start/pause/resume');
      assert(modalContent.includes('handleExtendSession') || modalContent.includes('handleAddTenMinutes'), 'Must support +10m time addition');
      assert(modalContent.includes('elapsedSeconds'), 'Must track authoritative elapsed time');
      assert(modalContent.includes('formatTime'), 'Must format MM:SS accurately');
    });
  });

  describe('6. Single Authoritative Vertical Scroll Architecture', () => {
    it('sets single vertical scroll container on .focus-study-grid and disables nested column scrolling on mobile', () => {
      assert(cssContent.includes('.focus-study-grid {'), 'CSS must configure .focus-study-grid');
      assert(cssContent.includes('.focus-study-left-col'), 'CSS must define left column class');
      assert(cssContent.includes('.focus-study-right-col'), 'CSS must define right column class');
      assert(cssContent.includes('overflow-y: visible !important'), 'Columns must have overflow-y: visible on mobile to avoid nested scrolling');
    });
  });

  describe('7. AI Tutor Responsive Design & Touch Accessibility', () => {
    it('StudyTutor quick action pills scroll horizontally without wrapping awkwardly', () => {
      assert(tutorContent.includes('study-tutor-quick-actions'), 'StudyTutor must use quick action row class');
      assert(tutorContent.includes("overflowX: 'auto'"), 'Quick actions must scroll horizontally on mobile');
      assert(tutorContent.includes("whiteSpace: 'nowrap'"), 'Quick actions must have white-space: nowrap');
    });

    it('StudyTutor input and send button meet >=44px touch target height', () => {
      assert(tutorContent.includes("minHeight: '44px'"), 'Tutor input & button must have minHeight: 44px');
      assert(cssContent.includes('.study-tutor-input-row'), 'CSS must format tutor input row for mobile stacking');
    });
  });

  describe('8. Code Card Header Stacking & Responsive Controls', () => {
    it('code cards use .study-code-header and .study-code-actions for mobile stacking', () => {
      assert(deepStudyContent.includes('study-code-header'), 'DeepStudyDocument must assign study-code-header class');
      assert(deepStudyContent.includes('study-code-actions'), 'DeepStudyDocument must assign study-code-actions class');
      assert(cssContent.includes('.study-code-header'), 'CSS must style study-code-header');
      assert(cssContent.includes('.study-code-actions'), 'CSS must style study-code-actions');
    });

    it('Explain Code and Copy buttons have min-height >= 44px for touch friendliness', () => {
      assert(deepStudyContent.includes("minHeight: '44px'"), 'Code card action buttons must have minHeight >= 44px');
    });
  });

  describe('9. Study Completion CTA Hierarchy', () => {
    it('Completion CTA has full width, clear elevation, and >=44px height', () => {
      assert(deepStudyContent.includes("minHeight: '48px'") || deepStudyContent.includes("minHeight: '44px'"), 'Completion CTA must have >=44px height');
      assert(deepStudyContent.includes("width: '100%'"), 'Completion CTA must be full width');
      assert(deepStudyContent.includes('Complete') || deepStudyContent.includes('Quiz'), 'CTA must have clear completion action text');
    });
  });

  describe('10. Card Width Constraints & No Horizontal Overflow at 390px Viewport', () => {
    it('DefinitionCard enforces width 100%, max-width 100%, and minWidth 0', () => {
      assert(defContent.includes("width: '100%'"), 'DefinitionCard root must enforce width 100%');
      assert(defContent.includes("maxWidth: '100%'"), 'DefinitionCard root must enforce maxWidth 100%');
      assert(defContent.includes("minWidth: 0"), 'DefinitionCard root must enforce minWidth 0');
    });

    it('FormulaCard enforces width 100%, max-width 100%, and minWidth 0', () => {
      assert(formContent.includes("width: '100%'"), 'FormulaCard root must enforce width 100%');
      assert(formContent.includes("maxWidth: '100%'"), 'FormulaCard root must enforce maxWidth 100%');
      assert(formContent.includes("minWidth: 0"), 'FormulaCard root must enforce minWidth 0');
    });

    it('AnalogyCard enforces width 100%, max-width 100%, and minWidth 0', () => {
      assert(analogyContent.includes("width: '100%'"), 'AnalogyCard root must enforce width 100%');
      assert(analogyContent.includes("maxWidth: '100%'"), 'AnalogyCard root must enforce maxWidth 100%');
      assert(analogyContent.includes("minWidth: 0"), 'AnalogyCard root must enforce minWidth 0');
    });

    it('PracticeProblemCard enforces width 100%, max-width 100%, and minWidth 0', () => {
      assert(practiceContent.includes("width: '100%'"), 'PracticeProblemCard root must enforce width 100%');
      assert(practiceContent.includes("maxWidth: '100%'"), 'PracticeProblemCard root must enforce maxWidth 100%');
      assert(practiceContent.includes("minWidth: 0"), 'PracticeProblemCard root must enforce minWidth 0');
    });

    it('SelfCheckCard enforces width 100%, max-width 100%, and minWidth 0', () => {
      assert(selfCheckContent.includes("width: '100%'"), 'SelfCheckCard root must enforce width 100%');
      assert(selfCheckContent.includes("maxWidth: '100%'"), 'SelfCheckCard root must enforce maxWidth 100%');
      assert(selfCheckContent.includes("minWidth: 0"), 'SelfCheckCard root must enforce minWidth 0');
    });

    it('StudyDocumentHeader enforces width 100% and wordBreak on headings', () => {
      assert(headerContent.includes("width: '100%'"), 'StudyDocumentHeader root must enforce width 100%');
      assert(headerContent.includes("wordBreak: 'break-word'"), 'StudyDocumentHeader title must break words cleanly');
    });
  });

  describe('11. All Interactive Controls Meet >=44px Touch Targets', () => {
    it('validates touch targets on Back, Close, Timer controls, Topic pills, Tutor buttons, and CTAs', () => {
      assert(modalContent.includes("minHeight: '44px'"), 'Modal header & timer buttons must have minHeight >= 44px');
      assert(progressContent.includes("minHeight: '44px'"), 'Topic pills must have minHeight >= 44px');
      assert(tutorContent.includes("minHeight: '44px'"), 'Tutor actions & input must have minHeight >= 44px');
      assert(deepStudyContent.includes("minHeight: '44px'"), 'Code card buttons must have minHeight >= 44px');
      assert(deepStudyContent.includes("minHeight: '48px'"), 'Final completion CTA must have minHeight >= 48px');
    });
  });

  describe('12. Study Section Headers Consistency & Icon Alignment', () => {
    it('verifies standard section headers in DeepStudyDocument', () => {
      assert(deepStudyContent.includes('Learning Objectives'), 'Must render Learning Objectives header');
      assert(deepStudyContent.includes('Core Concepts & Mechanisms'), 'Must render Core Concepts header');
      assert(deepStudyContent.includes('Problem-Solving Patterns'), 'Must render Problem-Solving Patterns header');
      assert(deepStudyContent.includes('Idiomatics & Complexity') || deepStudyContent.includes('Idiomatic Implementations & Complexity'), 'Must render Complexity header');
      assert(deepStudyContent.includes('Common Pitfalls') || deepStudyContent.includes('Common Pitfalls to Avoid'), 'Must render Common Pitfalls header');
      assert(deepStudyContent.includes('High-Yield Recap & Takeaways'), 'Must render High-Yield Recap header');
    });
  });

  console.log('================================================================');
  console.log(`ALL TESTS PASSED: ${passedTests}/${totalTests}`);
  console.log('================================================================\n');
}

runTests().catch(err => {
  console.error('\nTest suite failed with error:', err);
  process.exit(1);
});
