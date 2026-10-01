# OHMSIM MASTER PROJECT CONTEXT & AI AGENT SYNCHRONIZATION GUIDE

**Project:** OhmSim  
**Organization:** NEXORA Labs  
**Document purpose:** Canonical working context for the Project Manager, Frontend Developer 1, Frontend Developer 2, and their AI coding agents  
**Canonical repository location:** `docs/OHMSIM_AGENT_SYNC.md`  
**Current phase:** Frontend-first implementation  
**Primary integration branch:** `development`

---

## 0. READ THIS FIRST

This file exists so every human contributor and AI agent works from the same project picture.

Before making changes, an agent should read:

1. This file.
2. `docs/handbook/OHMSIM HANDBOOK.pdf` or the approved final OhmSim handbook revision.
3. The relevant project specification under `docs/`.
4. The current repository state.
5. The approved Figma design for the screen or component being implemented.

Do not silently invent requirements when these sources do not agree or do not provide enough information.

### Authority order

When there is a conflict, use this order unless the Project Manager explicitly changes it:

1. **Explicit Project Manager decision**
2. **Approved Figma design** for visual/UI behavior
3. **Approved OhmSim Product Design & Development Handbook**
4. **Specific repository specifications**, such as `docs/FULFILLMENT_AND_DELIVERY_SPEC.md`
5. **This synchronization guide**
6. Existing implementation
7. General framework/library conventions

If a conflict affects scope, routing, business rules, shared types, design tokens, or architecture, stop and surface it to the Project Manager instead of silently choosing one interpretation.

---

# 1. PROJECT IDENTITY

OhmSim is a Progressive Web Application developed by NEXORA Labs as a specialized electronics e-commerce platform.

It is designed for users who need to browse, search, purchase, and manage electronic components and development hardware in one organized system.

Unlike a general marketplace, OhmSim focuses on electronics and engineering-oriented purchasing workflows.

Core user groups include:

- Computer Engineering students
- Electronics Engineering students
- Electrical Engineering students
- STEM students
- Arduino users
- ESP32 developers
- IoT developers
- Robotics hobbyists
- Makers
- Educators
- Academic institutions
- Small electronics suppliers

The application combines normal e-commerce functionality with engineering-oriented features such as:

- Product catalog
- Specialized search and filtering
- Product specifications
- Datasheets
- Shopping cart
- Bill of Materials (BOM) project management
- Checkout
- Order tracking
- Customer support chat
- Notifications
- Inventory management
- Administrative reporting

---

# 2. PROJECT GOAL

The primary goal is to deliver a modern PWA that provides:

- A complete Buyer purchasing experience
- Efficient Administrator operations
- Responsive desktop/tablet/mobile behavior
- Reusable and maintainable UI components
- A shared frontend/backend contract
- Secure role-based access
- A maintainable codebase suitable for team development and academic handover

The system should eventually operate as one integrated workflow rather than as a collection of disconnected features.

---

# 3. VERSION 1.0 SCOPE

## 3.1 Buyer scope

The Buyer module includes:

- Authentication
- Home
- Product Catalog
- Product Categories
- Product Details
- Search
- Parametric Search
- Shopping Cart
- BOM Cart / BOM Projects
- Checkout
- Orders
- Order Details
- Order Tracking
- Customer Support Chat
- Notifications
- Profile
- Account Settings
- Purchase History

## 3.2 Administrator scope

The Administrator module includes:

- Dashboard
- Product Management
- Category Management
- Inventory Management
- Order Management
- Order Details
- Customer Management
- Customer Support Chat
- Sales Reports
- Monthly Liquidation
- Notification Management
- Account Settings

## 3.3 Explicit Version 1.0 exclusions

Do not add these unless the Project Manager explicitly expands scope:

- Multi-vendor marketplace
- AI product recommendations
- Online payment gateway
- SMS notifications
- Social-media login
- Product reviews and ratings
- Community forum
- Product auctions
- Live video support
- Voice calling
- Multi-language support
- International shipping
- Supplier management portal

Version 1.0 payment is not an online gateway.

---

# 4. USER ROLES

OhmSim has two primary roles.

## 4.1 Buyer

A Buyer can:

- Register and log in
- Browse products
- Search and filter products
- View specifications and datasheets
- Add items to the Shopping Cart
- Create and manage BOM projects
- Place orders
- Track order status
- Communicate with administrators
- Receive notifications
- Manage their profile
- View purchase history

A Buyer must not:

- Manage global products
- Modify inventory
- Modify another user's orders
- Access administrative reports
- Perform Administrator-only operations

## 4.2 Administrator

An Administrator can:

- Manage products
- Manage categories
- Manage inventory
- Process customer orders
- Update order statuses
- View customer records
- Communicate with Buyers
- View/generate reports
- Manage notifications/announcements
- Monitor operational data

Critical role restrictions must eventually be enforced server-side. UI hiding alone is not security.

---

# 5. HIGH-LEVEL SYSTEM ARCHITECTURE

Canonical application flow:

```text
User
  ↓
OhmSim Progressive Web Application
  ↓
Next.js Application / Server
  ↓
Application Services / Business Logic
  ↓
Prisma ORM
  ↓
PostgreSQL (Neon)
  ↓
External Services as applicable
```

External services planned by the handbook include:

- Cloudinary for images
- Firebase Cloud Messaging for push notifications
- Better Auth for authentication/session management
- Socket.IO for real-time communication
- Vercel for deployment

