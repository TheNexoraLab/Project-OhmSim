# OhmSim — Backend Developer Complete Onboarding & Execution Guide

**Project:** OhmSim  
**Organization:** NEXORA Labs  
**Role:** Backend Developer  
**Assigned Milestone:** BE-01: Database Foundation, Prisma Schema & Seed  
**Integration Branch:** `development`  
**Production Branch:** `main` *(Never commit or pull request to main)*  
**Document Version:** 1.1.0 (Release Baseline: `4006d17`)  

---

## Executive Summary

This guide provides an end-to-end, prescriptive onboarding manual for the OhmSim Backend Developer. Every prerequisite, command, schema definition, boundary condition, and verification step is detailed below with explicit step numbers.

Follow these steps in numerical order without skipping. Do not alter existing frontend components, routes, or mock services during this phase.

---

## Step 1: Accessing Code vs. Reference Materials

1. **The Codebase is on GitHub:**  
   You will clone the actual working Next.js App Router codebase directly from GitHub. The repository is already clean and synchronized on the `development` branch.
2. **The Handoff ZIP (`OhmSim-Antigravity-Handoff-2026-10-28.zip`) in Discord:**  
   Download and extract this file locally. It contains reference-only materials:
   - `source-pdfs/`: The approved OhmSim Handbook, System Specification, and UI/UX Flowbook.
   - `references/`: Extracted data models, prototypes, and field mappings.
   - **Warning:** Do NOT commit this ZIP or its extracted contents into Git. It exceeds GitHub's 100 MB hard file limit.

---

## Step 2: System & Tooling Prerequisites

