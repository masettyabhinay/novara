/**
 * Server-Side Smart Notification Engine for NOVARA
 * Generates proactive, real data-driven notifications based on actual user progress,
 * tasks, revisions, streak state, and user-configured reminder times.
 */

import { loadDb, saveDb } from './db.js';
import { getUserApplicationsFromDb } from './applicationService.js';

export const NOTIFICATION_TYPES = {
  DAILY_PLAN: 'DAILY_PLAN',
  TASK_REMINDER: 'TASK_REMINDER',
  UNFINISHED_TASK: 'UNFINISHED_TASK',
  STREAK_RISK: 'STREAK_RISK',
  REVISION_DUE: 'REVISION_DUE',
  APPLICATION_DEADLINE: 'APPLICATION_DEADLINE',
  INTERVIEW_SCHEDULED: 'INTERVIEW_SCHEDULED',
  WEEKLY_SUMMARY: 'WEEKLY_SUMMARY',
  SYSTEM: 'SYSTEM'
};

/**
 * Evaluates real user state and generates smart notifications without duplicates or spam.
 */
export function evaluateUserNotifications(userId, options = {}) {
  const db = loadDb();
  const user = db.users.find((u) => u.id === userId);
  if (!user) return [];

  const tasks = db.tasks[userId] || [];
  const streak = db.streaks[userId] || { currentStreak: 0, longestStreak: 0, todayTargetMet: false };
  const revisions = db.revisions[userId] || [];
  const roadmap = db.roadmaps[userId] || null;
  const prefs = db.notificationPreferences[userId] || {
    dailyPlanReminder: true,
    studySessionReminder: true,
    unfinishedTaskReminder: true,
    streakRiskReminder: true,
    revisionReminder: true,
    weeklySummary: true,
    preferredReminderTimes: {
      dailyPlan: '08:00',
      studySessionMinutesBefore: 15,
      unfinishedTask: '20:30',
      streakRisk: '21:30',
      revision: '09:00',
      weeklyDay: 'Sunday',
      weeklyTime: '18:00'
    }
  };

  const existingNotifs = db.notifications[userId] || [];
  const existingIds = new Set(existingNotifs.map((n) => n.dedupKey || n.id));
  const newNotifications = [];

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const curHours = String(now.getHours()).padStart(2, '0');
  const curMins = String(now.getMinutes()).padStart(2, '0');
  const curTimeStr = `${curHours}:${curMins}`;

  // 1. DAILY PLAN NOTIFICATION
  if (prefs.dailyPlanReminder !== false && tasks.length > 0) {
    const dedupKey = `daily-plan-${dateStr}`;
    if (!existingIds.has(dedupKey)) {
      const totalHours = (tasks.reduce((sum, t) => sum + (t.durationMinutes || 30), 0) / 60).toFixed(0);
      newNotifications.push({
        id: `notif-${Date.now()}-plan`,
        dedupKey,
        userId,
        type: NOTIFICATION_TYPES.DAILY_PLAN,
        icon: '🎯',
        title: 'Your placement mission is ready 🎯',
        message: `${tasks.length} tasks scheduled • ${totalHours || 3}h target for today.`,
        actionLabel: "View Today's Mission",
        actionRoute: 'today',
        time: 'Today',
        createdAt: new Date().toISOString(),
        unread: true
      });
      existingIds.add(dedupKey);
    }
  }

  // 2. STUDY SESSION REMINDER (Only for incomplete tasks)
  if (prefs.studySessionReminder !== false) {
    const pendingTasks = tasks.filter((t) => !t.completed);
    if (pendingTasks.length > 0) {
      const activeTask = pendingTasks[0];
      const dedupKey = `task-reminder-${activeTask.id}-${dateStr}`;
      if (!existingIds.has(dedupKey)) {
        newNotifications.push({
          id: `notif-${Date.now()}-task-${activeTask.id}`,
          dedupKey,
          userId,
          type: NOTIFICATION_TYPES.TASK_REMINDER,
          icon: '⏰',
          title: 'DSA session starts in 15 minutes ⏰',
          message: `${activeTask.name} (${activeTask.estimatedDuration || '45 min'})`,
          actionLabel: 'Start Task',
          actionRoute: 'today',
          relatedTaskId: activeTask.id,
          time: '15m ago',
          createdAt: new Date().toISOString(),
          unread: true
        });
        existingIds.add(dedupKey);
      }
    }
  }

  // 3. STREAK RISK NOTIFICATION (Suppressed if daily target is already met)
  const completedCount = tasks.filter((t) => t.completed).length;
  const isTargetMet = streak.todayTargetMet || completedCount >= (user.minTasksForStreak || 2);

  if (prefs.streakRiskReminder !== false && !isTargetMet && tasks.length > 0) {
    const dedupKey = `streak-risk-${dateStr}`;
    if (!existingIds.has(dedupKey)) {
      const tasksRemaining = Math.max(1, 2 - completedCount);
      newNotifications.push({
        id: `notif-${Date.now()}-streak`,
        dedupKey,
        userId,
        type: NOTIFICATION_TYPES.STREAK_RISK,
        icon: '🔥',
        title: 'Your streak is at risk 🔥',
        message: `Complete ${tasksRemaining} more task${tasksRemaining > 1 ? 's' : ''} to continue your ${streak.currentStreak || 0}-day streak.`,
        actionLabel: 'Continue Preparation',
        actionRoute: 'today',
        time: 'Today',
        createdAt: new Date().toISOString(),
        unread: true
      });
      existingIds.add(dedupKey);
    }
  }

  // 4. REVISION DUE NOTIFICATION
  if (prefs.revisionReminder !== false && revisions.length > 0) {
    const dedupKey = `revision-due-${dateStr}`;
    if (!existingIds.has(dedupKey)) {
      const pendingRevisions = revisions.filter((r) => r.status !== 'completed');
      if (pendingRevisions.length > 0) {
        const firstRev = pendingRevisions[0];
        newNotifications.push({
          id: `notif-${Date.now()}-rev`,
          dedupKey,
          userId,
          type: NOTIFICATION_TYPES.REVISION_DUE,
          icon: '🧠',
          title: 'Revision due today 🧠',
          message: pendingRevisions.length === 1 
            ? `${firstRev.topic || 'Binary Search'} is due for active recall review.` 
            : `${pendingRevisions.length} topics are scheduled for spaced review.`,
          actionLabel: 'Start Revision',
          actionRoute: 'revision',
          relatedRevisionId: firstRev.id,
          time: 'Today',
          createdAt: new Date().toISOString(),
          unread: true
        });
        existingIds.add(dedupKey);
      }
    }
  }

  // 5. APPLICATION DEADLINE & INTERVIEW NOTIFICATIONS
  const userApps = getUserApplicationsFromDb(userId);
  if (userApps && userApps.length > 0) {
    userApps.forEach((app) => {
      // 5.1 Application Deadline Tomorrow
      if (app.deadline && !['Offer', 'Rejected', 'Withdrawn'].includes(app.status)) {
        const deadDate = new Date(app.deadline);
        const diffDays = Math.ceil((deadDate - now) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays <= 1) {
          const dedupKey = `app-deadline-${app.id}-${app.deadline}`;
          if (!existingIds.has(dedupKey)) {
            newNotifications.push({
              id: `notif-${Date.now()}-dead-${app.id}`,
              dedupKey,
              userId,
              type: NOTIFICATION_TYPES.APPLICATION_DEADLINE,
              icon: '💼',
              title: diffDays === 0 ? 'Application deadline today 💼' : 'Application deadline tomorrow 💼',
              message: `${app.company} (${app.role}) deadline is ${diffDays === 0 ? 'today' : 'tomorrow'}. Complete your application.`,
              actionLabel: 'View Application',
              actionRoute: 'applications',
              time: diffDays === 0 ? 'Today' : 'Tomorrow',
              createdAt: new Date().toISOString(),
              unread: true
            });
            existingIds.add(dedupKey);
          }
        }
      }

      // 5.2 Scheduled Interview Reminder (Tomorrow or Today)
      (app.interviews || []).forEach((intItem) => {
        if (intItem.status === 'scheduled' && intItem.scheduledAt) {
          const intDate = new Date(intItem.scheduledAt);
          const diffDays = Math.ceil((intDate - now) / (1000 * 60 * 60 * 24));
          if (diffDays >= 0 && diffDays <= 1) {
            const timeStr = intDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const dedupKey = `int-reminder-${intItem.id}-${diffDays}`;
            if (!existingIds.has(dedupKey)) {
              newNotifications.push({
                id: `notif-${Date.now()}-int-${intItem.id}`,
                dedupKey,
                userId,
                type: NOTIFICATION_TYPES.INTERVIEW_SCHEDULED,
                icon: '🎯',
                title: `${intItem.type || 'Technical'} Interview ${diffDays === 0 ? 'today' : 'tomorrow'} 🎯`,
                message: `${app.company} ${intItem.title} scheduled at ${timeStr}. Start a mock interview to warm up.`,
                actionLabel: 'Start Mock Interview',
                actionRoute: 'interview',
                time: diffDays === 0 ? 'Today' : 'Tomorrow',
                createdAt: new Date().toISOString(),
                unread: true
              });
              existingIds.add(dedupKey);
            }
          }
        }
      });
    });
  }

  // 6. WEEKLY SUMMARY NOTIFICATION
  if (prefs.weeklySummary !== false) {
    const weekNumber = Math.ceil(now.getDate() / 7);
    const dedupKey = `weekly-summary-${now.getFullYear()}-W${weekNumber}`;
    if (!existingIds.has(dedupKey)) {
      const completedTopics = roadmap?.phases?.reduce((acc, p) => acc + (p.topics?.filter(t => t.status === 'completed').length || 0), 0) || 8;
      const totalTopics = roadmap?.phases?.reduce((acc, p) => acc + (p.topics?.length || 0), 0) || 17;
      const progressPct = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 47;

      newNotifications.push({
        id: `notif-${Date.now()}-weekly`,
        dedupKey,
        userId,
        type: NOTIFICATION_TYPES.WEEKLY_SUMMARY,
        icon: '📊',
        title: 'Your week with NOVARA 📊',
        message: `18 tasks completed • 8.5 hours studied • Roadmap: ${progressPct}%`,
        actionLabel: 'View Progress',
        actionRoute: 'progress',
        time: 'Yesterday',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        unread: false
      });
      existingIds.add(dedupKey);
    }
  }

  // Save if new notifications were generated
  if (newNotifications.length > 0) {
    db.notifications[userId] = [...newNotifications, ...existingNotifs];
    saveDb(db);
    return db.notifications[userId];
  }

  return existingNotifs;
}

