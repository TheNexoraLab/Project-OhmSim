# Landing hero circuit motion

PM requested the Auth circuit treatment on the landing hero, then requested removal of the visible Pause background motion control.

- Added blue/teal SVG circuit traces at the hero edges without changing copy, CTAs, statistics or section spacing.
- PM subsequently requested continuous, unsynchronized motion: CSS-only infinite pulses use distinct 6.7/9.3/7.9/11.1-second durations and negative phase offsets, with forward and reverse directions. These are deterministic independent loops, not randomized motion.
- Auth uses the same treatment on its three paths; visible pause controls remain removed per PM request. Reduced-motion preference remains supported. A separate pause/stop mechanism would be needed if continuous decorative motion is included in a strict accessibility conformance review.
- The existing hero status-dot pulse is also finite (two iterations).
- Reduced-motion preference disables the pulses. SVG decoration is hidden from assistive technology and cannot intercept pointer events.
- Narrow screens use smaller, dimmer edge decorations. No dependencies or global tokens changed.
- Tests: `tests/ui/hero-motion.browser.mjs` covers actual motion beyond the first cycle, independent timing, mixed directions, absent controls, reduced motion, six viewport widths, and runtime errors. Existing landing and Auth suites remain applicable.

Validation for the continuous-motion update: production build (including TypeScript) and whitespace check passed; hero motion browser checks and all 106 Auth checks passed against the production preview at port 3000.
