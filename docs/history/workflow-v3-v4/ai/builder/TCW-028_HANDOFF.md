# Builder Handoff — TCW-028

STATUS: IMPLEMENTATION COMPLETE — EXACT-HEAD FULL CI PENDING  
TASK: TCW-028 — Workflow V3.2 Audit Remediation  
ROLE: Implementation Engineer / Builder  
EXECUTION: STANDARD_CHAT_HIGH  
REFRESH: BOUNDED_REMEDIATION_REFRESH  
BRANCH: `builder/tcw-028-workflow-v32-audit-remediation`  
STARTING / CURRENT MASTER AT IMPLEMENTATION: `827720228fe5d1cd7462ea638909550928b5f1dc`

## Accepted authority

Manager accepted only:
- TCW-027-F01 — HIGH — fail-closed task removal / closeout proof;
- TCW-027-F02 — MEDIUM — complete same-task PR supersession coverage;
- TCW-027-F03 — LOW — six-role Next Activation compliance.

No Workflow V3.2 redesign or fantasy-football product behavior is authorized.

## Remediation

### TCW-027-F01
- `workflow:transition --remove` now requires the final `VERIFYING_MASTER` lifecycle point.
- Removal requires an exact `integration_sha`, positive `post_merge_run`, Manager acceptance, integration verification PASS, master verification PASS, accepted audit verdict when audit is required, and canary PASS when canary verification is required.
- Non-applicable audit/canary gates require explicit `NOT_APPLICABLE`; missing evidence never becomes implicit success.
- Eligibility is checked before mutation.
- Dry-run remains the default.
- Applied candidates still run static validation, and validation failure restores the original registry bytes exactly.

Adversarial tests cover incomplete statuses, audit-pending tasks, missing integration/post-merge/Manager/master/canary evidence, completed removal, pre-write rejection, post-write rollback, and dry-run non-mutation.

### TCW-027-F02
- Same-task open PRs are modeled as a directed supersession graph.
- A valid group requires exactly one current survivor.
- Every other live sibling must be reachable from that survivor through direct/transitive in-group supersession.
- Partial coverage, cycles, self-reference, unknown references, and multiple survivors fail closed.
- The existing valid two-PR replacement remains warning-only until the superseded PR is closed.

Adversarial tests cover partial three-PR coverage, valid three-PR succession, cycles, self-reference, unknown references, multiple survivors, and the two-PR happy path.

### TCW-027-F03
- The current Manager handoff already contains the six canonical roles.
- This TCW-028 Builder handoff contains the full six-role dashboard and does not use `ACTIVATE NOW`.
- A narrow current-V3.2 static safeguard validates the current Manager handoff plus task-scoped V3.2 handoffs without rewriting legacy generic handoffs.
- Worker handoffs using `ACTIVATE NOW` fail validation; Manager routing handoffs may use it.

## Changed files

- `scripts/workflow-manager-transition.js`
- `scripts/audit-workflow.js`
- `test/workflow-manager-transition.test.js`
- `test/workflow-audit.test.js`
- `.ai/shared/WORKFLOW_V3_2.md`
- `.ai/builder/TCW-028_HANDOFF.md`

No `src/**`, `config/**`, Strategy, R&D, Auditor evidence, field-validation, ESPN/provider, Trade Analyzer, or deployment workflow file is modified.

## Verification matrix

| Gate | Builder status |
| --- | --- |
| F01 removal lifecycle gate | IMPLEMENTED |
| F01 audit/integration/post-merge/canary proof | IMPLEMENTED |
| F01 rejected apply byte-for-byte rollback | TEST ADDED |
| F01 dry-run non-mutation | TEST ADDED |
| F02 partial three-PR collision | TEST ADDED |
| F02 valid three-PR chain / one survivor | TEST ADDED |
| F02 cycle / self / unknown references | TEST ADDED |
| F02 multiple survivors | TEST ADDED |
| F02 two-PR happy path | PRESERVED / TESTED |
| F03 current six-role dashboard lint | IMPLEMENTED |
| Focused adversarial test execution | PENDING — GitHub exact-head FULL CI |
| Full repository validation | PENDING — GitHub exact-head FULL CI |
| Post-merge master verification | NOT BUILDER-OWNED |
| Fresh independent TCW-027 F01/F02/F03 re-audit | NOT BUILDER-OWNED |

## Remaining limitation

This handoff is committed before its own exact candidate SHA and Actions run exist. The exact final Builder SHA and FULL run are recorded in the PR metadata and final Builder response after GitHub completes validation. No commit should follow that validated candidate unless the full exact-head gate is rerun.

## Recommended next role

Manager / Architect after exact-head FULL CI passes.

## Next Activation

| Order | Employee / Role | Status | Current Task / Gate | Copy/paste activation prompt / next action |
| ---: | --- | --- | --- | --- |
| 1 | Manager / Architect | RECOMMEND TO MANAGER | Review TCW-028 only after exact-head FULL CI | Review the final TCW-028 PR head and FULL CI; if accepted, integrate, verify master, freeze the repaired target, and route a fresh bounded Independent Auditor re-audit of TCW-027-F01/F02/F03. |
| 2 | Implementation Engineer / Builder | COMPLETE | TCW-028 candidate implemented; exact-head CI is the remaining Builder gate | Do not merge. If exact-head CI fails, remediate only the task-owned failure on this same branch/PR. |
| 3 | In-Season Strategy & Decision Intelligence Analyst | IDLE | No Strategy question exists | No action unless Manager identifies a genuine in-season recommendation-policy question. |
| 4 | Research & Development (R&D) | IDLE | No external research dependency exists | No action unless Manager identifies a genuine technical/research unknown. |
| 5 | Independent Auditor / QA | WAIT | Fresh re-audit requires Manager-integrated frozen repaired target | After Manager integration and freeze, independently re-audit accepted TCW-027-F01/F02/F03 only. |
| 6 | Troubleshooting & Root Cause Engineer — on-demand | IDLE | No convergence failure exists | Activate only if the bounded remediation lane develops a genuine cross-layer diagnosis loop. |