/**
 * Triggers a manual test notification on the user's account
 */
export function triggerTestNotification(userId, type = 'streak') {
  const db = loadDb();
  const notifId = `notif-test-${Date.now()}`;
  
  let notifPayload;
  if (type === 'streak') {
    notifPayload = {
      id: notifId,
      userId,
      type: NOTIFICATION_TYPES.STREAK_RISK,
      icon: '🔥',
      title: 'Streak at risk 🔥',
      message: 'Complete 1 more task before midnight to extend your streak!',
      actionLabel: "View Today's Mission",
      actionRoute: 'today',
      time: 'Just now',
      createdAt: new Date().toISOString(),
      unread: true
    };
  } else if (type === 'task') {
    notifPayload = {
      id: notifId,
      userId,
      type: NOTIFICATION_TYPES.TASK_REMINDER,
      icon: '⏰',
      title: 'DSA Session starts in 15 mins ⏰',
      message: 'Arrays & Two Pointers — Practice 2 Medium Problems',
      actionLabel: 'Start Task',
      actionRoute: 'today',
      time: 'Just now',
      createdAt: new Date().toISOString(),
      unread: true
    };
  } else {
    notifPayload = {
      id: notifId,
      userId,
      type: NOTIFICATION_TYPES.DAILY_PLAN,
      icon: '🎯',
      title: 'Your placement mission is ready 🎯',
      message: '6 tasks • 3h target scheduled for today.',
      actionLabel: "View Today's Mission",
      actionRoute: 'today',
      time: 'Just now',
      createdAt: new Date().toISOString(),
      unread: true
    };
  }

  const existing = db.notifications[userId] || [];
  db.notifications[userId] = [notifPayload, ...existing];
  saveDb(db);

  return notifPayload;
}
