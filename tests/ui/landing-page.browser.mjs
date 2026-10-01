/**
 * OhmSim Public Landing Page — Browser Regression Suite
 *
 * Runs end-to-end browser checks across required viewport widths (320, 390, 768, 1024, 1440, 1920px),
 * verifying section rendering, copy fidelity, zero horizontal overflow, responsive navigation collapse,
 * preview dialogs, keyboard navigation, and absence of console/page errors.
 *
 * Usage:
 *   node tests/ui/landing-page.browser.mjs
 *
 * Environment variables:
 *   LANDING_URL              Base URL (default: http://localhost:3100)
 *   PLAYWRIGHT_MODULE_PATH   Path to playwright module if not installed in project node_modules
 *   HEADLESS                 Set to "false" to run headed (default: true)
 *   SCREENSHOT_DIR           Directory to save visual review screenshots
 */

import { createRequire } from "node:module";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";

const LANDING_URL = process.env.LANDING_URL || "http://localhost:3100";
const HEADLESS = process.env.HEADLESS !== "false";
const SCREENSHOT_DIR =
  process.env.SCREENSHOT_DIR || path.join(os.tmpdir(), "ohmsim-landing-screenshots");

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

  // 1. Try environment variable path if provided
  if (process.env.PLAYWRIGHT_MODULE_PATH) {
    try {
      const p = process.env.PLAYWRIGHT_MODULE_PATH;
      const mod = req(p);
      return mod.chromium || mod.default?.chromium;
    } catch (e) {
      console.warn(`Could not load PLAYWRIGHT_MODULE_PATH: ${e.message}`);
    }
  }

  // 2. Try standard require
  try {
    const mod = req("playwright");
    return mod.chromium || mod.default?.chromium;
  } catch {}

  // 3. Try Antigravity IDE built-in Playwright
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

  throw new Error(
    "Playwright could not be resolved. Please set PLAYWRIGHT_MODULE_PATH or install playwright."
  );
}

