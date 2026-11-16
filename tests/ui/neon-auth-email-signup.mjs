import assert from 'node:assert/strict';

try {
  process.loadEnvFile?.('.env.local');
} catch {}
try {
  process.loadEnvFile?.('.env');
} catch {}

const { createAuthClient } = await import('@neondatabase/auth');
const { getNeonAuthBaseUrl, getAppOrigin } = await import('../../lib/auth/neon-auth.ts');

console.log('=== Neon Auth: Managed Better Auth Email Signup Verification ===\n');

const baseUrl = getNeonAuthBaseUrl();
console.log('--- 1. Initializing Neon Auth Client ---');
console.log('Target Neon Auth Service:', baseUrl);
const client = createAuthClient(baseUrl);

// Generate unique test credentials
const testId = Date.now();
const testEmail = `tester.neon.${testId}@ohmsim.ph`;
const testName = 'Neon Auth Tester';
const testPassword = `TestP@ss${testId}!`;
const origin = getAppOrigin();

console.log('\n--- 2. Signing Up Real Test User via Neon Auth SDK ---');
console.log('User Email:', testEmail);
console.log('User Name :', testName);

const signUpResult = await client.signUp.email({
  email: testEmail,
  password: testPassword,
  name: testName,
  callbackURL: origin,
}, {
  headers: {
    Origin: origin,
  },
});

assert.equal(signUpResult.error, null, `Signup error must be null: ${signUpResult.error?.message}`);
assert.ok(signUpResult.data, 'Signup must return response data');
assert.ok(signUpResult.data.user, 'Signup must return created user record');
assert.equal(signUpResult.data.user.email, testEmail, 'Created user email must match');
assert.equal(signUpResult.data.user.name, testName, 'Created user name must match');
assert.ok(signUpResult.data.user.id, 'Created user must have a valid Neon Auth UUID');

const neonUserId = signUpResult.data.user.id;
console.log('✔ Sign-up succeeded. Created Neon User ID:', neonUserId);

console.log('\n--- 3. Reading Current User Back via Sign-In Authentication ---');
const signInResult = await client.signIn.email({
  email: testEmail,
  password: testPassword,
  callbackURL: origin,
}, {
  headers: {
    Origin: origin,
  },
});

assert.equal(signInResult.error, null, `Sign-in error must be null: ${signInResult.error?.message}`);
assert.ok(signInResult.data, 'Sign-in must return auth response');
assert.ok(signInResult.data.user, 'Sign-in must return authenticated user record');
assert.equal(signInResult.data.user.id, neonUserId, 'Retrieved user ID must match signed-up user ID');
assert.equal(signInResult.data.user.email, testEmail, 'Retrieved user email must match');
assert.equal(signInResult.data.user.name, testName, 'Retrieved user name must match');

console.log('✔ Successfully authenticated and read back user details:');
console.log('  ID   :', signInResult.data.user.id);
console.log('  Email:', signInResult.data.user.email);
console.log('  Name :', signInResult.data.user.name);
console.log('  Email Verified:', Boolean(signInResult.data.user.emailVerified));

console.log('\n=== All Neon Managed Better Auth Email Signup Checks PASSED Successfully ===');
