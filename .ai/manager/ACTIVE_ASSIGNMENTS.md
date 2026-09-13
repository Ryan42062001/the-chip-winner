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
Execution mode: STANDARD_CHAT

TCW-012 remains the bounded Waivers transparency task. It does not overlap TCW-013 workflow/tooling files.

Next gate: Builder implementation PR -> Manager review/integration -> verified deployment -> real FV-WAIVER-01 retest.

## TCW-013 — Control-Plane CI Efficiency & Durable-State Deduplication

Role: Manager / Architect
Status: `IN_PROGRESS`
Task: `.ai/manager/tasks/TCW-013.md`
Branch: `manager/tcw-013-workflow-efficiency`
Assignment master: `c66c02302fa014eb50ddbdf0e5a9dd4b933641dd`
Execution mode: STANDARD_CHAT
Dependency: INDEPENDENT

Scope:
- retain the full CI/test gate for every PR/push;
- skip Pages deploy + production smoke only for `master` commits whose changed paths are entirely `.ai/**`;
- fail open to deployment when scope classification is unavailable;
- keep manual workflow dispatch deploying;
- remove volatile active-task claims from the durable roadmap.

Parallel classification: non-overlapping Manager workflow/tooling work. If TCW-013 merges before TCW-012, treat that target advancement as `CONTROL_PLANE_ONLY` for TCW-012 unless later evidence shows overlap.

## Field state

FV-RECOVERY-01 is passed. Release 1.0 remains **7 passed / 6 pending** while FV-WAIVER-01 stays pending.

## Role state

### Manager / Architect
ACTIVE — TCW-013 workflow hardening plus TCW-012 oversight/integration.

### Implementation Engineer / Builder
ASSIGNED — TCW-012.

### In-Season Strategy & Decision Intelligence Analyst
IDLE.

### R&D
IDLE.

### Independent Auditor / QA
IDLE pending real deployed field evidence.

### Troubleshooting & Root Cause Engineer
IDLE / not instantiated.
