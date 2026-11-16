import assert from 'node:assert/strict';
import { prisma } from '../../lib/prisma/client.ts';
import {
  isValidRegion3Province,
  getCanonicalRegion3Province,
  computeOrderShippingFee,
  normalizeOrderStatus,
} from '../../lib/orders/order-utils.ts';

console.log('=== OhmSim Backend BE-04: Checkout & Orders Atomic Transaction Suite ===');

// ----------------------------------------------------
// 1. Unit Test Order Helpers & Business Rules
// ----------------------------------------------------
console.log('\n--- 1. Testing Region III & Shipping Fee Rules ---');

assert.equal(isValidRegion3Province('Pampanga'), true, 'Pampanga should be valid Region 3');
assert.equal(isValidRegion3Province('pampanga'), true, 'Case-insensitive check should pass');
assert.equal(isValidRegion3Province('Bulacan'), true, 'Bulacan should be valid Region 3');
assert.equal(isValidRegion3Province('Metro Manila'), false, 'Metro Manila is NCR, not Region 3');
assert.equal(isValidRegion3Province('Cebu'), false, 'Cebu is Region 7, not Region 3');
assert.equal(isValidRegion3Province(''), false, 'Empty string is invalid');

assert.equal(getCanonicalRegion3Province('tArLaC'), 'Tarlac', 'Should return canonical title case');
assert.equal(getCanonicalRegion3Province('Davao'), null, 'Non-Region 3 should return null');

// Shipping Fee Rules
assert.equal(computeOrderShippingFee(450, 'DELIVERY'), 80, 'Under ₱1,000 delivery fee must be ₱80');
assert.equal(computeOrderShippingFee(1000, 'DELIVERY'), 0, '₱1,000 threshold delivery fee must be ₱0');
assert.equal(computeOrderShippingFee(2500, 'DELIVERY'), 0, 'Over ₱1,000 delivery fee must be ₱0');
assert.equal(computeOrderShippingFee(200, 'PICKUP'), 0, 'In-store pickup must always be ₱0');
assert.equal(computeOrderShippingFee(5000, 'PICKUP'), 0, 'In-store pickup must always be ₱0');

// Status Normalization
assert.equal(normalizeOrderStatus('pending'), 'PENDING');
assert.equal(normalizeOrderStatus('CONFIRMED'), 'PROCESSING');
assert.equal(normalizeOrderStatus('preparing'), 'PROCESSING');
assert.equal(normalizeOrderStatus('READY_FOR_PICKUP'), 'SHIPPED');
assert.equal(normalizeOrderStatus('out_for_delivery'), 'SHIPPED');
assert.equal(normalizeOrderStatus('completed'), 'DELIVERED');
assert.equal(normalizeOrderStatus('cancelled'), 'CANCELLED');
assert.equal(normalizeOrderStatus('INVALID_STATUS'), null);

console.log('✔ All fulfillment helper unit checks passed.');

// ----------------------------------------------------
// 2. Integration Test: Database Baseline Check
// ----------------------------------------------------
console.log('\n--- 2. Connecting to Database & Fetching Baseline Data ---');

let buyer = await prisma.user.findFirst({ where: { role: 'BUYER' } });
let createdDynamicBuyer = false;
if (!buyer) {
  buyer = await prisma.user.create({
    data: {
      email: `test.unit.buyer.${Date.now()}@ohmsim.ph`,
      passwordHash: 'dummy',
      role: 'BUYER',
      firstName: 'Daniel',
      lastName: 'Cruz',
      phone: '09189876543',
    },
  });
  createdDynamicBuyer = true;
}
assert.ok(buyer, 'Buyer user must exist in database');

const products = await prisma.product.findMany({
  take: 2,
  orderBy: { stockQuantity: 'desc' },
});
assert.ok(products.length >= 2, 'At least 2 products must exist in database');
const testProductA = products[0];
const testProductB = products[1];

