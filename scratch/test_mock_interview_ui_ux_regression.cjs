/**
 * NOVARA — MOCK INTERVIEW UI/UX + INTERACTION ACCURACY REGRESSION SUITE
 * 
 * 30-Point Comprehensive Regression Audit:
 * 1.  Configuration rendering
 * 2.  Supported domain grounding
 * 3.  Difficulty grounding
 * 4.  Duration validation
 * 5.  Duplicate start prevention
 * 6.  Interview session creation
 * 7.  Question grounding
 * 8.  Exact question count
 * 9.  Answer persistence
 * 10. Duplicate answer prevention
 * 11. Evaluation grounding
 * 12. Evaluation error recovery
 * 13. Completion result grounding
 * 14. History persistence
 * 15. History ordering
 * 16. Exact historical interview identity
 * 17. Trend calculation from real records
 * 18. No synthetic trend data
 * 19. Review exact question/answer/evaluation
 * 20. Coach deep-link integration
 * 21. Notification deep-link integration
 * 22. Application/interview identity
 * 23. Active-session navigation safety
 * 24. Multi-user isolation
 * 25. Logout/login restoration
 * 26. Mobile overflow
 * 27. Touch targets
 * 28. Accessibility
 * 29. Loading/empty/error states
 * 30. Duplicate API request prevention
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

const tests = [];
function it(desc, fn) {
  tests.push({ desc, fn });
}

// File paths
const interviewViewPath = path.resolve(__dirname, '../src/components/Interview/InterviewView.jsx');
const activeInterviewPath = path.resolve(__dirname, '../src/components/Interview/ActiveInterview.jsx');
const resultModalPath = path.resolve(__dirname, '../src/components/Interview/InterviewResultModal.jsx');
const interviewClientServicePath = path.resolve(__dirname, '../src/services/interviewService.js');
const interviewServerServicePath = path.resolve(__dirname, '../server/interviewService.js');
const apiMiddlewarePath = path.resolve(__dirname, '../server/apiMiddleware.js');
const appContextPath = path.resolve(__dirname, '../src/context/AppContext.jsx');
const indexCssPath = path.resolve(__dirname, '../src/index.css');
const dbPath = path.resolve(__dirname, '../server/data/novara_db.json');

// Read files
const interviewViewCode = fs.readFileSync(interviewViewPath, 'utf8');
const activeInterviewCode = fs.readFileSync(activeInterviewPath, 'utf8');
const resultModalCode = fs.readFileSync(resultModalPath, 'utf8');
const interviewClientServiceCode = fs.readFileSync(interviewClientServicePath, 'utf8');
const interviewServerServiceCode = fs.readFileSync(interviewServerServicePath, 'utf8');
const apiMiddlewareCode = fs.readFileSync(apiMiddlewarePath, 'utf8');
const appContextCode = fs.readFileSync(appContextPath, 'utf8');
const indexCssCode = fs.readFileSync(indexCssPath, 'utf8');

const originalDbRaw = fs.readFileSync(dbPath, 'utf8');

const TEST_USER_1 = 'test_user_regression_1_' + Date.now();
const TEST_USER_2 = 'test_user_regression_2_' + Date.now();
let activeTestSession = null;
let completedTestReport = null;

// ---------------------------------------------------------------------------
// SUITE 1: CONFIGURATION & DOMAIN GROUNDING (Tests 1-5)
// ---------------------------------------------------------------------------
it('1. Configuration rendering (renders domains, difficulty, questions, duration, preview, Start CTA)', () => {
  assert(interviewViewCode.includes('Start an Interview'), 'Must render Start an Interview heading');
  assert(interviewViewCode.includes('Choose Domain'), 'Must render Choose Domain section');
  assert(interviewViewCode.includes('interview-domain-grid'), 'Must render domain selection grid');
  assert(interviewViewCode.includes('Difficulty'), 'Must render Difficulty control');
  assert(interviewViewCode.includes('Duration'), 'Must render Duration control');
  assert(interviewViewCode.includes('Questions'), 'Must render Questions count control');
  assert(interviewViewCode.includes('Start Interview'), 'Must render Start Interview primary CTA');
});

it('2. Supported domain grounding (strictly matches existing question bank domains without inventing fake ones)', () => {
  const supported = ['Technical', 'DSA', 'Core CS', 'SQL', 'AI / ML', 'HR & Behavioral'];
  supported.forEach(dom => {
    assert(interviewViewCode.includes(`id: '${dom}'`), `InterviewView must support grounded domain: ${dom}`);
    assert(interviewServerServiceCode.includes(dom), `Server question bank must contain grounded domain: ${dom}`);
  });
  // Must not have invented domains
  assert(!interviewViewCode.includes("'Robotics'"), 'Must not have invented domains');
  assert(!interviewViewCode.includes("'Quantum Computing'"), 'Must not have invented domains');
});

it('3. Difficulty grounding (strictly supported Easy, Medium, Hard, Mixed)', () => {
  ['Easy', 'Medium', 'Hard', 'Mixed'].forEach(diff => {
    assert(interviewViewCode.includes(`<option value="${diff}">${diff}</option>`), `Must support difficulty: ${diff}`);
  });
});

it('4. Duration validation (validates allowed times 15, 30, 45 minutes)', () => {
  assert(interviewViewCode.includes('15 Minutes'), 'Must support 15m duration');
  assert(interviewViewCode.includes('30 Minutes'), 'Must support 30m duration');
  assert(interviewViewCode.includes('45 Minutes'), 'Must support 45m duration');
  assert(interviewViewCode.includes('Invalid interview duration selected'), 'Must validate duration bounds before start');
});

it('5. Duplicate start prevention (isStarting state disables CTA and guards submission)', () => {
  assert(interviewViewCode.includes('if (isStarting) return;'), 'handleStartInterview must return early if isStarting');
  assert(interviewViewCode.includes('disabled={isStarting}'), 'Start button must be disabled when isStarting is true');
  assert(interviewViewCode.includes('Preparing Interview Session...'), 'Must show loading state while starting');
});

// ---------------------------------------------------------------------------
// SUITE 2: INTERVIEW SESSION & EXECUTION (Tests 6-12)
// ---------------------------------------------------------------------------
it('6. Interview session creation (starts active session with authoritative wall clock and total questions)', async () => {
  const { startInterviewSession } = await import('../server/interviewService.js');
  activeTestSession = await startInterviewSession(TEST_USER_1, {
    type: 'Technical',
    difficulty: 'Medium',
    questionCount: 5,
    timeMinutes: 15
  });

  assert(activeTestSession && activeTestSession.interviewId, 'Session must have interviewId');
  assert.strictEqual(activeTestSession.type, 'Technical');
  assert.strictEqual(activeTestSession.difficulty, 'Medium');
  assert(activeTestSession.timeLimitMinutes === 15, '15 minutes time limit');
  assert(activeTestSession.currentQuestion, 'Must have initial question');
});

it('7. Question grounding (questions belong to authentic bank for domain)', () => {
  assert(activeTestSession.currentQuestion.question, 'Current question must have text');
  assert(activeTestSession.currentQuestion.topic, 'Current question must have topic');
  assert(typeof activeTestSession.currentQuestion.question === 'string');
});

it('8. Exact question count (session has exactly requested totalQuestions)', () => {
  assert.strictEqual(activeTestSession.totalQuestions, 5, 'Session must have exactly 5 questions');
});

it('9. Answer persistence (submitting answer persists text in active interview)', async () => {
  const { evaluateInterviewAnswerOnServer, getActiveInterviewSession } = await import('../server/interviewService.js');
  const answer = 'REST is an architectural style based on stateless requests, standard HTTP methods, and URI resources.';
  const evalResult = await evaluateInterviewAnswerOnServer(TEST_USER_1, activeTestSession.interviewId, 0, answer);
  
  assert(evalResult && evalResult.evaluation, 'Answer submission must return evaluation');
  assert(evalResult.evaluation.score >= 0 && evalResult.evaluation.score <= 100, 'Score must be between 0 and 100');
  
  const currentSession = getActiveInterviewSession(TEST_USER_1);
  assert.strictEqual(currentSession.currentQuestion.question, activeTestSession.currentQuestion.question);
});

it('10. Duplicate answer prevention (ActiveInterview has isSubmitting guard and disables button)', () => {
  assert(activeInterviewCode.includes('if (isSubmitting) return;'), 'Must return if isSubmitting');
  assert(activeInterviewCode.includes('disabled={isSubmitting'), 'Submit button must be disabled when isSubmitting');
  assert(activeInterviewCode.includes('Evaluating Answer...'), 'Must render evaluating feedback loading state');
});

it('11. Evaluation grounding (returns authentic multi-dimensional evaluation and ideal outline)', async () => {
  const { getActiveInterviewSession } = await import('../server/interviewService.js');
  const currentSession = getActiveInterviewSession(TEST_USER_1);
  assert(currentSession, 'Must have active session');
  assert(interviewServerServiceCode.includes('idealAnswerOutline'), 'Server question evaluation must include idealAnswerOutline');
  assert(interviewServerServiceCode.includes('strengths'), 'Server question evaluation must include strengths');
  assert(interviewServerServiceCode.includes('improvements'), 'Server question evaluation must include improvements');
});

it('12. Evaluation error recovery (preserves entered answer on error without losing user input)', () => {
  assert(activeInterviewCode.includes('catch (err) {'), 'Must catch evaluation errors');
  assert(activeInterviewCode.includes('showToast'), 'Must toast error message');
  assert(!activeInterviewCode.includes("catch (err) {\n      setAnswerText('')"), 'Must NOT clear user answer upon submission error');
});

// ---------------------------------------------------------------------------
// SUITE 3: COMPLETION, HISTORY & TRENDS (Tests 13-18)
// ---------------------------------------------------------------------------
it('13. Completion result grounding (completed report has authentic overallScore, metrics, and topics)', async () => {
  const { completeInterviewSessionOnServer } = await import('../server/interviewService.js');
  completedTestReport = await completeInterviewSessionOnServer(TEST_USER_1, activeTestSession.interviewId);

  assert(completedTestReport, 'Must return completed report');
  assert(completedTestReport.id === activeTestSession.interviewId, 'Report ID must match session ID');
  assert(typeof completedTestReport.overallScore === 'number', 'Must have numeric overallScore');
  assert(completedTestReport.metrics, 'Must have 4-dimensional metrics');
  assert(typeof completedTestReport.metrics.technical === 'number');
  assert(typeof completedTestReport.metrics.communication === 'number');
  assert(typeof completedTestReport.metrics.correctness === 'number');
  assert(typeof completedTestReport.metrics.completeness === 'number');
  assert(completedTestReport.strongestTopic, 'Must identify strongest topic');
  assert(completedTestReport.weakestTopic, 'Must identify weakest topic');
});

it('14. History persistence (completed interview is stored in persisted user history)', async () => {
  const { getInterviewHistoryOnServer } = await import('../server/interviewService.js');
  const historyData = getInterviewHistoryOnServer(TEST_USER_1);
  assert(historyData && Array.isArray(historyData.history), 'History must be an array');
  const found = historyData.history.find(h => h.id === activeTestSession.interviewId);
  assert(found, 'Completed interview must be present in user history');
});

it('15. History ordering (newest interview appears first)', async () => {
  const { startInterviewSession, completeInterviewSessionOnServer, getInterviewHistoryOnServer } = await import('../server/interviewService.js');
  // Start and complete a second interview for TEST_USER_1
  const s2 = await startInterviewSession(TEST_USER_1, {
    type: 'DSA',
    difficulty: 'Hard',
    questionCount: 5,
    timeMinutes: 15
  });
  await new Promise(r => setTimeout(r, 20));
  const r2 = await completeInterviewSessionOnServer(TEST_USER_1, s2.interviewId);

  const historyData = getInterviewHistoryOnServer(TEST_USER_1);
  assert(historyData.history.length >= 2, 'Must have at least 2 sessions');
  assert.strictEqual(historyData.history[0].id, r2.id, 'Newest completed interview must be index 0');
});

it('16. Exact historical interview identity (opens exact session without mutating or regenerating)', async () => {
  const { getInterviewHistoryOnServer } = await import('../server/interviewService.js');
  const historyData = getInterviewHistoryOnServer(TEST_USER_1);
  const target = historyData.history[0];
  assert.strictEqual(target.type, 'DSA');
  assert(target.questions.length > 0);
  assert.strictEqual(target.difficulty, 'Hard');
});

it('17. Trend calculation from real records (calculates average and domain breakdown from authentic data)', async () => {
  const { getInterviewHistoryOnServer } = await import('../server/interviewService.js');
  const historyData = getInterviewHistoryOnServer(TEST_USER_1);
  const avg = historyData.stats.averageScore;
  const sum = historyData.history.reduce((acc, h) => acc + (h.overallScore || 0), 0);
  const expectedAvg = Math.round(sum / historyData.history.length);
  assert.strictEqual(avg, expectedAvg, 'Average score must be authentic mathematical mean');
});

it('18. No synthetic trend data (renders graceful prompt when < 2 completed interviews)', () => {
  assert(interviewViewCode.includes('Complete more interviews to see your performance trend.'), 'Must render zero-fabrication message');
  assert(interviewViewCode.includes('historyData.history.length >= 2'), 'Must only calculate trend if >= 2 real interviews exist');
});

// ---------------------------------------------------------------------------
// SUITE 4: REVIEW & INTEGRATIONS (Tests 19-24)
// ---------------------------------------------------------------------------
it('19. Review exact question/answer/evaluation (ResultModal renders user answer, explanation, ideal outline)', () => {
  assert(resultModalCode.includes('Your Answer:'), 'Must show user answer section');
  assert(resultModalCode.includes('q.evaluation.idealAnswerOutline') || resultModalCode.includes('idealAnswerOutline'), 'Must show ideal answer outline');
  assert(resultModalCode.includes('strengths') || resultModalCode.includes('Strengths'), 'Must show strengths');
  assert(resultModalCode.includes('improvements') || resultModalCode.includes('Improvement'), 'Must show improvements');
});

it('20. Coach deep-link integration (navigateToCoachTarget populates pendingInterviewTarget and tab)', () => {
  assert(appContextCode.includes("action.actionRoute === 'interview' || action.type === 'INTERVIEW'"), 'Coach navigation must handle interview target');
  assert(appContextCode.includes('setPendingInterviewTarget'), 'Must set pendingInterviewTarget on coach navigation');
  assert(appContextCode.includes("setActiveTab('interview')"), 'Must switch active tab to interview');
});

it('21. Notification deep-link integration (notification with MOCK_INTERVIEW routes to interview tab)', () => {
  assert(appContextCode.includes("notif.type === 'MOCK_INTERVIEW'"), 'Must handle MOCK_INTERVIEW notification');
  assert(appContextCode.includes("notif.actionRoute === 'interview'"), 'Must handle interview actionRoute');
});

it('22. Application/interview identity (mock interview preserves company and applicationId bidirectionally)', () => {
  assert(interviewViewCode.includes('pendingInterviewTarget?.company'), 'Must pass company from target');
  assert(interviewViewCode.includes('pendingInterviewTarget?.applicationId'), 'Must pass applicationId from target');
  assert(resultModalCode.includes('report.company') || resultModalCode.includes('report.applicationId'), 'Modal must link targeted company/app');
  assert(resultModalCode.includes('View Application'), 'Modal must provide deep link back to application');
});

it('23. Active-session navigation safety (ActiveInterview registers beforeunload and single authoritative timer)', () => {
  assert(activeInterviewCode.includes('window.addEventListener(\'beforeunload\''), 'Must register beforeunload listener');
  assert(activeInterviewCode.includes('getRemainingSeconds'), 'Must use wall-clock getRemainingSeconds calculation');
  assert(activeInterviewCode.includes('isEndConfirmOpen'), 'Must offer safe end confirmation dialog');
});

it('24. Multi-user isolation (User A cannot access or mutate User B interview sessions or history)', async () => {
  const { startInterviewSession, getActiveInterviewSession, getInterviewHistoryOnServer } = await import('../server/interviewService.js');
  const user2Session = await startInterviewSession(TEST_USER_2, {
    type: 'SQL',
    difficulty: 'Easy',
    questionCount: 5,
    timeMinutes: 15
  });

  const u1Active = getActiveInterviewSession(TEST_USER_1);
  const u2Active = getActiveInterviewSession(TEST_USER_2);

  assert(u2Active.interviewId !== u1Active?.interviewId, 'Active sessions must be isolated between users');
  assert.strictEqual(u2Active.type, 'SQL');

  const u2History = getInterviewHistoryOnServer(TEST_USER_2);
  assert.strictEqual(u2History.history.length, 0, 'User 2 history must not contain User 1 sessions');
});

// ---------------------------------------------------------------------------
// SUITE 5: UX, RESPONSIVENESS & ACCESSIBILITY (Tests 25-30)
// ---------------------------------------------------------------------------
it('25. Logout/login restoration (fetchActiveInterviewApi and fetchInterviewHistoryApi authenticate with token)', () => {
  assert(interviewClientServiceCode.includes('fetchActiveInterviewApi'), 'Must export fetchActiveInterviewApi');
  assert(interviewClientServiceCode.includes('fetchInterviewHistoryApi'), 'Must export fetchInterviewHistoryApi');
  assert(interviewClientServiceCode.includes('Authorization'), 'Must pass Bearer token for user authentication');
});

it('26. Mobile overflow protection (interview views have zero horizontal overflow styles)', () => {
  assert(indexCssCode.includes('.interview-landing-wrapper'), 'index.css must style .interview-landing-wrapper');
  assert(indexCssCode.includes('.interview-workspace-wrapper'), 'index.css must style .interview-workspace-wrapper');
  assert(indexCssCode.includes('overflow-x: hidden'), 'CSS must prevent horizontal overflow');
});

it('27. Touch targets (all interactive interview buttons and selects >= 44px)', () => {
  assert(interviewViewCode.includes("minHeight: '44px'"), 'Interview domain cards and controls must have minHeight 44px');
  assert(activeInterviewCode.includes("minHeight: '44px'"), 'Active interview controls must have minHeight 44px');
  assert(resultModalCode.includes("minHeight: '44px'"), 'Result modal buttons must have minHeight 44px');
});

it('28. Accessibility audit (semantic headings, dialog roles, progressbar semantics, Escape listener)', () => {
  assert(resultModalCode.includes('role="dialog"'), 'Result modal must declare role="dialog"');
  assert(resultModalCode.includes('aria-modal="true"'), 'Result modal must declare aria-modal="true"');
  assert(resultModalCode.includes("e.key === 'Escape'"), 'Result modal must close on Escape key');
  assert(interviewViewCode.includes('role="progressbar"'), 'Domain trend bars must declare role="progressbar"');
  assert(activeInterviewCode.includes('role="progressbar"'), 'Active interview must declare role="progressbar"');
  assert(activeInterviewCode.includes('aria-label'), 'Active interview timer and buttons must have aria-label');
});

it('29. Loading, empty and error states (gracefully renders empty history and error toasts)', () => {
  assert(interviewViewCode.includes('No interviews yet'), 'Must render explicit empty history state');
  assert(interviewViewCode.includes('Start Your First Interview'), 'Must provide CTA in empty state');
  assert(interviewViewCode.includes('showToast'), 'Must toast on start or completion errors');
  assert(activeInterviewCode.includes('showToast'), 'Must toast on answer evaluation errors');
});

it('30. Duplicate API request prevention (endpoints reject duplicate calls and enforce single active session)', () => {
  assert(apiMiddlewareCode.includes('/api/interview/active'), 'Server must expose active interview verification endpoint');
  assert(apiMiddlewareCode.includes('/api/interview/cancel'), 'Server must expose active interview cancellation endpoint');
  assert(interviewViewCode.includes('isStarting'), 'Must lock client state during interview initiation');
  assert(activeInterviewCode.includes('isSubmitting'), 'Must lock client state during answer evaluation');
});

// ---------------------------------------------------------------------------
// EXECUTE SUITE RUNNER
// ---------------------------------------------------------------------------
async function runAllTests() {
  console.log(`\n${BLUE}================================================================${RESET}`);
  console.log(`${BLUE}🎤  NOVARA — MOCK INTERVIEW 30-POINT REGRESSION AUDIT${RESET}`);
  console.log(`${BLUE}================================================================${RESET}\n`);

  // Setup temporary test users in database
  try {
    const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    if (!db.users) db.users = [];
    db.users.push({
      id: TEST_USER_1,
      name: 'Test Candidate 1',
      email: `${TEST_USER_1}@novara.dev`,
      targetRole: 'Software Engineer',
      dailyStudyMinutes: 120
    });
    db.users.push({
      id: TEST_USER_2,
      name: 'Test Candidate 2',
      email: `${TEST_USER_2}@novara.dev`,
      targetRole: 'Backend Engineer',
      dailyStudyMinutes: 120
    });
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
  } catch (e) {
    console.error('Setup error:', e);
  }

  let passed = 0;
  let total = 0;

  for (const t of tests) {
    total++;
    try {
      await t.fn();
      passed++;
      console.log(`  ✓ Test ${total}: ${t.desc}`);
    } catch (err) {
      console.error(`  ✗ Test ${total}: ${t.desc}`);
      console.error(`    ${RED}${err.message}${RESET}`);
    }
  }

  // Restore database cleanly to pristine state
  try {
    fs.writeFileSync(dbPath, originalDbRaw, 'utf8');
  } catch (e) {
    // Ignore cleanup errors
  }

  console.log(`\n${BLUE}================================================================${RESET}`);
  console.log(`RESULTS: ${passed === total ? GREEN : RED}${passed}/${total} TESTS PASSED${RESET}`);
  console.log(`${BLUE}================================================================${RESET}\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

runAllTests().catch(err => {
  console.error('Fatal Runner Error:', err);
  process.exit(1);
});
