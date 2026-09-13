# Workflow V3.1 — Coordination Hardening Overlay

Status: ACTIVE OVERLAY
Owner: Manager / Architect
Effective after TCW-010 merges and passes post-merge verification.

This file is a binding overlay on `.ai/shared/WORKFLOW.md`. The V3 base workflow remains in force except where this overlay adds or narrows a rule. If the two conflict, this V3.1 overlay controls.

## 1. Single operational authority

`.ai/shared/ACTIVE_TASKS.json` is the single machine-authoritative operational registry for current task ownership, lifecycle state, dependencies, branch/PR routing, external prerequisites, and next gates.

Human-readable files such as `PROJECT_STATE.md`, `ROADMAP.md`, `ACTIVE_ASSIGNMENTS.md`, and role handoffs remain summaries/evidence and must not override a newer valid `ACTIVE_TASKS.json` entry for current operational state.

The registry advertises the active workflow version and overlay path so Fast Refresh discovers V3.1 without requiring broad context loading.

The field-validation registry remains separately authoritative for Release 1.0 field-check status.

## 2. Registry schema v2 lifecycle

Workflow V3.1 adds two lifecycle states:

- `WAITING_EXTERNAL_EVIDENCE` — a named actor outside the current worker environment must perform or supply a required observation/action before the named role can resume.
- `VERIFYING_MASTER` — the task has merged, but required post-merge master CI/deploy/runtime verification and canonical reconciliation are not complete.

`WAITING_EXTERNAL_EVIDENCE` requires `external_actor`, `external_action`, and `resume_role`.

Use `BLOCKED` for an actual unresolved dependency/blocker. Do not use `BLOCKED` merely because a user-operated field action is required.

## 3. Atomic closeout

A merge is not full completion. Normal closeout is:

`MERGE_READY -> MERGED -> VERIFYING_MASTER -> CLOSED`

A task may become `CLOSED` only after accepted changes are merged, required post-merge master CI succeeds, required deploy/production verification succeeds when applicable, and canonical state is reconciled. If a closed task remains represented in the registry, record the verified master SHA and post-merge workflow result.

## 4. Reproduced-defect fast lane

When an Independent Auditor returns a sufficiently evidenced reproduced deterministic defect and Manager accepts it, use the shortest safe remediation path:

`Auditor FAIL -> Manager accepts/scopes -> Builder remediation -> Manager review/integration -> master verification -> Auditor retest`

Do not route through Strategy, R&D, Troubleshooting, or roadmap work unless a real unresolved policy, external-fact, root-cause, or architecture question requires that role.

## 5. Verification matrix in handoffs

Builder, Auditor, and meaningful Manager integration handoffs should include a compact verification matrix following this contract.

Minimum dimensions are:
- static/code review;
- deterministic automated tests;
- exact-head PR CI;
- post-merge master verification;
- production/deployed verification when applicable;
- real field validation when applicable.

Use explicit statuses such as `PASS`, `FAIL`, `NOT RUN`, `NOT APPLICABLE`, or `PENDING — ROLE OWNED`. Include the evidence reference beside each status. A lower validation level never implies a higher one.

## 6. Supersession and duplicate PR control

A Task ID should normally have at most one open implementation/evidence PR. If a replacement PR must temporarily coexist with an older PR for the same Task ID, the replacement must declare `Supersedes-PR: #<number>`, and the older PR should be closed promptly after replacement validation. Optional `supersedes_pr` / `supersedes_task` registry fields may record the relationship.

Do not silently merge sibling PRs claiming the same Task ID.

## 7. Assignment staleness trigger

Fast Refresh remains the default, but an active assignment more than 3 commits behind HEAD must not proceed silently. Perform Full Refresh/update the assignment checkpoint or record `target_advancement.classification` as `CONTROL_PLANE_ONLY`, `NON_OVERLAPPING`, or `OVERLAPPING_RISK`.

`OVERLAPPING_RISK` requires reconciliation and affected revalidation before merge. `WAITING_EXTERNAL_EVIDENCE` and `BLOCKED` tasks are exempt from automatic drift failure while genuinely paused, but must refresh before resumption.

## 8. Workflow-integrity audit

`npm run audit:workflow` validates the static workflow contract. The existing CI `npm test` command invokes the audit with `--ci` before running the Node test suite, so workflow-registry failures participate in the normal required test gate without a separate Actions-workflow step.

The audit checks registry schema/workflow metadata, lifecycle values, unique Task IDs, valid owners/dependencies/execution modes, task/handoff paths, owner-consistent branch prefixes, external-evidence metadata, supersession metadata shape, atomic CLOSED verification evidence, stale active assignments when relevant history is available, and duplicate open task PRs when GitHub lookup succeeds.

Unresolvable shallow-history drift and unavailable external PR lookup warn rather than create a false CI failure. Manager/worker refresh discipline remains authoritative in those cases.

The workflow audit is a coordination guardrail, not a substitute for Manager judgment, application tests, independent audit, or real field evidence.

## 9. Parallelism rule

Manager-owned workflow/control-plane work may proceed concurrently with an independent Builder product task when files/surfaces do not materially overlap, accepted product requirements do not change, and target advancement is classified before merge if needed.

Do not create a parallel specialist assignment merely to keep another role busy.

## 10. Existing V3 principles preserved

Workflow V3.1 does not change the five-role permanent team, temporary Troubleshooting role, repository-as-memory model, task-scoped chats, protected branch/PR discipline, evidence hierarchy, field-validation rules, anti-loop escalation, Strategy/R&D advisory boundaries, or read-only product scope.
