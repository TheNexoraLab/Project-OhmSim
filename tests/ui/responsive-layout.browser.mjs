import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

// Read-only layout regression: uses the running app and never submits data.
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH ||
  path.join(process.env.LOCALAPPDATA || "", "Programs/Antigravity IDE/resources/app/node_modules/playwright"));
const baseUrl = process.env.RESPONSIVE_URL || "http://localhost:3000";
const outputDir = process.env.SCREENSHOT_DIR || path.join(os.tmpdir(), "ohmsim-responsive");
const routes = process.env.RESPONSIVE_ROUTES?.split(",") || [
  "/", "/login", "/privacy", "/terms", "/home", "/products", "/products/1",
  "/cart", "/checkout", "/bom", "/orders", "/orders/o1", "/profile", "/notifications", "/chat",
  "/admin", "/admin/products", "/admin/categories", "/admin/inventory", "/admin/orders",
  "/admin/customers", "/admin/reports", "/admin/notifications", "/admin/settings", "/admin/chat",
];
const viewports = [
  { width: 320, height: 640 }, { width: 390, height: 844 },
  { width: 768, height: 1024 }, { width: 844, height: 390 },
  { width: 1024, height: 768 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 },
];
fs.mkdirSync(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: process.platform === "win32" ? "msedge" : undefined });
const results = [];
try {
  const page = await browser.newPage();
  for (const route of routes) {
    await page.setViewportSize(viewports[1]);
    const response = await page.goto(baseUrl + route, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.locator("main").first().waitFor();
    await page.locator("main h1, main h2, main input, main a").first().waitFor({ state: "attached" });
    await page.evaluate(() => document.fonts.ready);
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const measurement = await page.evaluate(() => {
        const visible = element => {
          const rect = element.getBoundingClientRect();
          if (rect.width <= 0 || rect.height <= 0 || getComputedStyle(element).visibility === "hidden") return false;
          // A visually hidden table header remains available to screen readers.
          for (let parent = element; parent && parent !== document.body; parent = parent.parentElement) {
            if (getComputedStyle(parent).clipPath !== "none" && parent.getBoundingClientRect().width <= 1) return false;
          }
          return true;
        };
        const inScrollRegion = element => {
          for (let parent = element.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
            const css = getComputedStyle(parent);
            if (["auto", "scroll"].includes(css.overflowX) && parent.scrollWidth > parent.clientWidth + 1) return true;
          }
          return false;
        };
        const escaped = [...document.querySelectorAll("main *, body > header *, [data-testid='admin-topbar'] *")]
          .filter(element => visible(element) && !element.closest("[aria-hidden='true'], nextjs-portal") && !inScrollRegion(element))
          .filter(element => {
            const rect = element.getBoundingClientRect();
            return rect.left < -1 || rect.right > innerWidth + 1;
          })
          .slice(0, 8).map(element => ({ tag: element.tagName, text: element.textContent?.trim().slice(0, 65), class: typeof element.className === "string" ? element.className : "" }));
        const overlaps = [...document.querySelectorAll("header")].filter(visible).flatMap(header => {
          const children = [...header.children].filter(visible);
          return children.flatMap((left, index) => children.slice(index + 1).flatMap(right => {
            const a = left.getBoundingClientRect(), b = right.getBoundingClientRect();
            return Math.min(a.right, b.right) - Math.max(a.left, b.left) > 2 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 2
              ? [{ first: left.textContent?.slice(0, 30), second: right.textContent?.slice(0, 30) }] : [];
          }));
        });
        return { rootWidth: document.documentElement.scrollWidth, viewport: innerWidth, escaped, overlaps };
      });
      const ok = response.status() === 200 && measurement.rootWidth <= viewport.width + 1 && measurement.escaped.length === 0 && measurement.overlaps.length === 0;
      const result = { route, ...viewport, ok, ...measurement };
      results.push(result);
      if (!ok || (process.env.SAVE_SCREENSHOTS === "true" && [390, 768, 1440].includes(viewport.width))) {
        await page.screenshot({ path: path.join(outputDir, `${route.replaceAll("/", "_") || "landing"}-${viewport.width}.png`), fullPage: false });
      }
    }
    const failures = results.filter(result => result.route === route && !result.ok);
    console.log(`${failures.length ? "FAIL" : "PASS"} ${route}: ${7 - failures.length}/7 viewports${failures.length ? " " + failures.map(item => item.width).join(", ") : ""}`);
    fs.writeFileSync(path.join(outputDir, "report.json"), JSON.stringify(results, null, 2));
  }
  fs.writeFileSync(path.join(outputDir, "report.json"), JSON.stringify(results, null, 2));
  const failures = results.filter(result => !result.ok);
  console.log(`${results.length - failures.length}/${results.length} layout checks passed. Evidence: ${outputDir}`);
  if (process.env.REPORT_ONLY !== "true") assert.equal(failures.length, 0, "Responsive layout failures; see report.json");

  // These interactions stay local: open/close panels without saving, sending,
  // purchasing, printing, or modifying catalog and customer data.
  const withinViewport = async locator => {
    const bounds = await locator.evaluate(element => {
      const rect = element.getBoundingClientRect();
      return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: innerWidth, height: innerHeight };
    });
    assert.ok(bounds.left >= -1 && bounds.right <= bounds.width + 1 && bounds.top >= -1 && bounds.bottom <= bounds.height + 1, JSON.stringify(bounds));
  };
  for (const [route, trigger, panel] of [
    ["/admin/products", "[data-testid='open-add-product-modal-btn']", "[data-testid='product-form-modal']"],
    ["/admin/categories", "[data-testid='open-add-category-modal-btn']", "[data-testid='add-category-modal']"],
    ["/admin/inventory", "button[aria-label^='Adjust stock for']", "[role='dialog']"],
    ["/admin/orders", "button[data-testid^='manage-order-btn-']", "[data-testid='admin-order-drawer']"],
    ["/admin/customers", "td[data-cell='actions'] button", "[data-testid='admin-customer-drawer']"],
  ]) {
    if (!routes.includes(route)) continue;
    for (const viewport of [viewports[0], viewports[1], viewports[3]]) {
      await page.setViewportSize(viewport);
      await page.goto(baseUrl + route);
      await page.locator(trigger).first().click();
      const card = page.locator(panel);
      await card.waitFor({ state: "visible" });
      await withinViewport(card);
      const escapedFields = await card.locator("input,select,textarea").evaluateAll(fields => fields.filter(field => {
        const rect = field.getBoundingClientRect();
        return rect.width > 0 && (rect.left < -1 || rect.right > innerWidth + 1);
      }).map(field => field.id));
      assert.deepEqual(escapedFields, [], "Dialog fields must fit the viewport");
      const cancel = card.getByRole("button", { name: "Cancel", exact: true });
      const close = cancel.count().then(count => count ? cancel : page.getByRole("button", { name: /Close order management drawer|Close customer drawer/ }));
      const dismissal = await close;
      await dismissal.scrollIntoViewIfNeeded();
      await withinViewport(dismissal);
      await page.screenshot({ path: path.join(outputDir, `${route.replaceAll("/", "_")}-${viewport.width}-dialog.png`) });
      await dismissal.click();
      await card.waitFor({ state: "hidden" });
    }
    console.log(`PASS ${route}: phone and short-landscape dialog bounds and reachable dismissal`);
  }

  if (routes.includes("/admin")) {
    await page.setViewportSize(viewports[1]);
    await page.goto(baseUrl + "/admin");
    const menu = page.getByTestId("admin-mobile-menu-button");
    await menu.click();
    const drawer = page.getByTestId("admin-mobile-sidebar");
    await drawer.waitFor({ state: "visible" });
    await withinViewport(drawer);
    await page.waitForFunction(() => document.querySelector("#admin-mobile-navigation")?.contains(document.activeElement));
    assert.equal(await page.evaluate(() => document.body.style.overflow), "hidden");
    await page.keyboard.press("Escape");
    await drawer.waitFor({ state: "hidden" });
    assert.equal(await menu.evaluate(element => element === document.activeElement), true);
    assert.notEqual(await page.evaluate(() => document.body.style.overflow), "hidden");
    await menu.click();
    await drawer.waitFor({ state: "visible" });
    await page.setViewportSize(viewports[5]);
    await drawer.waitFor({ state: "detached" });
    assert.notEqual(await page.evaluate(() => document.body.style.overflow), "hidden");
    console.log("PASS mobile navigation: focus, Escape, restored scrolling, and closing on desktop resize");
  }

  if (routes.includes("/admin/chat")) {
    await page.setViewportSize(viewports[1]);
    await page.goto(baseUrl + "/admin/chat");
    await page.locator(".admin-chat-threads button").first().click();
    const composer = page.getByRole("textbox", { name: "Message reply input" });
    await withinViewport(composer);
    await page.screenshot({ path: path.join(outputDir, "admin-chat-mobile-conversation.png") });
    await page.getByRole("button", { name: "Back to conversations" }).click();
    assert.equal(await composer.isVisible(), false);
    assert.equal(await page.locator(".admin-chat-threads").isVisible(), true);
    console.log("PASS mobile support chat: conversation selection, bounded composer, and returning to thread list");
  }

  for (const route of ["/admin", "/admin/products", "/admin/categories", "/admin/orders", "/admin/customers", "/admin/reports"]) {
    if (!routes.includes(route)) continue;
    await page.setViewportSize(viewports[1]);
    await page.goto(baseUrl + route);
    const row = page.locator("table[data-responsive-table] tbody tr").first();
    await row.waitFor({ state: "visible" });
    const rowWidths = await row.evaluate(element => ({ width: element.getBoundingClientRect().width, viewport: innerWidth }));
    assert.ok(rowWidths.width <= rowWidths.viewport);
    await row.scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(outputDir, `${route.replaceAll("/", "_")}-mobile-record.png`) });
  }
} finally {
  await browser.close();
}
