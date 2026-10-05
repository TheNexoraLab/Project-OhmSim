# Buyer Batch 1 — PM correction pass

Date: October 3, 2026 (Asia/Singapore)

Base handoff: Draft PR #8, `feature/buyer-batch1`, commit `510d67f1b422d5715b448abe1eeb98a6b7580a1d`.

Status: Review 3 code corrections implemented and locally verified. PM authorized committing and pushing this correction pass on October 5, 2026 to update the existing Batch 1 feature branch / Draft PR #8. Merge remains unapproved. No Batch 2 implementation is included in this correction pass. This is scoped validation, not final design, backend, accessibility or release certification.

## Changes

- `hooks/use-cart.tsx`: restored ID-only actions and runtime validation through the existing typed catalog service. Add/set/remaining-stock/can-add reject caller-supplied Product objects and unknown IDs. Quantities and canonical stock must be safe integers; adding requires a positive quantity. Setting zero removes an item; the existing over-stock set behavior caps at canonical stock. Positive quantities for an unavailable product are rejected without creating a zero-quantity line.
- Preserved immediate ref-based validation across queued actions. Removed the redundant post-render ref assignment and unused alternative operation helper, leaving one production action implementation.
- Removed `window.__ohmSimCart` entirely, rather than retaining a development/production diagnostic API.
- `components/buyer/bom-chooser-popover.tsx`: measures the unshifted anchor before each collision calculation, uses an immediate CSS translation independent of entry-transform animation, and recalculates on resize/observed size changes. Initial correction runs before paint. Existing anchored, non-modal behavior and dismissal/focus interactions remain.
- `tests/ui/buyer-batch1.browser.mjs`: asserts actual pointer hit-testing, exact trigger focus, outside-control focus, repeat-trigger dismissal, keyboard/pointer project targeting and quantity totals, client-navigation persistence, open mobile filter child bounds, repeated popover resize, cross-entry card/detail stock limits and live-region feedback. Removes production-global testing calls. Failure exits remain nonzero with browser cleanup.
- Added the standalone `buyer-providers.browser.mjs`, a test-only React fixture and small CommonJS browser bundler using already-installed React/React DOM/TypeScript. They mount the **actual** providers/components, trigger actions through DOM events and inspect rendered state after React commits. The unavailable-stock fixture is injected only into that test bundle's service module, not production fixtures or the production cart API. No Next test route or diagnostic global is deployed.
- Regenerated all 11 Buyer screenshots, including the previously stale desktop open-popover capture. Visually inspected each. Primary six captures are full-page; open-popover/short-height/focus captures show viewport interaction states. Fixed bottom navigation in full-page captures appears at the original viewport boundary; that stitched image alone is not evidence of inaccessible scrolling content.

## Validation performed locally

| Check | Result |
| --- | --- |
| `npm run lint` | Exit 0, no reported errors/warnings |
| `node node_modules/typescript/bin/tsc --noEmit` | Exit 0 |
| `npm run build -- --webpack` | Exit 0; production routes generated |
| `node tests/ui/buyer-providers.browser.mjs` | Exit 0 |
| `node tests/ui/buyer-batch1.browser.mjs` | Exit 0; zero recorded console, page or HTTP >=400 resource errors |
| `LANDING_URL=http://localhost:3105 node tests/ui/landing-page.browser.mjs` | Exit 0 on this branch's existing Landing implementation |
| JavaScript syntax checks and `git diff --check` | Passed |

Browser checks used installed headless Microsoft Edge/Playwright against a local production server on port 3105. The provider fixture runs production React in a separate DOM, with the built application's stylesheet; it is not a full Next application. The Buyer suite independently covers real Next navigation and interaction.

Provider assertions include two queued additions -> quantity 2; set 7 + add 1 -> quantity 8; rejecting the ninth addition; set-overstock cap; invalid/unknown/null/empty/forged inputs; unavailable service fixture; zero removal; exact cart totals/remaining values after committed renders; exact selected BOM product mutation with other projects unchanged; repeated edge-clamp resize/reflow; and clean unmount/remount with no global bridge.

