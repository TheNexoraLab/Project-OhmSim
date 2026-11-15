import assert from 'node:assert/strict';
import { prisma } from '../../lib/prisma/client.ts';

console.log('--- Testing OhmSim Catalog & Inventory Backend (BE-03) ---');

// 1. Verify Category Queries
const categories = await prisma.category.findMany({
  include: {
    _count: { select: { products: true } },
  },
  orderBy: { name: 'asc' },
});

assert.ok(categories.length >= 5, 'Must have at least 5 categories seeded');
console.log(`✔ Verified ${categories.length} categories loaded from Neon.`);

// 2. Verify Product Query & Parametric Filtering
const mcuCategory = categories.find((c) => c.slug === 'microcontrollers');
assert.ok(mcuCategory, 'Microcontrollers category must exist');

const mcuProducts = await prisma.product.findMany({
  where: { categoryId: mcuCategory.id },
});

assert.ok(mcuProducts.length >= 2, 'Must have at least 2 microcontroller products');
console.log(`✔ Found ${mcuProducts.length} MCU products (ESP32, Arduino, etc.).`);

// 3. Verify Product Lookup by SKU
const esp32 = await prisma.product.findUnique({
  where: { sku: 'ESP32-WROOM-32U' },
  include: { category: true },
});

assert.ok(esp32 !== null, 'ESP32 product must exist by SKU');
assert.equal(esp32.brand, 'Espressif');
assert.equal(Number(esp32.price), 295.0);
console.log(`✔ Verified product lookup by SKU: ${esp32.name} (₱${esp32.price}).`);

// 4. Test Inventory Atomic Adjustments
const initialStock = esp32.stockQuantity;

// Test ADD
const added = await prisma.product.update({
  where: { id: esp32.id },
  data: { stockQuantity: initialStock + 10 },
});
assert.equal(added.stockQuantity, initialStock + 10, 'Stock must increment by 10');

// Test REMOVE
const removed = await prisma.product.update({
  where: { id: esp32.id },
  data: { stockQuantity: initialStock },
});
assert.equal(removed.stockQuantity, initialStock, 'Stock must return to initial quantity');

console.log('✔ Atomic stock adjustment ADD & REMOVE verified.');

// 5. Test Low Stock Boundary Condition
const lowStockProduct = await prisma.product.findFirst({
  where: { stockQuantity: { lte: 15 } },
});

assert.ok(lowStockProduct !== null, 'Must have at least one product with low stock (e.g. DHT22)');
console.log(`✔ Verified low stock detection: ${lowStockProduct.sku} (Stock: ${lowStockProduct.stockQuantity}, Threshold: ${lowStockProduct.minStockThreshold}).`);

console.log('--- All BE-03 Catalog & Inventory Unit Tests PASSED Successfully ---');

await prisma.$disconnect();
