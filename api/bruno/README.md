# OhmSim API Collection (Bruno)

This folder contains the official **Bruno** ([usebruno.com](https://www.usebruno.com)) API test collection and specification for the **OhmSim** Electronics E-Commerce platform.

Unlike proprietary workspace formats, Bruno stores API requests as plain-text `.bru` files directly inside Git, allowing our team and evaluators to version control, review, and test all backend REST APIs.

---

## 📂 Collection Structure

| Folder | Endpoints Covered | Description |
| :--- | :--- | :--- |
| **`auth/`** | `POST /api/auth/login`<br>`POST /api/auth/register`<br>`GET /api/auth/me`<br>`GET /api/auth/google`<br>`POST /api/auth/logout` | Session management, credentials authentication, and Google OAuth via Neon Auth. |
| **`products/`** | `GET /api/products`<br>`GET /api/products/[id]`<br>`GET /api/categories` | Catalog lookup, full-text search, and category taxonomy. |
| **`inventory/`** | `GET /api/inventory`<br>`PATCH /api/inventory` | Live warehouse stock tracking, restocking (`ADD`), and physical count audits (`SET`). |
| **`orders/`** | `GET /api/orders`<br>`POST /api/orders`<br>`GET /api/orders/[id]`<br>`PATCH /api/orders/[id]`<br>`POST /api/payment/simulate` | Order creation (COD / Lab Pickup), courier dispatch, and mock payment webhooks (GCash / Maya). |
| **`bom/`** | `GET /api/bom`<br>`POST /api/bom`<br>`GET /api/bom/[id]`<br>`POST /api/bom/[id]/items` | Bill of Materials (BOM) project workspaces, component matching, and budgeting. |
| **`cart/`** | `GET /api/products?ids=...` | Batch cart validation and stock availability verification. |
| **`chat/`** | `GET /api/conversations`<br>`POST /api/conversations/[id]/messages` | Real-time buyer support messaging and order inquiry dispatch. |
| **`notifications/`** | `GET /api/notifications`<br>`PATCH /api/notifications` | Order status alerts and administrative broadcast notifications. |
| **`reports/`** | `GET /api/admin/reports` | Sales analytics, gross telemetry, and Central Luzon courier liquidation ledgers. |

---

## 🚀 How to Open in Bruno

1. Download and install **Bruno** from [usebruno.com/downloads](https://www.usebruno.com/downloads).
2. Launch Bruno and click **"Open Collection"**.
3. Select the `api/bruno` folder from this repository.
4. Select the **`Local`** environment from the top-right environment dropdown (points to `http://localhost:3000`).
5. Run your Next.js development server:
   ```bash
   npm run dev
   ```
6. Send any request in the collection to inspect live JSON responses!

---

## 🛡️ Authentication & Cookies
- Protected routes automatically receive the signed `ohmsim_session` HTTP-only cookie after executing `auth/sign-in.bru` or `auth/register.bru`.
- Bruno automatically stores and includes cookies across requests in the collection.
