import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || path.join(
  process.env.LOCALAPPDATA || "", "Programs/Antigravity IDE/resources/app/node_modules/playwright"));
const base = process.env.RESPONSIVE_URL || "http://localhost:3000";
const output = path.resolve(process.env.MOBILE_EVIDENCE_DIR || "tmp/mobile-usability");
fs.mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: "msedge" });
const results = [];
const preventedWrites = [];

try {
  for (const width of [320, 390, 430]) {
    const context = await browser.newContext({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: "reduce" });
    // Exercise local UI state only. Never place orders, save settings, or change records.
    await context.route("**/api/**", route => {
      if (["GET", "HEAD", "OPTIONS"].includes(route.request().method())) return route.continue();
      preventedWrites.push(`${route.request().method()} ${new URL(route.request().url()).pathname}`);
      return route.abort();
    });
    const page = await context.newPage();
    const screenshot = async name => page.screenshot({ path: path.join(output, `${name}-${width}.png`), fullPage: false });
    const fits = async () => assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "Page must fit");
    const visit = async route => {
      await page.goto(base + route);
      await page.evaluate(() => document.fonts.ready);
      await fits();
    };
    const touchTarget = async locator => {
      const box = await locator.boundingBox();
      assert.ok(box && box.width >= 44 && box.height >= 44, `Touch target: ${JSON.stringify(box)}`);
    };

    await visit("/home");
    const metrics = await page.locator('[id^="metric-"]').evaluateAll(elements => elements.map(el => {
      const box = el.getBoundingClientRect(); return { top: box.top, bottom: box.bottom };
    }));
    assert.equal(metrics.length, 3);
    assert.ok(Math.max(...metrics.map(x => x.top)) - Math.min(...metrics.map(x => x.top)) < 2, "Home metrics share one row");
    const featured = await page.getByRole("heading", { name: "Featured Components" }).boundingBox();
    assert.ok(featured.y < 360, "Featured products must appear early on a phone");
    await screenshot("home");

    const assistant = page.getByRole("button", { name: "Open OhmSim assistant" });
    await touchTarget(assistant);
    await assistant.tap();
    const dialog = page.getByRole("dialog", { name: "OhmSim Assistant & Seller Chat" });
    await dialog.waitFor({ state: "visible" });
    await dialog.evaluate(el => Promise.all(el.getAnimations().map(animation => animation.finished.catch(() => {}))));
    const bounds = await dialog.boundingBox();
    assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width + 1 && bounds.y >= 56 && bounds.y + bounds.height <= 780);
    await screenshot("assistant");
    // Repeated activation must close, rather than close on pointer-down then reopen on click.
    await assistant.tap();
    await dialog.waitFor({ state: "hidden" });
    await page.setViewportSize({ width, height: 500 });
    await assistant.tap();
    await dialog.waitFor({ state: "visible" });
    await dialog.evaluate(el => Promise.all(el.getAnimations().map(animation => animation.finished.catch(() => {}))));
    const shortBounds = await dialog.boundingBox();
    assert.ok(shortBounds.y >= 56 && shortBounds.y + shortBounds.height <= 440, "Assistant fits when usable screen height shrinks");
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden" });
    await page.setViewportSize({ width, height: 844 });

    await visit("/products");
    const filters = page.getByRole("button", { name: "Toggle parametric filter drawer" });
    await touchTarget(filters);
    await filters.tap();
    await page.locator('[data-catalog-filter-panel]:visible').waitFor();
    await fits();
    await screenshot("catalog-filters");
    await filters.tap();
    await page.locator('button[aria-label^="Add "][aria-label$=" to cart"]:visible').first().waitFor();
    const add = page.locator('button[aria-label^="Add "][aria-label$=" to cart"]:visible').first();
    await touchTarget(add);
    await add.tap();
    await page.locator('nav a[href="/cart"]:visible').tap();
    const item = page.locator("[data-mobile-cart-item]").first();
    await item.waitFor();
    assert.ok(await item.locator('a[href^="/products/"]').evaluate(el => el.getBoundingClientRect().width > 120), "Product name gets a readable column");
    for (const label of ["Increase quantity of", "Decrease quantity of", "Remove "]) {
      await touchTarget(item.locator(`button[aria-label^="${label}"]`));
    }
    await fits();
    await screenshot("populated-cart");
    await page.getByRole("button", { name: /Proceed to Checkout/ }).tap();
    await page.getByRole("heading", { name: "Checkout & Fulfillment" }).waitFor();
    await fits();
    await screenshot("checkout");
    await page.getByRole("button", { name: /GCash QR/ }).tap();
    await page.getByRole("heading", { name: /OHMSIM/i }).first().scrollIntoViewIfNeeded();
    await fits();
    const badQrBounds = await page.locator('main button, main input').evaluateAll(elements => elements.filter(el => {
      const r = el.getBoundingClientRect(); return r.width > 0 && (r.left < 0 || r.right > innerWidth + 1);
    }).map(el => el.textContent?.slice(0, 50)));
    assert.deepEqual(badQrBounds, []);
    await screenshot("checkout-qr");

    await visit("/bom");
    await page.getByRole("button", { name: "Transfer All to Cart" }).tap();
    await page.getByRole("status").filter({ hasText: /Transferred .* components from/ }).waitFor();
    await page.locator('nav a[href="/cart"]:visible').tap();
    await page.waitForURL("**/cart");
    await page.getByRole("heading", { name: "Shopping Cart" }).waitFor();
    const bundle = page.locator("[data-mobile-bundle-item]").first();
    // Bundles may initially be collapsed; expand through the accessible control.
    if (!(await bundle.isVisible())) {
      await page.locator('button[aria-expanded="false"]').first().tap();
    }
    await bundle.waitFor();
    await bundle.scrollIntoViewIfNeeded();
    const bundleOverflow = await bundle.evaluate(el => [...el.children].some(child => {
      const box = child.getBoundingClientRect(), parent = el.getBoundingClientRect();
      return box.right > parent.right + 1 || box.left < parent.left - 1;
    }));
    assert.equal(bundleOverflow, false, "Bundle names, controls, and prices must stay inside the card");
    for (const prefix of ["Increase bundle quantity", "Decrease bundle quantity"]) {
      await touchTarget(bundle.locator(`button[aria-label^="${prefix}"]`));
    }
    await fits();
    await screenshot("bundle-cart");

    await visit("/orders/o1");
    const orderItems = page.locator("[data-order-items]");
    await orderItems.scrollIntoViewIfNeeded();
    assert.ok(await orderItems.evaluate(el => el.scrollWidth <= el.clientWidth + 1), "Phone order items must not need horizontal scrolling");
    const timeline = page.locator("[data-timeline-scroll]");
    assert.ok(await timeline.evaluate(el => el.scrollWidth <= el.clientWidth + 1), "All fulfillment stages fit");
    await screenshot("order-details");

    await visit("/profile");
    await page.locator("#profile-tab-addresses").tap();
    await screenshot("profile-addresses");
    await fits();
    await page.locator("#profile-tab-security").tap();
    await screenshot("profile-security");
    await fits();

    await visit("/admin");
    const kpis = page.getByTestId("admin-kpi-grid");
    const boxes = await kpis.locator("[data-kpi-value]").evaluateAll(elements => elements.map(el => {
      const r = el.getBoundingClientRect(); return { top: r.top, width: r.width, scroll: el.scrollWidth };
    }));
    assert.ok(Math.abs(boxes[0].top - boxes[1].top) < 2, "Phone dashboard uses two columns");
    assert.ok(boxes.every(box => box.scroll <= box.width + 1), "KPI values remain readable");
    await screenshot("admin-dashboard");

    results.push({ width, home: true, assistantToggle: true, shortViewport: true, filters: true, populatedCart: true, checkoutQr: true, bundle: true, orderCards: true, profileTabs: true, dashboard: true });
    console.log(`PASS ${width}px: home, assistant/short viewport, filters, populated cart/checkout/QR, BOM bundle, order details, profile, admin dashboard`);
    await context.close();
  }
  assert.deepEqual(preventedWrites, [], "No server mutations should be attempted");
  fs.writeFileSync(path.join(output, "report.json"), JSON.stringify({ results, serverWrites: 0 }, null, 2));
} finally {
  await browser.close();
}
