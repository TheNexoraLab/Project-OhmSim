# Landing hero circuit motion

PM requested the Auth circuit treatment on the landing hero, then requested removal of the visible Pause background motion control.

- Added blue/teal SVG circuit traces at the hero edges without changing copy, CTAs, statistics or section spacing.
- CSS-only four-second light pulses with 0/.3/.6/.9-second delays. The entrance finishes within five seconds, leaving static traces; there is no continuous motion requiring a visible pause control.
- Auth uses the same short entrance behavior; its previously added pause control is removed.
- The existing hero status-dot pulse is also finite (two iterations).
- Reduced-motion preference disables the pulses. SVG decoration is hidden from assistive technology and cannot intercept pointer events.
- Narrow screens use smaller, dimmer edge decorations. No dependencies or global tokens changed.
- Tests: `tests/ui/hero-motion.browser.mjs` covers actual path motion, finite completion, absent controls, reduced motion, six viewport widths, and runtime errors. Existing landing and Auth suites remain applicable.
