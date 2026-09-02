function assert(condition, msg) {
  if (!condition) {
    console.error(`❌ Assertion failed: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ ${msg}`);
}

async function run() {
  console.log('Testing Calendar Engine Subsystem...');
  const { signupUser } = await import('file:///f:/NOVARA/server/db.js');
  const { 
    getAggregatedCalendarEvents, 
    calculateDailyCapacity,
    createPersonalEventInDb,
    updatePersonalEventInDb,
    deletePersonalEventFromDb,
    detectScheduleConflicts 
  } = await import('file:///f:/NOVARA/server/calendarService.js');

  const user = signupUser({ name: 'Calendar Tester', email: `cal_${Date.now()}@novara.dev`, password: 'Password123!' });
  const userId = user.user.id;

  // 1. Create Personal Event
  const evt1 = createPersonalEventInDb(userId, {
    title: 'Mock Interview Prep',
    type: 'Mock Interview',
    date: '2026-09-15',
    time: '10:00 AM',
    durationMinutes: 60
  });
  assert(evt1.id !== undefined, 'Personal calendar event created');

  // 2. Conflict Detection
  const evt2 = createPersonalEventInDb(userId, {
    title: 'Overlapping Session',
    type: 'Study Session',
    date: '2026-09-15',
    time: '10:30 AM', // Overlaps with 10:00 - 11:00 AM
    durationMinutes: 45
  });

  const calData = getAggregatedCalendarEvents(userId);
  assert(calData.events.length >= 2, 'Events aggregated correctly');
  assert(calData.conflicts.length >= 1, 'Schedule conflict accurately detected');

  // 3. Capacity Calculation
  const capacity = calculateDailyCapacity(user.user, calData.events, '2026-09-15');
  assert(capacity.plannedMinutes === 105, 'Planned minutes calculated (60 + 45 = 105m)');
  assert(capacity.isCapacityExceeded === false, '105m within 180m daily capacity');

  // 4. Delete Event
  const deleted = deletePersonalEventFromDb(userId, evt1.id);
  assert(deleted === true, 'Calendar event deleted');

  console.log('🎉 Calendar Engine Tests Passed!\n');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
