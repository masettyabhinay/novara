function assert(condition, msg) {
  if (!condition) {
    console.error(`❌ Assertion failed: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ ${msg}`);
}

async function run() {
  console.log('Testing Placement Application Tracker Subsystem...');
  const { signupUser } = await import('file:///f:/NOVARA/server/db.js');
  const { 
    getUserApplicationsFromDb, 
    createApplicationInDb, 
    updateApplicationInDb, 
    deleteApplicationFromDb,
    addInterviewToAppInDb,
    calculateApplicationMetrics,
    getUpcomingApplicationEvents,
    getPreparationRecommendation
  } = await import('file:///f:/NOVARA/server/applicationService.js');

  const user = signupUser({ name: 'App Tracker Tester', email: `app_track_${Date.now()}@novara.dev`, password: 'Password123!' });
  const userId = user.user.id;

  // 1. Create Application
  const newApp = createApplicationInDb(userId, {
    company: 'Microsoft',
    role: 'Software Engineer',
    status: 'Applied',
    jobUrl: 'https://careers.microsoft.com',
    deadline: '2026-10-15'
  });
  assert(newApp.id !== undefined, 'Application created with unique ID');
  assert(newApp.company === 'Microsoft', 'Application company recorded');

  // 2. Add Interview Stage
  const intRes = addInterviewToAppInDb(userId, newApp.id, {
    type: 'Technical',
    title: 'DSA Round 1',
    scheduledAt: new Date(Date.now() + 3 * 86400000).toISOString()
  });
  assert(intRes.application.status === 'Interview', 'Application transitioned to Interview status');
  assert(intRes.interview.id !== undefined, 'Interview stage added');

  // 3. Metrics & Funnel Calculation
  const apps = getUserApplicationsFromDb(userId);
  const metrics = calculateApplicationMetrics(apps);
  assert(metrics.totalApplications === 1, 'Total application count matches');
  assert(metrics.interviewCount === 1, 'Interview count matches');

  // 4. Upcoming Events & Advisory
  const events = getUpcomingApplicationEvents(apps);
  assert(events.length >= 1, 'Upcoming interview event extracted');
  const advisory = getPreparationRecommendation(apps);
  assert(advisory !== null && advisory.company === 'Microsoft', 'Preparation advisory generated');

  // 5. Delete Application
  const deleted = deleteApplicationFromDb(userId, newApp.id);
  assert(deleted === true, 'Application deleted successfully');

  console.log('🎉 Application Tracker Tests Passed!\n');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