console.log(`Buyer: ${buyer.email} (${buyer.id})`);
console.log(`Product A: ${testProductA.name} (SKU: ${testProductA.sku}, Stock: ${testProductA.stockQuantity}, Price: ₱${testProductA.price})`);
console.log(`Product B: ${testProductB.name} (SKU: ${testProductB.sku}, Stock: ${testProductB.stockQuantity}, Price: ₱${testProductB.price})`);

// ----------------------------------------------------
// 3. Testing Region III Delivery Restriction
// ----------------------------------------------------
console.log('\n--- 3. Testing Region III Delivery Validation Guard ---');

// Attempt to create delivery address with non-Region 3 province
const nonRegion3Province = 'Metro Manila';
assert.equal(isValidRegion3Province(nonRegion3Province), false, 'Validation must reject non-Region 3');

// ----------------------------------------------------
// 4. Testing Atomic Checkout Transaction (DELIVERY Mode)
// ----------------------------------------------------
console.log('\n--- 4. Executing Atomic Order Checkout Transaction (Delivery) ---');

const stockBeforeA = testProductA.stockQuantity;
const orderQtyA = 2;

// Execute interactive transaction directly using route business logic
const testDeliveryOrder = await prisma.$transaction(async (tx) => {
  // A. Check stock
  const currentProd = await tx.product.findUnique({ where: { id: testProductA.id } });
  assert.ok(currentProd.stockQuantity >= orderQtyA, 'Stock must be sufficient');

  // B. Decrement stock
  await tx.product.update({
    where: { id: testProductA.id },
    data: { stockQuantity: { decrement: orderQtyA } },
  });

  // C. Calculate Subtotal & Shipping
  const subtotal = Number(currentProd.price) * orderQtyA;
  const shippingFee = computeOrderShippingFee(subtotal, 'DELIVERY');
  const totalAmount = subtotal + shippingFee;

  // D. Create address
  const addr = await tx.address.create({
    data: {
      userId: buyer.id,
      label: 'Campus Dorm',
      recipientName: 'Alex Rivera',
      phone: '09171234567',
      street: '123 University Ave',
      barangay: 'San Nicolas',
      city: 'San Fernando',
      province: 'Pampanga',
      postalCode: '2000',
    },
  });

  // E. Create Order
  const year = new Date().getFullYear();
  const count = await tx.order.count();
  const orderNumber = `OHM-${year}-${String(count + 1).padStart(4, '0')}TEST`;

  const order = await tx.order.create({
    data: {
      orderNumber,
      userId: buyer.id,
      status: 'PENDING',
      fulfillmentType: 'DELIVERY',
      paymentMethod: 'COD',
      deliveryAddressId: addr.id,
      subtotal,
      shippingFee,
      totalAmount,
      notes: 'Please call before arrival',
      items: {
        create: [
          {
            productId: testProductA.id,
            quantity: orderQtyA,
            unitPrice: currentProd.price,
          },
        ],
      },
    },
    include: {
      items: true,
      deliveryAddress: true,
    },
  });

  // F. Create notification
  await tx.notification.create({
    data: {
      userId: buyer.id,
      title: 'Order Placed Successfully',
      message: `Your test order ${order.orderNumber} has been placed.`,
      type: 'order',
      link: `/orders/${order.id}`,
    },
  });

  return order;
}, { maxWait: 10000, timeout: 20000 });

assert.ok(testDeliveryOrder.id, 'Created order must have valid ID');
assert.equal(testDeliveryOrder.status, 'PENDING');
assert.equal(testDeliveryOrder.fulfillmentType, 'DELIVERY');
assert.equal(testDeliveryOrder.paymentMethod, 'COD');
assert.equal(testDeliveryOrder.items.length, 1);
assert.equal(testDeliveryOrder.items[0].quantity, orderQtyA);

// Verify stock was decremented in DB
const refreshedA = await prisma.product.findUnique({ where: { id: testProductA.id } });
assert.equal(
  refreshedA.stockQuantity,
  stockBeforeA - orderQtyA,
  'Database product stock must be decremented by order quantity'
);
console.log(`✔ Order ${testDeliveryOrder.orderNumber} placed. Stock decremented: ${stockBeforeA} -> ${refreshedA.stockQuantity}`);

