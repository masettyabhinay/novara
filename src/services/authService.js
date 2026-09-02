/**
 * Client Authentication Service for NOVARA
 * Handles signup, login, Google SSO, logout, and token persistence.
 */

const TOKEN_KEY = 'novara_session_token';

export const getStoredToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY) || null;
  } catch (e) {
    return null;
  }
};

export const setStoredToken = (token) => {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch (e) {
    // safe fallback
  }
};

export const clearStoredToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (e) {}
};

/**
 * Sign Up with email & password
 */
export const signup = async ({ name, email, password }) => {
  const response = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to create account.');
  }

  setStoredToken(data.token);
  return data;
};

/**
 * Log In with email & password
 */
export const login = async ({ email, password }) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Invalid email address or password.');
  }

  setStoredToken(data.token);
  return data;
};

/**
 * Sign In or Register with Google Verified Token
 */
export const loginWithGoogle = async (googlePayload) => {
  const response = await fetch('/api/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(googlePayload)
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Google sign in failed.');
  }

  setStoredToken(data.token);
  return data;
};

/**
 * Log Out
 */
export const logout = async () => {
  const token = getStoredToken();
  if (token) {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (e) {}
  }
  clearStoredToken();
};
