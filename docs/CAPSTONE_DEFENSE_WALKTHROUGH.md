# Project OhmSim: Official Capstone Defense Demonstration & Oral Examination Guide
**NEXORA Labs • Capstone Final Defense Runbook**  
*Comprehensive 5-Minute Timed Presentation Script, Live Click-by-Click Demonstration Flow, and Technical Defense Matrix (v0.8.0)*

---

## 📑 Table of Contents
1. [Executive Summary & System Identity](#1-executive-summary--system-identity)
2. [Pre-Defense Staging & Multi-Window Setup](#2-pre-defense-staging--multi-window-setup)
3. [The 5-Minute Master Presentation Script & Storyboard](#3-the-5-minute-master-presentation-script--storyboard)
   - [Phase 1 (0:00 – 1:00): The Problem Statement & Value Proposition](#phase-1-000--100-the-problem-statement--value-proposition)
   - [Phase 2 (1:00 – 2:30): Live Buyer Journey & BOM Workbench](#phase-2-100--230-live-buyer-journey--bom-workbench)
   - [Phase 3 (2:30 – 3:30): Admin Operations, Waybills & Manifest Export](#phase-3-230--330-admin-operations-waybills--manifest-export)
   - [Phase 4 (3:30 – 4:15): Live Notification & Order Status Sync Demonstration](#phase-4-330--415-live-notification--order-status-sync-demonstration)
   - [Phase 5 (4:15 – 5:00): Cloud Architecture & Bruno Automated API Testing](#phase-5-415--500-cloud-architecture--bruno-automated-api-testing)
4. [Click-by-Click Demonstration Runbook](#4-click-by-click-demonstration-runbook)
5. [Technical Architecture Defense Matrix (Panel Q&A Anticipation)](#5-technical-architecture-defense-matrix-panel-qa-anticipation)
6. [Emergency Contingency & Fallback Playbook](#6-emergency-contingency--fallback-playbook)
7. [Academic Rubric Alignment & Defense Scorecard](#7-academic-rubric-alignment--defense-scorecard)

---

## 1. Executive Summary & System Identity

### 1.1 Project Overview
**Project OhmSim** is an enterprise-grade academic e-commerce ecosystem and interactive Bill of Materials (BOM) workbench designed specifically for engineering students, university research laboratories, and hardware makers in **Central Luzon (Region III), Philippines**.

```text
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                                   PROJECT OHMSIM                                      │
 │                                                                                        │
 │  ┌──────────────────────┐    ┌──────────────────────┐    ┌──────────────────────────┐  │
 │  │   Buyer Workbench    │    │  Admin Operations    │    │   Cloud Infrastructure   │  │
 │  │ • Interactive BOM    │    │ • Regional Dispatch  │    │ • Neon Lakebase Postgres │  │
 │  │ • Catalog Discovery  │    │ • Waybill Generation │    │ • Neon Managed Auth      │  │
 │  │ • QR Ph / Maya Pay   │    │ • CSV Manifest Export│    │ • Next.js 16 Webpack     │  │
 │  │ • Live Order Tracker │    │ • Inventory Audit    │    │ • 22 Bruno Test Suites   │  │
 │  └──────────────────────┘    └──────────────────────┘    └──────────────────────────┘  │
 └────────────────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Key Differentiators
1. **Academic Engineering Context:** Integrated Bill of Materials (BOM) cost estimator allowing students to map physical components to project schematics before placing group orders.
2. **Localized Regional Logistics (Region III):** Built specifically for Central Luzon with zero-cost campus locker pickup (Campus Electronics Lab Station) or localized flat-rate courier dispatch (Pampanga, Bulacan, Tarlac, Bataan, Nueva Ecija, Zambales, Aurora).
3. **Modern Hybrid Authentication:** Dual-engine authentication featuring institutional credentials (bcrypt + HTTP-only JWT sessions) and Google OAuth powered by Neon's Managed Better Auth SDK (`@neondatabase/auth`).
4. **Cloud-Native Resilience:** Deployed on Vercel with high-availability Lakebase Postgres on Neon, adhering to strict ACID transactional guarantees for inventory management.

---

## 2. Pre-Defense Staging & Multi-Window Setup

To deliver an uninterrupted, professional demonstration, set up your presentation screen with three distinct browser windows arranged side-by-side or across virtual desktops:

| Window / Tool | URL / Path | Role / Purpose | Credentials |
| :--- | :--- | :--- | :--- |
| **Window 1: Buyer Experience** | `http://localhost:3000` (or `https://project-ohm-sim.vercel.app`) | Student / Buyer user flow | `buyer@ohmsim.nexora.ph`<br>`BuyerPass123!` |
| **Window 2: Admin Operations** | `http://localhost:3000/admin` (Incognito Window) | Fulfillment, Waybills, Dispatch | `admin@ohmsim.nexora.ph`<br>`AdminPass123!` |
| **Window 3: Technical Validation** | **Bruno API Client** (`api/bruno`) & Neon Console | Live endpoint proof & database state | API Token / Live Database |

### Pre-Demo Checklist (T-minus 5 Minutes):
- [ ] Local server running: `npm run dev` (or check production Vercel URL).
- [ ] Database seeded with clean test fixtures: `npx prisma db seed`.
- [ ] Window 1 logged in as **Daniel Cruz (Buyer)** on `/catalog` or `/bom`.
- [ ] Window 2 logged in as **Admin Nexora** on `/admin/orders`.
- [ ] Bruno API Client open with `project-ohmsim` collection loaded and environment set to `Local` (or `Production`).
- [ ] Audio, screen resolution (1080p recommended), and presentation timer ready.

---

## 3. The 5-Minute Master Presentation Script & Storyboard

```text
 0:00 ──────── 1:00 ──────── 2:30 ──────── 3:30 ──────── 4:15 ──────── 5:00
  │  Problem &   │   Buyer Flow &  │   Admin Ops &   │   Live Sync &   │  Architecture &
  │  Value Prop  │   BOM Checkout  │   Waybill / CSV │   Push Toasts   │  Bruno API QA
```

### Phase 1 (0:00 – 1:00): The Problem Statement & Value Proposition

> **Speaker (Daniel):**
> "Good morning, respected members of the panel, our adviser, and guests. We are NEXORA Labs, and today we present **Project OhmSim**: a localized electronics commerce ecosystem and Bill of Materials workbench engineered specifically for Central Luzon's academic and maker communities.
>
> Engineering students and laboratory instructors in Region III face persistent challenges: scattered parts sourcing across Metro Manila vendors, unpredictable shipping rates, and the lack of a dedicated tool to track component costs against their capstone project schematics.
>
> OhmSim addresses this by integrating a full-fledged electronics catalog, an interactive Bill of Materials costing tool, localized Central Luzon delivery and campus pickup, real-time order tracking, and enterprise cloud architecture powered by Next.js and Neon Lakebase Postgres. Let's see it in action."

---

### Phase 2 (1:00 – 2:30): Live Buyer Journey & BOM Workbench

> **Speaker (Daniel):** *(Navigating Window 1: Buyer)*
> "As a student working on an IoT capstone, I begin on OhmSim's **Catalog**. I can filter by technical categories—Microcontrollers, Sensors, ICs, and Passive components—and inspect datasheet specifications directly.
>
> Rather than adding items blindly to a cart, I utilize our **Bill of Materials (BOM) Workspace**. Here, I can create a named project—such as 'Smart Agriculture Telemetry'—and add components with their schematic reference designators, like R1, C1, or U1. The system computes my real-time budget utilization against my capstone allocation.
>
> With a single click, I transfer my BOM items directly into the **Shopping Cart**. Our checkout process supports:
> 1. **Campus Lab Station Pickup (₱0)** for immediate on-campus retrieval, or
> 2. **Regional Delivery (flat ₱80)** covering all 7 provinces of Central Luzon.
>
> For payments, we support Cash on Delivery, GCash QR Ph, and Maya QR. I select **GCash QR**, upload my payment confirmation slip with live thumbnail preview, and place the order. The system immediately commits the order `#ORD-2026-XXXX`, decrements our live inventory using ACID database transactions, and transitions my view to the live order status tracker."

---

### Phase 3 (2:30 – 3:30): Admin Operations, Waybills & Manifest Export

> **Speaker (Daniel):** *(Switching to Window 2: Admin)*
> "Now, let's step into the shoes of the campus laboratory warehouse manager on the **Admin Operations Hub**.
>
> On the **Orders Management Dashboard**, our fulfillment staff can filter incoming orders by Central Luzon province—Pampanga, Bulacan, Tarlac, Bataan, Nueva Ecija, Zambales, and Aurora—as well as dispatch partner.
>
> Notice the order Daniel just placed:
> 1. The admin clicks the order to inspect the items, delivery address, and uploaded GCash payment slip.
> 2. With one click, the admin clicks **'Print Shipping Waybill'**. OhmSim generates a standardized logistics slip featuring an SVG Code128 tracking barcode, sender origin (Central Luzon Distribution Hub, Angeles City), and recipient contact details formatted for thermal label printers.
> 3. For bulk dispatches, the admin selects multiple pending orders and clicks **'Export Shipping Manifest CSV'**. The system generates a formatted manifest ready for courier dispatch riders from J&T Express or Flash Express."

---

### Phase 4 (3:30 – 4:15): Live Notification & Order Status Sync Demonstration

> **Speaker (Daniel):** *(Displaying Window 1 and Window 2 side-by-side)*
> "One of our most critical recent enhancements is **Live Order Synchronization & Instant In-App Alerts**.
>
> In the Admin window, the staff updates the order status to **'SHIPPED'** and enters the tracking code `JNT-88992211PH`.
>
> Notice what happens in the Buyer window within seconds:
> * Without any manual page refresh, an interactive toast notification pops up alerting the student: *'📦 Order #ORD-XXXX status updated to: Out for Delivery via J&T Express'*.
> * The topbar notification bell badge counter increments dynamically.
> * Opening the notification drawer reveals the courier dispatch alert and tracking number with a direct deep-link to the order timeline."

---

### Phase 5 (4:15 – 5:00): Cloud Architecture & Bruno Automated API Testing

> **Speaker (Daniel):** *(Switching to Window 3: Bruno & Architecture)*
> "Behind the user interface lies a production-grade cloud architecture:
> * **Backend & Database:** Powered by Neon's serverless Lakebase PostgreSQL running in the cloud with Prisma ORM, utilizing connection pooling and atomic transactions to prevent race conditions.
> * **Authentication:** A dual-layer system integrating bcrypt credential hashing with HTTP-only JWT cookies and Google OAuth powered by `@neondatabase/auth`.
> * **Code Quality & Testing:** Our codebase compiles 58 Next.js pages with **zero ESLint warnings and zero TypeScript errors**.
>
> To demonstrate contract-level verification for this defense, we have prepared our **Bruno API Test Suite** containing 22 automated test requests covering authentication, inventory adjustment, BOM calculations, order placement, and status transitions.
>
> *(Run Bruno Collection Runner or run one request: e.g. `GET /api/orders`)*
>
> All 22 test contracts pass with HTTP 200 OK and valid schemas.
>
> In conclusion, Project OhmSim provides an academic, localized, and technically robust solution tailored for engineering students and makers across Central Luzon. We are now open for your questions and panel evaluation. Thank you!"

---

## 4. Click-by-Click Demonstration Runbook

Follow these exact steps during the live oral defense:

```text
STEP 1: Log in as Buyer (Daniel Cruz)
├── URL: http://localhost:3000/login
├── Input: buyer@ohmsim.nexora.ph / BuyerPass123!
└── Target: Lands on /catalog

STEP 2: Explore Catalog & Open Datasheet
├── Click category pill: "Sensors" or "Microcontrollers"
├── Click on "ESP32-WROOM-32D Development Board"
└── Point out: SKU, technical specs table, stock level badge (e.g., 25 units available).

STEP 3: Demonstrate BOM Workbench
├── Click "BOM Workbench" in navigation bar
├── Show existing project: "Smart Agriculture Telemetry" (Budget: ₱2,500.00)
├── Show items with reference designators: "U1", "S1", "R1-R4"
└── Click "Transfer BOM to Cart" -> redirect to /cart.

STEP 4: Proceed to Checkout
├── In /cart: Show subtotal, shipping fee calculation (₱80 for Delivery in Region III)
├── Click "Proceed to Checkout"
├── Select Fulfillment: "Delivery" (Address: Balibago, Angeles City, Pampanga)
├── Select Payment Method: "GCash QR"
├── Show QR Ph generated dynamic code & upload a sample payment receipt image
└── Click "Place Order" -> Redirects to /orders/[id] with "PENDING" status.

STEP 5: Switch to Admin Hub (Window 2)
├── URL: http://localhost:3000/admin/orders
├── Show the newly placed order at the top of the queue
├── Click "View Details" -> inspect line items and payment proof
├── Click "Print Waybill" -> modal opens displaying thermal slip with barcode
└── Click "Export Manifest CSV" -> download CSV file and open briefly in Excel/Notepad.

STEP 6: Demonstrate Real-Time Status Transition
├── In Admin Order Details: Change status to "SHIPPED"
├── Enter tracking number: "JNT-9876543210PH"
├── Click "Save & Dispatch"
└── Switch glance to Buyer Window: Observe the toast banner pop up and bell badge increment!

STEP 7: Demonstrate Technical Rigor (Window 3)
├── Open Bruno API Client
├── Execute "GET Orders" or run the full test collection
└── Display Terminal: Run `npm run lint` and `npx tsc --noEmit` to prove clean quality gates.
```

---

## 5. Technical Architecture Defense Matrix (Panel Q&A Anticipation)

Prepare for questions from different panel members with these evidence-based answers:

### Q1: Why did you choose Neon PostgreSQL and Prisma ORM over MongoDB, Firebase, or SQLite?
> **Answer:**
> "E-commerce and Bill of Materials management are inherently relational and require strict transactional consistency.
> 1. **Relational Integrity:** An Order consists of OrderItems, which reference Products and optionally BOM projects. Relational foreign keys prevent orphan records.
> 2. **ACID Transactions:** When placing an order, decreasing product stock and writing the order must succeed together or roll back completely. In Prisma, we execute `prisma.$transaction(...)` to eliminate phantom stock and race conditions.
> 3. **Neon Cloud Serverless Architecture:** Unlike static SQLite or heavy self-hosted Postgres, Neon provides serverless Postgres computes that scale dynamically, support instant point-in-time recovery, and allow branching database environments per release."

---

### Q2: How does your authentication system ensure security while supporting both local credentials and Google OAuth?
> **Answer:**
> "We implemented a dual-engine architecture:
> 1. **Credentials Engine:** Uses standard `bcryptjs` with salt rounds of 10 for password hashing. Sessions are stored in HTTP-only, `SameSite=Lax` encrypted JWT cookies signed via `jose`, preventing cross-site scripting (XSS) extraction.
> 2. **Google Single Sign-On:** Integrated via Neon's Managed Better Auth SDK (`@neondatabase/auth`).
> 3. **Origin & Domain Isolation:** Our API routes strictly validate callback URLs against our whitelisted domain (`https://project-ohm-sim.vercel.app`), preventing open redirect and OAuth token interception vulnerabilities."

---

### Q3: Why is fulfillment restricted to Central Luzon (Region III) in version 1.0?
> **Answer:**
> "This was a deliberate design decision based on our project scope and target audience:
> 1. **Academic Localization:** Our initial pilot partners and campus labs are located in Pampanga and neighboring Central Luzon provinces. Offering flat-rate ₱80 shipping or ₱0 campus locker pickup makes component procurement affordable for students who otherwise pay high inter-island freight.
> 2. **Logistics Control:** Restricting fulfillment allows our admin hub in Angeles City to partner directly with local couriers (J&T Express, Flash Express, Lalamove) and generate accurate dispatch manifests.
> 3. **Extensibility:** The schema and address models are parameterized; expanding nationwide in version 2.0 requires only adding province freight tiers in our shipping calculator."

---

### Q4: How does the system handle high-concurrency inventory race conditions during peak checkout?
> **Answer:**
> "In [`app/api/orders/route.ts`](file:///c:/Users/Daniel/Documents/NEXORA/project-ohmsim/app/api/orders/route.ts), order checkout uses an interactive Prisma transaction (`prisma.$transaction`). For each item in the cart, the system queries the live stock quantity within the transaction isolation boundary. If any item's stock is insufficient (`stockQuantity < requestedQuantity`), the transaction aborts with an immediate HTTP 400 error and rollbacks all writes. Furthermore, if an order is later cancelled by an admin or customer, stock increments back into inventory atomically."

---

### Q5: How do you know the system is reliable? What testing methodology was used?
> **Answer:**
> "We implemented a multi-layered quality assurance strategy:
> 1. **Static Analysis & Type Safety:** 100% TypeScript strict-mode adherence with zero `any` evasions, verified via `npx tsc --noEmit`. Zero ESLint warnings across all 58 Next.js pages and components.
> 2. **API Contract Verification:** An automated Bruno collection comprising 22 end-to-end endpoint tests in `api/bruno`, verifying HTTP status codes, session persistence, and JSON response schemas.
> 3. **Automated Lifecycle Integration Tests:** Dedicated test scripts in `tests/ui/` (e.g. `live-order-notification-sync-flow.mjs` and `neon-auth-email-signup.mjs`) that perform automated database writes, status transitions, and cleanup against our live cloud backend."

---

### Q6: What happens if a buyer uploads a fraudulent or corrupted payment slip?
> **Answer:**
> "Orders placed via GCash or Maya QR enter the system with a status of `PENDING`. They are not confirmed or dispatched until an administrator reviews the order in the Admin Orders Hub. The admin views the high-resolution receipt thumbnail, verifies the reference number against the merchant wallet, and either approves the transition to `PROCESSING` or cancels the order with a descriptive reason, immediately alerting the student via in-app notifications."

---

## 6. Emergency Contingency & Fallback Playbook

If unexpected technical issues arise during the defense, follow these immediate recovery protocols:

| Scenario | Immediate Action | Spoken Pivot |
| :--- | :--- | :--- |
| **Internet Disconnection / Slow Cloud Query** | Switch instantly to local environment: `http://localhost:3000` with local database seed. | *"While the campus Wi-Fi reconnects, let me demonstrate the identical flow running against our local replica."* |
| **Session Expired / Logged Out** | Click 'Quick Demo Fill' or log in with saved demo credentials: `buyer@ohmsim.nexora.ph` / `BuyerPass123!`. | *"Our security session policy automatically expires stale sessions. Let me re-authenticate."* |
| **Test Data Cluttered / Need Clean State** | Open PowerShell and run: `npx tsx prisma/seed.ts` (takes 3 seconds). | *"Let me refresh our demo catalog and inventory to pristine seed state."* |
| **Live Toast Doesn't Show Immediately** | Click the notification bell icon directly or trigger window focus by switching tabs. | *"The notification polling engine syncs every 10 seconds or instantly upon regaining window focus."* |

---

## 7. Academic Rubric Alignment & Defense Scorecard

This demonstration directly satisfies core criteria across standard Computer Science / Information Technology capstone rubrics:

| Evaluation Criterion | OhmSim Implementation | Evidence / Demonstration File |
| :--- | :--- | :--- |
| **1. Functional Completeness (30%)** | Catalog, BOM Workbench, Cart, QR Ph Checkout, Admin Dispatch, Waybills, Manifest CSV, Live Notifications. | Complete UI flows in `app/(buyer)` and `app/(admin)`. |
| **2. Software Architecture & Database Design (25%)** | Next.js 16 App Router, Prisma ORM 3NF Schema, Neon Lakebase Postgres, ACID transactions. | `prisma/schema.prisma`<br>`neon.ts` |
| **3. Security & Authentication (15%)** | Bcrypt hashing, HTTP-only JWT cookies, Google OAuth via Neon Better Auth SDK, Role-Based Access Control (RBAC). | `lib/auth/session.ts`<br>`lib/auth/neon-auth.ts` |
| **4. Testing & Code Quality (15%)** | 22 Bruno test requests, end-to-end integration scripts, 0 ESLint errors, 0 TypeScript errors. | `api/bruno/`<br>`tests/ui/`<br>`package.json` |
| **5. Localization & Real-World Applicability (15%)** | Central Luzon (Region III) provincial logistics, Campus Lab pickup, QR Ph / Maya integration, printable waybills. | `docs/FULFILLMENT_AND_DELIVERY_SPEC.md`<br>`components/admin/shipping-waybill-modal.tsx` |

---

> **NEXORA Labs Capstone Team:**
> * Daniel Cruz (`GH-dvniel`) — Project Manager & Lead Developer
> * Cholo B. (`brionescholo00@gmail.com`) — Full Stack AI Engineering Agent
> * Academic Year 2026 • Central Luzon, Philippines
