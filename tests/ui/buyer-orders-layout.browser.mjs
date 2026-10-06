import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";
import { createRequire } from "node:module";
import { createLoader } from "./helpers/load-typescript.mjs";

const req = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, "../..");
const orders = createLoader(root)("services/order-service.ts");
const { chromium } = req(process.env.PLAYWRIGHT_MODULE_PATH || path.join(process.env.LOCALAPPDATA, "Programs/Antigravity IDE/resources/app/node_modules/playwright"));
const browser = await chromium.launch({ headless: true, channel: "msedge" });
const page = await browser.newPage();
const errors = [];
page.on("pageerror", error => errors.push(error.message));
page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
const base = process.env.BUYER_URL || "http://localhost:3106";
const output = process.env.SCREENSHOT_DIR;
if (output) fs.mkdirSync(output, { recursive: true });
const money = number => "₱" + number.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
async function capture(name) {
  if (output) await page.screenshot({ path: path.join(output, name + ".png") });
}
async function visibleBounds(selector, width) {
  const box = await page.locator(selector).boundingBox();
  assert.ok(box && box.x >= -0.5 && box.x + box.width <= width + 0.5, selector + ": " + JSON.stringify(box));
  return box;
}

try {
  for (const width of [768, 1024, 1188, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(base + "/orders");
    await page.locator("[data-orders-preview]").waitFor();
    const main = await page.locator("main").boundingBox();
    const workspace = await visibleBounds("[data-orders-workspace]", width);
    const rail = await visibleBounds("[data-orders-rail]", width);
    const preview = await visibleBounds("[data-orders-preview]", width);
    assert.equal(workspace.x, 0, "No centered/max-width page wrapper");
    assert.equal(workspace.width, width, "Workspace uses entire application width");
    assert.equal(rail.width, 288, "Export's w-72 rail");
    assert.equal(rail.x, 0);
    assert.equal(rail.y, main.y, "Rail starts immediately below Buyer header");
    assert.equal(preview.x, 288);
    const rows = await page.locator("[data-order-id] > button").first().boundingBox();
    assert.ok(rows.height >= 44 && rows.height <= 80, "Compact rows, not oversized standalone cards");
    assert.equal(await page.getByRole("heading", { name: "My Orders", exact: true }).count(), 0);
    assert.equal(await page.getByRole("link", { name: "Browse Catalog", exact: true }).count(), 0);
    const header = await visibleBounds("[data-orders-detail-header]", width);
    assert.ok(header.height <= 100, "Compact reference detail header");
    const progress = await visibleBounds("[data-orders-progress]", width);
    const items = await visibleBounds("[data-orders-items-panel]", width);
    const info = await visibleBounds("[data-orders-info-rail]", width);
    assert.ok(progress.y < items.y);
    if (width >= 1024) {
      assert.equal(info.width, 224, "Export's w-56 information rail");
      assert.ok(Math.abs(items.y - info.y) < 1, "Table and shipping/summary start side by side");
      assert.ok(info.x >= items.x + items.width);
      assert.ok(progress.width > items.width, "Timeline spans both detail columns");
    } else assert.ok(info.y >= items.y + items.height);
    assert.equal(await page.locator("[data-orders-preview-items] tbody tr").count(), 2);
    const cells = await page.locator("[data-orders-preview-items] tbody tr").first().locator("td").allTextContents();
    assert.equal(cells[1].trim(), money(295));
    assert.equal(cells[2].trim(), "×1");
    assert.equal(cells[3].trim(), money(295));
    assert.equal(await page.locator("[data-order-total]").innerText(), money(615));
    for (const order of orders.getMockOrders()) {
      await page.locator('[data-order-id="' + order.id + '"] > button').click();
      await page.waitForFunction(id => document.querySelector('[data-order-id="' + id + '"]').dataset.selected === "true", order.id);
      assert.equal(await page.locator("[data-order-total]").innerText(), money(order.totalAmount));
      assert.equal(await page.locator("[data-order-fee]").innerText(), money(order.deliveryFee));
      assert.equal(await page.getByRole("link", { name: "Full Details Page" }).getAttribute("href"), "/orders/" + order.id);
    }
    await page.locator('[data-order-id="o1"] > button').click();
    for (const selector of ["[data-orders-items-scroll]", "[data-orders-progress-scroll]"]) {
      const region = page.locator(selector);
      await visibleBounds(selector, width);
      await region.focus();
      assert.equal(await region.evaluate(element => element === document.activeElement), true);
      const scroll = await region.evaluate(element => element.scrollWidth > element.clientWidth);
      if (scroll) {
        await page.keyboard.press("ArrowRight");
        await page.waitForFunction(selector => document.querySelector(selector).scrollLeft > 0, selector);
      }
      await region.evaluate(element => element.scrollTo({ left: 0, behavior: "instant" }));
    }
    await capture("orders-reference-layout-" + width);
    console.log("PASS reference rail/detail/table/summary composition, fixture totals and scroll reachability at", width);
  }
  if (output) {
    // Same CSS reference width at 125% raster scale as the supplied desktop capture.
    const referenceContext = await browser.newContext({ viewport: { width: 1188, height: 693 }, deviceScaleFactor: 1.25 });
    const referencePage = await referenceContext.newPage();
    await referencePage.goto(base + "/orders");
    await referencePage.locator("[data-orders-progress]").waitFor();
    await referencePage.evaluate(() => document.fonts.ready);
    await referencePage.screenshot({ path: path.join(output, "orders-reference-comparison-125.png") });
    await referenceContext.close();
  }
  for (const [width, height] of [[320, 480], [390, 844]]) {
    await page.setViewportSize({ width, height });
    await page.goto(base + "/orders");
    await page.locator("#orders-search").waitFor();
    await visibleBounds("[data-orders-rail]", width);
    const undersized = await page.locator("main button, main a, main input").evaluateAll(elements => elements.filter(element => {
      const box = element.getBoundingClientRect();
      return box.width && box.height && (box.width < 44 || box.height < 44);
    }).map(element => element.textContent || element.id));
    assert.deepEqual(undersized, []);
    const search = page.locator("#orders-search");
    await search.fill("NE555");
    await page.waitForFunction(() => document.querySelectorAll("[data-order-id]").length === 1);
    assert.equal(await page.locator("[data-order-id]").getAttribute("data-order-id"), "o2");
    await page.getByRole("button", { name: "Clear search", exact: true }).click();
    await page.locator('[data-order-id="o2"]').getByRole("link", { name: "Details" }).click();
    await page.waitForURL("**/orders/o2");
    await page.getByRole("link", { name: "Back to Orders" }).click();
    await page.waitForURL("**/orders");
    await capture("orders-reference-layout-mobile-" + width);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    console.log("PASS mobile search, clear, actual Details navigation and 44px targets at", width, height);
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
