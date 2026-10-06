import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";
import { createRequire } from "node:module";
import { createLoader } from "./helpers/load-typescript.mjs";

const req = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, "../..");
const load = createLoader(root);
const orders = load("services/order-service.ts");
const url = process.env.BUYER_URL || "http://localhost:3106";
const screenshotDir = process.env.SCREENSHOT_DIR;
const playwrightPath = process.env.PLAYWRIGHT_MODULE_PATH ||
  path.join(process.env.LOCALAPPDATA || "", "Programs/Antigravity IDE/resources/app/node_modules/playwright");
const { chromium } = req(playwrightPath);
const browser = await chromium.launch({ headless: true, channel: process.platform === "win32" ? "msedge" : undefined });
const errors = [];
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on("pageerror", error => errors.push(error.message));
page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
if (screenshotDir) fs.mkdirSync(screenshotDir, { recursive: true });
async function shot(name, fullPage = false) {
  if (screenshotDir) await page.screenshot({ path: path.join(screenshotDir, name + ".png"), fullPage });
}
async function until(fn, expected) { await page.waitForFunction(fn, expected); }
async function go(route) {
  await page.goto(url + route);
  await page.locator("main").waitFor();
}
async function expectOrderIds(ids) {
  await until(expected => JSON.stringify([...document.querySelectorAll("[data-order-id]")].map(el => el.dataset.orderId)) === JSON.stringify(expected), ids);
}
async function badge(expected) {
  await until(expected => [...document.querySelectorAll('[data-notification-count]')].every(el => Number(el.dataset.notificationCount) === expected) &&
    document.querySelectorAll('[data-notification-count]').length === (expected ? 2 : 0), expected);
}
async function targets(selector) {
  const failures = await page.locator(selector).evaluateAll(elements => elements.flatMap(element => {
    const rect = element.getBoundingClientRect();
    if (!rect.width || !rect.height) return [];
    return rect.width < 43.99 || rect.height < 43.99 ? [{
      name: element.getAttribute("aria-label") || element.textContent || element.id,
      width: rect.width, height: rect.height,
    }] : [];
  }));
  assert.deepEqual(failures, [], "Effective 44px targets: " + JSON.stringify(failures));
}
async function scrollRegion(selector, endSelector) {
  const region = page.locator(selector);
  await region.scrollIntoViewIfNeeded();
  const dimensions = await region.evaluate(element => {
    const rect = element.getBoundingClientRect();
    return { left: rect.left, right: rect.right, width: rect.width, viewport: innerWidth,
      client: element.clientWidth, scroll: element.scrollWidth, overflow: getComputedStyle(element).overflowX };
  });
  assert.ok(dimensions.left >= 0 && dimensions.right <= dimensions.viewport + 1, JSON.stringify(dimensions));
  assert.equal(dimensions.overflow, "auto");
  await region.focus();
  assert.equal(await region.evaluate(element => element === document.activeElement), true);
  await page.keyboard.press("ArrowRight");
  if (dimensions.scroll > dimensions.client) await until(selector => document.querySelector(selector).scrollLeft > 0, selector);
  await region.evaluate(element => { element.scrollLeft = element.scrollWidth; });
  const end = region.locator(endSelector);
  const bounds = await end.evaluate(element => {
    const rect = element.getBoundingClientRect();
    const parent = element.closest('[role="region"]').getBoundingClientRect();
    return { left: rect.left, right: rect.right, parentLeft: parent.left, parentRight: parent.right };
  });
  assert.ok(bounds.left >= bounds.parentLeft - 1 && bounds.right <= bounds.parentRight + 1, JSON.stringify(bounds));
}

