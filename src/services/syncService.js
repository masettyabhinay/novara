/**
 * Client Cloud Synchronization Service for NOVARA
 * Handles cross-device state synchronization with the authenticated backend:
 * - Profile
 * - Confirmed Roadmap
 * - Daily Tasks & Subtasks
 * - Streak
 * - Spaced Revisions
 * - Notifications & Preferences
 */

import { getStoredToken } from './authService';

const getAuthHeaders = () => {
  const token = getStoredToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

/**
 * Fetch full authenticated cloud state
 */
export const fetchCloudUserState = async () => {
  const token = getStoredToken();
  if (!token) return null;

  const response = await fetch('/api/user/sync', {
    method: 'GET',
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('UNAUTHORIZED');
    }
    throw new Error('Failed to synchronize with cloud account.');
  }

  const data = await response.json();
  return data.data;
};

/**
 * Save / Update Profile
 */
export const syncUserProfile = async (profileUpdates) => {
  const response = await fetch('/api/user/profile', {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(profileUpdates)
  });

  if (!response.ok) throw new Error('Failed to update profile.');
  const data = await response.json();
  return data.profile;
};

/**
 * Save / Update Confirmed Roadmap
 */
export const syncUserRoadmap = async (roadmap) => {
  const response = await fetch('/api/user/roadmap', {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ roadmap })
  });

  if (!response.ok) throw new Error('Failed to save roadmap.');
  const data = await response.json();
  return data.roadmap;
};

/**
 * Toggle Task Completion (Server updates task and streak atomically)
 */
export const syncToggleTask = async (taskId) => {
  const response = await fetch('/api/user/tasks/toggle', {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ taskId })
  });

  if (!response.ok) throw new Error('Failed to update task.');
  const data = await response.json();
  return data;
};

/**
 * Toggle Subtask Completion
 */
export const syncToggleSubtask = async (taskId, subtaskId) => {
  const response = await fetch('/api/user/tasks/subtask', {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ taskId, subtaskId })
  });

  if (!response.ok) throw new Error('Failed to update subtask.');
  const data = await response.json();
  return data.tasks;
};

/**
 * Generate and save daily plan on server
 */
export const syncGenerateDailyTasks = async (roadmap, preferences) => {
  const response = await fetch('/api/user/tasks/generate', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ roadmap, preferences })
  });

  if (!response.ok) throw new Error('Failed to generate daily tasks on server.');
  const data = await response.json();
  return data.tasks;
};

/**
 * POST /api/plan/generate
 * Generates and saves daily plan tasks for a confirmed roadmap
 */
export const generatePlanApi = async (roadmap, preferences) => {
  const response = await fetch('/api/plan/generate', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ roadmap, preferences })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Couldn't create your daily plan.");
  }
  const data = await response.json();
  return data;
};

/**
 * Complete Spaced Revision Item
 */
export const syncCompleteRevision = async (revId, grade = 'good') => {
  const response = await fetch('/api/user/revisions/complete', {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ revId, grade })
  });

  if (!response.ok) throw new Error('Failed to log revision.');
  const data = await response.json();
  return data.revisions;
};

/**
 * Mark all notifications read
 */
export const syncMarkNotificationsRead = async () => {
  const response = await fetch('/api/user/notifications/read-all', {
    method: 'PUT',
    headers: getAuthHeaders()
  });

  if (!response.ok) throw new Error('Failed to update notifications.');
  const data = await response.json();
  return data.notifications;
};

/**
 * Update Notification Preferences
 */
export const syncNotificationPreferences = async (preferences) => {
  const response = await fetch('/api/user/notifications/preferences', {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ preferences })
  });

  if (!response.ok) throw new Error('Failed to save notification preferences.');
  const data = await response.json();
  return data.preferences;
};
