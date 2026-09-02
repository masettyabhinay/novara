/**
 * Frontend Application Tracker API Service for NOVARA
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
 * Fetch all applications, metrics, upcoming events, and recommendations
 */
export const fetchApplicationsApi = async () => {
  const response = await fetch('/api/applications', {
    method: 'GET',
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to fetch applications');
  }

  return response.json();
};

/**
 * Fetch single application details
 */
export const fetchApplicationDetailsApi = async (appId) => {
  const response = await fetch(`/api/applications/${appId}`, {
    method: 'GET',
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to fetch application details');
  }

  return response.json();
};

/**
 * Create a new application
 */
export const createApplicationApi = async (appData) => {
  const response = await fetch('/api/applications', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(appData)
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create application');
  }

  return response.json();
};

/**
 * Update an existing application
 */
export const updateApplicationApi = async (appId, updates) => {
  const response = await fetch(`/api/applications/${appId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update application');
  }

  return response.json();
};

/**
 * Delete an application
 */
export const deleteApplicationApi = async (appId) => {
  const response = await fetch(`/api/applications/${appId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to delete application');
  }

  return response.json();
};

/**
 * Add an interview round to an application
 */
export const addInterviewStageApi = async (appId, interviewData) => {
  const response = await fetch(`/api/applications/${appId}/interviews`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(interviewData)
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to schedule interview round');
  }

  return response.json();
};

/**
 * Update an interview round
 */
export const updateInterviewStageApi = async (appId, interviewId, updates) => {
  const response = await fetch(`/api/applications/${appId}/interviews/${interviewId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update interview round');
  }

  return response.json();
};

/**
 * Delete an interview round
 */
export const deleteInterviewStageApi = async (appId, interviewId) => {
  const response = await fetch(`/api/applications/${appId}/interviews/${interviewId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to delete interview round');
  }

  return response.json();
};
