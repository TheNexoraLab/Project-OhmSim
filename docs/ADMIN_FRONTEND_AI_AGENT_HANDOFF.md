# OhmSim — Frontend Developer 2 (Admin Portal) AI Agent Handoff

**Project:** OhmSim (Electronics E-Commerce PWA)  
**Organization:** NEXORA Labs  
**Target:** AI Coding Assistant (Antigravity, Cursor, Claude Code, GitHub Copilot)  
**Human Contributor:** Frontend Developer 2  
**Assigned Milestone:** FE-A01 & FE-A02: Admin Shell Layout, Navigation & Dashboard  
**Integration Branch:** `development`  
**Production Branch:** `main` *(Strictly Protected)*  
**Current Baseline Commit:** `4006d17`  

---

## Instructions for the Human Developer

You do not need to explain the project architecture to your AI agent. **Simply attach or paste Section 1 (Master Agent Prompt) into your AI coding assistant.** It contains all constraints, data fixture contracts, design tokens, and file targets needed for autonomous execution.

---

# SECTION 1: MASTER AI AGENT PROMPT
*(Copy and paste everything below into your AI Coding Agent)*

```markdown
You are assisting as Frontend Developer 2 for OhmSim by NEXORA Labs, an electronics e-commerce PWA.
You are continuing development on an existing Next.js App Router repository.

### 1. REPOSITORY BASELINE & WORKFLOW
- Git Repository: https://github.com/TheNexoraLab/Project-OhmSim.git
- Baseline Commit: 4006d17 (Release PR #10)
- Current Integration Branch: development
- Target Feature Branch: feature/admin-shell-and-dashboard
- Framework: Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS v4.

RULES:
1. Always branch from 'development'. Never commit or open pull requests to 'main'.
2. Do not install new third-party packages unless strictly necessary. Recharts/chart libraries are not approved for this milestone; build clean CSS/SVG charts or summary progress bars.
3. Keep the build passing at all times. Before concluding your task, verify:
   npm run lint
   npx tsc --noEmit
   npm run build -- --webpack

### 2. STRICT SCOPE & BOUNDARIES (DO NOT TOUCH)
- OFF-LIMITS: Do not modify any files in app/(buyer)/*, components/buyer/*, app/login/*, app/(policies)/*, or app/page.tsx. These are owned by Frontend Developer 1.
- OFF-LIMITS: Do not modify database or backend files in prisma/* or app/api/*. These are owned by the Backend Developer.
- OFF-LIMITS: Do not overwrite or delete existing mock services in lib/mocks/* or services/*.
- YOUR EXCLUSIVE SCOPE:
  - app/(admin)/admin/layout.tsx
  - app/(admin)/admin/page.tsx
  - components/admin/admin-sidebar.tsx
  - components/admin/admin-topbar.tsx
  - components/admin/admin-kpi-card.tsx (or similar component breakdowns)
  - Reusing components/ui/* (Button, Badge, Surface)

### 3. DESIGN SYSTEM & TOKENS (Catppuccin Mocha)
OhmSim utilizes a dark engineering terminal aesthetic:
- Background Base: #11111B (Crust / Base)
- Panel / Surface: #1E1E2E (Mantle), #181825 (Crust)
- Borders / Outlines: #313244 (Surface0), #45475A (Surface1)
- Text Colors: #CDD6F4 (Primary Text), #BAC2DE (Subtext), #A6ADC8 (Muted)
- Accent Blue: #89B4FA (Primary), #74C7EC (Sapphire)
- Accent Secondary: #94E2D5 (Teal)
- Status Semantic Colors:
  - PENDING: Warning Yellow (#F9E2AF, bg rgba(249,226,175,0.12))
  - PROCESSING: Accent Blue (#89B4FA, bg rgba(137,180,250,0.12))
  - SHIPPED: Mauve Purple (#CBA6F7, bg rgba(203,166,247,0.12))
  - DELIVERED: Success Green (#A6E3A1, bg rgba(166,227,161,0.12))
  - CANCELLED: Danger Red (#F38BA8, bg rgba(243,139,168,0.12))
- Fonts: Inter (sans) and JetBrains Mono (mono).

### 4. DATA SOURCES & CONTRACTS
Do not write hardcoded mock arrays inside page files. Import directly from existing project fixtures:
- Orders: import { MOCK_ORDERS } from '@/lib/mocks/orders';
- Products: import { MOCK_PRODUCTS } from '@/lib/mocks/products';
- Types: import type { Order, OrderStatus } from '@/types/order';
- Types: import type { Product } from '@/types/product';
- Formatting: import { formatCurrency, formatDate } from '@/lib/format';

### 5. IMPLEMENTATION SPECIFICATIONS

#### Task A: Admin Navigation & Shell Layout (FE-A01)
1. components/admin/admin-sidebar.tsx:
   - Sidebar header: OhmSim logo with a distinct 'ADMIN' badge.
   - All 10 navigation links with active pathname matching (use usePathname()):
     1. Dashboard: /admin
     2. Products: /admin/products
     3. Categories: /admin/categories
     4. Inventory: /admin/inventory
     5. Orders: /admin/orders
     6. Customers: /admin/customers
     7. Support Chat: /admin/chat
     8. Sales Reports: /admin/reports
     9. Notifications: /admin/notifications
     10. Settings: /admin/settings
   - Active state: background rgba(137, 180, 250, 0.14), text #89B4FA, border-left: 3px solid #89B4FA.
   - Desktop: Persistent 250px sidebar.
   - Mobile (< 1024px): Slide-over drawer toggled via mobile hamburger button in topbar.
2. components/admin/admin-topbar.tsx:
   - Breadcrumb / current section title.
   - Storefront link: 'View Storefront' -> links to /home (target='_blank').
   - Admin profile chip: 'Admin Nexora' with avatar/badge and simulated logout.
3. app/(admin)/admin/layout.tsx:
   - Compose AdminSidebar, AdminTopbar, and {children} in a responsive flex shell.

#### Task B: Admin Dashboard Page (FE-A02)
Create app/(admin)/admin/page.tsx:
1. Top KPI Summary Grid (4 Cards):
   - Card 1: Total Revenue (Sum of MOCK_ORDERS totalAmount, formatted with formatCurrency).
   - Card 2: Active Orders (Count of orders where status is PENDING or PROCESSING).
   - Card 3: Low Stock Alerts (Count of products where stockQuantity <= minStockThreshold).
   - Card 4: Unread Inquiries (Mock metric: e.g. 3 unread support tickets).
2. Recent Orders Queue Table:
   - Take the 5 most recent orders from MOCK_ORDERS.
   - Columns: Order ID, Customer Name, Date (formatDate), Fulfillment (Pickup/Delivery), Amount (formatCurrency), Status (Color-coded badge), Action ('View' button).
3. Low Stock Alert Panel:
   - Filter MOCK_PRODUCTS for items with stockQuantity <= minStockThreshold.
   - Display SKU, Product Name, Current Stock vs Minimum Threshold bar/tag, and quick 'Restock' action shortcut.
4. Quick Actions Panel:
   - Action buttons linking to: 'Add Product' (/admin/products), 'Review Orders' (/admin/orders), 'Adjust Inventory' (/admin/inventory).

### 6. VERIFICATION GATE
Once implementation is complete, run:
1. npm run lint
2. npx tsc --noEmit
3. npm run build -- --webpack

Report all created files, screenshots/browser verification results, and confirm zero errors.
```

