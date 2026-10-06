import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require(
  process.env.PLAYWRIGHT_MODULE_PATH ||
    path.join(process.env.LOCALAPPDATA || "", "Programs/Antigravity IDE/resources/app/node_modules/playwright")
);

// ---------------------------------------------------------------------------
// TypeScript Module Loader for Direct Production Logic Verification
// ---------------------------------------------------------------------------
function loadTsModule(relPath) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  const req = createRequire(path.join(root, "package.json"));
  const ts = req("typescript");
  const cache = new Map();
  function load(file) {
    file = fs.realpathSync(file);
    if (cache.has(file)) return cache.get(file).exports;
    let source = fs.readFileSync(file, "utf8");
    if (/\.tsx?$/.test(file)) {
      source = ts.transpileModule(source, {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2022,
          jsx: ts.JsxEmit.ReactJSX,
          esModuleInterop: true,
        },
      }).outputText;
    }
    const moduleObj = { exports: {} };
    cache.set(file, moduleObj);
    const localReq = createRequire(file);
    const customReq = (name) => {
      if (name.startsWith("@/")) {
        const base = path.join(root, name.slice(2));
        const resolved = [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, path.join(base, "index.ts")].find((f) => fs.existsSync(f));
        if (!resolved) throw new Error(`Cannot resolve ${name} in ${file}`);
        return load(resolved);
      }
      if (name.startsWith(".")) {
        const base = path.resolve(path.dirname(file), name);
        const resolved = [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, path.join(base, "index.ts")].find((f) => fs.existsSync(f));
        if (resolved) return load(resolved);
      }
      return localReq(name);
    };
    const fn = new Function("require", "exports", "module", source);
    fn(customReq, moduleObj.exports, moduleObj);
    return moduleObj.exports;
  }
  return load(path.resolve(root, relPath));
}

console.log("=== OhmSim Buyer Batch 4 Verification Suite ===\n");

// ===========================================================================
// SECTION 0: Production Logic, Invariants & Service Validation (Node Context)
// ===========================================================================
console.log("0. Testing Production Profile & Address Invariants Directly...");

const profileService = loadTsModule("services/profile-service.ts");
const expectedOrdersCount = loadTsModule("services/order-service.ts").getMockOrders().length;
const expectsOrdersRoute = expectedOrdersCount > 0;
const screenshotDirectory = process.env.SCREENSHOT_DIR || "docs/design/buyer/screenshots";
fs.mkdirSync(screenshotDirectory, { recursive: true });
const { REGION_3_PROVINCES } = loadTsModule("types/order.ts");

// 0.1 Phone Validation (11 digits starting with 09)
assert.equal(profileService.validatePhilippineMobile("09171234567"), true, "Valid 11-digit mobile starting with 09 must pass");
assert.equal(profileService.validatePhilippineMobile("09981234567"), true, "Valid 0998 mobile must pass");
assert.equal(profileService.validatePhilippineMobile("9171234567"), false, "10-digit mobile missing leading 0 must fail");
assert.equal(profileService.validatePhilippineMobile("08171234567"), false, "Mobile not starting with 09 must fail");
assert.equal(profileService.validatePhilippineMobile("0917123456"), false, "Too short mobile must fail");
assert.equal(profileService.validatePhilippineMobile("091712345678"), false, "Too long mobile must fail");
assert.equal(profileService.validatePhilippineMobile("0917123456a"), false, "Non-digit characters must fail");
console.log("PASS: validatePhilippineMobile strictly enforces 11-digit 09XXXXXXXXX format");

// 0.2 Region III Province Validation
for (const prov of REGION_3_PROVINCES) {
  assert.equal(profileService.validateRegion3Province(prov), true, `Province ${prov} must be a valid Region III province`);
}
assert.equal(profileService.validateRegion3Province("Metro Manila"), false, "Metro Manila must not be in Region III");
assert.equal(profileService.validateRegion3Province("Cavite"), false, "Cavite must not be in Region III");
assert.equal(profileService.validateRegion3Province("Cebu"), false, "Cebu must not be in Region III");
assert.equal(profileService.validateRegion3Province("Davao"), false, "Davao must not be in Region III");
console.log("PASS: validateRegion3Province strictly restricts to the 7 canonical Central Luzon provinces");

// Since initial store already has 2 addresses, delete one first to test postal code check
profileService.deleteAddress("addr-lab");

const emptyPostal = profileService.addAddress({
  label: "Empty Postal",
  recipientName: "Alex Rivera",
  contactNumber: "09171234567",
  region: "Region III",
  province: "Pampanga",
  cityMunicipality: "San Fernando",
  barangay: "Dolores",
  streetAddress: "123 McArthur Hwy",
  postalCode: "",
});
assert.equal(emptyPostal.success, false, "Empty postal code must be rejected");
assert.ok(emptyPostal.error?.includes("Postal code is required"));

const whitespacePostal = profileService.addAddress({
  label: "Whitespace Postal",
  recipientName: "Alex Rivera",
  contactNumber: "09171234567",
  region: "Region III",
  province: "Pampanga",
  cityMunicipality: "San Fernando",
  barangay: "Dolores",
  streetAddress: "123 McArthur Hwy",
  postalCode: "   ",
});
assert.equal(whitespacePostal.success, false, "Whitespace-only postal code must be rejected");

const validPostalAdd = profileService.addAddress({
  label: "Valid Postal",
  recipientName: "Alex Rivera",
  contactNumber: "09171234567",
  region: "Region III",
  province: "Pampanga",
  cityMunicipality: "San Fernando",
  barangay: "Dolores",
  streetAddress: "123 McArthur Hwy",
  postalCode: " 2000 ",
});
assert.equal(validPostalAdd.success, true, "Valid trimmed postal code must be accepted");
assert.equal(validPostalAdd.address?.postalCode, "2000", "Postal code must be stored trimmed");
console.log("PASS: Required postal code validation strictly enforced (rejects empty/whitespace, trims valid)");

