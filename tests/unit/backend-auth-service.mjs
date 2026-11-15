import assert from 'node:assert/strict';
import { hashPassword, verifyPassword } from '../../lib/auth/password.ts';
import { createSessionToken, verifySessionToken } from '../../lib/auth/session.ts';

console.log('--- Testing OhmSim Backend Auth & Cryptography (BE-02) ---');

// 1. Test Password Hashing and Verification
const plainPassword = 'SuperSecretPassword2026!';
const hashedPassword = await hashPassword(plainPassword);

assert.ok(hashedPassword.startsWith('$2'), 'Bcrypt hash should start with $2');
assert.notEqual(hashedPassword, plainPassword, 'Hash must not match plain text');

const isMatchValid = await verifyPassword(plainPassword, hashedPassword);
assert.equal(isMatchValid, true, 'Valid password verification must return true');

const isMatchInvalid = await verifyPassword('WrongPassword123!', hashedPassword);
assert.equal(isMatchInvalid, false, 'Invalid password verification must return false');

console.log('✔ Password hashing & bcrypt verification passed.');

// 2. Test Session JWT Token Signing and Verification
const mockPayload = {
  userId: 'usr-test-1234',
  email: 'tester@ohmsim.ph',
  role: 'BUYER',
  firstName: 'Test',
  lastName: 'Engineer'
};

const token = await createSessionToken(mockPayload);
assert.ok(typeof token === 'string' && token.length > 20, 'Token must be a non-empty string');

const decoded = await verifySessionToken(token);
assert.ok(decoded !== null, 'Decoded token payload must not be null');
assert.equal(decoded.userId, mockPayload.userId, 'Decoded userId must match');
assert.equal(decoded.email, mockPayload.email, 'Decoded email must match');
assert.equal(decoded.role, mockPayload.role, 'Decoded role must match');
assert.equal(decoded.firstName, mockPayload.firstName, 'Decoded firstName must match');
assert.equal(decoded.lastName, mockPayload.lastName, 'Decoded lastName must match');

console.log('✔ Session JWT signing & verification passed.');

// 3. Test Invalid Token Verification
const invalidDecoded = await verifySessionToken('invalid.token.string');
assert.equal(invalidDecoded, null, 'Invalid token must return null');

console.log('✔ Invalid token rejection passed.');
console.log('--- All BE-02 Auth Unit Tests PASSED Successfully ---');
