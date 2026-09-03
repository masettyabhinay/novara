import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  getStoredToken,
  signup as apiSignup,
  login as apiLogin,
  loginWithGoogle as apiLoginWithGoogle,
  logout as apiLogout
} from '../services/authService';
import {
  fetchCloudUserState,
  syncUserProfile,
  syncUserRoadmap,
  syncToggleTask,
  syncToggleSubtask,
  syncGenerateDailyTasks,
  generatePlanApi,
  syncCompleteRevision,
  syncMarkNotificationsRead,
  syncNotificationPreferences
} from '../services/syncService';
import {
  startFocusSessionApi,
  pauseFocusSessionApi,
  resumeFocusSessionApi,
  completeFocusSessionApi,
  abandonFocusSessionApi,
  getActiveFocusSessionApi,
  getFocusAnalyticsApi
} from '../services/focusService';
import {
  fetchRevisionsApi,
  generateRevisionQuestionsApi,
  generateTaskRevisionQuizApi,
  submitRevisionAttemptApi,
  completeTaskWithQuizApi,
  rescheduleRevisionApi
} from '../services/revisionService';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  showSystemNotification,
  markNotificationReadApi,
  dismissNotificationApi,
  clearAllNotificationsApi,
  triggerTestNotificationApi
} from '../services/notificationService';
import {
  fetchCoachAnalysis,
  applyCoachRecommendationApi,
  updateCoachPreferencesApi
} from '../services/coachService';
import {
  fetchApplicationsApi,
  fetchApplicationDetailsApi,
  createApplicationApi,
  updateApplicationApi,
  deleteApplicationApi,
  addInterviewStageApi,
  updateInterviewStageApi,
  deleteInterviewStageApi
} from '../services/applicationService';
import {
  fetchCalendarEventsApi,
  createPersonalEventApi,
  updatePersonalEventApi,
  deletePersonalEventApi
} from '../services/calendarService';
import {
  saveCachedUserData,
  getCachedUserData,
  clearCachedUserData,
  enqueueSyncOperation,
  getPendingSyncOperations
} from '../services/offlineStorage';
import {
  processSyncQueue,
  onSyncStateChange
} from '../services/syncManager';
import { SAMPLE_ROADMAPS, INITIAL_TODAY_TASKS, INITIAL_REVISION_QUEUE, INITIAL_NOTIFICATIONS, INITIAL_READINESS_METRICS } from '../data/mockData';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Auth & Cloud Sync States
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [browserPermission, setBrowserPermission] = useState(() => getNotificationPermission());

  // PWA Installation & Updates State
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandaloneApp, setIsStandaloneApp] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  });
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [swRegistration, setSwRegistration] = useState(null);

  // Active User Data State
  const [activeTab, setActiveTab] = useState('today'); // 'today' | 'roadmap' | 'coach' | 'revision' | 'progress' | 'profile'
  const [userProfile, setUserProfile] = useState({
    name: 'Student',
    email: 'student@novara.dev',
    targetRole: 'Software Engineer',
    dailyTargetHours: 3,
    targetDate: '2026-11-20',
    currentPreparationLevel: 'Intermediate',
    minTasksForStreak: 2,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    avatar: 'ST'
  });
  const [activeRoadmap, setActiveRoadmap] = useState(null);
  const [todayTasks, setTodayTasks] = useState([]);
  const [streakData, setStreakData] = useState({
    currentStreak: 0,
    longestStreak: 0,
    todayTargetMet: false,
    weeklyHistory: []
  });
  const [revisionQueue, setRevisionQueue] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [notifPreferences, setNotifPreferences] = useState({
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
  });
  const [readinessMetrics, setReadinessMetrics] = useState(INITIAL_READINESS_METRICS);
  const [lastPlanAdjustment, setLastPlanAdjustment] = useState(null);

  // AI Placement Coach State
  const [coachAnalysis, setCoachAnalysis] = useState(null);
  const [isCoachLoading, setIsCoachLoading] = useState(false);
  const [coachPreferences, setCoachPreferences] = useState({
    coachInsights: true,
    weeklyCoachReport: true
  });

  // Focus Mode State & Analytics
  const [activeFocusTask, setActiveFocusTask] = useState(null);
  const [activeFocusSession, setActiveFocusSession] = useState(null);
  const [isFocusModalOpen, setIsFocusModalOpen] = useState(false);
  const [focusAnalytics, setFocusAnalytics] = useState({
    todayStudyMinutes: 0,
    weekStudyMinutes: 0,
    averageDailyStudyMinutes: 0,
    plannedHours: 3.0,
    actualHours: 0,
    completionRate: 0,
    totalCompletedSessions: 0
  });

  // Adaptive Smart Revision State
  const [revisionMetrics, setRevisionMetrics] = useState({
    dueTodayCount: 0,
    overdueCount: 0,
    strongCount: 0,
    needsReviewCount: 0,
    averageRetention: 80
  });
  const [activeRevisionSession, setActiveRevisionSession] = useState(null);
  const [isRevisionModeOpen, setIsRevisionModeOpen] = useState(false);
  const [selectedTopicDetail, setSelectedTopicDetail] = useState(null);
  const [isTopicDetailOpen, setIsTopicDetailOpen] = useState(false);

  // Placement Application Tracker State
  const [applications, setApplications] = useState([]);
  const [applicationMetrics, setApplicationMetrics] = useState({
    totalApplications: 0,
    appliedCount: 0,
    savedCount: 0,
    inProcessCount: 0,
    oaCount: 0,
    interviewCount: 0,
    offerCount: 0,
    rejectedCount: 0,
    withdrawnCount: 0,
    funnel: {
      appliedToAssessmentRate: 0,
      assessmentToInterviewRate: 0,
      interviewToOfferRate: 0
    }
  });
  const [upcomingAppEvents, setUpcomingAppEvents] = useState([]);
  const [appPrepRecommendation, setAppPrepRecommendation] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [isAddAppModalOpen, setIsAddAppModalOpen] = useState(false);
  const [isAppDetailsModalOpen, setIsAppDetailsModalOpen] = useState(false);
  const [isAddInterviewModalOpen, setIsAddInterviewModalOpen] = useState(false);

  // Placement Calendar & Schedule State
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [calendarConflicts, setCalendarConflicts] = useState([]);
  const [calendarCapacity, setCalendarCapacity] = useState({
    dailyTargetMinutes: 180,
    plannedMinutes: 0,
    remainingMinutes: 180,
    isCapacityExceeded: false,
    capacityText: '',
    targetHoursText: '3h',
    plannedHoursText: '0h 0m'
  });
  const [calendarTarget, setCalendarTarget] = useState(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [selectedCalendarEvent, setSelectedCalendarEvent] = useState(null);

  // Sync Reliability & Offline Queue State
  const [syncStatus, setSyncStatus] = useState('synced'); // 'synced' | 'syncing' | 'offline' | 'pending_changes' | 'error'
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState(() => new Date().toISOString());

  // Modals & Drawers
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAnalyzingRoadmap, setIsAnalyzingRoadmap] = useState(false);
  const [activeRevisionItem, setActiveRevisionItem] = useState(null);
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);
  const [isAdaptiveModalOpen, setIsAdaptiveModalOpen] = useState(false);
  const [toastMessages, setToastMessages] = useState([]);

  // Toast Helper
  const showToast = useCallback((title, message, type = 'terracotta') => {
    const id = Date.now() + Math.random();
    setToastMessages((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToastMessages((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  // Trigger celebratory confetti
  const triggerConfetti = useCallback(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.65 },
        colors: ['#C85A32', '#D9822B', '#5E8C71', '#1C211F', '#FAF7F2']
      });
    } catch (e) {}
  }, []);

  // Request browser notification permission
  const handleRequestBrowserPermission = async () => {
    const perm = await requestNotificationPermission();
    setBrowserPermission(perm);
    if (perm === 'granted') {
      showToast('Notifications Enabled 🔔', 'You will receive timely smart reminders.', 'sage');
      showSystemNotification('Notifications Enabled ✨', {
        body: 'NOVARA is ready to keep your placement preparation on track!'
      });
    } else if (perm === 'denied') {
      showToast('Notifications Blocked ⚠️', 'Enable notifications in your browser settings to receive alerts.', 'terracotta');
    }
    return perm;
  };

  // -------------------------------------------------------------------------
  // HYDRATE STATE FROM CLOUD / CACHE
  // -------------------------------------------------------------------------
  const hydrateFromCloud = useCallback(async (token) => {
    try {
      setIsAuthLoading(true);

      // Attempt to load from cloud
      const cloudData = await fetchCloudUserState(token);
      if (cloudData) {
        setCurrentUser(cloudData.profile);
        setUserProfile(cloudData.profile);
        setActiveRoadmap(cloudData.roadmap);
        setTodayTasks(cloudData.tasks || []);
        setStreakData(cloudData.streak || { currentStreak: 0, longestStreak: 0, todayTargetMet: false, weeklyHistory: [] });
        setRevisionQueue(cloudData.revisionQueue || []);
        if (cloudData.applications) setApplications(cloudData.applications);
        if (cloudData.applicationMetrics) setApplicationMetrics(cloudData.applicationMetrics);
        setNotifications(cloudData.notifications || []);
        setNotifPreferences(cloudData.notifPreferences || {});
        if (cloudData.readiness) setReadinessMetrics(cloudData.readiness);

        // Fetch Applications, Calendar & Initial Coach Analysis
        let fetchedApps = cloudData.applications || [];
        let fetchedEvents = [];

        try {
          const appsData = await fetchApplicationsApi();
          if (appsData && appsData.success) {
            fetchedApps = appsData.applications || [];
            setApplications(fetchedApps);
            if (appsData.metrics) setApplicationMetrics(appsData.metrics);
            if (appsData.upcomingEvents) setUpcomingAppEvents(appsData.upcomingEvents);
            if (appsData.preparationRecommendation) setAppPrepRecommendation(appsData.preparationRecommendation);
          }
        } catch (e) {}

        try {
          const calData = await fetchCalendarEventsApi();
          if (calData && calData.success) {
            fetchedEvents = calData.events || [];
            setCalendarEvents(fetchedEvents);
            if (calData.conflicts) setCalendarConflicts(calData.conflicts);
            if (calData.capacity) setCalendarCapacity(calData.capacity);
            if (calData.placementTarget) setCalendarTarget(calData.placementTarget);
          }
        } catch (e) {}

        try {
          const coachData = await fetchCoachAnalysis();
          if (coachData) setCoachAnalysis(coachData);
        } catch (e) {}

        // Cache sanitized data to IndexedDB for offline access
        saveCachedUserData(cloudData.profile.id, {
          profile: cloudData.profile,
          roadmap: cloudData.roadmap,
          tasks: cloudData.tasks || [],
          streak: cloudData.streak,
          revisions: cloudData.revisionQueue || [],
          applications: fetchedApps,
          calendarEvents: fetchedEvents,
          notifications: cloudData.notifications || [],
          notifPreferences: cloudData.notifPreferences || {},
          readiness: cloudData.readiness
        });

        // Drain any pending offline sync queue
        processSyncQueue(cloudData.profile.id);

        setSyncStatus('synced');
        setLastSyncedAt(new Date().toISOString());

        if (!cloudData.profile.hasCompletedOnboarding && !cloudData.roadmap) {
          setIsOnboardingOpen(true);
        }
      } else {
        // No valid session
        setCurrentUser(null);
        setIsAuthModalOpen(true);
      }
    } catch (err) {
      console.warn('[Cloud Sync Error]', err.message);
      if (err.message === 'UNAUTHORIZED') {
        setCurrentUser(null);
        setIsAuthModalOpen(true);
      } else {
        // Network error / offline - attempt to load from local cache
        setSyncStatus('offline');
      }
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  // -------------------------------------------------------------------------
  // MANUAL SYNC TRIGGER
  // -------------------------------------------------------------------------
  const triggerManualSync = useCallback(async () => {
    if (!currentUser) return;
    setSyncStatus('syncing');
    try {
      await processSyncQueue(currentUser.id);
      const token = getStoredToken();
      if (token) await hydrateFromCloud(token);
      setSyncStatus('synced');
      setLastSyncedAt(new Date().toISOString());
      setPendingSyncCount(0);
      showToast('Synced with Cloud ✓', 'Your placement data is completely up to date.', 'sage');
    } catch (e) {
      setSyncStatus('error');
      showToast('Sync Failed', 'Could not reach cloud servers. Changes safely queued.', 'terracotta');
    }
  }, [currentUser, hydrateFromCloud, showToast]);

  // Initial mount: check session token and connect online/offline listeners
  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      hydrateFromCloud(token);
    } else {
      setIsAuthLoading(false);
      setIsAuthModalOpen(true);
    }

    const handleOnline = () => {
      setIsOffline(false);
      setSyncStatus('syncing');
      showToast('Back Online 🟢', 'Synchronizing with your cloud account...', 'sage');
      const curToken = getStoredToken();
      if (curToken) {
        hydrateFromCloud(curToken);
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
      setSyncStatus('offline');
      showToast("You're offline ⚠️", "Changes will sync when you're back online.", 'terracotta');
    };

    const unsubscribeSync = onSyncStateChange((state) => {
      if (state.status) setSyncStatus(state.status);
      if (typeof state.pendingCount === 'number') setPendingSyncCount(state.pendingCount);
      if (state.lastSyncedAt) setLastSyncedAt(state.lastSyncedAt);
    });

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribeSync();
    };
  }, [hydrateFromCloud, showToast]);

  // -------------------------------------------------------------------------
  // CROSS-DEVICE REAL-TIME POLLING & WINDOW FOCUS REFRESH
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!currentUser) return;

    // Background sync on window focus / visibility change
    const onWindowFocus = () => {
      const token = getStoredToken();
      if (token && !isOffline) {
        processSyncQueue(currentUser.id);
        fetchCloudUserState().then((cloudData) => {
          if (cloudData) {
            setUserProfile(cloudData.profile);
            setActiveRoadmap(cloudData.roadmap);
            setTodayTasks(cloudData.tasks || []);
            setStreakData(cloudData.streak);
            setRevisionQueue(cloudData.revisionQueue || []);
            setNotifications(cloudData.notifications || []);
          }
        }).catch(() => {});
      }
    };

    window.addEventListener('focus', onWindowFocus);
    document.addEventListener('visibilitychange', onWindowFocus);

    // Periodic sync interval (every 10 seconds)
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && !isOffline) {
        onWindowFocus();
      }
    }, 10000);

    return () => {
      window.removeEventListener('focus', onWindowFocus);
      document.removeEventListener('visibilitychange', onWindowFocus);
      clearInterval(interval);
    };
  }, [currentUser, isOffline]);

  // -------------------------------------------------------------------------
  // PWA INSTALLATION, UPDATES & ANDROID GESTURE / BACK NAVIGATION
  // -------------------------------------------------------------------------
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstallable(false);
      setDeferredInstallPrompt(null);
      setIsStandaloneApp(true);
      showToast('NOVARA Installed 🎉', 'NOVARA is now installed on your home screen!', 'sage');
    };

    const handleUpdateAvailable = (e) => {
      setSwRegistration(e.detail);
      // If focus mode isn't actively running, show update banner
      if (!isFocusModalOpen) {
        setIsUpdateAvailable(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('novara-update-available', handleUpdateAvailable);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('novara-update-available', handleUpdateAvailable);
    };
  }, [isFocusModalOpen, showToast]);

  const handleInstallApp = async () => {
    if (!deferredInstallPrompt) return;
    try {
      deferredInstallPrompt.prompt();
      const { outcome } = await deferredInstallPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstallable(false);
        setDeferredInstallPrompt(null);
      }
    } catch (e) {
      console.warn('[PWA Install Error]', e);
    }
  };

  const applyAppUpdate = () => {
    if (swRegistration && swRegistration.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload();
  };

  // Android Back Button / Gesture Navigation Handling
  useEffect(() => {
    const handlePopState = () => {
      // 1. Close open modal if one is active instead of exiting the entire application
      if (isFocusModalOpen) {
        setIsFocusModalOpen(false);
        return;
      }
      if (isRevisionModeOpen) {
        setIsRevisionModeOpen(false);
        return;
      }
      if (isTopicDetailOpen) {
        setIsTopicDetailOpen(false);
        return;
      }
      if (isAddInterviewModalOpen) {
        setIsAddInterviewModalOpen(false);
        return;
      }
      if (isAppDetailsModalOpen) {
        setIsAppDetailsModalOpen(false);
        return;
      }
      if (isAddAppModalOpen) {
        setIsAddAppModalOpen(false);
        return;
      }
      if (isAddEventModalOpen) {
        setIsAddEventModalOpen(false);
        return;
      }
      if (isUploadModalOpen) {
        setIsUploadModalOpen(false);
        return;
      }
      if (isNotifDrawerOpen) {
        setIsNotifDrawerOpen(false);
        return;
      }
      if (isAdaptiveModalOpen) {
        setIsAdaptiveModalOpen(false);
        return;
      }
      if (isAuthModalOpen) {
        setIsAuthModalOpen(false);
        return;
      }

      // 2. Return to Today's Mission from any sub-view
      if (activeTab !== 'today') {
        setActiveTab('today');
        return;
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [
    isFocusModalOpen,
    isRevisionModeOpen,
    isTopicDetailOpen,
    isAddInterviewModalOpen,
    isAppDetailsModalOpen,
    isAddAppModalOpen,
    isAddEventModalOpen,
    isUploadModalOpen,
    isNotifDrawerOpen,
    isAdaptiveModalOpen,
    isAuthModalOpen,
    activeTab
  ]);

  // -------------------------------------------------------------------------
  // AUTHENTICATION HANDLERS
  // -------------------------------------------------------------------------
  const handleLogin = async (email, password) => {
    try {
      const res = await apiLogin({ email, password });
      if (res.success) {
        await hydrateFromCloud(res.token);
        setIsAuthModalOpen(false);
        showToast('Welcome back! 👋', `Logged in as ${res.user.name}`);
        return { success: true, user: res.user };
      }
      return { success: false, error: 'Login failed' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const handleSignup = async (payload) => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      const res = await apiSignup({ ...payload, timezone: tz });
      if (res.success) {
        await hydrateFromCloud(res.token);
        setIsAuthModalOpen(false);
        setIsOnboardingOpen(true);
        showToast('Account Created! 🚀', 'Welcome to NOVARA. Let’s build your roadmap.');
        return { success: true, user: res.user };
      }
      return { success: false, error: 'Signup failed' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const handleGoogleLogin = async (googlePayload) => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      const res = await apiLoginWithGoogle({ ...googlePayload, timezone: tz });
      if (res.success) {
        await hydrateFromCloud(res.token);
        setIsAuthModalOpen(false);
        if (!res.user.hasCompletedOnboarding) {
          setIsOnboardingOpen(true);
        } else {
          setActiveTab('today');
        }
        showToast('Signed in with Google ✨', `Welcome, ${res.user.name}`);
        return { success: true, user: res.user };
      }
      return { success: false, error: 'Google sign in failed' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const handleLogout = async () => {
    const prevUserId = currentUser?.id;
    try {
      await apiLogout();
    } catch (e) {}
    if (prevUserId) {
      await clearCachedUserData(prevUserId);
    }
    setCurrentUser(null);
    setUserProfile({
      name: 'Student',
      email: 'student@novara.dev',
      targetRole: 'Software Engineer',
      dailyTargetHours: 3,
      targetDate: '2026-11-20',
      currentPreparationLevel: 'Intermediate',
      minTasksForStreak: 2,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      avatar: 'ST'
    });
    setActiveRoadmap(null);
    setTodayTasks([]);
    setStreakData({ currentStreak: 0, longestStreak: 0, todayTargetMet: false, weeklyHistory: [] });
    setRevisionQueue([]);
    setApplications([]);
    setUpcomingAppEvents([]);
    setAppPrepRecommendation(null);
    setSelectedApplication(null);
    setCalendarEvents([]);
    setCalendarConflicts([]);
    setActiveFocusTask(null);
    setActiveFocusSession(null);
    setNotifications([]);
    setCoachAnalysis(null);
    setReadinessMetrics(INITIAL_READINESS_METRICS);
    setIsAuthModalOpen(true);
    showToast('Logged Out', 'You have been safely signed out.', 'terracotta');
  };

  // -------------------------------------------------------------------------
  // USER PROFILE UPDATES (CLOUD SYNCHRONIZED)
  // -------------------------------------------------------------------------
  const updateProfile = async (updates) => {
    setUserProfile((prev) => {
      const resolved = typeof updates === 'function' ? updates(prev) : updates;
      return { ...prev, ...resolved };
    });
    try {
      const payload = typeof updates === 'function' ? updates(userProfile) : updates;
      const updated = await syncUserProfile(payload);
      if (updated) setUserProfile(updated);
      refreshCoachAnalysis(false).catch(() => {});
    } catch (e) {
      console.warn('[Sync Error]', e);
    }
  };

  // -------------------------------------------------------------------------
  // TASK TOGGLE & STREAK MANAGEMENT (CLOUD SYNCHRONIZED)
  // -------------------------------------------------------------------------
  const toggleTaskCompletion = async (taskId) => {
    // Optimistic UI Update
    setTodayTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const nextState = !t.completed;
          if (nextState) {
            triggerConfetti();
            showToast('Task Completed! 🚀', `"${t.name}" marked complete.`);
          }
          return {
            ...t,
            completed: nextState,
            subtasks: t.subtasks ? t.subtasks.map((st) => ({ ...st, done: nextState })) : []
          };
        }
        return t;
      })
    );

    if (isOffline || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      if (currentUser?.id) {
        enqueueSyncOperation({
          userId: currentUser.id,
          entityType: 'TASK',
          entityId: taskId,
          operation: 'COMPLETE',
          payload: { completed: true, completedAt: new Date().toISOString() }
        });
        setPendingSyncCount((prev) => prev + 1);
        setSyncStatus('pending_changes');
      }
      return;
    }

    // Sync to Server
    try {
      const result = await syncToggleTask(taskId);
      if (result.tasks) setTodayTasks(result.tasks);
      if (result.streak) setStreakData(result.streak);
      // Background update coach insights
      fetchCoachAnalysis().then((d) => setCoachAnalysis(d)).catch(() => {});
    } catch (err) {
      console.warn('[Task Toggle Sync Error]', err.message);
      if (currentUser?.id) {
        enqueueSyncOperation({
          userId: currentUser.id,
          entityType: 'TASK',
          entityId: taskId,
          operation: 'COMPLETE',
          payload: { completed: true, completedAt: new Date().toISOString() }
        });
        setPendingSyncCount((prev) => prev + 1);
        setSyncStatus('pending_changes');
      }
    }
  };

  const toggleSubtask = async (taskId, subtaskId) => {
    setTodayTasks((prev) =>
      prev.map((task) => {
        if (task.id === taskId) {
          const updatedSubtasks = (task.subtasks || []).map((st) =>
            st.id === subtaskId ? { ...st, done: !st.done } : st
          );
          const allDone = updatedSubtasks.length > 0 && updatedSubtasks.every((st) => st.done);
          return {
            ...task,
            subtasks: updatedSubtasks,
            completed: allDone
          };
        }
        return task;
      })
    );

    try {
      const updatedTasks = await syncToggleSubtask(taskId, subtaskId);
      if (updatedTasks) setTodayTasks(updatedTasks);
    } catch (err) {
      console.warn('[Subtask Sync Error]', err.message);
    }
  };

  // -------------------------------------------------------------------------
  // ROADMAP UPDATES & PLAN GENERATION (CLOUD SYNCHRONIZED)
  // -------------------------------------------------------------------------
  const updateRoadmapTopicStatus = async (phaseId, topicId, nextStatus = 'completed') => {
    if (!activeRoadmap?.phases) return;

    const updatedPhases = activeRoadmap.phases.map((p) => {
      if (p.id === phaseId) {
        const updatedTopics = p.topics.map((t) =>
          t.id === topicId ? { ...t, status: nextStatus } : t
        );
        const completedCount = updatedTopics.filter((t) => t.status === 'completed').length;
        const phaseProgress = updatedTopics.length > 0 ? Math.round((completedCount / updatedTopics.length) * 100) : 0;
        return {
          ...p,
          topics: updatedTopics,
          progress: phaseProgress,
          status: phaseProgress === 100 ? 'completed' : phaseProgress > 0 ? 'in_progress' : 'upcoming'
        };
      }
      return p;
    });

    const totalTopicsCount = updatedPhases.reduce((acc, p) => acc + p.topics.length, 0);
    const totalDone = updatedPhases.reduce((acc, p) => acc + p.topics.filter((t) => t.status === 'completed').length, 0);
    const overall = totalTopicsCount > 0 ? Math.round((totalDone / totalTopicsCount) * 100) : 0;

    const finalRoadmap = {
      ...activeRoadmap,
      phases: updatedPhases,
      overallProgress: overall
    };

    setActiveRoadmap(finalRoadmap);

    try {
      await syncUserRoadmap(finalRoadmap);
      refreshCoachAnalysis(false).catch(() => {});
    } catch (e) {
      console.warn('[Roadmap Sync Error]', e);
    }
  };

  const updateFullRoadmap = async (updatedRoadmap) => {
    if (!updatedRoadmap) return;
    setActiveRoadmap(updatedRoadmap);

    try {
      await syncUserRoadmap(updatedRoadmap);
      refreshCoachAnalysis(false).catch(() => {});
    } catch (e) {
      console.warn('[Full Roadmap Sync Error]', e);
    }
  };

  const generateDailyTasksFromRoadmap = async (roadmap, preferences = {}) => {
    if (!roadmap || !roadmap.phases) {
      throw new Error('No roadmap selected. Please choose a roadmap before continuing.');
    }

    const role = preferences.targetRole || userProfile.targetRole || 'Software Engineer';
    const hours = preferences.dailyTargetHours || userProfile.dailyTargetHours || 3;
    const date = preferences.targetDate || userProfile.targetDate || '2026-11-20';
    const prepLevel = preferences.prepLevel || userProfile.prepLevel || 'Intermediate';

    try {
      // 1. Generate plan via POST /api/plan/generate
      const planResult = await generatePlanApi(roadmap, {
        targetRole: role,
        dailyTargetHours: hours,
        targetDate: date,
        prepLevel: prepLevel
      });

      if (!planResult || !planResult.tasks || planResult.tasks.length === 0) {
        throw new Error("Couldn't create your daily plan. No tasks returned.");
      }

      const generated = planResult.tasks;

      // 2. Set active tasks & roadmap locally
      setTodayTasks(generated);
      setActiveRoadmap(roadmap);
      setUserProfile((prev) => ({
        ...prev,
        targetRole: role,
        dailyTargetHours: hours,
        targetDate: date,
        prepLevel: prepLevel,
        hasCompletedOnboarding: true
      }));

      // 3. Sync profile and roadmap to backend
      try {
        await syncUserProfile({
          targetRole: role,
          dailyTargetHours: hours,
          targetDate: date,
          prepLevel: prepLevel,
          hasCompletedOnboarding: true
        });
        await syncUserRoadmap(roadmap);
      } catch (e) {
        console.warn('[Sync Plan Error]', e);
      }

      // 4. Close Onboarding / Upload Modals & Navigate to Today
      setIsOnboardingOpen(false);
      setIsUploadModalOpen(false);
      setActiveTab('today');

      // 5. Celebration & Notification
      triggerConfetti();
      showToast('Plan Generated! 🎯', 'Your daily mission is ready on your dashboard.', 'terracotta');
      showSystemNotification('Your placement mission is ready 🎯', {
        body: `${generated.length} tasks scheduled • ${hours}h target for today.`
      });

      // 6. Refresh Coach in background non-blockingly without toast
      setTimeout(() => {
        refreshCoachAnalysis(false).catch(() => {});
      }, 500);

      return generated;
    } catch (e) {
      console.error('[Plan Generation Error]', e);
      throw e;
    }
  };

  // -------------------------------------------------------------------------
  // AI PLACEMENT COACH ACTIONS
  // -------------------------------------------------------------------------
  const refreshCoachAnalysis = async (showNotification = false) => {
    setIsCoachLoading(true);
    try {
      const analysis = await fetchCoachAnalysis();
      if (analysis) {
        setCoachAnalysis(analysis);
        if (showNotification) {
          showToast('Coach Analysis Updated ✨', `Placement readiness evaluated at ${analysis.readinessPercent}%.`, 'sage');
        }
      }
    } catch (e) {
      console.warn('[Coach Analysis Error]', e);
    } finally {
      setIsCoachLoading(false);
    }
  };

  const applyCoachRecommendation = async (recommendation) => {
    try {
      const result = await applyCoachRecommendationApi(recommendation);
      if (result.tasks) {
        setTodayTasks(result.tasks);
        triggerConfetti();
        showToast('Plan Adjusted ✨', result.summary || 'Study schedule redistributed.', 'sage');
        refreshCoachAnalysis();
      }
    } catch (e) {
      showToast('Adjustment Failed', e.message || 'Could not apply recommendation.', 'terracotta');
    }
  };

  const updateCoachPreferences = async (prefs) => {
    setCoachPreferences((prev) => ({ ...prev, ...prefs }));
    try {
      await updateCoachPreferencesApi(prefs);
    } catch (e) {}
  };

  // -------------------------------------------------------------------------
  // ADAPTIVE SMART REVISION ENGINE ACTIONS
  // -------------------------------------------------------------------------
  const refreshRevisions = useCallback(async () => {
    try {
      const data = await fetchRevisionsApi();
      if (data && data.revisions) {
        setRevisionQueue(data.revisions);
        if (data.metrics) setRevisionMetrics(data.metrics);
      }
    } catch (e) {
      console.warn('[Revision Refresh Error]', e);
    }
  }, []);

  const startAdaptiveRevision = async (item) => {
    try {
      showToast('Preparing Revision Mode 🧠', `Loading recall session for ${item.topic}...`, 'sage');
      const questions = await generateRevisionQuestionsApi({
        topic: item.topic,
        roadmapTopic: item.topic,
        taskCategory: item.category,
        difficulty: item.difficulty || 'Medium'
      });

      setActiveRevisionSession({
        revisionId: item.id,
        topicId: item.topicId,
        topic: item.topic,
        category: item.category,
        difficulty: item.difficulty,
        retentionScore: item.retentionScore || 68,
        questions: questions,
        currentQuestionIndex: 0,
        userAnswers: [],
        startedAt: Date.now()
      });
      setIsRevisionModeOpen(true);
      setIsTopicDetailOpen(false);
    } catch (e) {
      console.warn('[Start Adaptive Revision Error]', e);
      showToast('Error', 'Could not initialize revision questions.', 'terracotta');
    }
  };

  const startTaskRevisionQuiz = async (task, focusSession = null) => {
    if (!task) return;
    try {
      showToast('Generating Knowledge Check 🧠', `Generating quiz for ${task.name || task.title || 'task'}...`, 'sage');
      
      let phaseName = '';
      let topicName = task.name || task.title || task.topic || 'Core Concept';
      if (activeRoadmap?.phases) {
        for (const p of activeRoadmap.phases) {
          const matchTopic = (p.topics || []).find((t) => t.id === task.topicId || t.name === task.name);
          if (matchTopic) {
            phaseName = p.title;
            topicName = matchTopic.name;
            break;
          }
        }
      }

      const taskContext = {
        taskId: task.id,
        sessionId: focusSession?.sessionId || activeFocusSession?.sessionId || null,
        taskTitle: task.name || task.title || topicName,
        taskDescription: task.description || '',
        roadmapPhase: phaseName || task.phase || '',
        roadmapTopic: topicName,
        taskCategory: task.category || 'DSA',
        difficulty: task.difficulty || 'Medium',
        learningObjectives: Array.isArray(task.subtasks) ? task.subtasks.map((s) => s.name).join(', ') : '',
        count: 5
      };

      const questions = await generateTaskRevisionQuizApi(taskContext);

      setActiveRevisionSession({
        revisionId: task.revisionId || null,
        taskId: task.id,
        sessionId: taskContext.sessionId,
        taskContext,
        topicId: task.topicId || task.id,
        topic: topicName,
        category: task.category || 'DSA',
        difficulty: task.difficulty || 'Medium',
        retentionScore: 68,
        questions: questions,
        currentQuestionIndex: 0,
        userAnswers: [],
        startedAt: Date.now()
      });

      setIsFocusModalOpen(false);
      setIsRevisionModeOpen(true);
      setIsTopicDetailOpen(false);
    } catch (e) {
      console.warn('[Start Task Revision Quiz Error]', e);
      showToast('Notice', 'Could not generate quiz. Please retry.', 'terracotta');
    }
  };

  const submitAdaptiveRevision = async (answers, durationMinutes) => {
    if (!activeRevisionSession) return null;
    try {
      const result = await completeTaskWithQuizApi({
        revisionId: activeRevisionSession.revisionId,
        taskId: activeRevisionSession.taskId,
        sessionId: activeRevisionSession.sessionId,
        taskContext: activeRevisionSession.taskContext,
        answers,
        durationMinutes
      });

      if (result.revision) {
        setRevisionQueue((prev) => {
          const exists = prev.some((r) => r.id === result.revision.id);
          if (exists) {
            return prev.map((r) => (r.id === result.revision.id ? result.revision : r));
          }
          return [result.revision, ...prev];
        });
      }

      if (result.tasks) {
        setTodayTasks(result.tasks);
      } else if (activeRevisionSession.taskId) {
        setTodayTasks((prev) => prev.map((t) => (t.id === activeRevisionSession.taskId ? { ...t, completed: true, completedAt: new Date().toISOString() } : t)));
      }

      if (result.streak) setStreakData(result.streak);
      if (result.readiness) setReadinessMetrics(result.readiness);

      triggerConfetti();
      refreshRevisions();
      refreshFocusAnalytics();
      setTimeout(() => {
        refreshCoachAnalysis(false).catch(() => {});
      }, 500);

      return result;
    } catch (e) {
      console.warn('[Submit Adaptive Revision Error]', e);
      throw e;
    }
  };

  const handleRescheduleRevision = async (revisionId, daysAhead, targetDate) => {
    try {
      const updated = await rescheduleRevisionApi({ revisionId, daysAhead, targetDate });
      if (updated) {
        setRevisionQueue((prev) =>
          prev.map((r) => (r.id === revisionId ? updated : r))
        );
      }
      showToast('Revision Rescheduled 🗓️', `Topic moved to ${updated.revisionDueDate || 'future date'}.`, 'sage');
      refreshRevisions();
      setIsTopicDetailOpen(false);
    } catch (e) {
      console.warn('[Reschedule Revision Error]', e);
      showToast('Error', 'Could not reschedule revision.', 'terracotta');
    }
  };

  // -------------------------------------------------------------------------
  // PLACEMENT APPLICATION TRACKER ACTIONS
  // -------------------------------------------------------------------------
  const refreshApplications = useCallback(async () => {
    try {
      const res = await fetchApplicationsApi();
      if (res && res.success) {
        setApplications(res.applications || []);
        if (res.metrics) setApplicationMetrics(res.metrics);
        if (res.upcomingEvents) setUpcomingAppEvents(res.upcomingEvents);
        if (res.preparationRecommendation) setAppPrepRecommendation(res.preparationRecommendation);
      }
    } catch (e) {
      console.warn('[Applications Refresh Error]', e);
    }
  }, []);

  const handleCreateApplication = async (appData) => {
    try {
      const res = await createApplicationApi(appData);
      if (res.application) {
        setApplications((prev) => [res.application, ...prev]);
        showToast('Application Saved 💼', `${res.application.company} - ${res.application.role}`, 'sage');
        refreshApplications();
        setIsAddAppModalOpen(false);
      }
      return res.application;
    } catch (e) {
      showToast('Error', e.message || 'Could not save application.', 'terracotta');
      throw e;
    }
  };

  const handleUpdateApplication = async (appId, updates) => {
    try {
      const res = await updateApplicationApi(appId, updates);
      if (res.application) {
        setApplications((prev) =>
          prev.map((a) => (a.id === appId ? res.application : a))
        );
        if (selectedApplication && selectedApplication.id === appId) {
          setSelectedApplication(res.application);
        }
        showToast('Application Updated ✨', `${res.application.company} status updated.`, 'sage');
        refreshApplications();
      }
      return res.application;
    } catch (e) {
      showToast('Error', e.message || 'Could not update application.', 'terracotta');
      throw e;
    }
  };

  const handleDeleteApplication = async (appId) => {
    try {
      await deleteApplicationApi(appId);
      setApplications((prev) => prev.filter((a) => a.id !== appId));
      if (selectedApplication && selectedApplication.id === appId) {
        setSelectedApplication(null);
        setIsAppDetailsModalOpen(false);
      }
      showToast('Application Deleted', 'Removed from your tracker.', 'terracotta');
      refreshApplications();
    } catch (e) {
      showToast('Error', 'Could not delete application.', 'terracotta');
      throw e;
    }
  };

  const handleAddInterviewStage = async (appId, interviewData) => {
    try {
      const res = await addInterviewStageApi(appId, interviewData);
      if (res.application) {
        setApplications((prev) =>
          prev.map((a) => (a.id === appId ? res.application : a))
        );
        if (selectedApplication && selectedApplication.id === appId) {
          setSelectedApplication(res.application);
        }
        showToast('Interview Stage Added 🎯', `${interviewData.title || interviewData.type} scheduled.`, 'sage');
        refreshApplications();
        setIsAddInterviewModalOpen(false);
      }
      return res;
    } catch (e) {
      showToast('Error', e.message || 'Could not add interview stage.', 'terracotta');
      throw e;
    }
  };

  const handleUpdateInterviewStage = async (appId, interviewId, updates) => {
    try {
      const res = await updateInterviewStageApi(appId, interviewId, updates);
      if (res.application) {
        setApplications((prev) =>
          prev.map((a) => (a.id === appId ? res.application : a))
        );
        if (selectedApplication && selectedApplication.id === appId) {
          setSelectedApplication(res.application);
        }
        showToast('Interview Updated', 'Changes saved successfully.', 'sage');
        refreshApplications();
      }
      return res;
    } catch (e) {
      showToast('Error', e.message || 'Could not update interview stage.', 'terracotta');
      throw e;
    }
  };

  const handleDeleteInterviewStage = async (appId, interviewId) => {
    try {
      const res = await deleteInterviewStageApi(appId, interviewId);
      if (res.application) {
        setApplications((prev) =>
          prev.map((a) => (a.id === appId ? res.application : a))
        );
        if (selectedApplication && selectedApplication.id === appId) {
          setSelectedApplication(res.application);
        }
        showToast('Interview Removed', 'Round removed from application.', 'terracotta');
        refreshApplications();
      }
    } catch (e) {
      showToast('Error', 'Could not remove interview round.', 'terracotta');
      throw e;
    }
  };

  // -------------------------------------------------------------------------
  // PLACEMENT CALENDAR & SCHEDULE ACTIONS
  // -------------------------------------------------------------------------
  const refreshCalendarEvents = useCallback(async (start = null, end = null, date = null) => {
    try {
      const res = await fetchCalendarEventsApi(start, end, date);
      if (res && res.success) {
        setCalendarEvents(res.events || []);
        if (res.conflicts) setCalendarConflicts(res.conflicts);
        if (res.capacity) setCalendarCapacity(res.capacity);
        if (res.placementTarget) setCalendarTarget(res.placementTarget);
      }
    } catch (e) {
      console.warn('[Calendar Refresh Error]', e);
    }
  }, []);

  const handleCreatePersonalEvent = async (eventData) => {
    try {
      const res = await createPersonalEventApi(eventData);
      if (res.event) {
        showToast('Event Scheduled 📅', res.event.title, 'sage');
        refreshCalendarEvents();
        setIsAddEventModalOpen(false);
      }
      return res.event;
    } catch (e) {
      showToast('Error', e.message || 'Could not schedule event.', 'terracotta');
      throw e;
    }
  };

  const handleUpdatePersonalEvent = async (eventId, updates) => {
    try {
      const res = await updatePersonalEventApi(eventId, updates);
      if (res.event) {
        showToast('Event Updated ✨', res.event.title, 'sage');
        refreshCalendarEvents();
        setIsAddEventModalOpen(false);
      }
      return res.event;
    } catch (e) {
      showToast('Error', e.message || 'Could not update event.', 'terracotta');
      throw e;
    }
  };

  const handleDeletePersonalEvent = async (eventId) => {
    try {
      await deletePersonalEventApi(eventId);
      showToast('Event Removed', 'Event deleted from your schedule.', 'terracotta');
      refreshCalendarEvents();
      setIsAddEventModalOpen(false);
    } catch (e) {
      showToast('Error', 'Could not delete event.', 'terracotta');
      throw e;
    }
  };

  const openCalendarEventTarget = useCallback((event) => {
    if (!event) return;

    if (event.type === 'STUDY_TASK') {
      const task = event.taskRef || todayTasks.find((t) => t.id === event.sourceId) || {
        id: event.sourceId,
        title: event.title,
        duration: `${event.durationMinutes || 45} min`,
        category: event.category || 'DSA'
      };
      setActiveFocusTask(task);
      setIsFocusModalOpen(true);
    } else if (event.type === 'REVISION') {
      const rev = event.revisionRef || revisionQueue.find((r) => r.id === event.sourceId) || {
        id: event.sourceId,
        topic: event.title.replace(' Revision', ''),
        category: event.category || 'DSA',
        retentionScore: event.retentionScore || '75%'
      };
      setSelectedTopicDetail(rev);
      setIsTopicDetailOpen(true);
    } else if (event.type === 'APPLICATION_DEADLINE' || event.type === 'INTERVIEW' || event.type === 'ONLINE_ASSESSMENT') {
      const app = event.appRef || applications.find((a) => a.id === event.sourceId);
      if (app) {
        setSelectedApplication(app);
        setIsAppDetailsModalOpen(true);
      } else {
        setActiveTab('applications');
      }
    } else if (event.type === 'MOCK_INTERVIEW') {
      setActiveTab('interview');
    } else if (event.type === 'PLACEMENT_TARGET') {
      setActiveTab('profile');
    } else if (event.isPersonal) {
      setSelectedCalendarEvent(event);
      setIsAddEventModalOpen(true);
    }
  }, [todayTasks, revisionQueue, applications, setActiveTab]);

  const completeRevision = async (revId, grade = 'good') => {
    setRevisionQueue((prev) =>
      prev.map((item) =>
        item.id === revId
          ? {
              ...item,
              revisionDueDate: grade === 'easy' ? 'In 14 days' : grade === 'good' ? 'In 7 days' : 'Tomorrow',
              retentionScore: grade === 'easy' ? '95%' : grade === 'good' ? '88%' : '70%'
            }
          : item
      )
    );
    setActiveRevisionItem(null);
    triggerConfetti();
    showToast('Revision Logged! 🧠', 'Spaced interval updated for maximum retention.', 'terracotta');

    try {
      const updated = await syncCompleteRevision(revId, grade);
      if (updated) setRevisionQueue(updated);
      refreshCoachAnalysis();
    } catch (e) {
      console.warn('[Revision Sync Error]', e);
    }
  };

  // Notification Operations
  const markSingleNotificationRead = async (notifId) => {
    setNotifications((prev) => prev.map((n) => (n.id === notifId ? { ...n, unread: false } : n)));
    try {
      const updated = await markNotificationReadApi(notifId);
      if (updated) setNotifications(updated);
    } catch (e) {}
  };

  const markAllNotifsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    try {
      await syncMarkNotificationsRead();
    } catch (e) {}
  };

  const dismissNotification = async (notifId) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notifId));
    try {
      const updated = await dismissNotificationApi(notifId);
      if (updated) setNotifications(updated);
    } catch (e) {}
  };

  const clearAllNotifications = async () => {
    setNotifications([]);
    try {
      await clearAllNotificationsApi();
    } catch (e) {}
  };

  const updatePreferences = async (newPrefs) => {
    setNotifPreferences((prev) => ({ ...prev, ...newPrefs }));
    try {
      await syncNotificationPreferences(newPrefs);
      showToast('Preferences Saved ✨', 'Your notification settings have been updated.', 'sage');
    } catch (e) {}
  };

  const sendTestNotification = async (type = 'streak') => {
    try {
      const notif = await triggerTestNotificationApi(type);
      if (notif) {
        setNotifications((prev) => [notif, ...prev]);
        showToast(notif.title, notif.message, 'terracotta');
        showSystemNotification(notif.title, { body: notif.message });
      }
    } catch (e) {
      const fallback = {
        id: `notif-test-${Date.now()}`,
        title: type === 'streak' ? 'Streak at risk 🔥' : 'Time for DSA Session 🎯',
        message: type === 'streak' ? 'Complete 1 more task before midnight to extend your streak!' : 'DSA Arrays session starts now.',
        time: 'Just now',
        type: type === 'streak' ? 'STREAK_RISK' : 'TASK_REMINDER',
        unread: true
      };
      setNotifications((prev) => [fallback, ...prev]);
      showToast(fallback.title, fallback.message, 'terracotta');
      showSystemNotification(fallback.title, { body: fallback.message });
    }
  };

  const navigateToNotificationTarget = (notif) => {
    markSingleNotificationRead(notif.id);
    setIsNotifDrawerOpen(false);

    if (notif.relatedTaskId) {
      const task = todayTasks.find((t) => t.id === notif.relatedTaskId);
      setActiveTab('today');
      if (task) {
        startFocusSession(task);
      }
      return;
    }

    if (notif.actionRoute === 'revision' || notif.relatedRevisionId) {
      setActiveTab('revision');
      return;
    }

    if (notif.actionRoute === 'progress') {
      setActiveTab('progress');
      return;
    }

    if (notif.actionRoute === 'coach') {
      setActiveTab('coach');
      return;
    }

    setActiveTab('today');
  };

  const refreshFocusAnalytics = async () => {
    try {
      const analytics = await getFocusAnalyticsApi();
      if (analytics) {
        setFocusAnalytics(analytics);
        if (analytics.activeSession) {
          setActiveFocusSession(analytics.activeSession);
          const task = todayTasks.find((t) => t.id === analytics.activeSession.taskId);
          if (task) setActiveFocusTask(task);
        }
      }
    } catch (e) {
      console.warn('[Focus Analytics Error]', e);
    }
  };

  const startFocusSession = async (task, plannedMinutes) => {
    try {
      const duration = plannedMinutes || task.durationMinutes || (task.estimatedDuration ? parseInt(task.estimatedDuration) : 45) || 45;
      const session = await startFocusSessionApi({
        taskId: task.id,
        plannedMinutes: duration,
        roadmapId: activeRoadmap?.id,
        topicId: task.topicId
      });
      setActiveFocusTask(task);
      setActiveFocusSession(session);
      setIsFocusModalOpen(true);
      refreshFocusAnalytics().catch(() => {});
      return session;
    } catch (e) {
      console.warn('[Start Focus Session Error]', e);
      setActiveFocusTask(task);
      setActiveFocusSession({
        sessionId: `local_${Date.now()}`,
        taskId: task.id,
        startedAt: new Date().toISOString(),
        plannedMinutes: plannedMinutes || 45,
        actualMinutes: 0,
        status: 'active'
      });
      setIsFocusModalOpen(true);
    }
  };

  const pauseFocusSession = async (sessionId) => {
    try {
      const session = await pauseFocusSessionApi(sessionId);
      if (session) setActiveFocusSession(session);
    } catch (e) {
      console.warn('[Pause Focus Session Error]', e);
      setActiveFocusSession((prev) => (prev ? { ...prev, status: 'paused', pausedAt: new Date().toISOString() } : null));
    }
  };

  const resumeFocusSession = async (sessionId) => {
    try {
      const session = await resumeFocusSessionApi(sessionId);
      if (session) setActiveFocusSession(session);
    } catch (e) {
      console.warn('[Resume Focus Session Error]', e);
      setActiveFocusSession((prev) => (prev ? { ...prev, status: 'active', pausedAt: null } : null));
    }
  };

  const completeFocusSession = async (sessionId, notes) => {
    try {
      const result = await completeFocusSessionApi({ sessionId, notes });
      if (result.tasks) setTodayTasks(result.tasks);
      if (result.streak) setStreakData(result.streak);
      if (result.readiness) setReadinessMetrics(result.readiness);

      triggerConfetti();
      showToast('Study Session Complete! 🎯', `${result.session?.actualMinutes || 45} min logged • Task marked complete.`, 'terracotta');

      setActiveFocusSession(null);
      setActiveFocusTask(null);
      setIsFocusModalOpen(false);

      refreshFocusAnalytics().catch(() => {});
      setTimeout(() => {
        refreshCoachAnalysis(false).catch(() => {});
      }, 500);

      return result;
    } catch (e) {
      console.warn('[Complete Focus Session Error]', e);
      if (activeFocusTask) {
        toggleTaskCompletion(activeFocusTask.id);
      }
      setActiveFocusSession(null);
      setActiveFocusTask(null);
      setIsFocusModalOpen(false);
    }
  };

  const abandonFocusSession = async (sessionId, notes) => {
    try {
      await abandonFocusSessionApi({ sessionId, notes });
    } catch (e) {
      console.warn('[Abandon Focus Session Error]', e);
    }
    showToast('Session Ended', 'Elapsed study time has been recorded.', 'terracotta');
    setActiveFocusSession(null);
    setActiveFocusTask(null);
    setIsFocusModalOpen(false);
    refreshFocusAnalytics().catch(() => {});
  };

  const applyAdaptiveRescheduling = (missedTasksList = []) => {
    const adjusted = {
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      redistributedCount: missedTasksList.length || 2,
      summary: 'Rescheduled overdue tasks across the next 3 days without exceeding your daily study cap.'
    };
    setLastPlanAdjustment(adjusted);
    setIsAdaptiveModalOpen(false);
    showToast('Plan Adjusted ✨', 'Your daily schedule has been optimized to prevent burnout.', 'sage');
  };

  // -------------------------------------------------------------------------
  // SINGLE SOURCE OF TRUTH: Calculated roadmap progress
  // -------------------------------------------------------------------------
  const totalRoadmapTopics = activeRoadmap?.phases?.reduce((acc, p) => acc + (p.topics?.length || 0), 0) || 0;
  const completedRoadmapTopics = activeRoadmap?.phases?.reduce((acc, p) => 
    acc + (p.topics?.filter((t) => t.status === 'completed').length || 0), 0
  ) || 0;
  const roadmapProgress = totalRoadmapTopics > 0 
    ? Math.round((completedRoadmapTopics / totalRoadmapTopics) * 100) 
    : 0;

  return (
    <AppContext.Provider
      value={{
        currentUser,
        isAuthLoading,
        isOffline,
        browserPermission,
        requestBrowserPermission: handleRequestBrowserPermission,
        handleLogin,
        handleSignup,
        handleGoogleLogin,
        handleLogout,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isOnboardingOpen,
        setIsOnboardingOpen,
        activeTab,
        setActiveTab,
        userProfile,
        setUserProfile: updateProfile,
        activeRoadmap,
        setActiveRoadmap,
        roadmapProgress,
        totalRoadmapTopics,
        completedRoadmapTopics,
        updateRoadmapTopicStatus,
        updateFullRoadmap,
        generateDailyTasksFromRoadmap,
        coachAnalysis,
        isCoachLoading,
        refreshCoachAnalysis,
        applyCoachRecommendation,
        coachPreferences,
        setCoachPreferences: updateCoachPreferences,
        isUploadModalOpen,
        setIsUploadModalOpen,
        isAnalyzingRoadmap,
        todayTasks,
        setTodayTasks,
        toggleTaskCompletion,
        toggleSubtask,
        activeFocusTask,
        setActiveFocusTask,
        activeFocusSession,
        setActiveFocusSession,
        isFocusModalOpen,
        setIsFocusModalOpen,
        focusAnalytics,
        startFocusSession,
        pauseFocusSession,
        resumeFocusSession,
        completeFocusSession,
        abandonFocusSession,
        refreshFocusAnalytics,
        streakData,
        setStreakData,
        revisionQueue,
        setRevisionQueue,
        revisionMetrics,
        setRevisionMetrics,
        activeRevisionSession,
        setActiveRevisionSession,
        isRevisionModeOpen,
        setIsRevisionModeOpen,
        selectedTopicDetail,
        setSelectedTopicDetail,
        isTopicDetailOpen,
        setIsTopicDetailOpen,
        refreshRevisions,
        startAdaptiveRevision,
        startTaskRevisionQuiz,
        submitAdaptiveRevision,
        handleRescheduleRevision,
        activeRevisionItem,
        setActiveRevisionItem,
        completeRevision,
        applications,
        setApplications,
        applicationMetrics,
        setApplicationMetrics,
        upcomingAppEvents,
        appPrepRecommendation,
        selectedApplication,
        setSelectedApplication,
        isAddAppModalOpen,
        setIsAddAppModalOpen,
        isAppDetailsModalOpen,
        setIsAppDetailsModalOpen,
        isAddInterviewModalOpen,
        setIsAddInterviewModalOpen,
        refreshApplications,
        createApplication: handleCreateApplication,
        updateApplication: handleUpdateApplication,
        deleteApplication: handleDeleteApplication,
        addInterviewStage: handleAddInterviewStage,
        updateInterviewStage: handleUpdateInterviewStage,
        deleteInterviewStage: handleDeleteInterviewStage,
        calendarEvents,
        setCalendarEvents,
        calendarConflicts,
        calendarCapacity,
        calendarTarget,
        selectedCalendarDate,
        setSelectedCalendarDate,
        isAddEventModalOpen,
        setIsAddEventModalOpen,
        selectedCalendarEvent,
        setSelectedCalendarEvent,
        refreshCalendarEvents,
        createPersonalEvent: handleCreatePersonalEvent,
        updatePersonalEvent: handleUpdatePersonalEvent,
        deletePersonalEvent: handleDeletePersonalEvent,
        openCalendarEventTarget,
        syncStatus,
        pendingSyncCount,
        lastSyncedAt,
        triggerManualSync,
        readinessMetrics,
        notifications,
        isNotifDrawerOpen,
        setIsNotifDrawerOpen,
        notifPreferences,
        setNotifPreferences: updatePreferences,
        sendTestNotification,
        markSingleNotificationRead,
        dismissNotification,
        clearAllNotifications,
        markAllNotifsRead,
        navigateToNotificationTarget,
        toastMessages,
        showToast,
        triggerConfetti,
        isAdaptiveModalOpen,
        setIsAdaptiveModalOpen,
        lastPlanAdjustment,
        applyAdaptiveRescheduling,
        isInstallable,
        isStandaloneApp,
        handleInstallApp,
        isUpdateAvailable,
        applyAppUpdate
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
