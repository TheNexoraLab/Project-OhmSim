# OhmSim Landing Page — Developer Handoff

**Project:** OhmSim  
**Organization:** NEXORA Labs  
**Current milestone:** Shared Frontend Foundation → Public Landing Page (`/`)  
**Purpose:** Local implementation reference for coding agents that cannot access the Figma Make landing-page file directly.  
**Status:** Design handoff only — **not production implementation code**.

---

## 1. How to use this handoff

This package bridges the approved Figma/Figma Make sources into a repository-local reference. It does **not** replace the project authority hierarchy and it does not authorize architecture changes.

Before implementation, an agent must still inspect:

1. `docs/OHMSIM_AGENT_SYNC.md`
2. the live repository state
3. the approved UI-UX Master Prototype through Figma MCP, when available
4. this handoff package
5. the relevant project specifications/handbook

If these sources disagree on scope, routing, architecture, shared types, or business rules, report the conflict to the Project Manager instead of choosing silently.

### Current implementation sequence

```text
Shared Frontend Foundation
        ↓
Frontend Developer 2 review
        ↓
Merge into development
        ↓
Public Landing Page at /
        ↓
Figma fidelity + responsive + interaction + accessibility review
```

Do **not** skip the Shared Frontend Foundation and build a private landing-only design system.

---

## 2. Approved design sources

### A. Master Prototype — Design System

**URL**  
`https://www.figma.com/design/h0JQGQQkebWjxf9Gn3H0Sz/UI-UX-Master-Prototype?node-id=1-6`

**Key node**  
`28:118` — `OHMSIM — Design System Foundations`

**Use for:**

- canonical semantic colors
- typography
- spacing
- radii
- gradients/effects
- motion
- accessibility foundation

### B. Master Prototype — Components

**URL**  
`https://www.figma.com/design/h0JQGQQkebWjxf9Gn3H0Sz/UI-UX-Master-Prototype?node-id=1-4`

**Key node**  
`32:2` — `OHMSIM — Core Components`

**Use for:**

- reusable component dimensions
- variants and states
- Landing Navbar
- Landing brand lockup
- Category Card
- Trust / Info Item
- Button treatments
- shared component behavior

### C. Approved Landing Page — Figma Make

**URL**  
`https://www.figma.com/make/w7AMRStXGv41YeMidJz9kW/landing-page`

**Use for:**

- page composition
- section order
- landing-page copy
- hero treatment
- decorative background
- screen-specific layout
- landing-specific interactions
- footer content

### Source hierarchy for implementation

```text
Master Prototype / Design System
        ↓
canonical shared tokens and visual foundations

Master Prototype / Components
        ↓
canonical shared component specs and states

Landing Page Figma Make
        ↓
screen-specific composition, content, and behavior
```

If a Make-generated value conflicts with a canonical shared Design System or Components value, use the canonical shared value when the hierarchy clearly resolves it. If the conflict changes the intended visual result and cannot be safely reconciled, report it before implementation.

---

## 3. Canonical visual foundation

### 3.1 Theme

**Catppuccin Mocha** is the approved current visual foundation.

### 3.2 Typography

| Role | Canonical font |
|---|---|
| Production UI / headings / body | **Inter** |
| Technical / numeric / monospace | **JetBrains Mono** |

Do not treat `Bahnschrift`, `DIN Alternate`, `Segoe UI`, or `Outfit` as canonical when they conflict with the Master Prototype. They remain visible in the Make source only as historical/generated reference.

### 3.3 Semantic color tokens

| Role | Value |
|---|---|
| Background | `#11111B` |
| Secondary background | `#181825` |
| Panel | `#1E1E2E` |
| Raised panel | `#313244` |
| High panel | `#45475A` |
| Strong border | `#585B70` |
| Primary text | `#CDD6F4` |
| Muted text | `#BAC2DE` |
| Subtle text | `#A6ADC8` |
| Primary accent | `#89B4FA` |
| Strong accent | `#74C7EC` |
| Secondary accent | `#94E2D5` |
| Success | `#A6E3A1` |
| Warning | `#F9E2AF` |
| Danger | `#F38BA8` |

Soft fills confirmed in the Master Prototype include:

