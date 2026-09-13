# Active Assignments

Last updated: 2026-09-13
Fast-path registry: `.ai/shared/ACTIVE_TASKS.json`
Workflow overlay: `.ai/shared/WORKFLOW_V3_1.md`

## TCW-012 — Waiver Field Diagnostics Visibility

Role: Implementation Engineer / Builder -> Independent Auditor after evidence arrives
Status: `WAITING_EXTERNAL_EVIDENCE`
Task: `.ai/manager/tasks/TCW-012.md`
Builder PR: #74
Merged product checkpoint: `0d9e7b55b267d9eb3f0876fe077e1f19dc38f453`
Post-merge workflow: #463 PASS — test, Pages deploy, production verification

The Waivers UI now visibly exposes Considered adds, Complete adds, Scenarios evaluated, and Qualified adds without changing waiver logic. FV-WAIVER-01 remains pending.

External prerequisite: user supplies a privacy-safe deployed Waivers recording after a fresh ESPN refresh showing those four diagnostics and observed responsiveness.

Resume role: Independent Auditor / QA for the FV-WAIVER-01 verdict.

## TCW-013 — Control-Plane CI Efficiency & Durable-State Deduplication

Role: Manager / Architect
Status: `IN_PROGRESS`
Task: `.ai/manager/tasks/TCW-013.md`
Branch: `manager/tcw-013-workflow-efficiency`
Assignment master: `c66c02302fa014eb50ddbdf0e5a9dd4b933641dd`
Target advancement: `NON_OVERLAPPING` at `0d9e7b55b267d9eb3f0876fe077e1f19dc38f453`
Execution mode: STANDARD_CHAT

Scope:
- keep the full CI/test gate for every PR/push;
- skip Pages deploy + production smoke only when an entire master push changes `.ai/**` paths and nothing else;
- fail open to deployment when push-range classification is unavailable;
- keep manual workflow dispatch deploying;
- remove volatile active-task claims from the durable roadmap.

Next gate: exact-head CI -> Manager merge -> post-merge workflow verification -> close TCW-013.

## Field state

Release 1.0 remains **7 passed / 6 pending**. FV-WAIVER-01 is awaiting real deployed evidence; the other five pending field checks remain prerequisite-gated.

## Role state

### Manager / Architect
ACTIVE — TCW-013 plus Release 1.0 orchestration.

### Implementation Engineer / Builder
IDLE — TCW-012 implementation is merged/deployed.

### Independent Auditor / QA
WAITING — resumes TCW-012 when field evidence arrives.

### In-Season Strategy & Decision Intelligence Analyst
IDLE.

### R&D
IDLE.

### Troubleshooting & Root Cause Engineer
IDLE / not instantiated.
