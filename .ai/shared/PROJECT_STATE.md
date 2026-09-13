# The Chip Winner — Canonical Project State

Last reconciled: 2026-09-13
Current operating state: Release 1.0 field validation / TCW-018 waiting for real game-lock evidence

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

Registry status is **9 passed / 3 pending**.

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
- FV-ESPN-02
- FV-ESPN-05
- FV-SEASON-01

## Accessibility release-scope disposition

At the product owner's explicit direction, TCW-019 removed the pending manual screen-reader field item `FV-A11Y-02` from the Release 1.0 field registry rather than falsely marking it passed. Existing keyboard-only and real 200% zoom field evidence remains preserved. Automated accessibility/readiness regression checks remain deployment-blocking CI and passed during the TCW-019 integration. Durable decision TCW-D012 records this scope boundary.

TCW-019 PR #88 integrated the scope change. A master-only lifecycle guard correctly caught stale `IN_PROGRESS` coordination after that merge, and repair PR #89 reconciled the task to `VERIFYING_MASTER`; master `7e5d7bca6a5c608dd399b73c84ee4fae95ac2947` then passed workflow #495 including full tests, Pages deployment, and production smoke.

## Active lock-transition validation

TCW-018 is pre-staged for `FV-ESPN-05`. It is intentionally `WAITING_EXTERNAL_EVIDENCE` until a real authenticated player crosses a genuine game-lock or availability transition. The evidence contract requires pre-transition and post-transition deployed refreshes and enough repeated UI context to determine whether prior advice is revalidated, withdrawn, qualified, or made non-actionable when required. No lock state or roster transaction may be manufactured merely to satisfy the field check.

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

TCW-018 is the sole active task. It is Manager-owned and waiting on real field evidence. Builder, Auditor, Strategy, R&D, and Troubleshooting remain idle/event-driven until that evidence arrives or a new bounded dependency is approved.

## Known gated work

The three remaining Release 1.0 field checks require genuine prerequisites: an authenticated custom FLEX/OP league, a real lock/availability transition, and real playoff/bye-season states. Do not manufacture these conditions.

Post-1.0 Roadmap Discovery input remains recorded in `.ai/shared/ROADMAP.md` and `docs/post-1.0-roadmap-candidates.md`. No successor milestone is authorized.
