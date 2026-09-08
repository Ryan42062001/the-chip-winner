# The Chip Winner — Canonical Project State

Last reconciled: 2026-09-08
Manager task: TCW-001 — COMPLETE

## Repository

- Repository: `Ryan42062001/the-chip-winner`
- Protected default branch: `master`
- Verified pre-bootstrap checkpoint: `0c3786494993f8d4f635babe131b2b987cfdf70d`
- Package version at bootstrap: `0.9.88`
- Canonical `.ai` workflow merged through PR #52.
- Verified bootstrap merge checkpoint: `40b2ae7fbf024976753250b969c18f03373aa83b`
- PR #52 exact head `af104789464b6ae8cc4b1f38b0c1879ba6937eb3` passed its pull-request `Deploy website / test` workflow before merge.
- Post-merge master workflow run #411 for `40b2ae7fbf024976753250b969c18f03373aa83b` passed `test`, `deploy`, and `verify-production`, including `npm run smoke:production`.
- TCW-001 changed only `.ai` coordination files; no production source, configuration, package, test, extension, worker, schema, or deployment behavior was modified by the bootstrap PR.

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

Verified from repository documentation and current version history:

- Read-only authenticated ESPN companion path is implemented.
- Waiver Engine v2 deterministic scope is complete as of v0.9.69.
- Season/Playoff Intelligence reviewed deterministic scope is complete as of v0.9.70.
- Automatable production-readiness engineering is complete as of v0.9.71.
- Evidence-backed Release 1.0 field-validation registry exists as of v0.9.72.
- Subsequent field-driven fixes and validation advanced through v0.9.88.
- Authenticated standard ESPN workflow validation is passed in the registry.
- IR-aware projection coverage, start/sit completeness/freshness separation, mobile-sync validation, real 200% zoom, acquisition/position-limit parity, and informational waiver-position board work are represented in the current repository evidence.
- TCW-001 canonical AI workflow bootstrap is merged and production-verified.

## Current milestone

### Release 1.0 — trustworthy read-only companion

Status: ACTIVE — FIELD VALIDATION

The reviewed deterministic implementation baseline is substantially complete. The active milestone is evidence-backed field validation and final release gating, not broad product expansion.

## Release 1.0 field gate

Machine-readable status source: `config/field-validation.json`.

Verified status at TCW-001 reconciliation:

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

## Active coordination work

After TCW-001 closeout merges, Manager authorizes parallel evidence wave `TCW-PW-001`:

- `TCW-002` — Independent Release 1.0 baseline audit — Auditor / QA.
- `TCW-003` — ESPN field-validation feasibility research — R&D.

These assignments are independent and implementation-free. Builder remains idle absent a reproduced defect or approved implementation requirement. Strategy remains idle absent recommendation-policy uncertainty or a new decision-engine requirement.

## Test and release infrastructure

`package.json` provides `npm test`, `npm run eval:model`, `npm run check`, field-status, smoke, accessibility, mobile, extension, performance, readiness, security, and production-smoke commands.

`.github/workflows/deploy-pages.yml` runs a `test` job for pull requests and master pushes, then `deploy` and `verify-production` on master pushes. The repository guide requires feature/documentation/maintenance changes to use a task branch and PR rather than direct pushes to protected `master`.

## Current focus

1. Run `TCW-PW-001` evidence work and reconcile findings.
2. Complete Release 1.0 field validation honestly; do not substitute synthetic evidence for required real-world checks.
3. Accumulate real weekly projection coverage as source publications become available without weakening identity or missing-data rules.
4. Validate already-complete waiver and season intelligence against materially different authenticated ESPN states and transitions.
5. Reopen deterministic implementation only for reproduced defects or an explicitly approved new requirement.
6. Preserve read-only scope through Release 1.0.

## Known limitations / gated work

- Screen-reader field validation is incomplete.
- Authenticated custom FLEX/OP field validation is incomplete.
- Real ESPN IR-edge and lock/availability transition validation is incomplete.
- Real playoff/bye intelligence field validation is incomplete.
- Live recovery/reconnect validation is incomplete.
- Real waiver enumeration/timing evidence remains incomplete.
- Trade analysis, external notifications, future-only IR-assisted stash discovery, playoff probability modeling, server-side models, and ESPN write actions remain gated future work.

## Reconciliation findings

The following repository documents are stale relative to newer verified state and must not override this file without explicit reconciliation:

- `docs/next-codex-task.md` still describes an expected v0.9.76 checkpoint.
- `docs/roadmap.md` contains historical status text centered on v0.9.72 even though implementation/field fixes continued through v0.9.88.
- `config/field-validation.json` has `baselineVersion: 0.9.81` while the package version is v0.9.88; the item statuses/evidence are newer and remain authoritative for field-check state.

These are recorded discrepancies. TCW-001 intentionally does not rewrite project history or alter those legacy files merely to make them cosmetically agree with the new coordination layer.