Real application assertions include repeated mobile card additions (5 DHT22 units) followed by Details (3 remaining), adding those 3 to reach stock 8, disabled mobile/desktop additions at that boundary, and exact cart totals across client navigation. BOM totals move from `[5,3,4]` to `[5,3,5]` after keyboard selection of project b3, persist into Home, then become `[5,4,5]` after pointer selection of b2. The companion provider test verifies the exact product line, not only project totals.

Home/Catalog/Details document overflow was checked at 320/390/768/1024/1440/1920px; this does not prove every child is unclipped. Separate open-filter child checks cover 320/390px short windows; actual option bounds/hit-testing cover narrow popovers, and repeated open desktop resize covers column-count changes. A standalone edge-anchor stress fixture verifies repeated corrections at both horizontal edges.

### Local build environment limitation

The isolated worktree reuses the PM checkout's identical existing package/lockfile dependency set through an ignored `node_modules` junction; no package installation or dependency/configuration edits were made. The initial default `npm run build` **failed** because Turbopack rejects a dependency symlink outside its filesystem root. The documented Webpack build option succeeded and supplied the production server used above. Do not describe the default Turbopack command as passing. A normal checkout with local dependencies should rerun the default build before integration/release.

## Preservation and remaining boundaries

- Original PM checkout remains clean on `feature/auth-ui`. Work is isolated in `C:\Users\Daniel\Documents\ChatGPT\ohmsim\work\buyer-batch1-fixes` on `feature/buyer-batch1`.
- No changes to Landing/Auth/Admin implementation, root layout/globals, package files/lockfile, Next/Tailwind/PostCSS configuration, shared visual tokens, catalog service or approved fixture source.
- The service/product/BOM fixtures are preserved; source stock photography is **not** certified as approved matching catalog imagery. Asset replacement remains coordinated PM/design work.
- Datasheets remain unavailable. The gallery notice is not a working PDF download.
- Later Buyer routes remain unimplemented and retain existing milestone navigation behavior; this pass does not claim those routes work.
- No real authentication, inventory enforcement, backend persistence, payment, email or support delivery is implemented. GCash/Bank Transfer/online payment gateways are excluded from approved Version 1, not deferred authorization.
- The developer branch does not contain the PM's newer Auth/legal/motion integration. Passing its existing Landing regression suite is not proof of integration with `feature/auth-ui`; preserve and coordinate that separately.
- No live Figma comparison, real mobile virtual-keyboard test, screen-reader session, Firefox/WebKit run or final design acceptance was performed.

Publication: PM authorized commit/push to the existing feature branch to update Draft PR #8. Keep the PR unmerged until integration readiness is reviewed. This publication approval does not authorize Batch 2 changes or integration.

## Home reference-alignment pass — October 5, 2026

PM supplied current/reference Home screenshots and authorized correction. Used the
supplied screenshots and existing non-compilable Buyer export as composition
references; no new live Figma Design-node verification is claimed.

- Removed Home's 1280px width cap. Desktop content has 24px side padding,
  reference-sized heading/metrics, 12px grid gaps and the existing canonical page
  gradient. Mobile retains the functioning mobile cards and navigation.
- Added an opt-in `home` variant to the existing ProductCard. Home uses the full
  `View Details` / `Add to Cart` labels, compact typography, and image stock badges
  without the extra desktop numeric stock count. Catalog/related-card defaults
  and all stock/BOM behavior are preserved.
- Added scoped Home-card and Buyer-header CSS Modules. Compact visual button/nav
  surfaces sit inside real 44px targets, rather than shrinking interaction areas.
  Restored the desktop `by NEXORA Labs` caption; kept the approved existing logo.
  The shared **Buyer** desktop header refinement also appears on Catalog/Details.
- Kept `Exit Store`, since the isolated preview has no real session to log out of.
  No Auth integration or mock security behavior was introduced.
- Added measured Home assertions at 768/1440/1920px: full-width geometry, actual
  child bounds, visible header bounds, heading/metric sizes, canonical gradient,
  readable labels, compact pseudo-element surfaces and >=44px action dimensions.

