# TCW-027 — Workflow V3.2 Independent Control-Plane Audit

Task under audit: `TCW-026 — Workflow V3.2 Cross-Project Parity Upgrade`  
Role: Independent Auditor / QA  
Audit type: workflow-control-plane  
Verdict: **FAIL — REMEDIATION REQUIRED**

## Frozen target and independence

- Current canonical master verified at audit start: `9f0786b4f089af8a24732220db00f66321e25c10`.
- Exact frozen workflow target: `4e737f5f0b4cc5f3825f5c12ec4e5dccaf65c4f4`.
- Source PR: `#114`.
- Source final head: `4a511c99f3726bd9c39be0ec9080320072e64661`.
- Assigned audit branch: `auditor/tcw-027-workflow-v32-control-plane-audit`.
- Current master is exactly one commit ahead of the frozen target. That commit routes TCW-027 and adds/updates audit/control-plane evidence only; the frozen V3.2 implementation target was not silently advanced.
- This was a fresh Independent Auditor lane. Manager acceptance, green CI, and sibling-project precedent were treated as evidence rather than proof.

## Audit method

The audit independently reviewed:

- `.ai/shared/WORKFLOW_V3_2.md`, V3.1, and the base workflow;
- schema-v3 active state and the TCW-026/TCW-027 task contracts;
- TCW-D014 and the frozen audit packet;
- PR #114 exact scope and integration provenance;
- `scripts/audit-workflow.js`;
- `scripts/ci-change-mode.js`;
- `scripts/workflow-audit-readiness.js`;
- `scripts/workflow-manager-transition.js`;
- `scripts/workflow-user-actions.js`;
- `.github/workflows/deploy-pages.yml`;
- workflow/CI tests and live Actions evidence;
- role charters, Manager task template, integration queue, known-CI-debt record, handoffs, and project-boundary artifacts.

Adversarial review was used for state/collision/transition edge cases rather than relying only on existing happy-path tests.

## Independent verification of integration / CI evidence

### Source PR and target

PR #114 is merged. Its exact final head is `4a511c99f3726bd9c39be0ec9080320072e64661`, and its merge commit is the frozen target `4e737f5f0b4cc5f3825f5c12ec4e5dccaf65c4f4`.

The PR changed the control-plane/workflow/helper/test files enumerated by the frozen packet. It did not modify `src/**` or `config/**`, so no fantasy-football implementation or field-validation state was imported into this workflow task.

### Development failures were real and corrected

- **Run #572 / 35417860352 — FAIL:** the classifier test job exposed a collision-test fixture defect. The failure was an assertion expecting the duplicate-branch condition. The next commit changed the fixture rather than suppressing the gate.
- **Run #573 / 35417894336 — FAIL:** full unit/contract tests exposed legacy V3.1 workflow-audit fixtures that had not been migrated to V3.2 schema metadata. The subsequent change updated the workflow test fixtures/state.
- **Run #575 / 35418058017 — FAIL:** the V3.2 state audit rejected malformed `ACTIVE_TASKS.json` with a JSON parse error. The final candidate corrected the malformed state instead of bypassing the validator.
- **Run #576 / 35418225147 — PASS:** exact source head `4a511c99...`; classifier selected **FULL** because machine state changed, Workflow V3.2 state audit passed, and the complete repository validation suite passed. CI evidence artifact `tcw-ci-evidence-35418225147-1` was uploaded.
- **Run #577 / 35418315839 — PASS:** exact frozen master `4e737f5f...`; push was forced **FULL**, full validation passed, Pages deployment passed, and production smoke passed. CI evidence artifact `tcw-ci-evidence-35418315839-1` was uploaded.
- **Run #580 / 35418627770 — PASS:** current routing master `9f0786b4...`; push was forced **FULL**, the V3.2 state audit and full test gate passed, and CI evidence was artifacted.

