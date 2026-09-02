/**
 * Frontend Placement Calendar API Service for NOVARA
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
 * Fetch unified aggregated calendar events, conflicts, daily capacity, and target milestone
 */
export const fetchCalendarEventsApi = async (startDate = null, endDate = null, selectedDate = null) => {
  const params = new URLSearchParams();
  if (startDate) params.append('start', startDate);
  if (endDate) params.append('end', endDate);
  if (selectedDate) params.append('date', selectedDate);

  const url = `/api/calendar${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to fetch calendar events');
  }

  return response.json();
};

/**
 * Create a new personal calendar event
 */
export const createPersonalEventApi = async (eventData) => {
  const response = await fetch('/api/calendar/events', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(eventData)
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create calendar event');
  }

  return response.json();
};

/**
 * Update a personal calendar event
 */
export const updatePersonalEventApi = async (eventId, updates) => {
  const response = await fetch(`/api/calendar/events/${eventId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update calendar event');
  }

  return response.json();
};

/**
 * Delete a personal calendar event
 */
export const deletePersonalEventApi = async (eventId) => {
  const response = await fetch(`/api/calendar/events/${eventId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to delete calendar event');
  }

  return response.json();
};
