# The Chip Winner — Canonical Project State

Last reconciled: 2026-09-13
Current operating state: Release 1.0 field validation / no active implementation task

## Repository

- Repository: `Ryan42062001/the-chip-winner`.
- Default branch: `master`.
- Workflow V3.1 is canonical through `.ai/shared/WORKFLOW_V3_1.md` over `.ai/shared/WORKFLOW.md`.
- Package version: `0.9.88` unless changed by a later accepted implementation.
- Latest accepted waiver-field integration checkpoint: `ae932395f87f77aad2c067ca16dc1042d4f79786`.
- Post-merge workflow #473 passed test, Pages deploy, and production verification.

## Product boundary

The Chip Winner remains an ESPN-only, read-only, **in-season** fantasy-football decision companion. ESPN is authoritative for connected-league state. External rankings/projections remain independent overlays. Derived recommendations do not mutate source snapshots. ESPN write actions remain outside Release 1.0.

## Current milestone

### Release 1.0 — trustworthy read-only companion

Status: ACTIVE — FIELD VALIDATION

The deterministic implementation baseline remains substantially complete. Current work is genuine real-world validation and bounded remediation only when a field defect is reproduced or evidence visibility is insufficient.

## Field gate

Authoritative registry: `config/field-validation.json`.

Registry status is **8 passed / 5 pending**.

Passed:
- FV-A11Y-01
- FV-A11Y-03
- FV-MOBILE-01
- FV-ESPN-01
- FV-ESPN-03
- FV-RECOVERY-01
- FV-SYNC-01
- FV-WAIVER-01

Pending:
- FV-A11Y-02
- FV-ESPN-02
- FV-ESPN-04
- FV-ESPN-05
- FV-SEASON-01

## Waiver validation disposition

The initial real Waivers evidence showed acceptable responsiveness but did not expose exhaustive-run diagnostics. TCW-012 exposed the engine's existing `consideredAdds`, `completeAdds`, `scenarioCount`, and `qualifiedAdds` values without changing waiver behavior. The deployed authenticated TCW-014 retest then showed 89 considered adds, 88 complete adds, 352 scenarios, and 0 qualified adds while the page remained responsive. Independent Auditor PR #78 returned PASS CANDIDATE with no findings. TCW-015 integrated that evidence and FV-WAIVER-01 is passed.

Key checkpoints:
- TCW-012 implementation PR #74: merge `0d9e7b55b267d9eb3f0876fe077e1f19dc38f453`; workflow #463 PASS.
- TCW-014 evidence intake PR #77: merge `01eeacb0d4362384ede99603e13327cca0ce1e76`; workflow #468 PASS.
- TCW-014 Auditor PR #78: merge `4ccdefcd3bda4cb527f91552b7533694b15675ae`; workflow #470 PASS.
- TCW-015 field integration PR #79: merge `ae932395f87f77aad2c067ca16dc1042d4f79786`; workflow #473 PASS.

## Recovery validation disposition

The recovery loop remains closed: TCW-009 remediated the TCW-005 stale/live-label and failure-guidance defects, the independent post-remediation field retest passed, and FV-RECOVERY-01 remains passed.

## Workflow V3.1 operating state

Permanent team:
- Manager / Architect
- Implementation Engineer / Builder
- In-Season Strategy & Decision Intelligence Analyst
- R&D
- Independent Auditor / QA

Troubleshooting & Root Cause remains temporary/on-demand.

`.ai/shared/ACTIVE_TASKS.json` is the single machine-authoritative operational task registry. `config/field-validation.json` is separately authoritative for Release 1.0 field status.

## Active coordination state

No operational task is active after TCW-015 closeout. Manager and specialist roles are idle/event-driven until a genuine remaining field prerequisite, reproduced defect, or approved workflow task is ready.

## Completed coordination

- TCW-001 through TCW-011 — completed/closed under their recorded evidence.
- TCW-012 — waiver field diagnostics visibility — CLOSED after implementation/deployment.
- TCW-014 — FV-WAIVER-01 deployed field retest — CLOSED / PASS CANDIDATE accepted.
- TCW-015 — FV-WAIVER-01 evidence integration and closeout — CLOSED after PR #79 and workflow #473.

## Known gated work

The five remaining Release 1.0 checks require genuine prerequisites: screen-reader validation, an authenticated custom FLEX/OP league, natural IR edge states, a real lock/availability transition, and real playoff/bye-season states. Do not manufacture these conditions.

Post-1.0 Roadmap Discovery input remains recorded in `.ai/shared/ROADMAP.md` and `docs/post-1.0-roadmap-candidates.md`. No successor milestone is authorized.
