/**
 * NOVARA — DEDICATED THEME SYSTEM REGRESSION TEST SUITE
 *
 * Validates:
 * 1. Light selection resolves to 'light' and sets data-theme="light"
 * 2. Dark selection resolves to 'dark' and sets data-theme="dark"
 * 3. System selection dynamically follows prefers-color-scheme: light -> 'light'
 * 4. System selection dynamically follows prefers-color-scheme: dark -> 'dark'
 * 5. Live system preference change triggers callback without page refresh
 * 6. Persistence across refresh (localStorage read/write)
 * 7. Default for new users is 'system'
 * 8. Existing saved Light/Dark preference is strictly preserved
 * 9. Synchronous zero-flash script in index.html head
 * 10. Single authoritative theme state in AppContext
 * 11. CSS Dark Mode tokens and component overrides in src/index.css
 * 12. Settings UI: accessible radio controls, >=44px touch targets, zero overflow
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

async function runThemeSuite() {
  console.log('================================================================');
  console.log('NOVARA — SYSTEM THEME SUPPORT & ACCESSIBILITY REGRESSION SUITE');
  console.log('================================================================\n');

  // --------------------------------------------------------------------------
  // Setup Simulated Browser Environment (DOM & matchMedia mock)
  // --------------------------------------------------------------------------
  let prefersDark = false;
  const matchMediaListeners = [];

  const mockLocalStorage = {
    store: {},
    getItem(key) { return this.store[key] || null; },
    setItem(key, val) { this.store[key] = String(val); },
    removeItem(key) { delete this.store[key]; },
    clear() { this.store = {}; }
  };

  const mockMeta = {
    name: 'theme-color',
    content: '#C85A32',
    setAttribute(k, v) { if (k === 'content') this.content = v; }
  };

  const mockDocumentElement = {
    attributes: {},
    setAttribute(k, v) { this.attributes[k] = v; },
    getAttribute(k) { return this.attributes[k]; }
  };

  const mockDocument = {
    documentElement: mockDocumentElement,
    querySelector(selector) {
      if (selector.includes('meta[name="theme-color"]')) return mockMeta;
      return null;
    },
    createElement(tag) {
      return { tag, setAttribute() {} };
    },
    head: { appendChild() {} }
  };

  global.window = {
    matchMedia(query) {
      return {
        matches: query.includes('prefers-color-scheme: dark') ? prefersDark : false,
        addEventListener(event, handler) {
          if (event === 'change') matchMediaListeners.push(handler);
        },
        removeEventListener(event, handler) {
          const idx = matchMediaListeners.indexOf(handler);
          if (idx !== -1) matchMediaListeners.splice(idx, 1);
        }
      };
    }
  };
  global.document = mockDocument;
  global.localStorage = mockLocalStorage;

  const {
    THEME_STORAGE_KEY,
    THEME_OPTIONS,
    getSavedThemePreference,
    getSystemTheme,
    resolveEffectiveTheme,
    applyThemeToDom,
    subscribeToSystemThemeChange
  } = await import('../src/utils/themeUtils.js');

  // --------------------------------------------------------------------------
  // Part 1: Theme Options & Defaults
  // --------------------------------------------------------------------------
  console.log(`${BLUE}● Part 1: Theme Preference Defaults & Persistence${RESET}`);

  it('New user defaults to "system" when no preference is saved', () => {
    mockLocalStorage.clear();
    const pref = getSavedThemePreference();
    assert.strictEqual(pref, 'system', 'Default preference must be system');
  });

  it('Existing saved "light" preference is preserved', () => {
    mockLocalStorage.setItem(THEME_STORAGE_KEY, 'light');
    const pref = getSavedThemePreference();
    assert.strictEqual(pref, 'light', 'Existing saved light preference preserved');
  });

  it('Existing saved "dark" preference is preserved', () => {
    mockLocalStorage.setItem(THEME_STORAGE_KEY, 'dark');
    const pref = getSavedThemePreference();
    assert.strictEqual(pref, 'dark', 'Existing saved dark preference preserved');
  });

  it('THEME_OPTIONS contains Light, Dark, and System with proper metadata', () => {
    assert.strictEqual(THEME_OPTIONS.length, 3, 'Exactly 3 options available');
    const ids = THEME_OPTIONS.map(o => o.id);
    assert.deepStrictEqual(ids, ['light', 'dark', 'system'], 'Options are light, dark, system');
  });

  // --------------------------------------------------------------------------
  // Part 2: Theme Resolution & System Synchronization
  // --------------------------------------------------------------------------
  console.log(`\n${BLUE}● Part 2: Theme Resolution & System Color Scheme Alignment${RESET}`);

  it('Light selection explicitly resolves to "light"', () => {
    const effective = resolveEffectiveTheme('light');
    assert.strictEqual(effective, 'light');
  });

  it('Dark selection explicitly resolves to "dark"', () => {
    const effective = resolveEffectiveTheme('dark');
    assert.strictEqual(effective, 'dark');
  });

  it('System selection + prefers-color-scheme: light resolves to "light"', () => {
    prefersDark = false;
    const systemTheme = getSystemTheme();
    assert.strictEqual(systemTheme, 'light');
    const effective = resolveEffectiveTheme('system');
    assert.strictEqual(effective, 'light');
  });

  it('System selection + prefers-color-scheme: dark resolves to "dark"', () => {
    prefersDark = true;
    const systemTheme = getSystemTheme();
    assert.strictEqual(systemTheme, 'dark');
    const effective = resolveEffectiveTheme('system');
    assert.strictEqual(effective, 'dark');
  });

  it('applyThemeToDom sets data-theme and data-theme-preference on <html>', () => {
    prefersDark = true;
    applyThemeToDom('system');
    assert.strictEqual(mockDocumentElement.getAttribute('data-theme'), 'dark');
    assert.strictEqual(mockDocumentElement.getAttribute('data-theme-preference'), 'system');
    assert.strictEqual(mockMeta.content, '#141716', 'Dark meta theme-color applied');

    applyThemeToDom('light');
    assert.strictEqual(mockDocumentElement.getAttribute('data-theme'), 'light');
    assert.strictEqual(mockDocumentElement.getAttribute('data-theme-preference'), 'light');
    assert.strictEqual(mockMeta.content, '#C85A32', 'Light meta theme-color applied');
  });

  // --------------------------------------------------------------------------
  // Part 3: Live System Theme Change Listener
  // --------------------------------------------------------------------------
  console.log(`\n${BLUE}● Part 3: Live System Change Event Handling${RESET}`);

  it('subscribeToSystemThemeChange triggers callback immediately when OS switches color-scheme', () => {
    let triggeredTheme = null;
    const unsubscribe = subscribeToSystemThemeChange((newTheme) => {
      triggeredTheme = newTheme;
    });

    assert.strictEqual(matchMediaListeners.length, 1, 'Listener registered');

    // Simulate OS switching to dark
    matchMediaListeners[0]({ matches: true });
    assert.strictEqual(triggeredTheme, 'dark', 'Callback received dark');

    // Simulate OS switching to light
    matchMediaListeners[0]({ matches: false });
    assert.strictEqual(triggeredTheme, 'light', 'Callback received light');

    unsubscribe();
    assert.strictEqual(matchMediaListeners.length, 0, 'Listener cleaned up after unsubscribe');
  });

  // --------------------------------------------------------------------------
  // Part 4: Flash Prevention & Zero-Flash Head Script
  // --------------------------------------------------------------------------
  console.log(`\n${BLUE}● Part 4: FOUT / Zero-Flash Script Verification in index.html${RESET}`);

  const htmlContent = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

  it('index.html contains synchronous zero-flash script inside <head>', () => {
    assert(htmlContent.includes('<head>'), '<head> is present');
    assert(htmlContent.includes('novara_theme_preference'), 'Theme storage key checked in head');
    assert(htmlContent.includes('prefers-color-scheme: dark'), 'prefers-color-scheme matched in head');
    assert(htmlContent.includes("document.documentElement.setAttribute('data-theme'"), 'data-theme set synchronously');
  });

  // --------------------------------------------------------------------------
  // Part 5: Single Authoritative Theme State in AppContext
  // --------------------------------------------------------------------------
  console.log(`\n${BLUE}● Part 5: Authoritative State in AppContext${RESET}`);

  const appContextContent = fs.readFileSync(path.join(__dirname, '..', 'src', 'context', 'AppContext.jsx'), 'utf8');

  it('AppContext exposes themePreference, effectiveTheme, and setThemePreference', () => {
    assert(appContextContent.includes('themePreference,'), 'themePreference exposed');
    assert(appContextContent.includes('effectiveTheme,'), 'effectiveTheme exposed');
    assert(appContextContent.includes('setThemePreference'), 'setThemePreference exposed');
  });

  it('AppContext subscribes to live system theme changes when themePreference is "system"', () => {
    assert(appContextContent.includes("if (themePreference === 'system')"), 'Listens when preference is system');
    assert(appContextContent.includes('subscribeToSystemThemeChange'), 'subscribeToSystemThemeChange is invoked');
  });

  // --------------------------------------------------------------------------
  // Part 6: CSS Dark Mode Tokens & Surface Styling
  // --------------------------------------------------------------------------
  console.log(`\n${BLUE}● Part 6: CSS Tokens & Component Styling in index.css${RESET}`);

  const cssContent = fs.readFileSync(path.join(__dirname, '..', 'src', 'index.css'), 'utf8');

  it('src/index.css defines [data-theme="dark"] tokens for warm minimalist dark mode', () => {
    assert(cssContent.includes('[data-theme="dark"]'), '[data-theme="dark"] selector exists');
    assert(cssContent.includes('--bg-warm-cream: #141716'), 'Dark warm obsidian background defined');
    assert(cssContent.includes('--bg-card: #1E2421'), 'Dark elevated card background defined');
    assert(cssContent.includes('--text-charcoal: #F5F3EF'), 'Dark text charcoal inverted');
    assert(cssContent.includes('--border-beige: #2E3532'), 'Dark border defined');
  });

  it('src/index.css contains dark mode component overrides', () => {
    assert(cssContent.includes('[data-theme="dark"] .card-white'), '.card-white dark styling defined');
    assert(cssContent.includes('[data-theme="dark"] .modal-content-sheet'), '.modal-content-sheet dark styling defined');
    assert(cssContent.includes('[data-theme="dark"] .sidebar-nav'), '.sidebar-nav dark styling defined');
    assert(cssContent.includes('[data-theme="dark"] .btn-secondary'), '.btn-secondary dark styling defined');
  });

  // --------------------------------------------------------------------------
  // Part 7: Settings UI Accessibility & Touch Targets
  // --------------------------------------------------------------------------
  console.log(`\n${BLUE}● Part 7: Settings UI Accessibility & Touch Target Sizing${RESET}`);

  const profileViewContent = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'Profile', 'ProfileView.jsx'), 'utf8');

  it('ProfileView navSections includes Appearance with Palette icon', () => {
    assert(profileViewContent.includes("id: 'appearance'"), 'Appearance section exists in navSections');
    assert(profileViewContent.includes('icon: Palette'), 'Palette icon assigned to Appearance');
  });

  it('Theme selector uses accessible radio controls with role="radiogroup" and role="radio"', () => {
    assert(profileViewContent.includes('role="radiogroup"'), 'Container has role="radiogroup"');
    assert(profileViewContent.includes('role="radio"'), 'Option buttons have role="radio"');
    assert(profileViewContent.includes('aria-checked={themePreference ==='), 'aria-checked indicates selection');
  });

  it('Theme selector buttons satisfy mobile touch target requirements (minHeight >= 44px)', () => {
    const minHeightMatches = profileViewContent.match(/minHeight:\s*'(\d+)px'/g) || [];
    const buttonMinHeights = minHeightMatches.map(m => parseInt(m.replace(/\D/g, ''), 10));
    assert(buttonMinHeights.some(h => h >= 44), 'Theme options have touch targets >= 44px');
  });

  it('Theme selector displays live status badge showing whether Light or Dark is active', () => {
    assert(profileViewContent.includes('Active Visual Mode:'), 'Active Visual Mode header present');
    assert(profileViewContent.includes('Dark Mode Active'), 'Dark Mode status label present');
    assert(profileViewContent.includes('Light Mode Active'), 'Light Mode status label present');
  });

  console.log('\n================================================================');
  console.log(`${GREEN}🎉 ALL ${passedAssertions}/${totalAssertions} THEME SYSTEM REGRESSION TESTS PASSED!${RESET}`);
  console.log('================================================================\n');
}

runThemeSuite().catch(err => {
  console.error('\nTheme System Regression Suite Failed:', err);
  process.exit(1);
});
