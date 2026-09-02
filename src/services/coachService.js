/**
 * Client-Side AI Placement Coach Service
 * Interacts with backend endpoints:
 * - POST /api/coach/analyze
 * - POST /api/coach/apply-recommendation
 * - PUT /api/coach/preferences
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
 * Fetches the structured AI Placement Coach analysis from the backend.
 */
export const fetchCoachAnalysis = async () => {
  const response = await fetch('/api/coach/analyze', {
    method: 'POST',
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Coach analysis.');
  }

  const data = await response.json();
  return data.analysis;
};

/**
 * Applies the coach recommendation redistribution to future tasks.
 */
export const applyCoachRecommendationApi = async (recommendationPayload) => {
  const response = await fetch('/api/coach/apply-recommendation', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(recommendationPayload)
  });

  if (!response.ok) {
    throw new Error('Failed to apply coach recommendation.');
  }

  const data = await response.json();
  return data;
};

/**
 * Updates coach settings/preferences.
 */
export const updateCoachPreferencesApi = async (coachPreferences) => {
  const response = await fetch('/api/coach/preferences', {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ coachPreferences })
  });

  if (!response.ok) {
    throw new Error('Failed to update coach preferences.');
  }

  const data = await response.json();
  return data.coachPreferences;
};