Completed checks: lint, TypeScript no-emit, browser-test syntax, Webpack production
build, actual-provider browser tests and the complete Buyer browser suite all
passed. Final browser suite recorded zero console/page/HTTP resource errors.
The first new stock-text assertion incorrectly included hidden mobile markup;
it was corrected to inspect the desktop cards specifically, then rerun to pass.
Restarted the production preview after rebuilding to avoid stale asset manifests.

Regenerated the existing Buyer screenshots and added `home-desktop-1920.png`;
visually inspected Home's desktop and mobile captures and a separate 1.25x-scale
capture for comparison with the supplied screenshot. Canonical Inter/JetBrains
Mono, colors and radii take precedence over legacy reference styling. Compact
surfaces preserve extra effective target space, so this is not a claim of
pixel-identical legacy rendering or final PM acceptance. Landing/Auth/Admin,
root globals/layout, fixtures, packages and configuration remain unchanged.
At completion of this pass, the changes were uncommitted/unpushed; this worktree contained no Batch 2 implementation.

## Fly-to-cart UX restoration — October 5, 2026

PM authorized restoring the exported React/CSS microinteraction. Source values
come from `01-shared.txt`, `SOURCE_STYLES.css.txt` and the supplied explanation;
no live Figma motion-node certification is claimed.

- Added Buyer-local `cart-feedback.tsx` and scoped CSS, mounted within the existing
  Buyer layout. It is visual feedback only; the stock-validated cart action and
  live toast remain unchanged. Home/Catalog/related desktop/mobile cards and the
  main Product Details action animate only when their action returns success.
- A decorative, pointer-transparent body portal animates a 40px product thumbnail
  for 650ms using the reference keyframes/easing, shrinking/fading to the visible
  cart icon. Cached displayed-image URLs avoid an extra thumbnail request where
  available. The desktop icon/mobile Cart-tab icon bounces for 500ms on arrival.
- Rapid additions have unique IDs; at most six thumbnails are shown at once.
  Timer cleanup occurs on unmount; changing reduced-motion preference cancels
  active flights and pending bounce work. No overlay focus or navigation change,
  storage, production diagnostic bridge or animation dependency was added.
- Numeric badges now have explicit `data-cart-count` selectors, separating actual
  cart counts from the animation wrappers in the existing regression test.
- Added `buyer-cart-motion.browser.mjs`. It checks native browser keyframes at
  sampled start/mid/end times, exact source/destination geometry and 650/500ms
  timings, loaded images, shrink/fade, pointer transparency, cleanup, six desktop/
  mobile Home/Catalog/Details entry points, rapid additions, keyboard focus,
  disabled and actual queued overstock rejection, reduced motion, preference
  changes during motion and leaving Buyer. The sampled flight is paused for
  deterministic geometry/screenshots; independent rapid/keyboard runs play
  normally. Visually inspected the desktop/mobile mid-flight PNGs.

Final lint, typecheck, Webpack build, full Buyer browser suite, actual-provider
tests and motion suite all exited 0. Motion and Buyer suites recorded zero
browser/resource errors. During test development, corrected an inaccurate DHT22
name selector, the old generic badge-span selector and an immediate toast
assertion (toast dispatch is asynchronous; now waits for the actual live text).
Assertions were not weakened and production cart logic was not duplicated.

BOM-transfer staggering remains Batch 2 work: this pass adds no transfer/cart/
checkout routes or bundle-accounting behavior. Landing/Auth/Admin, root global
styles/layout, packages/configuration and product/service fixtures are preserved.
At completion of the motion pass, changes remained uncommitted and unpushed.

## Publication coordination — October 5, 2026

PM subsequently authorized committing and pushing these Batch 1 corrections to
`feature/buyer-batch1` to update PR #8, without merging or changing `main`.
Dev1 reports separate, uncommitted Batch 2 work on `feature/buyer-batch2` from the
same original Batch 1 baseline. That work has not been independently reviewed
here. Cart-hook/header/mobile-navigation changes overlap and require careful
reconciliation plus combined tests after synchronization. Preserve the validated
ID-only cart actions, queued-update behavior, removed production diagnostic
bridge, feedback provider and successful-action-only animations alongside any
reviewed bundle behavior. BOM-transfer motion remains coordinated Batch 2 work.
