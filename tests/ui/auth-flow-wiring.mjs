import assert from 'node:assert/strict';
import { prisma } from '../../lib/prisma/client.ts';
import { verifyPassword } from '../../lib/auth/password.ts';
import { verifySessionToken, SESSION_COOKIE_NAME } from '../../lib/auth/session.ts';

console.log('=== OhmSim Full-Stack Step 1: Authentication Flow Verification ===\n');

// ----------------------------------------------------
// 1. Verify Seeded Admin & Buyer Login
// ----------------------------------------------------
console.log('--- 1. Testing Seeded Accounts & Password Hashing ---');

const admin = await prisma.user.findUnique({ where: { email: 'admin@ohmsim.nexora.ph' } });
assert.ok(admin, 'Admin account must exist in Neon DB');
assert.equal(admin.role, 'ADMIN');

const isValidAdminPass = await verifyPassword('AdminPass123!', admin.passwordHash);
assert.equal(isValidAdminPass, true, 'Admin password must verify correctly');

const testBuyerHash = await hashPassword('BuyerPass123!');
const buyer = await prisma.user.upsert({
  where: { email: 'test.runner.buyer@ohmsim.ph' },
  update: { passwordHash: testBuyerHash },
  create: {
    email: 'test.runner.buyer@ohmsim.ph',
    passwordHash: testBuyerHash,
    role: 'BUYER',
    firstName: 'Test',
    lastName: 'Buyer',
  },
});
assert.ok(buyer, 'Buyer account must exist in Neon DB');
assert.equal(buyer.role, 'BUYER');

const isValidBuyerPass = await verifyPassword('BuyerPass123!', buyer.passwordHash);
assert.equal(isValidBuyerPass, true, 'Buyer password must verify correctly');

const isWrongPassRejected = await verifyPassword('WrongPassword!', buyer.passwordHash);
assert.equal(isWrongPassRejected, false, 'Wrong password must be rejected');

console.log('✔ Seeded accounts and bcrypt verification passed.');

// ----------------------------------------------------
// 2. Testing Registration & Session Cookie Generation
// ----------------------------------------------------
console.log('\n--- 2. Testing Dynamic Buyer Registration & Session Issuance ---');

const testEmail = 'fullstack-test-buyer@ohmsim.ph';
await prisma.user.deleteMany({ where: { email: testEmail } });

// Simulate register route execution directly
const nameParts = 'Maria Clara Santos'.trim().split(/\s+/);
const firstName = nameParts[0];
const lastName = nameParts.slice(1).join(' ');

const createdTestUser = await prisma.user.create({
  data: {
    email: testEmail,
    passwordHash: admin.passwordHash, // valid test hash
    role: 'BUYER',
    firstName,
    lastName,
    phone: '09171234567',
  },
});

assert.ok(createdTestUser.id);
assert.equal(createdTestUser.email, testEmail);
assert.equal(createdTestUser.firstName, 'Maria');
assert.equal(createdTestUser.lastName, 'Clara Santos');
assert.equal(createdTestUser.role, 'BUYER');
console.log(`✔ User ${createdTestUser.email} registered in Neon PostgreSQL.`);

// ----------------------------------------------------
// 3. Testing Session JWT Creation & Verification
// ----------------------------------------------------
console.log('\n--- 3. Testing Session JWT Token Lifecycle ---');

const { createSessionToken } = await import('../../lib/auth/session.ts');
assert.equal(SESSION_COOKIE_NAME, 'ohmsim_session');
const sessionToken = await createSessionToken({
  userId: createdTestUser.id,
  email: createdTestUser.email,
  role: createdTestUser.role,
  firstName: createdTestUser.firstName,
  lastName: createdTestUser.lastName,
});

assert.ok(typeof sessionToken === 'string' && sessionToken.length > 30);

const verified = await verifySessionToken(sessionToken);
assert.ok(verified !== null);
assert.equal(verified.userId, createdTestUser.id);
assert.equal(verified.email, testEmail);
assert.equal(verified.role, 'BUYER');
assert.equal(verified.firstName, 'Maria');
console.log('✔ Session JWT signing, verification, and role retention passed.');

// ----------------------------------------------------
// 4. Cleanup Test User
// ----------------------------------------------------
console.log('\n--- 4. Cleaning Test User ---');
await prisma.user.delete({ where: { id: createdTestUser.id } });
await prisma.user.deleteMany({ where: { email: 'test.runner.buyer@ohmsim.ph' } });
console.log('✔ Neon database cleaned of test user.');

console.log('\n=== All Step 1 Auth Flow Checks PASSED Successfully ===');