- Accent soft: Blue at 14% (`#89B4FA24` / equivalent alpha)
- Success soft: Green at 14%
- Danger soft: Red at 14%

Use semantic variables/tokens in production components rather than repeating raw values throughout page code.

### 3.4 Typography roles

| Role | Font | Size | Weight | Line height | Tracking |
|---|---|---:|---:|---:|---:|
| Display | Inter | 64px / responsive equivalent | 800 | ~1.05 | -0.04em |
| Page Title | Inter | 28px | 800 | 1.2 | -0.025em |
| Section Title | Inter | 18px | 700 | 1.3 | 0 |
| Body | Inter | 14px | 400 | 1.5 | 0 |
| Label | Inter | 12px | 700 | 1.4 | 0 |
| Caption | Inter | 11px | 500 | 1.4 | 0 |
| Eyebrow | JetBrains Mono | 11px | 700 | 1.2 | 0.12em |
| Metric | JetBrains Mono | 28px | 800 | ~1.15 | -0.04em |
| Mono | JetBrains Mono | 12px | 400 | 18px | 0 |

### 3.5 Spacing

Canonical spacing scale:

`4, 8, 12, 16, 20, 24, 32, 48, 64px`

### 3.6 Radii

| Role | Radius |
|---|---:|
| Small | 8px |
| Control | 12px |
| Panel | 18px |
| Card | 22px |
| Hero / large container | 24px |
| Pill | 999px |

### 3.7 Effects

Canonical treatments include:

- Page gradient: `linear-gradient(180deg, #181825, #11111B)`
- Card gradient: `linear-gradient(145deg, #313244, #1E1E2E)`
- Accent gradient: `linear-gradient(135deg, #89B4FA, #94E2D5)`
- Button gradient: dark raised Mocha surface gradient
- Card shadow: `0 12px 30px rgba(0,0,0,.18)`
- Raised panel shadow: `0 8px 24px rgba(0,0,0,.28)`
- Visible focus outline: 2px accent with 3px offset

### 3.8 Responsive foundation

Canonical design-system breakpoints:

- Mobile: below 768px
- Tablet: 768–1023px
- Desktop: 1024px and above
- Wide: 1200px and above

Maximum content width: 1480px unless a screen-specific composition intentionally uses a narrower reading/layout width.

Do not copy generated `sm`/`md` Tailwind breakpoints from the Make source as if they are automatically canonical. Match the approved responsive behavior.

---

## 4. Relevant Master Prototype components

The VS Code agent should inspect these nodes through the normal Figma Design MCP when possible.

| Component | Node | Notes |
|---|---|---|
| Core Components page | `32:2` | Overall reusable library |
| Button section | `32:40` | Raised, Surface, Outline, Accent; states/sizes |
| Raised Button family | `55:45` | Used by Landing Log In and emphasized actions |
| Category Card | `68:151` | Four category variants + Default/Hover |
| Trust / Info Item | `70:105` | Four landing trust items |
| Brand / OhmSim Landing | `85:54` | Canonical landing brand lockup |
| Landing Navbar | `86:123` | Desktop, Mobile Closed, Mobile Open |

### 4.1 Button sizes

The canonical reusable button system defines:

- Compact: 28px
- Small: 36px
- Default: 44px
- Large: 48px

States:

- Default
- Hover
- Pressed
- Disabled

Do not invent another global button size solely because the Make source contains `46px` landing CTAs. See **Known divergences** below.

### 4.2 Landing Navbar

Master Prototype specification:

- desktop height: 64px
- glass background using Mocha (`rgba(24,24,37,0.82)`)
- backdrop blur: documented as 20px in component description
- desktop horizontal gutter: 32px in reference variant
- links: Catalog, BOM Tool, How to Use, Contact
- desktop link typography: Inter Medium, 14px
- default link: muted text
- hover link: primary text
- Log In: Small Raised button, 36px high
- mobile top bar: 64px
- mobile horizontal gutter: 24px in reference variant
- mobile menu trigger: 36px visual control; ensure the effective interactive target meets accessibility requirements
- mobile open menu: separate raised panel beneath top bar

### 4.3 Category Card

