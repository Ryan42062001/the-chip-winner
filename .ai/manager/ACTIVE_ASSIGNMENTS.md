# Active Assignments

Last updated: 2026-09-13
Fast-path registry: `.ai/shared/ACTIVE_TASKS.json`
Workflow overlay: `.ai/shared/WORKFLOW_V3_1.md`

## Active assignment

- TCW-017 — FV-ESPN-04 Evidence Integration and Closeout — **Manager IN_PROGRESS**.
- Branch: `manager/tcw-017-ir-field-integration`.
- Upstream TCW-016 independent verdict: `PASS CANDIDATE`, accepted after Auditor PR #84 and verified master workflow #483.
- Next gate: exact-head integration CI -> Manager merge -> verified master deployment -> `.ai/**`-only closeout.

## Field state

The integration branch records Release 1.0 at **9 passed / 4 pending**.

Passed:
- FV-A11Y-01
- FV-A11Y-03
- FV-MOBILE-01
- FV-ESPN-01
- FV-ESPN-03
- FV-ESPN-04 — real supported eligible/filled IR state independently accepted
- FV-RECOVERY-01
- FV-SYNC-01
- FV-WAIVER-01

Pending:
- FV-A11Y-02
- FV-ESPN-02
- FV-ESPN-05
- FV-SEASON-01

## Role state

### Manager / Architect
ACTIVE — TCW-017 integration/closeout.

### Implementation Engineer / Builder
IDLE — no approved implementation task.

### In-Season Strategy & Decision Intelligence Analyst
IDLE — no approved strategy task.

### R&D
IDLE — no approved research task.

### Independent Auditor / QA
IDLE — TCW-016 PASS CANDIDATE complete and accepted for Manager integration.

### Troubleshooting & Root Cause Engineer
IDLE / not instantiated.

Operational authority remains `.ai/shared/ACTIVE_TASKS.json`.
