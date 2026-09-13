# Active Assignments

Last updated: 2026-09-12
Fast-path registry: `.ai/shared/ACTIVE_TASKS.json`

## Completed coordination

- TCW-001 — canonical `.ai` workflow bootstrap — COMPLETE.
- TCW-002 — independent Release 1.0 baseline audit — COMPLETE / PASS WITH NON-BLOCKING FINDINGS.
- TCW-003 — ESPN field-validation feasibility research — COMPLETE.
- TCW-004 — evidence-wave integration/canonical authority reconciliation — COMPLETE.
- TCW-006 — blocked recovery-field reconciliation — CLOSED.
- TCW-007 — Workflow V3 operating upgrade — CLOSED.
- TCW-008 — post-1.0 roadmap candidate sequencing — CLOSED.

## TCW-005 — FV-RECOVERY-01 Live Failure/Reconnect Validation

Role: Independent Auditor / QA
Current state: BLOCKED on TCW-009 remediation and deployed retest
Latest verdict: COMPLETE — FAIL — REPRODUCED DEFECT
Auditor PR: #65
Merged verdict checkpoint: `42808c3c912742ffb88470a2a6d7b446a97eb9b6`
Post-merge workflow #439: test, deploy, and production verification PASS.

Accepted findings:
- TCW-005-F01 — HIGH / blocking: retained last-valid ESPN data remained persistently labeled `Live ESPN snapshot` after a failed refresh, including after navigation removed the transient error notice.
- TCW-005-F02 — MEDIUM: a real network/fetch failure displayed authentication-focused guidance even though authentication was unchanged and restoring connectivity alone recovered.

FV-RECOVERY-01 remains not passed. Re-activate Auditor under TCW-005 only after TCW-009 is accepted, merged, deployed, and production-verified.

## TCW-009 — Recovery State Honesty Remediation

Role: Implementation Engineer / Builder
Status: ASSIGNED
Execution mode: STANDARD_CHAT
Task specification: `.ai/manager/tasks/TCW-009.md`
Expected branch: `builder/tcw-009-recovery-state-remediation`
Audit required: YES — independent deployed TCW-005 field retest after accepted implementation.

Objective:
- preserve the last valid ESPN snapshot after refresh failure;
- add durable failed-refresh/stale qualification that survives navigation;
- restore normal live labeling after successful reconnect;
- correct misleading authentication-only fetch/network failure guidance;
- add deterministic regression coverage;
- do not modify the field registry.

## Role state

### Manager / Architect
ACTIVE / event-driven integration for TCW-009 and Release 1.0 field-gate orchestration.

### Implementation Engineer / Builder
ACTIVE — TCW-009.

### In-Season Strategy & Decision Intelligence Analyst
IDLE. No recommendation-policy uncertainty is involved.

### R&D
IDLE. The reproduced defect and requirements are implementation-ready.

### Independent Auditor / QA
IDLE/BLOCKED on TCW-005 until the TCW-009 remediation is deployed and production-verified.

### Troubleshooting & Root Cause Engineer
IDLE / not instantiated. Activate only if Builder reaches the Workflow V3 anti-loop threshold.

No parallel specialist wave is justified while recovery remediation is the hard dependency for FV-RECOVERY-01.
