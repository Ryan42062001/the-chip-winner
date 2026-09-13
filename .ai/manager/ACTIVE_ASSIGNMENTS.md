# Active Assignments

Last updated: 2026-09-13
Fast-path registry: `.ai/shared/ACTIVE_TASKS.json`
Workflow overlay: `.ai/shared/WORKFLOW_V3_1.md`

## Active assignment

- TCW-018 — FV-ESPN-05 Real Game-Lock / Availability Transition Field Retest — **Manager WAITING_EXTERNAL_EVIDENCE**.
- Prestage branch: `manager/tcw-018-lock-field-prestage`.
- External prerequisite: one naturally occurring real ESPN game-lock or availability transition.
- Next gate: user supplies real pre/post transition evidence -> Manager privacy-safe intake -> Independent Auditor verdict.

## Field state

Release 1.0 field gate: **9 passed / 4 pending**.

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
- FV-ESPN-05 — TCW-018 pre-staged, awaiting genuine transition evidence
- FV-SEASON-01

## Role state

### Manager / Architect
WAITING_EXTERNAL_EVIDENCE — TCW-018.

### Implementation Engineer / Builder
IDLE — no approved implementation task.

### In-Season Strategy & Decision Intelligence Analyst
IDLE — no approved strategy task.

### R&D
IDLE — no approved research task.

### Independent Auditor / QA
IDLE until TCW-018 evidence intake is ready.

### Troubleshooting & Root Cause Engineer
IDLE / not instantiated.

Operational authority remains `.ai/shared/ACTIVE_TASKS.json`.