The frontend must not access PostgreSQL directly.

---

# 6. APPROVED / PLANNED TECHNOLOGY STACK

The handbook defines the target stack as:

| Layer | Technology |
|---|---|
| Frontend framework | Next.js |
| UI runtime | React |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI components | shadcn/ui |
| Icons | Lucide React |
| State management | Zustand |
| Forms | React Hook Form + Zod |
| Database | PostgreSQL |
| Database hosting | Neon |
| ORM | Prisma |
| Authentication | Better Auth |
| File/image storage | Cloudinary |
| Real-time communication | Socket.IO |
| Push notifications | Firebase Cloud Messaging |
| Charts | Recharts |
| Data tables | TanStack Table |
| Toasts | Sonner |
| Deployment | Vercel |
| Version control | Git / GitHub |
| API testing | Bruno |

### Important implementation rule

The planned stack does **not** mean every package should be installed immediately.

Install dependencies only when required by the current approved task.

The frontend is being developed first, so backend integrations may remain placeholders until their implementation phase.

---

# 7. CURRENT REPOSITORY STATE

The repository has already been audited.

The current scaffold is considered structurally acceptable. A major repository reorganization is **not required**.

Current important structure:

```text
project-ohmsim/
├── app/
│   ├── (buyer)/
│   │   ├── home/
│   │   ├── products/[id]/
│   │   ├── cart/
│   │   ├── bom/
│   │   ├── checkout/
│   │   ├── orders/[id]/
│   │   ├── chat/
│   │   ├── notifications/
│   │   ├── profile/
│   │   └── settings/
│   ├── (admin)/admin/
│   │   ├── products/
│   │   ├── categories/
│   │   ├── inventory/
│   │   ├── orders/
│   │   ├── customers/
│   │   ├── chat/
│   │   ├── reports/
│   │   ├── notifications/
│   │   └── settings/
│   ├── api/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   └── favicon.ico
├── components/
│   ├── ui/
│   ├── icons/
│   ├── buyer/
│   └── admin/
├── hooks/
├── lib/
│   ├── auth/
│   ├── prisma/
│   ├── cloudinary/
│   ├── firebase/
│   └── validations/
├── services/
├── types/
├── public/
│   ├── images/
│   └── icons/
├── prisma/
├── api/bruno/
├── tests/
├── docs/
├── PROJECT_HANDOFF.md
├── README.md
├── AGENTS.md
├── CLAUDE.md
├── package.json
├── package-lock.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
└── eslint.config.mjs
```

Many route/component/data folders currently contain placeholders only.

### Verified implementation state

At the time of the audit:

- Only the root `/` page was implemented.
- The default Next.js starter page was replaced locally with a simple OhmSim test page.
- Buyer/Admin feature routes were still placeholders.
- Components were still placeholders.
- Services and types were still placeholders.
- API handlers were placeholders.
- The current branch was `development`.
- `app/page.tsx` had an existing local/uncommitted change.
- Tailwind CSS v4 was configured.
- shadcn/ui was not yet configured.
- `components.json` did not yet exist.
- `app/globals.css` still contained starter theme values.
- The root layout loaded Geist variables while the body styling still explicitly used Arial/Helvetica.

Agents must inspect the live repository before acting because this state will change over time.

---

# 8. CANONICAL ROUTE INTENT

Route groups organize code but do not appear in URLs.

The existing `(admin)/admin/` pattern is intentional because the literal `admin` segment creates the `/admin/...` URL prefix.

Recommended route direction:

```text
/
├── login
├── register
├── forgot-password
├── home
├── products
│   └── [id]
├── cart
├── bom
├── checkout
├── orders
│   └── [id]
├── chat
├── notifications
├── profile
├── settings
└── admin
    ├── products
    ├── categories
    ├── inventory
    ├── orders
    │   └── [id]
    ├── customers
    ├── chat
    ├── reports
    ├── liquidation
    ├── notifications
    └── settings
```

### Route decisions that must remain explicit

The team should confirm and document:

- `/` = public landing page
- `/home` = Buyer Home
- Admin dashboard = `/admin`
- Admin Order Details = `/admin/orders/[id]`
- Monthly Liquidation route, proposed as `/admin/liquidation`
- Authentication routes should use a separate visual shell rather than Buyer/Admin navigation

Do not independently rename routes after consumers begin using them.

---

# 9. FIGMA IS THE VISUAL SOURCE OF TRUTH

The Figma design is already complete.

Frontend developers are not redesigning OhmSim.

They are translating the approved design into reusable implementation.

For all visual work, the approved Figma design determines:

- Color values
- Semantic colors
- Typography
- Font family
- Font weights
- Font sizes
- Line heights
- Letter spacing
- Spacing
- Padding
- Gaps
- Width/height constraints
- Border radius
- Borders
- Shadows
- Component states
- Responsive layouts
- Navigation patterns
- Visual hierarchy
- Image treatment
- Icon usage

### Confirmed approved visual foundation

- Canonical visual system: **Catppuccin Mocha**.
- Production UI / headings / body font: **Inter**.
- Technical / numeric / monospace font: **JetBrains Mono**.
- **Master Prototype Design System** is the canonical source for shared visual foundations: semantic colors, typography, spacing, radii, effects, motion, and accessibility.
- **Master Prototype Components** is the canonical source for reusable component specifications, dimensions, variants, and states.
- **Landing Page handoff / Figma Make** provides landing-page composition, copy, and screen-specific reference; it does not override canonical shared foundations or component specifications.

