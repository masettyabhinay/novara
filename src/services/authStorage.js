// NOVARA Account-Based Storage & Cloud-Sync Simulation Service
import {
  SAMPLE_ROADMAPS,
  INITIAL_TODAY_TASKS,
  INITIAL_REVISION_QUEUE,
  INITIAL_NOTIFICATIONS,
  INITIAL_READINESS_METRICS
} from '../data/mockData';

const STORAGE_USERS_KEY = 'novara_registered_users_v1';
const STORAGE_ACTIVE_USER_ID = 'novara_active_user_id_v1';
const STORAGE_USER_DATA_PREFIX = 'novara_user_data_';

// Default Demo User with active 12-day placement journey
export const DEFAULT_DEMO_USER = {
  id: 'user_alex_rivera',
  name: 'Alex Rivera',
  email: 'alex@novara.dev',
  hasCompletedOnboarding: true,
  createdAt: '2026-08-01',
  avatar: 'AR'
};

export const DEFAULT_USER_DATA = {
  profile: {
    name: 'Alex Rivera',
    targetRole: 'Software Engineer',
    targetDate: '2026-11-20',
    dailyTargetHours: 3.0,
    minTasksForStreak: 2,
    prepLevel: 'Intermediate',
    streakFreezesRemaining: 2,
    streakFreezeUsedToday: false,
    targetCompanies: ['Google', 'Amazon', 'Microsoft', 'Atlassian', 'Stripe']
  },
  roadmap: SAMPLE_ROADMAPS.sde,
  tasks: INITIAL_TODAY_TASKS,
  streak: {
    currentStreak: 12,
    longestStreak: 18,
    totalDaysCompleted: 34,
    todayTargetMet: false,
    streakFreezesRemaining: 2,
    weeklyHistory: [
      { day: 'Mon', fullDate: 'Aug 26', status: 'completed', tasksDone: 4 },
      { day: 'Tue', fullDate: 'Aug 27', status: 'completed', tasksDone: 5 },
      { day: 'Wed', fullDate: 'Aug 28', status: 'completed', tasksDone: 3 },
      { day: 'Thu', fullDate: 'Aug 29', status: 'completed', tasksDone: 4 },
      { day: 'Fri', fullDate: 'Aug 30', status: 'completed', tasksDone: 4 },
      { day: 'Sat', fullDate: 'Aug 31', status: 'completed', tasksDone: 6 },
      { day: 'Sun', fullDate: 'Sep 01', status: 'in_progress', tasksDone: 0 }
    ],
    milestones: [
      { days: 3, label: 'Getting Started', unlocked: true },
      { days: 7, label: 'One Week Strong', unlocked: true },
      { days: 14, label: 'Consistent', unlocked: false },
      { days: 30, label: 'Placement Warrior', unlocked: false },
      { days: 60, label: 'Serious Candidate', unlocked: false },
      { days: 100, label: 'Elite Consistency', unlocked: false }
    ]
  },
  revisionQueue: INITIAL_REVISION_QUEUE,
  notifications: INITIAL_NOTIFICATIONS,
  notifPreferences: {
    dailyPlan: true,
    studySession: true,
    unfinishedTask: true,
    streakAtRisk: true,
    revisionReminder: true,
    weeklySummary: true,
    morningTime: '08:00',
    eveningTime: '18:30'
  },
  readiness: INITIAL_READINESS_METRICS,
  planAdjustments: []
};

// Initialize Storage with Demo User
export const initializeAuthStorage = () => {
  try {
    const existingUsers = localStorage.getItem(STORAGE_USERS_KEY);
    if (!existingUsers) {
      const initialUsers = [DEFAULT_DEMO_USER];
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(initialUsers));
      localStorage.setItem(STORAGE_ACTIVE_USER_ID, DEFAULT_DEMO_USER.id);
      localStorage.setItem(`${STORAGE_USER_DATA_PREFIX}${DEFAULT_DEMO_USER.id}`, JSON.stringify(DEFAULT_USER_DATA));
    }
  } catch (e) {
    console.warn('Storage unavailable or restricted:', e);
  }
};

