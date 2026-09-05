# v0.9.75 — 200% zoom reflow refinement

Release 1.0 field validation exposed a real layout-quality issue at actual Chrome 200% zoom on a 1920x1050 Windows desktop. The page did not obviously overlap or horizontally overflow, but the full desktop sidebar remained expanded at the resulting ~960 CSS-pixel layout width, squeezing the main content and making the header/page titles feel oversized and cramped.

## Changes

- Adds `src/zoom-reflow.css` as a small, isolated responsive override layer.
- At 721–1000 CSS pixels, the desktop shell now switches to compact/off-canvas navigation while retaining the richer tablet/desktop content rules.
- The navigation trigger remains keyboard-operable and uses the existing sidebar event contract.
- The topbar becomes a two-row grid so the page title keeps usable width and header actions wrap below it instead of competing with the full desktop sidebar.
- Main content and notice margins use compact responsive padding at this width.
- True mobile behavior at 720 CSS pixels and below remains owned by the existing mobile rules in `src/styles.css`.

## Automated readiness coverage

`scripts/audit-readiness.js` now validates three reflow targets:

1. **960 CSS px** — representative of the observed 1920px desktop at 200% Chrome zoom; this target must expose the compact navigation shell, hide the desktop sidebar off-canvas by default, use the compact header grid, and avoid horizontal overflow across primary sections.
2. **720 CSS px** — representative of a 1440px desktop at 200% zoom; retains the existing no-horizontal-overflow audit.
3. **390 CSS px** — representative mobile viewport; retains the existing physical-phone-style layout audit.

## Field-validation status

`FV-A11Y-03` remains **pending**. Automated reflow is a deterministic safety gate, but it does not replace the required real browser check. After v0.9.75 is deployed, the same Windows/Chrome session should be retested at actual 200% zoom before the field item can pass.

No ESPN data semantics, recommendation logic, identity rules, waiver legality, or write boundaries change in this release.
