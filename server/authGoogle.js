/**
 * Server-Side Google Token & Credential Verification Service
 * Verifies Google ID tokens or Access Tokens directly against official Google OAuth endpoints.
 */

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
    if (configuredClientId && configuredClientId.trim() !== '' && !configuredClientId.includes('YOUR_GOOGLE_CLIENT_ID')) {
      if (data.aud !== configuredClientId.trim()) {
        console.warn(`[Google Auth Warning] Token aud (${data.aud}) does not match configured GOOGLE_CLIENT_ID (${configuredClientId})`);
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
