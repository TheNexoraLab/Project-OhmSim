import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { createLoader } from "./helpers/load-typescript.mjs";

// Real Next.js client navigation/lifecycle checks. No production diagnostic globals.
const root = path.resolve(import.meta.dirname, "../..");
const load = createLoader(root);
const expectedOrderIds = load("services/order-service.ts").getMockOrders().map(order => order.id);
assert.equal(expectedOrderIds.length, 5, "Integration requires the reviewed Batch 3 fixtures");
const req = createRequire(import.meta.url);
const { chromium } = req(process.env.PLAYWRIGHT_MODULE_PATH ||
  path.join(process.env.LOCALAPPDATA || "", "Programs/Antigravity IDE/resources/app/node_modules/playwright"));
const url = process.env.BUYER_URL || "http://localhost:3113";
const screenshotDir = process.env.SCREENSHOT_DIR;
if (screenshotDir) fs.mkdirSync(screenshotDir, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: process.platform === "win32" ? "msedge" : undefined });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
const errors = [];
page.on("pageerror", error => errors.push(error.message));
page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
page.on("response", response => {
  if (response.status() >= 400 && response.url().startsWith(url)) errors.push(`${response.status()} ${response.url()}`);
});
async function textIs(selector, value) {
  await page.waitForFunction(({ selector, value }) => document.querySelector(selector)?.textContent.trim() === value, { selector, value });
}
async function attributeIs(selector, name, value) {
  await page.waitForFunction(({ selector, name, value }) => document.querySelector(selector)?.getAttribute(name) === value, { selector, name, value });
}
async function focused(selector) {
  await page.waitForFunction(selector => document.querySelector(selector) === document.activeElement, selector);
}
async function account() {
  await page.locator('[data-hydrated="true"] #profile-hero-card').waitFor();
  await page.locator("#profile-tab-account").click();
  await attributeIs("#profile-tab-account", "aria-selected", "true");
}
async function metrics(cart) {
  await textIs("#stat-orders-placed p:last-child", String(expectedOrderIds.length));
  await textIs("#stat-bom-projects p:last-child", "3");
  await textIs("#stat-cart-items p:last-child", String(cart));
}
async function addressSnapshot() {
  return page.locator("[data-address-id]").evaluateAll(elements => elements.map(element => ({
    id: element.dataset.addressId,
    text: element.textContent.replace(/\s+/g, " ").trim(),
    isDefault: !!element.querySelector("[data-default-badge]"),
  })));
}
async function addresses() {
  await page.locator("#profile-tab-addresses").click();
  await attributeIs("#profile-tab-addresses", "aria-selected", "true");
  return addressSnapshot();
}
async function desktopHome() {
  await page.locator('nav[aria-label="Buyer Primary Navigation"] a[href="/home"]').click();
  await page.locator("[data-buyer-home]").waitFor();
}
async function desktopProfile() {
  await page.locator('a[aria-label="View profile"]').click();
  await account();
  await attributeIs('a[aria-label="View profile"]', "aria-current", "page");
}
async function shot(name, fullPage = false) {
  if (screenshotDir) {
    await page.waitForFunction(() => [...document.querySelectorAll('[role="status"]')].every(element => element.childElementCount === 0));
    await page.screenshot({ path: path.join(screenshotDir, `${name}.png`), fullPage });
  }
}
async function visibleTarget(selector) {
  await page.locator(selector).scrollIntoViewIfNeeded();
  // Measure the settled control state, after transient toast feedback expires.
  // Keep a real hit-test prerequisite instead of hiding/removing the feedback.
  await page.waitForFunction(selector => {
    const element = document.querySelector(selector);
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    return !!hit && element.contains(hit);
  }, selector);
  const result = await page.locator(selector).evaluate(element => {
    const rect = element.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom,
      width: rect.width, height: rect.height, viewport: innerWidth, viewportHeight: innerHeight,
      hit: !!hit && element.contains(hit), hitElement: hit?.outerHTML.slice(0, 350) };
  });
  assert.ok(result.width >= 43.99 && result.height >= 43.99, JSON.stringify(result));
  assert.ok(result.left >= -1 && result.right <= result.viewport + 1 && result.top >= -1 && result.bottom <= result.viewportHeight + 1, JSON.stringify(result));
  assert.ok(result.hit, JSON.stringify(result));
}

