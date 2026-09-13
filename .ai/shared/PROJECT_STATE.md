# The Chip Winner — Canonical Project State

Last reconciled: 2026-09-13
Current operating state: Release 1.0 field validation / no active operational task

## Repository

- Repository: `Ryan42062001/the-chip-winner`.
- Default branch: `master`.
- Workflow V3.1 is canonical through `.ai/shared/WORKFLOW_V3_1.md` over `.ai/shared/WORKFLOW.md`.
- Package version: `0.9.88` unless changed by a later accepted implementation.
- TCW-013 workflow hardening remains active: `.ai/**`-only master changes run the full test gate while Pages deploy and production smoke are skipped as not applicable.

## Product boundary

The Chip Winner remains an ESPN-only, read-only, **in-season** fantasy-football decision companion. ESPN is authoritative for connected-league state. External rankings/projections remain independent overlays. Derived recommendations do not mutate source snapshots. ESPN write actions remain outside Release 1.0.

## Current milestone

### Release 1.0 — trustworthy read-only companion

Status: ACTIVE — FIELD VALIDATION

The deterministic implementation baseline remains substantially complete. Current work is genuine real-world validation and bounded remediation only when a field defect is reproduced or evidence visibility is insufficient.

## Field gate

Authoritative registry: `config/field-validation.json`.

Registry status is **9 passed / 4 pending**.

Passed:
- FV-A11Y-01
- FV-A11Y-03
- FV-MOBILE-01
- FV-ESPN-01
- FV-ESPN-03
- FV-ESPN-04
- FV-RECOVERY-01
- FV-SYNC-01
- FV-WAIVER-01

Pending:
- FV-A11Y-02
- FV-ESPN-02
- FV-ESPN-05
- FV-SEASON-01

## IR validation disposition

The IR field loop is closed for the current Release 1.0 contract. Real deployed authenticated evidence established a naturally occurring supported eligible/filled IR state. The Chip Winner preserved the real IR occupant and normalized status, preserved the observed numeric zero projection, kept the occupant outside the active lineup path, retained legality-aware Waivers behavior, and preserved the configured IR slot without a manufactured roster transaction.

Independent Auditor TCW-016 / PR #84 returned `PASS CANDIDATE` with no findings. Manager TCW-017 / PR #85 integrated FV-ESPN-04 as passed at `55b9322fcb4ed37a2fa20ac3ce3564ce9463abab`; master workflow #485 passed full tests, Pages deployment, and production verification. The pass is intentionally bounded to the observed supported eligible/filled state and does not infer grandfathered, invalid, over-capacity, unsupported, or unverified IR states.

## Waiver validation disposition

The waiver field loop is closed. TCW-012 exposed existing exhaustive-run diagnostics, TCW-014 independently passed the deployed real retest, and TCW-015 integrated FV-WAIVER-01 as passed.

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

No operational task is active after TCW-017 closeout. All durable roles are idle/event-driven until a genuine remaining field prerequisite, reproduced defect, or approved workflow task is ready.

## Known gated work

The four remaining Release 1.0 checks require genuine prerequisites: screen-reader validation, an authenticated custom FLEX/OP league, a real lock/availability transition, and real playoff/bye-season states. Do not manufacture these conditions.

Post-1.0 Roadmap Discovery input remains recorded in `.ai/shared/ROADMAP.md` and `docs/post-1.0-roadmap-candidates.md`. No successor milestone is authorized.
