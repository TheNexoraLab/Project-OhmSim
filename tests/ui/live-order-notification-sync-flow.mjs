import assert from 'node:assert/strict';

try {
  process.loadEnvFile?.('.env.local');
} catch {}
try {
  process.loadEnvFile?.('.env');
} catch {}

const { prisma } = await import('../../lib/prisma/client.ts');
const { createSessionToken } = await import('../../lib/auth/session.ts');
const { PATCH } = await import('../../app/api/orders/[id]/route.ts');

console.log('=== OhmSim: Live Order Notification & Status Sync Verification ===\n');

// 1. Setup Test Buyer User & Address
console.log('--- 1. Setting Up Test Buyer & Order in Database ---');
const testEmail = `sync.buyer.${Date.now()}@ohmsim.ph`;
const testUser = await prisma.user.create({
  data: {
    email: testEmail,
    passwordHash: 'dummy-hash',
    role: 'BUYER',
    firstName: 'Sync',
    lastName: 'Tester',
  },
});

const testAddress = await prisma.address.create({
  data: {
    userId: testUser.id,
    label: 'Default',
    street: 'MacArthur Highway, Balibago',
    barangay: 'Balibago',
    city: 'Angeles City',
    province: 'Pampanga',
    postalCode: '2009',
    recipientName: 'Sync Tester',
    phone: '09171234567',
    isDefault: true,
  },
});

const testProduct = await prisma.product.findFirst({
  where: { stockQuantity: { gt: 10 } },
});
assert.ok(testProduct, 'Must have at least one product in stock');

const testOrderNumber = `ORD-SYNC-${Date.now().toString().slice(-6)}`;
const testOrder = await prisma.order.create({
  data: {
    orderNumber: testOrderNumber,
    userId: testUser.id,
    status: 'PENDING',
    fulfillmentType: 'DELIVERY',
    paymentMethod: 'COD',
    subtotal: 500,
    shippingFee: 120,
    totalAmount: 620,
    deliveryAddressId: testAddress.id,
    notes: 'Please call before arrival in Balibago',
    items: {
      create: [
        {
          productId: testProduct.id,
          quantity: 2,
          unitPrice: 250,
        },
      ],
    },
  },
});

console.log(`✔ Created Test Order #${testOrder.orderNumber} (ID: ${testOrder.id})`);

// Create Admin session token for calling PATCH
const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
assert.ok(adminUser, 'Admin user must exist');
const adminToken = await createSessionToken({
  userId: adminUser.id,
  email: adminUser.email,
  role: 'ADMIN',
  firstName: adminUser.firstName,
  lastName: adminUser.lastName,
});

async function callPatch(payload) {
  const req = new Request(`http://localhost:3000/api/orders/${testOrder.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      cookie: `ohmsim_session=${adminToken}`,
    },
    body: JSON.stringify(payload),
  });
  const res = await PATCH(req, { params: Promise.resolve({ id: testOrder.id }) });
  assert.equal(res.status, 200, `PATCH must succeed with status 200, got ${res.status}`);
  return await res.json();
}

// 2. Transition: PENDING -> PROCESSING
console.log('\n--- 2. Updating Order Status to PROCESSING ---');
const procRes = await callPatch({ status: 'PROCESSING' });
assert.equal(procRes.order.status, 'PROCESSING');
console.log('✔ Order successfully transitioned to PROCESSING');

const notif1 = await prisma.notification.findFirst({
  where: { userId: testUser.id, link: `/orders/${testOrder.id}` },
  orderBy: { createdAt: 'desc' },
});
assert.ok(notif1, 'Notification must be created for PROCESSING');
assert.equal(notif1.title, 'Order Confirmed & Preparing');
assert.ok(notif1.message.includes(testOrder.orderNumber));
console.log(`✔ Notification created: "${notif1.title}" - "${notif1.message}"`);

// 3. Transition: PROCESSING -> SHIPPED with J&T Express tracking
console.log('\n--- 3. Updating Order Status to SHIPPED (J&T Express) ---');
const shipRes = await callPatch({
  status: 'SHIPPED',
  trackingNumber: 'JNT-9876543210PH',
});
assert.equal(shipRes.order.status, 'SHIPPED');
assert.equal(shipRes.order.trackingNumber, 'JNT-9876543210PH');
console.log('✔ Order transitioned to SHIPPED with J&T Express tracking');

const notif2 = await prisma.notification.findFirst({
  where: { userId: testUser.id, title: { contains: 'J&T Express' } },
  orderBy: { createdAt: 'desc' },
});
assert.ok(notif2, 'Notification must mention J&T Express');
assert.ok(notif2.title.includes('Out for Delivery via J&T Express'));
assert.ok(notif2.message.includes('JNT-9876543210PH'));
console.log(`✔ Notification created: "${notif2.title}" - "${notif2.message}"`);

// 4. Transition: SHIPPED -> DELIVERED
console.log('\n--- 4. Updating Order Status to DELIVERED ---');
const delRes = await callPatch({ status: 'DELIVERED' });
assert.equal(delRes.order.status, 'DELIVERED');
console.log('✔ Order transitioned to DELIVERED');

const notif3 = await prisma.notification.findFirst({
  where: { userId: testUser.id, title: 'Order Completed' },
  orderBy: { createdAt: 'desc' },
});
assert.ok(notif3, 'Notification must be created for DELIVERED');
assert.ok(notif3.message.includes(testOrder.orderNumber));
console.log(`✔ Notification created: "${notif3.title}" - "${notif3.message}"`);

// 5. Verify Total Notifications Count
console.log('\n--- 5. Verifying Buyer Notification Queue & State ---');
const userNotifs = await prisma.notification.findMany({
  where: { userId: testUser.id },
  orderBy: { createdAt: 'asc' },
});
assert.equal(userNotifs.length, 3, 'Must have recorded exactly 3 notifications for this order lifecycle');
const unreadCount = userNotifs.filter((n) => !n.isRead).length;
assert.equal(unreadCount, 3, 'All 3 notifications must initially be unread');
console.log(`✔ Successfully verified all ${userNotifs.length} order lifecycle notifications in database.`);

// 6. Cleanup Test Data
console.log('\n--- 6. Cleaning Up Test Fixtures ---');
await prisma.notification.deleteMany({ where: { userId: testUser.id } });
await prisma.orderItem.deleteMany({ where: { orderId: testOrder.id } });
await prisma.order.delete({ where: { id: testOrder.id } });
await prisma.address.delete({ where: { id: testAddress.id } });
await prisma.user.delete({ where: { id: testUser.id } });
console.log('✔ Cleaned up test order, notifications, address, and buyer user.');

console.log('\n=== All Live Order Notification & Status Sync Checks PASSED Successfully ===');
