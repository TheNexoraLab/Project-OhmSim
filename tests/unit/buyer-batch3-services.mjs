import assert from "node:assert/strict";
import path from "node:path";
import { createLoader } from "../ui/helpers/load-typescript.mjs";
const load = createLoader(path.resolve(import.meta.dirname, "../.."));
const orders = load("services/order-service.ts");
const products = load("lib/mocks/products.ts").PRODUCTS;
const notifications = load("services/notification-service.ts");
const chat = load("services/chat-service.ts");
const initialChat = load("lib/mocks/chat.ts").INITIAL_CONVERSATIONS;

const expectedTotals = [615, 1225, 535, 225, 775];
for (const [index, order] of orders.getMockOrders().entries()) {
  const sum = order.items.reduce((amount, item) => amount + item.price * item.qty, 0);
  assert.equal(order.subtotalAmount, sum, order.id + " subtotal");
  assert.equal(order.deliveryFee, orders.computeDeliveryFee(sum, order.fulfillmentType));
  assert.equal(order.totalAmount, sum + order.deliveryFee);
  assert.equal(order.totalAmount, expectedTotals[index]);
}
for (const [subtotal, mode, expected] of [
  [999.99, "DELIVERY", 80], [1000, "DELIVERY", 0], [1000.01, "DELIVERY", 0],
  [0, "PICKUP", 0], [999.99, "PICKUP", 0], [1000, "PICKUP", 0],
]) assert.equal(orders.computeDeliveryFee(subtotal, mode), expected);
for (const mode of ["PICKUP", "DELIVERY"]) {
  const expected = mode === "PICKUP"
    ? ["PENDING", "CONFIRMED", "PREPARING", "READY_FOR_PICKUP", "COMPLETED"]
    : ["PENDING", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED", "COMPLETED"];
  for (const [index, status] of expected.entries()) {
    const result = orders.getTimelineStepsForOrder({ fulfillmentType: mode, status });
    assert.deepEqual(result.steps, expected);
    assert.equal(result.currentStepIndex, index);
    assert.equal(result.isCancelled, false);
  }
  assert.deepEqual(orders.getTimelineStepsForOrder({ fulfillmentType: mode, status: "CANCELLED" }),
    { steps: ["PENDING", "CANCELLED"], currentStepIndex: 1, isCancelled: true });
}
assert.deepEqual(orders.filterMockOrders("074").map(order => order.id), ["o2"]);
assert.deepEqual(orders.filterMockOrders("no-such-order"), []);
assert.equal(orders.getMockOrderById("unknown"), undefined);
console.log("PASS actual order service: five fixture totals, exact fee boundaries, all timeline mappings, search/invalid ID");

for (const item of notifications.getNotifications().filter(item => item.productId)) {
  const product = products.find(product => product.id === item.productId);
  assert.ok(product);
  assert.equal(item.linkHref, "/products/" + product.id);
  assert.ok(item.body.includes(String(product.stock)));
}
let emitted = 0;
const unsubscribe = notifications.notificationStore.subscribe(() => emitted++);
assert.equal(notifications.getUnreadNotificationsCount(), 3);
notifications.markNotificationAsRead("n1");
assert.equal(notifications.getUnreadNotificationsCount(), 2);
notifications.dismissNotification("n2");
assert.equal(notifications.getUnreadNotificationsCount(), 1);
notifications.markAllNotificationsAsRead();
assert.equal(notifications.getUnreadNotificationsCount(), 0);
notifications.clearAllNotifications();
assert.deepEqual(notifications.getNotifications(), []);
assert.equal(emitted, 4);
unsubscribe();
console.log("PASS actual notification service: product identities and subscribed read/dismiss/mark/clear state");

for (const [name, type] of [
  ["ok.png", "image/png"], ["ok.jpg", "image/jpeg"], ["ok.webp", "image/webp"],
  ["ok.gif", "image/gif"], ["ok.pdf", "application/pdf"],
  ["ok.txt", "text/plain"], ["ok.csv", "text/csv"], ["ok.csv", "text/plain"],
  ["ok.png", ""], ["ok.pdf", "application/octet-stream"],
]) {
  assert.equal(chat.validateChatAttachment({ name, type, size: chat.MAX_ATTACHMENT_SIZE_BYTES }).valid, true);
  assert.equal(chat.validateChatAttachment({ name, type, size: chat.MAX_ATTACHMENT_SIZE_BYTES + 1 }).valid, false);
}
for (const [name, type] of [["renamed.png", "application/x-msdownload"], ["bad.exe", "image/png"],
  ["wrong.pdf", "image/png"], ["bad.exe", ""], ["wrong.png", "text/plain"]]) {
  assert.equal(chat.validateChatAttachment({ name, type, size: 2 }).valid, false, name + " / " + type);
}
const originalSetTimeout = global.setTimeout;
const originalClearTimeout = global.clearTimeout;
const originalRevoke = URL.revokeObjectURL;
const timers = new Set();
const revoked = [];
try {
  global.setTimeout = callback => { const timer = { callback }; timers.add(timer); return timer; };
  global.clearTimeout = timer => timers.delete(timer);
  URL.revokeObjectURL = url => revoked.push(url);
  for (const [index, type] of ["image/png", "application/pdf", "text/plain"].entries()) {
    const url = "blob:owned-" + index;
    chat.sendChatMessage("c1", { attachment: { name: "test", url, type }, from: "buyer" });
    assert.equal(chat.getChatConversationById("c1").messages.at(-1).attachment.url, url);
  }
  assert.equal(timers.size, 3);
  assert.deepEqual(revoked, []);
  chat.chatStore.cleanup();
  assert.equal(timers.size, 0);
  assert.deepEqual(revoked, ["blob:owned-0", "blob:owned-1", "blob:owned-2"]);
  assert.deepEqual(chat.getChatConversations(), initialChat);
  chat.chatStore.cleanup();
  assert.equal(revoked.length, 3, "No duplicate revocation");
} finally {
  global.setTimeout = originalSetTimeout;
  global.clearTimeout = originalClearTimeout;
  URL.revokeObjectURL = originalRevoke;
}
console.log("PASS actual chat service: MIME/extension and 5MB boundaries, retained URLs, exact disposal and timer cleanup");
