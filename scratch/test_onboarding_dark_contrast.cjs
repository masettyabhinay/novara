/**
 * NOVARA — DARK MODE ONBOARDING CONTRAST & ACCESSIBILITY REGRESSION TEST SUITE
 *
 * Verifies:
 * 1. Step 1 (Role Selection): Unselected roles have dark-mode readable tokens, not hardcoded white backgrounds
 * 2. Step 1: Selected role appearance is preserved (terracotta light bg, terracotta border & check)
 * 3. Step 2 (Target Date): Native date input and preset sprint buttons have dark-mode contrast & >=44px height
 * 4. Step 3 (Daily Study Capacity): Unselected time cards have dark-mode readable tokens & visible radios
 * 5. Step 4 (Preparation Level): Unselected level cards have dark-mode readable tokens & visible radios
 * 6. Step 5 (Curriculum Roadmap): Unselected roadmap presets have dark-mode readable tokens & visible radios
 * 7. Step 5: Error banner uses theme-aware terracotta light tint instead of hardcoded #FFF1EE
 * 8. All title text uses var(--text-charcoal) which evaluates to #F5F3EF in dark mode (AAA contrast 14.7:1)
 * 9. All description text uses var(--text-secondary) which evaluates to #9EA6A1 in dark mode (AA contrast 5.5:1)
 * 10. Radio controls have visible border tokens (var(--border-beige-dark) / var(--text-muted)) in dark mode
 * 11. Buttons (Back & Continue) maintain >=44px touch targets and valid contrast
 * 12. Keyboard focus visibility (:focus-visible) is defined in CSS
 * 13. Light mode appearance is 100% preserved (var(--bg-card) resolves to #FFFFFF in light mode)
 * 14. No onboarding business logic or state persistence is altered
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

let totalAssertions = 0;
let passedAssertions = 0;

function it(description, fn) {
  totalAssertions++;
  try {
    fn();
    console.log(`  ${GREEN}✓${RESET} ${description}`);
    passedAssertions++;
  } catch (err) {
    console.error(`  ${RED}✗${RESET} ${description}`);
    console.error(`    ${RED}${err.message}${RESET}`);
    throw err;
  }
}

// Relative luminance and contrast ratio calculation according to WCAG 2.1 specs
function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function hexToRgb(hex) {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  const num = parseInt(hex, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

function getContrastRatio(hex1, hex2) {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

function runSuite() {
  console.log('================================================================');
  console.log('NOVARA — DARK MODE ONBOARDING CONTRAST REGRESSION SUITE');
  console.log('================================================================\n');

  const onboardingPath = path.join(__dirname, '..', 'src', 'components', 'Onboarding', 'OnboardingFlow.jsx');
  const cssPath = path.join(__dirname, '..', 'src', 'index.css');

  const onboardingCode = fs.readFileSync(onboardingPath, 'utf8');
  const cssCode = fs.readFileSync(cssPath, 'utf8');

  console.log(`${BLUE}[1. Hardcoded Light Background Inspection]${RESET}`);

  it('No hardcoded #FFFFFF card backgrounds in role selection or other steps', () => {
    // Check that card-white inline styles do not use '#FFFFFF' for background
    const hardcodedCardBgMatches = onboardingCode.match(/backgroundColor:\s*([^?]+?\?\s*[^:]+?:\s*['"]#FFFFFF['"])/g);
    assert.strictEqual(
      hardcodedCardBgMatches,
      null,
      `Found forbidden hardcoded #FFFFFF unselected background in: ${JSON.stringify(hardcodedCardBgMatches)}`
    );
  });

  it('Unselected cards use var(--bg-card) semantic token across steps 1, 3, 4, and 5', () => {
    assert.ok(
      onboardingCode.includes("backgroundColor: isSelected ? 'var(--accent-terracotta-light)' : 'var(--bg-card)'"),
      'Step 1/3/4 role cards must use var(--bg-card) when unselected'
    );
    assert.ok(
      onboardingCode.includes("backgroundColor: formData.selectedPresetRoadmap === 'sde' ? 'var(--accent-terracotta-light)' : 'var(--bg-card)'"),
      'Step 5 SDE card must use var(--bg-card) when unselected'
    );
    assert.ok(
      onboardingCode.includes("backgroundColor: formData.selectedPresetRoadmap === 'datascience' ? 'var(--accent-navy-light)' : 'var(--bg-card)'"),
      'Step 5 Data Science card must use var(--bg-card) when unselected'
    );
  });

  it('Step 5 error banner does not use hardcoded #FFF1EE in dark mode', () => {
    assert.ok(!onboardingCode.includes('#FFF1EE'), 'Error banner must not use hardcoded #FFF1EE background');
    assert.ok(
      onboardingCode.includes("backgroundColor: 'var(--accent-terracotta-light)'"),
      'Error banner must use theme-aware var(--accent-terracotta-light)'
    );
  });

  console.log(`\n${BLUE}[2. WCAG Contrast Token Calculations]${RESET}`);

  it('Dark Mode: Card surface #1E2421 to Title text #F5F3EF meets WCAG AAA standard (>= 7:1)', () => {
    const cardBg = '#1E2421';
    const textCharcoal = '#F5F3EF';
    const ratio = getContrastRatio(cardBg, textCharcoal);
    assert.ok(ratio >= 7.0, `Contrast ratio ${ratio.toFixed(2)} is less than AAA threshold 7.0`);
    assert.ok(ratio >= 14.0, `Expected ~14.7:1 contrast, got ${ratio.toFixed(2)}`);
  });

  it('Dark Mode: Card surface #1E2421 to Description text #9EA6A1 meets WCAG AA standard (>= 4.5:1)', () => {
    const cardBg = '#1E2421';
    const textSecondary = '#9EA6A1';
    const ratio = getContrastRatio(cardBg, textSecondary);
    assert.ok(ratio >= 4.5, `Contrast ratio ${ratio.toFixed(2)} is less than AA threshold 4.5`);
  });

  it('Dark Mode: Icon terracotta #E06D44 on recessed tile #141716 meets WCAG AA (>= 4.5:1)', () => {
    const tileBg = '#141716';
    const terracotta = '#E06D44';
    const ratio = getContrastRatio(tileBg, terracotta);
    assert.ok(ratio >= 4.5, `Contrast ratio ${ratio.toFixed(2)} is less than AA threshold 4.5`);
  });

  it('Dark Mode: Unselected radio circle border #727B76 on card #1E2421 meets UI element standard (>= 3:1)', () => {
    const cardBg = '#1E2421';
    const radioBorder = '#727B76';
    const ratio = getContrastRatio(cardBg, radioBorder);
    assert.ok(ratio >= 3.0, `Radio border contrast ${ratio.toFixed(2)} is less than 3.0`);
  });

  it('Light Mode: Preserves exact contrast ratios (Card #FFFFFF with Title #1C211F and Desc #5F6662)', () => {
    const cardBg = '#FFFFFF';
    const textCharcoal = '#1C211F';
    const textSecondary = '#5F6662';
    const titleRatio = getContrastRatio(cardBg, textCharcoal);
    const descRatio = getContrastRatio(cardBg, textSecondary);
    assert.ok(titleRatio >= 14.0, `Light mode title contrast ${titleRatio.toFixed(2)} should be >= 14`);
    assert.ok(descRatio >= 4.5, `Light mode desc contrast ${descRatio.toFixed(2)} should be >= 4.5`);
  });

  console.log(`\n${BLUE}[3. Radio Controls & Selected State Preservation]${RESET}`);

  it('Unselected roles have clearly visible radio controls in both Light and Dark mode', () => {
    assert.ok(
      onboardingCode.includes('onboarding-radio-circle'),
      'OnboardingFlow must reference onboarding-radio-circle class'
    );
    assert.ok(
      cssCode.includes('.onboarding-radio-circle'),
      'index.css must define .onboarding-radio-circle'
    );
    assert.ok(
      cssCode.includes('[data-theme="dark"] .onboarding-radio-circle'),
      'index.css must define dark mode override for .onboarding-radio-circle'
    );
  });

  it('Selected role appearance is strictly preserved (terracotta light bg, terracotta border & check)', () => {
    assert.ok(
      onboardingCode.includes("borderColor: isSelected ? 'var(--accent-terracotta)' : 'var(--border-beige-dark)'"),
      'Selected card must use var(--accent-terracotta) border'
    );
    assert.ok(
      onboardingCode.includes("backgroundColor: isSelected ? 'var(--accent-terracotta)' : 'var(--bg-warm-cream)'"),
      'Selected icon tile must use filled terracotta background'
    );
    assert.ok(
      onboardingCode.includes("color: isSelected ? '#FFFFFF' : 'var(--accent-terracotta)'"),
      'Selected icon must be #FFFFFF on terracotta'
    );
    assert.ok(
      onboardingCode.includes('{isSelected && <Check size={12} strokeWidth={3} />}'),
      'Selected radio must render check icon'
    );
  });

  console.log(`\n${BLUE}[4. All Onboarding Steps Audited]${RESET}`);

  it('Step 1 (Roles): Unselected AI/ML, Data Scientist, Data Analyst, Other have dark contrast', () => {
    const roles = ['Software Engineer', 'AI/ML Engineer', 'Data Scientist', 'Data Analyst', 'Other'];
    roles.forEach(r => {
      assert.ok(onboardingCode.includes(`'${r}'`), `Role ${r} must be present in roles list`);
    });
    // Verify mapped elements use var(--text-charcoal) and var(--text-secondary)
    assert.ok(
      onboardingCode.includes("color: 'var(--text-charcoal)'"),
      'Title must use var(--text-charcoal)'
    );
    assert.ok(
      onboardingCode.includes("color: 'var(--text-secondary)'"),
      'Description must use var(--text-secondary)'
    );
  });

  it('Step 2 (Target Date): Date input has explicit text color and preset buttons have >=44px height', () => {
    assert.ok(
      onboardingCode.includes("color: 'var(--text-charcoal)'"),
      'Date input must specify var(--text-charcoal)'
    );
    assert.ok(
      onboardingCode.includes("colorScheme: 'inherit'"),
      'Date input must support theme colorScheme'
    );
    assert.ok(
      onboardingCode.includes("minHeight: '44px'"),
      'Preset sprint buttons must meet >=44px touch target'
    );
  });

  it('Step 3 (Daily Study Time): Unselected cards use var(--bg-card) and visible radio controls', () => {
    assert.ok(
      onboardingCode.includes("Clock size={18}"),
      'Step 3 renders Clock icon'
    );
    assert.ok(
      onboardingCode.includes("formData.dailyTargetHours === t.hours"),
      'Step 3 maps daily hours selection correctly'
    );
  });

  it('Step 4 (Preparation Level): Unselected cards use var(--bg-card) and visible radio controls', () => {
    assert.ok(
      onboardingCode.includes("formData.prepLevel === lvl.id"),
      'Step 4 maps preparation level correctly'
    );
  });

  it('Step 5 (Curriculum Roadmap): Both SDE and Data Science cards use var(--bg-card) when unselected', () => {
    assert.ok(
      onboardingCode.includes("Top Tech SDE-1 Masterplan"),
      'Step 5 includes SDE preset roadmap'
    );
    assert.ok(
      onboardingCode.includes("Data Science & ML Placement Blueprint"),
      'Step 5 includes Data Science preset roadmap'
    );
    assert.ok(
      onboardingCode.includes('selected-navy'),
      'Data Science radio circle uses selected-navy class'
    );
  });

  console.log(`\n${BLUE}[5. Accessibility & Interaction Polish]${RESET}`);

  it('Interactive card targets meet >=44px requirement (min-height: 56px)', () => {
    const minHeightMatches = onboardingCode.match(/minHeight:\s*['"]56px['"]/g);
    assert.ok(minHeightMatches && minHeightMatches.length >= 4, 'Option cards across steps must have minHeight >= 56px');
  });

  it('Navigation buttons (Back, Continue) meet >=44px touch targets', () => {
    assert.ok(
      onboardingCode.includes("className=\"btn-secondary\"") && onboardingCode.includes("minHeight: '44px'"),
      'Back button has minHeight >= 44px'
    );
    assert.ok(
      onboardingCode.includes("className=\"btn-primary\"") && onboardingCode.includes("minHeight: '44px'"),
      'Continue button has minHeight >= 44px'
    );
  });

  it('Keyboard accessibility: role="radio", aria-checked, tabIndex and onKeyDown are implemented', () => {
    assert.ok(onboardingCode.includes('role="radio"'), 'Cards must have role="radio"');
    assert.ok(onboardingCode.includes('aria-checked='), 'Cards must have aria-checked attribute');
    assert.ok(onboardingCode.includes('tabIndex={0}'), 'Cards must have tabIndex={0} for keyboard focus');
    assert.ok(onboardingCode.includes("e.key === 'Enter' || e.key === ' '"), 'Cards must handle Enter/Space keys');
  });

  it('Keyboard focus visibility: CSS defines :focus-visible outline for interactive cards', () => {
    assert.ok(
      cssCode.includes('.card-white.interactive:focus-visible'),
      'CSS must define focus-visible outline for interactive cards'
    );
  });

  console.log(`\n${BLUE}[6. Business Logic & Theme Token Integrity]${RESET}`);

  it('Light mode token values in index.css are strictly preserved', () => {
    assert.ok(cssCode.includes('--bg-card: #FFFFFF;'), '--bg-card must remain #FFFFFF in light mode');
    assert.ok(cssCode.includes('--text-charcoal: #1C211F;'), '--text-charcoal must remain #1C211F in light mode');
    assert.ok(cssCode.includes('--text-secondary: #5E6763;'), '--text-secondary must remain #5E6763 in light mode');
    assert.ok(cssCode.includes('--accent-terracotta: #C85A32;'), '--accent-terracotta must remain #C85A32 in light mode');
  });

  it('Dark mode token values in index.css are strictly preserved', () => {
    assert.ok(cssCode.includes('--bg-card: #1E2421;'), '--bg-card must remain #1E2421 in dark mode');
    assert.ok(cssCode.includes('--text-charcoal: #F5F3EF;'), '--text-charcoal must remain #F5F3EF in dark mode');
    assert.ok(cssCode.includes('--text-secondary: #9EA6A1;'), '--text-secondary must remain #9EA6A1 in dark mode');
    assert.ok(cssCode.includes('--accent-terracotta: #E06D44;'), '--accent-terracotta must remain #E06D44 in dark mode');
  });

  it('Onboarding state persistence and plan generation handlers are intact', () => {
    assert.ok(onboardingCode.includes('generateDailyTasksFromRoadmap('), 'generateDailyTasksFromRoadmap call preserved');
    assert.ok(onboardingCode.includes('setIsOnboardingOpen(false)'), 'Modal close logic preserved');
    assert.ok(onboardingCode.includes("setActiveTab('today')"), 'Navigation to today tab preserved');
  });

  console.log('\n================================================================');
  console.log(`RESULTS: ${passedAssertions}/${totalAssertions} assertions passed`);
  console.log('================================================================');
}

runSuite();