The confirmed core token values and source nodes are documented in `docs/design/landing-page/LANDING_PAGE_HANDOFF.md`, `docs/design/landing-page/reference/DESIGN_TOKENS_REFERENCE.css`, and `docs/design/landing-page/SOURCE_MAP.md`.

Theme, UI/monospace font families, and documented core tokens are approved decisions, not unresolved design choices. Do not retain starter automatic light/dark switching or historical Make fonts as production defaults. Any values or states not covered by the approved references still require verification rather than guessing.

### Never guess missing Figma values

If an AI agent cannot access or confirm a design value:

- Do not invent it and call it approved.
- Do not substitute a personal preference.
- Ask for the value or mark it as pending.

### Figma-to-code rule

Use Figma to reproduce appearance and layout.

Do not copy arbitrary generated code if it results in poor React structure, hard-coded repetition, or non-reusable components.

The code should preserve the visual design while following the shared architecture.

---

# 10. SHARED FRONTEND FOUNDATION

Before Buyer and Admin frontend work proceeds independently, the team must establish one shared frontend foundation.

This prevents:

- Separate color systems
- Duplicate Buttons
- Different Inputs
- Different Badge semantics
- Inconsistent typography
- Duplicate assets
- Different Product/Order types
- Incompatible mock data
- Large merge conflicts

## 10.1 Foundation ownership

Recommended:

- **Frontend Developer 1:** primary implementer
- **Frontend Developer 2:** reviewer
- **Project Manager:** approval for architecture/scope changes

Recommended branch:

```text
feature/frontend-foundation
```

Target:

```text
development
```

## 10.2 Shared foundation scope

The foundation may include:

- `app/globals.css`
- `app/layout.tsx`
- shadcn/ui configuration
- `components.json`
- `lib/utils.ts`
- Shared Button
- Shared Input
- Shared Badge
- Shared Dialog
- Shared toast/Sonner setup
- Shared Product type
- Shared Order type
- Shared User type
- Initial mock-data convention
- Initial typed service convention
- Approved Figma asset organization

Do not build full Buyer/Admin pages in this foundation branch.

Do not implement backend/database logic in this foundation branch.

---

# 11. DESIGN SYSTEM RULES

## 11.1 Centralized values

Shared visual values belong in the project design system.

Do not repeatedly hard-code project-wide values in page components.

The shared design system should cover:

- Colors
- Typography
- Spacing
- Radii
- Shadows
- Breakpoints/responsive behavior where needed
- Focus states
- Common component dimensions

With Tailwind v4, the project should use the current Tailwind approach already present in the repository. Do not add a legacy configuration merely because an older tutorial uses one.

## 11.2 Shared primitive components

Generic shared primitives belong in:

```text
components/ui/
```

Examples:

- Button
- Input
- Badge
- Dialog
- Table primitives
- Toast renderer
- Select
- Checkbox
- Radio controls

OhmSim-specific shared components belong in:

```text
components/shared/
```

Create `components/shared/` when there is an actual shared semantic component.

Examples:

- `OrderStatusBadge`
- Shared Empty State
- Shared Error State
- Shared currency formatter UI wrapper, if truly UI-specific

Do not create a folder only to satisfy a diagram.

## 11.3 Module-specific components

Buyer-only:

```text
components/buyer/
```

Admin-only:

```text
components/admin/
```

Do not create `BuyerButton` and `AdminButton` when both should use the same Button primitive.

---

# 12. ASSET ORGANIZATION

Recommended static-asset structure:

```text
public/
├── logos/
├── icons/
└── images/
    ├── products/
    └── illustrations/
```

Rules:

- Maintain one canonical copy of shared logos/assets.
- Do not create duplicate Buyer/Admin copies of the same asset.
- Prefer SVG for suitable logos/icons.
- Use `public/icons/` for static icon files.
- Use `components/icons/` only for custom React icon components.
- Standard interface icons should use the agreed icon library unless the Figma design requires a custom asset.
- Product images belong under a consistent product-image location.
- Asset filenames should be descriptive and stable.

---

# 13. FRONTEND TEAM OWNERSHIP

## 13.1 Frontend Developer 1 — Buyer

Primary ownership:

```text
app/(buyer)/**
components/buyer/**
```

Buyer screens/features:

- Home
- Catalog
- Product Details
- Cart
- BOM
- Checkout
- Orders
- Order Details
- Chat
- Notifications
- Profile
- Account Settings

Frontend Developer 1 must use the shared design system and shared types.

## 13.2 Frontend Developer 2 — Administrator

Primary ownership:

```text
app/(admin)/admin/**
components/admin/**
```

Admin screens/features:

- Dashboard
- Products
- Categories
- Inventory
- Orders
- Order Details
- Customers
- Chat Center
- Reports
- Monthly Liquidation
- Notifications
- Settings

Frontend Developer 2 must use the same shared design system and shared types.

## 13.3 Shared ownership

These are shared coordination zones:

```text
app/globals.css
app/layout.tsx
components/ui/**
components/shared/**
types/**
lib/mocks/**
services/**
public/**
package.json
package-lock.json
components.json
tsconfig.json
next.config.ts
postcss.config.mjs
eslint.config.mjs
```

### Shared does not mean "everyone edits freely"

For shared files:

- One person authors a change.
- Another frontend developer reviews.
- Architecture/scope changes require Project Manager awareness.
- Avoid simultaneous edits to the same shared file.
- Merge shared foundation work before large parallel feature branches.

