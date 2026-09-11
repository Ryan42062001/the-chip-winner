# Manager / Architect Handoff

HANDOFF

Task ID: TCW-007
Role: Manager / Architect
Status: IN_PROGRESS — WORKFLOW V3 CONTROL-PLANE UPGRADE

Verified starting state:
- Repository: `Ryan42062001/the-chip-winner`.
- Protected default branch: `master`.
- Verified starting `master`: `a7d9d1a3f36241bd11a0cae1c9bbb66f0c0cea63`.
- TCW-006 PR #59 is merged at that checkpoint.
- Post-TCW-006 `master` workflow #425 passed test, deploy, and production verification.
- Package remains v0.9.88.
- Release 1.0 field gate remains 6 passed / 7 pending.

Work in TCW-007:
- upgrade the employee operating layer to Workflow V3 without production behavior changes;
- add Manager-owned `.ai/shared/ACTIVE_TASKS.json`;
- establish durable roles / disposable chats / task-scoped worker sessions / repository memory;
- add Fast Refresh and Full Refresh;
- add STANDARD_CHAT / WORK_MODE_PREFERRED / WORK_MODE_HIGH_VALUE classification plus fallback rule;
- add anti-loop temporary Troubleshooting & Root Cause escalation;
- add compact role charters under `.ai/roles/`;
- rename the Strategy authority to **In-Season Strategy & Decision Intelligence** and explicitly keep draft strategy in The War Room;
- close TCW-006 canonically from verified merge/workflow evidence.

Non-goals:
- no production JS/CSS/HTML changes;
- no ESPN/provider behavior changes;
- no ranking/projection policy changes;
- no field-registry mutation;
- no new Release 1.0 feature scope.

Current specialist activation:
- Builder IDLE.
- In-Season Strategy IDLE.
- R&D IDLE.
- Auditor IDLE/BLOCKED on TCW-005 pending local evidence.
- Troubleshooting not instantiated.

Exact next action:
- commit this control-plane change on `manager/tcw-007-workflow-v3`;
- open protected PR to `master`;
- verify exact-head CI and branch freshness;
- merge only if clean;
- verify post-merge `master` test/deploy/production verification;
- perform canonical TCW-007 closeout after those gates.

Checkpoint / SHA:
- starting `master`: `a7d9d1a3f36241bd11a0cae1c9bbb66f0c0cea63`.
- TCW-007 branch/PR checkpoint: not yet verified at this handoff revision.
