/**
 * Server-Side Persistent Document Database for NOVARA
 * Persists all users, sessions, roadmaps, daily tasks, streaks, revisions, and preferences
 * stored in server/data/novara_db.json
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { SAMPLE_ROADMAPS, INITIAL_TODAY_TASKS, INITIAL_REVISION_QUEUE, INITIAL_NOTIFICATIONS, INITIAL_READINESS_METRICS } from '../src/data/mockData.js';

const DB_DIR = path.resolve(process.cwd(), 'server', 'data');
const DB_FILE = path.join(DB_DIR, 'novara_db.json');
const DB_BACKUP_FILE = path.join(DB_DIR, 'novara_db.json.bak');

// Ensure DB directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Initial DB template
const DEFAULT_DB_STATE = {
  users: [
    {
      id: 'usr_alex_rivera',
      name: 'Alex Rivera',
      email: 'alex@novara.dev',
      passwordHash: hashPassword('password123'),
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
  },
  uploadedFiles: {}
};

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('[DB Load Error - Attempting Backup Recovery]', err);
    try {
      if (fs.existsSync(DB_BACKUP_FILE)) {
        const backupData = fs.readFileSync(DB_BACKUP_FILE, 'utf8');
        const parsed = JSON.parse(backupData);
        console.warn('[DB Recovery] Successfully restored database from backup file.');
        return parsed;
      }
    } catch (bakErr) {
      console.error('[DB Backup Recovery Failed]', bakErr);
    }
  }
  // Initialize default
  saveDb(DEFAULT_DB_STATE);
  return DEFAULT_DB_STATE;
}

function saveDb(data) {
  try {
    // 1. Maintain backup copy of current valid state
    if (fs.existsSync(DB_FILE)) {
      try {
        fs.copyFileSync(DB_FILE, DB_BACKUP_FILE);
      } catch (cpErr) {
        // Continue if copy fails
      }
    }

    // 2. Atomic write via temporary file
    const tmpFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tmpFile, DB_FILE);
  } catch (err) {
    console.error('[DB Save Error]', err);
    // Fallback write
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (fallbackErr) {
      console.error('[DB Fallback Save Error]', fallbackErr);
    }
  }
}

// ---------------------------------------------------------------------------
// AUTHENTICATION & SESSIONS
// ---------------------------------------------------------------------------

export function signupUser({ name, email, password }) {
  const db = loadDb();
  const normalizedEmail = email.toLowerCase().trim();

  const existing = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (existing) {
    throw new Error('An account with this email address already exists.');
  }

  const userId = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'NO';

  const newUser = {
    id: userId,
    name: name.trim(),
    email: normalizedEmail,
    passwordHash: hashPassword(password),
    targetRole: 'Software Engineer',
    dailyStudyMinutes: 180,
    placementTargetDate: '2026-11-20',
    currentPreparationLevel: 'Beginner',
    hasCompletedOnboarding: false,
    avatar: initials,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.users.push(newUser);

  // Initialize fresh user data records
  db.roadmaps[userId] = null;
  db.tasks[userId] = [];
  db.streaks[userId] = {
    currentStreak: 0,
    longestStreak: 0,
    todayTargetMet: false,
    lastCompletedDate: null,
    freezeCount: 2,
    completedDays: 0,
    weeklyHistory: [
      { day: 'M', date: '2026-08-25', status: 'upcoming', tasksDone: 0, target: 2 },
      { day: 'T', date: '2026-08-26', status: 'upcoming', tasksDone: 0, target: 2 },
      { day: 'W', date: '2026-08-27', status: 'upcoming', tasksDone: 0, target: 2 },
      { day: 'T', date: '2026-08-28', status: 'upcoming', tasksDone: 0, target: 2 },
      { day: 'F', date: '2026-08-29', status: 'upcoming', tasksDone: 0, target: 2 },
      { day: 'S', date: '2026-08-30', status: 'upcoming', tasksDone: 0, target: 2 },
      { day: 'S', date: '2026-08-31', status: 'in_progress', tasksDone: 0, target: 2 }
    ]
  };
  db.revisions[userId] = [];
  db.notifications[userId] = [
    {
      id: `notif-${Date.now()}-1`,
      title: 'Welcome to NOVARA 🚀',
      message: 'Upload your placement roadmap to convert it into your structured daily preparation plan.',
      time: 'Just now',
      type: 'plan',
      unread: true
    }
  ];
  db.notificationPreferences[userId] = {
    dailyPlanReminder: true,
    studySessionReminder: true,
    unfinishedTaskReminder: true,
    streakRiskReminder: true,
    revisionReminder: true,
    weeklySummary: true,
    preferredReminderTimes: { morning: '08:00', evening: '18:00' }
  };
  db.readiness[userId] = {
    overallScore: 0,
    benchmarkLabel: 'Onboarding (Initial)',
    categories: [
      { name: 'DSA & Problem Solving', percentage: 0, color: 'terracotta', totalProblems: 0, targetProblems: 250 },
      { name: 'Core Computer Science', percentage: 0, color: 'navy', completedTopics: 0, targetTopics: 20 },
      { name: 'System Design & LLD', percentage: 0, color: 'sage', completedTopics: 0, targetTopics: 10 },
      { name: 'Aptitude & Speed Math', percentage: 0, color: 'amber', completedTopics: 0, targetTopics: 15 }
    ],
    stats: {
      tasksCompleted: 0,
      studyHoursLogged: 0,
      problemsSolved: 0,
      daysCompleted: 0,
      currentStreak: 0,
      longestStreak: 0
    }
  };

  const sessionToken = `session_${userId}_${crypto.randomBytes(24).toString('hex')}`;
  db.sessions.push({
    token: sessionToken,
    userId: userId,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  });

  saveDb(db);

  return {
    token: sessionToken,
    user: sanitizeUser(newUser)
  };
}

export function loginUser({ email, password }) {
  const db = loadDb();
  const normalizedEmail = email.toLowerCase().trim();
  const pwdHash = hashPassword(password);

  const user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (!user || user.passwordHash !== pwdHash) {
    throw new Error('Invalid email address or password.');
  }

  const sessionToken = `session_${user.id}_${crypto.randomBytes(24).toString('hex')}`;
  db.sessions.push({
    token: sessionToken,
    userId: user.id,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  });

  saveDb(db);

  return {
    token: sessionToken,
    user: sanitizeUser(user)
  };
}

export function loginWithGoogle({ googleId, email, name, picture }) {
  const db = loadDb();
  const normalizedEmail = email.toLowerCase().trim();

  // Find user by googleId or email
  let user = db.users.find((u) => (u.googleId && u.googleId === googleId) || (u.email && u.email.toLowerCase() === normalizedEmail));
  let isNewUser = false;

  if (!user) {
    isNewUser = true;
    const userId = `usr_g_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const initials = name
      ? name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      : 'NV';

    user = {
      id: userId,
      googleId: googleId || null,
      name: name || normalizedEmail.split('@')[0],
      email: normalizedEmail,
      avatar: initials || 'NV',
      picture: picture || null,
      passwordHash: hashPassword(crypto.randomBytes(16).toString('hex')),
      targetRole: 'Software Engineer',
      dailyStudyMinutes: 180,
      placementTargetDate: '2026-11-20',
      currentPreparationLevel: 'Intermediate',
      hasCompletedOnboarding: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.users.push(user);
    db.roadmaps[userId] = null;
    db.tasks[userId] = [];
    db.streaks[userId] = {
      currentStreak: 0,
      longestStreak: 0,
      todayTargetMet: false,
      lastCompletedDate: null,
      freezeCount: 2,
      completedDays: 0,
      weeklyHistory: []
    };
    db.revisions[userId] = [];
    db.notifications[userId] = [];
    db.notificationPreferences[userId] = { dailyPlanReminder: true, studySessionReminder: true, unfinishedTaskReminder: true, streakRiskReminder: true, revisionReminder: true, weeklySummary: true };
    db.readiness[userId] = { overallScore: 0, benchmarkLabel: 'New Student', categories: [], stats: { tasksCompleted: 0, studyHoursLogged: 0, problemsSolved: 0, daysCompleted: 0, currentStreak: 0, longestStreak: 0 } };
  } else {
    // Returning user: Link googleId if not present, and update picture if available
    let updated = false;
    if (googleId && !user.googleId) {
      user.googleId = googleId;
      updated = true;
    }
    if (picture && !user.picture) {
      user.picture = picture;
      updated = true;
    }
    if (updated) {
      user.updatedAt = new Date().toISOString();
    }
  }

  const sessionToken = `session_${user.id}_${crypto.randomBytes(24).toString('hex')}`;
  db.sessions.push({
    token: sessionToken,
    userId: user.id,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  });

  saveDb(db);

  return {
    token: sessionToken,
    user: sanitizeUser(user),
    isNewUser: isNewUser
  };
}

export function validateSessionToken(token) {
  if (!token) return null;
  const db = loadDb();
  const session = db.sessions.find((s) => s.token === token);
  if (!session) return null;

  if (new Date(session.expiresAt) < new Date()) {
    return null;
  }

  const user = db.users.find((u) => u.id === session.userId);
  if (!user) return null;

  return sanitizeUser(user);
}

export function logoutSession(token) {
  if (!token) return;
  const db = loadDb();
  db.sessions = db.sessions.filter((s) => s.token !== token);
  saveDb(db);
}

export function requestPasswordReset(email) {
  if (!email || typeof email !== 'string') return null;
  const db = loadDb();
  const normalizedEmail = email.toLowerCase().trim();
  const user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);
  if (!user) {
    // Avoid user enumeration
    return { success: true, message: 'If this email is registered, a password reset link has been sent.' };
  }

  if (!db.passwordResetTokens) db.passwordResetTokens = [];
  // Invalidate previous tokens for this user
  db.passwordResetTokens = db.passwordResetTokens.filter((t) => t.userId !== user.id);

  const resetToken = `rst_${crypto.randomBytes(24).toString('hex')}`;
  db.passwordResetTokens.push({
    token: resetToken,
    userId: user.id,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour expiration
    used: false
  });

  saveDb(db);
  return { success: true, message: 'If this email is registered, a password reset link has been sent.', resetToken };
}

export function resetPasswordWithToken(resetToken, newPassword) {
  if (!resetToken || !newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    throw new Error('Valid token and password (min 6 chars) are required.');
  }

  const db = loadDb();
  if (!db.passwordResetTokens) db.passwordResetTokens = [];

  const recordIdx = db.passwordResetTokens.findIndex(
    (t) => t.token === resetToken && !t.used && new Date(t.expiresAt) > new Date()
  );

  if (recordIdx === -1) {
    throw new Error('Password reset token is invalid, expired, or already used.');
  }

  const record = db.passwordResetTokens[recordIdx];
  const userIdx = db.users.findIndex((u) => u.id === record.userId);
  if (userIdx === -1) {
    throw new Error('User account not found.');
  }

  // Update password hash
  db.users[userIdx].passwordHash = hashPassword(newPassword);
  db.users[userIdx].updatedAt = new Date().toISOString();

  // Mark token as used (single-use)
  db.passwordResetTokens[recordIdx].used = true;

  // Invalidate all existing sessions for security
  if (db.sessions) {
    db.sessions = db.sessions.filter((s) => s.userId !== record.userId);
  }

  saveDb(db);
  return { success: true, message: 'Password has been securely reset. Please log in with your new password.' };
}

function sanitizeUser(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}

// ---------------------------------------------------------------------------
// SYNCHRONIZED USER STATE (CROSS-DEVICE SOURCE OF TRUTH)
// ---------------------------------------------------------------------------

export function getFullUserState(userId) {
  const db = loadDb();
  const user = db.users.find((u) => u.id === userId);
  if (!user) {
    throw new Error('User not found.');
  }

  const applications = (db.applications && db.applications[userId]) ? db.applications[userId] : [];
  const appliedCount = applications.length;
  const inProcessCount = applications.filter((a) => ['Online Assessment', 'Interview'].includes(a.status)).length;
  const interviewCount = applications.filter((a) => a.status === 'Interview').length;
  const offerCount = applications.filter((a) => a.status === 'Offer').length;
  const oaCount = applications.filter((a) => a.status === 'Online Assessment' || a.interviews?.some(i => i.type === 'Online Assessment' || i.title?.includes('OA'))).length;

  const applicationMetrics = {
    totalApplications: appliedCount,
    appliedCount,
    inProcessCount,
    oaCount,
    interviewCount,
    offerCount,
    funnel: {
      appliedToAssessmentRate: appliedCount > 0 ? Math.round((oaCount / appliedCount) * 100) : 0,
      assessmentToInterviewRate: oaCount > 0 ? Math.round((interviewCount / oaCount) * 100) : 0,
      interviewToOfferRate: interviewCount > 0 ? Math.round((offerCount / interviewCount) * 100) : 0
    }
  };

  return {
    profile: sanitizeUser(user),
    roadmap: db.roadmaps[userId] || null,
    tasks: db.tasks[userId] || [],
    streak: db.streaks[userId] || { currentStreak: 0, longestStreak: 0, todayTargetMet: false },
    revisionQueue: db.revisions[userId] || [],
    applications: applications,
    applicationMetrics: applicationMetrics,
    notifications: db.notifications[userId] || [],
    notifPreferences: db.notificationPreferences[userId] || {},
    readiness: db.readiness[userId] || { overallScore: 0 }
  };
}

export function updateUserProfile(userId, profileUpdates) {
  const db = loadDb();
  const idx = db.users.findIndex((u) => u.id === userId);
  if (idx === -1) throw new Error('User not found.');

  db.users[idx] = {
    ...db.users[idx],
    ...profileUpdates,
    updatedAt: new Date().toISOString()
  };

  saveDb(db);
  return sanitizeUser(db.users[idx]);
}

export function updateUserRoadmap(userId, roadmap) {
  const db = loadDb();
  db.roadmaps[userId] = {
    ...roadmap,
    userId: userId,
    updatedAt: new Date().toISOString()
  };
  saveDb(db);
  return db.roadmaps[userId];
}

export function toggleTaskCompletionOnServer(userId, taskId) {
  const db = loadDb();
  const userTasks = db.tasks[userId] || [];
  let updatedTaskName = '';
  let isNowCompleted = false;

  const updatedTasks = userTasks.map((t) => {
    if (t.id === taskId) {
      isNowCompleted = !t.completed;
      updatedTaskName = t.name;
      return {
        ...t,
        completed: isNowCompleted,
        completedAt: isNowCompleted ? new Date().toISOString() : null,
        subtasks: t.subtasks ? t.subtasks.map((st) => ({ ...st, done: isNowCompleted })) : []
      };
    }
    return t;
  });

  db.tasks[userId] = updatedTasks;

  // Streak Evaluation
  const completedCount = updatedTasks.filter((t) => t.completed).length;
  const userStreak = db.streaks[userId] || { currentStreak: 0, longestStreak: 0, todayTargetMet: false };
  const isTargetMet = completedCount >= 2;

  let newCurrent = userStreak.currentStreak;
  let newLongest = userStreak.longestStreak;

  if (isTargetMet && !userStreak.todayTargetMet) {
    newCurrent += 1;
    if (newCurrent > newLongest) newLongest = newCurrent;
  } else if (!isTargetMet && userStreak.todayTargetMet) {
    newCurrent = Math.max(0, newCurrent - 1);
  }

  db.streaks[userId] = {
    ...userStreak,
    todayTargetMet: isTargetMet,
    currentStreak: newCurrent,
    longestStreak: newLongest,
    lastCompletedDate: isTargetMet ? new Date().toISOString().split('T')[0] : userStreak.lastCompletedDate
  };

  saveDb(db);

  return {
    tasks: updatedTasks,
    streak: db.streaks[userId],
    toggledTask: { name: updatedTaskName, completed: isNowCompleted }
  };
}

export function toggleSubtaskOnServer(userId, taskId, subtaskId) {
  const db = loadDb();
  const userTasks = db.tasks[userId] || [];

  const updatedTasks = userTasks.map((task) => {
    if (task.id === taskId) {
      const updatedSubtasks = (task.subtasks || []).map((st) =>
        st.id === subtaskId ? { ...st, done: !st.done } : st
      );
      const allDone = updatedSubtasks.length > 0 && updatedSubtasks.every((st) => st.done);
      return {
        ...task,
        subtasks: updatedSubtasks,
        completed: allDone,
        completedAt: allDone ? new Date().toISOString() : null
      };
    }
    return task;
  });

  db.tasks[userId] = updatedTasks;
  saveDb(db);

  return updatedTasks;
}

export function saveUserDailyTasks(userId, roadmap, tasks) {
  const db = loadDb();
  if (roadmap) {
    db.roadmaps[userId] = roadmap;
  }

  // Merge tasks preserving completion state if any tasks were already completed
  const existingTasks = db.tasks[userId] || [];
  const completedMap = new Map();
  for (const t of existingTasks) {
    if (t.completed) {
      completedMap.set(t.id, t);
      if (t.name) completedMap.set(t.name, t);
    }
  }

  const mergedTasks = (tasks || []).map((t) => {
    const existing = completedMap.get(t.id) || (t.name ? completedMap.get(t.name) : null);
    if (existing && existing.completed) {
      return {
        ...t,
        completed: true,
        completedAt: existing.completedAt || new Date().toISOString(),
        subtasks: t.subtasks ? t.subtasks.map((st) => ({ ...st, done: true })) : []
      };
    }
    return t;
  });

  db.tasks[userId] = mergedTasks;

  // Also ensure user profile hasCompletedOnboarding is true
  const userIdx = db.users.findIndex((u) => u.id === userId);
  if (userIdx !== -1) {
    db.users[userIdx].hasCompletedOnboarding = true;
    db.users[userIdx].updatedAt = new Date().toISOString();
  }

  saveDb(db);
  return { roadmap: db.roadmaps[userId], tasks: mergedTasks };
}

export function recordUploadedFile(userId, fileMeta) {
  const db = loadDb();
  if (!db.uploadedFiles) {
    db.uploadedFiles = {};
  }
  if (!db.uploadedFiles[userId]) {
    db.uploadedFiles[userId] = [];
  }
  const entry = {
    id: fileMeta.fileId || `file_${Date.now()}`,
    userId,
    fileName: fileMeta.fileName,
    sizeBytes: fileMeta.sizeBytes,
    storageKey: fileMeta.storageKey,
    uploadedAt: fileMeta.uploadedAt || new Date().toISOString()
  };
  db.uploadedFiles[userId].push(entry);
  saveDb(db);
  return entry;
}

export function getUserUploadedFiles(userId) {
  const db = loadDb();
  return (db.uploadedFiles && db.uploadedFiles[userId]) || [];
}

export function completeRevisionOnServer(userId, revId, grade = 'good') {
  const db = loadDb();
  const userRevs = db.revisions[userId] || [];

  db.revisions[userId] = userRevs.map((item) =>
    item.id === revId
      ? {
          ...item,
          revisionDueDate: grade === 'easy' ? 'In 14 days' : grade === 'good' ? 'In 7 days' : 'Tomorrow',
          retentionScore: grade === 'easy' ? '95%' : grade === 'good' ? '88%' : '70%',
          completedAt: new Date().toISOString()
        }
      : item
  );

  saveDb(db);
  return db.revisions[userId];
}

export { loadDb, saveDb };

export function markSingleNotificationReadOnServer(userId, notifId) {
  const db = loadDb();
  if (db.notifications[userId]) {
    db.notifications[userId] = db.notifications[userId].map((n) =>
      n.id === notifId ? { ...n, unread: false } : n
    );
    saveDb(db);
  }
  return db.notifications[userId] || [];
}

export function deleteNotificationOnServer(userId, notifId) {
  const db = loadDb();
  if (db.notifications[userId]) {
    db.notifications[userId] = db.notifications[userId].filter((n) => n.id !== notifId);
    saveDb(db);
  }
  return db.notifications[userId] || [];
}

export function clearAllNotificationsOnServer(userId) {
  const db = loadDb();
  db.notifications[userId] = [];
  saveDb(db);
  return [];
}

export function markNotificationsReadOnServer(userId) {
  const db = loadDb();
  if (db.notifications[userId]) {
    db.notifications[userId] = db.notifications[userId].map((n) => ({ ...n, unread: false }));
    saveDb(db);
  }
  return db.notifications[userId] || [];
}

export function updateNotificationPreferencesOnServer(userId, preferences) {
  const db = loadDb();
  db.notificationPreferences[userId] = {
    ...(db.notificationPreferences[userId] || {}),
    ...preferences
  };
  saveDb(db);
  return db.notificationPreferences[userId];
}


