const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

async function reset() {
  const { SAMPLE_ROADMAPS, INITIAL_TODAY_TASKS, INITIAL_REVISION_QUEUE, INITIAL_NOTIFICATIONS, INITIAL_READINESS_METRICS } = await import('../src/data/mockData.js');

  const pristineState = {
    users: [
      {
        id: 'usr_alex_rivera',
        name: 'Alex Rivera',
        email: 'alex@novara.dev',
        passwordHash: crypto.createHash('sha256').update('password123').digest('hex'),
        targetRole: 'Software Engineer (Tier-1)',
        dailyStudyMinutes: 180,
        placementTargetDate: '2026-11-20',
        currentPreparationLevel: 'Intermediate',
        hasCompletedOnboarding: true,
        avatar: 'AR',
        createdAt: '2026-08-01T08:00:00.000Z',
        updatedAt: '2026-09-01T12:00:00.000Z'
      }
    ],
    sessions: [
      {
        token: 'session_alex_demo_token',
        userId: 'usr_alex_rivera',
        expiresAt: '2027-01-01T00:00:00.000Z'
      }
    ],
    roadmaps: {
      usr_alex_rivera: JSON.parse(JSON.stringify(SAMPLE_ROADMAPS.sde))
    },
    tasks: {
      usr_alex_rivera: JSON.parse(JSON.stringify(INITIAL_TODAY_TASKS))
    },
    streaks: {
      usr_alex_rivera: {
        currentStreak: 12,
        longestStreak: 18,
        todayTargetMet: false,
        lastCompletedDate: '2026-08-31',
        freezeCount: 2,
        completedDays: 34,
        weeklyHistory: [
          { day: 'M', date: '2026-08-25', status: 'completed', tasksDone: 6, target: 4 },
          { day: 'T', date: '2026-08-26', status: 'completed', tasksDone: 5, target: 4 },
          { day: 'W', date: '2026-08-27', status: 'completed', tasksDone: 6, target: 4 },
          { day: 'T', date: '2026-08-28', status: 'completed', tasksDone: 4, target: 4 },
          { day: 'F', date: '2026-08-29', status: 'completed', tasksDone: 5, target: 4 },
          { day: 'S', date: '2026-08-30', status: 'completed', tasksDone: 6, target: 4 },
          { day: 'S', date: '2026-08-31', status: 'in_progress', tasksDone: 0, target: 4 }
        ]
      }
    },
    revisions: {
      usr_alex_rivera: JSON.parse(JSON.stringify(INITIAL_REVISION_QUEUE))
    },
    notifications: {
      usr_alex_rivera: JSON.parse(JSON.stringify(INITIAL_NOTIFICATIONS))
    },
    notificationPreferences: {
      usr_alex_rivera: {
        dailyPlanReminder: true,
        studySessionReminder: true,
        unfinishedTaskReminder: true,
        streakRiskReminder: true,
        revisionReminder: true,
        weeklySummary: true,
        preferredReminderTimes: {
          morning: '08:00',
          evening: '18:00'
        }
      }
    },
    readiness: {
      usr_alex_rivera: JSON.parse(JSON.stringify(INITIAL_READINESS_METRICS))
    }
  };

  const dbPath = path.resolve('server', 'data', 'novara_db.json');
  fs.writeFileSync(dbPath, JSON.stringify(pristineState, null, 2), 'utf8');
  console.log('✅ server/data/novara_db.json reset to pristine demo state (only Alex Rivera, no test data).');
}

reset().catch(console.error);
