# TCW-047 — Builder Workflow Automation Handoff

STATUS: BOUNDED F01/F02/F03 REPAIR CANDIDATE — FINAL HANDOFF-INCLUSIVE FULL CI AND FRESH AUDIT PENDING
REWORK AUTHORITY: Manager accepted TCW-048-F01 HIGH/BLOCKING, F02 MEDIUM/BLOCKING, F03 LOW/same-pass
REPAIR PARENT / IMMUTABLE FAILED AUDIT TARGET: acb63b0c85b98b34fac9af99f00f38553de5670c
CANONICAL MASTER VERIFIED AT REWORK START: c9c757625acde9a220149151f2a57a1dc97b1465
TASK: TCW-047 — Automated Exact-SHA Task Audit-Readiness Gate
ROLE: Implementation Engineer / Builder — independent Workflow Automation lane
EXECUTION MODE: STANDARD_CHAT_HIGH
REFRESH MODE: FAST_REFRESH
CANONICAL MASTER VERIFIED AT START: 86a7f95217e6152db397ada8039533a7f4722b3a
AUTHORIZED WORKER BRANCH CREATION BASELINE: 7ca2953009d37a014e041cc24f4934bfe61b5cad
BRANCH: builder/tcw-047-automated-audit-readiness
MANAGER AUTHORITY: freeze, independent audit routing and merge remain Manager-controlled.

## Bounded implementation

- New read-only master-push and explicit task-ID workflow dispatch under .github/workflows/task-audit-readiness.yml; push selection is limited to changed canonical checkpoint/task metadata and never interprets an arbitrary supplied SHA as authority. A push without newly eligible work records NO_ELIGIBLE_TASK, not PASS.
- New scripts/workflow-audit-readiness-automation.js verifies triggering master SHA and canonical registry, validates all task identities, supports independent eligible Builder tasks, checks assigned PR/head/branch/repository/base via authenticated GitHub API, fetches the advertised Builder branch via read-only Git credentials, checks an immutable exact checkpoint and original assignment ancestor, and rejects unauthorized changed files.
- A fresh isolated Builder checkout retains the exact assigned branch name and original HEAD. The canonical Manager .ai control-plane is overlaid into its working tree for the existing scripts/audit-workflow.js and scripts/workflow-audit-readiness.js; no overlay is committed and no product/source changes are permitted. The existing npm run workflow:audit-readiness -- --task TCW-### helper is executed unmodified without an inherited GitHub token. The original packet's SHA256 and provenance are verified.
- Each eligible task generates a machine-readable result with classification PASS, FAIL or INFRA_ERROR, original packet SHA256, timestamps, exact manager/checkpoint/PR/branch/baseline identity, changed paths, blockers, workflow run/job and verified provenance. A separate summary has explicit NO_ELIGIBLE_TASK and cannot report PASS when an eligible task was omitted or failed. GitHub Actions retains results and safe logs for 30 days on both success and failure.
- No merge, freeze, audit verdict, source authorization, ESPN writes, deployment, field-validation changes, active Builder trade PR edits, or TCW-046 audit target modification is implemented.

## Scope

Owned files only:
1. .github/workflows/task-audit-readiness.yml
2. scripts/workflow-audit-readiness-automation.js
3. test/workflow-audit-readiness-automation.test.js
4. .ai/builder/TCW-047_HANDOFF.md

Existing workflow validator, mechanical helper, package/lock, .ai/shared/ and .ai/manager/ are read-only. The original Builder SHA's authorized implementation diff is still computed from assignment_master_sha..HEAD, not from a merged Manager/Auditor branch.

## Validation and limitations

Deterministic test fixtures cover active-task selection, concurrent tasks, missing/invalid checkpoint and Manager metadata, wrong status/PR/branch, branch or PR advancement, synthetic Git ancestor/changed-file protections, canonical metadata overlay on older Builder task state, helper packet hash/provenance/blockers, aggregate fail-closed classifications, artifact retention and absence of automated merge/freeze privileges.

Validated code/test checkpoint: `783ec3123429cd88d238022aed88344e89658794`.
FULL PR #162 GitHub Actions run `35480569465`, test job `105997501171`: SUCCESS. All 488 Node tests passed (0 failed), including the synthetic actual-helper PASS/FAIL/INFRA_ERROR checkout/overlay/provenance/packet test; workflow V3.2 audit, dependency install/audit, model eval, static/browser smoke, accessibility, readiness, mobile, extension, performance and security checks all passed. CI evidence artifact: `tcw-ci-evidence-35480569465-1` (artifact ID `10595497712`). Deployment and production verification skipped on the PR, as expected.

