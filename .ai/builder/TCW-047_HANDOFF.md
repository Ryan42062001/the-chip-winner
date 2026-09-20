# TCW-047 — Builder Workflow Automation Handoff

STATUS: IMPLEMENTED CANDIDATE — EXACT-HEAD CI / INDEPENDENT AUDIT NOT YET COMPLETE
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

PENDING: targeted/full repository CI, exact final-head CI and independent Manager acceptance. The new workflow is not available on the default branch until a Manager-authorized integration; GitHub's workflow_dispatch trigger cannot be considered actually validated solely by this feature branch's YAML or unit tests. Manager must require an actual Actions checkout/provenance/packet exercise after safe installation or separately authorize a bounded test mechanism. In-flight TCW-034/TCW-046 freezes must use existing independently verified procedure.

## Next Activation

| Order | Employee / Role | Status | Current Task / Gate | Copy/paste activation prompt / next action |
| ---: | --- | --- | --- | --- |
| 1 | Manager / Architect | RECOMMEND TO MANAGER | TCW-047 scoped implementation and independent workflow/security audit | Inspect TCW-047 exact final HEAD, diff, full CI, security boundaries and Actions-test limitation; route independent workflow/security audit before any integration. Do not merge TCW-034 on this evidence. |
| 2 | Implementation Engineer / Builder | ACTIVE | TCW-047 CI / evidence | Verify complete TCW-047 exact-head CI; remediate only task-owned findings, preserve PR and immutable trade targets. |
| 3 | In-Season Strategy & Decision Intelligence Analyst | WAIT | Existing Manager strategy routing | Continue independently only on Manager assignment; no TCW-047 authority over strategy. |
| 4 | Research & Development (R&D) | WAIT | Existing Manager R&D routing | Continue independently only on Manager assignment; no TCW-047 authority over R&D. |
| 5 | Independent Auditor / QA | ACTIVE | TCW-046 independent trade-winner re-audit; separate TCW-047 audit not yet assigned | Maintain TCW-046 frozen-target independence. Manager may route a separate fresh TCW-047 workflow/security audit after reviewing this implementation. |
| 6 | Troubleshooting & Root Cause Engineer — on-demand | IDLE | No newly established cross-layer blocker | Wait for Manager routing if a reproducible unresolved blocker arises. |
