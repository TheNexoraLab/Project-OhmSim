# OhmSim — Frontend Developer 2 (Admin Portal) Onboarding & Execution Guide

**Project:** OhmSim  
**Organization:** NEXORA Labs  
**Role:** Frontend Developer 2 (Admin Portal Specialist)  
**Assigned Milestone:** FE-A01 & FE-A02: Admin Layout Shell, Navigation & Admin Dashboard  
**Integration Branch:** `development`  
**Production Branch:** `main` *(Never commit or pull request to main)*  
**Document Version:** 1.0.0 (Release Baseline: `4006d17`)  

---

## Executive Summary

This document is your prescriptive, step-by-step onboarding guide. As **Frontend Developer 2**, you own the **Administrator Portal** (`app/(admin)/admin/*` and `components/admin/*`). 

Follow these steps in numerical order. You will start by cloning the clean repository baseline, verifying your environment, and building the Admin Shell, Sidebar Navigation, and the Admin Dashboard using existing mock fixtures.

---

## Step 1: Accessing Code vs. Reference Materials

1. **The Codebase is on GitHub:**  
   You will clone the actual working Next.js App Router codebase directly from GitHub. The repository is already clean and synchronized on the `development` branch.
2. **The Handoff ZIP (`OhmSim-Antigravity-Handoff-2026-10-28.zip`) in Discord:**  
   Download and extract this file locally. It contains reference materials:
   - `references/Admin/`: Extracted visual reference code (`ADMIN_SOURCE_REFERENCE.txt`), source maps, and design tokens.
   - `source-pdfs/`: The approved OhmSim Handbook and System Specification.
   - **Warning:** Do NOT commit this ZIP or its extracted contents into Git. It exceeds GitHub's 100 MB hard file limit.

---

## Step 2: System & Tooling Prerequisites

Verify that your machine has the following tools installed and active in your path:
- **Node.js:** v20+ LTS or v24 (run `node -v` to confirm).
- **Git:** Configured with your personal GitHub account credentials.
- **Terminal:** PowerShell, Bash, or Zsh.

---

## Step 3: Repository Cloning & Feature Branch Creation

Clone the repository and branch out from `development`:

```bash
# 1. Clone into a lowercase directory
git clone https://github.com/TheNexoraLab/Project-OhmSim.git project-ohmsim
cd project-ohmsim

# 2. Checkout the integration branch and pull latest changes
git switch development
git pull origin development

# 3. Create your dedicated Admin feature branch
git switch -c feature/admin-shell-and-dashboard
```

---

## Step 4: Clean Dependency Installation & Baseline Verification

Confirm that the existing codebase compiles cleanly without errors:

```bash
# 1. Clean install from lockfile
npm ci

# 2. Verify baseline linting, typechecking, and production build
npm run lint
npx tsc --noEmit
npm run build -- --webpack
```
*All three commands must exit with code 0 before proceeding.*

---

## Step 5: Understanding Strict Architectural Boundaries

To avoid merge conflicts with Frontend Developer 1 (Buyer) and the Backend Developer:
- **DO NOT MODIFY BUYER FILES:** Do not edit anything inside `app/(buyer)/`, `components/buyer/`, `app/login/`, or `app/page.tsx`.
- **DO NOT TOUCH DATABASE OR BACKEND APIS:** Do not edit `prisma/` or `app/api/`.
- **YOUR EXCLUSIVE SCOPE:** 
  - Application routes: `app/(admin)/admin/*`
  - Admin components: `components/admin/*`
  - Shared UI reuse: Reuse `components/ui/*` (`Button`, `Badge`, `Surface`).

---

## Step 6: Design System & Token Alignment

OhmSim uses the **Catppuccin Mocha** dark palette with Inter and JetBrains Mono fonts. Match the approved design tokens:
- **Background Base:** `#11111B` (Base mantle/crust)
- **Panel / Surface:** `#1E1E2E` (Mantle), `#181825` (Crust)
- **Borders / Separators:** `#313244` (Surface0), `#45475A` (Surface1)
- **Primary Accent:** `#89B4FA` (Blue), `#74C7EC` (Sapphire)
- **Secondary Accent:** `#94E2D5` (Teal)
- **Status Semantic Colors:**
  - Success / In-Stock: `#A6E3A1` (Green)
  - Warning / Low-Stock / Pending: `#F9E2AF` (Yellow/Peach)
  - Danger / Cancelled / Out-of-Stock: `#F38BA8` (Red)
  - Processing: `#89B4FA` (Blue)
  - Shipped: `#CBA6F7` (Mauve/Purple)

---

## Step 7: Reusing Shared Data Fixtures & Contracts

Do not create hardcoded mock arrays inside your page files. Import from the established domain fixtures:
- **Orders Fixture:** `import { MOCK_ORDERS } from '@/lib/mocks/orders';`
- **Products Fixture:** `import { MOCK_PRODUCTS } from '@/lib/mocks/products';`
- **Domain Types:**
  - `import type { Order, OrderStatus } from '@/types/order';`
  - `import type { Product } from '@/types/product';`
