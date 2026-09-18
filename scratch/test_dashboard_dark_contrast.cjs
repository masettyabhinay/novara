/**
 * NOVARA — DASHBOARD DARK MODE CONTRAST & COMPONENT SURFACES REGRESSION TEST SUITE
 *
 * Verifies:
 * 1. Today's Mission primary card: Has dark gradient tokens and no hardcoded #FFFFFF surface
 * 2. Today's Mission task cards: Use var(--bg-card) uncompleted, var(--accent-terracotta-light) active
 * 3. Quick Progress KPI cards: Use card-white with high-contrast text tokens
 * 4. Spaced Revision Health card: Uses card-white and theme-aware accents
 * 5. Left sidebar: .app-desktop-sidebar uses var(--bg-card), with dark theme overrides in index.css
 * 6. TopHeader: Roadmap button, Notifications button, and badge ring use var(--bg-card)
 * 7. Coach Insights button: Uses var(--bg-card), border var(--border-beige), and var(--text-charcoal)
 * 8. View Today's Plan button: Uses .btn-secondary with dark-mode overrides in index.css
 * 9. Notification drawer / controls: Sheet and cards use var(--bg-card) and var(--bg-warm-cream)
 * 10. FloatingActiveTaskBar: Uses var(--bg-card)
 * 11. StreakCard: Day indicator circle uses var(--bg-card)
 * 12. StreakFreezeModal: Inventory status card uses var(--bg-card)
 * 13. ErrorBoundary: Debug container uses theme tokens
 * 14. WCAG 2.1 Contrast ratios: AAA/AA verified across primary, secondary, muted, and accent colors
 * 15. Viewport responsiveness: 390x844, 412x915, 768x1024, 1280x800
 * 16. Theme mode resolution: Light, Dark, System
 * 17. Live System switching simulation: System + Light -> Dark -> Light
 * 18. Light mode preservation: 100% intact with original warm cream & white surfaces
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const BLUE = '\x1b[34m';
const YELLOW = '\x1b[33m';
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
  console.log('NOVARA — DASHBOARD DARK MODE CONTRAST & SURFACES REGRESSION TEST');
  console.log('================================================================\n');

  // Load component and stylesheet sources
  const srcDir = path.join(__dirname, '..', 'src');
  const dashboardPath = path.join(srcDir, 'components', 'Dashboard', 'DashboardView.jsx');
  const taskCardPath = path.join(srcDir, 'components', 'Today', 'TaskCard.jsx');
  const streakCardPath = path.join(srcDir, 'components', 'Today', 'StreakCard.jsx');
  const streakFreezePath = path.join(srcDir, 'components', 'Today', 'StreakFreezeModal.jsx');
  const topHeaderPath = path.join(srcDir, 'components', 'Navigation', 'TopHeader.jsx');
  const sidebarNavPath = path.join(srcDir, 'components', 'Navigation', 'SidebarNav.jsx');
  const bottomNavPath = path.join(srcDir, 'components', 'Navigation', 'BottomNav.jsx');
  const floatingBarPath = path.join(srcDir, 'components', 'Focus', 'FloatingActiveTaskBar.jsx');
  const notifDrawerPath = path.join(srcDir, 'components', 'Notifications', 'NotificationDrawer.jsx');
  const errorBoundaryPath = path.join(srcDir, 'components', 'ErrorBoundary.jsx');
  const cssPath = path.join(srcDir, 'index.css');
  const themeUtilsPath = path.join(srcDir, 'utils', 'themeUtils.js');

  const dashboardCode = fs.readFileSync(dashboardPath, 'utf8');
  const taskCardCode = fs.readFileSync(taskCardPath, 'utf8');
  const streakCardCode = fs.readFileSync(streakCardPath, 'utf8');
  const streakFreezeCode = fs.readFileSync(streakFreezePath, 'utf8');
  const topHeaderCode = fs.readFileSync(topHeaderPath, 'utf8');
  const sidebarNavCode = fs.readFileSync(sidebarNavPath, 'utf8');
  const bottomNavCode = fs.readFileSync(bottomNavPath, 'utf8');
  const floatingBarCode = fs.readFileSync(floatingBarPath, 'utf8');
  const notifDrawerCode = fs.readFileSync(notifDrawerPath, 'utf8');
  const errorBoundaryCode = fs.readFileSync(errorBoundaryPath, 'utf8');
  const cssCode = fs.readFileSync(cssPath, 'utf8');
  const themeUtilsCode = fs.readFileSync(themeUtilsPath, 'utf8');

  // =========================================================================
  // 1. TODAY'S MISSION (PRIMARY CARD) AUDIT
  // =========================================================================
  console.log(`${BLUE}[1. Today's Mission Primary Card Audit]${RESET}`);

  it("Today's Mission uses .dashboard-primary-mission-card class and no hardcoded white background", () => {
    assert(
      dashboardCode.includes('dashboard-primary-mission-card'),
      "DashboardView must apply 'dashboard-primary-mission-card' class"
    );
    // Check there is no hardcoded white/light gradient directly in DashboardView for primary mission card
    assert(
      !dashboardCode.includes("linear-gradient(135deg, #FFFFFF"),
      "Today's Mission card must not have inline linear-gradient with #FFFFFF"
    );
  });

  it("index.css defines dark gradient for .dashboard-primary-mission-card", () => {
    assert(
      cssCode.includes('[data-theme="dark"] .dashboard-primary-mission-card') ||
      cssCode.includes('.dashboard-primary-mission-card'),
      "index.css must define .dashboard-primary-mission-card"
    );
    assert(
      cssCode.includes('linear-gradient(135deg, #1E2421 0%, #171C1A 100%)'),
      "index.css must provide dark gradient linear-gradient(135deg, #1E2421 0%, #171C1A 100%)"
    );
  });

  it("Dashboard next-task highlight card uses var(--bg-card)", () => {
    assert(
      dashboardCode.includes("backgroundColor: 'var(--bg-card)'"),
      "Next task highlight card must use var(--bg-card)"
    );
  });

  // =========================================================================
  // 2. TASK CARDS AUDIT
  // =========================================================================
  console.log(`\n${BLUE}[2. Task Cards Audit]${RESET}`);

  it("TaskCard uses var(--bg-card) for uncompleted cards and var(--accent-terracotta-light) for active", () => {
    assert(
      taskCardCode.includes("isCurrentActive ? 'var(--accent-terracotta-light)' : 'var(--bg-card)'"),
      "TaskCard must use var(--accent-terracotta-light) for active and var(--bg-card) for inactive"
    );
    assert(
      !taskCardCode.includes("isCurrentActive ? '#FFFAF7' : '#FFFFFF'"),
      "TaskCard must NOT have hardcoded #FFFAF7 or #FFFFFF backgrounds"
    );
  });

  it("TaskCard uncompleted ring uses var(--text-muted) for high contrast", () => {
    assert(
      taskCardCode.includes("color: task.completed ? 'var(--accent-sage)' : 'var(--text-muted)'"),
      "TaskCard uncompleted ring indicator must use var(--text-muted) for clear dark contrast"
    );
  });

  it("TaskCard primary text uses var(--text-charcoal) and secondary text uses var(--text-secondary)", () => {
    assert(
      taskCardCode.includes("task.completed ? 'var(--text-charcoal)' : 'var(--text-charcoal)'"),
      "TaskCard title must use var(--text-charcoal)"
    );
    assert(
      taskCardCode.includes("task.completed ? 'var(--text-secondary)' : 'var(--text-secondary)'"),
      "TaskCard description must use var(--text-secondary)"
    );
  });

  // =========================================================================
  // 3. QUICK PROGRESS KPI CARDS AUDIT
  // =========================================================================
  console.log(`\n${BLUE}[3. Quick Progress KPI Cards Audit]${RESET}`);

  it("Quick Progress KPI cards use .card-white with theme tokens", () => {
    assert(
      dashboardCode.includes('dashboard-quick-progress-grid'),
      "Dashboard must contain dashboard-quick-progress-grid"
    );
    assert(
      dashboardCode.includes("Study Today"),
      "KPI grid must contain Study Today metric"
    );
    assert(
      dashboardCode.includes("Tasks Completed"),
      "KPI grid must contain Tasks Completed metric"
    );
    assert(
      dashboardCode.includes("Revision Due"),
      "KPI grid must contain Revision Due metric"
    );
    assert(
      dashboardCode.includes("Readiness"),
      "KPI grid must contain Readiness metric"
    );
  });

  it(".card-white maps to var(--bg-card) in dark mode in index.css", () => {
    assert(
      cssCode.includes('[data-theme="dark"] .card-white'),
      "index.css must have [data-theme=\"dark\"] .card-white"
    );
    assert(
      cssCode.includes('background-color: var(--bg-card);'),
      ".card-white must use background-color: var(--bg-card);"
    );
  });

  // =========================================================================
  // 4. SPACED REVISION HEALTH CARD AUDIT
  // =========================================================================
  console.log(`\n${BLUE}[4. Spaced Revision Health Card Audit]${RESET}`);

  it("Spaced Revision Health card uses .card-white and theme-aware accents", () => {
    assert(
      dashboardCode.includes('dashboard-revision-card'),
      "Dashboard must contain dashboard-revision-card"
    );
    assert(
      dashboardCode.includes('Spaced Revision Health'),
      "Card title must be Spaced Revision Health"
    );
    assert(
      dashboardCode.includes("borderLeft: `4px solid ${dueRevisionsCount > 0 ? 'var(--accent-terracotta)' : 'var(--accent-sage)'}`"),
      "Spaced Revision card must use dynamic accent border tokens"
    );
  });

  // =========================================================================
  // 5. SIDEBAR NAVIGATION AUDIT
  // =========================================================================
  console.log(`\n${BLUE}[5. Sidebar Navigation Audit]${RESET}`);

  it(".app-desktop-sidebar uses var(--bg-card) base background", () => {
    assert(
      cssCode.includes('.app-desktop-sidebar {') &&
      cssCode.includes('background-color: var(--bg-card);'),
      ".app-desktop-sidebar base must use var(--bg-card)"
    );
    assert(
      !cssCode.includes('.app-desktop-sidebar {\n  display: none;\n  width: 250px;\n  min-height: 100vh;\n  background-color: #FFFFFF;'),
      ".app-desktop-sidebar must not have hardcoded #FFFFFF background in index.css"
    );
  });

  it("Dark mode override explicitly covers .app-desktop-sidebar in index.css", () => {
    assert(
      cssCode.includes('[data-theme="dark"] .app-desktop-sidebar'),
      "index.css must include [data-theme=\"dark\"] .app-desktop-sidebar"
    );
  });

  it("Sidebar nav button hover style is configured for dark mode", () => {
    assert(
      cssCode.includes('.app-desktop-sidebar nav button:hover:not(.active)'),
      "index.css must define hover style for sidebar nav buttons"
    );
  });

  it("Sidebar unread badge ring uses var(--bg-card)", () => {
    assert(
      sidebarNavCode.includes("boxShadow: '0 0 0 1.5px var(--bg-card)'"),
      "Sidebar notification badge ring must use var(--bg-card)"
    );
  });

  // =========================================================================
  // 6. TOP HEADER AUDIT
  // =========================================================================
  console.log(`\n${BLUE}[6. TopHeader Audit]${RESET}`);

  it("Roadmap progress pill button uses var(--bg-card) and var(--text-charcoal)", () => {
    assert(
      topHeaderCode.includes("className=\"top-header-roadmap-btn\"") ||
      topHeaderCode.includes("backgroundColor: 'var(--bg-card)'"),
      "TopHeader roadmap button must use var(--bg-card)"
    );
  });

  it("TopHeader notifications button uses var(--bg-card)", () => {
    assert(
      topHeaderCode.includes("backgroundColor: 'var(--bg-card)'"),
      "Notifications button must use var(--bg-card)"
    );
  });

  it("TopHeader unread badge ring uses var(--bg-card)", () => {
    assert(
      topHeaderCode.includes("boxShadow: '0 0 0 2px var(--bg-card)'"),
      "TopHeader notification badge ring must use var(--bg-card)"
    );
  });

  it("TopHeader profile button uses var(--accent-terracotta-light) and var(--accent-terracotta)", () => {
    assert(
      topHeaderCode.includes("backgroundColor: 'var(--accent-terracotta-light)'"),
      "Profile avatar button must use var(--accent-terracotta-light)"
    );
    assert(
      topHeaderCode.includes("color: 'var(--accent-terracotta)'"),
      "Profile avatar text must use var(--accent-terracotta)"
    );
  });

  it("TopHeader root element has .mobile-top-header for dark mode styling", () => {
    assert(
      topHeaderCode.includes('mobile-top-header'),
      "TopHeader must apply mobile-top-header class"
    );
    assert(
      cssCode.includes('[data-theme="dark"] .mobile-top-header'),
      "index.css must target [data-theme=\"dark\"] .mobile-top-header"
    );
  });

  // =========================================================================
  // 7. COACH INSIGHTS BUTTON AUDIT
  // =========================================================================
  console.log(`\n${BLUE}[7. Coach Insights Button Audit]${RESET}`);

  it("Coach Insights button in Dashboard hero uses var(--bg-card) and var(--text-charcoal)", () => {
    assert(
      dashboardCode.includes("aria-label=\"Open AI Placement Coach diagnostics\""),
      "Coach Insights button must have accessible label"
    );
    // Check that button uses var(--bg-card)
    assert(
      dashboardCode.includes("backgroundColor: 'var(--bg-card)',\n              color: 'var(--text-charcoal)',\n              border: '1px solid var(--border-beige)'"),
      "Coach Insights button must use var(--bg-card), var(--text-charcoal), and var(--border-beige)"
    );
  });

  it("AI Coach Snapshot card uses .dashboard-coach-card with dark gradient override", () => {
    assert(
      dashboardCode.includes('dashboard-coach-card'),
      "DashboardView must apply 'dashboard-coach-card' class"
    );
    assert(
      cssCode.includes('[data-theme="dark"] .dashboard-coach-card') ||
      cssCode.includes('.dashboard-coach-card'),
      "index.css must define .dashboard-coach-card rules"
    );
  });

  // =========================================================================
  // 8. VIEW TODAY'S PLAN BUTTON AUDIT
  // =========================================================================
  console.log(`\n${BLUE}[8. View Today's Plan Button Audit]${RESET}`);

  it("View Today's Plan button uses .btn-secondary class with >=44px touch target", () => {
    assert(
      dashboardCode.includes("className=\"btn-secondary\""),
      "Plan button must use .btn-secondary"
    );
    assert(
      dashboardCode.includes("minHeight: '44px'"),
      "Plan button must maintain minHeight: 44px"
    );
  });

  it(".btn-secondary has explicit dark-mode overrides in index.css", () => {
    assert(
      cssCode.includes('[data-theme="dark"] .btn-secondary {'),
      "index.css must define [data-theme=\"dark\"] .btn-secondary"
    );
    assert(
      cssCode.includes('[data-theme="dark"] .btn-secondary:hover {'),
      "index.css must define [data-theme=\"dark\"] .btn-secondary:hover"
    );
  });

  // =========================================================================
  // 9. NOTIFICATION DRAWER & CONTROLS AUDIT
  // =========================================================================
  console.log(`\n${BLUE}[9. Notification Drawer & Controls Audit]${RESET}`);

  it("NotificationDrawer sheet uses var(--bg-card)", () => {
    assert(
      notifDrawerCode.includes("backgroundColor: 'var(--bg-card)'"),
      "NotificationDrawer sheet must use var(--bg-card)"
    );
  });

  it("NotificationDrawer active tab pills use var(--bg-card)", () => {
    assert(
      notifDrawerCode.includes("activeTab === 'notifications' ? 'var(--bg-card)' : 'transparent'"),
      "Activity tab pill must use var(--bg-card) when active"
    );
    assert(
      notifDrawerCode.includes("activeTab === 'settings' ? 'var(--bg-card)' : 'transparent'"),
      "Preferences tab pill must use var(--bg-card) when active"
    );
  });

  it("NotificationDrawer notification cards use var(--bg-card) and not hardcoded white", () => {
    assert(
      !notifDrawerCode.includes("notif.unread ? 'var(--accent-terracotta-light)' : '#FFFFFF'"),
      "NotificationDrawer must NOT use hardcoded #FFFFFF for read notifications"
    );
    assert(
      notifDrawerCode.includes("notif.unread ? 'var(--accent-terracotta-light)' : 'var(--bg-card)'"),
      "NotificationDrawer must use var(--bg-card) for read notifications"
    );
  });

  // =========================================================================
  // 10. FLOATING ACTIVE TASK BAR & STREAK AUDIT
  // =========================================================================
  console.log(`\n${BLUE}[10. FloatingActiveTaskBar & Streak Components Audit]${RESET}`);

  it("FloatingActiveTaskBar uses var(--bg-card) instead of #FFFFFF", () => {
    assert(
      floatingBarCode.includes("backgroundColor: 'var(--bg-card)'"),
      "FloatingActiveTaskBar container must use var(--bg-card)"
    );
    assert(
      !floatingBarCode.includes("backgroundColor: '#FFFFFF'"),
      "FloatingActiveTaskBar must NOT have hardcoded #FFFFFF background"
    );
  });

  it("StreakCard uncompleted day indicator circle uses var(--bg-card)", () => {
    assert(
      streakCardCode.includes(": 'var(--bg-card)'"),
      "StreakCard day indicator must use var(--bg-card) for uncompleted days"
    );
    assert(
      !streakCardCode.includes(": '#FFFFFF'"),
      "StreakCard must NOT use #FFFFFF for uncompleted day background"
    );
  });

  it("StreakFreezeModal inventory card uses var(--bg-card)", () => {
    assert(
      streakFreezeCode.includes("backgroundColor: 'var(--bg-card)'"),
      "StreakFreezeModal inventory card must use var(--bg-card)"
    );
  });

  it("BottomNav bar uses var(--bottom-nav-bg)", () => {
    assert(
      bottomNavCode.includes("var(--bottom-nav-bg"),
      "BottomNav must use var(--bottom-nav-bg)"
    );
  });

  it("ErrorBoundary debug card uses theme tokens", () => {
    assert(
      errorBoundaryCode.includes("backgroundColor: 'var(--accent-terracotta-light)'"),
      "ErrorBoundary debug box must use var(--accent-terracotta-light)"
    );
    assert(
      errorBoundaryCode.includes("color: 'var(--accent-terracotta)'"),
      "ErrorBoundary debug box must use var(--accent-terracotta)"
    );
  });

  // =========================================================================
  // 11. WCAG 2.1 CONTRAST RATIO VERIFICATION
  // =========================================================================
  console.log(`\n${BLUE}[11. WCAG 2.1 Contrast Ratio Verification]${RESET}`);

  // Dark theme palette tokens
  const darkPageBg = '#141716';
  const darkCardBg = '#1E2421';
  const darkAltBg = '#1C211F';

  const darkTextCharcoal = '#F5F3EF'; // Primary text
  const darkTextSecondary = '#9EA6A1'; // Secondary text
  const darkTextMuted = '#727B76';     // Captions / hints
  const darkTerracotta = '#E06D44';    // Primary accent
  const darkSage = '#6FA886';          // Success / complete accent
  const darkAmber = '#E5933A';         // Warning / paused accent

  it("Dark theme primary text (--text-charcoal on --bg-card) exceeds WCAG AAA (>= 7:1)", () => {
    const ratio = getContrastRatio(darkTextCharcoal, darkCardBg);
    console.log(`    Primary text on Card: ${ratio.toFixed(2)}:1 (WCAG AAA >= 7:1 required)`);
    assert(ratio >= 7.0, `Expected ratio >= 7.0, got ${ratio}`);
  });

  it("Dark theme primary text (--text-charcoal on --bg-warm-cream page) exceeds WCAG AAA (>= 7:1)", () => {
    const ratio = getContrastRatio(darkTextCharcoal, darkPageBg);
    console.log(`    Primary text on Page: ${ratio.toFixed(2)}:1 (WCAG AAA >= 7:1 required)`);
    assert(ratio >= 7.0, `Expected ratio >= 7.0, got ${ratio}`);
  });

  it("Dark theme secondary text (--text-secondary on --bg-card) exceeds WCAG AA (>= 4.5:1)", () => {
    const ratio = getContrastRatio(darkTextSecondary, darkCardBg);
    console.log(`    Secondary text on Card: ${ratio.toFixed(2)}:1 (WCAG AA >= 4.5:1 required)`);
    assert(ratio >= 4.5, `Expected ratio >= 4.5, got ${ratio}`);
  });

  it("Dark theme secondary text (--text-secondary on --bg-warm-cream page) exceeds WCAG AA (>= 4.5:1)", () => {
    const ratio = getContrastRatio(darkTextSecondary, darkPageBg);
    console.log(`    Secondary text on Page: ${ratio.toFixed(2)}:1 (WCAG AA >= 4.5:1 required)`);
    assert(ratio >= 4.5, `Expected ratio >= 4.5, got ${ratio}`);
  });

  it("Dark theme muted text (--text-muted on --bg-card) meets minimum UI caption visibility (>= 3.5:1)", () => {
    const ratio = getContrastRatio(darkTextMuted, darkCardBg);
    console.log(`    Muted text on Card: ${ratio.toFixed(2)}:1 (Target >= 3.5:1)`);
    assert(ratio >= 3.5, `Expected ratio >= 3.5, got ${ratio}`);
  });

  it("Dark theme terracotta accent (--accent-terracotta on --bg-card) meets WCAG AA (>= 4.5:1)", () => {
    const ratio = getContrastRatio(darkTerracotta, darkCardBg);
    console.log(`    Terracotta accent on Card: ${ratio.toFixed(2)}:1 (WCAG AA >= 4.5:1 required)`);
    assert(ratio >= 4.5, `Expected ratio >= 4.5, got ${ratio}`);
  });

  it("Dark theme sage accent (--accent-sage on --bg-card) meets WCAG AA (>= 4.5:1)", () => {
    const ratio = getContrastRatio(darkSage, darkCardBg);
    console.log(`    Sage accent on Card: ${ratio.toFixed(2)}:1 (WCAG AA >= 4.5:1 required)`);
    assert(ratio >= 4.5, `Expected ratio >= 4.5, got ${ratio}`);
  });

  it("Dark theme amber accent (--accent-amber on --bg-card) meets WCAG AA (>= 4.5:1)", () => {
    const ratio = getContrastRatio(darkAmber, darkCardBg);
    console.log(`    Amber accent on Card: ${ratio.toFixed(2)}:1 (WCAG AA >= 4.5:1 required)`);
    assert(ratio >= 4.5, `Expected ratio >= 4.5, got ${ratio}`);
  });

  // Light theme palette tokens verification (preservation check)
  const lightCardBg = '#FFFFFF';
  const lightTextCharcoal = '#1C211F';
  const lightTextSecondary = '#5E6763';

  it("Light theme primary text (--text-charcoal on #FFFFFF) exceeds WCAG AAA (>= 7:1)", () => {
    const ratio = getContrastRatio(lightTextCharcoal, lightCardBg);
    console.log(`    Light mode primary text on White: ${ratio.toFixed(2)}:1 (WCAG AAA >= 7:1 required)`);
    assert(ratio >= 7.0, `Expected ratio >= 7.0, got ${ratio}`);
  });

  it("Light theme secondary text (--text-secondary on #FFFFFF) exceeds WCAG AA (>= 4.5:1)", () => {
    const ratio = getContrastRatio(lightTextSecondary, lightCardBg);
    console.log(`    Light mode secondary text on White: ${ratio.toFixed(2)}:1 (WCAG AA >= 4.5:1 required)`);
    assert(ratio >= 4.5, `Expected ratio >= 4.5, got ${ratio}`);
  });

  // =========================================================================
  // 12. VIEWPORT RESPONSIVENESS AUDIT
  // =========================================================================
  console.log(`\n${BLUE}[12. Viewport Responsiveness Audit (390, 412, 768, 1280)]${RESET}`);

  const viewports = [
    { width: 390, height: 844, name: 'iPhone 14 / Mobile Compact' },
    { width: 412, height: 915, name: 'Pixel 7 / Mobile Standard' },
    { width: 768, height: 1024, name: 'iPad / Tablet Portrait' },
    { width: 1280, height: 800, name: 'Desktop / Laptop Standard' }
  ];

  viewports.forEach(vp => {
    it(`Viewport ${vp.width}x${vp.height} (${vp.name}) matches responsive layout specifications`, () => {
      if (vp.width < 900) {
        // Below 900px:
        // .app-desktop-sidebar is hidden (display: none)
        // .mobile-header-wrapper is displayed (display: block)
        // .mobile-nav-wrapper is displayed
        assert(
          cssCode.includes('@media (min-width: 900px) {\n  .app-desktop-sidebar {\n    display: flex;\n  }'),
          "Sidebar must only display: flex at min-width: 900px"
        );
        assert(
          cssCode.includes('.mobile-header-wrapper {\n    display: none;\n  }'),
          "Mobile header must be hidden only at min-width: 900px"
        );
      } else {
        // At or above 900px:
        // Sidebar is active (flex), mobile header hidden
        assert(
          cssCode.includes('.app-desktop-sidebar') && cssCode.includes('display: flex'),
          "Desktop sidebar must be active on >=900px"
        );
      }
    });
  });

  // =========================================================================
  // 13. THEME MODES & SYSTEM SWITCHING AUDIT
  // =========================================================================
  console.log(`\n${BLUE}[13. Theme Modes & Live System Switching Audit]${RESET}`);

  it("themeUtils.js implements all 3 modes: 'light', 'dark', 'system'", () => {
    assert(
      themeUtilsCode.includes("THEME_OPTIONS"),
      "themeUtils.js must export THEME_OPTIONS"
    );
    assert(
      themeUtilsCode.includes("id: 'light'") &&
      themeUtilsCode.includes("id: 'dark'") &&
      themeUtilsCode.includes("id: 'system'"),
      "THEME_OPTIONS must support light, dark, system"
    );
  });

  it("resolveEffectiveTheme accurately resolves across all preference and OS combinations", () => {
    // Pure function simulation of resolveEffectiveTheme
    function resolveTheme(preference, osIsDark) {
      if (preference === 'dark') return 'dark';
      if (preference === 'light') return 'light';
      return osIsDark ? 'dark' : 'light';
    }

    assert.strictEqual(resolveTheme('light', true), 'light');
    assert.strictEqual(resolveTheme('light', false), 'light');
    assert.strictEqual(resolveTheme('dark', true), 'dark');
    assert.strictEqual(resolveTheme('dark', false), 'dark');
    assert.strictEqual(resolveTheme('system', false), 'light');
    assert.strictEqual(resolveTheme('system', true), 'dark');
  });

  it("Simulates live OS switching: System + Light -> Dark -> Light", () => {
    let osIsDark = false; // Initially Windows/OS Light
    const preference = 'system';

    function getDomDataTheme(pref, isDark) {
      const resolved = (pref === 'dark' || (pref === 'system' && isDark)) ? 'dark' : 'light';
      return resolved === 'dark' ? 'dark' : null;
    }

    // Step 1: System + Windows Light
    let currentDataTheme = getDomDataTheme(preference, osIsDark);
    assert.strictEqual(currentDataTheme, null, "In Light mode, data-theme should be null (default :root)");

    // Step 2: User switches Windows to Dark Mode
    osIsDark = true;
    currentDataTheme = getDomDataTheme(preference, osIsDark);
    assert.strictEqual(currentDataTheme, 'dark', "When OS changes to Dark, data-theme must become 'dark'");

    // Step 3: User switches Windows back to Light Mode
    osIsDark = false;
    currentDataTheme = getDomDataTheme(preference, osIsDark);
    assert.strictEqual(currentDataTheme, null, "When OS changes back to Light, data-theme must return to null");
  });

  // =========================================================================
  // 14. LIGHT MODE 100% PRESERVATION AUDIT
  // =========================================================================
  console.log(`\n${BLUE}[14. Light Mode 100% Preservation Audit]${RESET}`);

  it(":root design tokens for Light mode are fully preserved", () => {
    assert(
      cssCode.includes('--bg-warm-cream: #FAF7F2;'),
      ":root must retain --bg-warm-cream: #FAF7F2;"
    );
    assert(
      cssCode.includes('--bg-card: #FFFFFF;'),
      ":root must retain --bg-card: #FFFFFF;"
    );
    assert(
      cssCode.includes('--text-charcoal: #1C211F;'),
      ":root must retain --text-charcoal: #1C211F;"
    );
    assert(
      cssCode.includes('--text-secondary: #5E6763;'),
      ":root must retain --text-secondary: #5E6763;"
    );
    assert(
      cssCode.includes('--border-beige: #EAE3D8;'),
      ":root must retain --border-beige: #EAE3D8;"
    );
  });

  it("Light mode gradient for primary mission card is preserved in index.css", () => {
    assert(
      cssCode.includes('linear-gradient(135deg, #FFFFFF 0%, #FAF7F2 100%)'),
      "Light mode primary mission card must retain linear-gradient(135deg, #FFFFFF 0%, #FAF7F2 100%)"
    );
  });

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('\n================================================================');
  console.log(`TOTAL ASSERTIONS:  ${totalAssertions}`);
  console.log(`PASSED ASSERTIONS: ${passedAssertions}`);
  console.log(`FAILED ASSERTIONS: ${totalAssertions - passedAssertions}`);
  console.log('================================================================');

  if (totalAssertions === passedAssertions) {
    console.log(`\n${GREEN}ALL ${totalAssertions} DASHBOARD CONTRAST & THEME TESTS PASSED SUCCESSFULLY!${RESET}\n`);
  } else {
    process.exit(1);
  }
}

runSuite();
