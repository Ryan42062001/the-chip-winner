# TCW-048 — Manager Independent Workflow/Security Finding and CI-Drift Decision

Manager / Architect · 2026-09-19 America/New_York
Canonical Workflow: V3.2
Source Builder task: TCW-047; Builder PR #162 DRAFT/UNMERGED
Original immutable FAIL audit target / bounded Builder repair parent: `acb63b0c85b98b34fac9af99f00f38553de5670c`
Historical authorized Builder creation baseline: `7ca2953009d37a014e041cc24f4934bfe61b5cad`
Auditor task: TCW-048; evidence PR #165 OPEN/UNMERGED, exact head `84ec5e38ac6b027f77c40e6cc47df6f4f8165fb1`
Actual historical Auditor branch creation baseline: `86a7f95217e6152db397ada8039533a7f4722b3a`
Auditor activation master: `2f81a42034021afe2306478101956fedeacdf8cf`
Audit report: `.ai/audit/TCW-048_WORKFLOW_SECURITY_AUDIT.md`
Auditor PR comment: https://github.com/Ryan42062001/the-chip-winner/pull/165#issuecomment-5747015014
Manager independent findings disposition: https://github.com/Ryan42062001/the-chip-winner/pull/165#issuecomment-5747029463

## Independent review and F01 — ACCEPTED / HIGH / BLOCKING

Frozen `scripts/workflow-audit-readiness-automation.js` verifies authorized file changes but invokes `npm run workflow:audit-readiness` in the Builder checkout (`runMechanical`); overlayCanonicalControlPlane only copies `.ai`, leaving Builder-controlled `package.json`, `scripts/workflow-audit-readiness.js`, `scripts/audit-workflow.js` as the executable trusted validation chain. A future Manager task authorized to edit `scripts/` or package files can therefore alter the verifier and still satisfy generic task write-scope checks. The returned unkeyed packet SHA256 is recomputable by the compromised helper; merely matching a digest and task/PR/head fields does not independently attest original-validator execution. The current PR #162 does not itself modify the original helpers.

**Remediation:** fail closed on any Builder vs pinned canonical trusted helper/static-validator/npm-entry-point divergence or execute the trusted canonical copy under an isolated safe invocation that retains exact Builder HEAD, original baseline diff and verified canonical task state. Defend against npm pre/post hooks/entrypoint bypass; authenticate trusted code from the frozen canonical Manager revision independently of the Builder. A separately Manager-authorized future change to trusted helper requires a separate explicit trust-anchor update process, not automatic self-certification. Add broad-script/package tamper negatives and unmodified positive; preserve credential/read-only controls.

## F02 — ACCEPTED / MEDIUM / BLOCKING

`selectEligibleTasks` checks a subset of registry invariants, and when the selected set is empty, `runTask`/`runMechanical` never calls the original static workflow validator. Thus malformed `active_only`, `workflow_overlay`, noneligible task authority or spec can yield successful `NO_ELIGIBLE_TASK` rather than canonical FAIL. Independently inspected frozen source and the original `validateRegistryShape` invariants.

**Remediation:** validate full canonical registry and task-spec contract with a trusted canonical validator on every invocation before declaring NO_ELIGIBLE_TASK or executing tasks; valid zero eligible yields NO_ELIGIBLE_TASK, invalid canonical state yields FAIL and retained sanitized evidence. Regress malformed root and inactive tasks, spec mismatches, clean empty and multi-task cases. Do not satisfy this by invoking untrusted Builder validator (F01).

## F03 — ACCEPTED / LOW / NON-BLOCKING, SAME-PASS

The frozen runner maps untagged Git/filesystem/process exceptions to FAIL and loses sanitized stderr when the static audit returns non-JSON. Infra faults must not appear as task-owned code defects; conversely scope/authority violations must remain FAIL, never falsely INFRA_ERROR.

