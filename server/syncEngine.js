import { loadDb, saveDb, getFullUserState } from './db.js';
import { submitRevisionAttempt } from './revisionService.js';
import { 
  createApplicationInDb, 
  updateApplicationInDb, 
  deleteApplicationFromDb, 
  addInterviewToAppInDb, 
  updateInterviewInAppInDb, 
  deleteInterviewFromAppInDb 
} from './applicationService.js';
import { 
  createPersonalEventInDb, 
  updatePersonalEventInDb, 
  deletePersonalEventFromDb 
} from './calendarService.js';

/**
 * Process a batch of offline synchronization operations idempotently
 */
export function processBatchSync(userId, operations = []) {
  if (!userId) throw new Error('User ID is required for sync.');
  if (!Array.isArray(operations) || operations.length === 0) {
    return {
      success: true,
      processedCount: 0,
      fullState: getFullUserState(userId)
    };
  }

  const db = loadDb();
  if (!db.processedOperations) db.processedOperations = {};
  if (!db.processedOperations[userId]) db.processedOperations[userId] = [];

  const processedSet = new Set(db.processedOperations[userId].map((p) => p.operationId));
  let processedCount = 0;

  for (const op of operations) {
    if (!op || typeof op !== 'object') continue;
    const { operationId, entityType, entityId, operation, payload = {} } = op;

    // Validate operationId and entityType
    if (!operationId || typeof operationId !== 'string' || operationId.length > 200) {
      continue;
    }
    if (!entityType || typeof entityType !== 'string' || entityType.length > 50) {
      continue;
    }

    // Idempotency Check: skip already processed operations
    if (processedSet.has(operationId)) {
      continue;
    }

    try {
      switch (entityType) {
        // -----------------------------------------------------------------
        // 1. TASKS
        // -----------------------------------------------------------------
        case 'TASK': {
          if (!db.tasks[userId]) db.tasks[userId] = [];
          const taskIdx = db.tasks[userId].findIndex((t) => t.id === entityId);
          
          if (taskIdx !== -1) {
            const currentTask = db.tasks[userId][taskIdx];
            // Conflict rule: completed wins over incomplete
            const isCompleted = payload.completed !== undefined ? payload.completed : true;

            db.tasks[userId][taskIdx] = {
              ...currentTask,
              ...payload,
              completed: isCompleted || currentTask.completed,
              completedAt: isCompleted ? (payload.completedAt || new Date().toISOString()) : currentTask.completedAt,
              updatedAt: new Date().toISOString()
            };

            // Update streak if today target met
            if (isCompleted && db.streaks[userId]) {
              const completedToday = db.tasks[userId].filter((t) => t.completed).length;
              if (completedToday >= 2 && !db.streaks[userId].todayTargetMet) {
                db.streaks[userId].todayTargetMet = true;
                db.streaks[userId].currentStreak = (db.streaks[userId].currentStreak || 0) + 1;
                db.streaks[userId].longestStreak = Math.max(db.streaks[userId].currentStreak, db.streaks[userId].longestStreak || 0);
              }
            }
          }
          break;
        }

        // -----------------------------------------------------------------
        // 2. FOCUS SESSIONS
        // -----------------------------------------------------------------
        case 'FOCUS_SESSION': {
          if (!db.focusSessions) db.focusSessions = {};
          if (!db.focusSessions[userId]) db.focusSessions[userId] = [];

          const existingSessIdx = db.focusSessions[userId].findIndex((s) => s.sessionId === entityId || s.sessionId === payload.sessionId);
          const sessionData = {
            sessionId: entityId || payload.sessionId || `focus_${Date.now()}`,
            userId,
            taskId: payload.taskId,
            startedAt: payload.startedAt || new Date().toISOString(),
            endedAt: payload.endedAt || new Date().toISOString(),
            plannedMinutes: payload.plannedMinutes || 45,
            actualMinutes: payload.actualMinutes || 45,
            status: 'completed',
            updatedAt: new Date().toISOString()
          };

          if (existingSessIdx !== -1) {
            db.focusSessions[userId][existingSessIdx] = sessionData;
          } else {
            db.focusSessions[userId].push(sessionData);
          }

          // Update task completed state if taskId provided
          if (payload.taskId && db.tasks[userId]) {
            const tIdx = db.tasks[userId].findIndex((t) => t.id === payload.taskId);
            if (tIdx !== -1) {
              db.tasks[userId][tIdx].completed = true;
              db.tasks[userId][tIdx].actualMinutes = (db.tasks[userId][tIdx].actualMinutes || 0) + (payload.actualMinutes || 0);
            }
          }
          break;
        }

        // -----------------------------------------------------------------
        // 3. REVISION
        // -----------------------------------------------------------------
        case 'REVISION': {
          if (!db.revisions[userId]) db.revisions[userId] = [];
          const revIdx = db.revisions[userId].findIndex((r) => r.id === entityId);
          if (revIdx !== -1) {
            const currentRev = db.revisions[userId][revIdx];
            const grade = payload.grade || 'good';
            const ladder = [1, 3, 7, 14, 30];
            const currentLadderIdx = ladder.indexOf(currentRev.intervalDays || 1);
            let nextInterval = 3;
            if (grade === 'easy') {
              nextInterval = ladder[Math.min(currentLadderIdx + 2, ladder.length - 1)] || 14;
            } else if (grade === 'good') {
              nextInterval = ladder[Math.min(currentLadderIdx + 1, ladder.length - 1)] || 7;
            } else {
              nextInterval = 1;
            }

            db.revisions[userId][revIdx] = {
              ...currentRev,
              intervalDays: nextInterval,
              retentionScore: grade === 'easy' ? '92%' : grade === 'good' ? '85%' : '65%',
              revisionDueDate: nextInterval === 1 ? 'Tomorrow' : `In ${nextInterval} days`,
              status: 'completed',
              lastRevisedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
          }
          break;
        }

        // -----------------------------------------------------------------
        // 4. APPLICATIONS
        // -----------------------------------------------------------------
        case 'APPLICATION': {
          if (!db.applications) db.applications = {};
          if (!db.applications[userId]) db.applications[userId] = [];

          if (operation === 'CREATE') {
            const exists = db.applications[userId].some((a) => a.id === entityId);
            if (!exists) {
              db.applications[userId].unshift({
                ...payload,
                id: entityId || `app_${Date.now()}`,
                userId,
                createdAt: payload.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
              });
            }
          } else if (operation === 'UPDATE') {
            const aIdx = db.applications[userId].findIndex((a) => a.id === entityId);
            if (aIdx !== -1) {
              db.applications[userId][aIdx] = {
                ...db.applications[userId][aIdx],
                ...payload,
                updatedAt: new Date().toISOString()
              };
            }
          } else if (operation === 'DELETE') {
            db.applications[userId] = db.applications[userId].filter((a) => a.id !== entityId);
          }
          break;
        }

        // -----------------------------------------------------------------
        // 5. INTERVIEWS
        // -----------------------------------------------------------------
        case 'INTERVIEW': {
          const appId = payload.applicationId;
          if (appId && db.applications && db.applications[userId]) {
            const app = db.applications[userId].find((a) => a.id === appId);
            if (app) {
              if (!app.interviews) app.interviews = [];
              if (operation === 'CREATE') {
                const intExists = app.interviews.some((i) => i.id === entityId);
                if (!intExists) {
                  app.interviews.push({
                    ...payload,
                    id: entityId || `int_${Date.now()}`,
                    status: payload.status || 'scheduled'
                  });
                }
              } else if (operation === 'UPDATE') {
                const iIdx = app.interviews.findIndex((i) => i.id === entityId);
                if (iIdx !== -1) {
                  app.interviews[iIdx] = { ...app.interviews[iIdx], ...payload };
                }
              } else if (operation === 'DELETE') {
                app.interviews = app.interviews.filter((i) => i.id !== entityId);
              }
              app.updatedAt = new Date().toISOString();
            }
          }
          break;
        }

        // -----------------------------------------------------------------
        // 6. CALENDAR EVENTS
        // -----------------------------------------------------------------
        case 'CALENDAR_EVENT': {
          if (!db.calendarEvents) db.calendarEvents = {};
          if (!db.calendarEvents[userId]) db.calendarEvents[userId] = [];

          if (operation === 'CREATE') {
            const evExists = db.calendarEvents[userId].some((e) => e.id === entityId);
            if (!evExists) {
              db.calendarEvents[userId].unshift({
                ...payload,
                id: entityId || `evt_personal_${Date.now()}`,
                userId,
                createdAt: payload.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
              });
            }
          } else if (operation === 'UPDATE') {
            const eIdx = db.calendarEvents[userId].findIndex((e) => e.id === entityId);
            if (eIdx !== -1) {
              db.calendarEvents[userId][eIdx] = {
                ...db.calendarEvents[userId][eIdx],
                ...payload,
                updatedAt: new Date().toISOString()
              };
            }
          } else if (operation === 'DELETE') {
            db.calendarEvents[userId] = db.calendarEvents[userId].filter((e) => e.id !== entityId);
          }
          break;
        }

        // -----------------------------------------------------------------
        // 7. PREFERENCES
        // -----------------------------------------------------------------
        case 'PREFERENCES': {
          if (!db.notificationPreferences) db.notificationPreferences = {};
          db.notificationPreferences[userId] = {
            ...(db.notificationPreferences[userId] || {}),
            ...payload
          };
          break;
        }

        default:
          console.warn(`[SyncEngine] Unrecognized entityType: ${entityType}`);
      }

      // Record in Idempotency Ledger
      db.processedOperations[userId].push({
        operationId,
        entityType,
        entityId,
        processedAt: new Date().toISOString()
      });
      processedSet.add(operationId);
      processedCount++;

    } catch (opErr) {
      console.error(`[SyncEngine] Error processing op ${operationId}:`, opErr);
    }
  }

  saveDb(db);

  return {
    success: true,
    processedCount,
    fullState: getFullUserState(userId)
  };
}
