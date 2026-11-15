import assert from 'node:assert/strict';
import { prisma } from '../../lib/prisma/client.ts';
import {
  validatePhilippineMobile,
  validateRegion3Province,
  getAddressesSnapshot,
  addAddress,
  resetProfileStore,
} from '../../services/profile-service.ts';
import {
  validateChatAttachment,
  getChatConversations,
  sendChatMessage,
} from '../../services/chat-service.ts';
import {
  getNotifications,
  getUnreadNotificationsCount,
  markAllNotificationsAsRead,
} from '../../services/notification-service.ts';

console.log('=== OhmSim Full-Stack Step 4: Chat, Profile & Notifications Flow Verification ===\n');

// ----------------------------------------------------
// 1. Verify Profile & Address Validation Rules (BR-045 & BR-048)
// ----------------------------------------------------
console.log('--- 1. Testing Profile & Address Rules (BR-045 & BR-048) ---');

// Philippine Mobile Validation
assert.equal(validatePhilippineMobile('09171234567'), true);
assert.equal(validatePhilippineMobile('09987654321'), true);
assert.equal(validatePhilippineMobile('08171234567'), false, 'Non-09 mobile must be rejected');
assert.equal(validatePhilippineMobile('0917123456'), false, '10-digit mobile must be rejected');
assert.equal(validatePhilippineMobile('091712345678'), false, '12-digit mobile must be rejected');
assert.equal(validatePhilippineMobile('abc091712345'), false, 'Non-numeric string must be rejected');
console.log('✔ Philippine mobile number format (09XXXXXXXXX) verified.');

// Region III Provinces (BR-045)
assert.equal(validateRegion3Province('Pampanga'), true);
assert.equal(validateRegion3Province('Bulacan'), true);
assert.equal(validateRegion3Province('Nueva Ecija'), true);
assert.equal(validateRegion3Province('Bataan'), true);
assert.equal(validateRegion3Province('Tarlac'), true);
assert.equal(validateRegion3Province('Zambales'), true);
assert.equal(validateRegion3Province('Aurora'), true);
assert.equal(validateRegion3Province('Metro Manila'), false, 'NCR must be rejected');
assert.equal(validateRegion3Province('Cavite'), false, 'Region IV-A must be rejected');
assert.equal(validateRegion3Province('Cebu'), false, 'Visayas must be rejected');
console.log('✔ Region III delivery boundaries strictly enforced (BR-045).');

// BR-048: Max 2 Saved Addresses
resetProfileStore();
const initialAddrs = getAddressesSnapshot();
console.log(`Initial address count: ${initialAddrs.length}`);

if (initialAddrs.length < 2) {
  const addRes = addAddress({
    label: 'Campus Electronics Lab',
    recipientName: 'Daniel Cruz',
    contactNumber: '09171234567',
    region: 'Region III',
    province: 'Pampanga',
    cityMunicipality: 'Angeles City',
    barangay: 'Balibago',
    streetAddress: 'MacArthur Highway',
    postalCode: '2009',
    isDefault: false,
  });
  assert.equal(addRes.success, true);
}

// At 2 addresses, adding a 3rd address MUST be rejected
const addThird = addAddress({
  label: 'Third Address Attempt',
  recipientName: 'Daniel Cruz',
  contactNumber: '09171234567',
  region: 'Region III',
  province: 'Tarlac',
  cityMunicipality: 'Tarlac City',
  barangay: 'San Roque',
  streetAddress: 'Romulo Blvd',
  postalCode: '2300',
  isDefault: false,
});
assert.equal(addThird.success, false, 'Third address must be rejected per BR-048');
assert.ok(addThird.error?.includes('Maximum limit of 2 saved addresses'));
console.log('✔ BR-048 maximum 2 saved addresses limit strictly enforced.');

// ----------------------------------------------------
// 2. Testing Chat Service & Attachment Validation
// ----------------------------------------------------
console.log('\n--- 2. Testing Chat Service & Attachment Validator ---');

const validPng = { name: 'circuit_diagram.png', size: 1024 * 500, type: 'image/png' };
assert.equal(validateChatAttachment(validPng).valid, true);

const validPdf = { name: 'esp32_datasheet.pdf', size: 1024 * 1024 * 2, type: 'application/pdf' };
assert.equal(validateChatAttachment(validPdf).valid, true);