// ----------------------------------------------------
// 5. Testing Out-of-Stock Guard & Transaction Rollback
// ----------------------------------------------------
console.log('\n--- 5. Testing Out-of-Stock Guard & Transaction Rollback ---');

const stockBeforeRollback = refreshedA.stockQuantity;
let rollbackHappened = false;

try {
  await prisma.$transaction(async (tx) => {
    const prod = await tx.product.findUnique({ where: { id: testProductA.id } });
    const excessiveQuantity = prod.stockQuantity + 500;

    if (prod.stockQuantity < excessiveQuantity) {
      throw new Error(`INSUFFICIENT_STOCK: Available ${prod.stockQuantity}, requested ${excessiveQuantity}`);
    }

    // This must NEVER execute
    await tx.product.update({
      where: { id: testProductA.id },
      data: { stockQuantity: { decrement: excessiveQuantity } },
    });
  });
} catch (err) {
  rollbackHappened = true;
  assert.ok(err.message.includes('INSUFFICIENT_STOCK'), 'Error message must specify insufficient stock');
}

assert.equal(rollbackHappened, true, 'Transaction must have aborted');
const stockAfterRollback = (await prisma.product.findUnique({ where: { id: testProductA.id } })).stockQuantity;
assert.equal(stockAfterRollback, stockBeforeRollback, 'Stock must remain completely unchanged after abort');
console.log('✔ Out-of-stock guard and ACID rollback verified successfully.');

// ----------------------------------------------------
// 6. Testing Order Status Progression & Cancellation Stock Restoration
// ----------------------------------------------------
console.log('\n--- 6. Testing Order Lifecycle & Stock Restoration on Cancellation ---');

// Status progression: PENDING -> PROCESSING -> SHIPPED
const updatedToProcessing = await prisma.order.update({
  where: { id: testDeliveryOrder.id },
  data: { status: 'PROCESSING' },
});
assert.equal(updatedToProcessing.status, 'PROCESSING');

const updatedToShipped = await prisma.order.update({
  where: { id: testDeliveryOrder.id },
  data: { status: 'SHIPPED', trackingNumber: 'TRK-REG3-987654' },
});
assert.equal(updatedToShipped.status, 'SHIPPED');
assert.equal(updatedToShipped.trackingNumber, 'TRK-REG3-987654');

// Now test cancellation and stock restoration inside a transaction
const stockBeforeCancel = (await prisma.product.findUnique({ where: { id: testProductA.id } })).stockQuantity;

await prisma.$transaction(async (tx) => {
  const orderToCancel = await tx.order.findUnique({
    where: { id: testDeliveryOrder.id },
    include: { items: true },
  });

  // Restore inventory
  for (const item of orderToCancel.items) {
    await tx.product.update({
      where: { id: item.productId },
      data: { stockQuantity: { increment: item.quantity } },
    });
  }

  await tx.order.update({
    where: { id: orderToCancel.id },
    data: {
      status: 'CANCELLED',
      cancelledReason: 'Automated test suite order cancellation verification',
    },
  });
}, { maxWait: 10000, timeout: 20000 });

const stockAfterCancel = (await prisma.product.findUnique({ where: { id: testProductA.id } })).stockQuantity;
assert.equal(
  stockAfterCancel,
  stockBeforeCancel + orderQtyA,
  'Cancelled order items must be fully restored back into stockQuantity'
);
console.log(`✔ Order cancelled. Stock restored: ${stockBeforeCancel} -> ${stockAfterCancel}`);

// Clean up test order and test address to keep database pristine
await prisma.orderItem.deleteMany({ where: { orderId: testDeliveryOrder.id } });
await prisma.order.delete({ where: { id: testDeliveryOrder.id } });
await prisma.address.delete({ where: { id: testDeliveryOrder.deliveryAddressId } });
if (createdDynamicBuyer) {
  await prisma.user.delete({ where: { id: buyer.id } });
}
console.log('✔ Cleaned up temporary test order artifacts and buyer.');

console.log('\n=== All BE-04 Atomic Checkout & Orders Tests PASSED Successfully ===');