---

# 14. FRONTEND-FIRST DEVELOPMENT

The handbook explicitly allows frontend-first development.

The frontend should not wait for the complete backend.

During the frontend phase:

```text
UI → typed services → shared mock data
```

Later:

```text
UI → typed services → real API → database
```

The objective is to preserve page-facing contracts while replacing the implementation behind the service layer later.

### Do not permanently embed mock arrays inside page components

Avoid:

```text
page.tsx
  └── huge hard-coded products/orders/users arrays
```

Prefer:

```text
page/component
  ↓
services/<domain>.ts
  ↓
lib/mocks/<domain>.ts
```

Keep it simple. Do not build a fake backend unless explicitly approved.

---

# 15. SHARED TYPES

Recommended initial frontend contracts:

```text
types/
├── product.ts
├── order.ts
└── user.ts
```

Add BOM, notification, message, category, etc. when those features actually begin.

## 15.1 Product

Initial UI contract may include:

- `id`
- `name`
- `sku`
- `categoryId`
- `categoryName`
- `description`
- `price`
- `stock`
- `imageUrl`
- optional `brand`
- optional structured `specifications`
- datasheet information where needed

## 15.2 User

Initial frontend User contract may include:

- `id`
- `fullName`
- `email`
- `role`
- `createdAt`

Never put:

- password
- password hash
- session secret
- private authentication credentials

inside frontend mock user objects.

## 15.3 Order

Initial UI contract may include:

- `id`
- `orderNumber`
- `userId`
- `status`
- `createdAt`
- `items`
- `subtotalAmount`
- `deliveryFee`
- `totalAmount`
- fulfillment information
- recipient/pickup information
- contact information

Order items may contain:

- `productId`
- `productName`
- `quantity`
- `unitPrice`

Product name and unit price may be represented as order-time snapshots so later catalog edits do not rewrite historical order displays.

## 15.4 Type conventions

Recommended:

- IDs as strings
- ISO strings for timestamps
- Prices represented consistently in PHP amounts
- Shared enums/unions for role/status values
- No page-specific duplicate type definitions for shared entities

---

# 16. MOCK DATA

Recommended:

```text
lib/mocks/
├── products.ts
├── orders.ts
└── users.ts
```

Add later:

- BOM projects
- Notifications
- Messages
- Categories
- Reports

Mock rules:

- Use deterministic IDs.
- Keep IDs consistent across related fixtures.
- Use fictional users.
- Include representative success/empty/low-stock/out-of-stock/status cases.
- Avoid accidental shared mutation.
- Mock filtering is not authorization.
- Do not treat mock behavior as security.
- Do not create production assumptions from mock shortcuts.

---

# 17. SERVICES LAYER

`services/` provides a stable interface between pages/components and data.

During frontend-first work:

```text
services/products.ts → lib/mocks/products.ts
```

Later:

```text
services/products.ts → /api/products
```

This makes backend integration less disruptive.

Keep early services minimal.

Examples:

- list products
- get product by ID
- list orders
- get order by ID
- get current mock user

Do not implement unnecessary abstractions before they are needed.

---

# 18. BUYER FUNCTIONAL WORKFLOW

High-level Buyer flow:

```text
Landing
  ↓
Register / Login
  ↓
Browse Products
  ↓
Search / Filter
  ↓
Product Details
  ↓
Add to Cart or BOM
  ↓
Checkout
  ↓
Place Order
  ↓
Track Order
  ↓
Receive Notifications
  ↓
Fulfillment / Completion
```

The Buyer can also access support chat and account/profile functionality.

---

# 19. BOM WORKFLOW

The Bill of Materials feature supports project-based purchasing.

Canonical flow:

```text
Create New Project
  ↓
Assign Project Name
  ↓
Browse Products
  ↓
Add Components
  ↓
Modify Quantities
  ↓
View Estimated Cost
  ↓
Check Product Availability
  ↓
Transfer BOM to Shopping Cart
  ↓
Checkout
```

Business rules:

- A Buyer may create multiple BOM projects.
- Each BOM belongs to one Buyer.
- Changes in one BOM must not affect another BOM.
- Items transferred to Cart must be validated against current inventory when the real backend is implemented.

---

# 20. SHOPPING CART RULES

Key rules:

- Each cart belongs to one Buyer.
- Quantity must not exceed available stock.
- Stock must never become negative.
- Adding the same product repeatedly should update quantity rather than create duplicate cart entries.
- Cart items persist until removed, purchased, or cleared by defined behavior.
- Checkout requires at least one valid cart item.

Frontend mock behavior should visually represent these rules, while real enforcement belongs to the backend later.

---

# 21. CHECKOUT & FULFILLMENT RULES

Version 1.0 supports:

- In-store/Lab Pickup
- Region 3 / Central Luzon delivery

Region 3 delivery coverage is limited to:

- Aurora
- Bataan
- Bulacan
- Nueva Ecija
- Pampanga
- Tarlac
- Zambales

## 21.1 Delivery fee

For delivery:

- Merchandise subtotal **₱1,000.00 and above** → **Free delivery**
- Merchandise subtotal **below ₱1,000.00** → **₱80.00 flat fee**

For pickup:

- Delivery fee = **₱0.00**

## 21.2 Payment

- Delivery → **Cash on Delivery (COD)**
- Pickup → **In-Person Pay on Pickup**