**Remediation:** bounded, precise infrastructure exception classification plus safe diagnostic capture/redaction/artifacts for negative paths. No claim that F03 causes false PASS.

## Verdict and Builder route

**TCW-048 independent verdict FAIL — REMEDIATION REQUIRED accepted for the frozen immutable source target.** F01/F02 blocking; F03 same-pass. Builder task TCW-047 moves to REWORK_REQUIRED/AUDIT on existing `builder/tcw-047-automated-audit-readiness` and DRAFT PR #162; do not rewrite frozen target. Only previously authorized TCW-047 files may change: `.github/workflows/task-audit-readiness.yml`, `scripts/workflow-audit-readiness-automation.js`, `test/workflow-audit-readiness-automation.test.js`, `.ai/builder/TCW-047_HANDOFF.md`. Existing mechanical helper/static workflow validator/package and Manager/registry/Auditor/Strategy/R&D remain forbidden. Builder must produce a NEW exact final implementation+tests+handoff head with fresh FULL validation on that same head. Manager independently inspects scope, reconciles checkpoint/readiness and freezes a new exact target; a NEW separately numbered independent workflow/security audit is mandatory before integration. TCW-048 historical FAIL and frozen packet are immutable history. After any future accepted re-audit, a first-party real Actions master-push/dispatch/auth/artifact exercise remains an additional installation/closure gate; no auto-freeze/merge.

## Separate Manager-owned inherited canonical CI drift

Post-activation master #713/run `35483327821`, test job `106004971692` FAILED with actual job logs:
- TCW-046: original assignment baseline `7ca2953009d37a014e041cc24f4934bfe61b5cad`, 9 control-plane commits to activation master, unclassified.
- TCW-047: original assignment baseline `7ca2953009d37a014e041cc24f4934bfe61b5cad`, 9 control-plane commits, unclassified.
- TCW-048: ACTUAL Auditor branch creation baseline `86a7f95217e6152db397ada8039533a7f4722b3a`, 8 control-plane commits, unclassified.
- TCW-034: previously classified CONTROL_PLANE_ONLY (21 commits), warning only, not an error.

Auditor PR #165 exact-head #714/run `35483811172`/test `106006321296` reproduces the same inherited errors; this is NOT a green Auditor PR checkpoint. Independently compared actual original baselines to activation master `2f81a42034021afe2306478101956fedeacdf8cf`. TCW-046 and TCW-047 baseline→master changed files: `.ai/audit/TCW-048_WORKFLOW_SECURITY_AUDIT_PACKET_acb63b0c.md`, `.ai/manager/HANDOFF.md`, `.ai/manager/INTEGRATION_QUEUE.md`, `.ai/manager/tasks/TCW-046.md`, `.ai/manager/tasks/TCW-047.md`, `.ai/manager/tasks/TCW-048.md`, `.ai/shared/ACTIVE_TASKS.json`. TCW-048 baseline→master has those except TCW-046 task. All are Manager-owned or frozen audit-routing control-plane files, not Builder workflow/product source, TCW-048 Auditor evidence, approved ESPN provider, or field validation.

**Resolution:** add truthful `target_advancement: {classification: CONTROL_PLANE_ONLY, checked_at_sha: 2f81a42034021afe2306478101956fedeacdf8cf}` for TCW-046/047/048 while preserving each existing `assignment_master_sha` and actual branch creation history. Existing TCW-034 classification and exact immutable product audit target `035c5f5112b7393f9d4f17685792548afa67dd2e` remain untouched. Recheck next master changes before any merge; mere classification does not excuse future product/Builder scope drift. Require successful final Manager control-plane PR validation, real post-merge master CI and a new GREEN exact Auditor-head PR check before considering Auditor evidence integration. Manager may route Builder remediation after canonical state reconciliation; do not merge Builder #162 or #147, activate TCW-035 or substitute TCW-047 automation for in-flight TCW-034 manual readiness.
