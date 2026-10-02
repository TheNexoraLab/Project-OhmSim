/** Frontend-only Auth regression. Uses the same installed Playwright setup as the landing test. */
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || "playwright");
const base = process.env.LANDING_URL || "http://localhost:3100";
const screenshots = process.env.SCREENSHOT_DIR || fs.mkdtempSync(path.join(os.tmpdir(), "ohmsim-auth-review-"));
fs.mkdirSync(screenshots, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: process.platform === "win32" ? "msedge" : undefined });
let checks = 0;
function check(value, message) { assert.ok(value, message); checks++; console.log(`PASS: ${message}`); }
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  const writes = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("request", (request) => { if (!["GET", "HEAD"].includes(request.method())) writes.push(request.url()); });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(base);
  await page.locator("#desktop-login-button").click();
  await page.waitForURL("**/login");
  await page.getByRole("heading", { name: "WELCOME BACK" }).waitFor();
  check(await page.getByRole("heading", { name: "WELCOME BACK" }).isVisible(), "Desktop Landing Login navigates to /login");
  check(await page.locator("input").evaluateAll(inputs => inputs.every(input => input.value === "")), "Sign-in starts with empty fields");
  check(await page.locator("form").getAttribute("autocomplete") === "off" && await page.getByLabel("Email address", { exact: true }).getAttribute("autocomplete") === "off", "Preview disables form and email autofill hints");
  check(await page.getByLabel("Password", { exact: true }).getAttribute("autocomplete") === "new-password", "Preview does not request saved sign-in passwords");
  await page.getByRole("button", { name: "SIGN IN", exact: true }).click();
  check(await page.getByText("Email address is required", { exact: true }).isVisible(), "Empty sign-in shows required validation");
  check(await page.getByLabel("Email address", { exact: true }).evaluate(el => el === document.activeElement), "Invalid submit focuses first invalid field");
  await page.getByLabel("Email address", { exact: true }).fill("invalid");
  await page.getByLabel("Password", { exact: true }).fill("sample-password");
  await page.getByRole("button", { name: "SIGN IN", exact: true }).click();
  check(await page.getByText("Invalid email format", { exact: true }).isVisible(), "Invalid email is rejected locally");
  await page.getByRole("button", { name: "Show password", exact: true }).click();
  check(await page.getByLabel("Password", { exact: true }).getAttribute("type") === "text", "Show password works");
  await page.getByRole("button", { name: "Hide password", exact: true }).click();
  check(await page.getByLabel("Password", { exact: true }).getAttribute("type") === "password", "Hide password works");
  await page.getByLabel("Email address", { exact: true }).fill("sample@example.com");
  await page.getByLabel("Password", { exact: true }).press("Enter");
  check(await page.getByRole("status").textContent() === "Sign-in preview complete. No session was created.", "Enter submits only a sign-in preview");
  check(await page.getByLabel("Password", { exact: true }).inputValue() === "", "Password cleared after preview submission");

  await page.getByRole("button", { name: "Create Account", exact: true }).click();
  await page.waitForFunction(() => document.activeElement?.id === "auth-heading");
  check(await page.getByRole("heading", { name: "NEW TO OHMSIM" }).isVisible(), "Create Account transition moves focus to heading");
  check(await page.locator("form").count() === 1 && await page.locator("input").count() === 5, "Only active view controls exist in DOM");
  await page.getByRole("button", { name: "CREATE ACCOUNT", exact: true }).click();
  check(await page.getByText("Enter your full name", { exact: true }).isVisible(), "Registration requires name");
  await page.getByLabel("Full name", { exact: true }).fill("Sample User");
  await page.getByLabel("Email address", { exact: true }).fill("sample@example.com");
  await page.getByLabel("Contact number", { exact: true }).fill("912 345 6789");
  await page.getByLabel("Password", { exact: true }).fill("short");
  await page.getByLabel("Confirm password", { exact: true }).fill("different");
  await page.getByRole("button", { name: "CREATE ACCOUNT", exact: true }).click();
  check(await page.getByText("Use at least 8 characters").isVisible(), "Registration checks minimum password length");
  check(await page.getByText("Passwords do not match").isVisible(), "Registration shows mismatch");
  await page.getByLabel("Password", { exact: true }).fill("sample-password");
  await page.getByLabel("Confirm password", { exact: true }).fill("sample-password");
  await page.getByRole("button", { name: "Show confirm password", exact: true }).click();
  check(await page.getByLabel("Confirm password", { exact: true }).getAttribute("type") === "text", "Confirm password has independent toggle");
  await page.getByRole("button", { name: "CREATE ACCOUNT", exact: true }).click();
  check((await page.getByRole("status").textContent()).includes("No account was created"), "Registration success remains explicitly frontend-only");

  await page.getByRole("button", { name: "Back to Sign In" }).click();
  await page.getByRole("button", { name: "Forgot Password?" }).click();
  await page.getByLabel("Email address", { exact: true }).fill("invalid");
  await page.getByRole("button", { name: "SEND RESET LINK" }).click();
  check(await page.getByText("Invalid email format", { exact: true }).isVisible(), "Recovery validates email");
  await page.getByLabel("Email address", { exact: true }).fill("sample@example.com");
  await page.getByRole("button", { name: "SEND RESET LINK" }).click();
  check(await page.getByText("Reset link sent!", { exact: true }).isVisible(), "Recovery renders reference success state");
  check(await page.getByText("Prototype state only — no email was sent.").isVisible(), "Recovery success explicitly discloses no delivery");
  await page.screenshot({ path: path.join(screenshots, "reset-success.png"), fullPage: true });
  check(writes.length === 0, "No POST, mutation, or auth requests from form submissions");
  check((await context.cookies()).length === 0, "No cookies/session created");
  check(await page.evaluate(() => localStorage.length === 0 && sessionStorage.length === 0), "No credentials persisted in browser storage");

  for (const width of [320, 390, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${base}/login`);
    for (const view of ["signin", "register", "forgot"]) {
      if (view === "register") await page.getByRole("button", { name: "Create Account", exact: true }).click();
      if (view === "forgot") {
        await page.getByRole("button", { name: "Back to Sign In" }).click();
        await page.getByRole("button", { name: "Forgot Password?" }).click();
      }
      await page.evaluate(() => document.fonts.ready);
      const instructions = { signin: "Sign in to your OhmSim account.", register: "Create your account to get started with OhmSim.", forgot: "Enter your email and we'll send you a reset link." };
      check(await page.getByText(instructions[view], { exact: true }).isVisible(), `${view} shows approved instructions at ${width}px`);
      check(await page.getByText("Frontend preview only. No authentication or email delivery. Use sample details.", { exact: true }).count() === 0, `${view} omits the developer-only introductory notice at ${width}px`);
      check(await page.evaluate(() => [...document.querySelectorAll("input")].every(el => { const r = el.getBoundingClientRect(); return r.width > 40 && r.left >= 0 && r.right <= innerWidth; }) && document.documentElement.scrollWidth <= innerWidth), `${view} inputs usable with no horizontal overflow at ${width}px`);
      check(await page.locator("input").evaluateAll(elements => elements.every(el => el.labels?.length)), `${view} fields have labels at ${width}px`);
      await page.waitForFunction(() => [...document.images].every(img => img.complete && img.naturalWidth > 0));
      await page.evaluate(async () => {
        await Promise.all([...document.images].map(img => img.decode()));
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      });
      if ([390, 1440].includes(width)) await page.screenshot({ path: path.join(screenshots, `${view}-${width}.png`), fullPage: true });
    }
  }

  await page.setViewportSize({ width: 1024, height: 450 });
  await page.goto(`${base}/login`);
  await page.getByRole("button", { name: "Create Account", exact: true }).click();
  await page.getByRole("button", { name: "CREATE ACCOUNT", exact: true }).scrollIntoViewIfNeeded();
  check(await page.getByRole("button", { name: "CREATE ACCOUNT", exact: true }).isVisible(), "Short desktop registration scrolls to submit");
  await page.getByRole("link", { name: "OhmSim — back to landing page" }).click();
  await page.waitForURL(base + "/");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("#mobile-menu-toggle").click();
  await page.locator("#mobile-nav-panel").getByRole("link", { name: "Log In", exact: true }).click();
  await page.waitForURL("**/login");
  await page.getByRole("heading", { name: "WELCOME BACK" }).waitFor();
  check(await page.getByRole("heading", { name: "WELCOME BACK" }).isVisible(), "Mobile Landing Login reaches Auth");
  await page.getByLabel("Email address", { exact: true }).focus();
  await page.keyboard.press("Tab");
  check(await page.getByLabel("Password", { exact: true }).evaluate(el => el === document.activeElement), "Logical email-to-password Tab order");
  check(await page.getByLabel("Password", { exact: true }).evaluate(el => getComputedStyle(el.parentElement).outlineStyle !== "none"), "Input wrapper shows focus outline");
  await page.emulateMedia({ reducedMotion: "reduce" });
  check(await page.getByRole("button", { name: "Show password", exact: true }).evaluate(el => parseFloat(getComputedStyle(el).transitionDuration) < .001), "Reduced-motion global treatment applies");
  check(errors.length === 0, `No browser/runtime errors: ${errors.join("; ")}`);
  console.log(`${checks} checks passed. Screenshots: ${screenshots}`);
} finally { await browser.close(); }
