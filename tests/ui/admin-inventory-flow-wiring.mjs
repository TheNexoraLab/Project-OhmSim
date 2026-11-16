import assert from 'node:assert/strict';

try {
  process.loadEnvFile?.('.env.local');
} catch {}
try {
  process.loadEnvFile?.('.env');
} catch {}

const { prisma } = await import('../../lib/prisma/client.ts');
const {
  computeStockStatus,
  getInitialInventorySync,
} = await import('../../services/inventory-service.ts');
const {
  GET: getInventoryHandler,
  PATCH: patchInventoryHandler,
} = await import('../../app/api/inventory/route.ts');

console.log('=== OhmSim: Admin Inventory & Stock Control Flow Verification ===\n');

// ----------------------------------------------------
// 1. Test Synchronous Fallback & Safety Status Logic
// ----------------------------------------------------
console.log('--- 1. Testing Stock Status Calculation & Synchronous Fallback ---');

assert.equal(computeStockStatus(0, 15), 'out-of-stock', '0 stock must be out-of-stock');
assert.equal(computeStockStatus(-5, 15), 'out-of-stock', 'Negative stock must be out-of-stock');
assert.equal(computeStockStatus(10, 15), 'low-stock', 'Stock <= threshold must be low-stock');
assert.equal(computeStockStatus(15, 15), 'low-stock', 'Stock equal to threshold must be low-stock');
assert.equal(computeStockStatus(16, 15), 'in-stock', 'Stock > threshold must be in-stock');
assert.equal(computeStockStatus(100, 15), 'in-stock', 'High stock must be in-stock');

const syncItems = getInitialInventorySync();
assert.ok(Array.isArray(syncItems) && syncItems.length > 0, 'Synchronous inventory items must exist');
const sampleItem = syncItems[0];
assert.ok(sampleItem.sku && sampleItem.name, 'Sample item must contain sku and name');
assert.equal(typeof sampleItem.stock, 'number', 'Item stock must be a number');
assert.equal(typeof sampleItem.minThreshold, 'number', 'Item minThreshold must be a number');

console.log(`✔ Stock status computation and ${syncItems.length} synchronous items verified.`);

// ----------------------------------------------------
// 2. Testing Live GET /api/inventory Endpoint
// ----------------------------------------------------
console.log('\n--- 2. Testing Live GET /api/inventory Endpoint & Metrics ---');

const getReq = new Request('http://localhost:3000/api/inventory');
const getRes = await getInventoryHandler(getReq);
assert.equal(getRes.status, 200, 'GET /api/inventory must return 200');

const getData = await getRes.json();
assert.ok(Array.isArray(getData.items), 'Response must contain items array');
assert.ok(typeof getData.total === 'number', 'Response must contain total number');
assert.ok(getData.metrics, 'Response must contain metrics object');
assert.equal(typeof getData.metrics.totalSKUs, 'number', 'Metrics must have totalSKUs');
assert.equal(typeof getData.metrics.lowStockCount, 'number', 'Metrics must have lowStockCount');
assert.equal(typeof getData.metrics.outOfStockCount, 'number', 'Metrics must have outOfStockCount');

console.log(`✔ GET /api/inventory verified: ${getData.items.length} live SKUs, ${getData.metrics.lowStockCount} low stock, ${getData.metrics.outOfStockCount} out of stock.`);

// ----------------------------------------------------
// 3. Testing PATCH /api/inventory Stock Adjustments
// ----------------------------------------------------
console.log('\n--- 3. Testing Live PATCH /api/inventory Stock Adjustments ---');

// Create or find a test category and test product in Neon PostgreSQL
const testCategory = await prisma.category.upsert({
  where: { slug: 'inventory-test-cat' },
  update: {},
  create: {
    name: 'Inventory Test Category',
    slug: 'inventory-test-cat',
    description: 'Automated inventory verification category',
  },
});

const testSku = 'TEST-INV-SKU-001';
await prisma.product.deleteMany({ where: { sku: testSku } });

const testProduct = await prisma.product.create({
  data: {
    sku: testSku,
    name: 'Precision Pressure Sensor Module',
    brand: 'OhmSim SensorTech',
    categoryId: testCategory.id,
    price: 320.0,
    stockQuantity: 10,
    minStockThreshold: 15,
    shortDescription: 'Test pressure sensor for inventory telemetry testing',
    fullDescription: 'Test component designed for automated inventory stock adjustments verification.',
  },
});

// A. Test "ADD" Stock Adjustment (+20 units)
const addReq = new Request('http://localhost:3000/api/inventory', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    productId: testProduct.id,
    sku: testSku,
    type: 'ADD',
    quantity: 20,
    reason: 'Restock Shipment',
  }),
});
const addRes = await patchInventoryHandler(addReq);
assert.equal(addRes.status, 200, 'PATCH ADD must return 200');
const addData = await addRes.json();
assert.equal(addData.success, true);
assert.equal(addData.previousStock, 10);
assert.equal(addData.newStock, 30);
assert.equal(addData.status, 'in-stock');
assert.equal(addData.adjustment.type, 'ADD');

