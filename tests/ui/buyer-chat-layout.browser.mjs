import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

// Real Next.js DOM checks of the saved Chat composition, not component stubs.
// Messaging is a local demo; these checks do not certify support delivery or live Figma.
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || path.join(
  process.env.LOCALAPPDATA || "", "Programs/Antigravity IDE/resources/app/node_modules/playwright"));
const url = process.env.BUYER_URL || "http://localhost:3113";
const screenshots = process.env.SCREENSHOT_DIR;
if (screenshots) fs.mkdirSync(screenshots, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: process.platform === "win32" ? "msedge" : undefined });
const errors = [];
const measurements = [];
const page = await browser.newPage({ reducedMotion: "reduce" });
page.on("pageerror", error => errors.push(error.message));
page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
page.on("response", response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });

async function go(width, height, query = "") {
  await page.setViewportSize({ width, height });
  await page.goto(`${url}/chat${query}`);
  await page.getByRole("heading", { name: "OhmSim Support", exact: true }).waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => document.querySelector('[data-chat-message-from="buyer"]'));
}

async function shot(name) {
  if (screenshots) await page.screenshot({ path: path.join(screenshots, name + ".png") });
}

async function layout(width, height) {
  const geometry = await page.evaluate(() => {
    const box = selector => {
      const element = document.querySelector(selector);
      const rect = element.getBoundingClientRect();
      return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom,
        width: rect.width, height: rect.height, client: element.clientWidth, scroll: element.scrollWidth };
    };
    return { root: box("[data-buyer-chat]"), layout: box("[data-chat-layout]"),
      sidebar: box("[data-chat-sidebar]"), thread: box("[data-chat-thread]"),
      messages: box("[data-chat-messages]"), composer: box("[data-chat-composer]"),
      documentWidth: document.documentElement.scrollWidth, documentHeight: document.documentElement.scrollHeight };
  });
  for (const key of ["root", "layout"]) {
    assert.ok(Math.abs(geometry[key].left) < 1 && Math.abs(geometry[key].width - width) < 1,
      `${key} fills the viewport without centered gutters at ${width}px: ${JSON.stringify(geometry)}`);
  }
  if (width >= 768) {
    assert.equal(geometry.sidebar.width, 256, "Desktop conversation sidebar matches the saved 256px composition");
    assert.equal(geometry.thread.left, geometry.sidebar.right);
    assert.ok(Math.abs(geometry.thread.right - width) < 1);
  } else {
    assert.equal(geometry.sidebar.width, 0, "Mobile opens the thread, not two competing columns");
    assert.equal(geometry.thread.left, 0);
    assert.equal(geometry.thread.width, width);
  }
  assert.ok(geometry.composer.bottom <= height - (width < 768 ? 64 : 0) + 1,
    "Composer stays above the mobile navigation and inside short viewports");
  assert.ok(geometry.messages.height > 44, "Messages retain a usable independent scroll area");
  for (const key of ["thread", "messages", "composer"]) {
    assert.ok(geometry[key].left >= 0 && geometry[key].right <= width + 1);
    assert.equal(geometry[key].scroll, geometry[key].client, `${key} has no hidden horizontal child overflow`);
  }
  assert.ok(geometry.documentWidth <= width && geometry.documentHeight <= height + 1,
    "Chat fits the window; only the message/list regions scroll");
  measurements.push({ width, height, ...geometry });
}

async function hitTargets(selector, scroll = false) {
  const controls = page.locator(selector);
  assert.ok(await controls.count() > 0, "Required controls must exist; never silently skip");
  for (const control of await controls.all()) {
    if (scroll) await control.evaluate(element => element.scrollIntoView({ block: "center", behavior: "instant" }));
    const target = await control.evaluate(element => {
      const rect = element.getBoundingClientRect();
      const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      return { name: element.getAttribute("aria-label") || element.id || element.textContent,
        width: rect.width, height: rect.height, left: rect.left, right: rect.right,
        top: rect.top, bottom: rect.bottom, hit: hit === element || element.contains(hit),
        viewportWidth: innerWidth, viewportHeight: innerHeight };
    });
    assert.ok(target.width >= 43.99 && target.height >= 43.99, JSON.stringify(target));
    assert.ok(target.left >= 0 && target.right <= target.viewportWidth + 1 &&
      target.top >= 0 && target.bottom <= target.viewportHeight + 1 && target.hit,
    "Entire control fits and receives pointer input: " + JSON.stringify(target));
  }
}

async function threadGeometry(width) {
  const geometry = await page.locator("[data-chat-messages]").evaluate(region => {
    const rect = region.getBoundingClientRect();
    const style = getComputedStyle(region);
    const left = rect.left + parseFloat(style.paddingLeft);
    const right = rect.right - parseFloat(style.paddingRight);
    const boxes = selector => [...region.querySelectorAll(selector)].map(element => {
      const box = element.getBoundingClientRect();
      return { left: box.left, right: box.right, width: box.width,
        client: element.clientWidth, scroll: element.scrollWidth,
        sender: element.closest("[data-chat-message-from]")?.dataset.chatMessageFrom };
    });
    return { left, right, references: boxes("[data-chat-reference]"), bubbles: boxes("[data-chat-bubble]") };
  });
  assert.equal(geometry.references.length, 2, "Both production fixture reference cards are rendered");
  for (const card of geometry.references) {
    assert.ok(Math.abs(card.left - geometry.left) < 1, "Reference cards align to the thread left edge, not its center");
    assert.ok(card.width <= 320 && card.right <= geometry.right + 1);
    assert.equal(card.scroll, card.client);
  }
  assert.equal(geometry.bubbles.length, 2, "Initial fixture has exactly one buyer and one support bubble");
  for (const bubble of geometry.bubbles) {
    assert.ok(bubble.left >= geometry.left - 1 && bubble.right <= geometry.right + 1);
    assert.ok(bubble.width <= (width >= 768 ? 384 : (geometry.right - geometry.left) * 0.85) + 1,
      "Bubbles stay compact rather than expanding to 70% of a wide thread");
    assert.equal(bubble.scroll, bubble.client, "Message text wraps without hidden overflow");
    assert.ok(Math.abs((bubble.sender === "buyer" ? bubble.right - geometry.right : bubble.left - geometry.left)) < 1,
      "Buyer messages align right; support messages align left");
  }
  await hitTargets("[data-chat-reference] a", true);
  await page.locator("[data-chat-messages]").evaluate(element => { element.scrollTop = 0; });
}

