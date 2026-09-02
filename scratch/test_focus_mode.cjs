function assert(condition, msg) {
  if (!condition) {
    console.error(`❌ Assertion failed: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ ${msg}`);
}

async function run() {
  console.log('Testing Focus Mode Subsystem...');
  const { signupUser } = await import('file:///f:/NOVARA/server/db.js');
  const { 
    startFocusSession, 
    pauseFocusSession, 
    resumeFocusSession, 
    completeFocusSession,
    getFocusAnalytics 
  } = await import('file:///f:/NOVARA/server/focusService.js');

  const user = signupUser({ name: 'Focus Tester', email: `focus_${Date.now()}@novara.dev`, password: 'Password123!' });
  const userId = user.user.id;

  // 1. Start Session
  const session = startFocusSession(userId, { taskId: 'task_focus_1', plannedMinutes: 45 });
  assert(session.status === 'active', 'Focus session created in active status');
  assert(session.sessionId !== undefined, 'Focus session ID generated');

  // 2. Pause Session
  const paused = pauseFocusSession(userId, session.sessionId);
  assert(paused.status === 'paused', 'Focus session paused');
  assert(paused.pausedAt !== null, 'Pause timestamp recorded');

  // 3. Resume Session
  const resumed = resumeFocusSession(userId, session.sessionId);
  assert(resumed.status === 'active', 'Focus session resumed');
  assert(resumed.pauseHistory.length === 1, 'Pause history recorded');

  // 4. Complete Session
  const completed = completeFocusSession(userId, { sessionId: session.sessionId, notes: 'Great study session' });
  assert(completed.session.status === 'completed', 'Focus session completed');
  assert(completed.session.actualMinutes >= 1, 'Actual minutes computed correctly');

  // 5. Focus Analytics
  const analytics = getFocusAnalytics(userId);
  assert(analytics.totalCompletedSessions >= 1, 'Analytics reflects completed session');

  console.log('🎉 Focus Mode Tests Passed!\n');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