Master Prototype specification:

- 20px padding
- 22px radius
- 1px border
- card gradient + canonical card shadow
- reference width: 292px
- category icon: 40px graphic in a 64px icon box
- title: Inter Bold 20px
- body: Inter Regular 14px
- tag: JetBrains Mono Bold 10px
- Default → neutral border/surface
- Hover → category-accent border, stronger elevation, accent title/icon treatment

Category accents:

- Microcontrollers → primary accent Blue
- Sensors → secondary Teal
- Power ICs → Warning Yellow
- Passives → Success Green

### 4.4 Trust / Info Item

The canonical landing trust component has four fixed item types:

- In-Store Pickup
- Region 3 Delivery
- Verified Authentic
- Live Inventory

Hover changes **only the outer card border** to the item's accent. Do not add unrelated motion or effects.

---

## 5. Landing Page structure and exact copy

Page route: **`/`**  
This is the **public landing page**, not Buyer Home (`/home`).

Canonical section order from the Make source:

```text
Landing Navbar
↓
Hero
↓
Browse by Category
↓
Trust / Info Items
↓
BOM CTA
↓
Footer
```

### 5.1 Landing Navbar

**Brand:** OhmSim landing lockup  
**Links:**

1. Catalog
2. BOM Tool
3. How to Use
4. Contact

**Primary control:** `Log In`

Expected behavior:

- desktop: brand left, four links centered/right, Log In control right
- mobile: brand + menu control
- mobile open: navigation links stacked, Log In action below
- mobile menu must expose an accessible name and keyboard-operable behavior

### 5.2 Hero

**Eyebrow:**

`v2.4.1 — 16,510 active SKUs`

Treat this as approved display/mock copy for the current frontend-only milestone unless PM/product data replaces it later.

**Headline:**

```text
Specialized Electronics
& Component Sourcing
```

Visual emphasis:

- `Electronics` → primary accent
- `Component Sourcing` → secondary accent

**Subheadline:**

> From MCUs to discrete passives — OhmSim stocks the long tail of embedded hardware with verified provenance, live inventory, and BOM-aware pricing.

**Primary CTA:** `Explore Catalog`  
**Secondary CTA:** `Launch BOM Tool`

**Hero stats:**

| Value | Label |
|---|---|
| `16.5K+` | Active SKUs |
| `340+` | Brands |
| `24h` | Order Cut-off |

**Decorative treatment:**

- 32px technical grid pattern in Make source
- restrained blue/teal radial glows
- faint circuit traces/nodes
- decorative elements must be pointer-events none
- honor reduced motion

Use canonical Mocha accent/secondary tokens for decorative color. Do not preserve stale pre-Mocha hard-coded RGB values merely because they remain in generated Make code.

### 5.3 Browse by Category

**Eyebrow:** `COMPONENT CATALOG`

**Heading:** `Browse by Category`

**Supporting copy:**

> Precision-stocked for embedded systems, power electronics, and IoT development.

**Link:** `View full catalog`

#### Category 1 — Microcontrollers

- Tag: `MCU`
- Description: `ARM Cortex, RISC-V, AVR & PIC families from leading fabs`
- Count: `2,840+ SKUs`
- Accent: Blue

#### Category 2 — Sensors

- Tag: `SNS`
- Description: `Temperature, IMU, proximity, environmental & imaging modules`
- Count: `1,560+ SKUs`
- Accent: Teal

#### Category 3 — Power ICs

- Tag: `PWR`
- Description: `LDOs, buck/boost converters, PMICs and gate drivers`
- Count: `3,210+ SKUs`
- Accent: Warning Yellow

#### Category 4 — Passives

- Tag: `PAS`
- Description: `Resistors, capacitors, inductors, crystals & ferrite beads`
- Count: `8,900+ SKUs`
- Accent: Success Green

Each card includes a `Browse` affordance with directional arrow treatment.

### 5.4 Trust / Info section

The Make page places a subtle horizontal divider above the trust items.

| Item | Detail | Accent |
|---|---|---|
| In-Store Pickup | Ready in 2 hours | Blue |
| Region 3 Delivery | 3–5 business days | Teal |
| Verified Authentic | No counterfeit parts | Green |
| Live Inventory | Real-time stock levels | Yellow |

