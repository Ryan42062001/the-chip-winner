# Active Assignments

Last updated: 2026-09-14
Fast-path registry: `.ai/shared/ACTIVE_TASKS.json`
Workflow overlay: `.ai/shared/WORKFLOW_V3_1.md`

## Active assignment

### TCW-022 — Trade Analyzer v1 Strategy Contract

- Owner: In-Season Strategy & Decision Intelligence Analyst
- Status: ASSIGNED
- Branch: `strategy/tcw-022-trade-analyzer-policy`
- Assignment master: `3eedb76e4bfd33802c23972720f79a4135e2adf5`
- Execution mode: `STANDARD_CHAT`
- Merge authority: Manager / Architect
- Task spec: `.ai/manager/tasks/TCW-022.md`
- Deliverable: `.ai/strategy/TCW-022_TRADE_ANALYZER_POLICY.md`
- Next gate: Strategy PR -> Manager review -> Builder routing only after policy acceptance.

Operational authority remains `.ai/shared/ACTIVE_TASKS.json`.

## Field state

Release 1.0 field gate remains **10 passed / 1 pending**.

Pending:
- FV-SEASON-01 — real playoff/bye intelligence states

The season field check is event-gated and independent from TCW-022. Do not manufacture playoff/bye evidence merely to unblock feature work.

Removed from Release 1.0 scope by explicit product-owner direction:
- FV-A11Y-02 — manual screen-reader certification, under TCW-D012;
- FV-ESPN-02 — custom FLEX/OP/Superflex field certification, under TCW-D013.

## Role state

### Manager / Architect
ACTIVE — owns TCW-022 acceptance/routing and eventual integration.

### Implementation Engineer / Builder
IDLE — wait for Manager-approved Trade Analyzer strategy contract.

### In-Season Strategy & Decision Intelligence Analyst
ASSIGNED — TCW-022 Trade Analyzer v1 strategy contract.

### R&D
IDLE — only route if Strategy identifies a genuine unresolved data/source/feasibility question.

### Independent Auditor / QA
IDLE — audit follows implementation, not policy drafting.

### Troubleshooting & Root Cause Engineer
IDLE / not instantiated.
