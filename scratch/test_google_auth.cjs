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

  console.log('🎉 Google Auth Tests Passed!\n');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
