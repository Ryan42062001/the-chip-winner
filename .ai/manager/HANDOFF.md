# Manager / Architect Handoff

HANDOFF

Task ID: TCW-013
Role: Manager / Architect
Status: IN_PROGRESS — CONTROL-PLANE CI EFFICIENCY & MERGE-AUTHORITY HARDENING

Verified starting state:
- Canonical master: `67159238ed04118334915b58923f2a071ece19c8`.
- TCW-015 is closed; Release 1.0 field gate is 8 passed / 5 pending.
- Old TCW-013 PR #75 was closed as stale/superseded and is not safe to merge.
- Replacement branch: `manager/tcw-013-workflow-efficiency-v2`.

Approved improvements:
- full test/CI remains unconditional for PRs and master pushes;
- `.ai/**`-only master pushes may skip Pages deploy and production smoke as NOT APPLICABLE;
- any changed path outside `.ai/**`, manual dispatch, or unavailable classification deploys normally;
- Workflow V3.1 now keeps durable roadmap state separate from volatile task inventory;
- active tasks must declare `merge_authority: "Manager"`;
- non-Manager workers must stop at validated PR/handoff and must not invoke merge/auto-merge;
- an externally merged worker PR is repository fact but not automatically Manager-accepted; Manager must independently review/reconcile it.

Verification plan:
1. deterministic classifier and workflow-audit tests;
2. exact-head PR CI;
3. merge workflow-changing PR only after green CI;
4. verify post-merge master test/deploy/production smoke because this integration touches `.github/**`, `scripts/**`, and `test/**`;
5. perform `.ai/**`-only TCW-013 closeout and verify test PASS while deploy/verify-production are skipped.

Protected boundaries:
- no product behavior changes;
- no field-validation changes;
- no recommendation/provider/ESPN changes.

ACTIVATE NOW:
- Manager — TCW-013.
- Builder, Auditor, Strategy, R&D, Troubleshooting — IDLE/event-driven.
