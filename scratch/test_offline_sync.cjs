function assert(condition, msg) {
  if (!condition) {
    console.error(`❌ Assertion failed: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ ${msg}`);
}

async function run() {
  console.log('Testing Offline Sync Subsystem...');
  const { signupUser } = await import('file:///f:/NOVARA/server/db.js');
  const { processBatchSync } = await import('file:///f:/NOVARA/server/syncEngine.js');

  const user = signupUser({ name: 'Sync Tester', email: `sync_test_${Date.now()}@novara.dev`, password: 'Password123!' });
  const userId = user.user.id;

  // 1. Batch Sync with multiple entity types
  const ops = [
    {
      operationId: `sync_op_${Date.now()}_1`,
      userId,
      entityType: 'APPLICATION',
      entityId: `app_sync_${Date.now()}`,
      operation: 'CREATE',
      payload: { company: 'Netflix', role: 'Senior Engineer', status: 'Applied' },
      createdAt: new Date().toISOString()
    },
    {
      operationId: `sync_op_${Date.now()}_2`,
      userId,
      entityType: 'CALENDAR_EVENT',
      entityId: `evt_sync_${Date.now()}`,
      operation: 'CREATE',
      payload: { title: 'System Design Session', date: '2026-09-20', durationMinutes: 45 },
      createdAt: new Date().toISOString()
    }
  ];

  const syncResult = processBatchSync(userId, ops);
  assert(syncResult.success === true, 'Batch sync completed successfully');
  assert(syncResult.processedCount === 2, 'Both queued operations processed');
  assert(syncResult.fullState.applications.some((a) => a.company === 'Netflix'), 'Application entity synchronized in user state');

  console.log('🎉 Offline Sync Tests Passed!\n');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
