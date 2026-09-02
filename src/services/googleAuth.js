/**
 * Client-Side Google Identity Services (GIS) / OAuth 2.0 Integration
 * Supports Google One Tap and Google OAuth2 Token Client Popups
 */

export const getGoogleClientId = () => {
  const envId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (envId && envId.trim() !== '' && !envId.includes('your-google-client-id')) {
    return envId.trim();
  }
  if (typeof window !== 'undefined' && window.NOVARA_GOOGLE_CLIENT_ID) {
    return window.NOVARA_GOOGLE_CLIENT_ID.trim();
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

/**
 * Triggers Real Google Sign-In Popup
 * Returns Promise resolving to { accessToken } or { credential }
 */
export const triggerGoogleSignIn = async () => {
  const clientId = getGoogleClientId();

  if (!clientId) {
    throw new Error(
      'Google sign-in is not configured. Please set VITE_GOOGLE_CLIENT_ID in your .env file.'
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
