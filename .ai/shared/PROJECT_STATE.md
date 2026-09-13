# The Chip Winner — Canonical Project State

Last reconciled: 2026-09-13
Current operating state: Release 1.0 field validation / TCW-018 post-remediation lock retest

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

At the product owner's explicit direction, TCW-019 removed the pending manual screen-reader field item `FV-A11Y-02` from the Release 1.0 field registry rather than falsely marking it passed. Existing keyboard-only and real 200% zoom field evidence remains preserved. Automated accessibility/readiness regression checks remain deployment-blocking CI and durable decision TCW-D012 records this scope boundary.

## Lock-transition validation disposition

TCW-018 received real deployed evidence across one naturally occurring ESPN game-lock transition. Independent Auditor PR #93 returned `FAIL — REPRODUCED DEFECT` with accepted finding `TCW-018-F01 — MEDIUM — BLOCKING`: the complete-lineup optimizer respected the real lock, while the separate START / SIT comparison remained actionable-looking after the selected player had locked.

TCW-020 implemented the bounded lock-awareness remediation in Builder PR #95. The deployed fix reuses `getLineupLockReason()` from the complete-lineup optimizer. When either selected START / SIT player is explicitly locked by ESPN or kickoff has passed, the comparison becomes clearly informational/non-actionable rather than showing an unqualified actionable projection lean. Unlocked comparison behavior and source separation remain protected.

Verified production integration:
- PR #95 exact-head workflow #508: PASS;
- merged master: `b6e6a2dabb0e2d9e404704d7e8997110ce403060`;
- master workflow #509: test PASS, GitHub Pages deploy PASS, production smoke PASS.

Integration evidence is preserved at `.ai/manager/evidence/TCW-020_START_SIT_LOCK_REMEDIATION_INTEGRATION.md`.

TCW-020 is closed. TCW-018 is reactivated for a fresh Independent Auditor post-remediation deployed lock-state retest. Existing real pre-lock/transition evidence should be reused where valid; no lock state or roster transaction may be manufactured.

`FV-ESPN-05` remains pending until that independent retest returns `PASS CANDIDATE` and Manager separately integrates the field registry.

## IR validation disposition

The IR field loop is closed for the current Release 1.0 contract. Real deployed authenticated evidence established a naturally occurring supported eligible/filled IR state. The Chip Winner preserved the real IR occupant and normalized status, preserved the observed numeric zero projection, kept the occupant outside the active lineup path, retained legality-aware Waivers behavior, and preserved the configured IR slot without a manufactured roster transaction.

Independent Auditor TCW-016 / PR #84 returned `PASS CANDIDATE` with no findings. Manager TCW-017 / PR #85 integrated FV-ESPN-04 as passed.

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

- TCW-018 is assigned to Independent Auditor / QA for the post-remediation deployed lock-state retest.
- Builder is idle after verified TCW-020 production integration.
- Strategy, R&D, and Troubleshooting remain idle.

## Known gated work

FV-ESPN-02 still requires a real authenticated custom FLEX/OP/Superflex league. FV-SEASON-01 still requires real playoff/bye-season states. FV-ESPN-05 requires the active TCW-018 independent post-remediation field verdict. Do not manufacture any field condition.

Post-1.0 Roadmap Discovery input remains recorded in `.ai/shared/ROADMAP.md` and `docs/post-1.0-roadmap-candidates.md`. No successor milestone is authorized.