// Verify database reflects 30 units
const dbAfterAdd = await prisma.product.findUnique({ where: { id: testProduct.id } });
assert.equal(dbAfterAdd.stockQuantity, 30, 'DB stock must be 30 after ADD');
console.log('✔ Stock ADD adjustment verified (10 → 30 units, in-stock).');

// B. Test "REMOVE" Stock Adjustment (-18 units -> 12 units <= 15 minThreshold)
const removeReq = new Request('http://localhost:3000/api/inventory', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    productId: testProduct.id,
    sku: testSku,
    type: 'REMOVE',
    quantity: 18,
    reason: 'Damaged / Defective',
  }),
});
const removeRes = await patchInventoryHandler(removeReq);
assert.equal(removeRes.status, 200, 'PATCH REMOVE must return 200');
const removeData = await removeRes.json();
assert.equal(removeData.previousStock, 30);
assert.equal(removeData.newStock, 12);
assert.equal(removeData.status, 'low-stock', '12 units with 15 threshold must be low-stock');

const dbAfterRemove = await prisma.product.findUnique({ where: { id: testProduct.id } });
assert.equal(dbAfterRemove.stockQuantity, 12, 'DB stock must be 12 after REMOVE');
console.log('✔ Stock REMOVE adjustment verified (30 → 12 units, low-stock trigger).');

// C. Test "SET" Exact Count Adjustment (Set to 0 -> depleted / out-of-stock)
const setReq = new Request('http://localhost:3000/api/inventory', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    productId: testProduct.id,
    sku: testSku,
    type: 'SET',
    quantity: 0,
    reason: 'Inventory Audit Adjustment',
  }),
});
const setRes = await patchInventoryHandler(setReq);
assert.equal(setRes.status, 200, 'PATCH SET must return 200');
const setData = await setRes.json();
assert.equal(setData.previousStock, 12);
assert.equal(setData.newStock, 0);
assert.equal(setData.status, 'out-of-stock', '0 units must be out-of-stock');

const dbAfterSet = await prisma.product.findUnique({ where: { id: testProduct.id } });
assert.equal(dbAfterSet.stockQuantity, 0, 'DB stock must be 0 after SET');
console.log('✔ Stock SET adjustment verified (12 → 0 units, out-of-stock trigger).');

// D. Test Non-negative Clamping (Removing 50 when stock is 0 remains 0)
const clampReq = new Request('http://localhost:3000/api/inventory', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    productId: testProduct.id,
    sku: testSku,
    type: 'REMOVE',
    quantity: 50,
    reason: 'Damaged / Defective',
  }),
});
const clampRes = await patchInventoryHandler(clampReq);
assert.equal(clampRes.status, 200);
const clampData = await clampRes.json();
assert.equal(clampData.newStock, 0, 'Stock cannot go below 0');
console.log('✔ Non-negative clamping verified (removing from 0 remains 0).');

// ----------------------------------------------------
// 4. Test Error Handling & Input Validation
// ----------------------------------------------------
console.log('\n--- 4. Testing Input Validation & Error Handling ---');

// Missing product identifier
const noIdReq = new Request('http://localhost:3000/api/inventory', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ type: 'ADD', quantity: 10 }),
});
const noIdRes = await patchInventoryHandler(noIdReq);
assert.equal(noIdRes.status, 400, 'Missing productId/sku must return 400');

// Invalid adjustment type
const badTypeReq = new Request('http://localhost:3000/api/inventory', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ sku: testSku, type: 'MULTIPLY', quantity: 10 }),
});
const badTypeRes = await patchInventoryHandler(badTypeReq);
assert.equal(badTypeRes.status, 400, 'Invalid adjustment type must return 400');

// Negative quantity
const negQtyReq = new Request('http://localhost:3000/api/inventory', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ sku: testSku, type: 'ADD', quantity: -10 }),
});
const negQtyRes = await patchInventoryHandler(negQtyReq);
assert.equal(negQtyRes.status, 400, 'Negative quantity must return 400');

// Non-existent product
const nonExistentReq = new Request('http://localhost:3000/api/inventory', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ sku: 'NON-EXISTENT-SKU-999', type: 'ADD', quantity: 10 }),
});
const nonExistentRes = await patchInventoryHandler(nonExistentReq);
assert.equal(nonExistentRes.status, 404, 'Non-existent product must return 404');

console.log('✔ Validation: 400 on missing ID, 400 on invalid type, 400 on negative qty, 404 on unknown SKU.');

// ----------------------------------------------------
// 5. Cleanup
// ----------------------------------------------------
console.log('\n--- 5. Cleanup Test Records ---');
await prisma.product.deleteMany({ where: { sku: testSku } });
await prisma.category.deleteMany({ where: { slug: 'inventory-test-cat' } });
console.log('✔ Test product and category cleaned up from PostgreSQL.');

console.log('\n=== All Admin Inventory & Stock Control Checks PASSED Successfully ===');

await prisma.$disconnect();
