import assert from 'node:assert/strict';
import { prisma } from '../../lib/prisma/client.ts';
import {
  computeDeliveryFee,
  getTimelineStepsForOrder,
  getMockOrders,
  getMockOrderById,
  filterMockOrders,
  mapApiOrderToMockOrder,
} from '../../services/order-service.ts';

console.log('=== OhmSim Full-Stack Step 3: Orders, Cart & Atomic Checkout Wiring Verification ===\n');

// ----------------------------------------------------
// 1. Verify Fulfillment & Business Rules (BR-045, BR-046)
// ----------------------------------------------------
console.log('--- 1. Testing Fulfillment Fee & Timeline Rules (BR-046) ---');

// Pickup is strictly FREE
assert.equal(computeDeliveryFee(100, 'PICKUP'), 0, 'Pickup delivery fee must be ₱0');
assert.equal(computeDeliveryFee(2500, 'PICKUP'), 0, 'Pickup delivery fee must be ₱0');

// Delivery subtotal < ₱1000 is ₱80 standard fee
assert.equal(computeDeliveryFee(0, 'DELIVERY'), 80, 'Delivery fee below ₱1,000 must be ₱80');
assert.equal(computeDeliveryFee(295, 'DELIVERY'), 80, 'Delivery fee below ₱1,000 must be ₱80');
assert.equal(computeDeliveryFee(999, 'DELIVERY'), 80, 'Delivery fee below ₱1,000 must be ₱80');

// Delivery subtotal >= ₱1000 is ₱0 free shipping
assert.equal(computeDeliveryFee(1000, 'DELIVERY'), 0, 'Delivery fee at ₱1,000 must be ₱0 (FREE)');
assert.equal(computeDeliveryFee(2500, 'DELIVERY'), 0, 'Delivery fee above ₱1,000 must be ₱0 (FREE)');
console.log('✔ BR-046 Shipping Fee calculations verified: ₱80 standard, ₱0 for ₱1000+, ₱0 for pickup.');

// Timeline Step Progression
const mockPickupOrder = {
  id: 'test-pickup',
  orderNumber: 'OHM-2026-001',
  createdAt: new Date().toISOString(),
  fulfillmentType: 'PICKUP',
  paymentMethod: 'PAY_ON_PICKUP',
  status: 'READY_FOR_PICKUP',
  recipientName: 'Test Buyer',
  contactNumber: '09171234567',
  subtotalAmount: 500,
  deliveryFee: 0,
  totalAmount: 500,
  items: [],
};

const pickupTimeline = getTimelineStepsForOrder(mockPickupOrder);
assert.equal(pickupTimeline.steps.length, 5);
assert.equal(pickupTimeline.steps[3], 'READY_FOR_PICKUP');
assert.equal(pickupTimeline.currentStepIndex, 3);
assert.equal(pickupTimeline.isCancelled, false);

const cancelledOrder = { ...mockPickupOrder, status: 'CANCELLED' };
const cancelledTimeline = getTimelineStepsForOrder(cancelledOrder);
assert.equal(cancelledTimeline.isCancelled, true);
assert.equal(cancelledTimeline.currentStepIndex, 1);
console.log('✔ Order timeline step transitions and cancellation states verified.');

// ----------------------------------------------------
// 2. Verify Synchronous Service Fallbacks
// ----------------------------------------------------
console.log('\n--- 2. Testing Synchronous Order Service Fallbacks ---');

const initialOrders = getMockOrders();
assert.ok(Array.isArray(initialOrders) && initialOrders.length > 0, 'Mock orders must exist');
const testLookup = getMockOrderById(initialOrders[0].orderNumber);
assert.ok(testLookup);
assert.equal(testLookup.id, initialOrders[0].id);

const filtered = filterMockOrders(undefined, 'PENDING');
assert.ok(Array.isArray(filtered));
filtered.forEach((o) => assert.equal(o.status, 'PENDING'));
console.log('✔ In-memory order fallbacks and search filters verified.');

// ----------------------------------------------------
// 3. Testing Live Atomic Checkout Transaction & Inventory Lock
// ----------------------------------------------------
console.log('\n--- 3. Testing Live Atomic Checkout & Inventory Lock in Neon DB ---');

const buyerUser = await prisma.user.findUnique({
  where: { email: 'buyer@ohmsim.nexora.ph' },
});
assert.ok(buyerUser, 'Seeded buyer account must exist in Neon DB');

const testProduct = await prisma.product.findUnique({
  where: { sku: 'ESP32-WROOM-32U' },
});
assert.ok(testProduct, 'Test product ESP32-WROOM-32U must exist in Neon DB');
const initialStock = testProduct.stockQuantity;
assert.ok(initialStock >= 2, 'Initial stock must be at least 2 units');

console.log(`Initial stock for ${testProduct.sku}: ${initialStock} units`);

const orderQuantity = 2;
const subtotalNum = Number(testProduct.price) * orderQuantity;
const shippingFeeNum = computeDeliveryFee(subtotalNum, 'DELIVERY');
const totalAmountNum = subtotalNum + shippingFeeNum;
const year = new Date().getFullYear();
const uniqueOrderNo = `OHM-${year}-${Math.floor(1000 + Math.random() * 9000)}`;

