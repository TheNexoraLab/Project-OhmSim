# OhmSim Auth UI — implementation review

## Scope and source authority

- Owner: PM implementation agent. Branch: `feature/auth-ui`.
- Starting development commit: `9e5211bf94557d1f81cb7bfe2d9dbc4a6b048895`.
- Route: `/login`, with local Sign In, Create Account, and Forgot Password views.
- The PM's October 2, 2026 assignment explicitly authorizes Create Account and overrides historical login-only discussion for this frontend milestone. Older synchronization-guide phase/ownership notes are not current instructions for this task.
- Sources: PM-supplied `Downloads/src/App.tsx`, `index.css`, `main.tsx`, `Downloads/package.json`, and `imports.zip`; merged production foundation; canonical synchronization guide and relevant handbook context.
- The supplied Vite code is visual/behavioral reference only. No Vite configuration, packages, legacy fonts, or global CSS were copied.
- Visual review is against the supplied export and rendered screenshots, not a live Figma screen. No claim of live Figma pixel fidelity.

## Implementation and shared boundaries

- Added `app/login/page.tsx` for metadata and the public route.
- Added `auth-experience.tsx`, `auth-icons.tsx`, and `auth.module.css` within `app/login/`.
- Reused shared `Button` (Raised/Large 48px) and `Surface` (reset-success panel), Inter, JetBrains Mono, global focus/reduced-motion behavior, and semantic Mocha variables.
- Button styling is a screen-local class: source pill shape, accent border/text, and typography. Shared Button API and source are unchanged.
- `app/_components/navbar.tsx` is the only modified existing application file. Desktop and mobile Log In controls now use Next.js Link to `/login`, styled by the existing `getButtonClasses`. Other landing interactions and styling are unchanged.
- The Auth wordmark links back to `/`. Global skip link resolves to the focusable Auth `main-content` landmark.
- No changes to global CSS, root layout, landing composition, shared primitives, package files, lockfile, Buyer/Admin code, services, or backend.

## Approved assets

- Added `public/auth/ohmsim-emblem.png`, an unchanged copy of `ChatGPT_Image_Aug_15__2026__01_35_24_AM-1.png` from the supplied archive (1536 × 1024).
- Reused `public/logos/ohmsim-logo.png`. It is byte-identical to the Auth import `ChatGPT_Image_Aug_28__2026__11_52_59_PM-2.png`.
- Wordmark SHA-256: `3604661578FB1BD2B2142892948B9B4B0E23388039014AA61A14E51A32443C09`.
- Image transparency, original artwork, and aspect ratios are preserved. No generated substitutes or temporary Figma URLs.
- Form-icon geometry comes from the supplied App.tsx; icons are decorative and controls have accessible names. Circuit traces are adapted to valid responsive SVG coordinates rather than copying unsupported calc() attributes.

## Views and presentation behavior

### Sign In

- WELCOME BACK, large source wordmark, email, password, SIGN IN, Forgot Password?, and Create Account.
- No Remember Me and no role switcher.
- Required email/password checks and simple email-format presentation. Submit displays "Sign-in preview complete. No session was created." It does not navigate to Buyer Home or pretend to authenticate.

### Create Account

- NEW TO OHMSIM, smaller source wordmark, full name, email, +63 contact field, password, and confirm password.
- Frontend checks: nonempty contact, name of at least two trimmed characters, email format, password at least eight characters, matching confirmation. Phone ownership/format verification and account uniqueness are not implemented or claimed.
- Errors include "Invalid email format" and "Passwords do not match". Reviewed valid fields get success styling; name/email/contact can show a decorative check with accessible text.
- Submit displays "Account preview complete. No account was created."

### Forgot Password

- ACCOUNT RECOVERY, source description, email, SEND RESET LINK, and Back to Sign In.
- Valid submission displays the reference "Reset link sent!" and "Check your inbox at <email>" presentation, together with the explicit notice "Prototype state only — no email was sent."
- Per PM review, the developer-only introductory preview/sample-details notice is removed from all three views. PM subsequently approved user-facing instructions: "Sign in to your OhmSim account." and "Create your account to get started with OhmSim." The existing recovery instruction remains unchanged. Submission feedback still accurately discloses the deferred backend behavior.

### Interaction and accessibility