Layout from Make:

- compact screens: 2-column grid
- large screens: 4-column grid

The component hover rule remains: **outer border changes to item accent only**.

### 5.5 BOM CTA

**Eyebrow:** `BOM TOOL — BETA`

**Heading:** `BILL OF MATERIALS`

**Supporting heading:**

```text
Organize your components,
plan your next project.
```

**Body:**

> Create a BOM project, add components from our catalog, adjust quantities, and review estimated costs and stock availability. Transfer your selected components to the shopping cart when you're ready to order.

**CTA:** `Open BOM Tool →`

Treatment:

- centered large container
- 24px hero radius
- card gradient
- strong border
- raised panel shadow
- faint 24px grid overlay
- restrained top radial glow

### 5.6 Footer

**Brand:** same Landing OhmSim lockup

**Copyright:**

`© 2026 OhmSim by NEXORA Labs. All rights reserved.`

**Links:**

- Privacy
- Terms
- Contact

Footer uses a top border and responsive stacked-to-horizontal layout.

---

## 6. Responsive behavior

### Mobile (<768px)

- Navbar becomes mobile top bar + menu panel
- Hero remains centered with reduced horizontal gutter
- Hero CTAs may stack vertically if required for width/touch targets
- Category cards: canonical project breakpoint guidance favors one primary column below 768px; do not blindly inherit the Make source's `sm=640` generated breakpoint
- Trust items retain the landing Make's compact 2-column arrangement where it remains usable
- BOM CTA padding must reduce to prevent overflow
- Footer stacks vertically

### Tablet (768–1023px)

- two-column category layout is appropriate
- navigation behavior must match approved Figma rather than framework defaults
- maintain readable CTA widths and 44px minimum effective touch targets

### Desktop (>=1024px)

- four category cards per row
- four trust items per row
- full landing navbar
- centered bounded content

### Wide (>=1200px)

- preserve intentional maximum widths; do not stretch text/card content unnecessarily

---

## 7. Interaction and accessibility requirements

Implementation must include:

- semantic HTML
- keyboard-operable mobile navigation
- meaningful button/link labels
- visible `:focus-visible` treatment
- minimum 44px effective touch targets
- reduced-motion support
- no color-only status communication where status semantics matter
- no decorative SVG announced to screen readers unless it carries meaning
- real disabled behavior when a disabled state is displayed

Hover-only effects must not be required to understand or use the page.

---

## 8. Implementation mapping for the OhmSim repository

Target stack:

- Next.js
- React
- TypeScript
- Tailwind CSS v4
- shadcn/ui where useful as accessible implementation primitives

### Critical rule

**Do not copy the Figma Make Vite app architecture into the OhmSim repository.**

The Make reference is a high-fidelity design/source artifact. Translate it into the existing project architecture after inspecting the live repository.

Do not:

- replace Next.js with Vite
- add a second app root
- copy `main.tsx`, `vite.config.ts`, or Make package configuration into the repository
- create duplicate global token systems
- hard-code a second Button/Card system inside `app/page.tsx`
- move the repository to `src/`
- install packages merely because the Make prototype used them

### Shared vs landing-specific responsibility

Shared foundation should own, where appropriate:

- semantic color variables
- Inter/JetBrains Mono typography setup
- Button variants
- card primitive/treatment
- focus behavior
- common motion tokens

Landing page should own composition such as:

- hero arrangement
- decorative circuit/grid background
- category section composition
- trust section composition
- BOM promotional composition
- footer composition

Do not introduce a new top-level component architecture without checking the live repository and coordinating with the Project Manager.

### shadcn/ui

shadcn/ui is an implementation primitive, **not** the visual authority. Adapt accessible primitives to the approved OhmSim Figma component appearance and states.

---

## 9. Assets and graphics

The Make `App.tsx` uses **inline SVGs** for:

- landing brand mark
- category icons
- trust/info icons
- hero circuit decoration
- CTA document icon
- arrows

It does not import raster product imagery for this landing page.

For implementation:

