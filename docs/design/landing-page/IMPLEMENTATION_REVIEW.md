# Public Landing Page — implementation review

## Scope and authority

The Project Manager's September 30, 2026 instruction temporarily supersedes the
separate frontend-developer review/merge gate for this milestone. Implement only
the landing-critical shared foundation, then the public landing page at `/`.
This does not approve further Buyer, Admin, authentication, or backend work.

Implementation follows `LANDING_PAGE_HANDOFF.md`, `SOURCE_MAP.md`, and the local
reference snapshots. Live Figma MCP tools were unavailable during implementation;
the current live Master Prototype was not independently revalidated. Exact
pixel-fidelity approval remains a PM visual-review task.

## Shared foundation included

- Inter and JetBrains Mono through `next/font/google` (self-hosted build output).
- Semantic Catppuccin Mocha variables, spacing, radii, gradients, shadows,
  focus treatment, reduced motion, and 768/1024/1200px responsive boundaries.
- Shared Raised/Outline Button and ButtonLink; Default 44px, Large 48px,
  Small 36px visual surface inside a 44px effective touch target.
- Shared Surface component/treatment.
- No new dependencies, shadcn initialization, domain types, services, or backend.
- Documentation snapshots excluded from Tailwind source scanning; the Make
  reference remains `.txt`, outside TypeScript compilation.

## Composition and reference choices

Navbar → Hero → Categories → Trust information → BOM CTA → Footer.
Approved marketing copy is preserved as mock/display copy, not live inventory.
The category and trust SVG geometry comes from the approved local Make snapshot,
stored under `public/icons/`. A subsequent explicit PM instruction replaces the
composed SVG/text brand with `docs/images/Logo2.png` (originally named
`ChatGPT Image Aug 28, 2026, 11_52_59 PM.png`).
That image is copied unchanged to `public/logos/ohmsim-logo.png` and used in both
the navbar and footer, preserving its aspect ratio and original artwork.
No temporary Figma asset URLs or Vite application architecture are used.

Decisions for PM confirmation:

1. Hero and BOM CTAs use canonical **Large 48px**, rather than the generated
   Make 46px. No additional shared size was invented.
2. Tablet retains the collapsible navbar until the documented desktop boundary
   of **1024px**. Category grids use 1/2/4 columns; trust grids use 2/4 columns.
3. Page sections retain the Make reference's narrower **1280px outer container**,
   below the shared 1480px maximum. The hero content remains bounded at 896px.
4. Composition padding uses the approved spacing scale (or sums of its steps).
   The BOM panel uses 64px/48px desktop padding, rather than Make's 56px/40px.
5. Grid lines are CSS backgrounds; circuit geometry is retained as decorative,
   inaccessible-to-screen-readers SVG using the shared accent variables.

## Temporary interactions (no invented application routes)

- Brand → page top; skip link → main content.
- Catalog / Explore Catalog → category section.
- BOM Tool / Launch BOM Tool → BOM promotional section.
- How to Use → the approved BOM workflow description on this page.
- Category cards, View full catalog, Open BOM Tool, Log In, Contact, Privacy,
  and Terms → explicitly labeled landing-preview notices using native dialogs.
  They do not pretend that future pages or features are implemented.
- Menu: open/close, Escape, outside-pointer dismissal, closes on anchor
  navigation, focus leaving the header, and entering desktop layout.
- Dialog: keyboard dismissal, native modal behavior, close control, and focus
  restoration. Placeholder destinations are isolated in `preview-action.tsx`.

Authentication policy/ownership, cancellation authority, final navigation
destinations, and future Buyer/Admin decisions remain deferred.

## Validation

Final run: lint, TypeScript, production build, diff whitespace checks, and the
browser regression script all passed. The production build prerenders `/`.
All six viewport widths had zero horizontal overflow; both fonts and all eight
sprite icons loaded, with no browser console/page errors. Desktop, tablet,
mobile, mobile menu, and preview-dialog screenshots were visually reviewed
against the local handoff. Trust hover was verified to change only its border.

- `npm run lint`
- `node node_modules/typescript/bin/tsc --noEmit --incremental false`
- `npm run build`
- `git diff --check`
- Production preview on port 3100.
- `tests/ui/landing-page.browser.mjs` checks 320, 390, 768, 1024, 1440, and
  1920px widths, overflow, grid columns, navbar size, font/asset loading,
  menu behavior, preview dialogs, focus restoration, hover, reduced motion,
  and browser errors; it saves review screenshots in a temporary directory.

The browser test uses an existing Playwright installation and Microsoft Edge.
Set `PLAYWRIGHT_MODULE_PATH` to that installation if Playwright is not resolvable
locally, and optionally set `LANDING_URL` (default `http://localhost:3100`).
No Playwright package was added to the application.

Next.js reports an unrelated lockfile in the Windows user directory being ignored.
No global lockfile or repository root configuration was changed to suppress it.