async function run() {
  console.log("=== OhmSim Landing Page Browser Regression Test ===");
  console.log(`Target URL: ${LANDING_URL}`);

  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const chromium = loadPlaywright();
  const browser = await chromium.launch({
    headless: HEADLESS,
    channel: process.platform === "win32" ? "msedge" : undefined,
  });

  let failures = 0;

  function assert(condition, message) {
    if (!condition) {
      console.error(`  FAIL: ${message}`);
      failures++;
    } else {
      console.log(`  PASS: ${message}`);
    }
  }

  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    const consoleErrors = [];
    const pageErrors = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    page.on("pageerror", (err) => {
      pageErrors.push(err.message);
    });

    // 1. Initial Page Load
    console.log("\n1. Verifying initial page load...");
    const response = await page.goto(LANDING_URL, { waitUntil: "networkidle", timeout: 15000 });
    assert(response && response.status() === 200, `Page returned HTTP status 200 (got ${response?.status()})`);

    // 2. Section Hierarchy and Core Copy Verification
    console.log("\n2. Verifying sections and canonical copy...");
    const hasNavbar = await page.$("header");
    assert(Boolean(hasNavbar), "Navbar (<header>) is present");

    const hasHero = await page.$("#hero-heading");
    assert(Boolean(hasHero), "Hero heading (#hero-heading) is present");

    const heroText = await page.textContent("#hero-heading");
    assert(
      heroText && heroText.includes("Specialized") && heroText.includes("Electronics"),
      "Hero headline contains canonical text"
    );

    const hasCategories = await page.$("#categories");
    assert(Boolean(hasCategories), "Categories section (#categories) is present");

    const hasTrust = await page.$("[aria-label='Trust and Reliability Highlights']");
    assert(Boolean(hasTrust), "Trust highlights section is present");

    const hasBom = await page.$("#bom-tool");
    assert(Boolean(hasBom), "BOM section (#bom-tool) is present");

    const hasFooter = await page.$("footer");
    assert(Boolean(hasFooter), "Footer is present");

    // 3. Viewport Verification & Zero Horizontal Overflow
    console.log("\n3. Testing viewports and horizontal overflow...");
    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(100);

      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      assert(!hasOverflow, `Zero horizontal overflow at ${vp.width}px (${vp.name})`);

      // Verify collapsible nav state
      if (vp.width < 1024) {
        const menuBtnVisible = await page.$eval(
          "header button[aria-label*='navigation menu']",
          (el) => window.getComputedStyle(el).display !== "none"
        );
        assert(menuBtnVisible, `Mobile navigation trigger is visible at ${vp.width}px`);
      } else {
        const navLinksVisible = await page.$eval(
          "nav[aria-label='Primary navigation']",
          (el) => window.getComputedStyle(el).display !== "none"
        );
        assert(navLinksVisible, `Desktop navigation links are visible at ${vp.width}px`);
      }

      // Capture screenshot for visual check
      const screenshotPath = path.join(SCREENSHOT_DIR, `${vp.name}-${vp.width}px.png`);
      await page.screenshot({ path: screenshotPath });
    }

    // 4. Mobile Navigation Interactivity
    console.log("\n4. Testing mobile menu interaction...");
    await page.setViewportSize({ width: 390, height: 844 });
    const menuBtn = await page.$("header button[aria-label*='navigation menu']");
    assert(Boolean(menuBtn), "Mobile menu trigger button found");

    if (menuBtn) {
      await menuBtn.click();
      await page.waitForTimeout(200);

      const isExpanded = await menuBtn.getAttribute("aria-expanded");
      assert(isExpanded === "true", "Mobile menu button aria-expanded is true after click");

      const panel = await page.$("#mobile-nav-panel");
      assert(Boolean(panel), "Mobile navigation panel (#mobile-nav-panel) is rendered");

      // Test Escape key dismissal
      await page.keyboard.press("Escape");
      await page.waitForTimeout(200);

      const isExpandedAfterEsc = await menuBtn.getAttribute("aria-expanded");
      assert(
        isExpandedAfterEsc === "false",
        "Mobile menu closes on Escape key and updates aria-expanded to false"
      );
    }

    // 5. Preview Dialog & Focus Management
    console.log("\n5. Testing preview dialog interaction...");
    await page.setViewportSize({ width: 1440, height: 900 });

    const openBomBtn = await page.$("button[aria-label='Open BOM Tool preview']");
    assert(Boolean(openBomBtn), "BOM Tool CTA trigger button found");

    if (openBomBtn) {
      await openBomBtn.click();
      await page.waitForTimeout(200);

      const dialog = await page.$("div[role='dialog']");
      assert(Boolean(dialog), "Preview dialog is opened with role='dialog'");

      const dialogTitle = await page.textContent("#preview-dialog-title");
      assert(
        dialogTitle && dialogTitle.includes("Preview Notice"),
        `Dialog title is accessible: "${dialogTitle}"`
      );

      // Dismiss dialog with Escape key
      await page.keyboard.press("Escape");
      await page.waitForTimeout(200);

      const dialogAfterClose = await page.$("div[role='dialog']");
      assert(dialogAfterClose === null, "Preview dialog closes on Escape key");
    }

    // 6. Console and Runtime Errors
    console.log("\n6. Checking console and runtime errors...");
    assert(consoleErrors.length === 0, `Zero console errors (got: ${consoleErrors.join(", ") || "none"})`);
    assert(pageErrors.length === 0, `Zero unhandled page errors (got: ${pageErrors.join(", ") || "none"})`);

    console.log(`\nReview screenshots saved to: ${SCREENSHOT_DIR}`);

    if (failures === 0) {
      console.log("\n>>> ALL LANDING PAGE BROWSER CHECKS PASSED <<<\n");
    } else {
      console.error(`\n>>> COMPLETED WITH ${failures} FAILED CHECK(S) <<<\n`);
      process.exitCode = 1;
    }
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
