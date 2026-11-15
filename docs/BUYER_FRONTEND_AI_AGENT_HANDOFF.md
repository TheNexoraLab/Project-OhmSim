# OhmSim — Frontend Developer 1 (Buyer Portal) AI Agent Handoff

**Project:** OhmSim (Electronics E-Commerce PWA)  
**Organization:** NEXORA Labs  
**Target:** AI Coding Assistant (Antigravity, Cursor, Claude Code, GitHub Copilot)  
**Human Contributor:** Frontend Developer 1  
**Assigned Milestone:** FE-B01 & FE-B02: Orders Hydration Bug Fix & Buyer Checkout UI  
**Integration Branch:** `development`  
**Production Branch:** `main` *(Strictly Protected)*  
**Current Baseline Commit:** `4006d17`  

---

## Instructions for Human Frontend Developer 1

You do not need to explain the architecture or write complex prompts. **Copy the Master Prompt in Section 1 and paste it directly into your AI coding assistant (Cursor, Claude Code, Antigravity, Copilot).** It contains all context, strict boundaries, and exact execution specifications.

---

# SECTION 1: MASTER AI AGENT PROMPT
*(Copy and paste everything below into your AI Coding Agent)*

```markdown
You are assisting as Frontend Developer 1 for OhmSim by NEXORA Labs, an electronics e-commerce PWA.
You own the Buyer experience and are finishing the remaining 10% of the Buyer portal.

### 1. REPOSITORY BASELINE & WORKFLOW
- Git Repository: https://github.com/TheNexoraLab/Project-OhmSim.git
- Baseline Commit: 4006d17 (Release PR #10)
- Integration Branch: development
- Target Feature Branch: feature/buyer-checkout-and-fixes
- Framework: Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS v4.

RULES:
1. Always branch from 'development'. Never commit or open pull requests to 'main'.
2. Before concluding your task, verify with:
   npm run lint
   npx tsc --noEmit
   npm run build -- --webpack
   node tests/unit/buyer-batch3-services.mjs

### 2. STRICT SCOPE & BOUNDARIES
- OFF-LIMITS: Do not touch app/(admin)/* or components/admin/*. Those belong to Frontend Developer 2.
- OFF-LIMITS: Do not touch prisma/* or app/api/*. Those belong to the Backend Developer.
- YOUR EXCLUSIVE SCOPE:
  1. lib/format.ts (Fix Orders timezone hydration bug)
  2. app/(buyer)/checkout/page.tsx (and supporting checkout client components)
  3. Reusing existing components/ui/* and components/buyer/*

### 3. TASK 1: FIX ORDERS TIMEZONE HYDRATION BUG (FE-B01)
- File: lib/format.ts
- Issue: formatDate(isoString) currently calls toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) without an explicit timezone.
- Symptom: Server renders in UTC (e.g. Jul 30, 2026 for fixture o4 '2026-07-30T16:20:00Z'), while client browsers in Asia/Manila (UTC+8) render Jul 31, 2026, causing React Hydration Error #418 on /orders.
- Required Fix:
  Pass explicit timeZone: "Asia/Manila" in the Intl options:
  ```typescript
  export function formatDate(isoString: string): string {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "Asia/Manila",
      });
    } catch {
      return isoString;
    }
  }
  ```
  Ensure both server and browser render identically.

### 4. TASK 2: IMPLEMENT BUYER CHECKOUT UI (FE-B02)
- Route: app/(buyer)/checkout/page.tsx (and app/(buyer)/checkout/checkout-client.tsx)
- Design Tokens: Catppuccin Mocha palette (#11111B base, #1E1E2E surface, #313244 borders, #89B4FA accent).
- Existing Services to Reuse:
  - Fulfillment Fee: computeDeliveryFee(subtotal, fulfillmentType) from @/lib/fulfillment
  - Address Source: getSavedAddresses() from @/services/order-service
  - Order Creation: createMockOrder(...) from @/services/order-service
  - Formatters: formatPrice, formatDate from @/lib/format
  - Cart State: Read current items from your cart state/localStorage

- Workflow Requirements (per docs/FULFILLMENT_AND_DELIVERY_SPEC.md):
  1. Fulfillment Method Selection:
     - Toggle between 'Store / Lab Pickup' (₱0.00 fee) and 'Central Luzon Delivery' (Region III only).
     - If Delivery is selected: Delivery fee is ₱80 standard, or FREE (₱0.00) if subtotal >= ₱1,000.
  2. Address Selection (when Delivery is selected):
     - Display saved addresses from getSavedAddresses().
     - Allow selecting default address or typing a new Region III delivery address.
  3. Payment Method:
     - For Pickup: 'Pay on Pickup' (Cash / Counter payment at Campus Lab).
     - For Delivery: 'Cash on Delivery (COD)'.
     - (Rule BR-050: No online payment gateways in v1.0).
  4. Order Summary:
     - List cart items with quantity, unit price, and item total.
     - Clear breakdown: Subtotal, Shipping Fee, and Grand Total.
  5. Place Order Action:
     - Validate that an address is selected if Delivery is chosen.
     - Call createMockOrder({ items, fulfillmentType, deliveryAddress, paymentMethod, subtotal, shippingFee, totalAmount }).
     - Clear the shopping cart.
     - Redirect to /orders/[id] with visual confirmation toast.
  6. Empty State:
     - If cart is empty when visiting /checkout, display friendly message with 'Return to Catalog' button.

### 5. VERIFICATION GATE
Run the full verification suite before concluding:
1. npm run lint
2. npx tsc --noEmit
3. npm run build -- --webpack
4. node tests/unit/buyer-batch3-services.mjs
```

---

## Section 2: Expected File Changes for Dev 1

```text
project-ohmsim/
├── lib/
│   └── format.ts                       <-- Deterministic Asia/Manila date formatting (MODIFIED)
└── app/
    └── (buyer)/
        └── checkout/
            ├── page.tsx                <-- Checkout Server Page (NEW)
            └── checkout-client.tsx     <-- Interactive Checkout UI (NEW)
```

---

## Section 3: Acceptance Criteria & PR Review Checklist

- [ ] React Hydration Error #418 on `/orders` is completely eliminated across UTC and Asia/Manila timezones.
- [ ] Checkout allows switching between Store Pickup (₱0) and Region III Delivery (₱80 or ₱0 at ₱1,000+).
- [ ] Address selection connects cleanly to saved addresses.
- [ ] Placing order calls `createMockOrder()`, clears cart, and redirects to `/orders/[id]`.
- [ ] `npm run build -- --webpack` and `npm run lint` pass with 0 errors.
- [ ] PR targets `development` branch.
