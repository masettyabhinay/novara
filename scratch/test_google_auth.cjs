function assert(condition, msg) {
  if (!condition) {
    console.error(`❌ Assertion failed: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ ${msg}`);
}

async function run() {
  console.log('Testing Google Auth Subsystem...');
  const { verifyGoogleToken } = await import('file:///f:/NOVARA/server/authGoogle.js');
  const { loginWithGoogle, validateSessionToken } = await import('file:///f:/NOVARA/server/db.js');

  // 1. Google token validation rejects empty/invalid tokens
  let errorCaught = false;
  try {
    await verifyGoogleToken({});
  } catch (e) {
    errorCaught = true;
  }
  assert(errorCaught === true, 'Empty Google token properly rejected');

  // 2. Mock verified payload creates and authenticates user
  const mockVerifiedProfile = {
    googleId: `g_test_${Date.now()}`,
    email: `google_user_${Date.now()}@novara.dev`,
    name: 'Google Test User',
    picture: 'https://lh3.googleusercontent.com/a/test'
  };

  const loginResult = loginWithGoogle(mockVerifiedProfile);
  assert(loginResult.token !== undefined, 'Session token generated for Google sign-in');
  assert(loginResult.user.email === mockVerifiedProfile.email, 'User email matches verified profile');
  assert(loginResult.user.passwordHash === undefined, 'passwordHash is not exposed in user object');

  // 3. Validate session token works
  const sessionUser = validateSessionToken(loginResult.token);
  assert(sessionUser !== null, 'Session token validated successfully');
  assert(sessionUser.id === loginResult.user.id, 'Session user ID matches authenticated user');

  // 4. Test isValidGoogleClientId on server
  const { isValidGoogleClientId: serverIsValid } = await import('file:///f:/NOVARA/server/authGoogle.js');
  assert(serverIsValid('939390230171-qnrmttdtha9e52hc0v6kebiaede68ssc.apps.googleusercontent.com') === true, 'Real Google Web client ID is validated');
  assert(serverIsValid('your_google_oauth_client_id.apps.googleusercontent.com') === false, 'Underscore placeholder client ID rejected');
  assert(serverIsValid('your-google-client-id.apps.googleusercontent.com') === false, 'Hyphen placeholder client ID rejected');
  assert(serverIsValid('random_string') === false, 'Random string rejected');
  assert(serverIsValid('') === false, 'Empty string rejected');
  assert(serverIsValid(null) === false, 'Null rejected');

  // 5. Test isValidGoogleClientId on client
  const { isValidGoogleClientId: clientIsValid } = await import('file:///f:/NOVARA/src/services/googleAuth.js');
  assert(clientIsValid('939390230171-qnrmttdtha9e52hc0v6kebiaede68ssc.apps.googleusercontent.com') === true, 'Client: Real Google Web client ID is validated');
  assert(clientIsValid('your_google_oauth_client_id.apps.googleusercontent.com') === false, 'Client: Underscore placeholder rejected');
  assert(clientIsValid('your-google-client-id.apps.googleusercontent.com') === false, 'Client: Hyphen placeholder rejected');

  // 6. Test GET /api/auth/config endpoint
  const { apiMiddlewareHandler } = await import('file:///f:/NOVARA/server/apiMiddleware.js');
  let configOutput = '';
  const mockRes = {
    statusCode: 200,
    setHeader: () => {},
    end: (str) => { configOutput = str; }
  };
  process.env.GOOGLE_CLIENT_ID = '939390230171-qnrmttdtha9e52hc0v6kebiaede68ssc.apps.googleusercontent.com';
  await apiMiddlewareHandler({ method: 'GET', url: '/api/auth/config', headers: {} }, mockRes, () => {});
  const validData = JSON.parse(configOutput);
  assert(validData.success === true && validData.isConfigured === true, '/api/auth/config reports valid client ID configured');

  process.env.GOOGLE_CLIENT_ID = 'your_google_oauth_client_id.apps.googleusercontent.com';
  await apiMiddlewareHandler({ method: 'GET', url: '/api/auth/config', headers: {} }, mockRes, () => {});
  const placeholderData = JSON.parse(configOutput);
  assert(placeholderData.isConfigured === false && placeholderData.googleClientId === '', '/api/auth/config suppresses placeholder ID');

  console.log('🎉 Google Auth Tests Passed!\n');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
