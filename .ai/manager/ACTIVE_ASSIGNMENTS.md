# Active Assignments

Last updated: 2026-09-13
Fast-path registry: `.ai/shared/ACTIVE_TASKS.json`
Workflow overlay: `.ai/shared/WORKFLOW_V3_1.md`

## Active assignments

- TCW-018 — FV-ESPN-05 Real Game-Lock / Availability Transition Field Retest — **BLOCKED on TCW-020** after Independent Auditor PR #93 returned `FAIL — REPRODUCED DEFECT`.
- TCW-020 — START/SIT Lock-Awareness Remediation — **Builder ASSIGNED**.
- Expected Builder branch: `builder/tcw-020-start-sit-lock-remediation`.
- Accepted finding: `TCW-018-F01 — MEDIUM — BLOCKING`.
- Next gate: Builder remediation PR/handoff -> Manager review/integration/deploy verification -> fresh TCW-018 Independent Auditor post-remediation field retest.

## Field state

Release 1.0 field gate: **9 passed / 3 pending**.

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
- FV-ESPN-02 — authenticated custom FLEX/OP/Superflex league
- FV-ESPN-05 — reproduced stale actionable START / SIT guidance after a genuine lock; TCW-020 remediation active
- FV-SEASON-01 — real playoff/bye intelligence states

Manual screen-reader certification is not part of the Release 1.0 field gate under TCW-D012. Automated accessibility/readiness CI remains active.

## Role state

### Manager / Architect
ACTIVE — accepted TCW-018-F01, routing TCW-020, owns later integration and retest activation.

### Implementation Engineer / Builder
ASSIGNED — TCW-020 bounded START / SIT lock-awareness remediation.

### In-Season Strategy & Decision Intelligence Analyst
IDLE — no unresolved strategy policy is required for this deterministic remediation.

### R&D
IDLE — no external-fact or feasibility question is required.

### Independent Auditor / QA
BLOCKED on TCW-020 deployment before the TCW-018 post-remediation retest.

### Troubleshooting & Root Cause Engineer
IDLE / not instantiated; the defect is already reproduced and bounded.

Operational authority remains `.ai/shared/ACTIVE_TASKS.json`.
