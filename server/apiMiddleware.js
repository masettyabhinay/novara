/**
 * Vite Dev Server API Middleware
 * Provides real server-side REST endpoints for:
 * - Authentication (Sign up, Login, Google SSO, Logout, Password reset)
 * - User state synchronization (Cross-device data source of truth)
 * - Smart proactive notifications & preferences
 * - Roadmap document analysis & plan generation
 */

import { 
  signupUser, 
  loginUser, 
  loginWithGoogle, 
  validateSessionToken, 
  logoutSession, 
  requestPasswordReset,
  resetPasswordWithToken,
  getFullUserState, 
  updateUserProfile, 
  updateUserRoadmap, 
  toggleTaskCompletionOnServer, 
  toggleSubtaskOnServer, 
  saveUserDailyTasks, 
  completeRevisionOnServer, 
  markNotificationsReadOnServer, 
  markSingleNotificationReadOnServer,
  deleteNotificationOnServer,
  clearAllNotificationsOnServer,
  updateNotificationPreferencesOnServer,
  loadDb,
  saveDb
} from './db.js';

import { 
  evaluateUserNotifications, 
  triggerTestNotification 
} from './notificationEngine.js';

import { 
  analyzeUserPreparation, 
  applyCoachRecommendationOnServer 
} from './coachService.js';

import { 
  startInterviewSession, 
  evaluateInterviewAnswerOnServer, 
  completeInterviewSessionOnServer, 
  getInterviewHistoryOnServer 
} from './interviewService.js';

import { 
  extractTextFromBuffer, 
  sanitizeExtractedText,
  parseDocumentTextToRoadmap, 
  validateRoadmapSchema, 
  generateDailyPlanFromRoadmap 
} from './roadmapService.js';

import {
  isGeminiConfigured,
  getAIProvider,
  parseRoadmapWithAI,
  generateDailyPlanWithAI,
  analyzeCoachWithAI,
  generateInterviewQuestionsWithAI,
  evaluateInterviewAnswerWithAI,
  generateRevisionQuestionsWithAI,
  generateTaskRevisionQuiz
} from './aiService.js';

import { verifyGoogleToken, isValidGoogleClientId } from './authGoogle.js';

import {
  startFocusSession,
  pauseFocusSession,
  resumeFocusSession,
  completeFocusSession,
  abandonFocusSession,
  getActiveFocusSession,
  getFocusSessionsHistory,
  getFocusAnalytics
} from './focusService.js';

import {
  getRevisionsForUser,
  generateRevisionQuestions,
  submitRevisionAttempt,
  recordTaskRevisionAndComplete,
  rescheduleRevision
} from './revisionService.js';

import {
  getUserApplicationsFromDb,
  calculateApplicationMetrics,
  getUpcomingApplicationEvents,
  getPreparationRecommendation,
  createApplicationInDb,
  updateApplicationInDb,
  deleteApplicationFromDb,
  addInterviewToAppInDb,
  updateInterviewInAppInDb,
  deleteInterviewFromAppInDb
} from './applicationService.js';

import {
  getAggregatedCalendarEvents,
  calculateDailyCapacity,
  createPersonalEventInDb,
  updatePersonalEventInDb,
  deletePersonalEventFromDb
} from './calendarService.js';

import { processBatchSync } from './syncEngine.js';

import { 
  checkRateLimit, 
  applySecurityHeaders, 
  validateFileSignature 
} from './securityMiddleware.js';

import { 
  validateEmail, 
  validatePassword, 
  validateString,
  sanitizeAndValidateApplicationInput,
  sanitizeAndValidateInterviewInput,
  sanitizeAndValidateCalendarEventInput
} from './validationService.js';

import { dbAdapter } from './db/dbAdapter.js';
import { fileStorageService } from './storageService.js';
import { logger, ERROR_CATEGORIES } from './logger.js';

function getAuthUserFromRequest(req) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  return validateSessionToken(token);
}

