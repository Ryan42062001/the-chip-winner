# The Chip Winner — Canonical Project State

Last reconciled: 2026-09-12
Current operating state: Release 1.0 field validation / TCW-005 post-remediation recovery retest waiting on external evidence

## Repository

- Repository: `Ryan42062001/the-chip-winner`.
- Default branch: `master`.
- Workflow V3 integration checkpoint: `61c06843999df6a66236f352627f0fb2c29908c1`.
- Post-1.0 roadmap checkpoint: `e42e17ae2a065557c3ba121aaa4b8f96294360d4`.
- TCW-005 reproduced-defect verdict merged through PR #65 at `42808c3c912742ffb88470a2a6d7b446a97eb9b6`; post-merge workflow #439 passed test, deploy, and production verification.
- TCW-009 remediation merged through PR #67 at `267b44e7ccea02b903938ead2ee4658d60c2d20b`; post-merge workflow #444 passed test, deploy, and production verification.
- Workflow V3.1 merged through PR #68 at `86f1fadfb071f811d681de9244899a8abc2957e5`; post-merge workflow #448 passed test, deploy, and production verification.
- Package version: `0.9.88` unless changed by an accepted later implementation.
- Workflow V3.1 is canonical through `.ai/shared/WORKFLOW_V3_1.md` over the V3 base workflow.

## Product boundary

The Chip Winner remains an ESPN-only, read-only, **in-season** fantasy-football decision companion. ESPN is authoritative for connected-league state. External rankings/projections remain independent overlays. Derived recommendations do not mutate source snapshots. ESPN write actions remain outside Release 1.0.

## Current milestone

### Release 1.0 — trustworthy read-only companion

Status: ACTIVE — FIELD VALIDATION / RECOVERY RETEST

The deterministic implementation baseline remains substantially complete. Current work is evidence-backed field validation and independent retest of deployed remediation, not broad feature expansion.

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

FV-RECOVERY-01 produced a real **FAIL — REPRODUCED DEFECT** verdict under TCW-005 and remains `pending` in the field registry. TCW-009 has now been remediated, merged, deployed, and production-verified, but the field item cannot pass until the same real failure/reconnect sequence is independently retested.

## TCW-005 accepted findings

The real deployed authenticated recovery cycle against `5aea4b9a8a2bcdbae104a04237e00a4c9fe3f373` established:

- successful online authenticated Refresh ESPN;
- genuine client network loss followed by failed Refresh ESPN;
- the prior valid snapshot remained usable;
- the persistent source label remained `Live ESPN snapshot` with the prior capture label;
- navigation remained functional with no sample fallback and removed the transient failure notice while the live label persisted;
- restoring connectivity allowed Refresh ESPN to succeed again.

Accepted findings:

- **TCW-005-F01 — HIGH / blocking:** retained stale/last-valid data was materially mislabeled as live after failed refresh.
- **TCW-005-F02 — MEDIUM:** network/fetch failure guidance misleadingly directed the user toward ESPN sign-in even when connectivity was the demonstrated cause.

Snapshot retention and reconnect success were positive behaviors and were required to be preserved by remediation.

## Recovery remediation / retest gate

### TCW-009 — Recovery State Honesty Remediation

Owner: Implementation Engineer / Builder  
Status: AUDIT_READY  
Execution mode: STANDARD_CHAT  
Task: `.ai/manager/tasks/TCW-009.md`  
Builder PR: #67  
Merged checkpoint: `267b44e7ccea02b903938ead2ee4658d60c2d20b`  
Post-merge workflow #444: test, deploy, and production verification PASS.

Implemented outcome:
- retain the last valid snapshot after failed refresh;
- add durable failed-refresh/stale qualification that survives navigation without mutating ESPN source facts;
- improve fetch/network failure guidance;
- clear the stale recovery state after a successful reconnect refresh;
- add deterministic regression coverage;
- leave `config/field-validation.json` unchanged until independent field retest succeeds.

TCW-005 is now `WAITING_EXTERNAL_EVIDENCE`. The next required input is a real user-operated deployed failure/reconnect retest with privacy-safe observations. After that evidence exists, Independent Auditor resumes TCW-005 for the verdict.

## Workflow V3.1 operating state

Permanent team:
- Manager / Architect
- Implementation Engineer / Builder
- In-Season Strategy & Decision Intelligence Analyst
- R&D
- Independent Auditor / QA

Troubleshooting & Root Cause remains temporary/on-demand.

`ROLE = DURABLE`, `CHAT = DISPOSABLE`, `TASK = UNIT OF WORK`, `REPOSITORY = MEMORY`, `MANAGER = ROUTER / INTEGRATOR`.

Workflow V3.1 additionally establishes:
- `.ai/shared/ACTIVE_TASKS.json` as the single machine-authoritative operational registry;
- `WAITING_EXTERNAL_EVIDENCE` and `VERIFYING_MASTER` lifecycle states;
- atomic merge -> master verification -> canonical reconciliation before closeout;
- the reproduced-defect fast lane;
- verification matrices in meaningful handoffs;
- PR/task supersession controls;
- assignment-staleness classification;
- `npm run audit:workflow`, enforced through the existing `npm test` CI gate.

## Active coordination state

- Manager — ACTIVE/event-driven for Release 1.0 field-gate orchestration and evidence integration.
- Builder — IDLE; TCW-009 implementation is merged and deployed, with status `AUDIT_READY` pending independent field retest.
- Auditor — `WAITING_EXTERNAL_EVIDENCE` on TCW-005 until the real deployed recovery retest is performed.
- R&D — IDLE; no unresolved research dependency is needed for the recovery retest.
- In-Season Strategy — IDLE; no recommendation-policy uncertainty is involved.
- Troubleshooting & Root Cause — IDLE/not instantiated.

No parallel specialist wave is justified while the next recovery gate is external field evidence.

## Completed coordination

- TCW-001 — canonical `.ai` workflow bootstrap — COMPLETE.
- TCW-002 — independent Release 1.0 baseline audit — COMPLETE / PASS WITH NON-BLOCKING FINDINGS.
- TCW-003 — ESPN field-validation feasibility research — COMPLETE.
- TCW-004 — evidence-wave integration/canonical authority reconciliation — COMPLETE.
- TCW-005 — initial real recovery field run completed with FAIL — REPRODUCED DEFECT; now waiting on post-remediation external retest evidence.
- TCW-006 — blocked recovery-field reconciliation — CLOSED.
- TCW-007 — Workflow V3 operating upgrade — CLOSED.
- TCW-008 — post-1.0 roadmap candidate sequencing — CLOSED.
- TCW-010 — Workflow V3.1 coordination hardening — CLOSED after PR #68 merge and successful master workflow #448 verification.

TCW-009 implementation is complete and deployed but remains `AUDIT_READY` until TCW-005 independently retests the real deployed behavior.

## Known gated work

Other Release 1.0 checks remain gated by their real prerequisites: screen-reader validation, a custom FLEX/OP league, natural IR edge states, real lock/availability transitions, seasonal playoff/bye states, and waiver enumeration/timing evidence.

Post-1.0 Roadmap Discovery input remains recorded in `.ai/shared/ROADMAP.md` and `docs/post-1.0-roadmap-candidates.md`. No successor milestone is authorized. Other future work remains gated, including future-only IR-assisted stash discovery, server-side models, additional external sources, and ESPN write actions.
