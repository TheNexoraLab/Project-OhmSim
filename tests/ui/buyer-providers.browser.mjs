import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";
import { createRequire } from "node:module";
import { browserBundle } from "./helpers/browser-cjs.mjs";

const root = path.resolve(import.meta.dirname, "../..");
const req = createRequire(import.meta.url);
const playwrightPath = process.env.PLAYWRIGHT_MODULE_PATH || path.join(
  process.env.LOCALAPPDATA || "", "Programs/Antigravity IDE/resources/app/node_modules/playwright");
const { chromium } = req(playwrightPath);
const url = process.env.BUYER_URL || "http://localhost:3105";
const browser = await chromium.launch({ headless: true,
  channel: process.platform === "win32" ? "msedge" : undefined });
try {
  const page = await browser.newPage({ viewport: {width: 320, height: 640} });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto(`${url}/products`);
  await page.locator("#mobile-catalog-search").waitFor();
  assert.equal(await page.evaluate(() => "__ohmSimCart" in window), false);
  // Use the real production stylesheet for the component fixture, not invented
  // dimensions. The standalone React harness is never served by a Next route.
  const links = await page.locator('link[rel="stylesheet"]').evaluateAll(elements =>
    elements.map(element => element.href));
  const styles = await Promise.all(links.map(async href => {
    const response = await page.request.get(href);
    assert.equal(response.ok(), true);
    return response.text();
  }));
  assert.ok(styles.length > 0);
  await page.setContent(`<style>${styles.join("\n")}</style><div id="test-root"></div>`);
  await page.addScriptTag({content: browserBundle(
    path.join(root, "tests/ui/fixtures/buyer-providers.tsx"), root, {stockZeroFixture: true})});
  const state = async () => JSON.parse(await page.locator("#cart-state").textContent());
  async function action(id, expectedCart, expectedResults) {
    await page.locator(`#${id}`).click();
    await page.waitForFunction(({cart, results}) => {
      const state = JSON.parse(document.getElementById("cart-state").textContent);
      return JSON.stringify(state.cart) === JSON.stringify(cart)
        && JSON.stringify(state.results) === JSON.stringify(results);
    }, {cart: expectedCart, results: expectedResults});
    const rendered = await state();
    assert.equal(rendered.total, Object.values(expectedCart).reduce((sum, qty) => sum + qty, 0));
    console.log(`PASS: actual React provider commit — ${id}`);
  }
  await action("queued", {6: 2}, [true, true]);
  assert.equal((await state()).remaining, 6);
  await action("mixed", {6: 8}, [true, true]);
  assert.equal((await state()).remaining, 0);
  assert.equal((await state()).canAdd, false);
  await action("limit", {6: 8}, [false]);
  await action("capped", {6: 8}, [true]);
  await action("invalid", {6: 8}, Array(11).fill(false));
  await action("forged", {}, Array(4).fill(false));
  assert.equal((await state()).forgedRemaining, 0);
  await action("zero", {}, Array(3).fill(false));
  assert.equal((await state()).zeroRemaining, 0);
  await action("remove-zero", {}, [true]);
  assert.equal(await page.evaluate(() => "__ohmSimCart" in window), false);

  const popover = page.getByRole("dialog", {name: "Add to BOM Project"});
  await page.locator("#edge-trigger").click();
  for (const width of [320, 321, 390, 320, 768, 1024, 320]) {
    await page.setViewportSize({width, height: 640});
    await page.waitForFunction(() => {
      const element = document.querySelector('[role="dialog"]');
      const rect = element.getBoundingClientRect();
      return rect.left >= 7.5 && rect.right <= innerWidth - 7.5;
    });
    assert.equal(await popover.isVisible(), true);
  }
  // Anchor reflow without changing viewport width must also recalculate.
  await page.locator("#edge-anchor").evaluate(element => {
    element.style.left = "-24px"; element.style.width = "70px";
  });
  await page.waitForFunction(() => document.querySelector('[role="dialog"]').getBoundingClientRect().left >= 7.5);
  console.log("PASS: repeated open-popover resize and anchor reflow at both edges");
  const beforeBom = JSON.parse(await page.locator("#bom-state").textContent());
  await popover.getByRole("button", {name: /Smart Plant/}).click();
  await page.waitForFunction(() => JSON.parse(document.getElementById("bom-state").textContent)
    .find(project => project.id === "b3").lineItems.find(item => item.productId === "1").qty === 2);
  const afterBom = JSON.parse(await page.locator("#bom-state").textContent());
  assert.deepEqual(afterBom.slice(0, 2), beforeBom.slice(0, 2));
  assert.deepEqual(afterBom[2].lineItems, beforeBom[2].lineItems.map(item =>
    item.productId === "1" ? {...item, qty: 2} : item));
  console.log("PASS: exact product/project BOM mutation; other projects unchanged");
  await page.locator("#unmount").click();
  assert.equal(await page.locator("#cart-state").count(), 0);
  assert.equal(await page.evaluate(() => "__ohmSimCart" in window), false);
  await page.locator("#unmount").click();
  await page.locator("#cart-state").waitFor();
  assert.deepEqual((await state()).cart, {});
  assert.equal(await page.evaluate(() => "__ohmSimCart" in window), false);
  assert.deepEqual(errors, []);
  const fixtureFile = path.join(root, "lib/mocks/products.ts");
  assert.equal(fs.readFileSync(fixtureFile, "utf8").includes("stock-zero-test"), false);
  console.log("PASS: clean provider unmount/remount; no global bridge or persisted test fixture");
} finally {
  await browser.close();
}