There is no active inherited CI debt in `.ai/manager/KNOWN_CI_DEBT.md`.

## Requirement-by-requirement disposition

| Surface | Independent result | Evidence / reasoning |
| --- | --- | --- |
| Execution routing | PASS | V3.2 and role charters expose only `STANDARD_CHAT_HIGH` and `WORK_MODE`; default/escalation language is bounded to autonomous-execution leverage. |
| Refresh routing | PASS | FAST default, bounded accepted-finding remediation, and reason-gated FULL are explicit; schema rejects legacy modes and unreasoned FULL. |
| Active-only schema v3 | PASS | Registry declares schema 3 / V3.2 / active-only; CLOSED task entries are rejected. |
| Blocker and user-action semantics | PASS | Validator requires non-NONE blocker for BLOCKED/REWORK_REQUIRED and constrains user-action flags to external/user blocker families; user-action queue is derived from machine state. |
| Branch / worker-slot / write collision | PASS with noted PR finding below | Duplicate branch/slot and ordinary runnable write overlap are rejected; dependency cycles are checked. PR duplicate logic has finding TCW-027-F02. |
| Manager-only merge / gate separation | PASS | Registry requires Manager merge authority; task template/integration records separate worker handoff, validated CI, integration SHA, Manager verdict, and audit state. |
| Manager execution packets / accepted decisions | PASS | V3.2, Manager charter, and TCW_TASK_V2 template encode bounded routing and downstream decision consumption. |
| Audit readiness / frozen target | PASS | Mechanical helper checks branch/head/scope/status and does not issue verdicts; frozen packet/active Auditor metadata pin task/PR/branch/SHA. |
| Manager transition helper | **FAIL** | TCW-027-F01: removal path does not enforce completed-task preconditions. |
| Derived user-action queue | PASS | Queue filters canonical tasks with `user_action_required === true`; no separate manual queue is maintained. |
| Integration queue / known CI debt | PASS | Separate Manager-owned records exist; debt policy says inherited debt does not excuse changed failures; current debt is NONE. |
| Six-role Next Activation / chat reuse | PASS with non-blocking finding | Chat-reuse/fresh-audit rules are correct; TCW-026's own meaningful Manager handoff omits the mandatory six-row dashboard (TCW-027-F03). |
| Docs-only allowlist / fail closed | PASS | Only root Markdown, `.ai/**/*.md`, and `docs/**/*.md` qualify; machine state/scripts/workflows/package/source/tests/mixed/malformed/unsupported/manual/push paths resolve FULL. |
| Synchronize predecessor continuity | PASS | Docs-only synchronize requires immediately preceding same-PR successful Deploy website run; inability to prove continuity falls back to FULL. |
| Always-present test check | PASS | `Deploy website / test` exists without a workflow/job-level docs-only exclusion. |
| FULL master/manual/non-doc/mixed/ambiguous | PASS | Static tests and live #576/#577/#580 evidence confirm the fail-closed path. |
| Durable CI evidence | PASS | Classification/range/paths/stage outcomes/logs are persisted under `ci-evidence` and uploaded on runs, including final target runs. |
| Material control-plane independent audit | PASS | TCW-026 remains blocked on TCW-027 and frozen exact-target metadata is present. |
| Product / Strategy / field boundaries | PASS | PR #114 did not modify product source/config; TCW-D014/V3.2 preserve ESPN authority, read-only behavior, in-season Strategy, and separate field registry. |
| Sibling-specific machinery exclusion | PASS | No War Room protected-scoring/custody/draft execution machinery or FFH financial/Supabase controls were imported into the target. |

## Findings

### TCW-027-F01 — HIGH — transition helper can remove a task before its required closeout gates are satisfied

**Severity:** HIGH

**Violated requirement**

V3.2 states that `workflow:transition` may remove **completed** tasks from the active-only registry, never bypasses validation, and remains subordinate to Manager-owned transition/closeout semantics. V3.1 atomic closeout preserves merge, master verification, audit, and other required gates as distinct.

