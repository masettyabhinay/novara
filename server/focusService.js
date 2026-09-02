/**
 * Server-Side Focus Mode Service
 * Manages real timestamped focus sessions, pause/resume tracking, actual study duration calculation,
 * task completion synchronization, and real study analytics.
 */

import crypto from 'crypto';
import { loadDb, saveDb } from './db.js';

function calculateSessionActualMinutes(session, customEndTime = null) {
  if (!session.startedAt) return 0;
  const startMs = new Date(session.startedAt).getTime();
  const endMs = customEndTime ? new Date(customEndTime).getTime() : Date.now();

  let totalDurationMs = Math.max(0, endMs - startMs);

  // Sum up all paused durations from history
  let totalPausedMs = 0;
  if (Array.isArray(session.pauseHistory)) {
    for (const p of session.pauseHistory) {
      if (p.durationMs) {
        totalPausedMs += p.durationMs;
      } else if (p.pausedAt && p.resumedAt) {
        totalPausedMs += Math.max(0, new Date(p.resumedAt).getTime() - new Date(p.pausedAt).getTime());
      }
    }
  }

  // If currently paused, add current open pause
  if (session.status === 'paused' && session.pausedAt) {
    totalPausedMs += Math.max(0, endMs - new Date(session.pausedAt).getTime());
  }

  const netStudyMs = Math.max(0, totalDurationMs - totalPausedMs);
  return Math.round(netStudyMs / 60000); // in minutes
}

