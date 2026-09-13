# The Chip Winner — Canonical Project State

Last reconciled: 2026-09-13
Current operating state: Release 1.0 field validation / TCW-012 Builder assignment active

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
- TCW-011 canonical closeout: PR #72, merge `074e110e85189f4473502c1c7fa72a18d88a2a10`, workflow #458 PASS.
- Package version: `0.9.88` unless changed by a later accepted implementation.
- Workflow V3.1 is canonical through `.ai/shared/WORKFLOW_V3_1.md` over the V3 base workflow.

## Product boundary

The Chip Winner remains an ESPN-only, read-only, **in-season** fantasy-football decision companion. ESPN is authoritative for connected-league state. External rankings/projections remain independent overlays. Derived recommendations do not mutate source snapshots. ESPN write actions remain outside Release 1.0.

## Current milestone

### Release 1.0 — trustworthy read-only companion

Status: ACTIVE — FIELD VALIDATION

The deterministic implementation baseline remains substantially complete. Current work is evidence-backed real-world validation and narrow implementation only where necessary to make required field evidence observable without changing decision behavior.

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

## Active task — TCW-012

TCW-012 — Waiver Field Diagnostics Visibility

Owner: Implementation Engineer / Builder  
Status: `ASSIGNED`  
Execution mode: STANDARD_CHAT  
Task: `.ai/manager/tasks/TCW-012.md`  
Expected branch: `builder/tcw-012-waiver-field-diagnostics`  
Assignment master: `074e110e85189f4473502c1c7fa72a18d88a2a10`

Real deployed FV-WAIVER-01 evidence already confirms acceptable observed Waivers-page responsiveness, but the field check also requires the exhaustive-run values `consideredAdds`, `completeAdds`, `scenarioCount`, and `qualifiedAdds`.

Repository review confirmed that `buildWaiverPriorityBoard()` already returns all four values under `futureDiscovery`. The current Waivers UI displays only the qualified-add count. TCW-012 is therefore a bounded transparency/UI task: surface all four existing values when discovery is `ready`, preserve truthful blocked/unavailable reasons otherwise, and add deterministic UI coverage.

Protected behavior:
- no enumeration/filter changes;
- no hidden candidate cap;
- no waiver legality/ranking/priority/threshold/projection changes;
- no field-registry change from the Builder task.

After verified deployment, a real authenticated Waivers recording must capture the visible diagnostics before FV-WAIVER-01 can pass.

## Recovery validation disposition

The initial TCW-005 real authenticated failure/reconnect run reproduced TCW-005-F01 and TCW-005-F02. TCW-009 remediated both findings, the independent post-remediation retest returned PASS CANDIDATE, and TCW-011 integrated the evidence. FV-RECOVERY-01 is passed and no unresolved recovery defect remains from that sequence.

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

- Manager — ACTIVE / overseeing TCW-012 and Release 1.0 field-gate orchestration.
- Builder — ASSIGNED / TCW-012.
- Auditor — IDLE pending deployed field evidence.
- R&D — IDLE; no unresolved research dependency exists for TCW-012.
- In-Season Strategy — IDLE; no recommendation-policy ambiguity exists for TCW-012.
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
- TCW-011 — FV-RECOVERY-01 evidence integration and recovery-loop closeout — CLOSED.

## Known gated work

FV-WAIVER-01 has an active implementation-ready observability task under TCW-012. The other five pending checks still require their real prerequisites: screen-reader validation, a custom FLEX/OP league, natural IR edge states, real lock/availability transitions, and seasonal playoff/bye states.

Post-1.0 Roadmap Discovery input remains recorded in `.ai/shared/ROADMAP.md` and `docs/post-1.0-roadmap-candidates.md`. No successor milestone is authorized.
