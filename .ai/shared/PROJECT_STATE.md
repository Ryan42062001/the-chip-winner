# The Chip Winner — Canonical Project State

Last reconciled: 2026-09-08
Manager task: TCW-001

## Repository

- Repository: `Ryan42062001/the-chip-winner`
- Protected default branch: `master`
- Verified `master` checkpoint at bootstrap: `0c3786494993f8d4f635babe131b2b987cfdf70d`
- Package version at that checkpoint: `0.9.88`
- Visible branches before bootstrap: `master` only
- Open pull requests before bootstrap: none

## Product boundary

The Chip Winner is an ESPN-only, read-only, in-season fantasy-football decision companion. ESPN is authoritative for league state, roster rules, availability, locks, acquisition state, and other league facts. External rankings/projections are independent overlays. Derived recommendations never mutate source snapshots. ESPN write actions remain outside the current product boundary.

## Architecture

Four primary layers are established:

1. Provider layer — ESPN acquisition/normalization/caching and external projection/ranking overlays.
2. Domain layer — normalized model, selectors, optimizers, scenarios, legality, and recommendations.
3. Application layer — single state owner and explicit browser/application transitions.
4. Interface layer — rendering and interaction without source normalization or a second state store.

Key areas:

- `src/providers/espn/`
- `src/providers/projections/`
- `src/providers/rankings/`
- `src/domain/`
- `src/application/`
- `src/ui/`
- `src/models/`
- `src/sync/` and `worker/`
- `schema/`
- `test/`

## Completed major work

Verified from repository documentation and current code/version history:

- Read-only authenticated ESPN companion path is implemented.
- Waiver Engine v2 deterministic scope is complete as of v0.9.69.
- Season/Playoff Intelligence reviewed deterministic scope is complete as of v0.9.70.
- Automatable production-readiness engineering is complete as of v0.9.71.
- Evidence-backed Release 1.0 field-validation registry exists as of v0.9.72.
- Subsequent field-driven fixes and validation advanced through v0.9.88.
- Latest verified field evidence includes authenticated standard ESPN workflow validation, IR-aware projection coverage, start/sit completeness/freshness separation, and informational waiver-position board behavior.

## Release 1.0 field gate

Machine-readable status source: `config/field-validation.json`.

Verified status at bootstrap:

Passed:
- FV-A11Y-01
- FV-A11Y-03
- FV-MOBILE-01
- FV-ESPN-01
- FV-ESPN-03
- FV-SYNC-01

Pending:
- FV-A11Y-02
- FV-ESPN-02
- FV-ESPN-04
- FV-ESPN-05
- FV-SEASON-01
- FV-RECOVERY-01
- FV-WAIVER-01

Release 1.0 remains blocked until every registry item is passed with privacy-safe evidence and the final release PR/master production gates are green.

## Test and release infrastructure

`package.json` provides `npm test`, `npm run eval:model`, `npm run check`, field-status, smoke, accessibility, mobile, extension, performance, readiness, security, and production-smoke commands.

`.github/workflows/deploy-pages.yml` runs a `test` job for pull requests and master pushes, then `deploy` and `verify-production` on master pushes. The repository guide requires feature/documentation/maintenance changes to use a task branch and PR rather than direct pushes to protected `master`.

## Current focus

1. Complete Release 1.0 field validation honestly; do not substitute synthetic evidence for required real-world checks.
2. Accumulate real weekly projection coverage as source publications become available without weakening identity or missing-data rules.
3. Validate already-complete waiver and season intelligence against materially different authenticated ESPN states and transitions.
4. Reopen deterministic implementation only for reproduced defects or an explicitly approved new requirement.
5. Preserve read-only scope through Release 1.0.

## Known limitations / gated work

- Screen-reader field validation is incomplete.
- Authenticated custom FLEX/OP field validation is incomplete.
- Real ESPN IR-edge and lock/availability transition validation is incomplete.
- Real playoff/bye intelligence field validation is incomplete.
- Live recovery/reconnect validation is incomplete.
- Real waiver enumeration/timing evidence remains incomplete.
- Trade analysis, external notifications, future-only IR-assisted stash discovery, playoff probability modeling, server-side models, and ESPN write actions remain gated future work.

## Reconciliation findings

The following repository documents are stale relative to newer verified state and must not override this file without reconciliation:

- `docs/next-codex-task.md` still describes an expected v0.9.76 checkpoint.
- `docs/roadmap.md` contains historical status text centered on v0.9.72 even though implementation/field fixes continued through v0.9.88.
- `config/field-validation.json` has `baselineVersion: 0.9.81` while the package version is 0.9.88; the item statuses/evidence are newer and remain authoritative for field-check state.

These are recorded discrepancies, not silently corrected facts.