1. Prefer the canonical Master Prototype component assets when the Figma Design MCP exposes them.
2. Preserve the approved landing brand geometry and source icons.
3. Do not use temporary `figma.com/api/mcp/asset/...` URLs in production code.
4. Do not substitute unrelated iconography merely for convenience.
5. Store approved static assets in the repository's canonical shared asset location after inspecting existing conventions.

---

## 10. Known divergences between Make and Master Prototype

These are important. The coding agent must **not** silently copy the Make values where the Master Prototype has superseded them.

### 10.1 Typography — resolved

**Make reference:**

- `--font-ui` uses Bahnschrift / DIN Alternate / Segoe UI fallbacks
- Hero explicitly requests Outfit

**Master Prototype:**

- Inter = production UI font
- JetBrains Mono = technical/mono font

**Implementation rule:** use **Inter + JetBrains Mono**.

### 10.2 Navbar glass color — resolved

**Make source:** `rgba(11,17,26,0.82)` — legacy dark navy value.

**Master Landing Navbar:** Mocha background around `rgba(24,24,37,0.82)`.

**Implementation rule:** use the Master Prototype Mocha treatment.

### 10.3 Decorative glow RGB values — resolved by token hierarchy

The Make source retains low-alpha legacy blue/cyan RGB values in decorative glows.

**Implementation rule:** derive decorative glow colors from the canonical Accent/Secondary tokens while preserving restrained opacity/blur.

### 10.4 Shared CTA height — requires implementation-time confirmation

**Make Hero/BOM CTA:** `min-height: 46px`.

**Master Button component sizes:** 28 / 36 / 44 / 48px.

Do **not** add a new global 46px Button size silently. Before finalizing the shared Button mapping, compare the landing CTA visual against the Master Prototype and resolve whether it should use the canonical Default 44px, Large 48px, or remain a screen-specific exception. Surface this if exact fidelity is materially affected.

### 10.5 Generated responsive breakpoints — do not copy mechanically

The Make source uses generated Tailwind `sm`/`md` behavior, including a 640px `sm` transition.

The Master Design System documents 768 / 1024 / 1200 breakpoints.

**Implementation rule:** implement the approved visual behavior, using the project breakpoint system established in the Shared Frontend Foundation.

### 10.6 Make source is Vite — resolved architecturally

The Make package is React + Vite. OhmSim is Next.js.

**Implementation rule:** use the Make source only as reference. Do not port its build/runtime architecture.

---

## 11. Items that are not defined by this handoff

This handoff does **not** authorize decisions about:

- final authentication ownership
- login implementation
- Buyer Home (`/home`)
- Admin screens
- backend/API/database behavior
- real SKU/brand metrics
- live inventory implementation
- final navigation destinations if route contracts are not yet implemented
- larger future Figma files not yet reconciled into the current milestone

For unavailable routes during frontend-first implementation, use the project's agreed temporary navigation convention; do not invent permanent routes.

---

## 12. Landing-page Definition of Done

The landing page should not be considered complete until:

- `/` renders the approved public landing page
- shared foundation is used rather than duplicated
- typography matches Master Prototype (Inter / JetBrains Mono)
- Catppuccin Mocha semantic tokens are used
- desktop/mobile navigation behaves correctly
- all landing sections are present in approved order
- approved copy is preserved unless PM/product explicitly changes it
- hover/focus/pressed behavior matches the approved component system
- responsive layouts are verified at mobile, tablet, desktop
- keyboard operation is verified
- reduced motion is respected
- no temporary Figma asset URLs remain
- lint/typecheck/build checks appropriate to the repo pass
- implementation is visually compared against Figma

---

## 13. Reference files in this package

- `reference/MAKE_SOURCE_REFERENCE.txt` — exact Make `App.tsx` snapshot with a reference-only warning header; stored as non-compilable reference text
- `reference/MAKE_STYLES_REFERENCE.css` — exact Make `index.css` snapshot with a reference-only warning header
- `reference/DESIGN_TOKENS_REFERENCE.css` — canonical Master Prototype token reference for handoff purposes
- `SOURCE_MAP.md` — quick source/node map

The `MAKE_*` files intentionally preserve stale/generated details so an agent can inspect the original screen source. They must **not** be copied wholesale into production.
