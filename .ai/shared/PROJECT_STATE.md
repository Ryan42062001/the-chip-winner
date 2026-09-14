# The Chip Winner — Canonical Project State

Last reconciled: 2026-09-14
Current operating state: Release 1.0 field validation — TCW-021 scope integration

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

The deterministic implementation baseline remains substantially complete. Current work is genuine real-world validation, bounded remediation for reproduced defects, and explicit product-owner release-scope decisions.

## Field gate

Authoritative registry: `config/field-validation.json`.

Candidate registry status after TCW-021 integration is **10 passed / 1 pending**.

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
- FV-SEASON-01

Removed from Release 1.0 scope rather than falsely marked passed:
- FV-A11Y-02 — manual screen-reader certification, under TCW-D012;
- FV-ESPN-02 — custom FLEX/OP/Superflex field certification, under TCW-D013.

## Custom FLEX / OP release-scope disposition

At the product owner's explicit direction, TCW-021 removes `FV-ESPN-02 — Authenticated custom FLEX or OP league` from the Release 1.0 field registry rather than marking it passed without evidence.

This is a release-certification scope decision only. It does **not** remove ordinary FLEX support, lineup-slot normalization, eligibility enforcement, fail-closed behavior, or automated regression coverage. Existing authenticated standard-league evidence already includes a normal FLEX slot and remains preserved. No unobserved custom OP/Superflex behavior is claimed as field-validated.

Durable decision: TCW-D013.

Integration evidence:
- `.ai/manager/evidence/TCW-021_CUSTOM_FLEX_SCOPE_INTEGRATION.md`

TCW-021 remains active until exact-head CI, master tests, Pages deployment, and production smoke verify the scope integration.

## Lock-transition validation disposition

The TCW-018 / TCW-020 lock-transition loop is closed.

A genuine real pre-kickoff -> post-kickoff ESPN transition originally reproduced stale actionable-looking generic START / SIT guidance after the observed player locked. Independent Auditor PR #93 returned `FAIL — REPRODUCED DEFECT` with accepted finding `TCW-018-F01 — MEDIUM — BLOCKING`.

TCW-020 implemented bounded START / SIT lock awareness in Builder PR #95. Independent post-remediation Auditor PR #98 used a genuine naturally locked/post-kickoff deployed state and returned `PASS CANDIDATE` with no findings. Manager integrated `FV-ESPN-05` as passed.

Verified production integration:
- product integration master `85e4c6dfe1667be88cb5caec59216aca7c62f0d7`;
- workflow #522: full test PASS, GitHub Pages deploy PASS, production smoke PASS;
- final TCW-018 closeout master `04dc0c4a349bb41faa331ca12cfbe26d80b21a34`;
- workflow #524: full test gate PASS.

The FV-ESPN-05 pass remains bounded to the observed genuine game-lock/post-kickoff behavior; unobserved injury/availability transitions or other lock variants are not inferred.

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

- TCW-021 is owned directly by Manager / Architect for the bounded release-scope integration.
- Builder, Strategy, R&D, Auditor, and Troubleshooting are idle.

## Known gated work

`FV-SEASON-01` is the sole remaining Release 1.0 field item and still requires genuine playoff/bye-season states. Do not manufacture that field condition.

Custom OP/Superflex field certification is not a Release 1.0 gate under TCW-D013. It may be reconsidered later only through explicit product-owner authorization.

Post-1.0 Roadmap Discovery input remains recorded in `.ai/shared/ROADMAP.md` and `docs/post-1.0-roadmap-candidates.md`. No successor milestone is authorized.
