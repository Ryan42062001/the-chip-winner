# v0.9.80 — Mobile reliability closeout

## Why this release exists

Before another physical-phone field test, the mobile implementation was audited end to end rather than testing only the responsive layout. The audit found two important cross-device defects plus several mobile hardening gaps that were not covered by the existing sample-mode phone smoke test.

## Defects found and fixed

### Private sync link could be lost after navigation

The mobile decryption key intentionally lives in the URL fragment (`#mobile-sync=...`) so it is never sent to the web server. Primary navigation also used URL fragments (`#waivers`, `#season`, and so on). On a synced phone, choosing a section could therefore replace the private sync fragment. The already-loaded page kept working in memory, but a later reload or reopen could no longer recover the encrypted channel and could fall back to unrelated local state.

v0.9.80 keeps the private fragment intact for every synced-viewer route. Synced links carry their target section as in-memory app context while their actual URL continues to contain the private sync credentials. Reloading after navigation therefore reloads the same encrypted league and desktop-selected team.

### What Changed had no prior snapshot on mobile

The mobile payload carried only the current ESPN snapshot, so the **What Changed** section could never compare the two most recent valid ESPN captures on the phone. v0.9.80 optionally carries the matching prior ESPN snapshot inside the same AES-256-GCM encrypted payload. It is validated independently and must belong to the same ESPN league and season. Unrelated prior league state is omitted rather than mislabeled.

## Additional mobile hardening

- malformed `#mobile-sync=` credentials now fail closed instead of silently continuing into local/sample data;
- revoked or expired links continue to fail closed;
- the synced phone visibly shows the selected fantasy team;
- desktop-only Connect ESPN/import/reset controls are hidden from the synced viewer;
- synced League Setup is now a read-only status/provenance surface rather than offering another ESPN connection or nested mobile-sync channel;
- mobile navigation resets its ARIA label consistently when it closes;
- true-phone layouts use dynamic viewport height, safe-area padding, larger touch targets, wrapping League Setup rows, and scrollable dialogs;
- the standard readiness audit now includes **What Changed** and verifies League Setup is reachable on a 390px phone;
- automated WCAG 2.2 A/AA coverage now runs across all seven primary sections on both desktop and a representative phone layout.

## New deployment-blocking synced-phone audit

`npm run audit:mobile` exercises the actual encrypted mobile-link code path rather than sample mode. It covers 320×568 small portrait, 390×844 representative portrait, and 844×390 phone landscape and verifies:

- exact selected-team restoration;
- all seven primary sections;
- private-fragment preservation through navigation and reload;
- prior-state **What Changed** rendering;
- read-only synced League Setup;
- player-detail usability;
- horizontal reflow;
- primary touch targets;
- revoked-link behavior;
- malformed-link behavior.

The audit is part of the protected `test` job, so future releases cannot deploy if this synced-mobile contract regresses.

## Scope boundary

The synced viewer carries current ESPN state, the matching previous ESPN capture when available, compatible ROS rankings, and the desktop-selected team. Desktop-only future-projection catalogs and import files are not silently copied to the phone; features that need those optional inputs continue to report missing coverage honestly.

No ESPN write capability, player identity rule, projection identity rule, waiver legality, IR policy, or recommendation threshold changed in this release.

## Field gate

Automated mobile engineering is not a substitute for the final real-device lifecycle test. `FV-SYNC-01` remains pending until the deployed v0.9.80 flow is confirmed on the user's phone: correct team, refresh/read, revoke, and revoked-link rejection.
