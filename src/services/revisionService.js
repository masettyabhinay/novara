/**
 * Client-Side Adaptive Smart Revision Service for NOVARA
 * Handles fetching priority-ranked revisions, generating grounded topic questions,
 * submitting revision recall attempts, and rescheduling revisions.
 */

import { getStoredToken } from './authService.js';

const getAuthHeaders = () => {
  const token = getStoredToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const fetchRevisionsApi = async () => {
  const response = await fetch('/api/revisions', {
    headers: getAuthHeaders()
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to fetch revisions.');
  }
  return data;
};

export const fetchTopicRevisionDetailsApi = async (topicId) => {
  const response = await fetch(`/api/revisions/${encodeURIComponent(topicId)}`, {
    headers: getAuthHeaders()
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to fetch topic revision details.');
  }
  return data.revision;
};

export const generateRevisionQuestionsApi = async ({ topic, category, difficulty }) => {
  const response = await fetch('/api/revision/generate', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ topic, category, difficulty })
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to generate revision questions.');
  }
  return data.questions || [];
};

export const submitRevisionAttemptApi = async ({ revisionId, answers, durationMinutes }) => {
  const response = await fetch('/api/revision/submit', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ revisionId, answers, durationMinutes })
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to submit revision attempt.');
  }
  return data;
};

export const rescheduleRevisionApi = async ({ revisionId, daysAhead, targetDate }) => {
  const response = await fetch('/api/revision/reschedule', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ revisionId, daysAhead, targetDate })
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to reschedule revision.');
  }
  return data.revision;
};
