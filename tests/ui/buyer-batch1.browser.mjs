/**
 * OhmSim Buyer Application — Batch 1 Browser & Interaction Test Suite
 *
 * Rigorous test suite validating:
 * R1: Production UI stock limits/persistence; companion buyer-providers.browser.mjs
 *     exercises the actual React providers with isolated service fixtures.
 * R2: Usable mobile keyword search, SKU search, no-results state, and search clear
 * R3: URL query synchronization (q=, direct URL, back/forward, clear, reload)
 * R4: Stacked mobile filter panel layout without horizontal competition and short-height viewports
 * R5: BOM popover collision-aware bounds at 320/390px, hit-testing all options, outside click, Escape, focus return, selection item count tracking
 * R6: Accessibility, skip-link focus enforcement, >=44px touch targets, non-truncated labels, WAI-ARIA tabs with roving tabIndex and arrow keys, permanent live toast region
 * R7: Data through service boundary (mock service layer)
 * R8: Meaningful expected-value assertions (exact counts, IDs, prices, ordering) and full-page screenshots
 */

import { createRequire } from "node:module";
import path from "node:path";
import fs from "node:fs";

const BUYER_URL = process.env.BUYER_URL || "http://localhost:3105";
const SCREENSHOT_DIR = path.resolve(process.env.SCREENSHOT_DIR || "docs/design/buyer/screenshots");

const VIEWPORTS = [
  { width: 320, height: 640, name: "mobile-small" },
  { width: 390, height: 844, name: "mobile-standard" },
  { width: 768, height: 1024, name: "tablet" },
  { width: 1024, height: 768, name: "desktop-small" },
  { width: 1440, height: 900, name: "desktop-standard" },
  { width: 1920, height: 1080, name: "desktop-wide" },
];

function loadPlaywright() {
  const req = createRequire(import.meta.url);

  if (process.env.PLAYWRIGHT_MODULE_PATH) {
    try {
      const mod = req(process.env.PLAYWRIGHT_MODULE_PATH);
      return mod.chromium || mod.default?.chromium;
    } catch {}
  }

  try {
    const mod = req("playwright");
    return mod.chromium || mod.default?.chromium;
  } catch {}

  const candidateBase = path.join(
    process.env.LOCALAPPDATA || "",
    "Programs",
    "Antigravity IDE",
    "resources",
    "app"
  );
  if (fs.existsSync(candidateBase)) {
    try {
      const customReq = createRequire(path.join(candidateBase, "package.json"));
      const mod = customReq("playwright");
      return mod.chromium || mod.default?.chromium;
    } catch {}
  }

  throw new Error("Playwright not found");
}