// Get current active session
export const getActiveUserSession = () => {
  try {
    const activeId = localStorage.getItem(STORAGE_ACTIVE_USER_ID);
    if (!activeId) return DEFAULT_DEMO_USER;
    
    const usersJson = localStorage.getItem(STORAGE_USERS_KEY);
    const users = usersJson ? JSON.parse(usersJson) : [DEFAULT_DEMO_USER];
    const found = users.find(u => u.id === activeId);
    return found || DEFAULT_DEMO_USER;
  } catch (e) {
    return DEFAULT_DEMO_USER;
  }
};

// Load User Data isolated by user ID
export const loadUserData = (userId) => {
  try {
    const dataJson = localStorage.getItem(`${STORAGE_USER_DATA_PREFIX}${userId}`);
    if (dataJson) {
      return JSON.parse(dataJson);
    }
    return DEFAULT_USER_DATA;
  } catch (e) {
    return DEFAULT_USER_DATA;
  }
};

// Save User Data isolated by user ID (Cloud-sync simulation)
export const saveUserData = (userId, data) => {
  try {
    localStorage.setItem(`${STORAGE_USER_DATA_PREFIX}${userId}`, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save user data:', e);
  }
};

// Login user
export const loginUser = (email, password) => {
  try {
    const usersJson = localStorage.getItem(STORAGE_USERS_KEY);
    const users = usersJson ? JSON.parse(usersJson) : [DEFAULT_DEMO_USER];
    
    // Find matching user or fallback to demo if email matches
    let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      // Auto-create account for seamless prototype testing
      const nameFromEmail = email.split('@')[0];
      const formattedName = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
      user = {
        id: `user_${Date.now()}`,
        name: formattedName,
        email: email,
        hasCompletedOnboarding: false,
        createdAt: new Date().toISOString().split('T')[0],
        avatar: formattedName.substring(0, 2).toUpperCase()
      };
      users.push(user);
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
      
      // Initialize fresh user data
      const freshData = {
        ...DEFAULT_USER_DATA,
        profile: {
          ...DEFAULT_USER_DATA.profile,
          name: formattedName
        },
        streak: {
          ...DEFAULT_USER_DATA.streak,
          currentStreak: 0,
          longestStreak: 0,
          totalDaysCompleted: 0
        }
      };
      saveUserData(user.id, freshData);
    }
    
    localStorage.setItem(STORAGE_ACTIVE_USER_ID, user.id);
    return { success: true, user };
  } catch (e) {
    return { success: false, error: e.message };
  }
};

// Sign Up new user
export const signupUser = ({ name, email, password }) => {
  try {
    const usersJson = localStorage.getItem(STORAGE_USERS_KEY);
    const users = usersJson ? JSON.parse(usersJson) : [DEFAULT_DEMO_USER];

    const newUser = {
      id: `user_${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      hasCompletedOnboarding: false,
      createdAt: new Date().toISOString().split('T')[0],
      avatar: name.trim().split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'NV'
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
    localStorage.setItem(STORAGE_ACTIVE_USER_ID, newUser.id);

    // Initial empty state for new onboarded user
    const initialNewUserData = {
      ...DEFAULT_USER_DATA,
      profile: {
        ...DEFAULT_USER_DATA.profile,
        name: newUser.name
      },
      streak: {
        ...DEFAULT_USER_DATA.streak,
        currentStreak: 0,
        longestStreak: 0,
        totalDaysCompleted: 0,
        weeklyHistory: [
          { day: 'Mon', fullDate: 'Today', status: 'upcoming', tasksDone: 0 },
          { day: 'Tue', fullDate: '+1d', status: 'upcoming', tasksDone: 0 },
          { day: 'Wed', fullDate: '+2d', status: 'upcoming', tasksDone: 0 },
          { day: 'Thu', fullDate: '+3d', status: 'upcoming', tasksDone: 0 },
          { day: 'Fri', fullDate: '+4d', status: 'upcoming', tasksDone: 0 },
          { day: 'Sat', fullDate: '+5d', status: 'upcoming', tasksDone: 0 },
          { day: 'Sun', fullDate: '+6d', status: 'upcoming', tasksDone: 0 }
        ]
      }
    };
    saveUserData(newUser.id, initialNewUserData);

    return { success: true, user: newUser };
  } catch (e) {
    return { success: false, error: e.message };
  }
};

// Logout
export const logoutUser = () => {
  localStorage.removeItem(STORAGE_ACTIVE_USER_ID);
};
