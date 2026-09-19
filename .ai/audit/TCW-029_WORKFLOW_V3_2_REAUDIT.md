# TCW-029 — Workflow V3.2 Remediation Independent Re-Audit

Target task: `TCW-028 — Workflow V3.2 Audit Remediation`  
Target PR: `#118`  
Exact Builder head: `863531f8b6093e9df05c8b3b5f7dc11bd5bf15fe`  
Exact frozen integrated target: `216b9e9030c3dc84d9e2af2b3120d1c8dbb3bee9`  
Current routing master verified at audit start: `ee1b4156f988c1084fdb645cbd24df1672cfccfb`  
Role: Independent Auditor / QA  
Verdict: **PASS WITH NON-BLOCKING FINDINGS**

## Independence and target discipline

This was a fresh bounded audit lane.

The prior TCW-027 verdict, Manager acceptance, Builder assertions, and green CI were treated as evidence rather than proof. The audit target remained exactly `216b9e9030c3dc84d9e2af2b3120d1c8dbb3bee9`.

Current master is exactly one commit ahead of the frozen target. PR #119 / merge `ee1b4156f988c1084fdb645cbd24df1672cfccfb` changes only audit-routing/control-plane Markdown and machine-state files. It is not the implementation target and was not substituted for the frozen SHA.

## Scope reviewed

The re-audit was intentionally limited to the accepted remediation of:

1. TCW-027-F01 — fail-closed active-task removal;
2. TCW-027-F02 — coherent same-task PR supersession coverage;
3. TCW-027-F03 — six-role Next Activation enforcement and Manager-only activation authority.

Also verified:
- TCW-025 remains a separate Trade Analyzer audit lane;
- PR #118 did not modify fantasy-football source, ESPN/provider behavior, Strategy/R&D state, `config/field-validation.json`, or field-validation semantics;
- `FV-SEASON-01` remains a genuine-season evidence gate.

## Frozen-target integration / CI evidence independently verified

PR #118 is merged with:
- exact Builder head `863531f8b6093e9df05c8b3b5f7dc11bd5bf15fe`;
- integrated master `216b9e9030c3dc84d9e2af2b3120d1c8dbb3bee9`;
- six changed files only:
  - `.ai/builder/TCW-028_HANDOFF.md`
  - `.ai/shared/WORKFLOW_V3_2.md`
  - `scripts/audit-workflow.js`
  - `scripts/workflow-manager-transition.js`
  - `test/workflow-audit.test.js`
  - `test/workflow-manager-transition.test.js`

No `src/**`, `config/**`, ESPN/provider, Strategy/R&D, Trade Analyzer, Auditor evidence, or deployment-workflow file changed.

### Exact-head Builder CI

Run #585 / `35420670933`:
- event: pull_request;
- exact head: `863531f8b6093e9df05c8b3b5f7dc11bd5bf15fe`;
- effective mode: FULL;
- Workflow V3.2 state audit: PASS;
- full unit/contract suite: 462/462 PASS;
- model/static/browser/a11y/readiness/mobile/extension/performance/security gates: PASS;
- durable artifact: `tcw-ci-evidence-35420670933-1` / artifact `10576917778`;
- overall conclusion: PASS.

### Frozen master CI

Run #586 / `35421054690`:
- event: push;
- exact head: `216b9e9030c3dc84d9e2af2b3120d1c8dbb3bee9`;
- effective mode: FULL;
- Workflow V3.2 state audit: PASS;
- full unit/contract suite: 462/462 PASS;
- Pages deployment: PASS;
- production smoke: PASS;
- durable artifact: `tcw-ci-evidence-35421054690-1` / artifact `10576993260`;
- overall conclusion: PASS.

These runs support, but do not determine, the verdict.

## F01 re-test — fail-closed active-task removal

**Disposition: PASS**

### Static / adversarial review

`scripts/workflow-manager-transition.js` now calls `assertRemovalEligible()` before `registry.tasks.splice(...)`.

Removal requires:
- lifecycle status exactly `VERIFYING_MASTER`;
- a full 40-character `integration_sha`;
- positive integer `post_merge_run`;
- explicit `closeout_evidence`;
- Manager verdict `ACCEPTED`;
- integration verification `PASS`;
- master verification `PASS`;
- audit verdict `PASS` or `PASS WITH NON-BLOCKING FINDINGS` when `audit_required` is true;
- explicit `NOT_APPLICABLE` when audit is not required;
- canary `PASS` when `post_merge_canary_required` is true;
- explicit `NOT_APPLICABLE` otherwise.

The updated V3.2 contract explicitly makes Manager the authority for recording the closeout evidence consumed by the helper. Under that authority model, the helper's responsibility is fail-closed validation of the recorded machine state rather than independently querying GitHub for each recorded fact.

An ineligible removal throws before mutation. A dry run returns the candidate without writing. An applied candidate that later fails static validation restores the exact original registry text.

### Focused test review

The new transition suite covers:
- incomplete lifecycle states;
- audit-required task without accepted audit;
- missing integration/post-merge/Manager/master/canary evidence;
- explicit NOT_APPLICABLE semantics;
- successful completed removal;
- byte-for-byte rollback after rejected applied candidate;
- pre-write rejection preserving bytes;
- dry-run non-mutation.

The original TCW-027-F01 reproduction path no longer exists.

## F02 re-test — same-task PR supersession graph

**Disposition: PASS**

### Static / adversarial review