No online payment gateway in Version 1.0.

## 21.3 Saved addresses

Registered Buyers may save up to **two** delivery addresses within Region 3.

## 21.4 Checkout data

Checkout may require:

- Fulfillment method
- Pickup/recipient name
- Contact number
- Delivery address where applicable
- Optional order notes
- Order review

Before real order creation, the backend must eventually validate current stock.

---

# 22. ORDER STATUS

The handbook defines the pickup-oriented baseline:

```text
Pending
  ↓
Confirmed
  ↓
Preparing
  ↓
Ready for Pickup
  ↓
Completed
```

Alternative:

```text
Pending
  ↓
Cancelled
```

The repository also contains a dedicated fulfillment specification for dual pickup/delivery behavior.

**Use `docs/FULFILLMENT_AND_DELIVERY_SPEC.md` as the authoritative detailed source for dual-fulfillment statuses.**

The frontend planning audit proposed this shared vocabulary:

- `PENDING`
- `CONFIRMED`
- `PREPARING`
- `READY_FOR_PICKUP`
- `OUT_FOR_DELIVERY`
- `DELIVERED`
- `COMPLETED`
- `CANCELLED`

Do not independently introduce new order statuses.

Only Administrators may update order status in the real system.

Buyers view their own order status.

Completed orders should become read-only.

Cancelled orders must not continue to subsequent states.

---

# 23. PRODUCT CATALOG & SEARCH

Catalog should support:

- Product image
- Product name
- Price
- Stock
- Essential metadata
- Pagination where needed
- Search
- Filtering
- Sorting

Search can include:

- Product name
- Brand
- SKU

Parametric filtering may include:

- Category
- Brand
- Voltage
- Current
- Resistance
- Capacitance
- Tolerance
- Package type
- Price
- Stock availability

Product Details should support:

- Image gallery
- Product title
- Price
- Stock
- Quantity
- Description
- Technical specifications
- Datasheet
- Add to Cart
- Add to BOM
- Contact Administrator

Technical information should use structured layouts rather than large unstructured text blocks.

---

# 24. CHAT

Chat is Buyer ↔ Administrator support communication.

Purposes include:

- Product inquiries
- Order inquiries
- General customer assistance

It is not:

- A public chatroom
- A community forum
- A Buyer-to-Buyer messaging platform

Messages may reference products/orders for context.

Conversation history should be retained when the backend is implemented.

---

# 25. NOTIFICATIONS

Planned notification events include:

- Order confirmation
- Order status updates
- New support messages
- Account-related notifications
- Administrative announcements where supported

Delivery mechanisms:

- In-app notification center
- Firebase Cloud Messaging push notifications

Frontend-first screens may use mock notification data.

Do not implement FCM during unrelated UI foundation tasks.

---

# 26. DATABASE OVERVIEW

The database is PostgreSQL hosted on Neon with Prisma ORM.

Core tables/entities described by the handbook include:

- `users`
- `categories`
- `products`
- `carts`
- `cart_items`
- `bom_projects`
- `bom_items`
- `orders`
- `order_items`
- `messages`
- `notifications`
- `user_addresses`

Key relationships:

- User → Orders
- User → Shopping Cart
- Cart → Cart Items
- Product → Cart Items
- User → BOM Projects
- BOM Project → BOM Items
- Product → BOM Items
- Category → Products
- Order → Order Items
- Product → Order Items
- User → Messages
- User → Notifications

### Frontend boundary

Frontend developers must not:

- Create direct PostgreSQL access
- Put DB credentials into browser code
- Add Prisma calls to client components
- Treat frontend mock types as final database schemas

The backend/database phase will finalize implementation details.

---

# 27. API DIRECTION

The handbook defines REST-style JSON APIs.

General structure:

```text
/api/<resource>
```

Examples:

```text
/api/products
/api/orders
/api/cart
/api/bom
/api/messages
/api/notifications
```

Expected HTTP semantics include:

- `GET` retrieve
- `POST` create
- `PATCH` modify
- `DELETE` remove

Protected operations must eventually enforce:

- Authentication
- Authorization
- Validation
- Ownership
- Business rules

Frontend developers should integrate only against agreed API contracts.

Do not invent backend behavior silently.

---

# 28. SECURITY RULES

Security is not a frontend-only concern.

The security model is:

```text
Authenticate
  ↓
Authorize
  ↓
Validate
  ↓
Process
  ↓
Protect Data
  ↓
Log Relevant Events
```

Important rules:

- Protected features require authentication.
- Role restrictions must be enforced server-side.
- Buyers may only access their own protected records.
- Frontend route hiding is not authorization.
- Inputs must be validated.
- Sensitive credentials must not enter frontend code.
- Secrets must not be committed.
- Frontend-only developers do not need production DB credentials.
- Production credentials must be limited to authorized personnel.

Never commit:

- `.env` secrets
- database passwords
- private keys
- Firebase private credentials
- authentication secrets
- service API secrets

---

# 29. GIT WORKFLOW

Primary branches:

```text
main
└── development
    ├── feature/...
    ├── feature/...
    └── feature/...
```

Rules:

- Do not develop directly on `main`.
- Feature work branches from the appropriate current integration branch.
- Significant work uses a Pull Request.
- PRs target `development`.
- Review before merge.
- QA follows integration.
- Stable tested work eventually reaches `main`.

Recommended frontend foundation flow:

```text
development
  ↓
feature/frontend-foundation
  ↓
review
  ↓
development
```