Ensure your development machine has the following installed and verified:
- **Node.js:** v20+ LTS or v24 (run `node -v` to confirm).
- **PostgreSQL Database:** A running PostgreSQL instance (v15+) locally or a serverless PostgreSQL instance (such as [Neon](https://neon.tech)).
- **Git:** Configured with your GitHub account credentials.
- **Terminal:** PowerShell, Bash, or Zsh.

---

## Step 3: Repository Cloning & Feature Branch Creation

Clone the repository and branch out from `development`:

```bash
# 1. Clone repository into a lowercase directory
git clone https://github.com/TheNexoraLab/Project-OhmSim.git project-ohmsim
cd project-ohmsim

# 2. Checkout the integration branch and pull the latest code
git switch development
git pull origin development

# 3. Create your dedicated backend feature branch
git switch -c feature/backend-database-foundation
```

---

## Step 4: Clean Dependency Installation & Baseline Verification

Confirm that the repository compiles cleanly before making any changes:

```bash
# 1. Clean installation from lockfile
npm ci

# 2. Verify baseline linting, typechecking, and production build
npm run lint
npx tsc --noEmit
npm run build -- --webpack
```
*All three commands must exit with code 0 before proceeding.*

---

## Step 5: Local Environment Configuration (`.env.local`)

In the root of `project-ohmsim`, create a `.env.local` file (this file is excluded from Git via `.gitignore`):

```env
# PostgreSQL connection string
DATABASE_URL="postgresql://<USER>:<PASSWORD>@<HOST>:<PORT>/<DATABASE>?schema=public"

# Environment Mode
NODE_ENV="development"
```

> **PRO-TIP (Zero-Config Database):**  
> If you do not have PostgreSQL installed locally, do **not** spend hours configuring local database servers. Create a free serverless PostgreSQL database on **[Neon](https://neon.tech)** in 30 seconds, copy the provided pooled connection string, and paste it directly into `DATABASE_URL`.  
> *If you use a local PostgreSQL server, ensure you run `CREATE DATABASE ohmsim;` in psql/pgAdmin before proceeding to Step 12.*

---

## Step 6: Understanding Strict Architectural Boundaries

The frontend has already been built through Batches 1–4 and operates on synchronous typed mock services.
- **DO NOT MODIFY FRONTEND FILES:** Do not edit anything inside `app/(buyer)/`, `app/(admin)/`, `components/`, or `app/login/`.
- **DO NOT MODIFY EXISTING MOCK SERVICES:** Files in `lib/mocks/` and `services/` serve the frontend demo and automated test suites. Build the real database layer alongside them without deleting them.
- **HONOR FULFILLMENT SPECIFICATION (`docs/FULFILLMENT_AND_DELIVERY_SPEC.md`):**
  - Fulfillment options: `PICKUP` (₱0 fee) or `DELIVERY` (Restricted to Region III only).
  - Shipping fee rule: Free shipping for orders ₱1,000 and above; ₱80 shipping fee for orders below ₱1,000.
  - Payment methods: `COD` (Cash on Delivery) or `PAY_ON_PICKUP`. No online payment gateways in v1.0.

---

## Step 7: Understanding Shared Domain Contracts (`types/`)

Your database models must strictly match the existing TypeScript domain interfaces:
- `types/product.ts`: `Product`, `Category`, `ProductSpecification`
- `types/order.ts`: `Order`, `OrderItem`, `OrderStatus`, `FulfillmentType`, `PaymentMethod`
- `types/profile.ts`: `UserProfile`, `Address`
- `types/chat.ts`: `Conversation`, `ChatMessage`
- `types/notification.ts`: `Notification`

---

## Step 8: Installing Prisma & Developer Dependencies

Install stable Prisma ORM (v6 LTS), Prisma Client, and `tsx` (TypeScript execution engine for seeding):

```bash
npm install @prisma/client@6
npm install -D prisma@6 tsx
```

---

## Step 9: Defining the Complete Prisma Schema (`prisma/schema.prisma`)

Create or update `prisma/schema.prisma` with the following comprehensive domain models:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ----------------------------------------------------
// 1. USER & AUTHENTICATION
// ----------------------------------------------------
enum Role {
  BUYER
  ADMIN
}

model User {
  id            String         @id @default(uuid())
  email         String         @unique
  passwordHash  String
  role          Role           @default(BUYER)
  firstName     String
  lastName      String
  phone         String?
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  addresses     Address[]
  orders        Order[]
  bomProjects   BOMProject[]
  notifications Notification[]
  messages      Message[]
  conversations Conversation[]
}

model Address {
  id            String   @id @default(uuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  label         String   // e.g., "Home", "Campus Lab"
  recipientName String
  phone         String
  street        String
  barangay      String
  city          String
  province      String   // Version 1.0 fulfillment restricted to Region III
  postalCode    String
  isDefault     Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  orders        Order[]
}

// ----------------------------------------------------
// 2. CATALOG & INVENTORY
// ----------------------------------------------------
model Category {
  id          String    @id @default(uuid())
  name        String
  slug        String    @unique
  description String?
  icon        String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  products    Product[]
}

model Product {
  id                String       @id @default(uuid())
  sku               String       @unique
  name              String
  brand             String
  categoryId        String
  category          Category     @relation(fields: [categoryId], references: [id])
  price             Decimal      @db.Decimal(10, 2)
  stockQuantity     Int          @default(0)
  minStockThreshold Int          @default(5)
  isFeatured        Boolean      @default(false)
  shortDescription  String
  fullDescription   String
  datasheetUrl      String?
  imageUrls         String[]
  specifications    Json?        // Key-value pairs of technical parameters
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt

  orderItems        OrderItem[]
  bomItems          BOMItem[]
}

// ----------------------------------------------------
// 3. ORDERS & FULFILLMENT
// ----------------------------------------------------
enum OrderStatus {
  PENDING
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}

enum FulfillmentType {
  PICKUP
  DELIVERY
}

enum PaymentMethod {
  COD
  PAY_ON_PICKUP
}

model Order {
  id                String          @id @default(uuid())
  orderNumber       String          @unique // e.g., "ORD-2026-0001"
  userId            String
  user              User            @relation(fields: [userId], references: [id])
  status            OrderStatus     @default(PENDING)
  fulfillmentType   FulfillmentType
  deliveryAddressId String?
  deliveryAddress   Address?        @relation(fields: [deliveryAddressId], references: [id])
  paymentMethod     PaymentMethod
  subtotal          Decimal         @db.Decimal(10, 2)
  shippingFee       Decimal         @db.Decimal(10, 2) @default(0.00) // ₱0 pickup; ₱80 or ₱0 Region III
  totalAmount       Decimal         @db.Decimal(10, 2)
  trackingNumber    String?
  notes             String?
  cancelledReason   String?
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  items             OrderItem[]
}

model OrderItem {
  id           String      @id @default(uuid())
  orderId      String
  order        Order       @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId    String
  product      Product     @relation(fields: [productId], references: [id])
  quantity     Int
  unitPrice    Decimal     @db.Decimal(10, 2)
  bomProjectId String?
  bomProject   BOMProject? @relation(fields: [bomProjectId], references: [id])
}

// ----------------------------------------------------
// 4. BILL OF MATERIALS (BOM)
// ----------------------------------------------------
model BOMProject {
  id           String      @id @default(uuid())
  userId       String
  user         User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  name         String
  description  String?
  targetBudget Decimal?    @db.Decimal(10, 2)
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt

  items        BOMItem[]
  orderItems   OrderItem[]
}

model BOMItem {
  id                  String     @id @default(uuid())
  bomProjectId        String
  bomProject          BOMProject @relation(fields: [bomProjectId], references: [id], onDelete: Cascade)
  productId           String
  product             Product    @relation(fields: [productId], references: [id])
  quantity            Int        @default(1)
  referenceDesignator String?    // e.g., "R1, C2"
}

// ----------------------------------------------------
// 5. CHAT & NOTIFICATIONS
// ----------------------------------------------------
enum ConversationStatus {
  ACTIVE
  RESOLVED
}

model Conversation {
  id        String             @id @default(uuid())
  buyerId   String
  buyer     User               @relation(fields: [buyerId], references: [id])
  status    ConversationStatus @default(ACTIVE)
  createdAt DateTime           @default(now())
  updatedAt DateTime           @updatedAt

  messages  Message[]
}

model Message {
  id             String       @id @default(uuid())
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  senderId       String
  sender         User         @relation(fields: [senderId], references: [id])
  senderRole     Role
  text           String
  attachmentUrl  String?
  createdAt      DateTime     @default(now())
}

model Notification {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  title     String
  message   String
  type      String   // "order" | "inventory" | "system" | "chat"
  isRead    Boolean  @default(false)
  link      String?
  createdAt DateTime @default(now())
}
```

---

## Step 10: Implementing Singleton Prisma Client (`lib/prisma/client.ts`)

Create `lib/prisma/client.ts` to maintain a single connection pool during Next.js development hot-reloads:

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

---

## Step 11: Implementing Database Seed Script (`prisma/seed.ts`)

Create `prisma/seed.ts` to populate initial database records using existing project fixtures (`lib/mocks/products.ts` and `lib/mocks/addresses.ts`):

```typescript
import { PrismaClient, Role, OrderStatus, FulfillmentType, PaymentMethod } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding OhmSim Database ---');

  // 1. Seed Demo Admin & Buyer
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ohmsim.nexora.ph' },
    update: {},
    create: {
      email: 'admin@ohmsim.nexora.ph',
      passwordHash: '$2b$10$epNzYIeU9j1FvXoX5u8gCeD9Kx6GzK0pZqJ.V3wL1xU.vE3N0n3jO', // Pre-computed demo hash
      role: Role.ADMIN,
      firstName: 'Admin',
      lastName: 'Nexora',
      phone: '+63 917 123 4567',
    },
  });

  const buyer = await prisma.user.upsert({
    where: { email: 'buyer@ohmsim.nexora.ph' },
    update: {},
    create: {
      email: 'buyer@ohmsim.nexora.ph',
      passwordHash: '$2b$10$epNzYIeU9j1FvXoX5u8gCeD9Kx6GzK0pZqJ.V3wL1xU.vE3N0n3jO', // Pre-computed demo hash
      role: Role.BUYER,
      firstName: 'Daniel',
      lastName: 'Cruz',
      phone: '+63 918 987 6543',
    },
  });

  console.log('Seeded users: admin & buyer.');

  // 2. Seed Default Category
  const catMicro = await prisma.category.upsert({
    where: { slug: 'microcontrollers' },
    update: {},
    create: {
      name: 'Microcontrollers & Development Boards',
      slug: 'microcontrollers',
      description: 'Arduino, ESP32, and development hardware boards.',
    },
  });

  // 3. Seed Sample Product
  await prisma.product.upsert({
    where: { sku: 'DEV-ESP32-WROOM' },
    update: {},
    create: {
      sku: 'DEV-ESP32-WROOM',
      name: 'ESP32-WROOM-32D Development Board',
      brand: 'Espressif',
      categoryId: catMicro.id,
      price: 285.00,
      stockQuantity: 120,
      minStockThreshold: 15,
      isFeatured: true,
      shortDescription: 'Dual-core 240MHz Wi-Fi + Bluetooth microcontroller development board.',
      fullDescription: 'ESP32 development board with built-in Wi-Fi, Bluetooth BLE, 448KB ROM, 520KB SRAM.',
      imageUrls: ['/images/esp32.jpg'],
      specifications: {
        'Core Clock': '240 MHz',
        'Wireless': 'Wi-Fi 802.11 b/g/n & BLE 4.2',
        'Input Voltage': '5V via Micro-USB',
      },
    },
  });

  console.log('Seeded catalog products and categories.');
  console.log('--- Seeding Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

> **IMPORTANT: Ignore IDE Type Warnings in Step 11:**  
> Your editor (e.g. VS Code) might display red squiggly lines under `@prisma/client` or `Role`. **This is completely normal.** The Prisma Client types have not been generated yet. They will automatically resolve as soon as you execute Step 12 (`npx prisma migrate dev`). Do not stop or attempt to change code.

### Configure `package.json`
Add the `"prisma"` block at the **root level** of your `package.json` (just above the final closing `}`):

```json
  "devDependencies": {
    ...
  },
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

---

## Step 12: Executing Database Migration & Seeding

Run the migration against your PostgreSQL instance and execute the seed:

```bash
# 1. Format and validate the schema
npx prisma format
npx prisma validate

# 2. Run initial database migration (generates Prisma Client automatically)
npx prisma migrate dev --name init_database_foundation

# 3. Populate database with seed fixtures
npx prisma db seed
```

---

## Step 13: Quality Assurance & Build Verification Checks

Run all repository quality checks before staging any Git commits:

```bash
# 1. Next.js ESLint verification
npm run lint

# 2. TypeScript compilation check
npx tsc --noEmit

# 3. Production webpack build verification
npm run build -- --webpack
```
*Do not proceed to Step 14 until all three pass with zero errors.*

---

## Step 14: Git Commit & Branch Push

Stage only the files related to the backend milestone:

```bash
# Stage database files, client, and package dependencies
git add prisma/ lib/prisma/ package.json package-lock.json

# Commit using conventional commits format
git commit -m "feat(backend): implement Prisma schema, models, client, and initial seed"

# Push feature branch to origin
git push -u origin feature/backend-database-foundation
```

---

## Step 15: Creating the GitHub Pull Request

1. Navigate to: `https://github.com/TheNexoraLab/Project-OhmSim`
2. Open a Pull Request:
   - **Base Branch:** `development` *(NEVER target `main`)*
   - **Compare Branch:** `feature/backend-database-foundation`
   - **Title:** `feat(backend): database foundation and Prisma schema (BE-01)`
3. **Pull Request Description Requirements:**
   - Include terminal output confirming successful `prisma migrate dev` and `prisma db seed`.
   - Confirm `npm run lint` and `npm run build` passed with code 0.
   - Tag Project Manager: `@GH-dvniel` for review.

---

## Step 16: Roadmap Preview (Milestones BE-02 through BE-05)

After Milestone BE-01 is reviewed and merged into `development`, you will execute the remaining backend roadmap:
- **Milestone BE-02:** User Authentication, password hashing (bcrypt), and session/JWT API routes (`POST /api/auth/register`, `POST /api/auth/login`).
- **Milestone BE-03:** Catalog & Inventory API routes (`GET /api/products`, `PATCH /api/inventory`).
- **Milestone BE-04:** Checkout & Atomic Order Processing Transaction (`POST /api/orders`).
- **Milestone BE-05:** Support Chat, User Profile & Notification API routes.