**Exact evidence**

In `scripts/workflow-manager-transition.js`, `--remove` unconditionally executes:

```js
registry.tasks.splice(index, 1);
```

There is no check that the task is completion-eligible, that required audit has passed, that post-merge verification/canary requirements are satisfied, or that its Manager Integration Record is complete. The helper then validates only the **remaining** registry.

The exact frozen target contains TCW-025 as `AUDIT_READY`, with `audit_required: true`, `post_merge_canary_required: true`, integrated production evidence, and an explicit next gate requiring a fresh Independent Auditor F01-F04 retest. Because no active task depends on TCW-025, invoking the Manager helper with `--task TCW-025 --remove --apply` would remove that still-open audit gate; the static validator would no longer have the removed task available to reject.

Dry-run default and rollback-on-validator-failure are correctly implemented, but they do not protect this path because removal itself leaves a structurally valid remaining registry.

**Impact**

The active-only machine authority can lose an unfinished audit-required task while required quality gates remain outstanding. That can make the machine state falsely imply that no active gate exists and undermine the separation among integration, master verification, independent audit, and closure.

**Remediation direction**

Make `--remove` fail closed unless explicit completion/closeout preconditions are machine-verifiable. At minimum, a task must be in a defined removal-eligible state and all required audit/post-merge/canary/integration fields must prove completion. If the current active-only model cannot express those preconditions safely, add the smallest explicit closeout metadata required rather than inferring completion from absence.

**Required validation**

Add deterministic tests proving:
1. `AUDIT_READY`, `BLOCKED`, `REWORK_REQUIRED`, `ASSIGNED`, and other incomplete tasks cannot be removed;
2. an audit-required task cannot be removed before accepted audit completion;
3. a properly completed task can be removed;
4. invalid apply attempts leave the original file byte-for-byte restored;
5. dry-run remains non-mutating.

Run exact-head full CI and a fresh Independent Auditor bounded remediation audit.

**Confidence:** HIGH

### TCW-027-F02 — MEDIUM — duplicate-PR supersession logic can downgrade a still-unsafe multi-PR collision to a warning

**Severity:** MEDIUM

**Violated requirement**

V3.2 says the workflow audit fails closed on duplicate owned PRs, while V3.1 supersession permits a replacement PR only when the relationship is explicit and the older PR is closed promptly. The control plane must not treat unresolved sibling PRs for one Task ID as safely superseded merely because one supersession marker exists somewhere in the group.

**Exact evidence**

`detectDuplicateTaskPullRequests()` groups all open PRs by Task ID. When a group has multiple PRs, it performs this group-level check:

```js
if (group.some((pr) =>
  supersedesPrNumbers(pr).some((n) => numbers.has(n))
)) warnings.push(...);
else errors.push(...);
```

This means **any one** in-group supersession edge downgrades the **entire group** from error to warning.

Controlled example:
- PR #70 claims TCW-010;
- PR #71 independently claims TCW-010;
- PR #72 claims TCW-010 and says only `Supersedes-PR: #70`.

PR #71 remains an unresolved sibling duplicate, but the current function returns warning-only because #72 supersedes #70. The existing tests cover a two-PR duplicate and a clean two-PR supersession, but not this three-PR partial-supersession case.

**Impact**

The static workflow audit can report green while multiple independently live PRs still claim the same task. That weakens provenance, merge-order safety, and the single-current-candidate guarantee that the V3.2 collision controls are intended to provide.

**Remediation direction**

Validate supersession as a complete relationship, not a group-level boolean. A same-task open-PR set should have exactly one current survivor, and every additional open sibling must be explicitly and coherently superseded by that survivor (or otherwise produce an error until closed). Reject ambiguous chains/cycles/partial coverage.

**Required validation**

