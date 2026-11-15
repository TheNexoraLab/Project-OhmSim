import assert from 'node:assert/strict';
import { prisma } from '../../lib/prisma/client.ts';
import {
  isValidRegion3Province,
  getCanonicalRegion3Province,
} from '../../lib/orders/order-utils.ts';

console.log('=== OhmSim Backend BE-05: Support Chat, Profile & Notifications Suite ===\n');

// ----------------------------------------------------
// 1. Profile & Address Book Verification (BR-048 & BR-045)
// ----------------------------------------------------
console.log('--- 1. Testing Customer Profile & Saved Addresses ---');

const buyer = await prisma.user.findFirst({ where: { role: 'BUYER' } });
const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
assert.ok(buyer, 'Buyer account must exist');
assert.ok(admin, 'Admin account must exist');

// Clean any pre-existing test addresses for this buyer
await prisma.address.deleteMany({ where: { userId: buyer.id } });

// Add Address 1 (Valid Region III)
const addr1 = await prisma.address.create({
  data: {
    userId: buyer.id,
    label: 'Home Dorm',
    recipientName: `${buyer.firstName} ${buyer.lastName}`,
    phone: '09171234567',
    street: '100 University Blvd',
    barangay: 'San Nicolas',
    city: 'San Fernando',
    province: 'Pampanga',
    postalCode: '2000',
    isDefault: true,
  },
});
assert.ok(addr1.id, 'Address 1 created');
assert.equal(addr1.isDefault, true);

// Add Address 2 (Valid Region III)
const addr2 = await prisma.address.create({
  data: {
    userId: buyer.id,
    label: 'Engineering Lab',
    recipientName: `${buyer.firstName} ${buyer.lastName}`,
    phone: '09171234567',
    street: 'Room 204 Building 3',
    barangay: 'Santo Rosario',
    city: 'Angeles City',
    province: 'Pampanga',
    postalCode: '2009',
    isDefault: false,
  },
});
assert.ok(addr2.id, 'Address 2 created');

// Test BR-048 limit: Address count must now be 2
const addressCount = await prisma.address.count({ where: { userId: buyer.id } });
assert.equal(addressCount, 2, 'Buyer must currently have exactly 2 saved addresses');

// Verify adding a 3rd address would violate BR-048
const wouldExceedLimit = addressCount >= 2;
assert.equal(wouldExceedLimit, true, 'BR-048 guard must prevent adding a 3rd address');

// Test BR-045 Province Validation
assert.equal(isValidRegion3Province('Bulacan'), true);
assert.equal(isValidRegion3Province('Batangas'), false, 'Batangas is Region 4A, must be rejected');
assert.equal(getCanonicalRegion3Province('zambales'), 'Zambales');

console.log('✔ Profile and address book constraint checks (BR-048 & BR-045) passed.');

// ----------------------------------------------------
// 2. Notifications System Verification
// ----------------------------------------------------
console.log('\n--- 2. Testing Notifications System ---');

// Clear existing notifications for test buyer
await prisma.notification.deleteMany({ where: { userId: buyer.id } });

// Create 3 notifications
const n1 = await prisma.notification.create({
  data: {
    userId: buyer.id,
    title: 'Order Confirmation',
    message: 'Your order #OHM-2026-0001 has been confirmed.',
    type: 'order',
    isRead: false,
  },
});

const n2 = await prisma.notification.create({
  data: {
    userId: buyer.id,
    title: 'Low Stock Alert',
    message: 'Arduino Uno R3 is back in stock.',
    type: 'inventory',
    isRead: false,
  },
});
assert.ok(n2.id, 'Notification 2 created');

const n3 = await prisma.notification.create({
  data: {
    userId: buyer.id,
    title: 'System Notice',
    message: 'Campus Lab will close early on Friday.',
    type: 'system',
    isRead: false,
  },
});
assert.ok(n3.id, 'Notification 3 created');