const oversized = { name: 'giant_archive.png', size: 1024 * 1024 * 6, type: 'image/png' };
const overRes = validateChatAttachment(oversized);
assert.equal(overRes.valid, false);
assert.ok(overRes.error?.includes('5 MB'));

const invalidExt = { name: 'executable.exe', size: 1024 * 50, type: 'application/x-msdownload' };
assert.equal(validateChatAttachment(invalidExt).valid, false);
console.log('✔ Chat attachment 5 MB limit and MIME extensions verified.');

const convos = getChatConversations();
assert.ok(convos.length > 0, 'Conversations must exist');
const testMsg = sendChatMessage(convos[0].id, {
  text: 'Testing live chat wiring message',
  from: 'buyer',
});
assert.ok(testMsg.id);
assert.equal(testMsg.text, 'Testing live chat wiring message');
assert.equal(testMsg.from, 'buyer');
console.log('✔ Chat message dispatch and local store integration verified.');

// ----------------------------------------------------
// 3. Testing Notification Service Lifecycle
// ----------------------------------------------------
console.log('\n--- 3. Testing Notifications Service Operations ---');

const notifs = getNotifications();
assert.ok(Array.isArray(notifs));
const initialUnread = getUnreadNotificationsCount();
assert.ok(typeof initialUnread === 'number');

markAllNotificationsAsRead();
const unreadAfterMarkAll = getUnreadNotificationsCount();
assert.equal(unreadAfterMarkAll, 0, 'All notifications must be marked read');
console.log('✔ markAllNotificationsAsRead verified.');

// ----------------------------------------------------
// 4. Testing Live Neon PostgreSQL Integration
// ----------------------------------------------------
console.log('\n--- 4. Testing Live Database Records in Neon PostgreSQL ---');

const buyer = await prisma.user.findUnique({
  where: { email: 'buyer@ohmsim.nexora.ph' },
});
assert.ok(buyer, 'Buyer user must exist in Neon DB');

// Test Live Address Record creation with Region III check
const testAddress = await prisma.address.create({
  data: {
    userId: buyer.id,
    label: 'Wiring Test Station',
    recipientName: `${buyer.firstName} ${buyer.lastName}`,
    phone: buyer.phone || '09189876543',
    street: 'Test Hardware Ave',
    barangay: 'San Nicolas',
    city: 'San Fernando',
    province: 'Pampanga',
    postalCode: '2000',
    isDefault: false,
  },
});
assert.ok(testAddress.id);
assert.equal(testAddress.province, 'Pampanga');
console.log(`✔ Created test address ${testAddress.id} in Neon DB.`);

// Cleanup test address
await prisma.address.delete({ where: { id: testAddress.id } });
console.log('✔ Cleaned up test address from Neon DB.');

// Test Live Support Conversation & Message Creation
const testConvo = await prisma.conversation.create({
  data: {
    buyerId: buyer.id,
    status: 'ACTIVE',
    messages: {
      create: [
        {
          senderId: buyer.id,
          senderRole: 'BUYER',
          text: 'Hello, testing automated conversation flow.',
        },
      ],
    },
  },
  include: { messages: true },
});
assert.ok(testConvo.id);
assert.equal(testConvo.messages.length, 1);
console.log(`✔ Created test conversation ${testConvo.id} with initial message in Neon DB.`);

// Cleanup test conversation
await prisma.message.deleteMany({ where: { conversationId: testConvo.id } });
await prisma.conversation.delete({ where: { id: testConvo.id } });
console.log('✔ Cleaned up test conversation from Neon DB.');

// Test Live Notification Creation
const testNotif = await prisma.notification.create({
  data: {
    userId: buyer.id,
    title: 'Order Status Update',
    message: 'Your parcel has been dispatched for delivery in Pampanga.',
    type: 'ORDER',
    isRead: false,
  },
});
assert.ok(testNotif.id);
assert.equal(testNotif.isRead, false);

const updatedNotif = await prisma.notification.update({
  where: { id: testNotif.id },
  data: { isRead: true },
});
assert.equal(updatedNotif.isRead, true);
console.log(`✔ Created and updated test notification ${testNotif.id} in Neon DB.`);

// Cleanup test notification
await prisma.notification.delete({ where: { id: testNotif.id } });
console.log('✔ Cleaned up test notification from Neon DB.');

console.log('\n=== All Step 4 Chat, Profile & Notifications Checks PASSED Successfully ===');