// Execute interactive atomic transaction replicating POST /api/orders
const createdOrder = await prisma.$transaction(
  async (tx) => {
    // 1. Decrement stock
    const updatedProd = await tx.product.update({
      where: { id: testProduct.id },
      data: { stockQuantity: { decrement: orderQuantity } },
    });
    assert.equal(updatedProd.stockQuantity, initialStock - orderQuantity);

    // 2. Create order record
    const newOrder = await tx.order.create({
      data: {
        userId: buyerUser.id,
        orderNumber: uniqueOrderNo,
        status: 'PENDING',
        fulfillmentType: 'DELIVERY',
        paymentMethod: 'COD',
        subtotal: subtotalNum,
        shippingFee: shippingFeeNum,
        totalAmount: totalAmountNum,
        notes: 'Fullstack Step 3 automated checkout wiring test',
        items: {
          create: [
            {
              productId: testProduct.id,
              quantity: orderQuantity,
              unitPrice: testProduct.price,
            },
          ],
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return newOrder;
  },
  { maxWait: 10000, timeout: 20000 }
);

assert.ok(createdOrder.id);
assert.equal(createdOrder.orderNumber, uniqueOrderNo);
assert.equal(createdOrder.items.length, 1);
assert.equal(createdOrder.items[0].quantity, orderQuantity);
console.log(`✔ Order #${createdOrder.orderNumber} created atomically in Neon PostgreSQL.`);

// Verify product inventory was decremented in database
const productAfterOrder = await prisma.product.findUnique({
  where: { id: testProduct.id },
});
assert.equal(productAfterOrder.stockQuantity, initialStock - orderQuantity);
console.log(`✔ Stock successfully decremented: ${initialStock} -> ${productAfterOrder.stockQuantity} units.`);

// ----------------------------------------------------
// 4. Testing Order Cancellation & Stock Restitution
// ----------------------------------------------------
console.log('\n--- 4. Testing Order Cancellation & Atomic Stock Restitution ---');

await prisma.$transaction(
  async (tx) => {
    // Re-increment stock
    await tx.product.update({
      where: { id: testProduct.id },
      data: { stockQuantity: { increment: orderQuantity } },
    });

    // Update order status to CANCELLED
    await tx.order.update({
      where: { id: createdOrder.id },
      data: {
        status: 'CANCELLED',
        cancelledReason: 'Customer requested cancellation during Step 3 automated verification',
      },
    });
  },
  { maxWait: 10000, timeout: 20000 }
);

// Verify stock was restored to initial
const productAfterCancel = await prisma.product.findUnique({
  where: { id: testProduct.id },
});
assert.equal(productAfterCancel.stockQuantity, initialStock);
console.log(`✔ Stock successfully restored: ${productAfterOrder.stockQuantity} -> ${productAfterCancel.stockQuantity} units.`);

// ----------------------------------------------------
// 5. Test Backend Order Mapping to Frontend Interface
// ----------------------------------------------------
console.log('\n--- 5. Testing Backend Order Mapping to Frontend MockOrder ---');

const mapped = mapApiOrderToMockOrder({
  id: createdOrder.id,
  orderNumber: createdOrder.orderNumber,
  status: 'PENDING',
  fulfillmentType: 'DELIVERY',
  paymentMethod: 'COD',
  subtotal: subtotalNum,
  shippingFee: shippingFeeNum,
  totalAmount: totalAmountNum,
  user: {
    id: buyerUser.id,
    firstName: buyerUser.firstName,
    lastName: buyerUser.lastName,
    email: buyerUser.email,
  },
  deliveryAddress: {
    street: '123 Tech Drive',
    barangay: 'Dolores',
    city: 'San Fernando',
    province: 'Pampanga',
    recipientName: `${buyerUser.firstName} ${buyerUser.lastName}`,
    phone: '09171234567',
  },
  items: createdOrder.items.map((i) => ({
    productId: i.productId,
    productName: i.product.name,
    productSku: i.product.sku,
    unitPrice: Number(i.unitPrice),
    quantity: i.quantity,
  })),
});

assert.equal(mapped.id, createdOrder.id);
assert.equal(mapped.orderNumber, createdOrder.orderNumber);
assert.equal(mapped.subtotalAmount, subtotalNum);
assert.equal(mapped.deliveryFee, shippingFeeNum);
assert.equal(mapped.totalAmount, totalAmountNum);
assert.equal(mapped.items.length, 1);
assert.equal(mapped.items[0].qty, orderQuantity);
console.log('✔ Backend order mapped cleanly to frontend MockOrder interface.');

// ----------------------------------------------------
// 6. Clean Up Test Order Record
// ----------------------------------------------------
console.log('\n--- 6. Cleaning Up Test Order Record ---');
await prisma.orderItem.deleteMany({ where: { orderId: createdOrder.id } });
await prisma.order.delete({ where: { id: createdOrder.id } });
console.log('✔ Test order record cleaned from Neon PostgreSQL database.');

console.log('\n=== All Step 3 Orders & Checkout Wiring Checks PASSED Successfully ===');
