import assert from "node:assert/strict";
import { createRequire } from "node:module";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || "playwright");
const base = process.env.LANDING_URL || "http://localhost:3000";
const screenshots = fs.mkdtempSync(path.join(os.tmpdir(), "ohmsim-policies-"));
const browser = await chromium.launch({ headless: true, channel: process.platform === "win32" ? "msedge" : undefined });
let checks = 0;
function check(value, message) { assert.ok(value, message); checks++; console.log(`PASS: ${message}`); }
try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const policy of ["privacy", "terms"]) {
      await page.goto(base);
      await page.locator(`footer a[href='/${policy}']`).click();
      await page.waitForURL(`**/${policy}`);
      await page.locator("h1").waitFor();
      check((await page.locator("h1").textContent()).toLowerCase() === policy, `${policy}: landing link works at ${width}px`);
      check(await page.getByRole("dialog").count() === 0, `${policy}: no placeholder dialog`);
      check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${policy}: no overflow at ${width}px`);
      check(await page.locator('nav[aria-label="Policy navigation"] [aria-current="page"]').getAttribute("href") === `/${policy}`, `${policy}: current page identified`);
      check(await page.locator('nav[aria-label="On this page"] a').evaluateAll(links => links.every(link => document.getElementById(link.hash.slice(1)))), `${policy}: all contents links resolve`);
      await page.getByRole("navigation", { name: "On this page" }).getByRole("link").last().click();
      check(new URL(page.url()).hash.length > 1, `${policy}: contents navigation works`);
      await page.reload();
      check(await page.locator("h1").isVisible(), `${policy}: deep link survives reload`);
      await page.getByRole("link", { name: "Back to top ↑", exact: true }).click();
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
      await page.evaluate(() => document.fonts.ready);
      await page.waitForFunction(() => [...document.images].every(img => img.complete && img.naturalWidth > 0));
      await page.evaluate(async () => { await Promise.all([...document.images].map(img => img.decode())); await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); });
      if ([390, 1440].includes(width)) await page.screenshot({ path: path.join(screenshots, `${policy}-${width}.png`), fullPage: true });
    }
  }
  check((await page.locator("main").textContent()).includes("₱80.00"), "Terms contain approved delivery fee");
  check((await page.locator("main").textContent()).includes("₱1,000.00"), "Terms contain approved free-delivery threshold");
  await page.getByRole("navigation", { name: "Policy navigation" }).getByRole("link", { name: "Privacy", exact: true }).click();
  await page.waitForURL("**/privacy");
  check(await page.getByRole("heading", { name: "Privacy", exact: true }).isVisible(), "Policy cross-navigation works");
  await page.getByRole("link", { name: "Back to home", exact: true }).focus();
  await page.keyboard.press("Enter");
  await page.waitForURL(base + "/");
  check(new URL(page.url()).pathname === "/", "Keyboard home navigation works");
  check(errors.length === 0, `No browser errors: ${errors.join("; ")}`);
  console.log(`${checks} checks passed. Screenshots: ${screenshots}`);
} finally { await browser.close(); }