`detectDuplicateTaskPullRequests()` now builds a directed in-group supersession graph.

It:
- rejects self-supersession;
- rejects references not present in the live same-task group;
- detects cycles;
- requires exactly one current survivor;
- traverses from that survivor and requires every sibling to be reachable;
- only then downgrades the coherent live chain to a warning pending closure of superseded PRs.

This closes the original defect where one valid supersession edge could downgrade an unrelated unresolved sibling collision.

### Adversarial cases reviewed

The implementation correctly distinguishes:
- two unsuperseded siblings -> error;
- valid two-PR replacement -> one survivor / warning;
- partial three-PR coverage -> error;
- valid three-PR transitive succession -> one survivor / warning;
- cycle -> error;
- self-reference -> error;
- unknown reference -> error;
- multiple survivors -> error.

No residual F02 defect was reproduced.

## F03 re-test — six-role Next Activation and routing authority

**Disposition: PASS WITH ONE NON-BLOCKING FINDING**

### Controls that now pass

`validateRegistryFiles()` always validates the current Manager handoff and validates active task-scoped handoffs whose files are not legacy generic `HANDOFF.md` paths.

`validateNextActivationDashboard()` requires:
- a `## Next Activation` section;
- exactly six role rows;
- the six canonical roles in exact order.

Current frozen/current Manager, TCW-028 Builder, and TCW-029 Auditor handoffs all contain the six canonical role rows.

Manager handoff validation uses `allowActivateNow: true`; worker task-scoped handoffs use `allowActivateNow: false`. This preserves Manager routing authority and blocks the ordinary literal worker `ACTIVATE NOW` case.

### TCW-029-F01 — LOW — Markdown-formatted worker `ACTIVATE NOW` bypasses the static safeguard

**Severity:** LOW

**Violated requirement**

Accepted TCW-027-F03 remediation requires worker handoffs to be unable to self-authorize with `ACTIVATE NOW` while Manager retains that routing authority.

**Exact evidence**

The validator parses each dashboard row into raw Markdown cells and checks:

```js
if (!allowActivateNow && rows.some((row) => row[2] === "ACTIVATE NOW"))
  errors.push(...);
```

The status cell is not normalized for Markdown emphasis or equivalent presentation before the authority check.

A worker row with:

```md
| 2 | Implementation Engineer / Builder | **ACTIVATE NOW** | ... |
```

renders to a human as `ACTIVATE NOW`, but the parsed raw cell is `**ACTIVATE NOW**`, so the equality check does not fire. The role count/order checks still pass.

The existing focused test covers only the unformatted literal `ACTIVATE NOW` value.

**Impact**

A worker can produce a handoff that visually self-authorizes downstream work while passing the current static dashboard validator. This does **not** grant machine merge authority, alter `ACTIVE_TASKS.json`, or bypass Manager-only merge controls, so the defect is limited to human-facing routing semantics.

**Remediation direction**

Normalize the status cell before the authority check, or validate against a strict canonical status token grammar that rejects Markdown formatting around routing-authority statuses. Keep Manager-originated `ACTIVATE NOW` valid.

**Required validation**

Add focused cases proving worker handoffs reject:
- literal `ACTIVATE NOW`;
- Markdown-emphasized `**ACTIVATE NOW**`;
- other supported Markdown-equivalent formatting if the parser permits it;

and that Manager handoffs continue to accept the canonical unformatted `ACTIVATE NOW` status.

**Confidence:** HIGH

Because the remaining defect is a human-facing static-lint bypass and does not restore the blocking F01/F02 control-plane failures or grant actual machine/merge authority, it is non-blocking.

## Product / field boundary verification

**PASS**

PR #118 contains no product/source/config changes.

TCW-025 remains separately `AUDIT_READY` on the current machine state, with its own Trade Analyzer remediation target and independent audit gate. TCW-028 does not satisfy or alter that lane.

Current advancement from frozen target `216b9e90...` to routing master `ee1b4156...` contains only:
- audit packet/handoff;
- Manager routing/task/integration-state documentation;
- `.ai/shared/ACTIVE_TASKS.json`.

No `src/**` or `config/**` file changed. `FV-SEASON-01` remains separate and genuine-season-event gated.

## Validation matrix

| Dimension | Result |
| --- | --- |
| F01 closeout-removal semantics | PASS |
| F01 dry-run / pre-write rejection / byte rollback | PASS |
| F02 coherent PR survivor / coverage semantics | PASS |
| F02 partial/cycle/self/unknown/multiple-survivor adversarial behavior | PASS |
| F03 six canonical role rows | PASS |
| F03 Manager routing authority | PASS |
| F03 worker self-authorization static guard | PASS WITH LOW residual formatting bypass |
| Exact-head Builder FULL CI #585 | PASS |
| Frozen master FULL CI/deploy/smoke #586 | PASS |
| TCW-025 separate audit lane | PRESERVED |
| Product / ESPN / Strategy / field-validation boundaries | PRESERVED |

## Final verdict

**PASS WITH NON-BLOCKING FINDINGS**

The two blocking TCW-027 findings, F01 and F02, are independently cleared on the exact frozen target.

F03 is substantially remediated and current handoffs are compliant, but TCW-029-F01 records a narrow LOW static-lint bypass for Markdown-formatted worker `ACTIVATE NOW`. It should be corrected as bounded follow-up workflow hygiene, but it does not justify keeping the Workflow V3.2 remediation blocked on the original HIGH/MEDIUM safety defects.