try {
  await go("/orders");
  await expectOrderIds(["o1", "o2", "o3", "o4", "o5"]);
  const search = page.locator("#orders-search");
  await search.fill("074");
  await expectOrderIds(["o2"]);
  await until(() => document.querySelector('[data-order-id="o2"]').dataset.selected === "true");
  assert.equal(await page.locator("main h2").first().textContent(), "#OHM-2026-074");
  assert.equal(await page.getByRole("link", { name: "Full Details Page" }).getAttribute("href"), "/orders/o2");
  await search.fill("NE555");
  await expectOrderIds(["o2"]);
  await search.fill("Cabanatuan");
  await expectOrderIds(["o4"]);
  await page.getByRole("button", { name: "Clear search", exact: true }).click();
  for (const [name, ids] of [["Preparing", ["o1"]], ["Out for Delivery", ["o2"]], ["Ready for Pickup", ["o3"]], ["Completed", ["o4"]], ["Cancelled", ["o5"]]]) {
    await page.getByRole("button", { name, exact: true }).click();
    await expectOrderIds(ids);
    assert.equal(await page.locator("main h2").first().textContent(), "#" + orders.getMockOrderById(ids[0]).orderNumber);
  }
  await page.getByRole("button", { name: "All", exact: true }).click();
  await search.fill("does-not-exist");
  await expectOrderIds([]);
  assert.equal(await page.getByRole("heading", { name: "No matching orders found" }).count(), 1);
  await page.getByRole("button", { name: "Clear Filters" }).click();
  await expectOrderIds(["o1", "o2", "o3", "o4", "o5"]);
  await page.locator('[data-order-id="o2"]').getByRole("link", { name: "Details" }).focus();
  await page.keyboard.press("Enter");
  await page.waitForURL("**/orders/o2");
  await page.getByRole("link", { name: "Back to Orders" }).click();
  await page.waitForURL("**/orders");
  await shot("orders-desktop", true);
  console.log("PASS filtered list/selected preview, SKU/address/status/reset/empty results and keyboard Details link");

  for (const order of orders.getMockOrders()) {
    await go("/orders/" + order.id);
    assert.equal(await page.locator("main h1").textContent(), order.orderNumber);
    const rows = page.locator("[data-order-items] tbody tr");
    assert.equal(await rows.count(), order.items.length);
    for (const [index, item] of order.items.entries()) {
      const row = rows.nth(index);
      assert.ok((await row.innerText()).includes(item.productName));
      const cells = await row.locator("td").allTextContents();
      const money = amount => "₱" + amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      assert.equal(cells[2].trim(), money(item.price));
      assert.equal(cells[3].trim(), String(item.qty));
      assert.equal(cells[4].trim(), money(item.price * item.qty));
      assert.ok((await page.locator("main").innerText()).includes(money(order.totalAmount)));
    }
    if (order.status === "CANCELLED") assert.equal(await page.getByText("Order Cancelled", { exact: true }).count(), 1);
    else {
      const labels = await page.locator("[data-timeline] > div > span").allTextContents();
      assert.deepEqual(labels.map(label => label.trim()), orders.getTimelineStepsForOrder(order).steps.map(status => orders.ORDER_STATUS_META[status].label));
    }
    assert.equal(await page.getByText("Need help with this order? Contact support.", { exact: true }).count(), 1);
  }
  await go("/orders/unknown");
  assert.equal(await page.getByRole("heading", { name: "Order Not Found" }).count(), 1);
  await go("/orders/o2");
  await page.evaluate(() => { navigator.clipboard.writeText = async () => { throw new Error("denied"); }; });
  await page.getByRole("button", { name: "PH-TRK-20260821-4471" }).click();
  await page.getByText("Unable to copy. Tracking: PH-TRK-20260821-4471", { exact: true }).waitFor();
  await page.evaluate(() => { window.print = () => document.body.setAttribute("data-print-requested", "true"); });
  await page.getByRole("button", { name: "Invoice", exact: true }).click();
  assert.equal(await page.locator("body").getAttribute("data-print-requested"), "true");
  await shot("order-detail-desktop", true);
  console.log("PASS all five rendered order fixtures, fulfillment labels, unknown ID, clipboard rejection, print invocation (not paper certification)");

  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: width === 320 ? 568 : 844 });
    for (const id of ["o1", "o3"]) {
      await go("/orders/" + id);
      await scrollRegion("[data-order-items-scroll]", "th:last-child");
      await scrollRegion("[data-timeline-scroll]", '[data-timeline] > div:nth-last-child(2) > span');
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await targets("main button, main a");
      await shot("detail-scrolled-" + id + "-" + width);
      await page.locator("[data-order-items-scroll], [data-timeline-scroll]").evaluateAll(elements => elements.forEach(element => { element.scrollTo({ left: 0, behavior: "instant" }); }));
      await page.evaluate(() => scrollTo(0, 0));
      await shot("detail-" + id + "-" + width, true);
    }
  }
  for (const width of [768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await go("/home");
    for (const name of ["Orders", "Chat"]) {
      const link = page.getByRole("navigation", { name: "Buyer Primary Navigation" }).getByRole("link", { name, exact: true });
      assert.equal(await link.isVisible(), true);
      const box = await link.boundingBox();
      assert.ok(box.x >= 0 && box.x + box.width <= width);
    }
  }
  console.log("PASS order table/timeline scroll and targets at 320/390/768; implemented navigation at tablet/desktop widths");

  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await go("/notifications");
    await badge(3);
    const first = page.locator('[data-notification-id="n1"]');
    await first.getByRole("button", { name: "Dismiss notification: Order Out for Delivery" }).focus();
    await page.keyboard.press(width === 1440 ? "Enter" : "Space");
    await until(() => !document.querySelector('[data-notification-id="n1"]'));
    assert.equal(new URL(page.url()).pathname, "/notifications");
    await badge(2);
    await until(() => document.activeElement.id === "notification-open-n2");
    await page.getByRole("button", { name: "Unread only" }).click();
    assert.deepEqual(await page.locator("[data-notification-id]").evaluateAll(elements => elements.map(element => element.dataset.notificationId)), ["n2", "n3"]);
    await page.locator("#notification-open-n2").click();
    await page.waitForURL("**/orders/o3");
    await badge(1);
    await page.getByRole("link", { name: "View notifications", exact: true }).filter({ visible: true }).click();
    await page.waitForURL("**/notifications");
    await page.getByRole("button", { name: "Unread only" }).click();
    assert.deepEqual(await page.locator("[data-notification-id]").evaluateAll(elements => elements.map(element => element.dataset.notificationId)), ["n3"]);
    await page.getByRole("button", { name: "Mark all read" }).click();
    await badge(0);
    await page.getByRole("heading", { name: "No unread notifications" }).waitFor();
    await page.getByRole("button", { name: "All (7)", exact: true }).click();
    await page.locator('#notification-open-n4').click();
    await page.waitForURL("**/products/6");
    await page.getByRole("heading", { name: "DHT22 Temp & Humidity Sensor Module", exact: true }).waitFor();
    await page.getByRole("link", { name: "View notifications", exact: true }).filter({ visible: true }).click();
    await page.waitForURL("**/notifications");
    await badge(0);
    assert.equal(await page.locator("[data-notification-id]").count(), 7);
    await page.locator('#notification-open-n8').click();
    await page.waitForURL("**/products/3");
    await page.getByRole("heading", { name: "0.96 inch I2C OLED Display (Blue)", exact: true }).waitFor();
    await page.getByRole("link", { name: "View notifications", exact: true }).filter({ visible: true }).click();
    await page.waitForURL("**/notifications");
    await targets("main button");
    await shot("notifications-" + width, true);
    await page.getByRole("button", { name: "Clear all", exact: true }).click();
    await badge(0);
    assert.equal(await page.locator("[data-notification-id]").count(), 0);
    await page.getByRole("heading", { name: "No notifications", exact: true }).waitFor();
  }
  console.log("PASS desktop/mobile bell state, Enter/Space dismissal, focus return, unread filter, product destinations, mark/clear and client retention");

  await page.setViewportSize({ width: 1440, height: 900 });
  await go("/chat?convo=c2&orderRef=OHM-2026-074");
  await page.getByRole("heading", { name: "Fulfillment Team", exact: true }).waitFor();
  assert.equal(await page.locator("#chat-message-input").inputValue(), "Hello! I have a question regarding order #OHM-2026-074.");
  assert.equal(await page.getByText("Hello! I have a question regarding order #OHM-2026-074.", { exact: true }).count(), 0);
  await page.waitForTimeout(1300); // Negative assertion: no automatic submission/reply.
  assert.equal(await page.getByText("Hello! I have a question regarding order #OHM-2026-074.", { exact: true }).count(), 0);
  await page.locator('[data-conversation-id="c1"]').click();
  await page.waitForURL("**/chat?convo=c1");
  await page.getByRole("heading", { name: "OhmSim Support", exact: true }).waitFor();
  await page.goBack();
  await page.getByRole("heading", { name: "Fulfillment Team", exact: true }).waitFor();
  await go("/chat?convo=missing&orderRef=unknown");
  await page.getByText("Conversation not found. Select a conversation to start chatting.", { exact: true }).waitFor();
  await go("/chat?convo=c1&orderRef=unknown");
  await page.getByText("Order reference not found. Check the reference or send a general inquiry.", { exact: true }).waitFor();
  assert.equal(await page.locator("#chat-message-input").inputValue(), "");
  await page.locator("#chat-message-input").fill("   ");
  assert.equal(await page.getByRole("button", { name: "Send message" }).isDisabled(), true);
  await page.locator("#chat-message-input").fill("Batch 3 explicit message");
  await page.getByRole("button", { name: "Send message" }).click();
  await page.getByText("Batch 3 explicit message", { exact: true }).filter({ visible: true }).last().waitFor();
  assert.equal(await page.locator("#chat-message-input").inputValue(), "");
  await shot("chat-desktop");

  const validPng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/khoAAAAASUVORK5CYII=", "base64");
  await page.evaluate(() => {
    const revoke = URL.revokeObjectURL.bind(URL);
    window.__testRevokedUrls = [];
    window.__testCreatedUrls = [];
    const create = URL.createObjectURL.bind(URL);
    URL.createObjectURL = file => { const value = create(file); window.__testCreatedUrls.push(value); return value; };
    URL.revokeObjectURL = value => { window.__testRevokedUrls.push(value); revoke(value); };
  });
  await page.locator("#chat-file-input").setInputFiles({ name: "renamed.png", mimeType: "application/x-msdownload", buffer: validPng });
  await page.getByRole("alert").filter({ hasText: "Unsupported file type" }).waitFor();
  assert.equal(await page.locator("#pending-attachment-pill").count(), 0);
  await page.locator("#chat-file-input").setInputFiles({ name: "draft.png", mimeType: "image/png", buffer: validPng });
  const draftUrl = await page.evaluate(() => window.__testCreatedUrls.at(-1));
  assert.equal(await page.locator("#pending-attachment-pill").count(), 1);
  await page.locator("#chat-file-input").setInputFiles({ name: "replacement.txt", mimeType: "text/plain", buffer: Buffer.from("replacement") });
  assert.deepEqual(await page.evaluate(() => window.__testRevokedUrls), [draftUrl]);
  const replacementUrl = await page.evaluate(() => window.__testCreatedUrls.at(-1));
  await page.getByRole("button", { name: "Remove attachment" }).click();
  assert.deepEqual(await page.evaluate(() => window.__testRevokedUrls), [draftUrl, replacementUrl]);
  // Minimal structurally valid one-page PDF fixture with an actual xref table.
  const pdfObjects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 72 72] /Contents 4 0 R >>",
    "<< /Length 0 >>\nstream\n\nendstream",
  ];
  let pdfText = "%PDF-1.4\n";
  const offsets = [];
  for (const [index, object] of pdfObjects.entries()) {
    offsets.push(Buffer.byteLength(pdfText));
    pdfText += `${index + 1} 0 obj\n${object}\nendobj\n`;
  }
  const xrefOffset = Buffer.byteLength(pdfText);
  pdfText += "xref\n0 5\n0000000000 65535 f \n" + offsets.map(offset => String(offset).padStart(10, "0") + " 00000 n \n").join("");
  pdfText += `trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  const files = [
    { name: "sent.png", mimeType: "image/png", buffer: validPng },
    { name: "sent.pdf", mimeType: "application/pdf", buffer: Buffer.from(pdfText) },
    { name: "sent.txt", mimeType: "text/plain", buffer: Buffer.from("Retained attachment") },
  ];
  const sentUrls = [];
  for (const file of files) {
    await page.locator("#chat-file-input").setInputFiles(file);
    await page.getByRole("button", { name: "Send message" }).click();
    const attachment = file.mimeType.startsWith("image/") ? page.locator('img[alt="sent.png"]') : page.getByRole("link", { name: "Download " + file.name, exact: true });
    await attachment.waitFor();
    const attachmentUrl = await attachment.getAttribute(file.mimeType.startsWith("image/") ? "src" : "href");
    sentUrls.push(attachmentUrl);
    const actualBytes = await page.evaluate(async value => Array.from(new Uint8Array(await (await fetch(value)).arrayBuffer())), attachmentUrl);
    assert.deepEqual(actualBytes, [...file.buffer], "Downloaded attachment bytes match selected file");
    const downloadLink = page.getByRole("link", { name: "Download " + file.name, exact: true });
    const downloadPromise = page.waitForEvent("download");
    await downloadLink.click();
    const download = await downloadPromise;
    assert.equal(download.suggestedFilename(), file.name);
    assert.equal(await download.failure(), null);
  }
  await until(() => { const image = document.querySelector('img[alt="sent.png"]'); return image?.complete && image.naturalWidth === 1; });
  assert.equal(await page.evaluate(() => window.__testRevokedUrls.length), 2, "Sent URLs not revoked");
  await page.locator("main").getByRole("link", { name: "Orders", exact: true }).click();
  await page.waitForURL("**/orders");
  await page.getByRole("navigation", { name: "Buyer Primary Navigation" }).getByRole("link", { name: "Chat", exact: true }).click();
  await page.waitForURL("**/chat");
  for (const attachmentUrl of sentUrls) assert.equal(await page.evaluate(async value => (await fetch(value)).ok, attachmentUrl), true);
  await until(() => { const image = document.querySelector('img[alt="sent.png"]'); return image?.complete && image.naturalWidth === 1; });
  await page.locator('[data-conversation-id="c2"]').click();
  await page.locator('[data-conversation-id="c1"]').click();
  for (const attachmentUrl of sentUrls) assert.equal(await page.evaluate(async value => (await fetch(value)).ok, attachmentUrl), true);
  await page.getByRole("link", { name: "Exit Store", exact: true }).click();
  await page.waitForURL(url + "/");
  await until(expected => JSON.stringify(window.__testRevokedUrls) === JSON.stringify(expected), [draftUrl, replacementUrl, ...sentUrls]);
  console.log("PASS conversation query/back/invalid references, no auto-send, explicit/whitespace send, MIME rejection, real PNG decode/download, replacement/removal, sent image/PDF/text retention and Buyer-session disposal");

  for (const width of [320, 390, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: width === 320 ? 480 : 844 });
    await go("/chat");
    if (width < 768) await page.getByRole("button", { name: "Back to conversations list" }).click();
    await targets("main button, main a, main input:not([type=file])");
    await page.getByRole("button", { name: "Start new conversation" }).click();
    await page.locator("#new-convo-topic").waitFor();
    await targets("main button, main a, main input:not([type=file])");
    await page.locator("#new-convo-topic").fill("Short viewport inquiry");
    await page.getByRole("button", { name: "Start", exact: true }).click();
    await page.getByRole("heading", { name: "Short viewport inquiry", exact: true }).waitFor();
    await page.locator("#chat-file-input").setInputFiles(files[2]);
    await targets("main button, main a, main input:not([type=file])");
    assert.equal(await page.getByRole("button", { name: "Send message" }).isEnabled(), true);
    const composer = await page.locator("#chat-message-input").boundingBox();
    assert.ok(composer.width >= 44 && composer.x >= 0 && composer.x + composer.width <= width);
    assert.ok(composer.y >= 0 && composer.y + composer.height <= (width < 768 ? (width === 320 ? 480 : 844) - 52 : 844));
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    for (const selector of ["#chat-message-input", 'button[aria-label="Send message"]', 'button[aria-label="Remove attachment"]']) {
      const hits = await page.locator(selector).evaluate(element => {
        const bounds = element.getBoundingClientRect();
        const hit = document.elementFromPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
        return element === hit || element.contains(hit);
      });
      assert.equal(hits, true, "Composer control receives pointer input: " + selector);
    }
    await shot("chat-open-attachment-" + width);
    await page.getByRole("button", { name: "Remove attachment" }).click();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await go("/orders");
  await targets("main button, main a, main input");
  await shot("orders-mobile", true);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await go("/chat");
  await page.locator("#chat-message-input").fill("Reduced motion message");
  await page.getByRole("button", { name: "Send message" }).click();
  await page.getByText("Reduced motion message", { exact: true }).last().waitFor();
  assert.deepEqual(errors, [], "Unexpected console/page errors");
  console.log("PASS open chat/list/new inquiry/attachment targets, short/narrow composer bounds, screenshots and reduced-motion send");
} catch (error) {
  console.error("FAILED at", page.url(), "\n", await page.locator("main").innerText(), "\nBrowser errors:", errors);
  await shot("failure");
  throw error;
} finally {
  await browser.close();
}