PENDING: final handoff-inclusive exact-head CI and independent Manager acceptance. The new workflow is not available on the default branch until a Manager-authorized integration; GitHub's workflow_dispatch trigger cannot be considered actually validated solely by this feature branch's YAML or unit tests. Manager must require an actual Actions checkout/provenance/packet exercise after safe installation or separately authorize a bounded test mechanism. In-flight TCW-034/TCW-046 freezes must use existing independently verified procedure.

## TCW-048 bounded security remediation and new validation

F01: Frozen Manager trust anchor 86a7f95217e6152db397ada8039533a7f4722b3a authenticates canonical and Builder copies of the original mechanical helper, static validator and complete npm package entrypoint independently of Builder write authority. Divergence fails closed, including broadly authorized scripts/package changes. npm lifecycle hooks are suppressed; the original pinned helper also executes independently using the runner Node binary with exact packet comparison, avoiding project-controlled npm executable shims. A legitimate validator upgrade needs a distinct explicit trust-anchor update.

F02: The pinned original static validator is executed on canonical Manager metadata on every invocation before task selection, including zero-work and manual dispatch; corrupt root, inactive task authority and task specs produce FAIL artifacts, not NO_ELIGIBLE_TASK. Valid empty and concurrent eligible tasks preserve prior behavior.

F03: Git/process/environment errors are classified INFRA_ERROR separately from authority/static/scope FAIL, with bounded token-redacted diagnostic output retained in per-task or global artifacts. Existing original immutable SHA, ancestry, PR/branch/head, canonical overlay, read-only credential isolation and no-merge/no-freeze controls remain intact.

Repaired interim FULL PR run 35484727661, test job 106008904225: SUCCESS, 488/488 Node tests PASS, workflow, dependencies, model, static/browser smoke, accessibility, readiness, mobile, extension, performance and security PASS. Interim checkpoint: 92592742b2175f627b8ae8dc4daf51dbec89e892. FULL retained CI artifact tcw-ci-evidence-35484727661-1, ID 10596868556. First adversarial fixture run 35484688898 FAILED two fixture cases; corrected and superseded, not represented as green.

This single final combined script/test/handoff commit must receive a new FULL PR CI at its exact unchanged SHA. No subsequent docs-only SHA may be substituted as a freeze target. This is Builder self-validation, NOT reversal of historical TCW-048 FAIL or a fresh independent verdict. Manager must independently review scope, reconcile canonical checkpoint, obtain task-specific mechanical readiness PASS at the new exact head, freeze a NEW immutable target, and route a separately numbered FRESH workflow/security re-audit. Actual first-party Actions master-push/dispatch/auth/artifact verification is still a distinct post-installation gate. PR #162 and trade PR #147 remain DRAFT/UNMERGED; TCW-034 failed product target 035c5f5112b7393f9d4f17685792548afa67dd2e and manual readiness remain authoritative; TCW-035 inactive.

## Next Activation

| Order | Employee / Role | Status | Current Task / Gate | Copy/paste activation prompt / next action |
| ---: | --- | --- | --- | --- |
| 1 | Manager / Architect | RECOMMEND TO MANAGER | TCW-047 scoped implementation and independent workflow/security audit | Inspect TCW-047 exact final HEAD, diff, full CI, security boundaries and Actions-test limitation; route independent workflow/security audit before any integration. Do not merge TCW-034 on this evidence. |
| 2 | Implementation Engineer / Builder | ACTIVE | TCW-047 CI / evidence | Verify complete TCW-047 exact-head CI; remediate only task-owned findings, preserve PR and immutable trade targets. |
| 3 | In-Season Strategy & Decision Intelligence Analyst | WAIT | Existing Manager strategy routing | Continue independently only on Manager assignment; no TCW-047 authority over strategy. |
| 4 | Research & Development (R&D) | WAIT | Existing Manager R&D routing | Continue independently only on Manager assignment; no TCW-047 authority over R&D. |
| 5 | Independent Auditor / QA | ACTIVE | TCW-046 independent trade-winner re-audit; separate TCW-047 audit not yet assigned | Maintain TCW-046 frozen-target independence. Manager may route a separate fresh TCW-047 workflow/security audit after reviewing this implementation. |
| 6 | Troubleshooting & Root Cause Engineer — on-demand | IDLE | No newly established cross-layer blocker | Wait for Manager routing if a reproducible unresolved blocker arises. |
