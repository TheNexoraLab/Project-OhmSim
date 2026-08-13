# OhmSim Project Handoff

This document is the manager-to-development-agent handoff for the OhmSim repository. Send it together with the OhmSim Product Design & Development Handbook PDF.

## 1. Project identity

- Product: **OhmSim**
- Repository: `https://github.com/TheNexoraLab/Project-OhmSim.git`
- Local folder convention: `project-ohmsim` (lowercase because npm package names cannot contain capital letters)
- Framework: Next.js App Router
- Language: TypeScript
- Styling: Tailwind CSS v4
- Package manager: npm
- Current integration branch: `development`
- Production/release branch: `main`

The GitHub repository may keep the name `Project-OhmSim`; only the local folder and npm package name use lowercase.

## 2. Current repository status

The repository is currently synchronized and clean on `development`.

Completed and merged:

1. **Project setup** (`feature/project-setup`, PR #1)
   - Created the Next.js application.
   - Added TypeScript, ESLint, Tailwind CSS, App Router, and npm configuration.

2. **Project structure** (`feature/project-structure`, PR #2)
   - Added the handbook-based application folders.
   - Added `.gitkeep` placeholders so empty folders are retained by Git.

The commits are already included in `development`. The old feature branches can be deleted from GitHub after confirming the PRs are merged; deleting them does not delete their commits from `development`.

## 3. What is functional right now

The current application is still the default Next.js starter application:

- `/` renders the generated starter page.
- `app/layout.tsx` provides the root layout.
- `app/globals.css` provides the generated global stylesheet.
- The project can be linted, built, and run locally.

Verified commands:

```powershell
npm run lint
npm run build
```

## 4. What is intentionally not implemented

No OhmSim product features have been implemented yet. The following are only planned folders/placeholders:

- Authentication and authorization
- Buyer product catalog
- Categories and inventory
- Cart and bill of materials (BOM)
- Checkout and orders
- Chat and notifications
- Administrator dashboard and reports
- Database schema and migrations
- API route handlers
- Real-time communication
- Testing suites
- Security, deployment, monitoring, and handover documentation

A folder is not a working route in Next.js until it contains an appropriate `page.tsx`, `layout.tsx`, or API `route.ts` file.

## 5. Current architecture

```text
project-ohmsim/
├── app/
│   ├── (buyer)/
│   │   ├── home/
│   │   ├── products/
│   │   ├── products/[id]/
│   │   ├── cart/
│   │   ├── bom/
│   │   ├── checkout/
│   │   ├── orders/
│   │   ├── orders/[id]/
│   │   ├── chat/
│   │   ├── notifications/
│   │   ├── profile/
│   │   └── settings/
│   ├── (admin)/
│   │   └── admin/
│   │       ├── products/
│   │       ├── categories/
│   │       ├── inventory/
│   │       ├── orders/
│   │       ├── customers/
│   │       ├── chat/
│   │       ├── reports/
│   │       ├── notifications/
│   │       └── settings/
│   ├── api/
│   │   ├── auth/
│   │   ├── products/
│   │   ├── categories/
│   │   ├── cart/
│   │   ├── bom/
│   │   ├── orders/
│   │   ├── inventory/
│   │   ├── customers/
│   │   ├── conversations/
│   │   ├── notifications/
│   │   └── admin/
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
├── prisma/
│   └── migrations/
├── public/
│   ├── images/
│   └── icons/
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── api/
│   ├── ui/
│   ├── security/
│   └── regression/
├── api/
│   └── bruno/
├── docs/
├── AGENTS.md
├── CLAUDE.md
├── package.json
├── next.config.ts
├── postcss.config.mjs
├── tsconfig.json
└── README.md
```

`(buyer)` and `(admin)` are Next.js route groups. Their names are organizational and are not included in the URL. For example, a page inside `app/(buyer)/products/page.tsx` will be available at `/products`.

## 6. Development branch workflow

Do not commit application work directly to `main` or `development`.

```text
development
    ↓ branch
feature/<work-name>
    ↓ commit and push
pull request: feature/<work-name> → development
    ↓ review and merge
development
```

Start every task from the latest `development` branch:

```powershell
git fetch origin
git switch development
git pull --ff-only origin development
git switch -c feature/<work-name>
```

Use descriptive branch names, for example:

```text
feature/database-prisma
feature/authentication
feature/catalog-and-inventory
feature/cart-and-bom
feature/checkout-and-orders
feature/chat-and-notifications
feature/admin-dashboard
feature/testing
feature/security-and-deployment
```

Before opening a pull request:

```powershell
npm run lint
npm run build
git status
git add .
git commit -m "feat: describe the completed change"
git push -u origin feature/<work-name>
```

Pull requests must target `development`, not `main`, unless the team is intentionally preparing a release.

## 7. Recommended implementation order

Use the handbook as the product source of truth and implement in dependency order:

1. Confirm UI/UX decisions and shared design tokens.
2. Define Prisma database schema and migrations.
3. Implement authentication, sessions, roles, and permissions.
4. Establish validation, service, and API conventions.
5. Implement products, categories, and inventory.
6. Implement cart and BOM workflows.
7. Implement checkout and order lifecycle.
8. Implement chat and notifications.
9. Implement administrator pages, reports, and customer management.
10. Add unit, integration, API, UI, security, and regression tests.
11. Complete deployment, monitoring, security, documentation, and handover requirements.

Do not create empty fake implementation files merely to make the tree look complete. Add files when their behavior is being implemented and tested.

## 8. Handbook mapping

The supplied handbook contains 20 chapters. The most relevant implementation references are:

- Chapters 1–8: product definition, requirements, users, UI/UX, and application behavior
- Chapter 9: system architecture
- Chapter 10: database design
- Chapter 11: API design and integration
- Chapter 12: UI component library and design system
- Chapter 13: development and Git workflow
- Chapter 14: testing strategy
- Chapter 15: deployment and release
- Chapter 16: security and data protection
- Chapter 17: maintenance, monitoring, and handover
- Chapter 18: user manual and operations
- Chapter 19: technical documentation
- Chapter 20: completion criteria and final standards

When the handbook and an implementation assumption conflict, raise the conflict for project-manager approval before changing the architecture.

## 9. Repository rules

- Read `AGENTS.md` before modifying Next.js code. It requires checking the relevant Next.js documentation under `node_modules/next/dist/docs/`.
- Keep secrets out of Git. Use `.env.local` for local values and update `.env.example` with safe placeholder names only.
- Do not commit `node_modules`, `.next`, generated build output, or real credentials.
- Use TypeScript and the existing `@/*` import alias.
- Keep buyer and administrator concerns separated in their route groups and component folders.
- Reuse shared components instead of creating duplicate UI implementations.
- Every new route or API endpoint needs appropriate validation, loading/error behavior, and tests.
- Run lint and build before opening a pull request.

## 10. First handoff task for a developer

The first developer task should be chosen from the handbook and written as a focused issue. A good first implementation task is the database foundation or the approved UI design system—not a collection of unrelated placeholder files.

The developer should:

1. Start from the latest `development`.
2. Create one focused feature branch.
3. Confirm the relevant handbook chapter and acceptance criteria.
4. Implement the smallest complete, testable slice.
5. Run lint/build/tests.
6. Open a pull request into `development`.

This document describes the current state; it does not replace the handbook’s product requirements or acceptance criteria.
