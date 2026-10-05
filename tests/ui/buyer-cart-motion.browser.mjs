import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || path.join(
  process.env.LOCALAPPDATA || "", "Programs/Antigravity IDE/resources/app/node_modules/playwright"));
const url = process.env.BUYER_URL || "http://localhost:3105";
const browser = await chromium.launch({ headless: true, channel: process.platform === "win32" ? "msedge" : undefined });
const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "no-preference" });
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  page.on("response", response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });

  async function visit(route, width = 1440) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${url}${route}`);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => [...document.querySelectorAll("[data-cart-source] img")]
      .filter(image => image.getBoundingClientRect().width > 0).every(image => image.complete && image.naturalWidth > 0));
  }

  async function checkFlight(button, target, screenshot) {
    await button.click();
    const flight = page.locator("[data-cart-flight]").last();
    await flight.waitFor();
    const measured = await flight.evaluate((element, targetName) => {
      const animation = element.getAnimations()[0];
      animation.pause();
      const destination = document.querySelector(`[data-cart-icon='${targetName}']`).getBoundingClientRect();
      const x = parseFloat(element.style.left) + 20;
      const y = parseFloat(element.style.top) + 20;
      const dx = parseFloat(element.style.getPropertyValue("--fly-x"));
      const dy = parseFloat(element.style.getPropertyValue("--fly-y"));
      animation.currentTime = 0;
      const start = element.getBoundingClientRect();
      animation.currentTime = 650;
      const end = element.getBoundingClientRect();
      const opacity = getComputedStyle(element).opacity;
      animation.currentTime = 325;
      const middle = element.getBoundingClientRect();
      const hit = document.elementFromPoint(middle.x + middle.width / 2, middle.y + middle.height / 2);
      const image = element.querySelector("img");
      return {
        duration: animation.effect.getTiming().duration,
        width: getComputedStyle(element).width, height: getComputedStyle(element).height,
        x, y, dx, dy, targetX: destination.x + destination.width / 2, targetY: destination.y + destination.height / 2,
        startX: start.x + start.width / 2, startY: start.y + start.height / 2,
        endX: end.x + end.width / 2, endY: end.y + end.height / 2, endWidth: end.width, opacity,
        middleMoved: Math.abs(middle.x + middle.width / 2 - x) > 1 || Math.abs(middle.y + middle.height / 2 - y) > 1,
        pointerEvents: getComputedStyle(element.parentElement).pointerEvents,
        ariaHidden: element.parentElement.getAttribute("aria-hidden"),
        blocksPointer: hit && element.parentElement.contains(hit),
        imageLoaded: image.complete && image.naturalWidth > 0,
      };
    }, target);
    assert.equal(measured.duration, 650);
    assert.equal(measured.width, "40px"); assert.equal(measured.height, "40px");
    assert.ok(Math.abs(measured.startX - measured.x) < 0.5 && Math.abs(measured.startY - measured.y) < 0.5);
    assert.ok(Math.abs(measured.x + measured.dx - measured.targetX) < 0.5);
    assert.ok(Math.abs(measured.y + measured.dy - measured.targetY) < 0.5);
    assert.ok(Math.abs(measured.endX - measured.targetX) < 0.5 && Math.abs(measured.endY - measured.targetY) < 0.5);
    assert.ok(Math.abs(measured.endWidth - 8) < 0.5);
    assert.equal(measured.opacity, "0"); assert.equal(measured.middleMoved, true);
    assert.equal(measured.pointerEvents, "none"); assert.equal(measured.ariaHidden, "true");
    assert.ok(!measured.blocksPointer); assert.equal(measured.imageLoaded, true);
    if (screenshot) await page.screenshot({ path: `docs/design/buyer/screenshots/${screenshot}` });
    const bounce = page.locator(`[data-cart-bounce='${target}']`);
    await bounce.waitFor();
    const bounceTiming = await bounce.evaluate(element => element.getAnimations()[0].effect.getTiming().duration);
    assert.equal(bounceTiming, 500);
    await page.waitForFunction(() => !document.querySelector("[data-cart-flight], [data-cart-bounce]"));
    console.log(`PASS: 40px cached thumbnail travels to visible ${target} cart in 650ms, shrinks/fades, bounces and cleans up`);
  }

  await visit("/home");
  await checkFlight(page.locator("[data-home-featured]").getByRole("button", { name: "Add Espressif ESP32-WROOM-32U Kit to cart", exact: true }), "desktop", "cart-flight-home-desktop-1440.png");
  assert.equal((await page.locator("#metric-cart-items p").first().textContent()).trim(), "1");

  // Real, uninterrupted rapid clicks: separate particle IDs and no lost additions.
  const homeAdd = page.locator("[data-home-featured]").getByRole("button", { name: "Add Arduino Uno R3 Compatible Board to cart", exact: true });
  await homeAdd.evaluate(button => { button.click(); button.click(); });
  const ids = await page.locator("[data-cart-flight]").evaluateAll(elements => elements.map(element => element.dataset.cartFlight));
  assert.equal(ids.length, 2); assert.equal(new Set(ids).size, 2);
  assert.equal((await page.locator("#metric-cart-items p").first().textContent()).trim(), "3");
  console.log("PASS: rapid clicks create independent flights and cart quantity updates immediately, before arrival");
  await page.waitForFunction(() => !document.querySelector("[data-cart-flight], [data-cart-bounce]"));

  await homeAdd.focus();
  await homeAdd.press("Enter");
  await page.locator("[data-cart-flight]").waitFor();
  assert.equal(await homeAdd.evaluate(button => button === document.activeElement), true);
  await page.waitForFunction(() => !document.querySelector("[data-cart-flight], [data-cart-bounce]"));
  console.log("PASS: keyboard addition animates without moving focus to the decorative overlay");

  await visit("/products");
  await checkFlight(page.locator(".hidden.md\\:grid").getByRole("button", { name: "Add DHT22 Temp & Humidity Sensor Module to cart", exact: true }), "desktop");
  await visit("/products/6");
  await page.getByRole("button", { name: "Increase quantity", exact: true }).click();
  await checkFlight(page.locator("#product-add-to-cart-btn"), "desktop");
  assert.match(await page.locator("#product-stock-display").textContent(), /2 in cart, 6 remaining/);

  await visit("/home", 390);
  await checkFlight(page.locator(".grid.md\\:hidden").getByRole("button", { name: "Add Espressif ESP32-WROOM-32U Kit to cart", exact: true }), "mobile", "cart-flight-home-mobile-390.png");
  await visit("/products", 390);
  await checkFlight(page.locator(".grid.md\\:hidden").getByRole("button", { name: "Add Arduino Uno R3 Compatible Board to cart", exact: true }), "mobile");
  await visit("/products/6", 390);
  await checkFlight(page.locator("#product-add-to-cart-btn"), "mobile");

  // An unavailable action must not produce success motion.
  await page.locator("#product-qty-stepper").getByRole("button", { name: "Increase quantity", exact: true }).evaluate(button => {
    for (let i = 0; i < 6; i++) button.click();
  });
  await page.locator("#product-add-to-cart-btn").click();
  await page.waitForFunction(() => !document.querySelector("[data-cart-flight], [data-cart-bounce]"));
  assert.equal(await page.locator("#product-add-to-cart-btn").isDisabled(), true);
  await page.locator("#product-add-to-cart-btn").evaluate(button => button.click());
  assert.equal(await page.locator("[data-cart-flight]").count(), 0);
  console.log("PASS: stock-boundary disabled action creates no flight or bounce");

  // Before React re-renders the disabled card, the actual shared action rejects
  // click 9. The rejection must not create particle ID 9 or claim success.
  await visit("/products");
  const limitedCard = page.locator(".hidden.md\\:grid").getByRole("button", {
    name: "Add DHT22 Temp & Humidity Sensor Module to cart", exact: true,
  });
  await limitedCard.evaluate(button => { for (let i = 0; i < 9; i++) button.click(); });
  assert.equal(await page.locator("header [data-cart-count]").textContent(), "8");
  const cappedIds = await page.locator("[data-cart-flight]").evaluateAll(elements => elements.map(element => Number(element.dataset.cartFlight)));
  assert.equal(cappedIds.length, 6);
  assert.equal(Math.max(...cappedIds), 8);
  await page.getByRole("status").filter({ hasText: "maximum available stock" }).waitFor();
  assert.ok((await page.getByRole("status").allTextContents()).some(text => text.includes("maximum available stock")));
  await page.waitForFunction(() => !document.querySelector("[data-cart-flight], [data-cart-bounce]"));
  console.log("PASS: actual queued overstock rejection creates no success flight; visual clutter capped at six");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await visit("/home");
  await page.locator("[data-home-featured]").getByRole("button", { name: "Add Espressif ESP32-WROOM-32U Kit to cart", exact: true }).click();
  assert.equal((await page.locator("#metric-cart-items p").first().textContent()).trim(), "1");
  assert.equal(await page.locator("[data-cart-flight], [data-cart-bounce]").count(), 0);
  await page.getByRole("status").filter({ hasText: "Added Espressif" }).waitFor();
  assert.ok((await page.getByRole("status").allTextContents()).some(text => text.includes("Added")));
  console.log("PASS: reduced motion skips flight/bounce while preserving cart updates and live feedback");

  await page.emulateMedia({ reducedMotion: "no-preference" });
  await homeAdd.click();
  await page.locator("[data-cart-flight]").waitFor();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForFunction(() => !document.querySelector("[data-cart-flight], [data-cart-bounce]"));
  await page.waitForTimeout(1200); // Ensure cancelled timers cannot create a late bounce.
  assert.equal(await page.locator("[data-cart-bounce]").count(), 0);
  console.log("PASS: changing motion preference during a flight cancels particles and pending bounce");

  await page.emulateMedia({ reducedMotion: "no-preference" });
  await homeAdd.click();
  await page.locator("[data-cart-flight]").waitFor();
  await page.getByRole("link", { name: "Exit Store", exact: true }).click();
  await page.waitForURL(`${url}/`);
  await page.waitForTimeout(1200); // Verify unmount clears delayed visual work.
  assert.equal(await page.locator("[data-cart-flight-overlay], [data-cart-bounce]").count(), 0);
  assert.deepEqual(errors, []);
  console.log("PASS: leaving Buyer cleans up the portal/timers; zero browser/resource errors");
} finally {
  await browser.close();
}
