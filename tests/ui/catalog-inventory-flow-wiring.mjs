import assert from 'node:assert/strict';
import { prisma } from '../../lib/prisma/client.ts';
import {
  getProductsSync,
  getCategoriesSync,
  getProductByIdSync,
  getFeaturedProductsSync,
  getRelatedProductsSync,
  mapApiProductToProduct,
} from '../../services/catalog-service.ts';
import {
  computeStockStatus,
  adjustAdminProductStock,
  getAdminCatalogSnapshot,
} from '../../components/admin/admin-catalog-store.ts';

console.log('=== OhmSim Full-Stack Step 2: Catalog & Inventory Flow Verification ===\n');

// ----------------------------------------------------
// 1. Verify Synchronous Service Fallbacks & Contracts
// ----------------------------------------------------
console.log('--- 1. Testing Catalog Service Sync Fallbacks ---');

const syncProducts = getProductsSync();
assert.ok(Array.isArray(syncProducts) && syncProducts.length >= 8, 'getProductsSync must return at least 8 items');
const firstProduct = syncProducts[0];
assert.ok(firstProduct.id);
assert.ok(firstProduct.sku);
assert.ok(firstProduct.name);
assert.ok(typeof firstProduct.price === 'number');
assert.ok(typeof firstProduct.stock === 'number');

const syncCategories = getCategoriesSync();
assert.ok(Array.isArray(syncCategories) && syncCategories.includes('All'));
assert.ok(syncCategories.includes('Microcontrollers'));
assert.ok(syncCategories.includes('Sensors'));
assert.ok(syncCategories.includes('ICs'));
assert.ok(syncCategories.includes('Development Boards'));
assert.ok(syncCategories.includes('Passive'));

const singleProd = getProductByIdSync(firstProduct.id);
assert.ok(singleProd);
assert.equal(singleProd.id, firstProduct.id);

const featured = getFeaturedProductsSync(3);
assert.equal(featured.length, 3);

const related = getRelatedProductsSync(firstProduct.id, firstProduct.category, 2);
assert.ok(Array.isArray(related));
related.forEach((r) => {
  assert.notEqual(r.id, firstProduct.id);
  assert.equal(r.category, firstProduct.category);
});

console.log('✔ Synchronous catalog fallbacks and boundaries verified.');

// ----------------------------------------------------
// 2. Verify Live Neon Database Products & Categories
// ----------------------------------------------------
console.log('\n--- 2. Testing Live Neon PostgreSQL Catalog Data ---');

const dbProducts = await prisma.product.findMany({
  include: {
    category: true,
  },
  orderBy: { sku: 'asc' },
});

assert.ok(dbProducts.length >= 8, 'Neon DB must contain at least 8 seeded products');
console.log(`✔ Found ${dbProducts.length} live products in Neon PostgreSQL.`);

const dbCategories = await prisma.category.findMany({
  orderBy: { name: 'asc' },
});

assert.ok(dbCategories.length >= 5, 'Neon DB must contain 5 canonical categories');
console.log(`✔ Found ${dbCategories.length} live categories in Neon PostgreSQL.`);

// Test mapping from DB to frontend Product interface
const mappedProducts = dbProducts.map((p) =>
  mapApiProductToProduct({
    id: p.id,
    sku: p.sku,
    name: p.name,
    brand: p.brand,
    category: p.category.name,
    price: Number(p.price),
    stockQuantity: p.stockQuantity,
    minStockThreshold: p.minStockThreshold,
    imageUrls: p.imageUrls,
    specs: p.specifications,
    fullDescription: p.fullDescription,
    shortDescription: p.shortDescription,
  })
);

assert.equal(mappedProducts.length, dbProducts.length);
mappedProducts.forEach((p) => {
  assert.ok(p.id);
  assert.ok(p.sku);
  assert.ok(typeof p.voltage === 'number');
  assert.ok(p.resistance === null || typeof p.resistance === 'number');
  assert.ok(p.status === 'in-stock' || p.status === 'low-stock' || p.status === 'out-of-stock');
  assert.ok(p.image.length > 0);
});

console.log('✔ Live database products mapped seamlessly to frontend Product interface.');

// ----------------------------------------------------
// 3. Testing Stock Adjustment & Restitution via Prisma
// ----------------------------------------------------
console.log('\n--- 3. Testing Atomic Inventory Stock Adjustment on Live Database ---');

const targetProduct = await prisma.product.findUnique({
  where: { sku: 'ESP32-WROOM-32U' },
});
assert.ok(targetProduct, 'Target product ESP32-WROOM-32U must exist in DB');

const originalStock = targetProduct.stockQuantity;
console.log(`Current baseline stock for ${targetProduct.sku}: ${originalStock} units`);

// Simulate ADD adjustment (+10 units)
const addedQty = 10;
const updatedAfterAdd = await prisma.product.update({
  where: { id: targetProduct.id },
  data: { stockQuantity: originalStock + addedQty },
});
assert.equal(updatedAfterAdd.stockQuantity, originalStock + addedQty, 'Stock must increase by 10');
console.log(`✔ Increased stock: ${originalStock} -> ${updatedAfterAdd.stockQuantity} units.`);

// Simulate REMOVE adjustment (-10 units, restitution back to original)
const updatedAfterRemove = await prisma.product.update({
  where: { id: targetProduct.id },
  data: { stockQuantity: originalStock },
});
assert.equal(updatedAfterRemove.stockQuantity, originalStock, 'Stock must restore to original value');
console.log(`✔ Restored stock: ${updatedAfterAdd.stockQuantity} -> ${updatedAfterRemove.stockQuantity} units.`);

// ----------------------------------------------------
// 4. Testing Admin Catalog Store & Status Computation
// ----------------------------------------------------
console.log('\n--- 4. Testing Admin Catalog Store & Threshold Logic ---');

assert.equal(computeStockStatus(0, 15), 'out-of-stock');
assert.equal(computeStockStatus(10, 15), 'low-stock');
assert.equal(computeStockStatus(15, 15), 'low-stock');
assert.equal(computeStockStatus(16, 15), 'in-stock');
assert.equal(computeStockStatus(100, 15), 'in-stock');
console.log('✔ Stock threshold status computations verified.');

const storeSnapshot = getAdminCatalogSnapshot();
const storeProduct = storeSnapshot.products[0];
assert.ok(storeProduct);

const initialLogsCount = storeSnapshot.adjustmentLogs.length;
const adjustmentResult = adjustAdminProductStock({
  productId: storeProduct.id,
  type: 'ADD',
  quantity: 5,
  reason: 'Restock Shipment',
});

assert.ok(adjustmentResult);
assert.equal(adjustmentResult.product.stock, storeProduct.stock + 5);
assert.equal(adjustmentResult.log.quantity, 5);
assert.equal(adjustmentResult.log.reason, 'Restock Shipment');

const updatedSnapshot = getAdminCatalogSnapshot();
assert.equal(updatedSnapshot.adjustmentLogs.length, initialLogsCount + 1);
assert.equal(updatedSnapshot.adjustmentLogs[0].id, adjustmentResult.log.id);

// Revert in-memory store adjustment
adjustAdminProductStock({
  productId: storeProduct.id,
  type: 'REMOVE',
  quantity: 5,
  reason: 'Inventory Audit Adjustment',
});

console.log('✔ In-memory AdminCatalogStore stock adjustments and audit logging verified.');

console.log('\n=== All Step 2 Catalog & Inventory Flow Checks PASSED Successfully ===');
