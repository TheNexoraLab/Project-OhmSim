import assert from 'node:assert/strict';
import { prisma } from '../../lib/prisma/client.ts';
import {
  getNeonAuthBaseUrl,
  initiateGoogleSocialLogin,
  syncNeonUserToOhmSim,
} from '../../lib/auth/neon-auth.ts';
import {
  createSessionToken,
  verifySessionToken,
  SESSION_COOKIE_NAME,
} from '../../lib/auth/session.ts';

console.log('=== OhmSim: Neon Auth & Google OAuth Flow Verification ===\n');

// ----------------------------------------------------
// 1. Verify Live Neon Auth Managed Better Auth Endpoint
// ----------------------------------------------------
console.log('--- 1. Testing Neon Auth Endpoint Reachability & JWKS ---');
const baseUrl = getNeonAuthBaseUrl();
assert.ok(baseUrl.includes('neonauth'), 'Neon Auth base URL must be configured');

const okRes = await fetch(`${baseUrl}/ok`);
assert.equal(okRes.status, 200, 'Neon Auth /ok endpoint must return 200');
const okData = await okRes.json();
assert.equal(okData.ok, true, 'Neon Auth /ok must report ok: true');

const jwksRes = await fetch(`${baseUrl}/.well-known/jwks.json`);
assert.equal(jwksRes.status, 200, 'Neon Auth JWKS endpoint must return 200');
const jwksData = await jwksRes.json();
assert.ok(Array.isArray(jwksData.keys) && jwksData.keys.length > 0, 'Neon Auth must expose active cryptographic keys');

console.log('✔ Neon Auth service and JWKS verified online.');

// ----------------------------------------------------
// 2. Testing Google OAuth Initiation via Neon Auth
// ----------------------------------------------------
console.log('\n--- 2. Testing Google OAuth Initiation via Neon Auth ---');
const testCallback = 'http://localhost:3000/api/auth/callback/neon';
const initResult = await initiateGoogleSocialLogin(testCallback);

assert.equal(initResult.success, true, 'Social login initiation must succeed');
assert.ok(initResult.url, 'Must return initiation URL');
assert.ok(
  initResult.url.includes('neonauth') && initResult.url.includes('sign-in/social/init'),
  'Returned URL must be Neon Auth social init URL'
);

// Verify that the init URL redirects to Google Accounts OAuth
const redirectProbe = await fetch(initResult.url, { redirect: 'manual' });
assert.equal(redirectProbe.status, 302, 'Social init URL must issue 302 redirect to Google');
const targetLocation = redirectProbe.headers.get('location');
assert.ok(
  targetLocation && targetLocation.includes('accounts.google.com'),
  'Target redirect location must be accounts.google.com'
);

console.log('✔ Google OAuth initiation and redirect to accounts.google.com verified.');

// ----------------------------------------------------
// 3. Testing Google User Sync to OhmSim Prisma DB
// ----------------------------------------------------
console.log('\n--- 3. Testing Google User Synchronization into PostgreSQL ---');
const testGoogleEmail = 'google-test-buyer@ohmsim.ph';
await prisma.user.deleteMany({ where: { email: testGoogleEmail } });

const syncedUser = await syncNeonUserToOhmSim({
  email: testGoogleEmail,
  name: 'Ada Lovelace',
});

assert.ok(syncedUser, 'Synced user must exist');
assert.equal(syncedUser.email, testGoogleEmail);
assert.equal(syncedUser.firstName, 'Ada');
assert.equal(syncedUser.lastName, 'Lovelace');
assert.equal(syncedUser.role, 'BUYER');

// Check idempotency when user already exists
const reSyncedUser = await syncNeonUserToOhmSim({
  email: testGoogleEmail,
  name: 'Ada Lovelace Updated',
});
assert.equal(reSyncedUser.id, syncedUser.id, 'Existing user must be retrieved without duplicate creation');

console.log('✔ User sync to PostgreSQL with BUYER role verified.');

// ----------------------------------------------------
// 4. Testing OhmSim Session Issuance & Verification
// ----------------------------------------------------
console.log('\n--- 4. Testing OhmSim Session Issuance & Verification for Google User ---');

const sessionToken = await createSessionToken({
  userId: syncedUser.id,
  email: syncedUser.email,
  role: syncedUser.role,
  firstName: syncedUser.firstName,
  lastName: syncedUser.lastName,
});

assert.ok(sessionToken, 'Must generate valid JWT session token');
const verifiedSession = await verifySessionToken(sessionToken);
assert.ok(verifiedSession, 'Session token must verify cleanly');
assert.equal(verifiedSession.email, testGoogleEmail);
assert.equal(verifiedSession.role, 'BUYER');
assert.equal(verifiedSession.firstName, 'Ada');
assert.equal(verifiedSession.lastName, 'Lovelace');

console.log(`✔ Issued and verified ${SESSION_COOKIE_NAME} JWT for ${verifiedSession.email}.`);

// ----------------------------------------------------
// 5. Cleanup
// ----------------------------------------------------
console.log('\n--- 5. Cleanup Test User ---');
await prisma.user.deleteMany({ where: { email: testGoogleEmail } });
console.log('✔ Test user cleaned up.');

console.log('\n=== All Neon Auth & Google OAuth Checks PASSED Successfully ===');

await prisma.$disconnect();
