/**
 * Client-Side AI Mock Interview Service
 * Interacts with backend interview endpoints:
 * - POST /api/interview/start
 * - POST /api/interview/answer
 * - POST /api/interview/complete
 * - GET /api/interview/history
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
 * Start a new personalized mock interview session
 */
export const startInterviewApi = async (config) => {
  const response = await fetch('/api/interview/start', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(config)
  });

  if (!response.ok) {
    throw new Error('Failed to start mock interview session.');
  }

  const data = await response.json();
  return data.session;
};

/**
 * Submit answer for the current interview question
 */
export const submitInterviewAnswerApi = async (interviewId, questionIndex, answerText) => {
  const response = await fetch('/api/interview/answer', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ interviewId, questionIndex, answerText })
  });

  if (!response.ok) {
    throw new Error('Failed to evaluate interview answer.');
  }

  const data = await response.json();
  return data;
};

/**
 * Complete the interview and generate full summary report
 */
export const completeInterviewApi = async (interviewId) => {
  const response = await fetch('/api/interview/complete', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ interviewId })
  });

  if (!response.ok) {
    throw new Error('Failed to complete mock interview.');
  }

  const data = await response.json();
  return data.report;
};

/**
 * Fetch all past interview history and performance trends
 */
export const fetchInterviewHistoryApi = async () => {
  const response = await fetch('/api/interview/history', {
    method: 'GET',
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to fetch interview history.');
  }

  const data = await response.json();
  return data;
};

/**
 * Fetch current active in-progress mock interview session if any exists
 */
export const fetchActiveInterviewApi = async () => {
  const response = await fetch('/api/interview/active', {
    method: 'GET',
    headers: getAuthHeaders()
  });

  if (!response.ok) return null;
  const data = await response.json();
  return data.session || null;
};

/**
 * Cancel the active mock interview session
 */
export const cancelInterviewApi = async (interviewId) => {
  const response = await fetch('/api/interview/cancel', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ interviewId })
  });

  if (!response.ok) return false;
  return true;
};

