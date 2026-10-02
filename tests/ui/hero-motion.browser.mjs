import assert from "node:assert/strict";
import { createRequire } from "node:module";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || "playwright");
const browser = await chromium.launch({ headless: true, channel: process.platform === "win32" ? "msedge" : undefined });
const screenshots = fs.mkdtempSync(path.join(os.tmpdir(), "ohmsim-hero-motion-"));
try {
  const page = await browser.newPage({ reducedMotion: "no-preference" });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(process.env.LANDING_URL || "http://localhost:3000");
  const hero = page.locator("[data-hero-motion]");
  const pulse = hero.locator("[data-hero-pulse]").first();
  assert.equal(await hero.locator("[data-hero-pulse]").count(), 4);
  const initial = await pulse.evaluate(el => getComputedStyle(el).strokeDashoffset);
  await page.waitForTimeout(250);
  assert.notEqual(await pulse.evaluate(el => getComputedStyle(el).strokeDashoffset), initial);
  assert.equal(await hero.getByRole("button", { name: /background motion/ }).count(), 0);
  assert.ok(await hero.locator("[data-hero-pulse]").evaluateAll(paths => {
    const styles = paths.map(el => getComputedStyle(el));
    return styles.every(style => style.animationIterationCount === "infinite") && new Set(styles.map(style => style.animationDuration)).size === paths.length && new Set(styles.map(style => style.animationDelay)).size === paths.length && new Set(styles.map(style => style.animationDirection)).size === 2;
  }));
  await page.waitForTimeout(7000);
  const later = await pulse.evaluate(el => getComputedStyle(el).strokeDashoffset);
  await page.waitForTimeout(250);
  assert.notEqual(await pulse.evaluate(el => getComputedStyle(el).strokeDashoffset), later);
  for (const width of [320, 390, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.ok(await hero.getByRole("link", { name: "Explore Catalog" }).isVisible());
    await page.evaluate(() => document.fonts.ready);
    if ([390, 1440].includes(width)) await hero.screenshot({ path: path.join(screenshots, `hero-${width}.png`), animations: "allow" });
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  assert.ok(await hero.locator("[data-hero-pulse]").evaluateAll(paths => paths.every(el => getComputedStyle(el).animationName === "none" && getComputedStyle(el).display === "none")));
  assert.deepEqual(errors, []);
  console.log(`PASS: continuous circuit motion, independent timings, mixed directions, no motion control, reduced motion, six viewports and no runtime errors. Screenshots: ${screenshots}`);
} finally { await browser.close(); }