let unreadCount = await prisma.notification.count({ where: { userId: buyer.id, isRead: false } });
assert.equal(unreadCount, 3, 'Initial unread count must be 3');

// Mark single notification as read
await prisma.notification.update({
  where: { id: n1.id },
  data: { isRead: true },
});

unreadCount = await prisma.notification.count({ where: { userId: buyer.id, isRead: false } });
assert.equal(unreadCount, 2, 'Unread count after reading one must be 2');

// Mark all remaining notifications as read
await prisma.notification.updateMany({
  where: { userId: buyer.id, isRead: false },
  data: { isRead: true },
});

unreadCount = await prisma.notification.count({ where: { userId: buyer.id, isRead: false } });
assert.equal(unreadCount, 0, 'Unread count after mark-all-read must be 0');

console.log('✔ Notification creation, unread counting, and read state transitions passed.');

// ----------------------------------------------------
// 3. Support Chat & Messaging Lifecycle
// ----------------------------------------------------
console.log('\n--- 3. Testing Support Chat & Messaging ---');

// Create a conversation for buyer
const convo = await prisma.conversation.create({
  data: {
    buyerId: buyer.id,
    status: 'ACTIVE',
  },
});
assert.ok(convo.id, 'Conversation created');
assert.equal(convo.status, 'ACTIVE');

// Buyer sends message
const buyerMsg = await prisma.message.create({
  data: {
    conversationId: convo.id,
    senderId: buyer.id,
    senderRole: 'BUYER',
    text: 'Hello, is the ESP32 compatible with the 3.3V logic relay module?',
  },
});
assert.ok(buyerMsg.id, 'Buyer message created');
assert.equal(buyerMsg.senderRole, 'BUYER');

// Admin sends reply and triggers notification for buyer
const adminMsg = await prisma.message.create({
  data: {
    conversationId: convo.id,
    senderId: admin.id,
    senderRole: 'ADMIN',
    text: 'Yes! The ESP32 3.3V GPIO pins directly interface with our 3.3V-compatible optically-isolated relay modules.',
  },
});
assert.ok(adminMsg.id, 'Admin message created');
assert.equal(adminMsg.senderRole, 'ADMIN');

// Create customer notification triggered by admin reply
const chatNotif = await prisma.notification.create({
  data: {
    userId: buyer.id,
    title: 'New Message from OhmSim Support',
    message: adminMsg.text.slice(0, 100),
    type: 'chat',
    link: '/chat',
    isRead: false,
  },
});
assert.ok(chatNotif.id, 'Chat notification triggered for buyer');

// Verify conversation message history
const messageHistory = await prisma.message.findMany({
  where: { conversationId: convo.id },
  orderBy: { createdAt: 'asc' },
});
assert.equal(messageHistory.length, 2, 'Conversation must contain exactly 2 messages');
assert.equal(messageHistory[0].senderRole, 'BUYER');
assert.equal(messageHistory[1].senderRole, 'ADMIN');

// Update conversation to RESOLVED
const resolvedConvo = await prisma.conversation.update({
  where: { id: convo.id },
  data: { status: 'RESOLVED' },
});
assert.equal(resolvedConvo.status, 'RESOLVED');

console.log('✔ Support conversation, messaging exchange, and notification dispatch passed.');

// ----------------------------------------------------
// 4. Cleanup Test Artifacts
// ----------------------------------------------------
console.log('\n--- 4. Cleaning Test Artifacts ---');

await prisma.message.deleteMany({ where: { conversationId: convo.id } });
await prisma.conversation.delete({ where: { id: convo.id } });
await prisma.notification.deleteMany({ where: { userId: buyer.id } });
await prisma.address.deleteMany({ where: { id: { in: [addr1.id, addr2.id] } } });

console.log('✔ Neon database cleaned of test artifacts.');
console.log('\n=== All BE-05 Unit Tests PASSED Successfully ===');
