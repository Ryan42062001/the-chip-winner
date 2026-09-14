# The Chip Winner — Canonical Project State

Last reconciled: 2026-09-14
Current operating state: Release 1.0 field validation — 10 passed / 2 pending

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

Registry status is **10 passed / 2 pending**.

Passed:
- FV-A11Y-01
- FV-A11Y-03
- FV-MOBILE-01
- FV-ESPN-01
- FV-ESPN-03
- FV-ESPN-04
- FV-ESPN-05
- FV-RECOVERY-01
- FV-SYNC-01
- FV-WAIVER-01

Pending:
- FV-ESPN-02
- FV-SEASON-01

## Lock-transition validation disposition

The TCW-018 / TCW-020 lock-transition loop is closed.

A genuine real pre-kickoff -> post-kickoff ESPN transition originally reproduced stale actionable-looking generic START / SIT guidance after the observed player locked. Independent Auditor PR #93 returned `FAIL — REPRODUCED DEFECT` with accepted finding `TCW-018-F01 — MEDIUM — BLOCKING`.

TCW-020 implemented bounded START / SIT lock awareness in Builder PR #95. The deployed fix reuses `getLineupLockReason()` from the complete-lineup optimizer. When either selected START / SIT player is explicitly locked by ESPN or kickoff has passed, the comparison becomes clearly informational/non-actionable rather than showing an unqualified actionable projection lean.

Verified remediation production baseline:
- PR #95 exact-head workflow #508: PASS;
- merged master `b6e6a2dabb0e2d9e404704d7e8997110ce403060`;
- master workflow #509: test PASS, GitHub Pages deploy PASS, production smoke PASS.

Independent post-remediation Auditor PR #98 used a genuine naturally locked/post-kickoff deployed state and returned `PASS CANDIDATE` with no findings. The comparison rendered `LINEUP MOVE LOCKED · INFORMATION ONLY` and `NO LINEUP ACTION`, the prior actionable `PROJECTION LEAN` was absent, and ESPN/FantasyPros projection context remained source-separated and informational. No lock state or roster transaction was manufactured.

Manager accepted the verdict and integrated `FV-ESPN-05` as passed through PR #99. Initial master workflow #519 stopped before deployment only on V3.1 assignment staleness. Manager PR #100 repaired the verification lifecycle and reconciled field status.

Final verified production integration:
- master `85e4c6dfe1667be88cb5caec59216aca7c62f0d7`;
- workflow #522: full test PASS;
- GitHub Pages deploy PASS;
- production smoke PASS.

Durable integration evidence:
- `.ai/manager/evidence/TCW-018_LOCK_FIELD_INTAKE.md`
- `.ai/manager/evidence/TCW-020_START_SIT_LOCK_REMEDIATION_INTEGRATION.md`
- `.ai/manager/evidence/TCW-018_LOCK_FIELD_INTEGRATION.md`

The FV-ESPN-05 pass is bounded to the observed genuine game-lock/post-kickoff behavior; unobserved injury/availability transitions or other lock variants are not inferred.

## Accessibility release-scope disposition

At the product owner's explicit direction, TCW-019 removed the pending manual screen-reader field item `FV-A11Y-02` from the Release 1.0 field registry rather than falsely marking it passed. Existing keyboard-only and real 200% zoom field evidence remains preserved. Automated accessibility/readiness regression checks remain deployment-blocking CI and durable decision TCW-D012 records this scope boundary.

## IR validation disposition

The IR field loop is closed for the current Release 1.0 contract. Real deployed authenticated evidence established a naturally occurring supported eligible/filled IR state. Independent Auditor TCW-016 / PR #84 returned `PASS CANDIDATE` with no findings, and Manager TCW-017 integrated FV-ESPN-04 as passed.

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

No Manager-approved active task is registered after TCW-018 closeout.

Manager, Builder, Strategy, R&D, Auditor, and Troubleshooting are idle until a genuine remaining field condition is available or Manager authorizes another bounded task.

## Known gated work

`FV-ESPN-02` still requires a real authenticated custom FLEX/OP/Superflex-style league.

`FV-SEASON-01` still requires genuine playoff/bye-season states.

Do not manufacture either field condition.

Post-1.0 Roadmap Discovery input remains recorded in `.ai/shared/ROADMAP.md` and `docs/post-1.0-roadmap-candidates.md`. No successor milestone is authorized.
