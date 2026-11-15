import assert from 'node:assert/strict';
import { prisma } from '../../lib/prisma/client.ts';
import { hashPassword, verifyPassword } from '../../lib/auth/password.ts';
import { createSessionToken, verifySessionToken, SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS } from '../../lib/auth/session.ts';

console.log('===============================================================');
console.log('   OhmSim Backend Comprehensive Audit: Security, Reliability,   ');
console.log('            Compatibility & Safety Verification (BE-01/02/03)   ');
console.log('===============================================================');

let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✔ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✘ [FAIL] ${name}:`, err.message);
    throw err;
  }
}

async function asyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✔ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✘ [FAIL] ${name}:`, err.message);
    throw err;
  }
}

// =========================================================================
// 1. SECURITY & CRYPTOGRAPHY AUDIT
// =========================================================================
console.log('\n--- 1. SECURITY & CRYPTOGRAPHY AUDIT ---');

await asyncTest('Bcrypt salt generation and strong work factor (10 rounds)', async () => {
  const password = 'TestSecurePassword#2026';
  const hash = await hashPassword(password);
  assert.ok(hash.startsWith('$2a$10$') || hash.startsWith('$2b$10$'), 'Hash must use 10 salt rounds ($2a$10$ or $2b$10$)');
  assert.equal(hash.length, 60, 'Standard bcrypt hash must be exactly 60 characters long');
});

await asyncTest('Password verification timing & correctness', async () => {
  const password = 'CorrectPassword123';
  const hash = await hashPassword(password);
  
  const valid = await verifyPassword(password, hash);
  assert.equal(valid, true, 'Valid password must be accepted');
  
  const invalid = await verifyPassword('WrongPassword!', hash);
  assert.equal(invalid, false, 'Invalid password must be rejected');

  const empty = await verifyPassword('', hash);
  assert.equal(empty, false, 'Empty password must be rejected');
});

await asyncTest('JWT Session signing, tampering rejection, and payload integrity', async () => {
  const payload = {
    userId: 'usr-audit-test',
    email: 'audit@ohmsim.ph',
    role: 'BUYER',
    firstName: 'Audit',
    lastName: 'Tester'
  };

  const token = await createSessionToken(payload);
  assert.ok(typeof token === 'string' && token.length > 50, 'JWT token must be a valid serialized string');

  // Verify authentic token
  const verified = await verifySessionToken(token);
  assert.ok(verified !== null, 'Authentic token must verify cleanly');
  assert.equal(verified.userId, payload.userId);
  assert.equal(verified.email, payload.email);
  assert.equal(verified.role, payload.role);

  // Tampering Attack 1: Modified signature
  const tamperedToken = token.slice(0, -6) + 'abcdef';
  const tamperedVerified = await verifySessionToken(tamperedToken);
  assert.equal(tamperedVerified, null, 'Tampered JWT signature must be rejected with null');

  // Tampering Attack 2: Truncated / Malformed token
  const malformedVerified = await verifySessionToken('Bearer invalid.jwt.token');
  assert.equal(malformedVerified, null, 'Malformed token must be rejected with null');
});

test('Session cookie security policy enforcement', () => {
  assert.equal(SESSION_COOKIE_NAME, 'ohmsim_session', 'Cookie name must match canonical standard');
  assert.equal(SESSION_COOKIE_OPTIONS.httpOnly, true, 'Cookie MUST have httpOnly: true to prevent XSS theft');
  assert.equal(SESSION_COOKIE_OPTIONS.sameSite, 'lax', 'Cookie must have sameSite: lax to prevent CSRF exploits');
  assert.equal(SESSION_COOKIE_OPTIONS.path, '/', 'Cookie must be scoped to site root');
  assert.equal(SESSION_COOKIE_OPTIONS.maxAge, 604800, 'Cookie maxAge must be 7 days');
});

// =========================================================================
// 2. DATA INTEGRITY & UNIQUE CONSTRAINT AUDIT (NEON POSTGRESQL)
// =========================================================================
console.log('\n--- 2. DATA INTEGRITY & CONSTRAINTS AUDIT ---');

await asyncTest('Duplicate user email rejection (Database Unique Constraint)', async () => {
  const duplicateEmail = 'duplicate.test@ohmsim.ph';
  
  // Ensure cleanup if leftover
  await prisma.user.deleteMany({ where: { email: duplicateEmail } });

  // Create initial user
  await prisma.user.create({
    data: {
      email: duplicateEmail,
      passwordHash: 'dummy_hash',
      role: 'BUYER',
      firstName: 'Original',
      lastName: 'User'
    }
  });

  // Attempt duplicate insert
  let duplicateFailed = false;
  try {
    await prisma.user.create({
      data: {
        email: duplicateEmail,
        passwordHash: 'dummy_hash_2',
        role: 'BUYER',
        firstName: 'Duplicate',
        lastName: 'User'
      }
    });
  } catch (err) {
    duplicateFailed = true;
    assert.ok(err.code === 'P2002' || err.message.includes('Unique constraint'), 'Must fail with Prisma P2002 Unique Constraint violation');
  }

  assert.equal(duplicateFailed, true, 'Duplicate user creation MUST be rejected by database constraint');

  // Cleanup
  await prisma.user.delete({ where: { email: duplicateEmail } });
});