---

## Section 2: Expected File Tree After Milestone Completion

```text
project-ohmsim/
├── app/
│   └── (admin)/
│       └── admin/
│           ├── layout.tsx         <-- Admin Shell Layout (NEW)
│           ├── page.tsx           <-- Admin Dashboard Page (NEW)
│           ├── products/
│           ├── categories/
│           ├── inventory/
│           ├── orders/
│           ├── customers/
│           ├── chat/
│           ├── reports/
│           ├── notifications/
│           └── settings/
└── components/
    └── admin/
        ├── admin-sidebar.tsx      <-- Navigation Sidebar (NEW)
        ├── admin-topbar.tsx       <-- Topbar & Header (NEW)
        └── admin-kpi-card.tsx     <-- Reusable Metric Card (NEW)
```

---

## Section 3: Acceptance Criteria & PR Review Checklist

Before approving the pull request into `development`, the Project Manager will verify:
- [ ] Clean build with `npm run build -- --webpack` (Exit Code 0).
- [ ] No changes made to `app/(buyer)/`, `components/buyer/`, or `prisma/`.
- [ ] Sidebar highlights current active tab accurately on navigation.
- [ ] Responsive drawer works smoothly on mobile viewports (390px).
- [ ] KPI cards and Recent Orders table correctly derive data from `MOCK_ORDERS` and `MOCK_PRODUCTS`.
- [ ] Status badges accurately reflect the Catppuccin Mocha semantic palette.
