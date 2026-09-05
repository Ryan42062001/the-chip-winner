# v0.9.77 — Scrollable zoom navigation

Release 1.0 field validation found one remaining real-browser 200% zoom defect after the compact reflow work: on a short effective viewport, the off-canvas sidebar could not scroll far enough to reach **League Setup**.

## Fix

- Make the sidebar navigation vertically scrollable whenever the available viewport height is smaller than the navigation content.
- Keep the brand and source-status areas stable while the navigation list scrolls.
- Apply the same resilient behavior to compact desktop and mobile layouts rather than special-casing one device.
- Preserve keyboard focus behavior so tabbing to an off-screen navigation link scrolls it into view naturally.

## Regression coverage

The production-readiness audit now reproduces the real field dimensions more faithfully: a 1920×1050 desktop at 200% browser zoom is tested as a **960×525 CSS-pixel viewport**. A 1440×900 desktop at 200% is tested as **720×450 CSS pixels**.

The audit opens the compact sidebar, verifies the primary navigation is a real vertical scroll container, scrolls to the final **League Setup** link when overflow exists, confirms that link becomes visible inside the navigation region, activates it, and still checks horizontal reflow across the primary sections.

## Field-validation status

`FV-A11Y-03` remains pending until the deployed fix is retested in the user's real Chrome 200% session. Automated coverage is a release gate, not a substitute for field evidence.

The deployed v0.9.76 performance pass separately received real-browser confirmation that the prior Waivers and Season Plan navigation lag is gone. `FV-WAIVER-01` remains pending only for the required real candidate/scenario enumeration evidence as projection coverage grows.