try {
  for (const width of [320, 390, 768, 1024, 1440, 1536, 1920]) {
    await go(width, 900);
    await layout(width, 900);
    await threadGeometry(width);
    await hitTargets("[data-chat-composer] button, #chat-message-input");
    await shot(`chat-layout-${width}`);
    console.log(`PASS: full-width Chat, 256px desktop sidebar, left reference cards, compact aligned bubbles and visible composer at ${width}px`);
  }

  for (const width of [320, 390, 768, 1024]) {
    await go(width, 420, "?convo=c1&orderRef=o1");
    await page.waitForFunction(() => document.querySelector("#chat-message-input").value.includes("OHM-2026-089"));
    await layout(width, 420);
    await page.locator("#chat-file-input").setInputFiles({
      name: "a-long-local-attachment-name-for-short-window-layout.txt", mimeType: "text/plain", buffer: Buffer.from("Layout fixture only."),
    });
    await page.locator("#pending-attachment-pill").waitFor();
    // The inquiry notice and attachment both occupy space; controls must still work.
    const region = await page.locator("[data-chat-messages]").boundingBox();
    assert.ok(region.height > 0, "Thread remains scrollable when an attachment and order draft are open");
    await hitTargets("[data-chat-composer] button, #chat-message-input");
    await shot(`chat-short-attachment-${width}`);
    await page.getByRole("button", { name: "Remove attachment" }).click();
    await page.waitForFunction(() => !document.querySelector("#pending-attachment-pill"));

    if (width < 768) await page.getByRole("button", { name: "Back to conversations list" }).click();
    const sidebar = await page.locator("[data-chat-sidebar]").boundingBox();
    assert.equal(sidebar.width, width < 768 ? width : 256);
    await hitTargets("[data-chat-sidebar] [aria-label='Start new conversation'], #search-convos");
    await page.getByRole("button", { name: "Start new conversation" }).click();
    await page.locator("#new-convo-topic").waitFor();
    await hitTargets("[data-chat-sidebar] form input, [data-chat-sidebar] form button");
    await shot(`chat-short-new-inquiry-${width}`);
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    await page.waitForFunction(() => !document.querySelector("#new-convo-topic"));
    await hitTargets("[data-conversation-id]", true);
    await page.locator('[data-conversation-id="c1"]').click();
    await page.locator("[data-chat-composer]").waitFor({ state: "visible" });
    await hitTargets("[data-chat-composer] button, #chat-message-input");
    console.log(`PASS: order draft, pending attachment, inline inquiry and scrollable conversation controls at ${width}x420`);
  }

  await go(1440, 600);
  const longText = "A long local layout test message: " + "unbroken-component-reference".repeat(40);
  const count = await page.locator('[data-chat-message-from="buyer"]').count();
  await page.locator("#chat-message-input").fill(longText);
  await page.getByRole("button", { name: "Send message" }).focus();
  await page.keyboard.press("Enter");
  await page.waitForFunction(expected => document.querySelectorAll('[data-chat-message-from="buyer"]').length === expected, count + 1);
  const sent = page.locator('[data-chat-message-from="buyer"] [data-chat-bubble]').last();
  assert.equal(await sent.textContent(), longText);
  const sentBounds = await sent.evaluate(element => {
    const rect = element.getBoundingClientRect();
    return { width: rect.width, height: rect.height, client: element.clientWidth, scroll: element.scrollWidth };
  });
  assert.ok(sentBounds.width <= 384 && sentBounds.height > 100, "Long messages wrap inside the compact bubble");
  assert.equal(sentBounds.scroll, sentBounds.client);
  await page.waitForFunction(() => document.querySelectorAll('[data-chat-message-from="admin"]').length > 1);
  const scrollState = await page.locator("[data-chat-messages]").evaluate(element => ({
    height: element.clientHeight, content: element.scrollHeight, overflow: getComputedStyle(element).overflowY,
  }));
  assert.ok(scrollState.content > scrollState.height && scrollState.overflow === "auto");
  await hitTargets("[data-chat-composer] button, #chat-message-input");
  await page.locator("[data-chat-thread]").getByRole("link", { name: "Orders", exact: true }).click();
  await page.waitForURL("**/orders");
  await page.goBack();
  await page.waitForURL("**/chat");
  await page.waitForFunction(text => [...document.querySelectorAll("[data-chat-bubble]")].some(element => element.textContent === text), longText);
  assert.equal(await page.locator('[data-chat-message-from="buyer"]').count(), count + 1, "Client navigation retains exactly one sent message");
  await shot("chat-long-message-scrolled");
  console.log("PASS: keyboard send, long unbroken text wrapping, independent message scrolling and client-navigation retention");
  assert.deepEqual(errors, [], "No page, console or HTTP response errors");
  console.log("PASS: strict browser error check");
  console.log("MEASUREMENTS: " + JSON.stringify(measurements));
} finally {
  await browser.close();
}
