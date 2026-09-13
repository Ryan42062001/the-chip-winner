# The Chip Winner — Canonical Project State

Last reconciled: 2026-09-12
Current operating state: Release 1.0 field validation / TCW-009 recovery remediation assigned

## Repository

- Repository: `Ryan42062001/the-chip-winner`.
- Default branch: `master`.
- Workflow V3 integration checkpoint: `61c06843999df6a66236f352627f0fb2c29908c1`.
- Post-1.0 roadmap checkpoint: `e42e17ae2a065557c3ba121aaa4b8f96294360d4`.
- TCW-005 reproduced-defect verdict merged through PR #65 at `42808c3c912742ffb88470a2a6d7b446a97eb9b6`; post-merge workflow #439 passed test, deploy, and production verification.
- Package version: `0.9.88` unless changed by an accepted later implementation.
- Workflow V3 is canonical.

## Product boundary

The Chip Winner remains an ESPN-only, read-only, **in-season** fantasy-football decision companion. ESPN is authoritative for connected-league state. External rankings/projections remain independent overlays. Derived recommendations do not mutate source snapshots. ESPN write actions remain outside Release 1.0.

## Current milestone

### Release 1.0 — trustworthy read-only companion

Status: ACTIVE — FIELD VALIDATION / RECOVERY REMEDIATION

The deterministic implementation baseline remains substantially complete. Current work is evidence-backed field validation and narrow remediation of reproduced field defects, not broad feature expansion.

## Field gate

Authoritative registry: `config/field-validation.json`.

Registry status remains **6 passed / 7 pending** until Manager separately integrates successful field evidence.

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

FV-RECOVERY-01 has now produced a real **FAIL — REPRODUCED DEFECT** verdict under TCW-005 but remains `pending` in the registry because neither Auditor nor Builder is authorized to advance the field status. It cannot pass until remediation is deployed and independently field-retested.

## TCW-005 accepted findings

The real deployed authenticated recovery cycle against `5aea4b9a8a2bcdbae104a04237e00a4c9fe3f373` established:

- successful online authenticated Refresh ESPN;
- genuine client network loss followed by failed Refresh ESPN;
- the prior valid snapshot remained usable;
- the persistent source label remained `Live ESPN snapshot` with the prior capture label;
- navigation remained functional with no sample fallback and removed the transient failure notice while the live label persisted;
- restoring connectivity allowed Refresh ESPN to succeed again.

Accepted findings:

- **TCW-005-F01 — HIGH / blocking:** retained stale/last-valid data is materially mislabeled as live after failed refresh.
- **TCW-005-F02 — MEDIUM:** network/fetch failure guidance misleadingly directs the user toward ESPN sign-in even when connectivity is the demonstrated cause.

Snapshot retention and reconnect success are positive behaviors and must be preserved.

## Active remediation

### TCW-009 — Recovery State Honesty Remediation

Owner: Implementation Engineer / Builder  
Status: ASSIGNED  
Execution mode: STANDARD_CHAT  
Task: `.ai/manager/tasks/TCW-009.md`  
Expected branch: `builder/tcw-009-recovery-state-remediation`  
Audit required: YES.

Required outcome:
- retain the last valid snapshot after failed refresh;
- add durable failed-refresh/stale qualification that survives navigation without mutating ESPN source facts;
- improve fetch/network failure guidance;
- clear the stale recovery state after a successful reconnect refresh;
- add deterministic regression coverage;
- leave `config/field-validation.json` unchanged until independent field retest succeeds.

After an accepted implementation merges and production verification passes, re-activate Independent Auditor under TCW-005 for the same real deployed failure/reconnect field sequence.

## Workflow V3 operating state

Permanent team:
- Manager / Architect
- Implementation Engineer / Builder
- In-Season Strategy & Decision Intelligence Analyst
- R&D
- Independent Auditor / QA

Troubleshooting & Root Cause remains temporary/on-demand.

`ROLE = DURABLE`, `CHAT = DISPOSABLE`, `TASK = UNIT OF WORK`, `REPOSITORY = MEMORY`, `MANAGER = ROUTER / INTEGRATOR`.

## Active coordination state

- Manager — ACTIVE/event-driven for TCW-009 integration and Release 1.0 field-gate orchestration.
- Builder — ACTIVE on TCW-009.
- Auditor — IDLE/BLOCKED on TCW-005 until TCW-009 is merged, deployed, and production-verified.
- R&D — IDLE; no unresolved research dependency is needed for the reproduced recovery defect.
- In-Season Strategy — IDLE; no recommendation-policy uncertainty is involved.
- Troubleshooting & Root Cause — IDLE/not instantiated unless Builder reaches the anti-loop escalation threshold.

No parallel specialist wave is justified while TCW-009 is the hard dependency for recovery validation.

## Completed coordination

- TCW-001 — canonical `.ai` workflow bootstrap — COMPLETE.
- TCW-002 — independent Release 1.0 baseline audit — COMPLETE / PASS WITH NON-BLOCKING FINDINGS.
- TCW-003 — ESPN field-validation feasibility research — COMPLETE.
- TCW-004 — evidence-wave integration/canonical authority reconciliation — COMPLETE.
- TCW-005 — independent recovery field run completed with FAIL — REPRODUCED DEFECT; now blocked pending TCW-009 remediation/retest.
- TCW-006 — blocked recovery-field reconciliation — CLOSED.
- TCW-007 — Workflow V3 operating upgrade — CLOSED.
- TCW-008 — post-1.0 roadmap candidate sequencing — CLOSED.

## Known gated work

Other Release 1.0 checks remain gated by their real prerequisites: screen-reader validation, a custom FLEX/OP league, natural IR edge states, real lock/availability transitions, seasonal playoff/bye states, and waiver enumeration/timing evidence.

Post-1.0 Roadmap Discovery input remains recorded in `.ai/shared/ROADMAP.md` and `docs/post-1.0-roadmap-candidates.md`. No successor milestone is authorized. Other future work remains gated, including future-only IR-assisted stash discovery, server-side models, additional external sources, and ESPN write actions.
