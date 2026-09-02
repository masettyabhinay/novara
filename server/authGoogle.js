/**
 * Server-Side Google Token & Credential Verification Service
 * Verifies Google ID tokens or Access Tokens directly against official Google OAuth endpoints.
 */

/**
 * Validates whether a given string is a genuine Google OAuth Web Client ID
 * Format: <project-number>-<alphanumeric-hash>.apps.googleusercontent.com
 * @param {string} id - Google Client ID
 * @returns {boolean}
 */
export function isValidGoogleClientId(id) {
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
}

export async function verifyGoogleToken({ credential, idToken, accessToken }) {
  const token = credential || idToken;

  // 1. Verify Google ID Token (JWT) via Google's tokeninfo endpoint
  if (token && typeof token === 'string' && token.trim() !== '') {
    const trimmedToken = token.trim();
    const tokenInfoUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(trimmedToken)}`;

    let response;
    try {
      response = await fetch(tokenInfoUrl);
    } catch (netErr) {
      throw new Error(`Failed to reach Google verification servers: ${netErr.message}`);
    }

    const data = await response.json();

    if (!response.ok || !data.email) {
      const errorMsg = data.error_description || data.error || 'Invalid or expired Google credential.';
      throw new Error(`Google token verification failed: ${errorMsg}`);
    }

    // Ensure email is verified by Google
    const isEmailVerified = data.email_verified === 'true' || data.email_verified === true;
    if (!isEmailVerified) {
      throw new Error('Google email address has not been verified by Google.');
    }

    // Check aud if configured
    const configuredClientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
    if (isValidGoogleClientId(configuredClientId)) {
      if (data.aud !== configuredClientId.trim()) {
        console.warn('[Google Auth Warning] Token aud does not match configured GOOGLE_CLIENT_ID.');
      }
    }

    return {
      googleId: data.sub,
      email: data.email.toLowerCase().trim(),
      name: data.name || data.email.split('@')[0],
      picture: data.picture || null
    };
  }

  // 2. Verify Google Access Token via Google's userinfo endpoint
  if (accessToken && typeof accessToken === 'string' && accessToken.trim() !== '') {
    const trimmedAccessToken = accessToken.trim();
    const userinfoUrl = 'https://www.googleapis.com/oauth2/v3/userinfo';

    let response;
    try {
      response = await fetch(userinfoUrl, {
        headers: { Authorization: `Bearer ${trimmedAccessToken}` }
      });
    } catch (netErr) {
      throw new Error(`Failed to reach Google userinfo servers: ${netErr.message}`);
    }

    const data = await response.json();

    if (!response.ok || !data.email) {
      const errorMsg = data.error_description || data.error || 'Invalid or expired Google access token.';
      throw new Error(`Google access token verification failed: ${errorMsg}`);
    }

    const isEmailVerified = data.email_verified === 'true' || data.email_verified === true;
    if (!isEmailVerified) {
      throw new Error('Google email address has not been verified by Google.');
    }

    return {
      googleId: data.sub,
      email: data.email.toLowerCase().trim(),
      name: data.name || data.email.split('@')[0],
      picture: data.picture || null
    };
  }

  throw new Error('No valid Google ID token or access token provided for server-side verification.');
}
