# Active Assignments

Last updated: 2026-09-13
Fast-path registry: `.ai/shared/ACTIVE_TASKS.json`
Workflow overlay: `.ai/shared/WORKFLOW_V3_1.md`

## Completed coordination

- TCW-001 — canonical `.ai` workflow bootstrap — COMPLETE.
- TCW-002 — independent Release 1.0 baseline audit — COMPLETE / PASS WITH NON-BLOCKING FINDINGS.
- TCW-003 — ESPN field-validation feasibility research — COMPLETE.
- TCW-004 — evidence-wave integration/canonical authority reconciliation — COMPLETE.
- TCW-005 — recovery field validation — COMPLETE / POST-REMEDIATION PASS CANDIDATE ACCEPTED through Auditor PR #70.
- TCW-006 — blocked recovery-field reconciliation — CLOSED.
- TCW-007 — Workflow V3 operating upgrade — CLOSED.
- TCW-008 — post-1.0 roadmap candidate sequencing — CLOSED.
- TCW-009 — Recovery State Honesty Remediation — CLOSED after PR #67 merge/deploy and successful independent TCW-005 field retest.
- TCW-010 — Workflow V3.1 coordination hardening — CLOSED.
- TCW-011 — FV-RECOVERY-01 evidence integration and recovery-loop closeout — CLOSED.

## TCW-012 — Waiver Field Diagnostics Visibility

Role: Implementation Engineer / Builder
Status: `ASSIGNED`
Task: `.ai/manager/tasks/TCW-012.md`
Expected branch: `builder/tcw-012-waiver-field-diagnostics`
Assignment master: `074e110e85189f4473502c1c7fa72a18d88a2a10`
Execution mode: STANDARD_CHAT

Real FV-WAIVER-01 recording confirmed acceptable deployed responsiveness, but the required exhaustive-run diagnostics were not visible. The engine already returns `consideredAdds`, `completeAdds`, `scenarioCount`, and `qualifiedAdds`; TCW-012 is limited to exposing those existing values truthfully in the Waivers UI with deterministic regression coverage.

No waiver enumeration, legality, priority, projection, threshold, ranking, or candidate-cap behavior may change. `config/field-validation.json` remains unchanged until a deployed real retest captures the diagnostics.

Next gate: Builder implementation PR -> Manager review/integration -> verified deployment -> real FV-WAIVER-01 retest.

## Field state

FV-RECOVERY-01 is passed. Release 1.0 remains **7 passed / 6 pending** while FV-WAIVER-01 stays pending.

## Role state

### Manager / Architect
ACTIVE — overseeing TCW-012 and Release 1.0 field-gate orchestration.

### Implementation Engineer / Builder
ASSIGNED — TCW-012.

### In-Season Strategy & Decision Intelligence Analyst
IDLE — no recommendation-policy ambiguity exists in TCW-012.

### R&D
IDLE — no research dependency exists in TCW-012.

### Independent Auditor / QA
IDLE — real field evidence is required after deployment; no pre-merge independent audit is required for this transparency-only change.

### Troubleshooting & Root Cause Engineer
IDLE / not instantiated.
