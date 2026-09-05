# Production readiness

The Chip Winner treats production readiness as a set of explicit, testable boundaries rather than a claim that every possible ESPN league or device has already been observed in the field.

## Automated release guarantees

The protected release workflow blocks deployment unless all automated checks pass. As of v0.9.71, that includes:

- permanent domain/application tests;
- model recommendation and explanation safety fixtures;
- dependency audit at `high` severity or above;
- static production smoke checks;
- real-browser desktop/mobile smoke checks;
- automated WCAG 2.2 A/AA checks;
- 200%-equivalent desktop and 390px phone horizontal-reflow checks across every primary section;
- Chrome companion threat-boundary audit;
- performance audit;
- tracked-file security/secret scan;
- post-deployment production smoke against GitHub Pages.

v0.9.72 adds an evidence-gated Release 1.0 field-validation registry and `npm run field:status`. The registry is intentionally not a substitute for the protected automated release workflow; it tracks the human and real-world observations that automation cannot prove.

## Data lifecycle and recovery contracts

The automated suite now proves these behaviors:

1. A replacement ESPN snapshot is validated before it can replace the last valid cache.
2. A corrupt current ESPN cache is discarded rather than parsed permissively.
3. Corruption of the current cache does not delete the separately retained previous valid snapshot.
4. If no usable ESPN cache exists, provider loading can fall back to the validated sample dataset rather than inventing league state.
5. Clearing saved ESPN connections removes both the active connection record and all stored connection profiles.
6. The local-data manager clears registered provider caches plus lifecycle-only browser keys such as weekly projection-update state and mobile-sync credentials.
7. Mobile-sync revocation uses authenticated `DELETE`; a missing remote channel is treated as already revoked, while authorization/service failures are surfaced instead of reported as success.
8. The mobile write token is carried only in the Authorization header and is never placed in the channel URL.
9. Remote encrypted sync records have an automatic expiry even if a revocation attempt cannot reach the service.

These contracts do not make failed live network requests look successful. The last validated local state remains distinct from the outcome of a new refresh attempt.

## ESPN league-state coverage

The permanent suite already includes or derives materially different provider states, including:

- standard and OP/superflex lineup slots;
- explicit roster-size and position limits;
- season and matchup acquisition limits;
- current and future reported matchups;
- unavailable or partial NFL context;
- known, invalid, grandfathered, and unverified ESPN IR states;
- kickoff-derived locks and explicit locks;
- availability changes between recommendation and revalidation;
- offseason/empty-state normalization;
- completed playoff matchups;
- missing or malformed optional ESPN settings that fail closed instead of being guessed.

This is deterministic fixture coverage. It is not a substitute for continued observation against authenticated leagues as ESPN response shapes and league configurations vary in the field.

## Chrome companion threat boundary

Companion v0.2.2 is intentionally narrow:

- Manifest V3;
- no general Chrome permissions;
- only the two reviewed ESPN read hosts are allowed;
- the content bridge runs only on the deployed Chip Winner origin and the reviewed local-development origin;
- page messages must come from the same window and same origin;
- the service worker rejects runtime messages not sent by this extension itself;
- only `CHIP_WINNER_PING` and `CHIP_WINNER_FETCH_LEAGUE` are accepted;
- only the reviewed ESPN league views are requested;
- league and season URL inputs are digit-only;
- authenticated ESPN reads use the browser session with `credentials: "include"`, but cookies are never read through the Chrome cookie API or placed in extension messages;
- companion runtime code does not use browser persistence, logging, dynamic code execution, or ESPN mutation methods.

The automated extension audit fails the release if these reviewed assumptions change.

## Responsive and accessibility coverage

Automated browser coverage now checks:

- normal desktop interaction;
- 390px representative phone interaction;
- keyboard-driven player detail and playoff-week controls;
- mobile navigation behavior;
- WCAG 2.2 A/AA automated rules across onboarding, player detail, and primary sections;
- horizontal reflow across primary sections at 720 CSS pixels, used as a deterministic equivalent of a 1440px desktop viewed at 200% browser zoom;
- horizontal reflow across the same sections at 390px mobile width.

The reflow audit is a deterministic layout gate, not a claim that browser zoom itself or every assistive technology has been fully exercised.

## Release 1.0 field validation

The remaining human and field work is now tracked in [`field-validation.md`](field-validation.md) and the machine-readable [`config/field-validation.json`](../config/field-validation.json) registry. The current registry includes:

- keyboard-only critical workflow;
- screen-reader critical workflow;
- real browser 200% zoom;
- representative physical-phone workflow;
- authenticated standard ESPN league workflow;
- authenticated custom FLEX/OP league state;
- real acquisition and provider-position limits;
- real ESPN IR edge states;
- real lock/availability transitions;
- real season/playoff/bye intelligence states;
- live ESPN/session/network failure and reconnect;
- live deployed mobile-sync revoke/delete;
- real waiver candidate volume and timing observation.

The registry supports `pending`, `passed`, `blocked`, and `failed` states. A check cannot be marked `passed` or `failed` without privacy-safe evidence. A blocked state remains visible and cannot silently satisfy Release 1.0.

Use:

```text
npm run field:status
```

for the current state and:

```text
npm run field:status -- --require-complete
```

for the Release 1.0 completion gate.

## Remaining human and field validation

Until the registry is complete, the following claims remain intentionally withheld:

- that the full critical workflow has passed a real NVDA, VoiceOver, or equivalent screen-reader review;
- that actual browser 200% zoom and a representative physical phone have been manually validated;
- that materially different authenticated ESPN league configurations have all been observed in the field;
- that live ESPN/session/network refresh failure and reconnect have been observed end-to-end;
- that live mobile-sync revoke/delete has been observed against the deployed worker;
- that real waiver-candidate volume and timing have been observed with enough multiweek projection coverage to justify any optimization policy.

Chrome Web Store packaging, permission, privacy, and distribution review remains separate unless the companion moves beyond local unpacked installation before Release 1.0.

A field observation should become a permanent regression fixture whenever it exposes a new provider shape or reproducible defect.

## Completion rules

v0.9.71 closed the **automatable production-readiness engineering work** after its exact PR head and independent post-merge `master` workflow passed the full protected test, deploy, and production verification gates.

v0.9.72 defines the remaining Release 1.0 field gate. The product may be labeled **1.0 — production-grade read-only companion** only when every registered field-validation item is `passed` with privacy-safe evidence, no unresolved high-severity field defect remains, and the final Release 1.0 PR plus post-merge `master` workflow pass the normal protected release gates.

Neither milestone is proof that every possible ESPN league, browser, assistive technology, or network condition has been exhaustively tested. New reproducible provider shapes or defects should continue to become permanent regression coverage after 1.0.