function sendJson(res, statusCode, data, req = null) {
  applySecurityHeaders(res, req);
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

async function readBodyJson(req, maxBytes = 2 * 1024 * 1024) {
  const chunks = [];
  let totalSize = 0;

  for await (const chunk of req) {
    totalSize += chunk.length;
    if (totalSize > maxBytes) {
      throw new Error('PAYLOAD_TOO_LARGE');
    }
    chunks.push(chunk);
  }
  const text = Buffer.concat(chunks).toString('utf8');
  try {
    return JSON.parse(text || '{}');
  } catch (e) {
    throw new Error('MALFORMED_JSON');
  }
}

export async function apiMiddlewareHandler(req, res, next) {
  const rawUrl = req.url || '';
  const pathname = rawUrl.split('?')[0];

        // Apply defensive headers to all requests
        applySecurityHeaders(res, req);

        // Preflight OPTIONS handling
        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          return res.end();
        }

        // Only handle /api/ routes
        if (!pathname.startsWith('/api/')) {
          return next();
        }

        // -------------------------------------------------------------------
        // 0. HEALTH CHECK ENDPOINT
        // -------------------------------------------------------------------
        if (req.method === 'GET' && pathname === '/api/health') {
          const dbHealth = await dbAdapter.healthCheck();
          const storageHealth = await fileStorageService.healthCheck();

          return sendJson(res, 200, {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '1.0.2',
            buildCommit: '1.0.2-roadmap-pipeline-fixed',
            uptime: Math.round(process.uptime()),
            environment: process.env.NODE_ENV || 'development',
            services: {
              server: 'online',
              database: dbHealth.status === 'healthy' ? 'connected' : 'degraded',
              storage: storageHealth.status === 'healthy' ? 'available' : 'degraded'
            }
          }, req);
        }

        // -------------------------------------------------------------------
        // 1. AUTHENTICATION ENDPOINTS (WITH RATE LIMITING)
        // -------------------------------------------------------------------
        if (req.method === 'POST' && pathname === '/api/auth/signup') {
          const rateCheck = checkRateLimit(req, 'AUTH');
          if (!rateCheck.allowed) {
            res.setHeader('Retry-After', String(rateCheck.retryAfterSeconds));
            return sendJson(res, 429, { success: false, error: 'Too many signup attempts. Please try again later.' }, req);
          }

          try {
            const body = await readBodyJson(req);
            if (!body.email || !validateEmail(body.email)) {
              return sendJson(res, 400, { success: false, error: 'Please enter a valid email address.' }, req);
            }
            if (!body.password || !validatePassword(body.password)) {
              return sendJson(res, 400, { success: false, error: 'Password must be between 6 and 128 characters.' }, req);
            }
            if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
              return sendJson(res, 400, { success: false, error: 'Name is required.' }, req);
            }
            const result = signupUser(body);
            return sendJson(res, 201, { success: true, ...result }, req);
          } catch (err) {
            if (err.message === 'PAYLOAD_TOO_LARGE') {
              return sendJson(res, 413, { success: false, error: 'Payload exceeds maximum limit.' }, req);
            }
            return sendJson(res, 400, { success: false, error: err.message }, req);
          }
        }

        if (req.method === 'POST' && pathname === '/api/auth/login') {
          const rateCheck = checkRateLimit(req, 'AUTH');
          if (!rateCheck.allowed) {
            res.setHeader('Retry-After', String(rateCheck.retryAfterSeconds));
            return sendJson(res, 429, { success: false, error: 'Too many login attempts. Please try again later.' }, req);
          }

          try {
            const body = await readBodyJson(req);
            const result = loginUser(body);
            return sendJson(res, 200, { success: true, ...result }, req);
          } catch (err) {
            return sendJson(res, 401, { success: false, error: err.message }, req);
          }
        }

        if (req.method === 'GET' && pathname === '/api/auth/config') {
          const rawId = (process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '').trim();
          const valid = isValidGoogleClientId(rawId);
          return sendJson(res, 200, {
            success: true,
            googleClientId: valid ? rawId : '',
            isConfigured: valid
          }, req);
        }

        if (req.method === 'POST' && pathname === '/api/auth/google') {
          const rateCheck = checkRateLimit(req, 'AUTH');
          if (!rateCheck.allowed) {
            res.setHeader('Retry-After', String(rateCheck.retryAfterSeconds));
            return sendJson(res, 429, { success: false, error: 'Too many login attempts. Please try again later.' }, req);
          }

          try {
            const body = await readBodyJson(req);
            // Server-side verification with Google
            const verifiedProfile = await verifyGoogleToken(body);
            // Authenticate or create user in DB
            const result = loginWithGoogle(verifiedProfile);
            return sendJson(res, 200, { success: true, ...result }, req);
          } catch (err) {
            return sendJson(res, 401, { success: false, error: err.message }, req);
          }
        }

        if (req.method === 'POST' && pathname === '/api/auth/logout') {
          const authHeader = req.headers['authorization'] || '';
          const token = authHeader.replace(/^Bearer\s+/i, '').trim();
          logoutSession(token);
          return sendJson(res, 200, { success: true, message: 'Logged out successfully.' }, req);
        }

        if (req.method === 'POST' && pathname === '/api/auth/forgot-password') {
          const rateCheck = checkRateLimit(req, 'AUTH');
          if (!rateCheck.allowed) {
            res.setHeader('Retry-After', String(rateCheck.retryAfterSeconds));
            return sendJson(res, 429, { success: false, error: 'Too many password reset attempts. Please try again later.' }, req);
          }

          try {
            const body = await readBodyJson(req);
            const result = requestPasswordReset(body.email);
            return sendJson(res, 200, result || { success: true, message: 'If this email is registered, a password reset link has been sent.' }, req);
          } catch (err) {
            return sendJson(res, 400, { success: false, error: err.message }, req);
          }
        }

        if (req.method === 'POST' && pathname === '/api/auth/reset-password') {
          const rateCheck = checkRateLimit(req, 'AUTH');
          if (!rateCheck.allowed) {
            res.setHeader('Retry-After', String(rateCheck.retryAfterSeconds));
            return sendJson(res, 429, { success: false, error: 'Too many attempts. Please try again later.' }, req);
          }

          try {
            const body = await readBodyJson(req);
            const result = resetPasswordWithToken(body.token, body.newPassword);
            return sendJson(res, 200, result, req);
          } catch (err) {
            return sendJson(res, 400, { success: false, error: err.message }, req);
          }
        }

        // -------------------------------------------------------------------
        // 2. USER DATA & CROSS-DEVICE SYNCHRONIZATION & COACH & INTERVIEW
        // -------------------------------------------------------------------
        if (pathname.startsWith('/api/user/') || pathname.startsWith('/api/coach/') || pathname.startsWith('/api/interview/')) {
          const authUser = getAuthUserFromRequest(req);
          if (!authUser) {
            return sendJson(res, 401, { success: false, error: 'Your session has expired. Please log in again.' }, req);
          }

          // GET /api/user/sync
          if (req.method === 'GET' && pathname === '/api/user/sync') {
            try {
              evaluateUserNotifications(authUser.id);
              const userState = getFullUserState(authUser.id);
              return sendJson(res, 200, { success: true, data: userState }, req);
            } catch (err) {
              return sendJson(res, 500, { success: false, error: 'Failed to retrieve user sync state.' }, req);
            }
          }

          // PUT or POST /api/user/profile
          if ((req.method === 'PUT' || req.method === 'POST') && pathname === '/api/user/profile') {
            try {
              const body = await readBodyJson(req);
              const updatedProfile = updateUserProfile(authUser.id, body);
              return sendJson(res, 200, { success: true, profile: updatedProfile }, req);
            } catch (err) {
              return sendJson(res, 400, { success: false, error: err.message }, req);
            }
          }

          // PUT or POST /api/user/roadmap
          if ((req.method === 'PUT' || req.method === 'POST') && pathname === '/api/user/roadmap') {
            try {
              const { roadmap } = await readBodyJson(req);
              const validation = validateRoadmapSchema(roadmap);
              if (!validation.valid) {
                return sendJson(res, 400, { success: false, error: validation.error }, req);
              }
              const savedRoadmap = updateUserRoadmap(authUser.id, roadmap);
              return sendJson(res, 200, { success: true, roadmap: savedRoadmap }, req);
            } catch (err) {
              return sendJson(res, 400, { success: false, error: err.message }, req);
            }
          }

          // PUT /api/user/tasks/toggle
          if (req.method === 'PUT' && pathname === '/api/user/tasks/toggle') {
            try {
              const { taskId } = await readBodyJson(req);
              if (!taskId) return sendJson(res, 400, { success: false, error: 'Task ID is required.' }, req);
              const result = toggleTaskCompletionOnServer(authUser.id, taskId);
              return sendJson(res, 200, { success: true, ...result }, req);
            } catch (err) {
              return sendJson(res, 400, { success: false, error: err.message }, req);
            }
          }

          // PUT /api/user/tasks/subtask
          if (req.method === 'PUT' && pathname === '/api/user/tasks/subtask') {
            try {
              const { taskId, subtaskId } = await readBodyJson(req);
              if (!taskId || !subtaskId) return sendJson(res, 400, { success: false, error: 'Task ID and Subtask ID are required.' }, req);
              const updatedTasks = toggleSubtaskOnServer(authUser.id, taskId, subtaskId);
              return sendJson(res, 200, { success: true, tasks: updatedTasks }, req);
            } catch (err) {
              return sendJson(res, 400, { success: false, error: err.message }, req);
            }
          }

          // POST /api/user/tasks/generate
          if (req.method === 'POST' && pathname === '/api/user/tasks/generate') {
            try {
              const { roadmap, preferences } = await readBodyJson(req);
              const planResult = generateDailyPlanFromRoadmap(roadmap, preferences);
              saveUserDailyTasks(authUser.id, roadmap, planResult.tasks);
              evaluateUserNotifications(authUser.id);
              return sendJson(res, 200, { success: true, tasks: planResult.tasks }, req);
            } catch (err) {
              return sendJson(res, 400, { success: false, error: err.message }, req);
            }
          }

          // PUT /api/user/revisions/complete
          if (req.method === 'PUT' && pathname === '/api/user/revisions/complete') {
            try {
              const { revId, grade } = await readBodyJson(req);
              if (!revId) return sendJson(res, 400, { success: false, error: 'Revision ID is required.' }, req);
              const updatedRevisions = completeRevisionOnServer(authUser.id, revId, grade);
              return sendJson(res, 200, { success: true, revisions: updatedRevisions }, req);
            } catch (err) {
              return sendJson(res, 400, { success: false, error: err.message }, req);
            }
          }

          // PUT /api/user/notifications/read-all
          if (req.method === 'PUT' && pathname === '/api/user/notifications/read-all') {
            try {
              const updatedNotifs = markNotificationsReadOnServer(authUser.id);
              return sendJson(res, 200, { success: true, notifications: updatedNotifs }, req);
            } catch (err) {
              return sendJson(res, 400, { success: false, error: err.message }, req);
            }
          }

          // PUT /api/user/notifications/read
          if (req.method === 'PUT' && pathname === '/api/user/notifications/read') {
            try {
              const { notifId } = await readBodyJson(req);
              if (!notifId) return sendJson(res, 400, { success: false, error: 'Notification ID is required.' }, req);
              const updatedNotifs = markSingleNotificationReadOnServer(authUser.id, notifId);
              return sendJson(res, 200, { success: true, notifications: updatedNotifs }, req);
            } catch (err) {
              return sendJson(res, 400, { success: false, error: err.message }, req);
            }
          }

          // POST /api/user/notifications/dismiss
          if (req.method === 'POST' && pathname === '/api/user/notifications/dismiss') {
            try {
              const { notifId } = await readBodyJson(req);
              if (!notifId) return sendJson(res, 400, { success: false, error: 'Notification ID is required.' }, req);
              const updatedNotifs = deleteNotificationOnServer(authUser.id, notifId);
              return sendJson(res, 200, { success: true, notifications: updatedNotifs }, req);
            } catch (err) {
              return sendJson(res, 400, { success: false, error: err.message }, req);
            }
          }

          // POST /api/user/notifications/clear-all
          if (req.method === 'POST' && pathname === '/api/user/notifications/clear-all') {
            try {
              const updatedNotifs = clearAllNotificationsOnServer(authUser.id);
              return sendJson(res, 200, { success: true, notifications: updatedNotifs }, req);
            } catch (err) {
              return sendJson(res, 400, { success: false, error: err.message }, req);
            }
          }

          // POST /api/user/notifications/test
          if (req.method === 'POST' && pathname === '/api/user/notifications/test') {
            try {
              const { type } = await readBodyJson(req);
              const testNotif = triggerTestNotification(authUser.id, type);
              return sendJson(res, 200, { success: true, notification: testNotif }, req);
            } catch (err) {
              return sendJson(res, 400, { success: false, error: err.message }, req);
            }
          }

          // -----------------------------------------------------------------
          // 2.1 AI PLACEMENT COACH ENDPOINTS
          // -----------------------------------------------------------------
          // POST /api/coach/analyze
          if (req.method === 'POST' && pathname === '/api/coach/analyze') {
            const rateCheck = checkRateLimit(req, 'AI');
            if (!rateCheck.allowed) {
              res.setHeader('Retry-After', String(rateCheck.retryAfterSeconds));
              return sendJson(res, 429, { success: false, error: 'Too many coach analysis requests. Please try again in a moment.' }, req);
            }

            try {
              const deterministicBaseline = analyzeUserPreparation(authUser.id);
              let finalAnalysis = deterministicBaseline;

              if (isGeminiConfigured() && deterministicBaseline.hasData) {
                const db = loadDb();
                finalAnalysis = await analyzeCoachWithAI({
                  user: authUser,
                  roadmap: db.roadmaps[authUser.id],
                  tasks: db.tasks[authUser.id] || [],
                  streak: db.streaks[authUser.id] || {},
                  applications: getUserApplicationsFromDb(authUser.id),
                  revisions: db.revisions[authUser.id] || [],
                  deterministicBaseline
                });
              }

              return sendJson(res, 200, { success: true, analysis: finalAnalysis }, req);
            } catch (err) {
              return sendJson(res, 500, { success: false, error: 'Failed to analyze preparation metrics.' }, req);
            }
          }

          // POST /api/coach/apply-recommendation
          if (req.method === 'POST' && pathname === '/api/coach/apply-recommendation') {
            const rateCheck = checkRateLimit(req, 'AI');
            if (!rateCheck.allowed) {
              res.setHeader('Retry-After', String(rateCheck.retryAfterSeconds));
              return sendJson(res, 429, { success: false, error: 'Too many requests. Please try again in a moment.' }, req);
            }

            try {
              const body = await readBodyJson(req);
              const result = applyCoachRecommendationOnServer(authUser.id, body);
              return sendJson(res, 200, { success: true, ...result }, req);
            } catch (err) {
              return sendJson(res, 400, { success: false, error: err.message }, req);
            }
          }

          // PUT /api/coach/preferences
          if (req.method === 'PUT' && pathname === '/api/coach/preferences') {
            try {
              const { coachPreferences } = await readBodyJson(req);
              const db = loadDb();
              if (!db.coachPreferences) db.coachPreferences = {};
              db.coachPreferences[authUser.id] = coachPreferences;
              saveDb(db);
              return sendJson(res, 200, { success: true, coachPreferences }, req);
            } catch (err) {
              return sendJson(res, 400, { success: false, error: err.message }, req);
            }
          }

          // -----------------------------------------------------------------
          // 2.2 AI MOCK INTERVIEW ENDPOINTS
          // -----------------------------------------------------------------
          // POST /api/interview/start
          if (req.method === 'POST' && pathname === '/api/interview/start') {
            const rateCheck = checkRateLimit(req, 'AI');
            if (!rateCheck.allowed) {
              res.setHeader('Retry-After', String(rateCheck.retryAfterSeconds));
              return sendJson(res, 429, { success: false, error: 'Too many interview requests. Please try again in a moment.' }, req);
            }

            try {
              const body = await readBodyJson(req);
              const db = loadDb();
              const userRoadmap = db.roadmaps?.[authUser.id];
              const roadmapTopics = userRoadmap?.phases?.flatMap((p) => p.topics?.map((t) => t.name) || []) || [];
              const coachData = db.coachAnalysis?.[authUser.id];
              const weakAreas = coachData?.weakestCategory ? [coachData.weakestCategory] : [];

              if (isGeminiConfigured()) {
                try {
                  const aiQuestions = await generateInterviewQuestionsWithAI({
                    targetRole: body.targetRole || authUser.targetRole || 'Software Engineer',
                    roadmapTopics,
                    difficulty: body.difficulty || 'Medium',
                    count: parseInt(body.questionCount || 5, 10),
                    weakAreas,
                    category: body.type || 'Technical'
                  });
                  if (Array.isArray(aiQuestions) && aiQuestions.length > 0) {
                    body.customQuestions = aiQuestions;
                  }
                } catch (aiErr) {
                  console.warn('[apiMiddleware] Gemini interview question generation failed, using question bank:', aiErr.message);
                }
              }

              const session = startInterviewSession(authUser.id, body);
              return sendJson(res, 200, { success: true, session }, req);
            } catch (err) {
              return sendJson(res, 400, { success: false, error: err.message }, req);
            }
          }

          // POST /api/interview/answer
          if (req.method === 'POST' && pathname === '/api/interview/answer') {
            const rateCheck = checkRateLimit(req, 'AI');
            if (!rateCheck.allowed) {
              res.setHeader('Retry-After', String(rateCheck.retryAfterSeconds));
              return sendJson(res, 429, { success: false, error: 'Too many requests. Please try again in a moment.' }, req);
            }

            try {
              const body = await readBodyJson(req);
              const { interviewId, questionIndex, answerText } = body;
              if (!interviewId || questionIndex === undefined) {
                return sendJson(res, 400, { success: false, error: 'Interview ID and question index are required.' }, req);
              }

              let customEvaluation = null;
              if (isGeminiConfigured() && answerText && answerText.trim().length > 0) {
                try {
                  const db = loadDb();
                  const activeSession = db.activeInterviews?.[authUser.id];
                  if (activeSession && activeSession.id === interviewId) {
                    const activeQ = activeSession.questions?.[questionIndex];
                    if (activeQ) {
                      customEvaluation = await evaluateInterviewAnswerWithAI({
                        question: activeQ.question,
                        expectedKeywords: activeQ.expectedKeywords || [],
                        idealAnswerOutline: activeQ.idealAnswerOutline || '',
                        userAnswer: answerText
                      });
                    }
                  }
                } catch (aiErr) {
                  console.warn('[apiMiddleware] Gemini interview evaluation failed, using rubric evaluator:', aiErr.message);
                }
              }

              const result = evaluateInterviewAnswerOnServer(authUser.id, interviewId, questionIndex, answerText, customEvaluation);
              return sendJson(res, 200, { success: true, ...result }, req);
            } catch (err) {
              return sendJson(res, 400, { success: false, error: err.message }, req);
            }
          }

          // POST /api/interview/complete
          if (req.method === 'POST' && pathname === '/api/interview/complete') {
            try {
              const body = await readBodyJson(req);
              const { interviewId } = body;
              if (!interviewId) return sendJson(res, 400, { success: false, error: 'Interview ID is required.' }, req);
              const result = completeInterviewSessionOnServer(authUser.id, interviewId);
              return sendJson(res, 200, { success: true, report: result }, req);
            } catch (err) {
              return sendJson(res, 400, { success: false, error: err.message }, req);
            }
          }

          // GET /api/interview/history
          if (req.method === 'GET' && pathname === '/api/interview/history') {
            try {
              const historyData = getInterviewHistoryOnServer(authUser.id);
              return sendJson(res, 200, { success: true, ...historyData }, req);
            } catch (err) {
              return sendJson(res, 500, { success: false, error: 'Failed to load interview history.' }, req);
            }
          }
        }

        // -------------------------------------------------------------------
        // 3. FOCUS MODE API (AUTHENTICATED & TIMESTAMPED)
        // -------------------------------------------------------------------
        if (pathname.startsWith('/api/focus/')) {
          const authUser = getAuthUserFromRequest(req);
          if (!authUser) {
            return sendJson(res, 401, { success: false, error: 'Your session has expired. Please log in again.' }, req);
          }

          // POST /api/focus/start
          if (req.method === 'POST' && pathname === '/api/focus/start') {
            try {
              const body = await readBodyJson(req);
              const session = startFocusSession(authUser.id, body);
              return sendJson(res, 200, { success: true, session }, req);
            } catch (err) {
              return sendJson(res, 400, { success: false, error: err.message }, req);
            }
          }

          // POST /api/focus/pause
          if (req.method === 'POST' && pathname === '/api/focus/pause') {
            try {
              const body = await readBodyJson(req);
              if (!body.sessionId) return sendJson(res, 400, { success: false, error: 'Session ID is required.' }, req);
              const session = pauseFocusSession(authUser.id, body.sessionId);
              return sendJson(res, 200, { success: true, session }, req);
            } catch (err) {
              return sendJson(res, 400, { success: false, error: err.message }, req);
            }
          }

          // POST /api/focus/resume
          if (req.method === 'POST' && pathname === '/api/focus/resume') {
            try {
              const body = await readBodyJson(req);
              if (!body.sessionId) return sendJson(res, 400, { success: false, error: 'Session ID is required.' }, req);
              const session = resumeFocusSession(authUser.id, body.sessionId);
              return sendJson(res, 200, { success: true, session }, req);
            } catch (err) {
              return sendJson(res, 400, { success: false, error: err.message }, req);
            }
          }

          // POST /api/focus/complete
          if (req.method === 'POST' && pathname === '/api/focus/complete') {
            try {
              const body = await readBodyJson(req);
              if (!body.sessionId) return sendJson(res, 400, { success: false, error: 'Session ID is required.' }, req);
              const result = completeFocusSession(authUser.id, body);
              return sendJson(res, 200, { success: true, ...result }, req);
            } catch (err) {
              return sendJson(res, 400, { success: false, error: err.message }, req);
            }
          }

          // POST /api/focus/abandon
          if (req.method === 'POST' && pathname === '/api/focus/abandon') {
            try {
              const body = await readBodyJson(req);
              if (!body.sessionId) return sendJson(res, 400, { success: false, error: 'Session ID is required.' }, req);
              const session = abandonFocusSession(authUser.id, body);
              return sendJson(res, 200, { success: true, session }, req);
            } catch (err) {
              return sendJson(res, 400, { success: false, error: err.message }, req);
            }
          }

          // GET /api/focus/active
          if (req.method === 'GET' && pathname === '/api/focus/active') {
            try {
              const session = getActiveFocusSession(authUser.id);
              return sendJson(res, 200, { success: true, session }, req);
            } catch (err) {
              return sendJson(res, 500, { success: false, error: 'Failed to retrieve active focus session.' }, req);
            }
          }

          // GET /api/focus/history
          if (req.method === 'GET' && pathname === '/api/focus/history') {
            try {
              const history = getFocusSessionsHistory(authUser.id);
              return sendJson(res, 200, { success: true, history }, req);
            } catch (err) {
              return sendJson(res, 500, { success: false, error: 'Failed to retrieve focus history.' }, req);
            }
          }

          // GET /api/focus/analytics
          if (req.method === 'GET' && pathname === '/api/focus/analytics') {
            try {
              const analytics = getFocusAnalytics(authUser.id);
              return sendJson(res, 200, { success: true, analytics }, req);
            } catch (err) {
              return sendJson(res, 500, { success: false, error: 'Failed to calculate focus analytics.' }, req);
            }
          }
        }

        // -------------------------------------------------------------------
        // 4. ADAPTIVE SMART REVISION ENGINE API
        // -------------------------------------------------------------------
        if (pathname.startsWith('/api/revision') || pathname.startsWith('/api/revisions')) {
          const authUser = getAuthUserFromRequest(req);
          if (!authUser) {
            return sendJson(res, 401, { success: false, error: 'Your session has expired. Please log in again.' }, req);
          }

          // GET /api/revisions/today or GET /api/revisions
          if (req.method === 'GET' && (pathname === '/api/revisions/today' || pathname === '/api/revisions')) {
            try {
              const data = getRevisionsForUser(authUser.id);
              return sendJson(res, 200, { success: true, ...data }, req);
            } catch (err) {
              return sendJson(res, 500, { success: false, error: 'Failed to retrieve revisions.' }, req);
            }
          }

          // GET /api/revisions/:topicId
          if (req.method === 'GET' && pathname.startsWith('/api/revisions/')) {
            try {
              const topicId = decodeURIComponent(pathname.split('/').pop());
              const { revisions } = getRevisionsForUser(authUser.id);
              const item = revisions.find((r) => r.id === topicId || r.topicId === topicId);
              if (!item) {
                return sendJson(res, 404, { success: false, error: 'Revision topic not found.' }, req);
              }
              return sendJson(res, 200, { success: true, revision: item }, req);
            } catch (err) {
              return sendJson(res, 500, { success: false, error: 'Failed to retrieve revision details.' }, req);
            }
          }

          // POST /api/revision/generate or POST /api/quiz/generate-task-quiz
          if (req.method === 'POST' && (pathname === '/api/revision/generate' || pathname === '/api/quiz/generate-task-quiz')) {
            const rateCheck = checkRateLimit(req, 'AI');
            if (!rateCheck.allowed) {
              res.setHeader('Retry-After', String(rateCheck.retryAfterSeconds));
              return sendJson(res, 429, { success: false, error: 'Too many question requests. Please try again in a moment.' }, req);
            }

            try {
              const body = await readBodyJson(req);
              const { topic, category, difficulty, taskTitle, taskDescription, roadmapPhase, roadmapTopic, taskCategory, learningObjectives, relevantMetadata } = body;
              let questions = null;

              const taskCtx = {
                taskTitle: taskTitle || topic || 'Core Curriculum Concept',
                taskDescription: taskDescription || '',
                roadmapPhase: roadmapPhase || '',
                roadmapTopic: roadmapTopic || topic || taskTitle || '',
                taskCategory: taskCategory || category || 'DSA',
                difficulty: difficulty || 'Medium',
                learningObjectives: learningObjectives || '',
                relevantMetadata: relevantMetadata || '',
                count: 5
              };

              if (isGeminiConfigured()) {
                try {
                  questions = await generateTaskRevisionQuiz(taskCtx);
                } catch (aiErr) {
                  console.warn('[apiMiddleware] Gemini task revision generation failed, falling back to grounded bank:', aiErr.message);
                }
              }

              if (!questions || questions.length === 0) {
                questions = generateRevisionQuestions(taskCtx, taskCtx.taskCategory, taskCtx.difficulty);
              }

              if (!questions || questions.length === 0) {
                return sendJson(res, 503, {
                  success: false,
                  retryable: true,
                  error: 'Quiz generation is currently unavailable for this task. Please retry.'
                }, req);
              }

              return sendJson(res, 200, { success: true, topic: taskCtx.roadmapTopic || taskCtx.taskTitle, questions }, req);
            } catch (err) {
              return sendJson(res, 400, { success: false, error: err.message }, req);
            }
          }

          // POST /api/revision/submit, POST /api/revision/complete, or POST /api/quiz/complete-task-quiz
          if (req.method === 'POST' && (pathname === '/api/revision/submit' || pathname === '/api/revision/complete' || pathname === '/api/quiz/complete-task-quiz')) {
            try {
              const body = await readBodyJson(req);
              let result;
              if (body.taskId || body.sessionId || body.taskContext) {
                result = recordTaskRevisionAndComplete(authUser.id, body);
              } else {
                result = submitRevisionAttempt(authUser.id, body);
              }
              return sendJson(res, 200, { success: true, ...result }, req);
            } catch (err) {
              return sendJson(res, 400, { success: false, error: err.message }, req);
            }
          }

          // POST /api/revision/reschedule
          if (req.method === 'POST' && pathname === '/api/revision/reschedule') {
            try {
              const body = await readBodyJson(req);
              const updated = rescheduleRevision(authUser.id, body);
              return sendJson(res, 200, { success: true, revision: updated }, req);
            } catch (err) {
              return sendJson(res, 400, { success: false, error: err.message }, req);
            }
          }
        }

        // -----------------------------------------------------------------
        // 5. PLACEMENT APPLICATION TRACKER ENDPOINTS
        // -----------------------------------------------------------------
        if (pathname.startsWith('/api/applications')) {
          const authUser = getAuthUserFromRequest(req);
          if (!authUser) {
            return sendJson(res, 401, { success: false, error: 'Your session has expired. Please log in again.' }, req);
          }

          // GET /api/applications
          if (req.method === 'GET' && pathname === '/api/applications') {
            try {
              const apps = getUserApplicationsFromDb(authUser.id);
              const metrics = calculateApplicationMetrics(apps);
              const upcomingEvents = getUpcomingApplicationEvents(apps);
              const recommendation = getPreparationRecommendation(apps);

              return sendJson(res, 200, {
                success: true,
                applications: apps,
                metrics,
                upcomingEvents,
                preparationRecommendation: recommendation
              }, req);
            } catch (err) {
              return sendJson(res, 500, { success: false, error: 'Failed to load applications.' }, req);
            }
          }

          // GET /api/applications/:id
          if (req.method === 'GET' && pathname.startsWith('/api/applications/') && !pathname.includes('/interviews')) {
            try {
              const appId = pathname.replace('/api/applications/', '').split('/')[0];
              const apps = getUserApplicationsFromDb(authUser.id);
              const app = apps.find((a) => a.id === appId);
              if (!app) return sendJson(res, 404, { success: false, error: 'Application not found' }, req);
              return sendJson(res, 200, { success: true, application: app }, req);
            } catch (err) {
              return sendJson(res, 400, { success: false, error: err.message }, req);
            }
          }

          // POST /api/applications
          if (req.method === 'POST' && pathname === '/api/applications') {
            try {
              const body = await readBodyJson(req);
              const validated = sanitizeAndValidateApplicationInput(body);
              const newApp = createApplicationInDb(authUser.id, validated);
              return sendJson(res, 201, { success: true, application: newApp }, req);
            } catch (err) {
              return sendJson(res, 400, { success: false, error: err.message }, req);
            }
          }

          // PATCH or PUT /api/applications/:id
          if ((req.method === 'PATCH' || req.method === 'PUT') && pathname.startsWith('/api/applications/') && !pathname.includes('/interviews')) {
            try {
              const appId = pathname.replace('/api/applications/', '').split('/')[0];
              const body = await readBodyJson(req);
              const validated = sanitizeAndValidateApplicationInput({ ...body, company: body.company || 'Company', role: body.role || 'Role' });
              const updated = updateApplicationInDb(authUser.id, appId, validated);
              if (!updated) return sendJson(res, 404, { success: false, error: 'Application not found' }, req);
              return sendJson(res, 200, { success: true, application: updated }, req);
            } catch (err) {
              return sendJson(res, 400, { success: false, error: err.message }, req);
            }
          }

          // DELETE /api/applications/:id
          if (req.method === 'DELETE' && pathname.startsWith('/api/applications/') && !pathname.includes('/interviews')) {
            try {
              const appId = pathname.replace('/api/applications/', '').split('/')[0];
              const deleted = deleteApplicationFromDb(authUser.id, appId);
              if (!deleted) return sendJson(res, 404, { success: false, error: 'Application not found' }, req);
              return sendJson(res, 200, { success: true, message: 'Application deleted.' }, req);
            } catch (err) {
              return sendJson(res, 400, { success: false, error: err.message }, req);
            }
          }

          // POST /api/applications/:id/interviews
          if (req.method === 'POST' && pathname.includes('/interviews') && pathname.startsWith('/api/applications/')) {
            try {
              const parts = pathname.replace('/api/applications/', '').split('/interviews')[0];
              const appId = parts;
              const body = await readBodyJson(req);
              const validated = sanitizeAndValidateInterviewInput(body);
              const result = addInterviewToAppInDb(authUser.id, appId, validated);
              if (!result) return sendJson(res, 404, { success: false, error: 'Application not found' }, req);
              return sendJson(res, 201, { success: true, ...result }, req);
            } catch (err) {
              return sendJson(res, 400, { success: false, error: err.message }, req);
            }
          }

          // PATCH or PUT /api/applications/:id/interviews/:interviewId
          if ((req.method === 'PATCH' || req.method === 'PUT') && pathname.includes('/interviews/') && pathname.startsWith('/api/applications/')) {
            try {
              const afterApps = pathname.replace('/api/applications/', '');
              const [appId, rest] = afterApps.split('/interviews/');
              const interviewId = rest;
              const body = await readBodyJson(req);
              const validated = sanitizeAndValidateInterviewInput(body);
              const result = updateInterviewInAppInDb(authUser.id, appId, interviewId, validated);
              if (!result) return sendJson(res, 404, { success: false, error: 'Interview stage not found' }, req);
              return sendJson(res, 200, { success: true, ...result }, req);
            } catch (err) {
              return sendJson(res, 400, { success: false, error: err.message }, req);
            }
          }

          // DELETE /api/applications/:id/interviews/:interviewId
          if (req.method === 'DELETE' && pathname.includes('/interviews/') && pathname.startsWith('/api/applications/')) {
            try {
              const afterApps = pathname.replace('/api/applications/', '');
              const [appId, rest] = afterApps.split('/interviews/');
              const interviewId = rest;
              const updatedApp = deleteInterviewFromAppInDb(authUser.id, appId, interviewId);
              if (!updatedApp) return sendJson(res, 404, { success: false, error: 'Interview stage not found' }, req);
              return sendJson(res, 200, { success: true, application: updatedApp }, req);
            } catch (err) {
              return sendJson(res, 400, { success: false, error: err.message }, req);
            }
          }
        }

        // -----------------------------------------------------------------
        // 6. PLACEMENT CALENDAR & SCHEDULE ENDPOINTS
        // -----------------------------------------------------------------
        if (pathname.startsWith('/api/calendar')) {
          const authUser = getAuthUserFromRequest(req);
          if (!authUser) {
            return sendJson(res, 401, { success: false, error: 'Your session has expired. Please log in again.' }, req);
          }

          // GET /api/calendar
          if (req.method === 'GET' && (pathname === '/api/calendar' || pathname === '/api/calendar/')) {
            try {
              const parsedUrl = new URL(`http://localhost${rawUrl}`);
              const start = parsedUrl.searchParams.get('start');
              const end = parsedUrl.searchParams.get('end');
              const selectedDate = parsedUrl.searchParams.get('date');

              const calendarData = getAggregatedCalendarEvents(authUser.id, start, end);
              const capacity = calculateDailyCapacity(authUser, calendarData.events, selectedDate);

              return sendJson(res, 200, {
                success: true,
                events: calendarData.events,
                conflicts: calendarData.conflicts,
                capacity,
                placementTarget: calendarData.placementTarget,
                todayKey: calendarData.todayKey
              }, req);
            } catch (err) {
              return sendJson(res, 500, { success: false, error: 'Failed to retrieve calendar events.' }, req);
            }
          }

          // POST /api/calendar/events
          if (req.method === 'POST' && pathname === '/api/calendar/events') {
            try {
              const body = await readBodyJson(req);
              const validated = sanitizeAndValidateCalendarEventInput(body);
              const newEvent = createPersonalEventInDb(authUser.id, validated);
              return sendJson(res, 201, { success: true, event: newEvent }, req);
            } catch (err) {
              return sendJson(res, 400, { success: false, error: err.message }, req);
            }
          }

          // PATCH or PUT /api/calendar/events/:id
          if ((req.method === 'PATCH' || req.method === 'PUT') && pathname.startsWith('/api/calendar/events/')) {
            try {
              const eventId = pathname.replace('/api/calendar/events/', '');
              const body = await readBodyJson(req);
              const validated = sanitizeAndValidateCalendarEventInput(body);
              const updated = updatePersonalEventInDb(authUser.id, eventId, validated);
              if (!updated) return sendJson(res, 404, { success: false, error: 'Personal event not found.' }, req);
              return sendJson(res, 200, { success: true, event: updated }, req);
            } catch (err) {
              return sendJson(res, 400, { success: false, error: err.message }, req);
            }
          }

          // DELETE /api/calendar/events/:id
          if (req.method === 'DELETE' && pathname.startsWith('/api/calendar/events/')) {
            try {
              const eventId = pathname.replace('/api/calendar/events/', '');
              const deleted = deletePersonalEventFromDb(authUser.id, eventId);
              if (!deleted) return sendJson(res, 404, { success: false, error: 'Personal event not found.' }, req);
              return sendJson(res, 200, { success: true, message: 'Event deleted.' }, req);
            } catch (err) {
              return sendJson(res, 400, { success: false, error: err.message }, req);
            }
          }
        }

        // -----------------------------------------------------------------
        // 7. BATCH OFFLINE SYNCHRONIZATION ENDPOINT
        // -----------------------------------------------------------------
        // POST /api/sync/batch
        if (pathname.startsWith('/api/sync')) {
          const authUser = getAuthUserFromRequest(req);
          if (!authUser) {
            return sendJson(res, 401, { success: false, error: 'Your session has expired. Please log in again.' }, req);
          }

          if (req.method === 'POST' && pathname === '/api/sync/batch') {
            const rateCheck = checkRateLimit(req, 'GENERAL');
            if (!rateCheck.allowed) {
              res.setHeader('Retry-After', String(rateCheck.retryAfterSeconds));
              return sendJson(res, 429, { success: false, error: 'Too many sync operations. Please retry shortly.' }, req);
            }

            try {
              const body = await readBodyJson(req);
              const operations = body.operations || [];
              const syncResult = processBatchSync(authUser.id, operations);
              return sendJson(res, 200, syncResult, req);
            } catch (err) {
              return sendJson(res, 500, { success: false, error: 'Batch synchronization failed.' }, req);
            }
          }
        }

        // -------------------------------------------------------------------
        // 8. ROADMAP DOCUMENT ANALYSIS & PLAN GENERATION (WITH DEFENSIVE GUARDS)
        // -------------------------------------------------------------------
        if (req.method === 'POST' && pathname.startsWith('/api/roadmap/analyze')) {
          const rateCheck = checkRateLimit(req, 'AI');
          if (!rateCheck.allowed) {
            res.setHeader('Retry-After', String(rateCheck.retryAfterSeconds));
            return sendJson(res, 429, { success: false, error: 'Too many roadmap analysis requests. Please try again in a moment.' }, req);
          }

          try {
            const chunks = [];
            let totalSize = 0;
            const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB limit

            for await (const chunk of req) {
              totalSize += chunk.length;
              if (totalSize > MAX_UPLOAD_BYTES) {
                return sendJson(res, 413, { success: false, error: 'File size exceeds maximum allowed limit of 10MB.' }, req);
              }
              chunks.push(chunk);
            }
            const buffer = Buffer.concat(chunks);

            const rawFileName = req.headers['x-file-name'] || 'placement-roadmap.pdf';
            const decodedFileName = decodeURIComponent(rawFileName);
            // Sanitize filename against path traversal
            const safeFileName = decodedFileName.replace(/^.*[\\/]/, '').replace(/[^a-zA-Z0-9._-]/g, '_');
            const targetRole = decodeURIComponent(req.headers['x-target-role'] || 'Software Engineer');

            // Validate file signature / magic bytes
            if (buffer.length > 0 && !validateFileSignature(buffer)) {
              return sendJson(res, 400, { 
                success: false, 
                error: 'Invalid file format. Please upload a genuine PDF, DOCX, or Image file.' 
              }, req);
            }

            console.log('[Roadmap Analyze Request Received]', {
              safeFileName,
              targetRole,
              bufferBytes: buffer.length,
              isPdfSignature: buffer.length >= 4 && buffer[0] === 0x25 && buffer[1] === 0x50
            });

            const extractedText = await extractTextFromBuffer(buffer, safeFileName);
            const sanitizedText = sanitizeExtractedText(extractedText);
            let extractedRoadmap = null;
            let parserUsed = 'deterministic';
            let fallbackUsed = false;

            if (isGeminiConfigured()) {
              try {
                extractedRoadmap = await parseRoadmapWithAI(sanitizedText, targetRole, safeFileName);
                if (extractedRoadmap) {
                  parserUsed = 'gemini';
                } else {
                  fallbackUsed = true;
                }
              } catch (aiErr) {
                console.warn('[apiMiddleware] Gemini roadmap parsing failed, using deterministic parser:', aiErr.message);
                fallbackUsed = true;
              }
            } else {
              fallbackUsed = true;
            }

            if (!extractedRoadmap) {
              extractedRoadmap = parseDocumentTextToRoadmap(extractedText, safeFileName, targetRole);
              parserUsed = 'deterministic';
            }

            const isDevOrTest = process.env.NODE_ENV !== 'production' || process.env.NOVARA_DEBUG_AI === 'true';
            if (isDevOrTest) {
              console.log('[Roadmap Pipeline Diagnostics]', {
                extractedTextLength: extractedText?.length || 0,
                sanitizedTextLength: sanitizedText?.length || 0,
                aiProvider: isGeminiConfigured() ? getAIProvider().name : 'none',
                aiModel: isGeminiConfigured() ? getAIProvider().getEffectiveModel() : 'none',
                parserUsed,
                fallbackUsed,
                returnedPhaseCount: extractedRoadmap.phases?.length || 0,
                returnedTopicCount: extractedRoadmap.phases?.reduce((acc, p) => acc + (p.topics?.length || 0), 0) || 0
              });
            }

            console.log('[Roadmap Analyze Extraction Outcome]', {
              parserUsed,
              fallbackUsed,
              phasesExtracted: extractedRoadmap.phases?.length || 0,
              totalTopics: extractedRoadmap.phases?.reduce((acc, p) => acc + (p.topics?.length || 0), 0) || 0,
              confidence: extractedRoadmap.confidence,
              needsReview: extractedRoadmap.needsReview
            });

            const validation = validateRoadmapSchema(extractedRoadmap);
            if (!validation.valid) {
              return sendJson(res, 422, {
                success: false,
                error: "We couldn't organize this roadmap correctly.",
                details: validation.error
              }, req);
            }

            return sendJson(res, 200, {
              success: true,
              roadmap: extractedRoadmap,
              confidence: extractedRoadmap.confidence || 'high',
              needsReview: !!extractedRoadmap.needsReview,
              reviewReason: extractedRoadmap.reviewReason || null,
              source: 'extracted_from_document',
              isDemo: false
            }, req);
          } catch (error) {
            console.error('[Roadmap Analyze Error]', error.message);
            return sendJson(res, 500, {
              success: false,
              error: "We couldn't read this roadmap clearly. Try uploading a clearer PDF or image.",
              details: error.message
            }, req);
          }
        }

        if (req.method === 'POST' && pathname.startsWith('/api/plan/generate')) {
          const rateCheck = checkRateLimit(req, 'AI');
          if (!rateCheck.allowed) {
            res.setHeader('Retry-After', String(rateCheck.retryAfterSeconds));
            return sendJson(res, 429, { success: false, error: 'Too many plan generation requests. Please try again in a moment.' }, req);
          }

          try {
            const body = await readBodyJson(req);
            const { roadmap, preferences } = body;

            if (!roadmap || !roadmap.phases) {
              return sendJson(res, 400, {
                success: false,
                error: 'Valid confirmed roadmap is required to generate a plan.'
              }, req);
            }

            const authUser = getAuthUserFromRequest(req);
            const db = loadDb();
            let planResult = null;

            if (isGeminiConfigured()) {
              try {
                planResult = await generateDailyPlanWithAI({
                  roadmap,
                  preferences,
                  pendingTasks: authUser ? (db.tasks[authUser.id] || []).filter(t => !t.completed) : [],
                  completedTasks: authUser ? (db.tasks[authUser.id] || []).filter(t => t.completed) : [],
                  revisions: authUser ? (db.revisions[authUser.id] || []) : []
                });
              } catch (aiErr) {
                console.warn('[apiMiddleware] Gemini plan generation failed, using deterministic generator:', aiErr.message);
              }
            }

            if (!planResult || !Array.isArray(planResult.tasks) || planResult.tasks.length === 0) {
              planResult = generateDailyPlanFromRoadmap(roadmap, preferences);
            }

            if (authUser) {
              const dailyStudyMins = Math.round((preferences?.dailyTargetHours || 3) * 60);
              updateUserProfile(authUser.id, {
                targetRole: preferences?.targetRole || authUser.targetRole || 'Software Engineer',
                dailyStudyMinutes: dailyStudyMins,
                placementTargetDate: preferences?.targetDate || authUser.placementTargetDate || '2026-11-20',
                currentPreparationLevel: preferences?.prepLevel || authUser.currentPreparationLevel || 'Intermediate',
                hasCompletedOnboarding: true
              });
              updateUserRoadmap(authUser.id, roadmap);
              saveUserDailyTasks(authUser.id, roadmap, planResult.tasks);
              evaluateUserNotifications(authUser.id);
            }

            return sendJson(res, 200, {
              success: true,
              tasks: planResult.tasks,
              totalScheduledMinutes: planResult.totalScheduledMinutes,
              dailyCapMinutes: planResult.dailyCapMinutes,
              roadmap: roadmap
            }, req);
          } catch (error) {
            console.error('[Plan Generate Error]', error.message);
            return sendJson(res, 500, {
              success: false,
              error: 'Failed to generate preparation plan.',
              details: error.message
            }, req);
          }
        }

        next();
}

export function roadmapApiPlugin() {
  return {
    name: 'novara-roadmap-api-plugin',
    configureServer(server) {
      server.middlewares.use(apiMiddlewareHandler);
    }
  };
}
