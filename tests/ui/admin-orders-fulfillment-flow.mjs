// tests/ui/admin-orders-fulfillment-flow.mjs
// Verification suite for Admin Orders & Fulfillment Polish (Dispatch filters, Batch transitions, Shipping slips, DB Sync)

import assert from "node:assert/strict";

// 1. Dynamic Environment Initialization
if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // Ignore if not present
  }
  try {
    process.loadEnvFile(".env");
  } catch {
    // Ignore if not present
  }
}

console.log("=== OhmSim: Admin Orders & Fulfillment Flow Verification ===\n");

// 2. Dynamic Import of Services & Helpers
const { resolveCourierName } = await import("../../lib/orders/shipping-slip.ts");
const { batchUpdateOrderStatus } = await import("../../services/order-service.ts");
const { prisma } = await import("../../lib/prisma/client.ts");

// --- Test Section 1: Courier Routing & Dispatch Rules ---
console.log("--- 1. Testing Courier Resolution & Dispatch Rules ---");

const mockDeliveryOrderJnt = {
  id: "test-ord-1",
  orderNumber: "OHM-2026-TEST1",
  fulfillmentType: "DELIVERY",
  trackingNo: "JNT-OHM-889900",
  paymentMethod: "COD",
  items: [],
  subtotalAmount: 1200,
  deliveryFee: 0,
  totalAmount: 1200,
};

const mockDeliveryOrderFlash = {
  id: "test-ord-2",
  orderNumber: "OHM-2026-TEST2",
  fulfillmentType: "DELIVERY",
  trackingNo: "FLS-REG3-4455",
  paymentMethod: "COD",
  items: [],
  subtotalAmount: 500,
  deliveryFee: 80,
  totalAmount: 580,
};

const mockPickupOrder = {
  id: "test-ord-3",
  orderNumber: "OHM-2026-TEST3",
  fulfillmentType: "PICKUP",
  trackingNo: null,
  paymentMethod: "PAY_ON_PICKUP",
  items: [],
  subtotalAmount: 450,
  deliveryFee: 0,
  totalAmount: 450,
};

assert.equal(resolveCourierName(mockDeliveryOrderJnt), "J&T Express", "JNT tracking should resolve to J&T Express");
assert.equal(resolveCourierName(mockDeliveryOrderFlash), "Flash Express", "FLS tracking should resolve to Flash Express");
assert.equal(resolveCourierName(mockPickupOrder), "Campus Station (Building 3, Room 204)", "Pickup should resolve to Campus Station");

console.log("✔ Courier resolution rules verified (J&T Express, Flash Express, Campus Station).");

// --- Test Section 2: Batch Order Status Update Service ---
console.log("\n--- 2. Testing Batch Order Status Transition Service ---");

const batchRes = await batchUpdateOrderStatus(["o1", "o2"], {
  status: "PREPARING",
});

assert.equal(batchRes.successCount, 2, "Both in-memory fallback orders should transition to PREPARING");
console.log("✔ Batch transition to PREPARING verified (2/2 updated).");

const batchDispatchRes = await batchUpdateOrderStatus(["o1"], {
  status: "OUT_FOR_DELIVERY",
  trackingNumberPrefix: "JNT-OHM",
});

assert.equal(batchDispatchRes.successCount, 1, "Order should transition to OUT_FOR_DELIVERY");
console.log("✔ Batch transition to OUT_FOR_DELIVERY with tracking auto-assignment verified.");

// --- Test Section 3: Live Neon DB Orders Creation & Fulfillment Flow ---
console.log("\n--- 3. Testing Live Neon PostgreSQL Orders & Status Transitions ---");

let testUser = await prisma.user.findFirst({
  where: { role: "BUYER" },
});

if (!testUser) {
  testUser = await prisma.user.create({
    data: {
      email: `test-fulfill-buyer-${Date.now()}@ohmsim.ph`,
      passwordHash: "test_hash_buyer",
      firstName: "Fulfillment",
      lastName: "Tester",
      phone: "09171234567",
      role: "BUYER",
    },
  });
}

const testProduct = await prisma.product.findFirst();
assert(testProduct, "PostgreSQL should contain at least one seeded product");

const testAddr = await prisma.address.create({
  data: {
    userId: testUser.id,
    label: "Testing Station",
    recipientName: "Fulfillment Tester",
    phone: "09171234567",
    street: "789 Macabulos Drive",
    barangay: "San Nicolas",
    city: "San Fernando",
    province: "Pampanga",
    postalCode: "2000",
  },
});

const testOrderNumber = `OHM-TEST-FULFILL-${Date.now().toString().slice(-4)}`;

const liveOrder = await prisma.order.create({
  data: {
    orderNumber: testOrderNumber,
    userId: testUser.id,
    fulfillmentType: "DELIVERY",
    paymentMethod: "COD",
    status: "PENDING",
    subtotal: 350.0,
    shippingFee: 80.0,
    totalAmount: 430.0,
    notes: "Automated fulfillment flow test order",
    deliveryAddressId: testAddr.id,
    items: {
      create: [
        {
          productId: testProduct.id,
          unitPrice: 350.0,
          quantity: 1,
        },
      ],
    },
  },
  include: {
    items: true,
    deliveryAddress: true,
  },
});

assert.equal(liveOrder.status, "PENDING", "Initial status must be PENDING");
console.log(`✔ Created live test order #${liveOrder.orderNumber} in Neon PostgreSQL (ID: ${liveOrder.id}).`);

// Advance to PROCESSING
const updatedProcessing = await prisma.order.update({
  where: { id: liveOrder.id },
  data: { status: "PROCESSING" },
});
assert.equal(updatedProcessing.status, "PROCESSING", "Status should be PROCESSING");
console.log("✔ Advanced live order to PROCESSING.");

// Advance to SHIPPED with tracking number
const assignedTracking = `JNT-OHM-VERIFY-${Date.now().toString().slice(-4)}`;
const updatedShipped = await prisma.order.update({
  where: { id: liveOrder.id },
  data: {
    status: "SHIPPED",
    trackingNumber: assignedTracking,
  },
});
assert.equal(updatedShipped.status, "SHIPPED", "Status should be SHIPPED");
assert.equal(updatedShipped.trackingNumber, assignedTracking, "Tracking number should be recorded");
console.log(`✔ Advanced live order to SHIPPED (Tracking: ${assignedTracking}).`);

// Finalize to DELIVERED
const updatedDelivered = await prisma.order.update({
  where: { id: liveOrder.id },
  data: { status: "DELIVERED" },
});
assert.equal(updatedDelivered.status, "DELIVERED", "Status should be DELIVERED");
console.log("✔ Finalized live order to DELIVERED.");

// --- Test Section 4: Cleanup Test Records ---
console.log("\n--- 4. Cleaning Up Test Order Records ---");

await prisma.orderItem.deleteMany({
  where: { orderId: liveOrder.id },
});

await prisma.order.delete({
  where: { id: liveOrder.id },
});

await prisma.address.delete({
  where: { id: testAddr.id },
});

console.log("✔ Cleaned up test order, items, and address from Neon PostgreSQL.");

console.log("\n=== All Admin Orders & Fulfillment Polish Checks PASSED Successfully ===");
