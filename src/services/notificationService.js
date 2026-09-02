/**
 * Client Notification Service for NOVARA
 * Handles:
 * - Real Web Notifications API & Service Worker integration
 * - Permission requests & status checks
 * - In-app notification synchronization with cloud backend
 * - Local notification triggers
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
 * Check if the browser supports Notification API
 */
export const isNotificationSupported = () => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

/**
 * Get current browser notification permission
 * Returns: 'default' | 'granted' | 'denied' | 'unsupported'
 */
export const getNotificationPermission = () => {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
};

/**
 * Request notification permission from user
 */
export const requestNotificationPermission = async () => {
  if (!isNotificationSupported()) return 'unsupported';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn('[Notification Permission Error]', err);
    return 'denied';
  }
};

/**
 * Display a real system / browser notification if permitted
 */
export const showSystemNotification = (title, options = {}) => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return null;
  }

  try {
    const defaultOptions = {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: options.tag || `novara-notif-${Date.now()}`,
      renotify: true,
      body: options.message || options.body || '',
      ...options
    };

    const notification = new Notification(title, defaultOptions);

    if (options.onClick) {
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        options.onClick();
        notification.close();
      };
    }

    return notification;
  } catch (err) {
    console.warn('[System Notification Display Error]', err);
    return null;
  }
};

/**
 * Send API call to mark single notification as read
 */
export const markNotificationReadApi = async (notifId) => {
  const response = await fetch('/api/user/notifications/read', {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ notifId })
  });
  if (!response.ok) throw new Error('Failed to mark notification read.');
  const data = await response.json();
  return data.notifications;
};

/**
 * Dismiss / delete a notification
 */
export const dismissNotificationApi = async (notifId) => {
  const response = await fetch('/api/user/notifications/dismiss', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ notifId })
  });
  if (!response.ok) throw new Error('Failed to dismiss notification.');
  const data = await response.json();
  return data.notifications;
};

/**
 * Clear all notifications
 */
export const clearAllNotificationsApi = async () => {
  const response = await fetch('/api/user/notifications/clear-all', {
    method: 'POST',
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Failed to clear notifications.');
  const data = await response.json();
  return data.notifications;
};

/**
 * Trigger a test notification via server
 */
export const triggerTestNotificationApi = async (type = 'streak') => {
  const response = await fetch('/api/user/notifications/test', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ type })
  });
  if (!response.ok) throw new Error('Failed to trigger test notification.');
  const data = await response.json();
  return data.notification;
};
