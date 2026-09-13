# The Chip Winner — Canonical Project State

Last reconciled: 2026-09-13
Current operating state: Release 1.0 field validation / TCW-016 independent IR-field audit assigned

## Repository

- Repository: `Ryan42062001/the-chip-winner`.
- Default branch: `master`.
- Workflow V3.1 is canonical through `.ai/shared/WORKFLOW_V3_1.md` over `.ai/shared/WORKFLOW.md`.
- Package version: `0.9.88` unless changed by a later accepted implementation.
- TCW-013 workflow hardening closed on master `c454072927b0984bd76ee9bfa7fbe889847fd5bf`; its `.ai/**`-only closeout master workflow proved full tests still run while Pages deploy and production smoke are skipped as not applicable.

## Product boundary

The Chip Winner remains an ESPN-only, read-only, **in-season** fantasy-football decision companion. ESPN is authoritative for connected-league state. External rankings/projections remain independent overlays. Derived recommendations do not mutate source snapshots. ESPN write actions remain outside Release 1.0.

## Current milestone

### Release 1.0 — trustworthy read-only companion

Status: ACTIVE — FIELD VALIDATION

The deterministic implementation baseline remains substantially complete. Current work is genuine real-world validation and bounded remediation only when a field defect is reproduced or evidence visibility is insufficient.

## Field gate

Authoritative registry: `config/field-validation.json`.

Registry status remains **8 passed / 5 pending** until TCW-016 receives an independent verdict and any accepted pass is integrated.

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

## Active IR validation

Real deployed evidence has now been received for `FV-ESPN-04`:
- ESPN showed a real player occupying the league IR slot with IR designation;
- a successful authenticated refresh preserved the same player in The Chip Winner IR section with normalized `INJURED_RESERVE` status;
- the IR occupant remained outside the active lineup recommendation path;
- Waivers remained legality-aware;
- League Setup preserved one configured IR slot;
- no transaction was performed to manufacture the state.

TCW-016 routes this privacy-safe evidence to the Independent Auditor. Manager has not changed the field registry and will not declare a pass before the independent verdict.

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

TCW-016 is assigned to the Independent Auditor for FV-ESPN-04 evidence review. Manager owns integration after the verdict. Builder, Strategy, R&D, and Troubleshooting remain idle unless a reproduced defect or new bounded dependency requires them.

## Known gated work

After the current IR audit, the other pending Release 1.0 checks still require genuine prerequisites: screen-reader validation, an authenticated custom FLEX/OP league, a real lock/availability transition, and real playoff/bye-season states. Do not manufacture these conditions.

Post-1.0 Roadmap Discovery input remains recorded in `.ai/shared/ROADMAP.md` and `docs/post-1.0-roadmap-candidates.md`. No successor milestone is authorized.