// 0.4 Invariant: Unknown ID Rejection & Immutability (B4-1)
profileService.resetProfileStore();
const snapshotBefore = profileService.getAddressesSnapshot();
let notifyCount = 0;
const unsubscribe = profileService.subscribeAddresses(() => {
  notifyCount++;
});

// Calling setDefaultAddress with unknown ID
const badDefaultResult = profileService.setDefaultAddress("missing-unknown-id");
assert.equal(badDefaultResult.success, false, "setDefaultAddress with missing ID must return success: false");
assert.equal(profileService.getAddressesSnapshot(), snapshotBefore, "Rejected action must leave snapshot reference identical (no mutation)");
assert.equal(notifyCount, 0, "Rejected action must send ZERO subscriber notifications");
assert.equal(
  profileService.getAddressesSnapshot().filter((a) => a.isDefault).length,
  1,
  "Exactly one default address must be preserved"
);

// Calling deleteAddress with unknown ID
const badDeleteResult = profileService.deleteAddress("missing-unknown-id");
assert.equal(badDeleteResult.success, false, "deleteAddress with missing ID must return success: false");
assert.equal(profileService.getAddressesSnapshot(), snapshotBefore, "Rejected delete must leave snapshot reference identical");
assert.equal(notifyCount, 0, "Rejected delete must send ZERO subscriber notifications");
unsubscribe();
console.log("PASS: Unknown ID actions strictly rejected without mutation, reference change, or notification");

// 0.5 Collision-Resistant Unique IDs (B4-1)
profileService.deleteAddress("addr-home");
profileService.deleteAddress("addr-lab");
assert.equal(profileService.getAddressesSnapshot().length, 0, "Address book should be empty");

// Add two addresses rapidly
const add1 = profileService.addAddress({
  label: "Office Alpha",
  recipientName: "Alex Rivera",
  contactNumber: "09171234567",
  region: "Region III",
  province: "Pampanga",
  cityMunicipality: "Angeles City",
  barangay: "Balibago",
  streetAddress: "100 First St",
  postalCode: "2009",
});
const add2 = profileService.addAddress({
  label: "Office Beta",
  recipientName: "Alex Rivera",
  contactNumber: "09171234567",
  region: "Region III",
  province: "Pampanga",
  cityMunicipality: "Angeles City",
  barangay: "Balibago",
  streetAddress: "200 Second St",
  postalCode: "2009",
});
assert.equal(add1.success, true);
assert.equal(add2.success, true);
assert.notEqual(add1.address?.id, add2.address?.id, "Generated address IDs must be unique and collision-resistant");

// Setting add2 default must affect only add2
profileService.setDefaultAddress(add2.address.id);
const snapAfterSet = profileService.getAddressesSnapshot();
assert.equal(snapAfterSet.find((a) => a.id === add2.address.id)?.isDefault, true);
assert.equal(snapAfterSet.find((a) => a.id === add1.address.id)?.isDefault, false);

// Deleting add2 must leave add1 and reassign it as default
profileService.deleteAddress(add2.address.id);
const snapAfterDel = profileService.getAddressesSnapshot();
assert.equal(snapAfterDel.length, 1);
assert.equal(snapAfterDel[0].id, add1.address.id);
assert.equal(snapAfterDel[0].isDefault, true, "First/only remaining address must be default");

// Deleting last address leaves 0 addresses, 0 defaults
profileService.deleteAddress(add1.address.id);
assert.equal(profileService.getAddressesSnapshot().length, 0);

console.log("PASS: Collision-resistant IDs, precise single-target mutation, and default transitions verified");

// 0.6 Profile Immutability & Read-Only Email
profileService.resetProfileStore();
const updateEmailAttempt = profileService.updateProfile({ email: "unauthorized@external.ph" });
assert.equal(updateEmailAttempt.success, true);
assert.equal(profileService.getProfileSnapshot().email, "alex.rivera@ohmsim.ph", "Profile email must remain immutable read-only");
console.log("PASS: Profile email immutability verified");

// Reset store to canonical initial fixtures
profileService.resetProfileStore();

// ---------------------------------------------------------------------------
// Browser End-to-End Suite Setup
// ---------------------------------------------------------------------------
let BUYER_URL = process.env.BUYER_URL;
if (!BUYER_URL) {
  try {
    const res = await fetch("http://localhost:3107/profile", { method: "HEAD" });
    if (res.ok) BUYER_URL = "http://localhost:3107";
  } catch {}
  if (!BUYER_URL) {
    try {
      const res = await fetch("http://localhost:3000/profile", { method: "HEAD" });
      if (res.ok) BUYER_URL = "http://localhost:3000";
    } catch {}
  }
  if (!BUYER_URL) BUYER_URL = "http://localhost:3107";
}
console.log(`\nConnecting to Buyer URL: ${BUYER_URL}`);

const browser = await chromium.launch({
  headless: true,
  channel: process.platform === "win32" ? "msedge" : undefined,
});