- One active form is mounted at a time; hidden forms cannot receive keyboard focus.
- View switching clears local form state and focuses the new heading. Required/invalid submit focuses the first invalid field.
- Inputs have associated visually hidden labels, aria-invalid, and associated error text. Prefix is included in the contact input's description.
- PM requested no autofill: fields initialize empty, forms/name/email/contact request autocomplete off, and password fields use new-password to avoid requesting saved sign-in credentials. Browsers/password managers may override these hints; saved-profile autofill is not controlled by the application.
- Password and confirmation visibility are independent, with Show/Hide accessible names and aria-pressed.
- Input-wrapper focus styling remains visible; password-toggle buttons retain their own focus treatment and 44px targets.
- Enter submits the active form. Feedback uses role=status. Password values are cleared following successful presentation submissions.
- All state is component-local: no credential logging, storage, cookies, tokens, fetch calls, APIs, or server actions.

## Layout and responsive adaptation

- Desktop: 42% artwork pane, fading divider, remaining form pane, max 420px form width, 48px vertical / 8% left / 10% right padding.
- Full viewport minimum height rather than a clipping fixed height. Long forms and short windows can scroll vertically.
- Fields: minimum 56px height, 16px horizontal padding, 12px icon gap/radius, 14px text. Registration uses 10px field spacing as in the export.
- Background: 40px grid, restrained token-based radial glows/circuit traces. Decorations cannot receive pointer or keyboard interaction.
- Below 768px: simple stacked emblem/form, smaller emblem, safe gutters and bottom inset, no divider. This is a minimal usability adaptation, not a new approved mobile design.
- Exact dedicated mobile Figma: **DEFERRED**.

## Validation

Checks executed against a production build (final preview on port 3103):

| Check | Result |
| --- | --- |
| ESLint | PASS |
| TypeScript `--noEmit --incremental false` | PASS |
| Production build (`/` and `/login` prerendered) | PASS |
| Git whitespace check | PASS |
| Auth browser regression | PASS — 63 assertions |
| Existing landing browser regression | PASS |
| Desktop/mobile rendered screenshots | PASS — inspected for clipping, asset rendering, and layout |

Auth browser checks cover desktop/mobile landing navigation, all three views, required/email/password/mismatch errors, show/hide controls, Enter submission, view focus, input labels, status notices, back navigation, no mutation requests or stored credentials, loaded images, six viewport widths (320/390/768/1024/1440/1920), a short desktop viewport, reduced motion, and browser/runtime errors.

Run with the already-available Playwright installation (no dependency added):

```text
PLAYWRIGHT_MODULE_PATH=<path to existing playwright installation>
LANDING_URL=http://localhost:3103
node tests/ui/auth-ui.browser.mjs
node tests/ui/landing-page.browser.mjs
```

Review images are under `screenshots/`. The existing Next.js warning about an unrelated lockfile in the Windows user directory was left unchanged.

### No-autofill follow-up

After the PM reported saved-browser credentials appearing, removed personal-data autocomplete hints and the current-password hint. Lint, TypeScript, whitespace checks, and all 66 Auth browser assertions passed against the development preview on port 3000. The additional assertions verify initially empty inputs and the new autocomplete attributes; a clean test profile cannot verify every saved-password manager's behavior.

### Introductory copy follow-up

Removed the developer-only preview notice per PM request, preserving the approved form copy without filler. Lint, TypeScript, whitespace checks, and all 84 browser assertions passed on port 3000, including absence of the notice in every view at six viewport widths. Review screenshots were refreshed from this development preview.

PM then approved permanent Sign In and Create Account instructions, rendered using the existing description treatment above the fields. Recovery copy is unchanged. Lint, TypeScript, whitespace checks, and all 102 browser assertions passed, including visibility of the approved instructions across all tested sizes. Screenshots were refreshed again.

## Explicit deferrals and limitations

### Circuit motion follow-up

Per PM request, three subtle blue/teal pulses travel along the existing decorative circuit paths. Following the request to remove the visible motion control, this is a short entrance animation: four seconds per path with small staggered delays, completing within five seconds. It does not loop. Static trace geometry remains unchanged. Reduced-motion preference hides pulses, leaving the static background. No animation dependency, timer loop, backend or global style change. The browser suite covers movement, finite duration, absence of the removed control and reduced-motion behavior.

- Backend authentication, Better Auth, sessions, registration backend, credential verification, reset links, and email delivery: **DEFERRED**.
- Backend integration owner: **Developer 3**, after frontend completion. No backend work or coordination was initiated.
- Frontend validation is presentation only, not security enforcement.
- Dedicated mobile Figma and live Figma comparison: deferred/unavailable for this export-based assignment.
- No new dependencies; package.json and package-lock.json unchanged.
- PM visual/code approval remains required. Do not merge automatically.
