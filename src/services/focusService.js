/**
 * Frontend Focus Mode Service
 * Connects to server-side authenticated focus endpoints for timestamped tracking and study analytics.
 */

import { getStoredToken } from './authService.js';

const getAuthHeaders = () => {
  const token = getStoredToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const startFocusSessionApi = async ({ taskId, plannedMinutes, roadmapId, topicId }) => {
  const response = await fetch('/api/focus/start', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ taskId, plannedMinutes, roadmapId, topicId })
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to start focus session.');
  }
  return data.session;
};

export const pauseFocusSessionApi = async (sessionId) => {
  const response = await fetch('/api/focus/pause', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ sessionId })
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to pause focus session.');
  }
  return data.session;
};

export const resumeFocusSessionApi = async (sessionId) => {
  const response = await fetch('/api/focus/resume', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ sessionId })
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to resume focus session.');
  }
  return data.session;
};

export const completeFocusSessionApi = async ({ sessionId, notes }) => {
  const response = await fetch('/api/focus/complete', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ sessionId, notes })
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to complete focus session.');
  }
  return data;
};

export const abandonFocusSessionApi = async ({ sessionId, notes }) => {
  const response = await fetch('/api/focus/abandon', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ sessionId, notes })
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to abandon focus session.');
  }
  return data.session;
};

export const getActiveFocusSessionApi = async () => {
  const response = await fetch('/api/focus/active', {
    headers: getAuthHeaders()
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    return null;
  }
  return data.session;
};

export const getFocusHistoryApi = async () => {
  const response = await fetch('/api/focus/history', {
    headers: getAuthHeaders()
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    return [];
  }
  return data.history || [];
};

export const getFocusAnalyticsApi = async () => {
  const response = await fetch('/api/focus/analytics', {
    headers: getAuthHeaders()
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    return null;
  }
  return data.analytics;
};
