function assert(condition, msg) {
  if (!condition) {
    console.error(`❌ Assertion failed: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ ${msg}`);
}

async function run() {
  console.log('Testing Revision Engine Subsystem...');
  const { signupUser, updateUserRoadmap } = await import('file:///f:/NOVARA/server/db.js');
  const { 
    getRevisionsForUser, 
    generateRevisionQuestions, 
    submitRevisionAttempt,
    rescheduleRevision 
  } = await import('file:///f:/NOVARA/server/revisionService.js');

  const user = signupUser({ name: 'Revision Tester', email: `rev_${Date.now()}@novara.dev`, password: 'Password123!' });
  const userId = user.user.id;

  updateUserRoadmap(userId, {
    title: 'Bootcamp',
    phases: [{
      title: 'DSA Phase',
      topics: [{ id: 'top_arr', name: 'Arrays & Two Pointers', status: 'completed' }]
    }]
  });

  // 1. Get Revisions
  const revData = getRevisionsForUser(userId);
  assert(revData.revisions.length >= 1, 'Completed roadmap topics automatically synced to revision queue');
  const revItem = revData.revisions[0];

  // 2. Generate Revision Questions
  const questions = generateRevisionQuestions(revItem.topic, revItem.category, 'Medium');
  assert(Array.isArray(questions) && questions.length >= 3, 'Grounded revision questions generated');
  assert(questions[0].correctAnswer !== undefined, 'Questions have verified answer keys');

  // 3. Submit Revision Attempt (SM-2 Spaced Interval Update)
  const attemptRes = submitRevisionAttempt(userId, {
    revisionId: revItem.id,
    answers: questions.map((q) => ({ isCorrect: true })),
    durationMinutes: 15
  });
  assert(attemptRes.scorePercent === 100, 'Attempt score calculated as 100%');
  assert(attemptRes.nextIntervalDays >= 3, 'SM-2 ladder advanced interval');
  assert(attemptRes.retentionAfter >= 75, 'Retention score increased after successful recall');

  // 4. Reschedule Revision
  const rescheduled = rescheduleRevision(userId, { revisionId: revItem.id, daysAhead: 5 });
  assert(rescheduled.status === 'rescheduled', 'Revision rescheduled status updated');

  console.log('🎉 Revision Engine Tests Passed!\n');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
