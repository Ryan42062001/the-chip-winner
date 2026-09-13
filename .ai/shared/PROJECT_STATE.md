# The Chip Winner — Canonical Project State

Last reconciled: 2026-09-13
Current operating state: Release 1.0 field validation / no active implementation task

## Repository

- Repository: `Ryan42062001/the-chip-winner`.
- Default branch: `master`.
- Workflow V3 integration checkpoint: `61c06843999df6a66236f352627f0fb2c29908c1`.
- Post-1.0 roadmap checkpoint: `e42e17ae2a065557c3ba121aaa4b8f96294360d4`.
- Workflow V3.1 integration checkpoint: `86f1fadfb071f811d681de9244899a8abc2957e5`.
- TCW-005 reproduced-defect verdict: PR #65, merge `42808c3c912742ffb88470a2a6d7b446a97eb9b6`.
- TCW-009 remediation: PR #67, merge `267b44e7ccea02b903938ead2ee4658d60c2d20b`, workflow #444 PASS.
- TCW-005 post-remediation PASS CANDIDATE: PR #70, merge `89820c1c5c7f13b91cd4dda304db5faadbae6603`, workflow #454 PASS.
- TCW-011 recovery field integration: PR #71, merge `eb45e87b426c67dca4f36d8fba97cc5bef47e1d4`, workflow #456 PASS.
- Package version: `0.9.88` unless changed by a later accepted implementation.
- Workflow V3.1 is canonical through `.ai/shared/WORKFLOW_V3_1.md` over the V3 base workflow.

## Product boundary

The Chip Winner remains an ESPN-only, read-only, **in-season** fantasy-football decision companion. ESPN is authoritative for connected-league state. External rankings/projections remain independent overlays. Derived recommendations do not mutate source snapshots. ESPN write actions remain outside Release 1.0.

## Current milestone

### Release 1.0 — trustworthy read-only companion

Status: ACTIVE — FIELD VALIDATION

The deterministic implementation baseline remains substantially complete. Current work is evidence-backed real-world validation and narrow remediation only when a field defect is reproduced.

## Field gate

Authoritative registry: `config/field-validation.json`.

Registry status is **7 passed / 6 pending**.

Passed:
- FV-A11Y-01
- FV-A11Y-03
- FV-MOBILE-01
- FV-ESPN-01
- FV-ESPN-03
- FV-RECOVERY-01
- FV-SYNC-01

Pending:
- FV-A11Y-02
- FV-ESPN-02
- FV-ESPN-04
- FV-ESPN-05
- FV-SEASON-01
- FV-WAIVER-01

## Recovery validation disposition

The initial TCW-005 real authenticated failure/reconnect run reproduced:
- **TCW-005-F01 — HIGH / blocking:** retained last-valid ESPN data was materially mislabeled as live after refresh failure.
- **TCW-005-F02 — MEDIUM:** network/fetch failure guidance was misleadingly authentication-focused.

TCW-009 remediated both findings while preserving snapshot retention, navigation safety, no-sample-fallback behavior, successful reconnect, source truth, and read-only boundaries.

The independent post-remediation TCW-005 retest verified:
- successful authenticated online refresh with `Live ESPN snapshot`;
- real client network failure while the last valid ESPN snapshot remained usable;
- durable `Last valid ESPN snapshot · refresh failed` labeling across navigation;
- network/companion/authentication-aware guidance;
- no sample/demo fallback;
- successful reconnect restoring `Live ESPN snapshot`.

Auditor PR #70 returned **PASS CANDIDATE** and TCW-005-F01/F02 did not reproduce. TCW-011 then integrated the privacy-safe evidence and marked FV-RECOVERY-01 passed. No unresolved recovery defect remains from this validation sequence.

## Workflow V3.1 operating state

Permanent team:
- Manager / Architect
- Implementation Engineer / Builder
- In-Season Strategy & Decision Intelligence Analyst
- R&D
- Independent Auditor / QA

Troubleshooting & Root Cause remains temporary/on-demand.

`ROLE = DURABLE`, `CHAT = DISPOSABLE`, `TASK = UNIT OF WORK`, `REPOSITORY = MEMORY`, `MANAGER = ROUTER / INTEGRATOR`.

`.ai/shared/ACTIVE_TASKS.json` is the single machine-authoritative operational task registry. `config/field-validation.json` is separately authoritative for Release 1.0 field status.

## Active coordination state

- Manager — ACTIVE / event-driven for Release 1.0 field-gate orchestration.
- Builder — IDLE.
- Auditor — IDLE.
- R&D — IDLE.
- In-Season Strategy — IDLE.
- Troubleshooting & Root Cause — IDLE / not instantiated.

No parallel specialist wave is currently justified.

## Completed coordination

- TCW-001 — canonical `.ai` workflow bootstrap — COMPLETE.
- TCW-002 — independent Release 1.0 baseline audit — COMPLETE / PASS WITH NON-BLOCKING FINDINGS.
- TCW-003 — ESPN field-validation feasibility research — COMPLETE.
- TCW-004 — evidence-wave integration/canonical authority reconciliation — COMPLETE.
- TCW-005 — recovery field validation — COMPLETE / POST-REMEDIATION PASS CANDIDATE ACCEPTED.
- TCW-006 — blocked recovery-field reconciliation — CLOSED.
- TCW-007 — Workflow V3 operating upgrade — CLOSED.
- TCW-008 — post-1.0 roadmap candidate sequencing — CLOSED.
- TCW-009 — recovery-state honesty remediation — CLOSED after successful independent field retest.
- TCW-010 — Workflow V3.1 coordination hardening — CLOSED.
- TCW-011 — FV-RECOVERY-01 evidence integration and recovery-loop closeout — CLOSED after verified PR #71 integration.

## Known gated work

The six remaining Release 1.0 checks require real prerequisites: screen-reader validation, a custom FLEX/OP league, natural IR edge states, real lock/availability transitions, seasonal playoff/bye states, and waiver enumeration/timing evidence.

Post-1.0 Roadmap Discovery input remains recorded in `.ai/shared/ROADMAP.md` and `docs/post-1.0-roadmap-candidates.md`. No successor milestone is authorized. Other future work remains gated, including future-only IR-assisted stash discovery, server-side models, additional external sources, and ESPN write actions.
