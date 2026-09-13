# The Chip Winner — Canonical Project State

Last reconciled: 2026-09-13
Current operating state: Release 1.0 field validation / TCW-012 awaiting waiver field evidence; TCW-013 workflow hardening in progress

## Repository

- Repository: `Ryan42062001/the-chip-winner`.
- Default branch: `master`.
- Current verified product checkpoint: `0d9e7b55b267d9eb3f0876fe077e1f19dc38f453`.
- TCW-012 Builder PR #74 merged at that checkpoint; post-merge workflow #463 passed test, Pages deploy, and production verification.
- Package version remains `0.9.88` unless changed by a later accepted implementation.
- Workflow V3.1 remains canonical through `.ai/shared/WORKFLOW_V3_1.md` over the V3 base workflow.

## Product boundary

The Chip Winner remains an ESPN-only, read-only, **in-season** fantasy-football decision companion. ESPN is authoritative for connected-league state. External rankings/projections remain independent overlays. Derived recommendations do not mutate source snapshots. ESPN write actions remain outside Release 1.0.

## Current milestone

### Release 1.0 — trustworthy read-only companion

Status: ACTIVE — FIELD VALIDATION

Authoritative field registry: `config/field-validation.json`.

Registry status remains **7 passed / 6 pending**.

Passed:
- FV-A11Y-01
- FV-A11Y-03
- FV-MOBILE-01
- FV-ESPN-01
- FV-ESPN-03
- FV-RECOVERY-01
- FV-SYNC-01

Pending:
- FV-A11Y-02
- FV-ESPN-02
- FV-ESPN-04
- FV-ESPN-05
- FV-SEASON-01
- FV-WAIVER-01

## TCW-012 — Waiver Field Diagnostics Visibility

Status: `WAITING_EXTERNAL_EVIDENCE` after verified deployment.

The deployed Waivers transparency surface now displays the engine's existing ready-state diagnostics together:
- Considered adds
- Complete adds
- Scenarios evaluated
- Qualified adds

No waiver engine, legality, ranking, threshold, projection, IR, priority-band, scenario-scoring, candidate-cap, provider-normalization, or field-registry behavior changed.

Next required evidence is a privacy-safe real deployed Waivers recording after a fresh authenticated ESPN refresh showing the four diagnostics plus observed responsiveness. After that evidence exists, Independent Auditor resumes TCW-012 for the FV-WAIVER-01 verdict. FV-WAIVER-01 remains pending until accepted real evidence is separately integrated.

## TCW-013 — Control-Plane CI Efficiency & Durable-State Deduplication

Status: `IN_PROGRESS` on `manager/tcw-013-workflow-efficiency`.

This independent Manager workflow task does not touch TCW-012 product/UI/test files. It keeps full CI for every PR/push, adds fail-open deployment-scope classification so future `.ai/**`-only master commits can skip redundant Pages deploy/production smoke, and removes volatile active-task claims from the durable roadmap.

Master advanced from TCW-013's assignment checkpoint only through the non-overlapping TCW-012 product merge; target advancement is classified `NON_OVERLAPPING` at `0d9e7b55b267d9eb3f0876fe077e1f19dc38f453`.

## Workflow V3.1 operating state

`.ai/shared/ACTIVE_TASKS.json` is the single machine-authoritative operational task registry. `config/field-validation.json` is separately authoritative for Release 1.0 field status.

Role state:
- Manager — ACTIVE on TCW-013 and Release 1.0 orchestration.
- Builder — waiting on external TCW-012 field evidence; no implementation work authorized.
- Auditor — resume role once TCW-012 field evidence is supplied.
- R&D — IDLE.
- In-Season Strategy — IDLE.
- Troubleshooting & Root Cause — IDLE / not instantiated.

## Known gated work

FV-WAIVER-01 now needs only its real deployed diagnostic/responsiveness evidence and independent verdict. The other five pending checks still require their genuine real prerequisites: screen-reader validation, a custom FLEX/OP league, natural IR edge states, real lock/availability transitions, and seasonal playoff/bye states.

Post-1.0 Roadmap Discovery input remains recorded in `.ai/shared/ROADMAP.md` and `docs/post-1.0-roadmap-candidates.md`. No successor milestone is authorized.
