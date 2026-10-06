import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || path.join(
  process.env.LOCALAPPDATA || "", "Programs/Antigravity IDE/resources/app/node_modules/playwright"));
const url = process.env.BUYER_URL || "http://localhost:3105";
const browser = await chromium.launch({ headless: true, channel: process.platform === "win32" ? "msedge" : undefined });
const errors = [];
try {
  const page = await browser.newPage();
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  page.on("response", response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });

  async function inspectPanel() {
    const panels = page.locator("[data-catalog-filter-panel]:visible");
    assert.equal(await panels.count(), 1);
    const geometry = await panels.evaluate(panel => {
      const rect = panel.getBoundingClientRect();
      return {
        left: rect.left, right: rect.right, bottom: rect.bottom,
        scrollWidth: panel.scrollWidth, clientWidth: panel.clientWidth,
        overflowX: getComputedStyle(panel).overflowX,
        links: [...panel.querySelectorAll('a[href^="/bom?"]')].map(link => {
          const box = link.getBoundingClientRect();
          return { left: box.left, right: box.right, height: box.height };
        }),
        sliders: [...panel.querySelectorAll('[role="slider"]')].map(thumb => {
          const box = thumb.getBoundingClientRect();
          const pseudo = getComputedStyle(thumb, "::before");
          const width = parseFloat(pseudo.width);
          const height = parseFloat(pseudo.height);
          const centerX = box.left + box.width / 2;
          const centerY = box.top + box.height / 2;
          const hits = [-20, 20].map(offset => {
            const hit = document.elementFromPoint(centerX + offset, centerY);
            return hit === thumb || thumb.contains(hit);
          });
          return { width, height, left: centerX - width / 2, right: centerX + width / 2, hits };
        }),
      };
    });
    assert.ok(geometry.left >= 0 && geometry.right <= await page.evaluate(() => innerWidth));
    assert.equal(geometry.scrollWidth, geometry.clientWidth, "Filter panel must not have hidden horizontal overflow");
    assert.equal(geometry.overflowX, "visible", "Do not mask overflowing controls with clipping");
    assert.equal(geometry.sliders.length, 5);
    for (const slider of geometry.sliders) {
      assert.ok(slider.width >= 44 && slider.height >= 44);
      assert.ok(slider.left >= geometry.left && slider.right <= geometry.right,
        "Entire effective slider target fits inside the panel");
      assert.deepEqual(slider.hits, [true, true], "Both sides of the 44px hit area receive pointer input");
    }
    for (const link of geometry.links) {
      assert.ok(link.left >= geometry.left && link.right <= geometry.right && link.height >= 44);
    }
    return geometry;
  }

  for (const width of [320, 390, 768, 1024, 1440, 1536, 1920]) {
    await page.setViewportSize({ width, height: 1080 });
    await page.goto(`${url}/products`);
    await page.evaluate(() => document.fonts.ready);
    const root = await page.locator("[data-buyer-catalog]").boundingBox();
    assert.ok(root && Math.abs(root.x) < 1 && Math.abs(root.width - width) < 1,
      `Catalog fills the page without the old width cap at ${width}px`);
    if (width < 768) {
      await page.getByRole("button", { name: "Toggle parametric filter drawer" }).click();
      await page.getByRole("button", { name: "Parametric Filter", exact: true }).scrollIntoViewIfNeeded();
    }
    const panel = await inspectPanel();
    const results = await page.locator("[data-catalog-results]").boundingBox();
    assert.ok(results && results.x >= 0 && results.x + results.width <= width + 1);
    if (width < 768) assert.ok(results.y >= panel.bottom, "Opened mobile filters stack above results");
    else {
      assert.ok(results.x >= panel.right + 15, "Desktop results remain beside the sidebar");
      assert.ok(Math.abs(results.x + results.width - (width - (width >= 1024 ? 24 : 16))) < 1);
    }
    const cards = page.locator("[data-catalog-results] [data-cart-source]:visible");
    assert.equal(await cards.count(), 8);
    for (const card of await cards.all()) {
      const box = await card.boundingBox();
      assert.ok(box && box.x >= 0 && box.x + box.width <= width + 1);
    }
    console.log(`PASS: full-width catalog, unclipped slider targets, sidebar/results and all eight cards at ${width}px`);
    if (process.env.SCREENSHOT_DIR && [390, 1440, 1920].includes(width)) {
      fs.mkdirSync(process.env.SCREENSHOT_DIR, { recursive: true });
      await page.screenshot({ path: path.join(process.env.SCREENSHOT_DIR, `catalog-layout-${width}.png`), fullPage: true });
    }
  }

  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 420 });
    await page.goto(`${url}/products`);
    await page.evaluate(() => document.fonts.ready);
    if (width < 768) {
      await page.getByRole("button", { name: "Toggle parametric filter drawer" }).click();
    }
    const panel = page.locator("[data-catalog-filter-panel]:visible");
    assert.equal(await panel.count(), 1);
    for (const control of await panel.locator('[role="slider"], a[href^="/bom?"]').all()) {
      // Scroll to a usable viewport position, not underneath the fixed mobile nav.
      await control.evaluate(element => element.scrollIntoView({ block: "center", behavior: "instant" }));
      const hit = await control.evaluate(element => {
        const box = element.getBoundingClientRect();
        const centerX = box.left + box.width / 2;
        const centerY = box.top + box.height / 2;
        const target = document.elementFromPoint(centerX, centerY);
        return {
          visible: box.left >= 0 && box.right <= innerWidth && centerY >= 0 && centerY < innerHeight,
          receivesPointer: target === element || element.contains(target),
          label: element.getAttribute("aria-label") || element.textContent,
          center: { x: centerX, y: centerY },
          interceptedBy: target?.outerHTML.slice(0, 500),
        };
      });
      assert.ok(hit.visible && hit.receivesPointer,
        `Every slider and BOM link remains reachable after page scrolling at ${width}x420: ${JSON.stringify(hit)}`);
    }
    const scrollState = await panel.evaluate(element => ({
      overflowY: getComputedStyle(element).overflowY,
      overflowing: element.scrollWidth > element.clientWidth,
    }));
    assert.equal(scrollState.overflowY, "visible", "Short views use page scrolling, not a nested filter scroller");
    assert.equal(scrollState.overflowing, false);
    console.log(`PASS: open filters and all controls reachable by page scrolling at ${width}x420`);
    if (process.env.SCREENSHOT_DIR) {
      await page.screenshot({ path: path.join(process.env.SCREENSHOT_DIR, `catalog-filter-scrolled-${width}-short.png`), fullPage: false });
    }
    if (width < 768) {
      await page.getByRole("button", { name: "Toggle parametric filter drawer" }).click();
      assert.equal(await page.locator("[data-catalog-filter-panel]:visible").count(), 0);
      assert.equal(await page.locator("[data-catalog-results] [data-cart-source]:visible").count(), 8);
    }
  }

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${url}/products`);
  const slider = page.getByRole("slider", { name: "Minimum Voltage", exact: true });
  await slider.focus();
  await page.keyboard.press("ArrowRight");
  await page.waitForFunction(() => Number(document.querySelector('[aria-label="Minimum Voltage"]').getAttribute("aria-valuenow")) > 3.3);
  await page.getByRole("button", { name: "clear filters", exact: true }).click();
  await page.waitForFunction(() => document.querySelector('[aria-label="Minimum Voltage"]').getAttribute("aria-valuenow") === "3.3");
  const high = page.getByRole("slider", { name: "Maximum Voltage", exact: true });
  const box = await high.boundingBox();
  await page.mouse.move(box.x + box.width / 2 + 19, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x - 35, box.y + box.height / 2);
  await page.mouse.up();
  assert.ok(Number(await high.getAttribute("aria-valuenow")) < 12, "Expanded endpoint hit area supports real dragging");
  await page.getByRole("button", { name: "clear filters", exact: true }).click();
  await page.getByRole("button", { name: "Parametric Filter", exact: true }).click();
  assert.equal(await page.locator("#desktop-parametric-filter-controls").count(), 0);
  await page.getByRole("button", { name: "Parametric Filter", exact: true }).click();
  await inspectPanel();
  const stock = page.getByRole("slider", { name: "Minimum Stock Threshold", exact: true });
  await stock.focus();
  await page.keyboard.press("End");
  assert.equal(await stock.getAttribute("aria-valuenow"), "200");
  await inspectPanel();
  await page.keyboard.press("Home");
  assert.equal(await stock.getAttribute("aria-valuenow"), "0");
  await inspectPanel();
  console.log("PASS: keyboard filters, endpoint dragging, reset and collapse/reopen remain functional");
  assert.deepEqual(errors, []);
  console.log("PASS: zero browser/resource errors");
} finally {
  await browser.close();
}
