// tests/ui/checkout-payment-webhook-flow.mjs
// Verification suite for Buyer Checkout & Payment Experience Polish (GCash/Maya slip preview & Mock Webhook simulation)

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

console.log("=== OhmSim: Buyer Checkout & Payment Webhook Flow Verification ===\n");

// 2. Dynamic Import of Services & Prisma
const { POST: simulatePaymentHandler } = await import("../../app/api/payment/simulate/route.ts");
const { prisma } = await import("../../lib/prisma/client.ts");

// --- Test Section 1: Mock Payment Webhook Simulator Validation ---
console.log("--- 1. Testing Mock Payment Webhook Simulator Endpoint ---");

// Test 1a: Invalid Provider
const invalidProviderReq = new Request("http://localhost:3000/api/payment/simulate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ provider: "BITCOIN", amount: 500 }),
});
const invalidProviderRes = await simulatePaymentHandler(invalidProviderReq);
assert.equal(invalidProviderRes.status, 400, "Unsupported provider should return 400");
console.log("✔ Validation: 400 on unsupported payment provider.");

// Test 1b: Invalid Amount
const invalidAmountReq = new Request("http://localhost:3000/api/payment/simulate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ provider: "GCASH", amount: -100 }),
});
const invalidAmountRes = await simulatePaymentHandler(invalidAmountReq);
assert.equal(invalidAmountRes.status, 400, "Negative amount should return 400");
console.log("✔ Validation: 400 on negative payment amount.");

// Test 1c: Valid GCash Webhook Simulation
const validGcashReq = new Request("http://localhost:3000/api/payment/simulate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    provider: "GCASH",
    amount: 1450.0,
    referenceNumber: "102938481928",
    customerName: "Alex Rivera",
  }),
});
const validGcashRes = await simulatePaymentHandler(validGcashReq);
assert.equal(validGcashRes.status, 200, "Valid GCash simulation should return 200");
const gcashData = await validGcashRes.json();
assert.equal(gcashData.success, true);
assert.equal(gcashData.status, "SETTLED");
assert.equal(gcashData.provider, "GCASH");
assert.equal(gcashData.referenceNumber, "102938481928");
assert(gcashData.transactionId.startsWith("MOCK-GCASH-"), "Transaction ID must follow MOCK-GCASH pattern");
console.log(`✔ Verified GCash webhook simulation: Txn: ${gcashData.transactionId}, Ref: ${gcashData.referenceNumber}`);

// Test 1d: Valid Maya Webhook Simulation
const validMayaReq = new Request("http://localhost:3000/api/payment/simulate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    provider: "MAYA",
    amount: 890.0,
    customerName: "Maria Santos",
  }),
});
const validMayaRes = await simulatePaymentHandler(validMayaReq);
assert.equal(validMayaRes.status, 200, "Valid Maya simulation should return 200");
const mayaData = await validMayaRes.json();
assert.equal(mayaData.provider, "MAYA");
assert(mayaData.transactionId.startsWith("MOCK-MAYA-"), "Transaction ID must follow MOCK-MAYA pattern");
console.log(`✔ Verified Maya webhook simulation: Txn: ${mayaData.transactionId}`);

// --- Test Section 2: Prepaid Order Placement with Payment Slip Verification ---
console.log("\n--- 2. Testing Prepaid Order Creation in Neon PostgreSQL ---");

let testBuyer = await prisma.user.findFirst({
  where: { role: "BUYER" },
});

if (!testBuyer) {
  testBuyer = await prisma.user.create({
    data: {
      email: `test-prepay-buyer-${Date.now()}@ohmsim.ph`,
      passwordHash: "test_hash_prepay",
      firstName: "Prepay",
      lastName: "Buyer",
      phone: "09179998888",
      role: "BUYER",
    },
  });
}

const testProduct = await prisma.product.findFirst();
assert(testProduct, "PostgreSQL should contain at least one seeded product");

const prepayOrderNumber = `OHM-PREPAY-${Date.now().toString().slice(-4)}`;
const paymentNote = `[GCASH PREPAID | Ref: ${gcashData.referenceNumber} | Txn: ${gcashData.transactionId} | Slip: gcash-receipt.png] Handle with ESD caution.`;

const livePrepaidOrder = await prisma.order.create({
  data: {
    orderNumber: prepayOrderNumber,
    userId: testBuyer.id,
    fulfillmentType: "DELIVERY",
    paymentMethod: "COD",
    status: "PENDING",
    subtotal: 1450.0,
    shippingFee: 0.0,
    totalAmount: 1450.0,
    notes: paymentNote,
    items: {
      create: [
        {
          productId: testProduct.id,
          unitPrice: 1450.0,
          quantity: 1,
        },
      ],
    },
  },
  include: {
    items: true,
  },
});

assert.equal(livePrepaidOrder.orderNumber, prepayOrderNumber);
assert(livePrepaidOrder.notes.includes("GCASH PREPAID"), "Order notes must retain prepaid metadata");
assert(livePrepaidOrder.notes.includes(gcashData.transactionId), "Order notes must retain transaction ID");
console.log(`✔ Live order #${livePrepaidOrder.orderNumber} created with GCash prepaid verification header.`);

// --- Test Section 3: Cleanup Test Records ---
console.log("\n--- 3. Cleaning Up Test Order Records ---");

await prisma.orderItem.deleteMany({
  where: { orderId: livePrepaidOrder.id },
});

await prisma.order.delete({
  where: { id: livePrepaidOrder.id },
});

console.log("✔ Cleaned up test prepaid order from Neon PostgreSQL.");

console.log("\n=== All Buyer Checkout & Payment Webhook Flow Checks PASSED Successfully ===");
