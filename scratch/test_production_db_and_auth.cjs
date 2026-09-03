/**
 * Production Database Enforcement & Password Hashing Regression Test
 */

const assert = require('assert');
const crypto = require('crypto');

async function runTests() {
  console.log('================================================================');
  console.log('  NOVARA PRODUCTION DATABASE & PASSWORD HASHING REGRESSION TEST ');
  console.log('================================================================\n');

  // ---------------------------------------------------------------------------
  // TEST 1: DatabaseAdapter Production Enforcement
  // ---------------------------------------------------------------------------
  console.log('▶ [TEST 1] Testing DatabaseAdapter Production Enforcement...');
  const { DatabaseAdapter, parseSslCa } = await import('file:///f:/NOVARA/server/db/dbAdapter.js');

  // Case 1A: In production without DATABASE_URL -> MUST throw error
  const origEnv = process.env.NODE_ENV;
  const origDbUrl = process.env.DATABASE_URL;

  try {
    process.env.NODE_ENV = 'production';
    delete process.env.DATABASE_URL;

    const prodAdapterNoUrl = new DatabaseAdapter();
    let threw = false;
    try {
      await prodAdapterNoUrl.init();
    } catch (err) {
      threw = true;
      assert(err.message.includes('PRODUCTION_DATABASE_URL_MISSING'), `Expected PRODUCTION_DATABASE_URL_MISSING, got ${err.message}`);
    }
    assert.strictEqual(threw, true, 'Adapter MUST throw in production if DATABASE_URL is missing');
    console.log('  ✔ Case 1A Passed: Production refuses to start without DATABASE_URL');

    // Case 1B: In production with placeholder token -> MUST throw error
    process.env.DATABASE_URL = 'postgresql://postgres.yourprojectref:your_secure_password@aws-0-us-east-1.pooler.supabase.com:6543/postgres';
    const prodAdapterPlaceholder = new DatabaseAdapter();
    let threwPlaceholder = false;
    try {
      await prodAdapterPlaceholder.init();
    } catch (err) {
      threwPlaceholder = true;
      assert(err.message.includes('PRODUCTION_DATABASE_CONNECTION_FAILED') || err.message.includes('placeholder'), `Expected placeholder error, got: ${err.message}`);
    }
    assert.strictEqual(threwPlaceholder, true, 'Adapter MUST throw in production if DATABASE_URL has placeholder');
    console.log('  ✔ Case 1B Passed: Production refuses unreplaced placeholder tokens in DATABASE_URL');

    // Case 1C: Health check in production when not connected
    const prodHealthCheck = await prodAdapterNoUrl.healthCheck();
    assert.strictEqual(prodHealthCheck.status, 'error');
    assert.strictEqual(prodHealthCheck.connected, false);
    console.log('  ✔ Case 1C Passed: Health check reports error if unconfigured in production');

  } finally {
    process.env.NODE_ENV = origEnv;
    if (origDbUrl) {
      process.env.DATABASE_URL = origDbUrl;
    } else {
      delete process.env.DATABASE_URL;
    }
  }

  // ---------------------------------------------------------------------------
  // TEST 2: Password Hashing & Verification (PBKDF2-SHA512)
  // ---------------------------------------------------------------------------
  console.log('\n▶ [TEST 2] Testing Password Hashing & Salted Iteration...');
  const { hashPassword, verifyPassword, signupUser, loginUser, loadDb } = await import('file:///f:/NOVARA/server/db.js');

  const testPass = 'SuperSecretP@ssw0rd2026!';
  const hash1 = hashPassword(testPass);
  const hash2 = hashPassword(testPass);

  // Assert salted: identical passwords MUST have different hashes
  assert.notStrictEqual(hash1, hash2, 'Salted PBKDF2 produces distinct hashes for same password');
  assert(hash1.startsWith('pbkdf2$100000$'), 'Hash format contains algorithm and 100,000 iterations');

  const parts = hash1.split('$');
  assert.strictEqual(parts.length, 4, 'PBKDF2 hash contains 4 dollar-delimited sections');
  assert.strictEqual(parts[1], '100000', 'Iteration count is 100,000');
  assert.strictEqual(parts[2].length, 32, 'Salt is 16 bytes (32 hex characters)');
  assert.strictEqual(parts[3].length, 128, 'Derived key is 64 bytes (128 hex characters for SHA-512)');

  // Verify correct password
  assert.strictEqual(verifyPassword(testPass, hash1), true, 'Valid password verifies correctly');
  assert.strictEqual(verifyPassword('WrongPassword123!', hash1), false, 'Wrong password fails verification');
  console.log('  ✔ Case 2A Passed: PBKDF2-SHA512 hashing and constant-time verification verified');

  // ---------------------------------------------------------------------------
  // TEST 3: Backward Compatibility & Transparent Legacy Hash Upgrade
  // ---------------------------------------------------------------------------
  console.log('\n▶ [TEST 3] Testing Legacy Hash Compatibility & Auto-Migration...');
  const legacyPassword = 'LegacyOldPassword123!';
  const legacySha256Hash = crypto.createHash('sha256').update(legacyPassword).digest('hex');
  assert.strictEqual(legacySha256Hash.length, 64, 'Legacy hash is 64 hex characters');

  // Verify legacy hash works
  assert.strictEqual(verifyPassword(legacyPassword, legacySha256Hash), true, 'Legacy SHA-256 hash verified');
  assert.strictEqual(verifyPassword('WrongPass', legacySha256Hash), false, 'Wrong password rejected against legacy hash');

  // Test live user login auto-migration
  const legacyEmail = `legacy_user_${Date.now()}@novara.dev`;
  const db = loadDb();
  const legacyUserId = `usr_legacy_${Date.now()}`;
  db.users.push({
    id: legacyUserId,
    name: 'Legacy User',
    email: legacyEmail,
    passwordHash: legacySha256Hash,
    createdAt: new Date().toISOString()
  });
  const { saveDb } = await import('file:///f:/NOVARA/server/db.js');
  saveDb(db);

  // Perform login with legacy account
  const loginResult = loginUser({ email: legacyEmail, password: legacyPassword });
  assert(loginResult && loginResult.token, 'Legacy user login succeeded');

  // Check that passwordHash in db was automatically upgraded to PBKDF2!
  const updatedDb = loadDb();
  const updatedUser = updatedDb.users.find(u => u.id === legacyUserId);
  assert(updatedUser.passwordHash.startsWith('pbkdf2$100000$'), 'User passwordHash was transparently upgraded to PBKDF2-SHA512 on login!');
  console.log('  ✔ Case 3A Passed: Legacy accounts seamlessly log in and auto-upgrade to PBKDF2-SHA512');

  // ---------------------------------------------------------------------------
  // TEST 4: Zero Plaintext / Hash Leakage in API & Public Sanitization
  // ---------------------------------------------------------------------------
  console.log('\n▶ [TEST 4] Testing User Sanitization & Zero Leakage...');
  const newEmail = `sec_user_${Date.now()}@novara.dev`;
  const signupRes = signupUser({ name: 'Sec User', email: newEmail, password: testPass });

  assert.strictEqual(signupRes.user.password, undefined, 'Plaintext password not in response');
  assert.strictEqual(signupRes.user.passwordHash, undefined, 'Password hash stripped from sanitized response');

  const { getFullUserState } = await import('file:///f:/NOVARA/server/db.js');
  const userState = getFullUserState(signupRes.user.id);
  assert.strictEqual(userState.profile.password, undefined);
  assert.strictEqual(userState.profile.passwordHash, undefined);
  console.log('  ✔ Case 4A Passed: Passwords and hashes strictly excluded from API responses');

  console.log('\n================================================================');
  console.log('  ALL PRODUCTION DATABASE & PASSWORD HASHING TESTS PASSED!      ');
  console.log('================================================================\n');
}

runTests().catch(err => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
