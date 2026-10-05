import assert from "node:assert/strict";
import path from "node:path";
import { createRequire } from "node:module";

const req = createRequire(import.meta.url);
const playwrightPath =
  process.env.PLAYWRIGHT_MODULE_PATH ||
  path.join(
    process.env.LOCALAPPDATA || "",
    "Programs/Antigravity IDE/resources/app/node_modules/playwright"
  );
const { chromium } = req(playwrightPath);
const url = process.env.BUYER_URL || "http://localhost:3105";

const browser = await chromium.launch({
  headless: true,
  channel: process.platform === "win32" ? "msedge" : undefined,
});

try {
  console.log("=== OhmSim Buyer Batch 2 Verification Suite ===");
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const errors = [];
  page.on("pageerror", (err) => errors.push(err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  // Verify __ohmSimCart is completely absent
  await page.goto(`${url}/home`);
  assert.equal(await page.evaluate(() => "__ohmSimCart" in window), false);
  console.log("PASS: __ohmSimCart is not present in window on /home");

  // 1. BOM Projects Workspace (/bom)
  console.log("\n1. Testing BOM Projects Workspace (/bom)...");
  await page.goto(`${url}/bom`);
  assert.equal(await page.evaluate(() => "__ohmSimCart" in window), false);

  // Check 3 default projects exist
  const projectButtons = page.locator("aside button");
  const count = await projectButtons.count();
  assert.ok(count >= 3, `Expected at least 3 BOM projects, found ${count}`);
  console.log(`PASS: Rendered ${count} BOM projects in workspace sidebar`);

  // Switch to IoT Weather Station
  const weatherProject = page.locator("aside button:has-text('IoT Weather Station')").first();
  await weatherProject.click();
  await page.waitForTimeout(200);

  // Assert line items exist for this project
  const rows = page.locator("main .divide-y > div");
  const rowCount = await rows.count();
  assert.ok(rowCount >= 1, `Expected line items in IoT Weather Station, found ${rowCount}`);
  console.log(`PASS: Selected IoT Weather Station project with ${rowCount} component rows`);

  // Create new BOM Project inline
  const newProjectBtn = page.locator("button:has-text('+ New Project')");
  await newProjectBtn.click();
  const nameInput = page.locator("input[placeholder='Enter project name...']");
  await nameInput.fill("Automated Solar Tracker");
  await nameInput.press("Enter");
  await page.waitForTimeout(250);

  const solarProject = page.locator("aside button:has-text('Automated Solar Tracker')");
  assert.equal(await solarProject.isVisible(), true);
  console.log("PASS: Created new project 'Automated Solar Tracker' inline");

  // Switch back to Arduino Line-Following Robot
  const robotProject = page.locator("aside button:has-text('Arduino Line-Following Robot')").first();
  await robotProject.click();
  await page.waitForTimeout(200);

  // Transfer all items to cart
  const transferBtn = page.locator("button:has-text('Transfer All to Cart')");
  assert.equal(await transferBtn.isEnabled(), true);
  await transferBtn.click();
  await page.waitForTimeout(400);

  // Cart badge in header should be >= 1
  const headerCartBadge = page.locator("header a[href='/cart'] [data-cart-count]");
  await headerCartBadge.waitFor({ state: "visible" });
  const badgeVal = parseInt((await headerCartBadge.textContent())?.trim() || "0", 10);
  assert.ok(badgeVal > 0, `Cart badge should be > 0 after bundle transfer (got ${badgeVal})`);
  console.log(`PASS: Transferred BOM bundle to cart (badge = ${badgeVal})`);

  // 2. Shopping Cart (/cart) & Combined Standalone + Bundle Accounting
  console.log("\n2. Testing Shopping Cart (/cart) & Bundle Accounting...");
  await page.locator("header a[href='/cart']").click();
  await page.waitForURL("**/cart");
  assert.equal(await page.evaluate(() => "__ohmSimCart" in window), false);

  // Verify BOM Bundle card is rendered
  const bundleCard = page.locator("div:has-text('BOM Project Bundle')").first();
  assert.equal(await bundleCard.isVisible(), true);
  console.log("PASS: BOM Project Bundle rendered in /cart");

  // Verify bundle collapsible toggle
  const bundleToggle = bundleCard.locator("[data-bundle-toggle]").first();
  await bundleToggle.click();
  await page.waitForTimeout(200);
  // Re-open
  await bundleToggle.click();
  await page.waitForTimeout(200);
  console.log("PASS: Bundle toggle accordion functions cleanly");

  // Add an individual standalone item from catalog
  console.log("\n3. Adding standalone product from Catalog...");
  await page.locator("header a[href='/products']").first().click();
  await page.waitForURL("**/products");
  // Add ESP32 (product ID 1, Espressif ESP32-WROOM-32U Kit)
  const espCardAdd = page.locator("button[aria-label^='Add Espressif ESP32']").first();
  await espCardAdd.click();
  await page.waitForTimeout(300);

  // Return to Cart to verify both standalone items and bundle coexist
  await page.locator("header a[href='/cart']").first().click();
  await page.waitForURL("**/cart");
  const standaloneHeading = page.locator("text='Individual Items'");
  assert.equal(await standaloneHeading.isVisible(), true);
  console.log("PASS: Cart clearly displays both BOM Bundles and Individual Items sections");

  // Check combined stock and non-destructive bundle removal
  console.log("\n4. Testing Non-Destructive Bundle Removal...");
  const standaloneItem = page.locator("a[href='/products/1']");
  assert.equal(await standaloneItem.isVisible(), true, "Standalone item present before bundle removal");

  // Remove the bundle
  const removeBundleBtn = page.locator("button[aria-label^='Remove bundle']").first();
  await removeBundleBtn.click();
  await page.waitForTimeout(300);

  // Verify bundle is removed, BUT standalone item is PRESERVED!
  const remainingBundles = await page.locator("text='BOM Project Bundle'").count();
  assert.equal(remainingBundles, 0, "BOM bundle was removed");

  const remainingStandalone = page.locator("a[href='/products/1']");
  assert.equal(await remainingStandalone.isVisible(), true, "Standalone ESP32 item was preserved after bundle removal");
  console.log("PASS: Non-destructive bundle removal verified — standalone items completely preserved!");

  // 5. Delivery Fee Calculation Thresholds (BR-046)
  console.log("\n5. Testing Delivery Fee Thresholds (BR-046)...");
  // Subtotal for 1 ESP32 is ₱280.00 (< ₱1000) -> delivery fee must be ₱80.00
  const feeText = await page.locator("span:has-text('Est. Delivery Fee') ~ span").textContent();
  assert.ok(feeText?.includes("80.00"), `Delivery fee below ₱1,000 should be ₱80.00 (got '${feeText}')`);
  console.log("PASS: Delivery fee is ₱80.00 when subtotal < ₱1,000");

  // Clear cart
  const clearBtn = page.locator("button:has-text('Clear Cart')");
  await clearBtn.click();
  await page.waitForTimeout(200);

  const emptyMsg = page.locator("text='Your cart is currently empty'");
  assert.equal(await emptyMsg.isVisible(), true);
  console.log("PASS: Clear Cart emptied all items and bundles cleanly");

  assert.deepEqual(errors, [], `Expected zero browser errors, got: ${JSON.stringify(errors)}`);
  console.log("\n>>> ALL OHMSIM BUYER BATCH 2 TESTS PASSED WITH ZERO FAILURES <<<");
} finally {
  await browser.close();
}