export function startFocusSession(userId, { taskId, plannedMinutes, roadmapId, topicId }) {
  const db = loadDb();
  if (!db.focusSessions) db.focusSessions = {};
  if (!db.focusSessions[userId]) db.focusSessions[userId] = [];

  // Check if there is already an active session for this user
  const existingActive = db.focusSessions[userId].find(
    (s) => (s.status === 'active' || s.status === 'paused') && s.taskId === taskId
  );

  if (existingActive) {
    return existingActive;
  }

  // If there's an active session on a DIFFERENT task, safely abandon it first
  db.focusSessions[userId].forEach((s) => {
    if (s.status === 'active' || s.status === 'paused') {
      s.status = 'abandoned';
      s.endedAt = new Date().toISOString();
      s.actualMinutes = calculateSessionActualMinutes(s, s.endedAt);
    }
  });

  const newSession = {
    sessionId: `focus_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    userId,
    taskId,
    roadmapId: roadmapId || null,
    topicId: topicId || null,
    startedAt: new Date().toISOString(),
    endedAt: null,
    plannedMinutes: plannedMinutes || 45,
    actualMinutes: 0,
    pausedMinutes: 0,
    pausedAt: null,
    pauseHistory: [],
    status: 'active',
    notes: ''
  };

  db.focusSessions[userId].push(newSession);
  saveDb(db);
  return newSession;
}

export function pauseFocusSession(userId, sessionId) {
  const db = loadDb();
  if (!db.focusSessions || !db.focusSessions[userId]) return null;

  const session = db.focusSessions[userId].find((s) => s.sessionId === sessionId);
  if (!session || session.status !== 'active') return session;

  const nowIso = new Date().toISOString();
  session.status = 'paused';
  session.pausedAt = nowIso;
  session.actualMinutes = calculateSessionActualMinutes(session, nowIso);

  saveDb(db);
  return session;
}

export function resumeFocusSession(userId, sessionId) {
  const db = loadDb();
  if (!db.focusSessions || !db.focusSessions[userId]) return null;

  const session = db.focusSessions[userId].find((s) => s.sessionId === sessionId);
  if (!session || session.status !== 'paused') return session;

  const nowMs = Date.now();
  const pausedMs = session.pausedAt ? new Date(session.pausedAt).getTime() : nowMs;
  const pauseDurationMs = Math.max(0, nowMs - pausedMs);

  if (!session.pauseHistory) session.pauseHistory = [];
  session.pauseHistory.push({
    pausedAt: session.pausedAt,
    resumedAt: new Date(nowMs).toISOString(),
    durationMs: pauseDurationMs
  });

  session.pausedMinutes = Math.round(
    session.pauseHistory.reduce((acc, p) => acc + (p.durationMs || 0), 0) / 60000
  );
  session.status = 'active';
  session.pausedAt = null;

  saveDb(db);
  return session;
}

export function completeFocusSession(userId, { sessionId, notes }) {
  const db = loadDb();
  if (!db.focusSessions || !db.focusSessions[userId]) return null;

  const session = db.focusSessions[userId].find((s) => s.sessionId === sessionId);
  if (!session) {
    throw new Error('Focus session not found.');
  }

  // Idempotent protection against duplicate completes
  if (session.status === 'completed') {
    return {
      session,
      tasks: db.tasks[userId] || [],
      streak: db.streaks[userId] || null,
      readiness: db.readiness[userId] || null
    };
  }

  const nowIso = new Date().toISOString();
  session.status = 'completed';
  session.endedAt = nowIso;
  session.actualMinutes = Math.max(1, calculateSessionActualMinutes(session, nowIso));
  if (notes) session.notes = notes;

  // 1. Synchronize task completion in db.tasks
  if (db.tasks && db.tasks[userId]) {
    const task = db.tasks[userId].find((t) => t.id === session.taskId);
    if (task) {
      task.completed = true;
      task.completedAt = nowIso;
      task.actualMinutesStudied = session.actualMinutes;
      if (task.subtasks) {
        task.subtasks.forEach((st) => (st.done = true));
      }
    }
  }

  // 2. Update Streak & Daily Goal
  if (db.streaks && db.streaks[userId] && db.tasks && db.tasks[userId]) {
    const userTasks = db.tasks[userId];
    const completedTasksCount = userTasks.filter((t) => t.completed).length;
    const streak = db.streaks[userId];

    if (completedTasksCount >= Math.min(3, userTasks.length) && !streak.todayTargetMet) {
      streak.todayTargetMet = true;
      streak.currentStreak += 1;
      streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);
      streak.lastCompletedDate = nowIso.split('T')[0];
      streak.completedDays += 1;

      // Update today's weekly history
      const todayStr = nowIso.split('T')[0];
      const todayEntry = (streak.weeklyHistory || []).find((h) => h.date === todayStr);
      if (todayEntry) {
        todayEntry.status = 'completed';
        todayEntry.tasksDone = completedTasksCount;
      }
    }
  }

  // 3. Update Readiness stats
  if (db.readiness && db.readiness[userId]) {
    const readiness = db.readiness[userId];
    const completedTasksCount = (db.tasks[userId] || []).filter((t) => t.completed).length;
    readiness.stats.tasksCompleted = completedTasksCount;

    // Calculate total hours logged from completed sessions
    const totalActualMinutes = db.focusSessions[userId]
      .filter((s) => s.status === 'completed')
      .reduce((sum, s) => sum + (s.actualMinutes || 0), 0);

    readiness.stats.studyHoursLogged = Math.round((totalActualMinutes / 60) * 10) / 10;
  }

  saveDb(db);

  return {
    session,
    tasks: db.tasks[userId] || [],
    streak: db.streaks[userId] || null,
    readiness: db.readiness[userId] || null
  };
}

export function abandonFocusSession(userId, { sessionId, notes }) {
  const db = loadDb();
  if (!db.focusSessions || !db.focusSessions[userId]) return null;

  const session = db.focusSessions[userId].find((s) => s.sessionId === sessionId);
  if (!session) {
    throw new Error('Focus session not found.');
  }

  if (session.status === 'completed' || session.status === 'abandoned') {
    return session;
  }

  const nowIso = new Date().toISOString();
  session.status = 'abandoned';
  session.endedAt = nowIso;
  session.actualMinutes = calculateSessionActualMinutes(session, nowIso);
  if (notes) session.notes = notes;

  saveDb(db);
  return session;
}

export function getActiveFocusSession(userId) {
  const db = loadDb();
  if (!db.focusSessions || !db.focusSessions[userId]) return null;

  const active = db.focusSessions[userId].find(
    (s) => s.status === 'active' || s.status === 'paused'
  );

  return active || null;
}

export function getFocusSessionsHistory(userId) {
  const db = loadDb();
  if (!db.focusSessions || !db.focusSessions[userId]) return [];
  return db.focusSessions[userId];
}

export function getFocusAnalytics(userId) {
  const db = loadDb();
  const sessions = (db.focusSessions && db.focusSessions[userId]) || [];
  const tasks = (db.tasks && db.tasks[userId]) || [];

  const todayStr = new Date().toISOString().split('T')[0];
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Completed sessions
  const completedSessions = sessions.filter((s) => s.status === 'completed');

  // Today study minutes
  const todayMinutes = completedSessions
    .filter((s) => s.endedAt && s.endedAt.startsWith(todayStr))
    .reduce((sum, s) => sum + (s.actualMinutes || 0), 0);

  // Last 7 days study minutes
  const weekMinutes = completedSessions
    .filter((s) => s.endedAt && new Date(s.endedAt) >= sevenDaysAgo)
    .reduce((sum, s) => sum + (s.actualMinutes || 0), 0);

  // Active days in last 7 days
  const activeDaysSet = new Set(
    completedSessions
      .filter((s) => s.endedAt && new Date(s.endedAt) >= sevenDaysAgo)
      .map((s) => s.endedAt.split('T')[0])
  );
  const activeDaysCount = Math.max(1, activeDaysSet.size);
  const averageDailyMinutes = Math.round(weekMinutes / (activeDaysSet.size > 0 ? activeDaysSet.size : 1));

  // Planned vs Actual for today's tasks
  const plannedMinutesToday = tasks.reduce((sum, t) => sum + (t.durationMinutes || 45), 0);
  const actualMinutesToday = todayMinutes;

  const plannedHoursTotal = Math.round((plannedMinutesToday / 60) * 10) / 10;
  const actualHoursTotal = Math.round((actualMinutesToday / 60) * 10) / 10;
  const completionRate = plannedMinutesToday > 0 
    ? Math.min(100, Math.round((actualMinutesToday / plannedMinutesToday) * 100)) 
    : 0;

  return {
    todayStudyMinutes: todayMinutes,
    weekStudyMinutes: weekMinutes,
    averageDailyStudyMinutes: averageDailyMinutes,
    plannedHours: plannedHoursTotal,
    actualHours: actualHoursTotal,
    plannedMinutes: plannedMinutesToday,
    actualMinutes: actualMinutesToday,
    completionRate: completionRate,
    totalCompletedSessions: completedSessions.length,
    activeSession: getActiveFocusSession(userId)
  };
}