After foundation merge:

```text
development
  ├── Buyer feature branches
  └── Admin feature branches
```

Do not keep huge long-lived branches if smaller feature branches are practical.

Examples:

```text
feature/buyer-catalog
feature/buyer-cart
feature/admin-dashboard
feature/admin-products
```

---

# 30. COMMIT CONVENTION

Recommended format:

```text
type: description
```

Examples:

```text
feat: add product catalog
feat: implement shopping cart
fix: correct order quantity validation
fix: resolve mobile navigation issue
refactor: simplify product service
style: update product card layout
docs: update API documentation
test: add order validation tests
chore: update configuration
```

Keep commits focused.

Do not mix:

- unrelated formatting
- dependency upgrades
- large page implementation
- repository restructuring

into one opaque commit.

---

# 31. PULL REQUEST EXPECTATIONS

A significant PR should explain:

- What changed
- Why it changed
- Screens/features implemented
- Known limitations
- Testing performed
- Figma reference for visual work
- Screenshots for significant UI work

Frontend PR review should check:

- Functional correctness
- Figma fidelity
- Reusable component usage
- Responsive behavior
- TypeScript correctness
- Naming
- Validation
- Error/loading/empty states
- Accessibility basics
- Duplication
- Compatibility with existing modules
- Whether shared-file changes were coordinated

---

# 32. MERGE-CONFLICT CONTROL

Highest-risk shared files include:

- `app/globals.css`
- `app/layout.tsx`
- `package.json`
- `package-lock.json`
- `components.json`
- `components/ui/**`
- `types/**`
- `services/**`
- `lib/mocks/**`
- shared assets

Rules:

1. Merge shared foundation before major Buyer/Admin parallel development.
2. Assign one author for a shared-file change.
3. Require cross-module review.
4. Avoid unrelated changes to shared configuration inside page PRs.
5. Pull/rebase/synchronize with `development` before starting major new work.
6. Resolve shared contract changes before modifying many consumers.
7. Do not independently create a second design system.

---

# 33. DEVELOPMENT SEQUENCE

The handbook recommends dependency-driven implementation.

High-level order:

```text
Project Setup
  ↓
Design System
  ↓
Authentication
  ↓
Product Catalog
  ↓
Product Details
  ↓
Cart
  ↓
BOM
  ↓
Checkout
  ↓
Orders
  ↓
Inventory
  ↓
Chat
  ↓
Notifications
  ↓
Reports
```

### Current team-specific sequence

For the present frontend-first phase:

```text
Repository Audit
  ↓
Shared Frontend Foundation
  ↓
Merge Foundation into development
  ↓
Buyer/Admin Parallel Work
  ↓
Frontend QA / Figma Review
  ↓
Backend API Integration
  ↓
Integrated Testing
```

Do not skip the shared foundation and allow two separate UI systems to emerge.

---

# 34. RECOMMENDED FIRST PARALLEL SLICES

After the foundation is merged:

## Buyer developer

Recommended first slice:

- Buyer layout/shell
- Product Catalog
- Product Details

## Admin developer

Recommended first slice:

- Admin layout/shell
- Products
- Inventory

Why these first:

- Both consume shared Product types.
- Both exercise the design system.
- They expose shared-contract inconsistencies early.
- They remain sufficiently separated to reduce merge conflicts.

---

# 35. LOADING, EMPTY, ERROR, AND INTERACTION STATES

Data-driven pages/components must eventually support appropriate states.

Examples:

## Loading

- Skeleton
- Spinner
- Disabled action button
- Progress indicator

## Empty

- Empty Cart
- No Orders
- No Notifications
- No Search Results
- Empty BOM

An empty state should explain the situation and provide a relevant next action when one exists.

## Error

Examples:

- Product not found
- Order not found
- Network error
- Unauthorized access
- Session expired
- Internal server error

Do not expose raw technical error details to ordinary users.

---

# 36. RESPONSIVE REQUIREMENTS

OhmSim is a PWA.

Supported categories:

- Desktop
- Laptop
- Tablet
- Mobile

The interface should not depend on desktop-only interactions.

Expected adaptations may include:

- Collapsible navigation
- Responsive product grids
- Scrollable admin tables where necessary
- Stacked forms
- Adaptive dialogs
- Mobile-friendly touch targets

The final responsive behavior comes from the approved Figma designs.

Do not infer breakpoints from Figma frame widths alone without understanding the intended behavior.

---

# 37. ACCESSIBILITY BASELINE

Frontend code should:

- Use semantic HTML
- Associate labels with controls
- Support keyboard interaction
- Keep visible focus states
- Use meaningful button labels
- Provide alt text for meaningful images
- Avoid using color as the only status indicator
- Use accessible dialog primitives
- Maintain usable touch targets

Accessibility is part of implementation quality, not a post-project decoration.

---

# 38. TESTING EXPECTATIONS

Testing is continuous.

The handbook includes:

- Unit testing
- Component testing
- Integration testing
- API testing
- Database testing
- Authentication/authorization testing
- UI testing
- Responsive testing
- Browser testing
- Security testing
- Regression testing
- User acceptance testing

Developers test their own work before QA.

QA formally verifies requirements.

## Frontend checks

At minimum for significant frontend work:

- Application runs
- TypeScript checks
- Lint
- Production build when appropriate
- Desktop behavior
- Mobile behavior
- Main interactions
- Loading state
- Empty state
- Error state
- Figma comparison

