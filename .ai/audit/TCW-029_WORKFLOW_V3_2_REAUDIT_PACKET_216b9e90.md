# TCW-029 — Frozen Workflow V3.2 Remediation Re-Audit Packet

Packet owner: Manager / Architect
Packet status: FROZEN
Audit target task: TCW-028
Audit target PR: #118
Exact Builder head: `863531f8b6093e9df05c8b3b5f7dc11bd5bf15fe`
Exact integrated target: `216b9e9030c3dc84d9e2af2b3120d1c8dbb3bee9`
Target branch: `master`

## Independence boundary

This is a fresh audit lane. Do not rely on TCW-027's verdict, Manager's acceptance, Builder assertions, or green CI as proof. Reproduce or reason through the accepted defects independently against the exact frozen target. Do not switch target SHA.

## Accepted original defects to re-test

### F01 — HIGH
Determine whether active-task removal now fails closed before mutation unless the task is at the final VERIFYING_MASTER lifecycle point and machine state explicitly proves integration, post-merge/master verification, Manager acceptance, required audit result, and required canary result. Verify dry-run non-mutation and byte-for-byte rollback on rejected applied candidates.

### F02 — MEDIUM
Determine whether same-task open-PR collision handling now requires one coherent survivor and complete direct/transitive coverage of every sibling. Adversarially test partial coverage, cycles, self-reference, unknown references, multiple survivors, and the valid two-PR replacement case.

### F03 — LOW
Determine whether current V3.2 Manager/task-scoped handoffs enforce the exact six canonical Next Activation roles in order and prevent workers from using ACTIVATE NOW while preserving Manager routing authority.

## Evidence set

- `.ai/manager/tasks/TCW-028.md`
- `.ai/manager/evidence/TCW-027_WORKFLOW_V3_2_AUDIT_INTAKE.md`
- `.ai/audit/TCW-027_WORKFLOW_V3_2_CONTROL_PLANE_AUDIT.md`
- `.ai/builder/TCW-028_HANDOFF.md`
- `.ai/shared/WORKFLOW_V3_2.md`
- `scripts/workflow-manager-transition.js`
- `scripts/audit-workflow.js`
- `test/workflow-manager-transition.test.js`
- `test/workflow-audit.test.js`
- PR #118 exact-head run #585 / `35420670933`
- master run #586 / `35421054690`

## Protected boundaries

Do not modify implementation. Do not re-open unrelated fantasy-football product policy. TCW-025 remains a separate Trade Analyzer audit lane. `FV-SEASON-01` remains genuine-season-event gated and must not be simulated or manufactured.

## Required output

Write `.ai/audit/TCW-029_WORKFLOW_V3_2_REAUDIT.md`, update `.ai/auditor/TCW-029_HANDOFF.md`, open one Auditor PR, run required exact-head CI, and return the exact Auditor head/PR/CI evidence to Manager. Verdict must be PASS, PASS WITH NON-BLOCKING FINDINGS, or FAIL — REMEDIATION REQUIRED.