Add adversarial tests for:
- three PRs with only one superseded sibling;
- a clean three-PR chain/current survivor;
- cycles and self/unknown supersession;
- multiple would-be current survivors;
- the existing two-PR happy path.

Run exact-head full CI and bounded independent re-audit of duplicate-PR collision safety.

**Confidence:** HIGH

### TCW-027-F03 — LOW — the workflow upgrade's own meaningful Manager handoff omits the mandatory six-role Next Activation dashboard

**Severity:** LOW

**Violated requirement**

Workflow V3.2 §13 requires every meaningful employee handoff and Manager routing response to end with a six-row `Next Activation` dashboard covering Manager, Builder, Strategy, R&D, Auditor, and Troubleshooting.

**Exact evidence**

The TCW-026 Manager handoff at the frozen target contains status, target, blockers, and next action, but no six-row Next Activation table. The current post-integration Manager handoff that routes TCW-027 also contains no such table. The Manager charter itself says meaningful routing responses include the complete dashboard.

**Impact**

This does not weaken code/merge/CI safety, but it makes the new workforce-visibility rule self-inconsistent at the first material workflow handoff and can obscure separate active gates such as TCW-025 versus TCW-027.

**Remediation direction**

Update future/current V3.2 Manager/worker handoffs to include the required six-row table. Add a narrowly scoped lint/static check for current V3.2 handoffs if practical without rewriting historical handoffs.

**Required validation**

Verify the remediated Manager handoff contains exactly the six canonical role rows and that only Manager uses `ACTIVATE NOW`.

**Confidence:** HIGH

## Non-findings / adversarial checks that held

- The docs-only classifier correctly treats `.ai/shared/ACTIVE_TASKS.json`, workflows, package files, scripts, source, tests, config, mixed diffs, malformed evidence, unsupported actions, pushes, and manual runs as FULL.
- Predecessor-continuity failure is safe: it expands to FULL rather than skipping validation.
- The test job remains present for docs-only runs.
- CI artifacts do not replace exit-code enforcement.
- The transition helper is dry-run by default and restores the original registry when its post-write static validator actually rejects a change.
- The audit-readiness helper does not issue an Auditor verdict and the TCW-027 assignment correctly freezes task/PR/branch/SHA.
- No private ESPN/field state was fabricated. `FV-SEASON-01` remains separate.
- TCW-025's product re-audit remains a separate gate and was not audited under TCW-027.

## Validation matrix

| Dimension | Result | Evidence |
| --- | --- | --- |
| Static contract / implementation review | **FAIL** | TCW-027-F01 and F02 are deterministic control-plane safety violations; F03 is a non-blocking handoff-compliance defect |
| Automated workflow/unit validation | **PASS with missing adversarial cases** | #576 exact source head PASS; #577 frozen target PASS; #580 routing master PASS |
| CI routing / fail-closed behavior | **PASS** | FULL classification on machine-state PR and all pushes; docs-only logic and predecessor fallback inspected |
| Deployment continuity | **PASS** | #577 Pages deployment and production smoke passed |
| Frozen-target discipline | **PASS** | target remains exactly `4e737f5f...`; routing master is a one-commit control-plane advance |
| Private authenticated ESPN / product field behavior | **NOT APPLICABLE / NOT CLAIMED** | TCW-027 is a workflow-control-plane audit; field registry remains separate |

## Final verdict

**FAIL — REMEDIATION REQUIRED**

TCW-027-F01 is a blocking governance defect because the Manager transition helper can erase an unfinished audit-required task from the active-only machine authority. TCW-027-F02 independently weakens the promised fail-closed same-task PR collision guarantee. TCW-027-F03 is non-blocking but should be corrected as part of V3.2 adoption.

The remainder of the V3.2 upgrade is materially coherent and the CI fast path is conservatively designed; this verdict does not reject those successful portions. TCW-026 should remain blocked until the control-plane findings are remediated and independently re-audited.