try {
  await page.goto(url + "/home");
  await page.locator("[data-home-featured]").waitFor();
  await page.locator('[data-home-featured] button[aria-label="Add Espressif ESP32-WROOM-32U Kit to cart"]').click();
  await textIs("#metric-cart-items p:first-child", "1");
  await desktopProfile();
  await metrics(1);
  await page.locator("#profile-edit-btn").click();
  await focused("#profile-first-name");
  await page.locator("#profile-first-name").fill("Integration");
  await page.locator("#profile-save-btn").click();
  await textIs("#profile-full-name", "Integration Rivera");
  await focused("#profile-edit-btn");

  await addresses();
  await page.locator('[data-delete-address-btn="addr-lab"]').click();
  await page.waitForFunction(() => document.querySelectorAll("[data-address-id]").length === 1);
  await page.locator("#add-address-trigger-btn").click();
  await focused("#address-label");
  for (const [id, value] of Object.entries({
    "address-label": "Integration address", "address-recipient": "Alex Rivera",
    "address-contact": "09171234567", "address-city": "San Fernando",
    "address-barangay": "Dolores", "address-street": "789 Integration Street", "address-postal": "2000",
  })) await page.locator(`#${id}`).fill(value);
  await page.locator("#address-is-default-checkbox").check();
  await page.locator("#save-address-btn").click();
  await page.waitForFunction(() => document.querySelectorAll("[data-address-id]").length === 2 && !document.querySelector("#new-address-form-panel"));
  const savedAddresses = await addressSnapshot();
  const created = savedAddresses.find(address => address.id !== "addr-home");
  assert.ok(created?.isDefault && created.text.includes("789 Integration Street"));
  assert.equal(savedAddresses.filter(address => address.isDefault).length, 1);
  await focused(`[data-delete-address-btn="${created.id}"]`);
  await page.locator("#profile-tab-preferences").click();
  await attributeIs("#pref-toggle-emailOrders", "aria-checked", "true");
  await page.locator("#pref-toggle-emailOrders").click();
  await attributeIs("#pref-toggle-emailOrders", "aria-checked", "false");
  await account();
  await page.locator("#profile-my-orders-btn").click();
  await page.waitForFunction(ids => JSON.stringify([...document.querySelectorAll("[data-order-id]")].map(element => element.dataset.orderId)) === JSON.stringify(ids), expectedOrderIds);
  await shot("combined-orders-desktop");
  await desktopHome();
  await textIs("#metric-cart-items p:first-child", "1");
  await desktopProfile();
  await textIs("#profile-full-name", "Integration Rivera");
  await metrics(1);
  assert.deepEqual(await addresses(), savedAddresses, "Addresses/defaults must survive actual Buyer client navigation");
  await page.locator("#profile-tab-preferences").click();
  await attributeIs("#pref-toggle-emailOrders", "aria-checked", "false");
  await page.locator('a[aria-label="View shopping cart"]').click();
  await page.waitForURL("**/cart");
  await page.getByText("Espressif ESP32-WROOM-32U Kit", { exact: true }).first().waitFor();
  await desktopProfile();
  await metrics(1);
  await textIs("#profile-full-name", "Integration Rivera");
  await shot("combined-profile-desktop", true);
  console.log("PASS: Profile/header/Orders/Cart client navigation, exact metrics, saved identity/preferences/addresses/defaults");

  await desktopHome();
  await page.locator('[data-home-featured] a[href="/products/1"]').first().click();
  await page.getByRole("link", { name: "Contact Administrator" }).click();
  await page.waitForURL("**/chat");
  await page.getByRole("button", { name: "Send message" }).waitFor();
  console.log("PASS: Product contact action reaches the implemented Batch 3 Chat route");

  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 500 });
    const nav = page.locator('nav[aria-label="Mobile Bottom Navigation"]');
    await nav.locator('a[href="/home"]').click();
    await page.locator("[data-buyer-home]").waitFor();
    await nav.locator('a[href="/profile"]').click();
    await account();
    await attributeIs('nav[aria-label="Mobile Bottom Navigation"] a[href="/profile"]', "aria-current", "page");
    await textIs("#profile-full-name", "Integration Rivera");
    await metrics(1);
    await page.locator("#profile-tab-account").focus();
    await page.keyboard.press("End");
    await focused("#profile-tab-preferences");
    await attributeIs("#profile-tab-preferences", "aria-selected", "true");
    await visibleTarget("#profile-tab-preferences");
    await attributeIs("#pref-toggle-emailOrders", "aria-checked", "false");
    await visibleTarget("#pref-toggle-emailOrders");
    await shot(`combined-profile-preferences-${width}-short`);
    assert.deepEqual(await addresses(), savedAddresses);
  }
  console.log("PASS: Mobile Profile navigation, keyboard-selected tabs and visible/hit-tested targets at 320/390px short heights");

  await page.setViewportSize({ width: 1440, height: 900 });
  await account();
  await page.getByRole("link", { name: "Exit Store" }).click();
  await page.waitForURL(url + "/");
  await page.goBack();
  await account();
  await textIs("#profile-full-name", "Alex Rivera");
  await metrics(0);
  const resetAddresses = await addresses();
  assert.deepEqual(resetAddresses.map(address => ({ id: address.id, isDefault: address.isDefault })), [
    { id: "addr-home", isDefault: true }, { id: "addr-lab", isDefault: false },
  ]);
  assert.ok(resetAddresses.every(address => !address.text.includes("Integration")));
  await page.locator("#profile-tab-preferences").click();
  await attributeIs("#pref-toggle-emailOrders", "aria-checked", "true");
  await account();
  await shot("combined-profile-after-buyer-exit", true);
  console.log("PASS: Actual Buyer exit/remount resets profile/preferences/addresses/cart, without changing the five Order fixtures");
  assert.deepEqual(errors, [], "Combined routes must have no console/page/HTTP errors, including Orders prefetches");
  console.log("PASS: Buyer Batch 3/4 integration browser checks");
} finally {
  await browser.close();
}
