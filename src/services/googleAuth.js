/**
 * Client-Side Google Identity Services (GIS) / OAuth 2.0 Integration
 * Supports Google One Tap and Google OAuth2 Token Client Popups
 */

/**
 * Validates whether a given string is a genuine Google OAuth Web Client ID
 * Format: <project-number>-<alphanumeric-hash>.apps.googleusercontent.com
 * @param {string} id - Google Client ID
 * @returns {boolean}
 */
export const isValidGoogleClientId = (id) => {
  if (!id || typeof id !== 'string') return false;
  const trimmed = id.trim();
  if (
    trimmed === '' ||
    trimmed.includes('your_google') ||
    trimmed.includes('your-google') ||
    trimmed.includes('your_client') ||
    trimmed.includes('your-client') ||
    trimmed.includes('example') ||
    trimmed.includes('placeholder') ||
    trimmed.includes('<') ||
    trimmed.includes('[')
  ) {
    return false;
  }
  return /^\d+-[a-zA-Z0-9_\-]+\.apps\.googleusercontent\.com$/.test(trimmed);
};

export const getGoogleClientId = () => {
  // 1. Check runtime window configuration injected by server into index.html
  if (typeof window !== 'undefined' && isValidGoogleClientId(window.NOVARA_GOOGLE_CLIENT_ID)) {
    return window.NOVARA_GOOGLE_CLIENT_ID.trim();
  }
  // 2. Check build-time Vite environment variable
  const envId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (isValidGoogleClientId(envId)) {
    return envId.trim();
  }
  return '';
};

export const isGoogleAuthAvailable = () => {
  return typeof window !== 'undefined' && Boolean(window.google?.accounts);
};

export const loadGoogleSdk = () => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('Window not available'));
    if (window.google?.accounts) return resolve(window.google.accounts);

    // Check if script already in DOM
    const existing = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.google?.accounts));
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Identity Services script.')));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google?.accounts);
    script.onerror = () => reject(new Error('Failed to load Google Identity Services SDK.'));
    document.head.appendChild(script);
  });
};

import { isNativePlatform } from './nativeBridge.js';

/**
 * Triggers Real Google Sign-In Popup (Web) or Native Google Play Services (Android)
 * Returns Promise resolving to { accessToken } or { credential } / { idToken }
 */
export const triggerGoogleSignIn = async () => {
  let clientId = getGoogleClientId();

  // Runtime fallback: fetch from backend config endpoint if not already in window/bundle
  if (!clientId && typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/auth/config');
      if (res.ok) {
        const data = await res.json();
        if (data.googleClientId && isValidGoogleClientId(data.googleClientId)) {
          window.NOVARA_GOOGLE_CLIENT_ID = data.googleClientId;
          clientId = data.googleClientId;
        }
      }
    } catch {
      // Non-critical network error fetching config, continue with check
    }
  }

  // 1. Native Android Google Sign-In via Google Play Services (Zero WebView popup issues)
  if (isNativePlatform()) {
    try {
      const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
      if (clientId) {
        GoogleAuth.initialize({
          clientId: clientId,
          scopes: ['profile', 'email'],
          grantOfflineAccess: false
        });
      }

      const googleUser = await GoogleAuth.signIn();
      const idToken = googleUser?.authentication?.idToken || googleUser?.idToken;
      const accessToken = googleUser?.authentication?.accessToken || googleUser?.accessToken;

      if (!idToken && !accessToken) {
        throw new Error('Google Sign-In did not return an authentication token.');
      }

      return {
        idToken,
        accessToken,
        credential: idToken
      };
    } catch (nativeErr) {
      const errMsg = nativeErr?.message || String(nativeErr);
      if (
        errMsg.includes('12501') ||
        errMsg.toLowerCase().includes('cancel') ||
        errMsg.toLowerCase().includes('closed')
      ) {
        throw new Error('Google sign-in was cancelled.');
      }
      throw new Error(`Android Google Sign-In error: ${errMsg}`);
    }
  }

  // 2. Web Google Identity Services (GIS) Flow
  if (!clientId) {
    throw new Error(
      'Google sign-in is not configured with a valid Web Application Client ID. Please set GOOGLE_CLIENT_ID in your Render Environment Variables.'
    );
  }

  // Ensure SDK is loaded
  if (!window.google?.accounts) {
    try {
      await loadGoogleSdk();
    } catch (e) {
      throw new Error('Google Identity Services SDK could not be loaded. Please check your internet connection.');
    }
  }

  return new Promise((resolve, reject) => {
    // Priority 1: Google OAuth2 Token Client (Standard account picker popup for custom buttons)
    if (window.google?.accounts?.oauth2) {
      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'openid email profile',
          callback: (response) => {
            if (response.error) {
              if (response.error === 'popup_closed_by_user' || response.error === 'access_denied') {
                return reject(new Error('Google sign-in was cancelled.'));
              }
              if (response.error === 'popup_failed_to_open' || response.error === 'popup_blocked_by_browser') {
                return reject(new Error('Google sign-in popup was blocked by your browser. Please allow popups for this site.'));
              }
              return reject(new Error(response.error_description || response.error || 'Unable to sign in with Google. Please try again.'));
            }

            if (response.access_token) {
              return resolve({ accessToken: response.access_token });
            }
            return reject(new Error('No authorization token received from Google.'));
          },
          error_callback: (err) => {
            if (err.type === 'popup_closed') {
              return reject(new Error('Google sign-in was cancelled.'));
            }
            if (err.type === 'popup_failed_to_open') {
              return reject(new Error('Google sign-in popup was blocked by your browser. Please allow popups for this site.'));
            }
            return reject(new Error(err.message || 'Unable to sign in with Google. Please try again.'));
          }
        });

        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (err) {
        console.warn('[Google OAuth2 init error]', err);
      }
    }

    // Priority 2: Google Identity Services ID Token (One Tap / Credential Flow)
    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response.credential) {
              resolve({ credential: response.credential });
            } else {
              reject(new Error('No Google credential returned.'));
            }
          }
        });

        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed()) {
            reject(new Error('Google sign-in prompt could not be displayed.'));
          } else if (notification.isSkippedMoment()) {
            reject(new Error('Google sign-in was dismissed.'));
          }
        });
        return;
      } catch (err) {
        return reject(new Error(err.message || 'Failed to initialize Google Sign-in.'));
      }
    }

    reject(new Error('Google Identity Services SDK is unavailable.'));
  });
};