async function run() {
  console.log("=== OhmSim Buyer Batch 1 Verification & Regression Suite ===");
  console.log(`Base URL: ${BUYER_URL}`);

  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const failures = [];
  function assert(condition, message) {
    if (!condition) {
      console.error(`  FAIL: ${message}`);
      failures.push(message);
    } else {
      console.log(`  PASS: ${message}`);
    }
  }

  const chromium = loadPlaywright();
  async function assertPopoverOptions(popover, width) {
    const options = await popover.getByRole("button").all();
    assert(options.length === 3, "Exactly three project choices are present");
    for (const [index, option] of options.entries()) {
      await option.scrollIntoViewIfNeeded();
      const hit = await option.evaluate(element => {
        const rect = element.getBoundingClientRect();
        const target = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
        return {left: rect.left, right: rect.right, height: rect.height,
          hittable: Boolean(target && element.contains(target))};
      });
      assert(hit.left >= 0 && hit.right <= width && hit.height >= 44 && hit.hittable,
        `Project ${index + 1} is unclipped and receives pointer input at ${width}px`);
    }
  }
  async function projectCounts(popover) {
    return Promise.all((await popover.getByRole("button").all()).map(async button => {
      const text = (await button.textContent()).replace(/\s+/g, " ").trim();
      const match = text.match(/(\d+) items$/);
      if (!match) throw new Error(`Missing project quantity: ${text}`);
      return Number(match[1]);
    }));
  }
  async function isFocused(locator) {
    return locator.evaluate(element => element === document.activeElement);
  }
  const browser = await chromium.launch({
    headless: true,
    channel: process.platform === "win32" ? "msedge" : undefined,
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleErrors = [];
  const pageErrors = [];
  const httpErrors = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });
  page.on("pageerror", (err) => {
    pageErrors.push(err.message);
  });
  page.on("response", (res) => {
    if (res.status() >= 400) {
      httpErrors.push(`${res.status()} ${res.url()}`);
      console.log(`Resource ${res.status()}:`, res.url());
    }
  });

  try {
    // =============================================================
    // 0. Permanent Live Region & Shell Baseline Verification
    // =============================================================
    console.log("\n0. Verifying Permanent Live Region & Shell Baseline...");
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BUYER_URL}/home`, { waitUntil: "domcontentloaded" });

    // Assert live status region is permanently present in DOM before any toast is fired
    const initialLiveRegion = page.locator("div[role='status'][aria-live='polite']");
    assert(await initialLiveRegion.count() > 0, "Stable live region (role='status', aria-live='polite') is permanently present in DOM before toasts");

    // =============================================================
    // 1. Home Page Verification
    // =============================================================
    console.log("\n1. Testing Buyer Home Page (/home)...");
    const homeRes = await page.goto(`${BUYER_URL}/home`, { waitUntil: "domcontentloaded" });
    assert(homeRes.status() === 200, `/home returned HTTP 200 (got ${homeRes.status()})`);

    const welcomeHeading = await page.textContent("h1");
    assert(welcomeHeading && welcomeHeading.includes("Welcome back!"), "Welcome heading verified");

    // Check aria-current on active nav link
    const homeNavLink = page.locator("nav[aria-label='Buyer Primary Navigation'] a[href='/home']");
    assert((await homeNavLink.getAttribute("aria-current")) === "page", "Home nav link has aria-current='page' when on /home");

    // Exact summary metrics check
    const productsAvailable = await page.locator("text='Products Available'").locator("..").locator("p").first().textContent();
    assert(productsAvailable?.trim() === "8", `Products Available metric is exactly 8 (got ${productsAvailable?.trim()})`);

    const bomProjectsMetric = await page.locator("text='BOM Projects'").locator("..").locator("p").first().textContent();
    assert(bomProjectsMetric?.trim() === "3", `BOM Projects metric is exactly 3 (got ${bomProjectsMetric?.trim()})`);

    // Verify exactly 4 featured products in grid with exact IDs
    const featuredCardLinks = await page.locator("div.grid a[href^='/products/']").all();
    const featuredHrefs = await Promise.all(featuredCardLinks.map((l) => l.getAttribute("href")));
    const uniqueFeaturedIds = [...new Set(featuredHrefs.map((h) => h?.replace("/products/", "")).filter(Boolean))];
    assert(
      uniqueFeaturedIds.length === 4 &&
      uniqueFeaturedIds.includes("1") &&
      uniqueFeaturedIds.includes("2") &&
      uniqueFeaturedIds.includes("3") &&
      uniqueFeaturedIds.includes("4"),
      `Rendered exactly 4 featured products with IDs [1, 2, 3, 4] (got [${uniqueFeaturedIds.join(", ")}])`
    );

    // Home composition: full-width desktop content and compact surfaces, not
    // a constrained catalog layout. Measure real children, not just overflow.
    for (const width of [768, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      const composition = await page.locator("[data-buyer-home]").evaluate(home => {
        const heading = home.querySelector("h1");
        const cards = [...home.querySelectorAll("[data-home-featured] > div")];
        const actions = cards.flatMap(card => [...card.querySelectorAll("a, button")]
          .filter(action => ["View Details", "Add to Cart", "+ BOM"].includes(action.textContent.trim())));
        return {
          left: heading.getBoundingClientRect().left,
          background: getComputedStyle(home).backgroundImage,
          headingSize: getComputedStyle(heading).fontSize,
          metricSize: getComputedStyle(home.querySelector("#metric-products-available p")).fontSize,
          cards: cards.map(card => {
            const rect = card.getBoundingClientRect();
            return {left: rect.left, right: rect.right, width: rect.width};
          }),
          actions: actions.map(action => ({
            height: action.getBoundingClientRect().height,
            width: action.getBoundingClientRect().width,
            fontSize: getComputedStyle(action).fontSize,
            surfaceTop: getComputedStyle(action, "::before").top,
            surfaceBottom: getComputedStyle(action, "::before").bottom,
            textFits: action.scrollWidth <= action.clientWidth,
          })),
          extraStockCount: cards.some(card => /\d+ in stock/.test(card.textContent)),
        };
      });
      assert(composition.left === 24 && composition.cards.every(card => card.left >= 24 && card.right <= width - 24),
        `Home uses 24px desktop padding with unclipped cards at ${width}px`);
      assert(Math.abs(Math.max(...composition.cards.map(card => card.right)) - (width - 24)) <= 1,
        `Home featured grid fills available width without the old 1280px cap at ${width}px`);
      assert(composition.headingSize === "20px" && composition.metricSize === "24px" && composition.background.includes("linear-gradient"),
        `Home preserves the reference heading/metric hierarchy and canonical page gradient at ${width}px`);
      assert(composition.actions.length === 12 && composition.actions.every(action =>
        action.height >= 44 && action.width >= 44 && action.fontSize === "9px" &&
        action.surfaceTop === "8px" && action.surfaceBottom === "8px" && action.textFits),
        `All Home action labels fit, with compact surfaces and >=44px real targets at ${width}px`);
      assert(!composition.extraStockCount, `Home uses image stock badges without extra numeric stock text at ${width}px`);
      const headerControls = await page.locator("header").first().evaluate(header =>
        [...header.querySelectorAll("a, form")].filter(control => control.getClientRects().length > 0)
          .map(control => {
            const rect = control.getBoundingClientRect();
            return {left: rect.left, right: rect.right};
          }));
      assert(headerControls.length > 0 && headerControls.every(control => control.left >= 0 && control.right <= width),
        `Desktop header's visible links and search are within the ${width}px viewport`);
    }
    assert(await page.locator("header").getByText("by NEXORA Labs", { exact: true }).isVisible(),
      "Desktop header includes the reference brand caption");
    await page.setViewportSize({ width: 1440, height: 900 });

    // =============================================================
    // 2. Catalog & Parametric Search: Exact Filtering, Sorting & URL Sync
    // =============================================================
    console.log("\n2. Testing Catalog Page (/products)...");
    await page.goto(`${BUYER_URL}/products`, { waitUntil: "domcontentloaded" });
    await page.locator(".hidden.md\\:grid a[href^='/products/']").first().waitFor();

    // Check aria-current on Catalog nav link
    const catalogNavLink = page.locator("nav[aria-label='Buyer Primary Navigation'] a[href='/products']");
    assert((await catalogNavLink.getAttribute("aria-current")) === "page", "Catalog nav link has aria-current='page' when on /products");

    // Initial catalog: exactly 8 products
    const initialCards = await page.locator(".hidden.md\\:grid a[href^='/products/']").all();
    const initialHrefs = [...new Set(await Promise.all(initialCards.map((l) => l.getAttribute("href"))))];
    assert(initialHrefs.length === 8, `Initial catalog renders exactly 8 products (got ${initialHrefs.length})`);

    // Test Category filter and aria-pressed semantics
    const allPill = page.locator("button:has-text('All')").first();
    assert((await allPill.getAttribute("aria-pressed")) === "true", "'All' category pill has aria-pressed='true' initially");

    const sensorsPill = page.locator("button:has-text('Sensors')").first();
    assert((await sensorsPill.getAttribute("aria-pressed")) === "false", "'Sensors' category pill has aria-pressed='false' initially");

    await sensorsPill.click();
    await page.waitForTimeout(200);

    assert((await sensorsPill.getAttribute("aria-pressed")) === "true", "'Sensors' category pill has aria-pressed='true' after selection");
    assert((await allPill.getAttribute("aria-pressed")) === "false", "'All' category pill has aria-pressed='false' after selecting Sensors");

    const sensorCards = await page.locator(".hidden.md\\:grid a[href^='/products/']").all();
    const sensorHrefs = [...new Set(await Promise.all(sensorCards.map((l) => l.getAttribute("href"))))];
    const sensorIds = sensorHrefs.map((h) => h?.replace("/products/", "")).filter(Boolean);
    assert(
      sensorIds.length === 2 && sensorIds.includes("5") && sensorIds.includes("6"),
      `Filtered by 'Sensors' displays exactly 2 sensor products [5, 6] (got [${sensorIds.join(", ")}])`
    );

    // Test Sorting: Price Low to High
    const sortSelect = page.locator("#catalog-sort-select");
    await sortSelect.selectOption("price-asc");
    await page.waitForTimeout(200);

    const sensorPricesAsc = await page.locator(".hidden.md\\:grid p.font-mono.text-mocha-accent").allTextContents();
    assert(
      sensorPricesAsc.length === 2 && sensorPricesAsc[0].includes("120.00") && sensorPricesAsc[1].includes("165.00"),
      `Price Low to High sort correctly orders sensors: [${sensorPricesAsc.join(", ")}]`
    );

    // Test Sorting: Price High to Low
    await sortSelect.selectOption("price-desc");
    await page.waitForTimeout(200);
    const sensorPricesDesc = await page.locator(".hidden.md\\:grid p.font-mono.text-mocha-accent").allTextContents();
    assert(
      sensorPricesDesc.length === 2 && sensorPricesDesc[0].includes("165.00") && sensorPricesDesc[1].includes("120.00"),
      `Price High to Low sort correctly orders sensors: [${sensorPricesDesc.join(", ")}]`
    );

    // Restore category to "All"
    await page.locator("button:has-text('All')").first().click();
    await page.waitForTimeout(150);
    assert(!(await page.evaluate(() => "__ohmSimCart" in window)), "Production Buyer app exposes no cart testing bridge");

    // =============================================================
    // 3. Desktop Header Search & URL Synchronization (V2-3)
    // =============================================================
    console.log("\n3. Testing Desktop Header Search & URL Synchronization (V2-3)...");

    // 3a. Direct URL navigation with query param ?q=ESP32
    await page.goto(`${BUYER_URL}/products?q=ESP32`, { waitUntil: "domcontentloaded" });
    const directSearchInput = page.locator("#buyer-desktop-search");
    const directInputValue = await directSearchInput.inputValue();
    assert(directInputValue === "ESP32", `Direct visit to /products?q=ESP32 synchronizes header input text to 'ESP32' (got '${directInputValue}')`);

    const directCards = await page.locator(".hidden.md\\:grid a[href^='/products/']").all();
    const directIds = [...new Set(await Promise.all(directCards.map((l) => l.getAttribute("href"))))].map((h) => h?.replace("/products/", ""));
    assert(directIds.length === 1 && directIds[0] === "1", `Direct URL rendered exactly product ID '1' (got [${directIds.join(", ")}])`);

    // 3b. Submit search for "Arduino"
    await directSearchInput.fill("Arduino");
    await directSearchInput.press("Enter");
    await page.waitForTimeout(250);

    assert(page.url().includes("q=Arduino"), `Header search updated URL to 'q=Arduino' (URL: ${page.url()})`);
    assert((await directSearchInput.inputValue()) === "Arduino", "Header input displays 'Arduino'");
    const arduinoCards = await page.locator(".hidden.md\\:grid a[href^='/products/']").all();
    const arduinoIds = [...new Set(await Promise.all(arduinoCards.map((l) => l.getAttribute("href"))))].map((h) => h?.replace("/products/", ""));
    assert(arduinoIds.length === 1 && arduinoIds[0] === "2", `Search for 'Arduino' renders exactly ID '2' (got [${arduinoIds.join(", ")}])`);

    // 3c. Browser Back button synchronization
    await page.goBack();
    await page.waitForTimeout(250);
    assert(page.url().includes("q=ESP32"), `Browser Back restored URL to 'q=ESP32' (URL: ${page.url()})`);
    assert((await directSearchInput.inputValue()) === "ESP32", `Browser Back restored header input text to 'ESP32' (got '${await directSearchInput.inputValue()}')`);
    const backCards = await page.locator(".hidden.md\\:grid a[href^='/products/']").all();
    const backIds = [...new Set(await Promise.all(backCards.map((l) => l.getAttribute("href"))))].map((h) => h?.replace("/products/", ""));
    assert(backIds.length === 1 && backIds[0] === "1", `Browser Back rendered product ID '1' (got [${backIds.join(", ")}])`);

    // 3d. Browser Forward button synchronization
    await page.goForward();
    await page.waitForTimeout(250);
    assert(page.url().includes("q=Arduino"), `Browser Forward restored URL to 'q=Arduino' (URL: ${page.url()})`);
    assert((await directSearchInput.inputValue()) === "Arduino", `Browser Forward restored header input to 'Arduino' (got '${await directSearchInput.inputValue()}')`);

    // 3e. Header clear button (✕) resets input AND URL and restores full catalog
    const headerClearBtn = page.locator("button[aria-label='Clear search query']");
    assert(await headerClearBtn.isVisible(), "Header clear button (✕) is visible when query is active");
    await headerClearBtn.click();
    await page.waitForTimeout(250);

    assert((await directSearchInput.inputValue()) === "", "Header clear button cleared input text to ''");
    assert(!page.url().includes("q="), `Header clear button removed 'q=' from URL (URL: ${page.url()})`);
    const afterClearCards = await page.locator(".hidden.md\\:grid a[href^='/products/']").all();
    const afterClearIds = [...new Set(await Promise.all(afterClearCards.map((l) => l.getAttribute("href"))))];
    assert(afterClearIds.length === 8, `Header clear restored all 8 products in catalog (got ${afterClearIds.length})`);

    // 3f. Page reload retains clean cleared state
    await page.reload({ waitUntil: "domcontentloaded" });
    assert((await directSearchInput.inputValue()) === "", "After reload, header input remains empty");
    assert(!page.url().includes("q="), "After reload, URL has no 'q=' parameter");

    // 3g. SKU matching
    await directSearchInput.fill("DHT22-SENSOR-MOD");
    await directSearchInput.press("Enter");
    await page.waitForTimeout(250);
    const skuCards = await page.locator(".hidden.md\\:grid a[href^='/products/']").all();
    const skuIds = [...new Set(await Promise.all(skuCards.map((l) => l.getAttribute("href"))))].map((h) => h?.replace("/products/", ""));
    assert(skuIds.length === 1 && skuIds[0] === "6", `SKU search for 'DHT22-SENSOR-MOD' matched ID '6' (got [${skuIds.join(", ")}])`);

    // 3h. No results search
    await directSearchInput.fill("XYZNONEXISTENT");
    await directSearchInput.press("Enter");
    await page.waitForTimeout(300);
    const emptyMsg = page.locator("text=No components match your filters");
    assert(await emptyMsg.isVisible(), "Displayed 'No components match your filters' empty state message");

    // Clear filters button in empty state resets catalog
    const emptyClearBtn = page.locator("button:has-text('Clear all filters')").first();
    await emptyClearBtn.click();
    await page.locator(".hidden.md\\:grid a[href^='/products/']").first().waitFor({ state: "visible" });
    const afterClearCards2 = await page.locator(".hidden.md\\:grid a[href^='/products/']").all();
    const uniqueClearIds = [...new Set(await Promise.all(afterClearCards2.map((l) => l.getAttribute("href"))))];
    assert(uniqueClearIds.length === 8, `Clear filters restored all 8 products (got ${uniqueClearIds.length})`);

    // Test Keyboard Accessible Slider values
    console.log("  Testing keyboard accessible slider thumb...");
    const sliderThumb = page.locator("div[role='slider'][aria-label='Minimum Voltage']");
    await sliderThumb.focus();
    const valBefore = parseFloat(await sliderThumb.getAttribute("aria-valuenow") || "0");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(100);
    const valAfter = parseFloat(await sliderThumb.getAttribute("aria-valuenow") || "0");
    assert(valAfter > valBefore, `ArrowRight increased slider value from ${valBefore} to ${valAfter}`);

    // =============================================================
    // 4. Mobile Search, Clear & Stacked Filter Panel (R2, R4)
    // =============================================================
    console.log("\n4. Testing Mobile Search & Stacked Filter Panel (R2, R4)...");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BUYER_URL}/products`, { waitUntil: "domcontentloaded" });

    // Test Mobile Search Bar (R2)
    const mobileSearchInput = page.locator("#mobile-catalog-search");
    await mobileSearchInput.waitFor({ state: "visible" });
    assert(await mobileSearchInput.isVisible(), "Mobile search input is visible on 390px viewport");
    await mobileSearchInput.fill("Resistor");
    await page.waitForTimeout(200);

    const mobileFilteredCards = await page.locator(".grid.md\\:hidden a[href^='/products/']").all();
    const mobileFilteredIds = [...new Set(await Promise.all(mobileFilteredCards.map((l) => l.getAttribute("href"))))].map((h) => h?.replace("/products/", ""));
    assert(
      mobileFilteredIds.length === 1 && mobileFilteredIds[0] === "4",
      `Mobile search for 'Resistor' matched exactly ID '4' (Assorted Resistor Kit)`
    );

    // Clear mobile search and assert restored catalog and cleared URL
    const mobileClearBtn = page.locator("button[aria-label='Clear search input']").first();
    await mobileClearBtn.click();
    await page.waitForTimeout(200);

    const mobileClearedVal = await mobileSearchInput.inputValue();
    assert(mobileClearedVal === "", `Mobile search input cleared to '' (got '${mobileClearedVal}')`);
    assert(!page.url().includes("q="), `Mobile search clear removed 'q=' parameter from URL (URL: ${page.url()})`);

    const mobileRestoredCards = await page.locator(".grid.md\\:hidden a[href^='/products/']").all();
    const mobileRestoredIds = [...new Set(await Promise.all(mobileRestoredCards.map((l) => l.getAttribute("href"))))];
    assert(mobileRestoredIds.length === 8, `Mobile clear restored all 8 products (got ${mobileRestoredIds.length})`);

    // Test Mobile Filter Panel Stacking & Bounds (R4)
    const mobileFilterToggle = page.locator("button[aria-label='Toggle parametric filter drawer']");
    await mobileFilterToggle.click();
    await page.waitForTimeout(200);

    const filterPanel = page.locator("#mobile-parametric-filter-controls");
    assert(await filterPanel.isVisible(), "Mobile filter panel opened successfully");

    // Child bounds assertion: ensure filter controls are fully within viewport
    const filterBox = await filterPanel.boundingBox();
    assert(filterBox && filterBox.x >= 0 && filterBox.x + filterBox.width <= 390, `Filter panel children remain strictly within 390px viewport bounds (x: ${filterBox?.x}, width: ${filterBox?.width})`);

    const scrollWidthMobile = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidthMobile = await page.evaluate(() => document.documentElement.clientWidth);
    assert(scrollWidthMobile <= clientWidthMobile, `No horizontal scroll overflow with open mobile filters at 390px (scroll: ${scrollWidthMobile}, client: ${clientWidthMobile})`);

    // Capture screenshot with open mobile filters
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "catalog-mobile-390-filter-open.png"),
      fullPage: true,
    });
    console.log("  PASS: Captured catalog-mobile-390-filter-open.png");

    // Close mobile filter panel
    await mobileFilterToggle.click();
    await page.waitForTimeout(150);

    // =============================================================
    // 5. BOM Chooser Popover: Viewport Bounds, Keyboard, Selection & Focus (V2-2)
    // =============================================================
    console.log("\n5. Testing BOM Chooser Popover Bounds & Interactions at 320px & 390px (V2-2)...");
    for (const width of [320, 390]) {
      await page.setViewportSize({width, height: 480});
      await page.goto(`${BUYER_URL}/products`, {waitUntil: "domcontentloaded"});
      await mobileFilterToggle.click();
      const panel = page.locator("#mobile-parametric-filter-controls");
      await panel.waitFor({state: "visible"});
      const controls = await panel.locator("button, [role='slider']").all();
      assert(controls.length > 0, `Open ${width}px filters contain actual controls`);
      for (const control of controls) {
        await control.scrollIntoViewIfNeeded();
        const box = await control.boundingBox();
        assert(box && box.x >= 0 && box.x + box.width <= width,
          `Open filter child is horizontally within ${width}px viewport`);
      }
      await mobileFilterToggle.click();
      assert(!(await panel.isVisible()), `Filters close at ${width}px in a short window`);
    }

    // 5a. Small mobile viewport (320px width) — test Column 1 card popover bounds
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto(`${BUYER_URL}/products`, { waitUntil: "domcontentloaded" });

    const col1BomBtn = page.locator(".grid.md\\:hidden button:has-text('+ BOM')").first();
    await col1BomBtn.click();
    await page.waitForTimeout(200);

    const popoverCol1 = page.locator("div[role='dialog'][aria-label='Add to BOM Project']");
    assert(await popoverCol1.isVisible(), "BOM Popover opened on Column 1 card at 320px");

    // Measure actual rendered bounding box of popover
    const popoverBox320 = await popoverCol1.boundingBox();
    assert(popoverBox320 !== null, "BOM Popover bounding box acquired at 320px");
    assert(
      popoverBox320 && popoverBox320.x >= 0,
      `Popover left edge is non-negative and visible at 320px (x = ${popoverBox320?.x.toFixed(2)}px >= 0)`
    );
    assert(
      popoverBox320 && popoverBox320.x + popoverBox320.width <= 320 + 2,
      `Popover right edge is within 320px screen boundary (right = ${(popoverBox320 ? popoverBox320.x + popoverBox320.width : 0).toFixed(2)}px <= 322px)`
    );

    await assertPopoverOptions(popoverCol1, 320);
    for (const width of [321, 390, 375, 320]) {
      await page.setViewportSize({width, height: 640});
      await page.waitForFunction(() => {
        const rect = document.querySelector('[role="dialog"][aria-label="Add to BOM Project"]').getBoundingClientRect();
        return rect.left >= 7.5 && rect.right <= innerWidth - 7.5;
      });
      await assertPopoverOptions(popoverCol1, width);
    }

    // Test Outside Click dismissal without stealing focus
    console.log("  Testing outside click dismissal without stealing focus...");
    await page.locator("#mobile-catalog-search").click();
    await page.waitForTimeout(200);
    assert(!(await popoverCol1.isVisible()), "Outside click successfully closed BOM popover");
    assert(await isFocused(page.locator("#mobile-catalog-search")), "Outside click leaves focus on the clicked search control");
    await col1BomBtn.click();
    await col1BomBtn.click();
    assert(!(await popoverCol1.isVisible()), "Clicking the same trigger twice closes without reopening");

    // 5b. Column 2 card popover bounds at 390px
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BUYER_URL}/products`, { waitUntil: "domcontentloaded" });

    const col2BomBtn = page.locator(".grid.md\\:hidden button:has-text('+ BOM')").nth(1);
    await col2BomBtn.click();
    await page.waitForTimeout(200);

    const popoverCol2 = page.locator("div[role='dialog'][aria-label='Add to BOM Project']");
    assert(await popoverCol2.isVisible(), "BOM Popover opened on Column 2 card at 390px");

    const popoverBox390 = await popoverCol2.boundingBox();
    assert(
      popoverBox390 && popoverBox390.x >= 0 && popoverBox390.x + popoverBox390.width <= 390 + 2,
      `Column 2 popover fits strictly within 390px screen (left: ${popoverBox390?.x.toFixed(2)}, right: ${(popoverBox390 ? popoverBox390.x + popoverBox390.width : 0).toFixed(2)})`
    );

    // Capture mobile open popover screenshot (V2-2 requirement)
    await assertPopoverOptions(popoverCol2, 390);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "catalog-mobile-390-popover-open.png"),
      fullPage: false,
    });
    console.log("  PASS: Captured catalog-mobile-390-popover-open.png");

    // Test Keyboard navigation (ArrowDown / ArrowUp) inside popover
    await page.keyboard.press("ArrowDown");
    const activeTextDown = await page.evaluate(() => document.activeElement?.textContent);
    assert(activeTextDown && activeTextDown.includes("IoT Weather Station"), `ArrowDown focused second option ('${activeTextDown?.trim()}')`);

    await page.keyboard.press("ArrowUp");
    const activeTextUp = await page.evaluate(() => document.activeElement?.textContent);
    assert(activeTextUp && activeTextUp.includes("Arduino Line-Following Robot"), `ArrowUp returned focus to first option ('${activeTextUp?.trim()}')`);

    // Test Escape dismissal with focus restoration to trigger
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
    assert(!(await popoverCol2.isVisible()), "Escape key closed popover");
    const isCol2TriggerFocused = await isFocused(col2BomBtn);
    assert(isCol2TriggerFocused, "Focus restored to Column 2 trigger button on Escape");

    // 5c. Test Selecting a Project: exact project item count increments, others unchanged, focus returns
    console.log("  Testing BOM project selection item count mutation & focus return...");
    await col1BomBtn.click();
    await page.waitForTimeout(200);

    const beforeCounts = await projectCounts(popoverCol1);
    assert(JSON.stringify(beforeCounts) === "[5,3,4]", "Initial project quantities exactly match the source fixtures");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    assert(await isFocused(popoverCol1.getByRole("button", {name: /Smart Plant/})), "Keyboard focuses the selected project");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(250);

    assert(!(await popoverCol1.isVisible()), "Selecting project closed popover");
    const isCol1TriggerFocused = await isFocused(col1BomBtn);
    assert(isCol1TriggerFocused, "Focus returned to trigger button after project selection");
    await col1BomBtn.click();
    assert(JSON.stringify(await projectCounts(popoverCol1)) === "[5,3,5]", "Only selected project b3 increments by one");
    await page.keyboard.press("Escape");
    await page.locator("a[href='/home']:visible").first().click();
    await page.waitForURL("**/home");
    const homeBom = page.locator(".grid.md\\:hidden button:has-text('+ BOM')").first();
    await homeBom.click();
    assert(JSON.stringify(await projectCounts(popoverCol1)) === "[5,3,5]", "BOM quantities persist into Home through client navigation");
    await popoverCol1.getByRole("button", {name: /IoT Weather/}).click();
    await homeBom.click();
    assert(JSON.stringify(await projectCounts(popoverCol1)) === "[5,4,5]", "Pointer selection increments only project b2");
    await page.keyboard.press("Escape");

    // 5d. Short-height viewport verification (height = 480px)
    await page.setViewportSize({ width: 1024, height: 480 });
    await page.goto(`${BUYER_URL}/products`, { waitUntil: "domcontentloaded" });
    const deskBomBtn = page.locator(".hidden.md\\:grid button:has-text('+ BOM')").first();
    await deskBomBtn.click();
    await page.waitForTimeout(200);
    const shortHeightPopover = page.locator("div[role='dialog'][aria-label='Add to BOM Project']");
    assert(await shortHeightPopover.isVisible(), "BOM popover visible in short-height viewport (1024x480)");
    const shortBox = await shortHeightPopover.boundingBox();
    assert(shortBox && shortBox.y >= 0 && shortBox.y + shortBox.height <= 480, `Popover fits inside short viewport height (y: ${shortBox?.y}, bottom: ${(shortBox ? shortBox.y + shortBox.height : 0).toFixed(2)} <= 480)`);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "bom-popover-short-height-1024x480.png"),
      fullPage: false,
    });
    console.log("  PASS: Captured bom-popover-short-height-1024x480.png");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(150);

    await page.setViewportSize({width: 1440, height: 900});
    await page.goto(`${BUYER_URL}/products`, {waitUntil: "domcontentloaded"});
    await deskBomBtn.click();
    await assertPopoverOptions(shortHeightPopover, 1440);
    await page.screenshot({path: path.join(SCREENSHOT_DIR, "bom-popover-open-1440.png"), fullPage: false});
    for (const width of [1024, 768, 900, 1440]) {
      await page.setViewportSize({width, height: 900});
      await page.waitForFunction(() => {
        const rect = document.querySelector('[role="dialog"][aria-label="Add to BOM Project"]').getBoundingClientRect();
        return rect.left >= 7.5 && rect.right <= innerWidth - 7.5;
      });
      await assertPopoverOptions(shortHeightPopover, width);
    }
    await page.keyboard.press("Escape");

    // =============================================================
    // 6. Central Cart State & Production Logic Verification (V2-1)
    // =============================================================
    console.log("\n6. Testing Central Cart State & Production Hook Logic (V2-1)...");
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BUYER_URL}/products/6`, { waitUntil: "domcontentloaded" });
    // 6b. UI Stepper & Stock Boundary on Product Detail Page (DHT22 ID 6, stock 8)
    console.log("  Testing UI stepper and stock enforcement on /products/6...");
    assert(!(await page.evaluate(() => "__ohmSimCart" in window)), "Product Details has no production testing bridge");
    await page.waitForTimeout(100);

    const stockText = await page.textContent("#product-stock-display");
    assert(stockText && stockText.includes("8 available"), `Displays 8 available units (got '${stockText?.trim()}')`);

    // Increase stepper to 5
    const plusBtn = page.locator("button[aria-label='Increase quantity']");
    for (let i = 1; i < 5; i++) {
      await plusBtn.click();
      await page.waitForTimeout(40);
    }
    const stepperVal = await page.textContent("#product-qty-stepper span");
    assert(stepperVal?.trim() === "5", `Quantity stepper set to 5 (got ${stepperVal?.trim()})`);

    // Click "Add 5× to Cart"
    const addBtn = page.locator("#product-add-to-cart-btn");
    await addBtn.click();
    await page.waitForTimeout(250);

    // Verify stock display reflects in-cart quantity
    const updatedStockText = await page.textContent("#product-stock-display");
    assert(
      updatedStockText && updatedStockText.includes("3 remaining") && updatedStockText.includes("5 in cart"),
      `Stock display reflects remaining stock: '${updatedStockText?.trim()}'`
    );

    // Step up to add remaining 3 units to reach stock limit 8
    for (let i = 1; i < 3; i++) {
      await plusBtn.click();
      await page.waitForTimeout(40);
    }
    const stepperVal3 = await page.textContent("#product-qty-stepper span");
    assert(stepperVal3?.trim() === "3", `Stepper stepped to 3 remaining units (got ${stepperVal3?.trim()})`);

    // Add remaining 3 units to reach stock limit 8
    await addBtn.click();
    await page.waitForTimeout(250);

    const maxStockText = await page.textContent("#product-stock-display");
    assert(
      maxStockText && maxStockText.includes("Max stock in cart (8 units)"),
      `Stock status indicates max reached: '${maxStockText?.trim()}'`
    );
    assert(await addBtn.isDisabled(), "Add to Cart button disabled when maximum stock is in cart");

    // Header cart badge shows 8
    const headerCartBadge = page.locator("header a[href='/cart'] [data-cart-count]");
    assert((await headerCartBadge.textContent())?.trim() === "8", "Header cart badge reflects 8 items");

    // =============================================================
    // 7. Route Navigation State Retention & Cross-Client Persistence
    // =============================================================
    console.log("\n7. Testing Cross-Route Client State Retention...");
    const homeLink = page.locator("header a[href='/home']").first();
    await homeLink.click();
    await page.waitForTimeout(250);
    assert(page.url().endsWith("/home"), `Client-side navigated to /home without full reload (URL: ${page.url()})`);

    // Verify Home metric card preserves in-memory cart count (8)
    const homeCartItems = await page.locator("#metric-cart-items p").first().textContent();
    assert(homeCartItems?.trim() === "8", `Home metric card preserved in-memory cart items (8) across client navigation (got '${homeCartItems?.trim()}')`);

    // Cross-page addition on Home: Add 1 unit of Arduino Uno (ID 2)
    const ardHomeBtn = page.locator("button[aria-label='Add Arduino Uno R3 Compatible Board to cart']").first();
    await ardHomeBtn.click();
    await page.waitForTimeout(200);
    const homeCartItemsUpdated = await page.locator("#metric-cart-items p").first().textContent();
    assert(homeCartItemsUpdated?.trim() === "9", "Home card addition updated in-memory cart items to 9");
    assert((await headerCartBadge.textContent())?.trim() === "9", "Header badge preserved 9 items across routes");

    // A fresh page load deliberately resets in-memory state. Then exercise the
    // same low-stock product through mobile cards, Details and desktop cards.
    await page.setViewportSize({width: 390, height: 844});
    await page.goto(`${BUYER_URL}/products`, {waitUntil: "domcontentloaded"});
    const dhtName = "DHT22 Temp & Humidity Sensor Module";
    const mobileAdd = page.locator(`button[aria-label='Add ${dhtName} to cart']:visible`);
    for (let quantity = 0; quantity < 5; quantity++) await mobileAdd.click();
    await page.getByRole("status").filter({hasText: dhtName}).waitFor();
    assert(await page.getByRole("status").filter({hasText: dhtName}).isVisible(),
      "Cart addition places product feedback inside the live status region");
    await page.locator(".grid.md\\:hidden a[href='/products/6']").first().click();
    await page.waitForURL("**/products/6");
    assert((await page.locator("#product-stock-display").textContent()).includes("5 in cart, 3 remaining"),
      "Five repeated mobile card additions are preserved in Details");
    await plusBtn.click();
    await plusBtn.click();
    assert((await page.locator("#product-qty-stepper span").textContent()).trim() === "3",
      "Detail selector is bounded by remaining stock after card additions");
    await addBtn.click();
    assert(await addBtn.isDisabled(), "Card-plus-detail additions stop exactly at stock 8");
    await page.getByRole("navigation", {name: "Breadcrumbs"}).getByRole("link", {name: "Products", exact: true}).click();
    await page.waitForURL("**/products");
    const maxCard = page.locator(`button[aria-label='Maximum stock reached for ${dhtName}']:visible`);
    assert(await maxCard.isDisabled(), "Mobile catalog card prevents adding beyond aggregate stock");
    await page.setViewportSize({width: 1440, height: 900});
    assert(await maxCard.isDisabled(), "Desktop card uses the same aggregate stock boundary");
    assert((await headerCartBadge.textContent()).trim() === "8", "Cross-entry additions preserve the exact total of eight");

    // =============================================================
    // 8. Accessibility: Skip Link, Touch Targets, WAI-ARIA Tabs (V2-4)
    // =============================================================
    console.log("\n8. Testing Accessibility, Touch Targets & WAI-ARIA Tabs (V2-4)...");

    // 8a. Skip link test without silent skips
    await page.goto(`${BUYER_URL}/home`, { waitUntil: "domcontentloaded" });
    await page.keyboard.press("Tab");
    const isSkipLinkFocused = await page.evaluate(() => {
      const active = document.activeElement;
      return Boolean(active && active.textContent && active.textContent.includes("Skip to main content"));
    });
    assert(isSkipLinkFocused, "First Tab press strictly focuses 'Skip to main content' link");

    await page.keyboard.press("Enter");
    await page.waitForTimeout(100);
    const isMainActive = await page.evaluate(() => document.activeElement?.id === "main-content");
    assert(isMainActive, "Activating skip link strictly moves focus to <main id='main-content'>");

    // 8b. Touch target measurements on mobile (390px)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BUYER_URL}/products`, { waitUntil: "domcontentloaded" });

    // Category pills height >= 44px
    const firstCatPill = page.locator("button:has-text('All')").first();
    const catBox = await firstCatPill.boundingBox();
    assert(catBox && catBox.height >= 44, `Category pill touch target height >= 44px (got ${catBox?.height}px)`);

    // Mobile filter toggle height >= 44px
    const mobFilterToggle = page.locator("button[aria-label='Toggle parametric filter drawer']");
    const toggleBox = await mobFilterToggle.boundingBox();
    assert(toggleBox && toggleBox.height >= 44, `Mobile filter toggle touch target height >= 44px (got ${toggleBox?.height}px)`);

    // Sort select height >= 44px
    const mobSortSelect = page.locator("#catalog-sort-select");
    const sortBox = await mobSortSelect.boundingBox();
    assert(sortBox && sortBox.height >= 44, `Catalog sort select touch target height >= 44px (got ${sortBox?.height}px)`);

    // Create BOM project button target >= 44x44px (inside mobile filter drawer)
    await mobFilterToggle.click();
    await page.waitForTimeout(200);
    const addBomBtn = page.locator(".md\\:hidden button[aria-label='Create new BOM project']");
    const addBomBox = await addBomBtn.boundingBox();
    assert(addBomBox && addBomBox.width >= 44 && addBomBox.height >= 44, `Create BOM button touch target >= 44x44px (got ${addBomBox?.width}x${addBomBox?.height}px)`);
    await mobFilterToggle.click();
    await page.waitForTimeout(150);

    // 8c. SpecsTable WAI-ARIA tab pattern, roving tabIndex & keyboard navigation
    await page.goto(`${BUYER_URL}/products/1`, { waitUntil: "domcontentloaded" });
    const tabSpecs = page.locator("#tab-specs");
    const tabAbout = page.locator("#tab-about");

    assert((await tabSpecs.getAttribute("aria-selected")) === "true", "Specifications tab initial aria-selected='true'");
    assert((await tabSpecs.getAttribute("tabindex")) === "0", "Specifications tab initial roving tabIndex='0'");
    assert((await tabAbout.getAttribute("aria-selected")) === "false", "About tab initial aria-selected='false'");
    assert((await tabAbout.getAttribute("tabindex")) === "-1", "About tab initial roving tabIndex='-1'");

    // Focus Specs tab and press ArrowRight to switch tab via keyboard
    await tabSpecs.focus();
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(150);

    const isAboutFocused = await page.evaluate(() => document.activeElement?.id === "tab-about");
    assert(isAboutFocused, "ArrowRight moved focus to About tab");
    assert((await tabAbout.getAttribute("aria-selected")) === "true", "About tab aria-selected updated to 'true' via ArrowRight");
    assert((await tabAbout.getAttribute("tabindex")) === "0", "About tab roving tabIndex updated to '0'");
    assert((await tabSpecs.getAttribute("tabindex")) === "-1", "Specifications tab roving tabIndex updated to '-1'");
    assert(await page.locator("#tabpanel-about").isVisible(), "About tabpanel is displayed");

    // Press ArrowLeft to return to Specifications tab
    await page.keyboard.press("ArrowLeft");
    await page.waitForTimeout(150);

    const isSpecsFocused = await page.evaluate(() => document.activeElement?.id === "tab-specs");
    assert(isSpecsFocused, "ArrowLeft returned focus to Specifications tab");
    assert((await tabSpecs.getAttribute("aria-selected")) === "true", "Specifications tab aria-selected restored to 'true'");
    assert((await tabSpecs.getAttribute("tabindex")) === "0", "Specifications tab roving tabIndex restored to '0'");

    // Verify tabpanel has tabIndex=0 for keyboard accessibility
    const specsPanelTabIndex = await page.locator("#tabpanel-specs").getAttribute("tabindex");
    assert(specsPanelTabIndex === "0", "Tabpanel has tabIndex='0' for accessible navigation");

    // Capture keyboard focus state screenshot
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.keyboard.press("Tab");
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "keyboard-focus-state-1440.png"),
      fullPage: false,
    });
    console.log("  PASS: Captured keyboard-focus-state-1440.png");

    // =============================================================
    // 9. Responsive Horizontal Overflow Verification Across Viewports
    // =============================================================
    console.log("\n9. Verifying Zero Horizontal Overflow Across All 6 Viewports on Home, Catalog & Details...");
    const testRoutes = ["/home", "/products", "/products/1"];
    for (const route of testRoutes) {
      for (const vp of VIEWPORTS) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(`${BUYER_URL}${route}`, { waitUntil: "domcontentloaded" });
        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
        assert(
          scrollWidth <= clientWidth,
          `Zero horizontal scroll overflow on ${route} at ${vp.name} (${vp.width}px): scroll=${scrollWidth}, client=${clientWidth}`
        );
      }
    }

    // =============================================================
    // 10. Capture All Full-Page Review Screenshots (R8)
    // =============================================================
    console.log("\n10. Capturing Full-Page Review Screenshots (R8)...");

    // Desktop Home (fullPage: true)
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BUYER_URL}/home`, { waitUntil: "domcontentloaded" });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "home-desktop-1440.png"), fullPage: true });

    // Mobile Home (fullPage: true)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BUYER_URL}/home`, { waitUntil: "domcontentloaded" });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "home-mobile-390.png"), fullPage: true });

    // Desktop Catalog (fullPage: true)
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BUYER_URL}/products`, { waitUntil: "domcontentloaded" });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "catalog-desktop-1440.png"), fullPage: true });

    // Mobile Catalog (fullPage: true)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BUYER_URL}/products`, { waitUntil: "domcontentloaded" });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "catalog-mobile-390.png"), fullPage: true });

    // Desktop Product Details (fullPage: true)
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BUYER_URL}/products/1`, { waitUntil: "domcontentloaded" });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "product-details-desktop-1440.png"), fullPage: true });

    // Mobile Product Details (fullPage: true)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BUYER_URL}/products/1`, { waitUntil: "domcontentloaded" });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "product-details-mobile-390.png"), fullPage: true });

    console.log(`  PASS: All full-page screenshots written to ${SCREENSHOT_DIR}`);

    // =============================================================
    // 11. Strict Error & Failure Audit (Guaranteed Nonzero Exit on Failure)
    // =============================================================
    console.log("\n11. Final Error & Failure Audit...");

    if (consoleErrors.length > 0) {
      failures.push(`Console Errors (${consoleErrors.length}): ${consoleErrors.join("; ")}`);
    } else {
      console.log("  PASS: Zero console errors");
    }

    if (pageErrors.length > 0) {
      failures.push(`Page Errors (${pageErrors.length}): ${pageErrors.join("; ")}`);
    } else {
      console.log("  PASS: Zero unhandled page errors");
    }

    if (httpErrors.length > 0) {
      failures.push(`HTTP >= 400 Errors (${httpErrors.length}): ${httpErrors.join("; ")}`);
    } else {
      console.log("  PASS: Zero HTTP >= 400 resource errors");
    }

    if (failures.length > 0) {
      console.error(`\n>>> TEST SUITE FAILED WITH ${failures.length} FAILURE(S) <<<`);
      for (const f of failures) {
        console.error(`  - ${f}`);
      }
      process.exitCode = 1;
      return; // finally closes the browser; the process still exits nonzero.
    }

    console.log("\n>>> ALL OHMSIM BUYER BATCH 1 TESTS PASSED WITH ZERO FAILURES <<<");
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error("FATAL TEST FAILURE:", err);
  process.exitCode = 1;
  process.exit(1);
});
