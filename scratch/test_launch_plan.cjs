function assert(condition, msg) {
  if (!condition) {
    console.error(`❌ Assertion failed: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ ${msg}`);
}

async function run() {
  console.log('Testing Plan Generation & Launch Plan Subsystem...');
  const { generateDailyPlanFromRoadmap, validateRoadmapSchema } = await import('file:///f:/NOVARA/server/roadmapService.js');

  const validRoadmap = {
    title: 'SDE Placement Bootcamp',
    phases: [
      {
        title: 'Phase 1: DSA',
        topics: [
          { id: 't1', name: 'Arrays & Two Pointers', status: 'in_progress', difficulty: 'Medium' },
          { id: 't2', name: 'Binary Search', status: 'upcoming', difficulty: 'Medium' }
        ]
      },
      {
        title: 'Phase 2: Core CS',
        topics: [
          { id: 't3', name: 'Operating Systems', status: 'upcoming', difficulty: 'Hard' }
        ]
      }
    ]
  };

  const schemaValidation = validateRoadmapSchema(validRoadmap);
  assert(schemaValidation.valid === true, 'Roadmap schema passes validation');

  const plan = generateDailyPlanFromRoadmap(validRoadmap, { dailyTargetHours: 3 });
  assert(Array.isArray(plan.tasks) && plan.tasks.length === 6, 'Generated 6 structured daily tasks');
  assert(plan.totalScheduledMinutes <= plan.dailyCapMinutes, 'Total scheduled minutes within daily capacity');
  assert(plan.dailyCapMinutes === 180, 'Daily cap correctly set to 180 minutes');

  console.log('🎉 Launch Plan Tests Passed!\n');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