- **Currency & Date Formatter:** `import { formatCurrency, formatDate } from '@/lib/format';`

---

## Step 8: Implementing the Admin Navigation Sidebar & Topbar

Create `components/admin/admin-sidebar.tsx` and `components/admin/admin-topbar.tsx`.

### Sidebar Navigation Requirements:
1. **Logo:** Brand logo linking to `/admin` with an "Admin" badge indicator.
2. **Navigation Links with Active States:**
   - **Dashboard** &rarr; `/admin`
   - **Products** &rarr; `/admin/products`
   - **Categories** &rarr; `/admin/categories`
   - **Inventory** &rarr; `/admin/inventory`
   - **Orders** &rarr; `/admin/orders`
   - **Customers** &rarr; `/admin/customers`
   - **Support Chat** &rarr; `/admin/chat`
   - **Sales Reports** &rarr; `/admin/reports`
   - **Notifications** &rarr; `/admin/notifications`
   - **Settings** &rarr; `/admin/settings`
3. **Responsive Mobile Support:** Collapsible sidebar on desktop (240px&ndash;260px wide); slide-over drawer on mobile viewports (< 1024px).

---

## Step 9: Implementing the Admin Shell Layout

Create `app/(admin)/admin/layout.tsx` to wrap all admin routes:

```tsx
import React from 'react';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { AdminTopbar } from '@/components/admin/admin-topbar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#11111B] text-[#CDD6F4] flex">
      {/* Desktop & Mobile Responsive Sidebar */}
      <AdminSidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminTopbar />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
```

---

## Step 10: Implementing the Admin Dashboard Page

Create `app/(admin)/admin/page.tsx` containing:

### 1. KPI Summary Cards (Top Row)
- **Total Revenue:** Computed from mock orders (formatted via `formatCurrency`).
- **Active Orders:** Count of orders with status `PENDING` or `PROCESSING`.
- **Low Stock Alerts:** Count of products where `stockQuantity <= minStockThreshold`.
- **Unread Inquiries:** Mock count of pending support chat messages.

### 2. Recent Orders Queue Table
- Display the 5 most recent orders from `MOCK_ORDERS`.
- Columns: Order #, Customer Name, Date, Fulfillment Type (Pickup/Delivery), Total Amount, Status Badge, Action ("View Details").
- Render appropriate semantic status badges:
  - `PENDING`: Yellow/Warning
  - `PROCESSING`: Blue/Info
  - `SHIPPED`: Purple/Mauve
  - `DELIVERED`: Green/Success
  - `CANCELLED`: Red/Danger

### 3. Inventory Health Alert Widget
- Display products approaching or below their minimum stock threshold.
- Columns: SKU, Product Name, Category, Stock Level, Status (`Low Stock` / `Out of Stock`).
- Quick-action button: "Restock" or "Edit Product" shortcut.

### 4. Quick Action Shortcuts
- "Add New Product" &rarr; Links to `/admin/products`
- "Manage Orders" &rarr; Links to `/admin/orders`
- "Inventory Adjustment" &rarr; Links to `/admin/inventory`

---

## Step 11: Quality Assurance & Build Verification Checks

Run all verification checks in your terminal:

```bash
# 1. ESLint verification
npm run lint

# 2. TypeScript compilation check
npx tsc --noEmit

# 3. Production webpack build verification
npm run build -- --webpack
```
*Ensure all three checks exit with 0 errors before proceeding to Step 12.*

---

## Step 12: Git Commit & Branch Push

Stage only your Admin files:

```bash
# Stage your admin components and routes
git add app/(admin)/ components/admin/

# Commit using conventional commits format
git commit -m "feat(admin): implement admin layout shell, navigation, and dashboard (FE-A01, FE-A02)"

# Push feature branch to GitHub
git push -u origin feature/admin-shell-and-dashboard
```

---

## Step 13: Creating the GitHub Pull Request

1. Navigate to: `https://github.com/TheNexoraLab/Project-OhmSim`
2. Open a Pull Request:
   - **Base Branch:** `development` *(NEVER target `main`)*
   - **Compare Branch:** `feature/admin-shell-and-dashboard`
   - **Title:** `feat(admin): admin shell layout, navigation, and dashboard (FE-A01, FE-A02)`
3. **PR Description Requirements:**
   - Attach screenshots of desktop (1440px) and mobile (390px) views of the Admin Dashboard and Sidebar.
   - Confirm `npm run lint` and `npm run build` passed with code 0.
   - Tag Project Manager: `@GH-dvniel` for review.

---

## Step 14: Roadmap Preview (Subsequent Admin Milestones)

Once this PR is merged into `development`, your subsequent assignments are:
- **Milestone FE-A03:** Admin Order Management (`/admin/orders`) with status transitions and fulfillment tracking.
- **Milestone FE-A04:** Product & Category Management (`/admin/products`, `/admin/categories`) with Add/Edit modals.
- **Milestone FE-A05:** Inventory Management (`/admin/inventory`) with quick-adjust stock modals.
- **Milestone FE-A06:** Customer Support Chat responder (`/admin/chat`) and Sales Reports (`/admin/reports`).