Commands may include:

```text
npm run lint
npx next typegen
npx tsc --noEmit
npm run build
npm run dev
```

Use the commands appropriate to the current repository scripts/configuration.

---

# 39. FEATURE DEFINITION OF DONE

A frontend feature is not Done because the screen appears once.

A feature should satisfy:

- Required functionality works
- UI follows approved Figma
- Responsive behavior works
- Relevant loading state exists
- Relevant empty state exists
- Relevant error state exists
- Validation works where applicable
- Shared components are used appropriately
- TypeScript is clean
- No unnecessary duplication
- Developer tested
- Code reviewed
- QA tested when in QA scope
- Critical defects resolved
- Documentation updated when necessary
- Merged into the correct branch

---

# 40. UI COMPLETION STANDARD

The handbook considers the interface complete when:

- Required pages exist
- Navigation works
- Forms/buttons work
- Loading states exist where required
- Empty states exist where required
- Error states exist where required
- Responsive layouts work
- Text is readable
- Components remain consistent
- Approved design system is followed

UX should provide:

- Clear navigation
- Understandable actions
- Consistent terminology
- Clear feedback
- Appropriate confirmation
- Clear errors
- Predictable workflows
- Minimal unnecessary steps

---

# 41. QA / ACCEPTANCE

A feature should pass QA when:

- Required functionality works
- Expected output is produced
- Invalid operations are handled
- Authorization works where applicable
- Data behavior is correct
- UI states work
- Responsive behavior works
- No unresolved Critical defect blocks the feature

Every major feature should eventually be tested against:

- Normal case
- Invalid case
- Boundary case
- Unauthorized case
- Failure case

---

# 42. DEPLOYMENT MODEL

Planned deployment:

- Next.js app → Vercel
- Database → Neon PostgreSQL
- Image storage → approved provider / Cloudinary
- Push → Firebase FCM

Environment flow:

```text
Local
  ↓
Feature Branch
  ↓
development
  ↓
QA
  ↓
main
  ↓
Production
```

Production deployment is not a substitute for QA.

A failed production build blocks release.

Production DB and local/development DB must remain separate.

Secrets belong in deployment environment configuration, not Git.

---

# 43. MAINTENANCE & HANDOVER

The project is designed to survive team changes.

Documentation must stay synchronized with implementation.

A future developer should be able to:

- Clone the repository
- Follow setup instructions
- Understand architecture
- Run the app
- Understand routes/components
- Test APIs
- Understand database structure
- Deploy without depending on undocumented tribal knowledge

This synchronization file should be updated when major architecture, workflow, ownership, or canonical scope decisions change.

Do not use it to document every small implementation detail.

---

# 44. PROJECT MANAGER RESPONSIBILITY

The Project Manager coordinates:

- Task assignment
- Backlog
- Development priorities
- Cross-team decisions
- Shared architecture decisions
- Conflict resolution
- Review of major changes
- Frontend/backend/design/QA coordination
- Repository access
- Final approval process

The Project Manager is not expected to personally implement every feature.

Major changes to:

- project scope
- route structure
- shared types
- design system
- shared architecture
- development sequence

should be surfaced to the Project Manager before implementation.

---

# 45. AI AGENT OPERATING RULES

Every AI coding agent working on OhmSim must follow these rules.

## 45.1 Inspect before modifying

Before making a change:

- Inspect relevant existing files.
- Inspect current Git state if the task involves code changes.
- Understand the assigned module.
- Check shared dependencies.
- Check Figma/reference requirements.

Do not assume a placeholder is implemented functionality.

## 45.2 Stay inside assigned scope

Buyer agent should not casually edit Admin pages.

Admin agent should not casually edit Buyer pages.

Neither should independently redesign shared files.

If a shared-file change is needed, identify it explicitly.

## 45.3 No silent refactors

Do not:

- Move the repository to `src/`
- Rename route groups
- Replace Tailwind
- Replace shadcn
- Replace the framework
- Introduce another state library
- Reorganize the repository
- Change shared type shapes globally

unless the task explicitly requires it and the Project Manager approves.

## 45.4 No silent scope expansion

Do not add features merely because they are technically interesting.

Stay inside Version 1.0.

## 45.5 Do not guess the design

Figma is authoritative.

If visual data is missing, ask or mark pending.

## 45.6 Preserve existing work

Never discard uncommitted or unrelated work.

Do not reset/clean/revert user changes without explicit instruction.

## 45.7 Keep shared changes visible

If a task requires editing:

- global styles
- root layout
- package dependencies
- shared UI
- shared types
- shared mocks

call this out before implementation or in the plan.

## 45.8 Keep the backend boundary

During frontend-only tasks:

- Do not implement Prisma behavior.
- Do not create DB credentials.
- Do not invent server authorization.
- Do not add real APIs unless the task is explicitly API/backend integration.

## 45.9 Validate before claiming completion

Before saying a coding task is complete, run the relevant checks or explicitly state which checks were not run.

## 45.10 Show evidence

For substantial changes, report:

- Files changed
- Files added
- Dependencies added
- Commands run
- Validation results
- Known limitations
- Shared-file impact
- Next recommended step

---

# 46. AGENT TASK TEMPLATE

Use this structure when assigning implementation tasks:

