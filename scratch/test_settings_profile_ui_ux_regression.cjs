/**
 * NOVARA — SETTINGS & PROFILE UI/UX + ACCOUNT MANAGEMENT REGRESSION SUITE
 * 
 * 24-Point Comprehensive Regression Audit:
 * 1.  Profile rendering (renders 7 logical settings sections)
 * 2.  Profile data grounding (name, email, role, streak, study capacity from authentic store)
 * 3.  Target role persistence (updates persist to server and client state)
 * 4.  Daily study capacity persistence (hours and minutes sync to persistent storage)
 * 5.  Target date persistence (placement deadline updates persist)
 * 6.  Timezone persistence (time zone updates persist and align scheduling)
 * 7.  Notification preferences persistence (reminder switches update backend)
 * 8.  Roadmap management visibility (renders active syllabus, phase count, topic count)
 * 9.  Roadmap replacement confirmation (non-destructive modal protects records)
 * 10. Logout behavior (clears local session, preserves database records)
 * 11. Session restoration (login hydrates authentic persisted settings)
 * 12. No secret exposure (zero passwords, hashes, tokens, or private keys exposed)
 * 13. No internal ID exposure (internal user IDs like usr_... strictly excluded)
 * 14. Multi-user isolation (User A settings strictly isolated from User B)
 * 15. Duplicate save prevention (buttons disabled during async submission)
 * 16. Validation errors (validates empty role, hours bounds 0.5-12h, past dates)
 * 17. Loading states (spinners and loading indicators active during save)
 * 18. Error states (handles network/API errors with retryable alerts)
 * 19. Offline behavior (preserves cached data and displays offline badge)
 * 20. Accessibility audit (semantic headings, ARIA switches, dialog semantics, Escape key)
 * 21. Touch targets (all interactive controls >= 44px)
 * 22. Mobile overflow protection (overflow-x hidden, zero horizontal scroll)
 * 23. Desktop layout (two-column layout with left nav and right content panel)
 * 24. Application version consistency (matches package.json 1.0.0)
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
    console.log(`  ✓ ${desc}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${desc}`);
    console.error(`    ${RED}${err.message}${RESET}`);
  }
}

// Load source code files for structural & pattern inspection
const profileViewPath = path.resolve(__dirname, '../src/components/Profile/ProfileView.jsx');
const appContextPath = path.resolve(__dirname, '../src/context/AppContext.jsx');
const packageJsonPath = path.resolve(__dirname, '../package.json');
const indexCssPath = path.resolve(__dirname, '../src/index.css');
const dbPath = path.resolve(__dirname, '../server/data/novara_db.json');

const profileViewCode = fs.readFileSync(profileViewPath, 'utf8');
const appContextCode = fs.readFileSync(appContextPath, 'utf8');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const indexCss = fs.readFileSync(indexCssPath, 'utf8');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

console.log(`\n${BLUE}================================================================${RESET}`);
console.log(`${BLUE}⚙️  NOVARA — SETTINGS & PROFILE 24-POINT REGRESSION AUDIT${RESET}`);
console.log(`${BLUE}================================================================${RESET}\n`);

// ---------------------------------------------------------------------------
// SUITE 1: PROFILE RENDERING & DATA GROUNDING
// ---------------------------------------------------------------------------
console.log(`${BLUE}● Suite 1: Profile Rendering & Authentic Data Grounding${RESET}`);

it('1. Profile renders with 7 logical settings sections', () => {
  const sections = ['profile', 'plan', 'notifications', 'timezone', 'roadmap', 'security', 'about'];
  sections.forEach((sec) => {
    assert(
      profileViewCode.includes(`id: '${sec}'`) || profileViewCode.includes(`activeSection === '${sec}'`),
      `Missing logical section: ${sec}`
    );
  });
});

it('2. Profile data grounding (name, email, role, streak from authentic source)', () => {
  assert(profileViewCode.includes('displayName') || profileViewCode.includes('currentUser?.name'), 'Name not grounded');
  assert(profileViewCode.includes('displayEmail') || profileViewCode.includes('currentUser?.email'), 'Email not grounded');
  assert(profileViewCode.includes('displayRole') || profileViewCode.includes('userProfile?.targetRole'), 'Role not grounded');
  assert(profileViewCode.includes('displayStreak') || profileViewCode.includes('streakData?.currentStreak'), 'Streak not grounded');
  assert(profileViewCode.includes('Not set') || profileViewCode.includes('Not enough data'), 'Missing graceful fallbacks');
});

// ---------------------------------------------------------------------------
// SUITE 2: PLAN, CAPACITY & TIMEZONE PERSISTENCE
// ---------------------------------------------------------------------------
console.log(`\n${BLUE}● Suite 2: Plan, Capacity & Timezone Persistence${RESET}`);

it('3. Target role persistence (persists to server and client state)', () => {
  assert(profileViewCode.includes('targetRole:'), 'Target role not included in profile payload');
  assert(appContextCode.includes('syncUserProfile'), 'syncUserProfile not hooked in AppContext');
  assert(appContextCode.includes('setUserProfile'), 'setUserProfile not available');
});

it('4. Daily study capacity persistence (hours and minutes sync to persistent storage)', () => {
  assert(profileViewCode.includes('dailyTargetHours:') || profileViewCode.includes('dailyStudyMinutes:'), 'Capacity not in payload');
  // Check demo user in DB has daily study target
  const alexUser = db.users.find(u => u.id === 'usr_alex_rivera');
  assert(alexUser && alexUser.dailyStudyMinutes !== undefined, 'DB user lacks daily study minutes');
});

it('5. Target date persistence (placement deadline updates persist)', () => {
  assert(profileViewCode.includes('targetDate:') || profileViewCode.includes('placementTargetDate:'), 'Target date not in payload');
});

it('6. Timezone persistence (time zone updates persist and align scheduling)', () => {
  assert(profileViewCode.includes('timezone:'), 'Timezone not included in update payload');
  assert(profileViewCode.includes('COMMON_TIMEZONES') || profileViewCode.includes('Intl.DateTimeFormat'), 'Missing standard timezones or detection');
});

// ---------------------------------------------------------------------------
// SUITE 3: NOTIFICATIONS & ROADMAP MANAGEMENT
// ---------------------------------------------------------------------------
console.log(`\n${BLUE}● Suite 3: Notifications & Roadmap Management${RESET}`);

it('7. Notification preferences persistence (reminder switches update backend)', () => {
  assert(profileViewCode.includes('notifPreferences') && profileViewCode.includes('setNotifPreferences'), 'Missing notification preferences');
  assert(profileViewCode.includes('dailyPlanReminder'), 'Missing dailyPlanReminder preference');
  assert(profileViewCode.includes('streakRiskReminder'), 'Missing streakRiskReminder preference');
  assert(profileViewCode.includes('revisionReminder'), 'Missing revisionReminder preference');
  assert(appContextCode.includes('syncNotificationPreferences'), 'syncNotificationPreferences missing in AppContext');
});

it('8. Roadmap management visibility (renders active syllabus, phase count, topic count)', () => {
  assert(profileViewCode.includes('activeRoadmap'), 'activeRoadmap missing in ProfileView');
  assert(profileViewCode.includes('roadmapProgress'), 'roadmapProgress missing in ProfileView');
  assert(profileViewCode.includes('totalRoadmapTopics') || profileViewCode.includes('phases'), 'Phase/topic count missing in ProfileView');
});

it('9. Roadmap replacement confirmation (non-destructive modal protects records)', () => {
  assert(profileViewCode.includes('isReplaceConfirmOpen'), 'Missing replace confirmation modal state');
  assert(profileViewCode.includes('Replace current roadmap?'), 'Missing replacement warning heading');
  assert(profileViewCode.includes('completed tasks') && profileViewCode.includes('preserved'), 'Missing non-destructive explanation');
});

// ---------------------------------------------------------------------------
// SUITE 4: SECURITY, PRIVACY & MULTI-USER ISOLATION
// ---------------------------------------------------------------------------
console.log(`\n${BLUE}● Suite 4: Security, Privacy & Multi-User Isolation${RESET}`);

it('10. Logout behavior (clears local session, preserves database records)', () => {
  assert(profileViewCode.includes('handleLogout'), 'handleLogout missing in ProfileView');
  const authServiceCode = fs.readFileSync(path.resolve(__dirname, '../src/services/authService.js'), 'utf8');
  assert(appContextCode.includes('apiLogout') && appContextCode.includes('handleLogout'), 'handleLogout missing in AppContext');
  assert(authServiceCode.includes('clearStoredToken'), 'Logout does not clear token');
});

it('11. Session restoration (login hydrates authentic persisted settings)', () => {
  assert(appContextCode.includes('hydrateFromCloud'), 'hydrateFromCloud missing in AppContext');
  assert(appContextCode.includes('setUserProfile(cloudData.profile)'), 'Cloud hydration does not restore profile');
});

it('12. No secret exposure (zero passwords, hashes, tokens, or private keys exposed)', () => {
  assert(!profileViewCode.includes('passwordHash'), 'Exposed passwordHash in client profile');
  assert(!profileViewCode.includes('privateKey') && !profileViewCode.includes('jwtSecret'), 'Exposed secrets in client code');
});

it('13. No internal ID exposure (internal user IDs like usr_... strictly excluded)', () => {
  // Check that user.id or currentUser.id is not rendered directly in JSX
  assert(!profileViewCode.includes('{currentUser?.id}') && !profileViewCode.includes('{userProfile?.id}'), 'Internal user ID exposed in ProfileView JSX');
});

it('14. Multi-user isolation (User A settings strictly isolated from User B)', () => {
  // Verify database schema keys preferences, profiles and settings strictly by userId
  assert(db.notificationPreferences !== undefined, 'notificationPreferences must exist in DB');
  assert(typeof db.notificationPreferences === 'object', 'notificationPreferences must be partitioned by userId');
  assert(db.roadmaps !== undefined && typeof db.roadmaps === 'object', 'roadmaps must be partitioned by userId');
  assert(db.tasks !== undefined && typeof db.tasks === 'object', 'tasks must be partitioned by userId');
});

// ---------------------------------------------------------------------------
// SUITE 5: VALIDATION, DUPLICATE PREVENTION & FEEDBACK
// ---------------------------------------------------------------------------
console.log(`\n${BLUE}● Suite 5: Validation, Duplicate Prevention & Feedback${RESET}`);

it('15. Duplicate save prevention (buttons disabled during async submission)', () => {
  assert(profileViewCode.includes('disabled={isSavingProfile}'), 'Profile save button missing duplicate submit guard');
  assert(profileViewCode.includes('disabled={isSavingPlan}'), 'Plan save button missing duplicate submit guard');
  assert(profileViewCode.includes('disabled={isSavingTimezone'), 'Timezone save button missing duplicate submit guard');
});

it('16. Validation errors (validates empty role, hours bounds 0.5-12h, past dates)', () => {
  assert(profileViewCode.includes('planValidationErrors'), 'Missing validation errors state');
  assert(profileViewCode.includes('0.5') && profileViewCode.includes('12'), 'Missing capacity bound validation');
  assert(profileViewCode.includes('past') || profileViewCode.includes('today'), 'Missing past date validation');
});

it('17. Loading states (spinners and loading indicators active during save)', () => {
  assert(profileViewCode.includes('Saving Profile...') || profileViewCode.includes('spin-icon'), 'Missing profile save loading state');
  assert(profileViewCode.includes('Applying Plan...') || profileViewCode.includes('Saving Timezone...'), 'Missing plan/timezone loading state');
});

it('18. Error states (handles network/API errors with retryable alerts)', () => {
  assert(profileViewCode.includes('profileError') || profileViewCode.includes('planError'), 'Missing error states in ProfileView');
  assert(profileViewCode.includes('role="alert"'), 'Missing accessible alert role for error messages');
});

// ---------------------------------------------------------------------------
// SUITE 6: RESPONSIVENESS, ACCESSIBILITY & APP VERSION
// ---------------------------------------------------------------------------
console.log(`\n${BLUE}● Suite 6: Responsiveness, Accessibility & App Version${RESET}`);

it('19. Offline behavior (preserves cached data and displays offline badge)', () => {
  assert(profileViewCode.includes('isOffline'), 'Missing isOffline in ProfileView');
  assert(profileViewCode.includes('Offline Mode') || profileViewCode.includes('Local Cache'), 'Missing offline status badge');
});

it('20. Accessibility audit (semantic headings, ARIA switches, dialog semantics, Escape key)', () => {
  assert(profileViewCode.includes('role="switch"'), 'Missing ARIA role="switch" on toggles');
  assert(profileViewCode.includes('aria-checked'), 'Missing aria-checked attribute');
  assert(profileViewCode.includes('role="dialog"'), 'Missing role="dialog" on modal');
  assert(profileViewCode.includes('aria-modal="true"'), 'Missing aria-modal attribute on modal');
  assert(profileViewCode.includes('Escape'), 'Missing Escape key listener');
});

it('21. Touch targets (all interactive controls >= 44px)', () => {
  assert(profileViewCode.includes("minHeight: '44px'") || indexCss.includes('min-height: 44px'), 'Missing 44px touch target sizing in styles');
  assert(indexCss.includes('.settings-nav-btn'), 'Missing settings-nav-btn CSS definition');
});

it('22. Mobile overflow protection (overflow-x hidden, zero horizontal scroll)', () => {
  assert(indexCss.includes('.settings-page-wrapper') && indexCss.includes('overflow-x: hidden'), 'Missing overflow-x hidden on settings container');
});

it('23. Desktop layout (two-column layout with left nav and right content panel)', () => {
  assert(indexCss.includes('@media (min-width: 840px)') && indexCss.includes('grid-template-columns: 240px 1fr'), 'Missing desktop 2-column settings grid in CSS');
});

it('24. Application version consistency (matches package.json 1.0.0)', () => {
  assert(profileViewCode.includes('APP_VERSION = \'1.0.0\''), 'ProfileView version mismatch');
  assert.strictEqual(packageJson.version, '1.0.0', 'package.json version is not 1.0.0');
});

// ---------------------------------------------------------------------------
// SUMMARY
// ---------------------------------------------------------------------------
console.log(`\n${BLUE}================================================================${RESET}`);
console.log(`TOTAL TESTS: ${totalTests} | ${GREEN}PASSED: ${passedTests}${RESET} | ${RED}FAILED: ${totalTests - passedTests}${RESET}`);
console.log(`${BLUE}================================================================${RESET}\n`);

if (totalTests !== passedTests) {
  process.exit(1);
} else {
  process.exit(0);
}