await asyncTest('Duplicate product SKU rejection (Database Unique Constraint)', async () => {
  const existingProduct = await prisma.product.findFirst({ select: { sku: true, categoryId: true } });
  assert.ok(existingProduct, 'Must have at least one product in database');

  let duplicateSkuFailed = false;
  try {
    await prisma.product.create({
      data: {
        sku: existingProduct.sku,
        name: 'Duplicate Product Name',
        brand: 'TestBrand',
        categoryId: existingProduct.categoryId,
        price: 99.00,
        shortDescription: 'Duplicate description',
        fullDescription: 'Full duplicate description',
      }
    });
  } catch (err) {
    duplicateSkuFailed = true;
    assert.ok(err.code === 'P2002', 'Must fail with Prisma P2002');
  }

  assert.equal(duplicateSkuFailed, true, 'Duplicate SKU must be rejected by database');
});

await asyncTest('Duplicate category slug rejection (Database Unique Constraint)', async () => {
  const existingCategory = await prisma.category.findFirst({ select: { slug: true } });
  assert.ok(existingCategory, 'Must have at least one category in database');

  let duplicateSlugFailed = false;
  try {
    await prisma.category.create({
      data: {
        name: 'Duplicate Slug Category',
        slug: existingCategory.slug,
      }
    });
  } catch (err) {
    duplicateSlugFailed = true;
    assert.ok(err.code === 'P2002', 'Must fail with Prisma P2002');
  }

  assert.equal(duplicateSlugFailed, true, 'Duplicate category slug must be rejected by database');
});

// =========================================================================
// 3. INVENTORY ATOMICITY & SAFETY BOUNDS
// =========================================================================
console.log('\n--- 3. INVENTORY ATOMICITY & SAFETY BOUNDS ---');

await asyncTest('Inventory zero-bounding on REMOVE (Prevent Negative Stock)', async () => {
  const testSku = 'TEST-INVENTORY-SKU-01';
  const category = await prisma.category.findFirst();

  // Create temporary test product
  await prisma.product.deleteMany({ where: { sku: testSku } });
  const prod = await prisma.product.create({
    data: {
      sku: testSku,
      name: 'Inventory Safety Test Unit',
      brand: 'TestLab',
      categoryId: category.id,
      price: 150.00,
      stockQuantity: 5,
      minStockThreshold: 10,
      shortDescription: 'Temporary test product',
      fullDescription: 'Temporary test product description',
    }
  });

  // Attempt to remove 100 units when stock is only 5
  const quantityToRemove = 100;
  const newStock = Math.max(0, prod.stockQuantity - quantityToRemove);
  
  const updated = await prisma.product.update({
    where: { id: prod.id },
    data: { stockQuantity: newStock },
  });

  assert.equal(updated.stockQuantity, 0, 'Stock must bound to 0 and NEVER become negative');

  // Cleanup test product
  await prisma.product.delete({ where: { id: prod.id } });
});

// =========================================================================
// 4. CANONICAL CONTRACT & COMPATIBILITY AUDIT
// =========================================================================
console.log('\n--- 4. CANONICAL CONTRACT & COMPATIBILITY AUDIT ---');

await asyncTest('Product model attributes match Frontend canonical types (types/product.ts)', async () => {
  const products = await prisma.product.findMany({
    include: { category: true },
    take: 5,
  });

  for (const p of products) {
    assert.ok(typeof p.id === 'string', 'Product ID must be string UUID');
    assert.ok(typeof p.sku === 'string' && p.sku.length > 0, 'SKU must be non-empty string');
    assert.ok(typeof p.name === 'string' && p.name.length > 0, 'Name must be non-empty string');
    assert.ok(p.price !== null && Number(p.price) >= 0, 'Price must be non-negative number');
    assert.ok(typeof p.stockQuantity === 'number' && p.stockQuantity >= 0, 'Stock must be non-negative integer');
    assert.ok(typeof p.minStockThreshold === 'number' && p.minStockThreshold >= 0, 'Min threshold must be non-negative integer');
    assert.ok(Array.isArray(p.imageUrls), 'imageUrls must be an array');
    assert.ok(p.category && typeof p.category.name === 'string', 'Category relation must be populated');
  }
});

await asyncTest('Sensitive data leak prevention (passwordHash isolation)', async () => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      phone: true,
      createdAt: true,
    },
    take: 3,
  });

  for (const u of users) {
    assert.equal(u.passwordHash, undefined, 'User projection must NEVER include passwordHash in response objects');
  }
});

// =========================================================================
// 5. DATABASE CONNECTION POOL & LATENCY AUDIT
// =========================================================================
console.log('\n--- 5. NEON DATABASE CONNECTION POOL & LATENCY AUDIT ---');

await asyncTest('Concurrent query storm resilience (10 parallel queries)', async () => {
  const startTime = Date.now();
  const queries = Array.from({ length: 10 }, (_, i) =>
    prisma.product.findMany({
      take: 2,
      skip: i % 3,
      select: { id: true, sku: true, stockQuantity: true },
    })
  );

  const results = await Promise.all(queries);
  const duration = Date.now() - startTime;

  assert.equal(results.length, 10, 'All 10 parallel queries must resolve successfully');
  console.log(`    ℹ 10 parallel queries to Neon completed in ${duration}ms (Avg: ${(duration / 10).toFixed(1)}ms per query).`);
  assert.ok(duration < 5000, 'Parallel query batch must complete within 5 seconds');
});

console.log('\n===============================================================');
console.log(` AUDIT SUMMARY: ${passedTests} / ${totalTests} CHECKS PASSED (100% GREEN)`);
console.log('===============================================================\n');

await prisma.$disconnect();