```text
TASK:
<clear feature/task>

OWNER:
<Buyer Frontend / Admin Frontend / Shared>

BRANCH:
feature/<name>

SOURCE OF TRUTH:
- Figma: <frame/component>
- Handbook: <chapter/section>
- Repository spec: <file if applicable>

IN SCOPE:
- ...

OUT OF SCOPE:
- ...

FILES EXPECTED:
- ...

SHARED FILES TOUCHED:
- ...

ACCEPTANCE CRITERIA:
- ...

VALIDATION:
- lint
- typecheck
- build/dev
- responsive/Figma check

IMPORTANT:
Do not modify unrelated files.
Do not expand scope.
Show diff/results before commit if requested.
```

---

# 47. CURRENT IMMEDIATE PROJECT PHASE

The immediate next phase is **Shared Frontend Foundation**.

Before both frontend developers independently build pages:

1. Verify access to the approved Figma tokens/assets and use the confirmed visual foundation in Section 9.
2. Configure shared design system.
3. Configure shadcn/ui once.
4. Establish shared primitives.
5. Establish minimum shared Product/Order/User types.
6. Establish minimal mock/service convention.
7. Review foundation across both Buyer/Admin needs.
8. Merge into `development`.
9. Both developers update from `development`.
10. Begin parallel Buyer/Admin feature work.

---

# 48. CURRENT KNOWN OPEN ITEMS

These require explicit confirmation rather than silent assumptions:

1. Approved asset access and any component-specific values not covered by the confirmed references must be verified before implementation.
2. `/` public landing versus `/home` Buyer Home should remain documented and consistent.
3. Authentication route ownership and registration/login rules require Project Manager resolution.
4. Admin Order Details route should be present when implemented.
5. Monthly Liquidation route should be confirmed against Figma/navigation.
6. The existing local `app/page.tsx` change must be preserved appropriately.
7. The exact approved handbook revision in the repository should be kept synchronized with the team's final documentation.
8. Shared-file ownership should remain explicit after parallel development begins.
9. Order cancellation authority requires clarification: the fulfillment specification allows Buyer cancellation of Pending orders, while this guide broadly restricts status updates to Administrators.
10. Landing CTA height mapping (Make 46px versus canonical 44/48px) remains unresolved; see the landing-page handoff.
11. Unresolved landing navigation destinations and future Buyer/Admin screen decisions remain deferred to the Project Manager.

---

# 49. DO NOT DO THESE THINGS

Without explicit approval, do not:

- Majorly reorganize the repository
- Move everything to `src/`
- Build two separate design systems
- Duplicate shared logos/icons
- Put mock arrays directly into many page files
- Let Buyer/Admin define incompatible Product or Order types
- Add an online payment gateway
- Add multi-vendor functionality
- Add reviews
- Add social login
- Add international shipping
- Change fulfillment rules
- Add unsupported order statuses
- Add direct database access to browser code
- Commit secrets
- Work directly on `main`
- Treat a visually rendered screen as Done without states/responsiveness/review
- Treat a mock frontend permission check as real authorization

---

# 50. FINAL COMPLETION STANDARD

OhmSim is complete only when the approved requirements operate as one integrated system.

The final project must satisfy:

1. Required functionality works.
2. Integrated workflows work end-to-end.
3. QA and security checks pass.
4. Production deployment works.
5. Source code and documentation are ready for handover/submission.

Final project flow:

```text
Plan
  ↓
Design
  ↓
Develop
  ↓
Integrate
  ↓
Test
  ↓
QA
  ↓
Review
  ↓
Deploy
  ↓
Demonstrate
  ↓
Submit
  ↓
Maintain
```

The Project Manager coordinates final approval:

```text
Developer Review
  ↓
QA Approval
  ↓
Design Review
  ↓
Project Manager Review
  ↓
Final Release
```

---

# 51. QUICK SYNCHRONIZATION CAPSULE

If an agent only has time to read one section, read this:

- OhmSim is a Next.js + React + TypeScript + Tailwind PWA for electronics e-commerce.
- It has two roles: Buyer and Administrator.
- Frontend Developer 1 owns Buyer UI.
- Frontend Developer 2 owns Admin UI.
- Figma is the visual source of truth.
- The approved handbook is the functional/architectural source of truth.
- The current repo structure is already acceptable; no major reorganization is needed.
- Shared design system/components/types/mocks must be established before large parallel Buyer/Admin work.
- Shared files require coordination; one author + cross-module review.
- Frontend is developed first using typed mock data.
- Do not embed large mock arrays in pages.
- Do not build backend/database logic during frontend-only tasks.
- Do not silently change routes, shared types, design tokens, scope, or architecture.
- Use feature branches and PRs into `development`.
- Never work directly on `main`.
- Do not commit secrets.
- Version 1.0 uses Pickup or Region 3 delivery, COD/Pay on Pickup, and no online payment gateway.
- Delivery is Region 3 only; delivery fee is free at ₱1,000+ and ₱80 below ₱1,000; pickup fee is ₱0.
- Buyers cannot update order status; Administrators can.
- UI work must include responsive behavior and relevant loading/empty/error states.
- A feature is not Done until it is tested/reviewed and matches the approved design.

---

## DOCUMENT MAINTENANCE RULE

Update this file only when a decision materially changes how multiple contributors or agents must work.

Examples that justify an update:

- Route architecture changes
- Design-system convention changes
- Shared type contract changes
- Branch/workflow changes
- Ownership changes
- Technology-stack decision changes
- Version 1.0 scope changes
- Fulfillment/business-rule changes

Small component implementation details should stay in code or feature-specific documentation instead.

**End of synchronization guide.**