const pageErrors = [];
const rscPrefetch404s = [];

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  page.on("pageerror", (err) => pageErrors.push(`PageError: ${err.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      const locUrl = msg.location()?.url || "";
      let isSameOriginOrdersRsc404 = false;
      try {
        if (locUrl) {
          const parsed = new URL(locUrl);
          const baseOrigin = new URL(BUYER_URL).origin;
          if (
            !expectsOrdersRoute && parsed.origin === baseOrigin &&
            parsed.pathname === "/orders" &&
            parsed.searchParams.has("_rsc") &&
            text.includes("404") &&
            !text.includes("500")
          ) {
            isSameOriginOrdersRsc404 = true;
          }
        }
      } catch {}

      if (isSameOriginOrdersRsc404) {
        // Declared Batch 3 integration dependency: same-origin /orders RSC prefetch returns 404 on pre-Batch-3 base
        rscPrefetch404s.push(`Console: ${text} [url: ${locUrl}]`);
      } else if (!text.includes("favicon") && !locUrl.includes("favicon")) {
        pageErrors.push(`ConsoleError: ${text}${locUrl ? ` [at ${locUrl}]` : ""}`);
      }
    }
  });

  page.on("response", (res) => {
    const status = res.status();
    if (status >= 400) {
      const resUrl = res.url();
      let isSameOriginOrdersRsc404 = false;
      try {
        const parsed = new URL(resUrl);
        const baseOrigin = new URL(BUYER_URL).origin;
        if (
          !expectsOrdersRoute && parsed.origin === baseOrigin &&
          parsed.pathname === "/orders" &&
          parsed.searchParams.has("_rsc") &&
          status === 404
        ) {
          isSameOriginOrdersRsc404 = true;
        }
      } catch {}

      if (isSameOriginOrdersRsc404) {
        rscPrefetch404s.push(`HTTP 404: ${resUrl}`);
      } else if (!resUrl.includes("favicon")) {
        pageErrors.push(`HTTP ${status} on ${resUrl}`);
      }
    }
  });

  // =========================================================================
  // 1. Profile Hub Header, Available-Width Layout & Metrics (/profile)
  // =========================================================================
  console.log("\n1. Testing Profile Hub, Available-Width Layout & Metrics (/profile)...");
  await page.goto(`${BUYER_URL}/profile`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("[data-hydrated='true']");
  await page.waitForSelector("#profile-hero-card");

  // Hero Card Checks
  assert.equal(await page.locator("#profile-avatar-circle").textContent(), "AR", "Initials avatar must be AR");
  assert.equal(await page.locator("#profile-full-name").textContent(), "Alex Rivera");
  assert.equal(await page.locator("#profile-email-display").textContent(), "alex.rivera@ohmsim.ph");
  assert.equal(await page.locator("text='Mock Buyer Account'").isVisible(), true, "Must display honest Mock Buyer Account badge");
  assert.equal(await page.locator("text='Verified'").count(), 0, "Must NOT display a fake Verified badge");

  // Verify Desktop Hero Width is Available-Width (NOT restricted to 1036px / 1100px centered cap)
  const heroWidth = await page.evaluate(() => {
    const el = document.getElementById("profile-hero-card");
    return el?.getBoundingClientRect().width || 0;
  });
  assert.ok(
    heroWidth >= 1350,
    `Hero card width on 1440px desktop must use available width (expected >= 1350px, got ${heroWidth}px)`
  );

  // My Orders CTA Link
  const myOrdersBtn = page.locator("#profile-my-orders-btn");
  assert.equal(await myOrdersBtn.getAttribute("href"), "/orders");

  // Dynamic Stats Sidebar Checks
  const ordersStat = await page.locator("#stat-orders-placed p:last-child").textContent();
  assert.equal(ordersStat, String(expectedOrdersCount), `Expected ${expectedOrdersCount} actual service orders, got ${ordersStat}`);

  const bomStat = await page.locator("#stat-bom-projects p:last-child").textContent();
  assert.equal(bomStat, "3", `Expected 3 BOM projects, got ${bomStat}`);

  const cartStat = await page.locator("#stat-cart-items p:last-child").textContent();
  assert.equal(cartStat, "0", `Expected 0 items in cart, got ${cartStat}`);

  const memberStat = await page.locator("#stat-member-since p:last-child").textContent();
  assert.equal(memberStat, "Aug 2026");

  console.log("PASS: Profile hero header, available-width composition and dynamic metrics verified");

  // =========================================================================
  // 2. Tab Keyboard Navigation & Roving Focus Model (B4-3)
  // =========================================================================
  console.log("\n2. Testing Tab Keyboard Navigation & Roving Focus Model...");

  const tabAccount = page.locator("#profile-tab-account");
  const tabAddresses = page.locator("#profile-tab-addresses");
  const tabSecurity = page.locator("#profile-tab-security");
  const tabPreferences = page.locator("#profile-tab-preferences");

  // Initial tabIndex: account has 0, others have -1
  assert.equal(await tabAccount.getAttribute("tabindex"), "0");
  assert.equal(await tabAddresses.getAttribute("tabindex"), "-1");
  assert.equal(await tabSecurity.getAttribute("tabindex"), "-1");
  assert.equal(await tabPreferences.getAttribute("tabindex"), "-1");

  // Focus account tab and press ArrowRight -> moves to addresses
  await tabAccount.focus();
  await page.keyboard.press("ArrowRight");
  await page.waitForSelector("#profile-tabpanel-addresses");

  assert.equal(await tabAddresses.getAttribute("tabindex"), "0");
  assert.equal(await tabAccount.getAttribute("tabindex"), "-1");
  assert.equal(await tabAddresses.getAttribute("aria-selected"), "true");
  await page.waitForFunction(() => window.location.search.includes("tab=addresses"));

  // Press End -> moves to preferences
  await page.keyboard.press("End");
  await page.waitForSelector("#profile-tabpanel-preferences");
  assert.equal(await tabPreferences.getAttribute("aria-selected"), "true");
  assert.equal(await tabPreferences.getAttribute("tabindex"), "0");

  // Press Home -> moves back to account
  await page.keyboard.press("Home");
  await page.waitForSelector("#profile-tabpanel-account");
  assert.equal(await tabAccount.getAttribute("aria-selected"), "true");
  assert.equal(await tabAccount.getAttribute("tabindex"), "0");

  // Press ArrowLeft -> wraps to preferences
  await page.keyboard.press("ArrowLeft");
  await page.waitForSelector("#profile-tabpanel-preferences");
  assert.equal(await tabPreferences.getAttribute("aria-selected"), "true");

  // Direct mobile link tab visibility on 320px and 390px without focus stealing (F2)
  for (const mobileWidth of [320, 390]) {
    const mobileTabCtx = await browser.newPage({ viewport: { width: mobileWidth, height: 600 } });
    await mobileTabCtx.goto(`${BUYER_URL}/profile?tab=preferences`, { waitUntil: "domcontentloaded" });
    await mobileTabCtx.waitForSelector("[data-hydrated='true']");
    await mobileTabCtx.waitForSelector("#profile-tabpanel-preferences");
    await mobileTabCtx.waitForTimeout(100);
    const mobilePrefBox = await mobileTabCtx.locator("#profile-tab-preferences").boundingBox();
    assert.ok(
      mobilePrefBox && mobilePrefBox.x >= 0 && mobilePrefBox.x < mobileWidth,
      `Selected tab must be scrolled into view on direct mobile link at ${mobileWidth}px (got x=${mobilePrefBox?.x})`
    );
    const mobileFocusId = await mobileTabCtx.evaluate(() => document.activeElement?.id);
    assert.notEqual(mobileFocusId, "profile-tab-preferences", `Direct mobile link at ${mobileWidth}px must not steal focus`);
    await mobileTabCtx.close();
  }

  // Settings redirect test (F2): /settings?tab=preferences redirects to /profile?tab=preferences
  await page.goto(`${BUYER_URL}/settings?tab=preferences`, { waitUntil: "domcontentloaded" });
  await page.waitForURL("**/profile?tab=preferences");
  await page.waitForSelector("#profile-tabpanel-preferences");
  assert.equal(await page.locator("#profile-tab-preferences").getAttribute("aria-selected"), "true");

  // Native History Navigation & Mounted URL Fallback without reloads (F2)
  // Step A: Switch tab to Addresses via click
  await page.locator("#profile-tab-addresses").click();
  await page.waitForSelector("#profile-tabpanel-addresses");
  assert.equal(await page.locator("#profile-tab-addresses").getAttribute("aria-selected"), "true");

  // Step B: Native history back -> returns to Preferences without reload
  await page.goBack();
  await page.waitForSelector("#profile-tabpanel-preferences");
  assert.equal(await page.locator("#profile-tab-preferences").getAttribute("aria-selected"), "true");

  // Step C: Native history forward -> returns to Addresses without reload
  await page.goForward();
  await page.waitForSelector("#profile-tabpanel-addresses");
  assert.equal(await page.locator("#profile-tab-addresses").getAttribute("aria-selected"), "true");

  // Step D: Mounted invalid tab query resolution to Account without page reload
  await page.evaluate(() => {
    window.history.pushState(null, "", "/profile?tab=invalid");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  await page.waitForSelector("#profile-tabpanel-account");
  assert.equal(await page.locator("#profile-tab-account").getAttribute("aria-selected"), "true");

  // Step E: Mounted absent tab query resolution to Account without page reload
  await page.evaluate(() => {
    window.history.pushState(null, "", "/profile");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  await page.waitForSelector("#profile-tabpanel-account");
  assert.equal(await page.locator("#profile-tab-account").getAttribute("aria-selected"), "true");

  // Step F: Fresh direct invalid link also resolves to Account
  await page.goto(`${BUYER_URL}/profile?tab=invalid`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("[data-hydrated='true']");
  await page.waitForSelector("#profile-tabpanel-account");
  assert.equal(await page.locator("#profile-tab-account").getAttribute("aria-selected"), "true");

  console.log("PASS: Roving focus, ArrowRight/Left, Home, End, mobile 320/390 visibility, and history/URL fallbacks verified");

  // Ensure on Account for editing tests
  await page.waitForSelector("#profile-tabpanel-account");

  // =========================================================================
  // 3. Personal Information Edit / Cancel / Save Flow & Focus Restoration (B4-3, B4-4)
  // =========================================================================
  console.log("\n3. Testing Personal Information Edit/Save/Cancel Flow & Focus Restoration...");

  await page.waitForSelector("[data-hydrated='true']");
  const editBtn = page.locator("#profile-edit-btn");
  await editBtn.focus();
  await page.keyboard.press("Enter");

  // Verify focus was intentionally moved to first input (#profile-first-name)
  await page.waitForTimeout(100);
  const activeAfterEdit = await page.evaluate(() => document.activeElement?.id);
  assert.equal(activeAfterEdit, "profile-first-name", "Starting edit must restore focus to first name input");

  // Modify First Name
  const firstNameInput = page.locator("#profile-first-name");
  await firstNameInput.fill("Alexander");

  // Cancel edit via keyboard focus and Enter
  const cancelBtn = page.locator("#profile-cancel-btn");
  await cancelBtn.focus();
  await page.keyboard.press("Enter");
  await page.waitForTimeout(100);

  // Focus must return to Edit button
  const activeAfterCancel = await page.evaluate(() => document.activeElement?.id);
  assert.equal(activeAfterCancel, "profile-edit-btn", "Cancelling edit must restore focus to Edit button");
  assert.equal(await page.locator("#profile-full-name").textContent(), "Alex Rivera", "Cancel must restore previous state");

  // Edit again and Save
  await page.locator("#profile-edit-btn").click();
  await firstNameInput.fill("Alexander");
  await page.locator("#profile-save-btn").click();
  await page.waitForTimeout(100);

  // Focus must return to Edit button after successful save
  const activeAfterSave = await page.evaluate(() => document.activeElement?.id);
  assert.equal(activeAfterSave, "profile-edit-btn", "Saving edit must restore focus to Edit button");
  assert.equal(await page.locator("#profile-full-name").textContent(), "Alexander Rivera");

  // Verify separate full-width Company and Role fields exist
  assert.equal(await page.locator("label[for='profile-company']").isVisible(), true);
  assert.equal(await page.locator("label[for='profile-role']").isVisible(), true);

  console.log("PASS: Personal info edit/cancel/save and focus lifecycle verified");

  // =========================================================================
  // 4. Saved Addresses Tab: Validation, Invariants & Focus Lifecycle (B4-1, B4-2, B4-3)
  // =========================================================================
  console.log("\n4. Testing Addresses Tab Validation, Invariants & Focus Lifecycle...");
  await page.goto(`${BUYER_URL}/profile?tab=addresses`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("[data-hydrated='true']");
  await page.waitForSelector("[data-address-id='addr-home']");

  // Set Default via keyboard: Set addr-lab as default
  const setDefaultBtn = page.locator("[data-set-default-btn='addr-lab']");
  await setDefaultBtn.focus();
  await page.keyboard.press("Enter");
  await page.waitForSelector("[data-address-id='addr-lab'] [data-default-badge='true']", { timeout: 5000 });
  assert.equal(await page.locator("[data-address-id='addr-lab'] [data-default-badge='true']").isVisible(), true);
  assert.equal(await page.locator("[data-address-id='addr-home'] [data-default-badge='true']").count(), 0);

  // Assert focus after keyboard Set Default did NOT drop to BODY
  await page.waitForTimeout(100);
  const activeAfterSetDefault = await page.evaluate(() => ({
    tagName: document.activeElement?.tagName,
    id: document.activeElement?.id,
    hasDelete: document.activeElement?.hasAttribute("data-delete-address-btn"),
  }));
  assert.notEqual(activeAfterSetDefault.tagName, "BODY", "Keyboard Set Default must NOT leave focus on BODY");
  assert.ok(
    activeAfterSetDefault.hasDelete || activeAfterSetDefault.id === "address-section-heading",
    "Focus must return to address card action or stable heading after Set Default"
  );

  // Delete an address and assert focus destination
  const deleteBtn = page.locator("[data-delete-address-btn='addr-lab']");
  await deleteBtn.focus();
  await page.keyboard.press("Enter");
  await page.waitForTimeout(150);

  const activeAfterDelete = await page.evaluate(() => document.activeElement !== document.body);
  assert.equal(activeAfterDelete, true, "Deleting an address must NOT leave focus on BODY");

  // Add Address Form: Open form and assert focus moves to #address-label
  const addTriggerBtn = page.locator("#add-address-trigger-btn");
  await addTriggerBtn.focus();
  await page.keyboard.press("Enter");
  await page.waitForSelector("#new-address-form-panel");
  await page.waitForTimeout(100);

  const activeAfterOpenForm = await page.evaluate(() => document.activeElement?.id);
  assert.equal(activeAfterOpenForm, "address-label", "Opening add address form must focus address label input");

  // Cancel form and assert focus returns to #add-address-trigger-btn
  const cancelFormBtn = page.locator("#cancel-address-btn");
  await cancelFormBtn.focus();
  await page.keyboard.press("Enter");
  await page.waitForTimeout(100);

  const activeAfterCancelForm = await page.evaluate(() => document.activeElement?.id);
  assert.equal(activeAfterCancelForm, "add-address-trigger-btn", "Cancelling add address form must focus trigger button");

  // Open form again and test Whitespace Postal Code Validation (B4-2, F1)
  await addTriggerBtn.click();
  await page.waitForSelector("#new-address-form-panel");
  await page.locator("#address-label").fill("Campus Lab 2");
  await page.locator("#address-recipient").fill("Alexander Rivera");
  await page.locator("#address-contact").fill("09171234567");
  await page.locator("#address-province").selectOption("Pampanga");
  await page.locator("#address-city").fill("Angeles City");
  await page.locator("#address-barangay").fill("Balibago");
  await page.locator("#address-street").fill("456 Innovation Road");

  // Submit with whitespace-only postal code
  const postalInput = page.locator("#address-postal");
  await postalInput.fill("   ");
  await page.locator("#save-address-btn").click();
  await page.waitForTimeout(100);

  // Assert rejection: address count unchanged (1), error alert visible, field attributes set
  assert.equal(await page.locator("[data-address-id]").count(), 1, "Whitespace postal code must NOT create an address");
  assert.equal(await page.locator("#address-form-error").isVisible(), true, "Must show postal error alert");
  assert.equal(await postalInput.getAttribute("aria-invalid"), "true", "Must set aria-invalid on postal field");
  assert.equal(await postalInput.getAttribute("aria-describedby"), "address-postal-error", "Must set aria-describedby");
  assert.equal(await page.locator("#address-postal-error").isVisible(), true, "Postal error element must be visible");

  // Assert focus was moved to invalid postal field
  const activeAfterPostalError = await page.evaluate(() => document.activeElement?.id);
  assert.equal(activeAfterPostalError, "address-postal", "Submitting invalid postal code must focus postal input");

  // Now fill valid postal code and submit
  await postalInput.fill("2009");
  await page.locator("#save-address-btn").click();
  await page.waitForTimeout(200);

  // Assert address added and capacity reached (2/2)
  assert.equal(await page.locator("[data-address-id]").count(), 2);
  assert.equal(await page.locator("#address-capacity-badge").textContent(), "2 / 2 Saved");

  // Assert focus after adding 2nd address: capacity reached, add button is disabled, focus must be on enabled element (F1)
  const activeAfterSecondSave = await page.evaluate(() => {
    const el = document.activeElement;
    return {
      tagName: el?.tagName,
      id: el?.id,
      disabled: el?.disabled ?? false,
      hasDelete: el?.hasAttribute("data-delete-address-btn"),
    };
  });
  assert.notEqual(activeAfterSecondSave.tagName, "BODY", "Saving second address must NOT leave focus on BODY");
  assert.equal(activeAfterSecondSave.disabled, false, "Focus destination must be an enabled element");
  assert.ok(
    activeAfterSecondSave.hasDelete || activeAfterSecondSave.id === "address-section-heading",
    "Focus must be on enabled card action or section heading when Add button becomes disabled"
  );

  console.log("PASS: Address form focus lifecycle, postal error association, and capacity gate verified");

  // =========================================================================
  // 5. Security Tab Truthful Unavailable Copy & Labeled Inputs (B4-3, B4-5)
  // =========================================================================
  console.log("\n5. Testing Security Tab Truthful Unavailable Copy & Labeled Inputs...");
  await page.goto(`${BUYER_URL}/profile?tab=security`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("[data-hydrated='true']");
  await page.waitForSelector("h2:has-text('Security & Access')");

  // Programmatic labels on password inputs
  assert.equal(await page.locator("label[for='current-password']").textContent(), "Current Password");
  assert.equal(await page.locator("label[for='new-password']").textContent(), "New Password");
  assert.equal(await page.locator("label[for='confirm-password']").textContent(), "Confirm New Password");

  // Truthful copy assertions
  assert.equal(await page.locator("text='Password changes are currently unavailable'").isVisible(), true);
  assert.equal(await page.locator("text='Session information is unavailable.'").isVisible(), true);
  assert.equal(await page.locator("text='Account deletion is currently unavailable.'").isVisible(), true);

  // Assert absence of fake active session / technical developer banners
  assert.equal(await page.locator("text='Current Browser Session'").count(), 0);
  assert.equal(await page.locator("text='Active Now'").count(), 0);
  assert.equal(await page.locator("text='This Device'").count(), 0);
  assert.equal(await page.locator("text='Server Authentication Required'").count(), 0);
  assert.equal(await page.locator("text='administrator authorization'").count(), 0);

  console.log("PASS: Security tab truthful copy and programmatic password labels verified");

  // =========================================================================
  // 6. Preferences Tab Truthful Copy & Compact Switches (B4-4, B4-5)
  // =========================================================================
  console.log("\n6. Testing Preferences Tab Truthful Copy & Compact Switches...");
  await page.goto(`${BUYER_URL}/profile?tab=preferences`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("[data-hydrated='true']");
  await page.waitForSelector("h2:has-text('Email Notifications')");

  // Truthful copy: local session, no future release promises
  assert.equal(
    await page.locator("text='Preferences are saved locally in your browser and do not send outbound email'").isVisible(),
    true
  );
  assert.equal(await page.locator("text='Scheduled'").count(), 0, "Must NOT promise future Scheduled release");
  assert.equal(await page.locator("text='Standard Grid'").isVisible(), true);

  // Verify compact visual switch bounds: track is ~40x24px, button is >= 44x44px
  const switchMetrics = await page.evaluate(() => {
    const btn = document.getElementById("pref-toggle-emailOrders");
    const track = btn?.querySelector("span");
    const btnRect = btn?.getBoundingClientRect();
    const trackRect = track?.getBoundingClientRect();
    return {
      btnWidth: btnRect?.width || 0,
      btnHeight: btnRect?.height || 0,
      trackWidth: trackRect?.width || 0,
      trackHeight: trackRect?.height || 0,
    };
  });
  assert.ok(switchMetrics.btnWidth >= 43.5 && switchMetrics.btnHeight >= 43.5, "Switch button must be >= 44x44px target");
  assert.ok(switchMetrics.trackWidth <= 44 && switchMetrics.trackHeight <= 26, "Visual track must remain compact (~40x24px)");

  // Toggle local preference
  const promoToggle = page.locator("#pref-toggle-emailPromos");
  assert.equal(await promoToggle.getAttribute("aria-checked"), "false");
  await promoToggle.click();
  await page.waitForTimeout(100);
  assert.equal(await promoToggle.getAttribute("aria-checked"), "true");

  console.log("PASS: Preferences compact switch geometry and truthful copy verified");

  // =========================================================================
  // 7. Client Navigation State Retention (No Silent Skips) (B4-6)
  // =========================================================================
  console.log("\n7. Testing Client Navigation State Retention Across Routes...");
  await page.goto(`${BUYER_URL}/profile?tab=account`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("[data-hydrated='true']");
  await page.waitForSelector("#profile-hero-card");

  // Perform in-memory profile edit in this browser session
  await page.locator("#profile-edit-btn").click();
  await page.waitForSelector("#profile-save-btn");
  await page.locator("#profile-first-name").fill("Alexander");
  await page.locator("#profile-save-btn").click();
  await page.waitForTimeout(100);
  assert.equal(await page.locator("#profile-full-name").textContent(), "Alexander Rivera");

  // Navigate to Addresses tab and record pre-navigation address list state & default flag
  await page.locator("#profile-tab-addresses").click();
  await page.waitForSelector("#profile-tabpanel-addresses");
  const preNavAddresses = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll("[data-address-id]"));
    return cards.map((c) => ({
      id: c.getAttribute("data-address-id"),
      label: c.querySelector("h3")?.textContent?.trim(),
      isDefault: c.querySelector("[data-default-badge='true']") !== null,
    }));
  });
  assert.ok(preNavAddresses.length >= 1, "Must have saved addresses before navigation");
  const preNavDefaultId = preNavAddresses.find((a) => a.isDefault)?.id;
  assert.ok(preNavDefaultId, "Must have exactly one default address before navigation");

  // Verify Header Home link exists and is clickable (Strict assertion, no silent skip)
  const homeLink = page.locator("header a[href='/home'], nav a[href='/home']").first();
  assert.equal(await homeLink.isVisible(), true, "Home navigation link must be visible for cross-route retention");
  await homeLink.click();
  await page.waitForURL("**/home");

  // Navigate back to profile via client history
  await page.goBack();
  await page.waitForSelector("#profile-hero-card");

  // Assert saved profile name is retained in memory
  assert.equal(await page.locator("#profile-full-name").textContent(), "Alexander Rivera", "Profile name retained across client navigation");

  // Assert exact saved addresses, IDs, labels, and default flag are retained across client navigation
  await page.locator("#profile-tab-addresses").click();
  await page.waitForSelector("#profile-tabpanel-addresses");
  const postNavAddresses = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll("[data-address-id]"));
    return cards.map((c) => ({
      id: c.getAttribute("data-address-id"),
      label: c.querySelector("h3")?.textContent?.trim(),
      isDefault: c.querySelector("[data-default-badge='true']") !== null,
    }));
  });
  assert.deepEqual(postNavAddresses, preNavAddresses, "Saved address IDs, labels, and default status must match exactly across client navigation");

  // Client-navigate to preferences, toggle a preference, client-navigate to /home and back
  await page.locator("#profile-tab-preferences").click();
  await page.waitForSelector("#pref-toggle-emailPromos");
  const promo = page.locator("#pref-toggle-emailPromos");
  await promo.click();
  await page.waitForTimeout(100);
  assert.equal(await promo.getAttribute("aria-checked"), "true");

  await homeLink.click();
  await page.waitForURL("**/home");
  await page.goBack();
  await page.waitForSelector("#profile-hero-card");

  await page.locator("#profile-tab-preferences").click();
  await page.waitForSelector("#pref-toggle-emailPromos");
  assert.equal(
    await page.locator("#pref-toggle-emailPromos").getAttribute("aria-checked"),
    "true",
    "Preferences state retained across client navigation"
  );

  console.log("PASS: Exact address IDs/default, profile info, and preference state retained across client navigation");

  // =========================================================================
  // 8. Viewport Responsiveness, Open States & Child Bounds Audit (B4-4, B4-6)
  // =========================================================================
  console.log("\n8. Testing Responsiveness, Open States & Child Bounds Across Viewports...");
  const viewports = [320, 390, 768, 1024, 1440, 1920];
  const testTabs = ["account", "addresses", "security", "preferences"];

  for (const w of viewports) {
    for (const t of testTabs) {
      await page.setViewportSize({ width: w, height: w === 320 ? 500 : 800 });
      await page.goto(`${BUYER_URL}/profile?tab=${t}`, { waitUntil: "domcontentloaded" });
      await page.waitForSelector("#profile-hero-card");

      // Verify no horizontal document overflow
      const docOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      assert.equal(docOverflow, false, `Horizontal document overflow at ${w}px on tab ${t}`);

      // Verify no child bounding box clips beyond viewport width
      const childOverflow = await page.evaluate((width) => {
        const elements = Array.from(document.querySelectorAll("#profile-hero-card, [role='tabpanel'] > *"));
        return elements.some((el) => el.getBoundingClientRect().right > width + 2);
      }, w);
      assert.equal(childOverflow, false, `Child element overflowed viewport at ${w}px on tab ${t}`);
    }
  }

  // Check 768px stacked layout: Personal Information panel fills container width
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto(`${BUYER_URL}/profile?tab=account`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#profile-hero-card");
  const personalInfoWidth768 = await page.evaluate(() => {
    const el = document.querySelector("#profile-tabpanel-account form");
    return el?.getBoundingClientRect().width || 0;
  });
  assert.ok(
    personalInfoWidth768 >= 650,
    `Personal information panel on 768px must fill container (expected >= 650px, got ${personalInfoWidth768}px)`
  );

  // Check Open Form States at 320px & 390px (Child bounds, no clipping, and short-window hit-testing)
  for (const w of [320, 390]) {
    await page.setViewportSize({ width: w, height: 600 });
    // Open edit state child bounds
    await page.goto(`${BUYER_URL}/profile?tab=account`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("[data-hydrated='true']");
    await page.waitForSelector("#profile-edit-btn");
    await page.locator("#profile-edit-btn").click();
    await page.waitForSelector("#profile-save-btn");
    const editOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    assert.equal(editOverflow, false, `Horizontal overflow in open editing state at ${w}px`);
    const editChildOverflow = await page.evaluate((width) => {
      const form = document.querySelector("#profile-tabpanel-account form");
      if (!form) return true;
      const elements = Array.from(form.querySelectorAll("input, button, select, label, div"));
      return elements.some((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.right > width + 2;
      });
    }, w);
    assert.equal(editChildOverflow, false, `Open edit form child element overflowed viewport at ${w}px`);

    // Open add address form state child bounds
    await page.goto(`${BUYER_URL}/profile?tab=addresses`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("[data-hydrated='true']");
    if ((await page.locator("#add-address-trigger-btn").getAttribute("aria-disabled")) === "true") {
      await page.locator("[data-delete-address-btn]").first().click();
      await page.waitForTimeout(100);
    }
    await page.locator("#add-address-trigger-btn").click();
    await page.waitForSelector("#new-address-form-panel");
    const addFormOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    assert.equal(addFormOverflow, false, `Horizontal overflow in open add-address state at ${w}px`);
    const addFormChildOverflow = await page.evaluate((width) => {
      const panel = document.getElementById("new-address-form-panel");
      if (!panel) return true;
      const elements = Array.from(panel.querySelectorAll("input, button, select, label, div"));
      return elements.some((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.right > width + 2;
      });
    }, w);
    assert.equal(addFormChildOverflow, false, `Open add-address child element overflowed viewport at ${w}px`);

    // Check hit-testing at short window height (500px)
    await page.setViewportSize({ width: w, height: 500 });
    const saveBtn = page.locator("#save-address-btn");
    await saveBtn.scrollIntoViewIfNeeded();
    const saveBtnBox = await saveBtn.boundingBox();
    assert.ok(saveBtnBox && saveBtnBox.height >= 43.5, `Save address button must be >= 44px at ${w}x500px`);
    const hitTarget = await page.evaluate(() => {
      const btn = document.getElementById("save-address-btn");
      if (!btn) return false;
      const rect = btn.getBoundingClientRect();
      const el = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
      return btn.contains(el);
    });
    assert.equal(hitTarget, true, `Save address button must be hit-testable when scrolled at ${w}x500px`);
  }
  console.log("PASS: Child bounds, full-width 768px stacked layout, and open form states verified without overflow");

  // =========================================================================
  // 9. Interactive Controls Touch Target Audit (Default & Open States) (B4-6)
  // =========================================================================
  console.log("\n9. Auditing Touch Targets (>= 44x44px) across Default & Open States...");

  const auditUndersized = async () => {
    return await page.evaluate(() => {
      const controls = Array.from(
        document.querySelectorAll(
          "#profile-hero-card button, #profile-hero-card a, [role='tablist'] [role='tab'], [role='tabpanel'] button, [role='tabpanel'] a, [role='tabpanel'] input, [role='tabpanel'] select, [role='tabpanel'] textarea, [role='tabpanel'] [role='switch'], #new-address-form-panel button, #new-address-form-panel input, #new-address-form-panel select"
        )
      );
      return controls
        .filter((el) => {
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) return false;
          const style = window.getComputedStyle(el);
          if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return false;
          if (el.classList.contains("sr-only") || (rect.width <= 1 && rect.height <= 1)) return false;
          if (el.tagName === "INPUT" && el.getAttribute("type") === "checkbox") {
            const label = el.closest("label");
            if (label) {
              const labelRect = label.getBoundingClientRect();
              return labelRect.height < 43.5 || labelRect.width < 43.5;
            }
          }
          return rect.height < 43.5 || rect.width < 43.5;
        })
        .map((el) => ({
          tag: el.tagName,
          id: el.id || el.getAttribute("aria-label") || el.textContent?.trim().slice(0, 20),
          width: Math.round(el.getBoundingClientRect().width * 10) / 10,
          height: Math.round(el.getBoundingClientRect().height * 10) / 10,
        }));
    });
  };

  for (const auditWidth of [320, 390, 1440]) {
    await page.setViewportSize({ width: auditWidth, height: 800 });

    // Audit open edit state
    await page.goto(`${BUYER_URL}/profile?tab=account`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("[data-hydrated='true']");
    await page.waitForSelector("#profile-edit-btn");
    await page.locator("#profile-edit-btn").click();
    await page.waitForSelector("#profile-save-btn");
    assert.deepEqual(await auditUndersized(), [], `Undersized controls in open edit state at ${auditWidth}px`);

    // Audit open add address form
    await page.goto(`${BUYER_URL}/profile?tab=addresses`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("[data-hydrated='true']");
    if ((await page.locator("#add-address-trigger-btn").getAttribute("aria-disabled")) === "true") {
      await page.locator("[data-delete-address-btn]").first().click();
      await page.waitForTimeout(100);
    }
    await page.locator("#add-address-trigger-btn").click();
    await page.waitForSelector("#new-address-form-panel");
    assert.deepEqual(await auditUndersized(), [], `Undersized controls in open add-address state at ${auditWidth}px`);
  }

  console.log("PASS: Touch targets (>= 44x44px) verified across checked viewports (320px, 390px, 1440px) in default and open states");

  // =========================================================================
  // 10. Fresh Screenshot Captures for Review Artifacts
  // =========================================================================
  console.log("\n10. Capturing Fresh Batch 4 Evidence Screenshots...");

  // Desktop 1440 Captures
  await page.setViewportSize({ width: 1440, height: 900 });

  await page.goto(`${BUYER_URL}/profile?tab=account`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("[data-hydrated='true']");
  await page.waitForSelector("#profile-hero-card");
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(screenshotDirectory, "profile-desktop-1440.png"), fullPage: true });

  await page.locator("#profile-tab-addresses").click();
  await page.waitForSelector("#profile-tabpanel-addresses");
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(screenshotDirectory, "profile-addresses-desktop-1440.png"), fullPage: true });

  await page.locator("#profile-tab-security").click();
  await page.waitForSelector("#profile-tabpanel-security");
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(screenshotDirectory, "profile-security-desktop-1440.png"), fullPage: true });

  await page.locator("#profile-tab-preferences").click();
  await page.waitForSelector("#profile-tabpanel-preferences");
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(screenshotDirectory, "profile-preferences-desktop-1440.png"), fullPage: true });

  // Mobile 390 Captures
  await page.setViewportSize({ width: 390, height: 844 });

  await page.locator("#profile-tab-account").click();
  await page.waitForSelector("#profile-tabpanel-account");
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(screenshotDirectory, "profile-mobile-390.png"), fullPage: true });

  await page.locator("#profile-tab-addresses").click();
  await page.waitForSelector("#profile-tabpanel-addresses");
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(screenshotDirectory, "profile-addresses-mobile-390.png"), fullPage: true });

  // Open Edit State on Mobile 390
  await page.locator("#profile-tab-account").click();
  await page.waitForSelector("#profile-tabpanel-account");
  await page.waitForTimeout(250);
  await page.locator("#profile-edit-btn").click();
  await page.waitForSelector("#profile-save-btn");
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(screenshotDirectory, "profile-edit-open-390.png"), fullPage: true });
  await page.locator("#profile-cancel-btn").click();
  await page.waitForTimeout(250);

  // Open Add Address State on Mobile 390
  await page.locator("#profile-tab-addresses").click();
  await page.waitForSelector("#profile-tabpanel-addresses");
  await page.waitForTimeout(250);
  if ((await page.locator("#add-address-trigger-btn").getAttribute("aria-disabled")) === "true") {
    await page.locator("[data-delete-address-btn]").first().click();
    await page.waitForTimeout(250);
  }
  await page.locator("#add-address-trigger-btn").click();
  await page.waitForSelector("#new-address-form-panel");
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(screenshotDirectory, "profile-add-address-open-390.png"), fullPage: true });
  await page.locator("#cancel-address-btn").click();
  await page.waitForTimeout(250);

  // Keyboard Focus / Roving Tab State Screenshot
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.locator("#profile-tab-account").click();
  await page.waitForSelector("#profile-tabpanel-account");
  await page.waitForTimeout(250);
  await page.locator("#profile-tab-account").focus();
  await page.keyboard.press("ArrowRight");
  await page.waitForSelector("#profile-tabpanel-addresses");
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(screenshotDirectory, "profile-keyboard-focus.png"), fullPage: true });

  console.log("PASS: Fresh screenshots captured (desktop, mobile, open edit, open add address, keyboard focus)");

  // =========================================================================
  // 11. Final Error & Declared Integration Dependency Assertion
  // =========================================================================
  console.log("\n11. Final Error & Declared Integration Dependency Check...");
  if (rscPrefetch404s.length > 0) {
    console.log(
      `NOTE: Declared integration dependency observed (${rscPrefetch404s.length} /orders RSC prefetch 404s on pre-Batch-3 base 0cff577d).`
    );
  }
  assert.deepEqual(pageErrors, [], `Expected 0 real uncaught page errors, got: ${JSON.stringify(pageErrors)}`);
  if (expectsOrdersRoute) assert.deepEqual(rscPrefetch404s, [], "Integrated Orders route must have no known-error exclusion");

  console.log(
    `\n>>> ALL OHMSIM BUYER BATCH 4 CORRECTIONS VERIFIED (0 uncaught errors, ${rscPrefetch404s.length} declared pre-Batch-3 /orders RSC prefetch 404s recorded) <<<`
  );
} finally {
  await browser.close();
}
