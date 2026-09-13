# The Chip Winner — Canonical Project State

Last reconciled: 2026-09-13
Current operating state: Release 1.0 field validation / TCW-017 IR-field integration in progress

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

The TCW-017 integration branch records **9 passed / 4 pending**.

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

Real deployed authenticated evidence established a naturally occurring supported eligible/filled IR state. ESPN already had one player occupying the configured IR slot with IR designation; Refresh ESPN succeeded; The Chip Winner preserved the occupant in its IR section with normalized `INJURED_RESERVE` status and preserved the observed 0.0 projection; Lineup Lab kept the occupant outside the active recommendation path; Waivers remained legality-aware; League Setup showed one configured IR slot; and no roster transaction was performed to manufacture the state.

Independent Auditor TCW-016 / PR #84 returned `PASS CANDIDATE` with no findings. The verdict is intentionally bounded to the observed supported eligible/filled state and does not infer grandfathered, invalid, over-capacity, unsupported, or unverified IR states. TCW-017 owns final field-registry integration and closeout.

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

TCW-017 is Manager-owned and in progress for accepted IR-field evidence integration. Builder, Auditor, Strategy, R&D, and Troubleshooting remain idle/event-driven.

## Known gated work

After TCW-017 closes, the four remaining Release 1.0 checks require genuine prerequisites: screen-reader validation, an authenticated custom FLEX/OP league, a real lock/availability transition, and real playoff/bye-season states. Do not manufacture these conditions.

Post-1.0 Roadmap Discovery input remains recorded in `.ai/shared/ROADMAP.md` and `docs/post-1.0-roadmap-candidates.md`. No successor milestone is authorized.
