# TCW-049 — FROZEN repaired exact-SHA Independent Workflow / Security Re-Audit Packet

Manager freeze date: 2026-09-19 (America/New_York) · Canonical Workflow V3.2.
Source: TCW-047 automated exact-SHA audit-readiness gate; Builder PR #162 OPEN/DRAFT/UNMERGED.
**NEW IMMUTABLE REPAIRED AUDIT TARGET: `7c5bd1add860d1e8ed7bc03717451c7d88a21c50`.**
Builder branch: `builder/tcw-047-automated-audit-readiness`; actual authorized HISTORICAL creation baseline: `7ca2953009d37a014e041cc24f4934bfe61b5cad`.
Original TCW-048 IMMUTABLE FAILED target/repair parent (historical only): `acb63b0c85b98b34fac9af99f00f38553de5670c`.
Existing TCW-048 historical FAIL and original packet `.ai/audit/TCW-048_WORKFLOW_SECURITY_AUDIT_PACKET_acb63b0c.md` remain immutable, and must NEVER be relabeled PASS. The original Auditor's evidence is `.ai/audit/TCW-048_WORKFLOW_SECURITY_AUDIT.md` and `.ai/auditor/TCW-048_HANDOFF.md`.
NEW separately numbered independent Auditor task: `.ai/manager/tasks/TCW-049.md`.
Manager independent preflight and freeze decision: `.ai/manager/evidence/TCW-047_REPAIRED_ORIGINAL_MECHANICAL_FREEZE_7c5bd1ad.md`.
Assigned distinct Auditor branch: `auditor/tcw-049-readiness-workflow-security-reaudit`.
Actual HISTORICAL Auditor branch creation baseline: `93436f250bd38bf97357c342b84a59a02adc28fc` (created zero diff at canonical master after original-helper preflight). After Manager freeze/activation PR integration, Manager fast-forwards that branch to the actual integrated activation master; the original creation baseline never changes.

## Exact source and CI custody; supporting, never security proof

- Actual branch baseline→NEW target: 19 ahead / 0 behind / only FOUR authorized implementation paths: `.github/workflows/task-audit-readiness.yml`, `scripts/workflow-audit-readiness-automation.js`, `test/workflow-audit-readiness-automation.test.js`, `.ai/builder/TCW-047_HANDOFF.md`.
- Original FAILED target `acb63b0c85b98b34fac9af99f00f38553de5670c`→NEW target: five new commits / three changed paths (runner, tests, handoff); Builder workflow YAML unchanged in this repair.
- Full handoff-inclusive exact NEW final Builder SHA: `7c5bd1add860d1e8ed7bc03717451c7d88a21c50`; full Deploy website workflow #723/run `35484883666`, test job `106009319646`, SUCCESS. Builder reports 489/489 Node tests PASS; artifact `tcw-ci-evidence-35484883666-1` ID 10597278088. Distinguish Builder CI from independent Auditor tests.
- Original separate task-specific mechanical readiness on EXACT unchanged `7c5bd1add860d1e8ed7bc03717451c7d88a21c50` PASS with canonical Manager checkout `93436f250bd38bf97357c342b84a59a02adc28fc`: one-time Manager workflow run `35485696728`, job `106011526029`; ORIGINAL helper packet SHA256 `74277fd077fd47e117b2071710b0d3fb6667c27bf85c007b5530d39f26794182`, checked `blockers: []`, `readyForManagerFreeze: true`, exact SHA/branch/PR/baseline/authorized paths and pre/post unchanged PR HEAD. Artifact `tcw-047-original-manual-readiness-35485696728-1`, ID 10596844979. This separate ORIGINAL manual-helper result is NOT execution or installation of the new automation under audit.
- Normal master workflow #727/run `35485696737` completed success at `93436f250bd38bf97357c342b84a59a02adc28fc` including test, deploy and production verification after one-off workflow addition. The temporary one-off Manager workflow is REMOVED in activation control-plane PR; Builder workflow `.github/workflows/task-audit-readiness.yml` remains absent from master.
- Manager source design review finds new trust anchor `86a7f95217e6152db397ada8039533a7f4722b3a` pins unchanged original `scripts/audit-workflow.js`, `scripts/workflow-audit-readiness.js`, `package.json` bytes; direct Node original-helper attestation after npm plus canonical validation on empty selection, infra classification and diagnostic redaction. These are NOT independent closure of previous F01/F02/F03.

## Fresh independent adversarial scope (do NOT reuse TCW-048 verdict)

First verify canonical integration master, separately assigned TCW-049 task, this EXACT packet, registry identity/target/status, actual Auditor branch baseline and updated branch, remote Builder PR draft/unmerged exact target; stop BLOCKED if any drift.
Independently review all four exact-target Builder files (workflow/runner/tests/handoff), unchanged original helper, static workflow validator and package, original TCW-048 report/Manager accepted F01/F02/F03 decision, Workflow V3.2, actual code and CI/evidence rather than relying on Manager or Builder assertions.
1. F01: Challenge trust-anchor/entrypoint/Node/npm authenticity under future broad script/package authority, manager-vs-Builder pinned verifier byte comparison, tar/checkout changes, lifecycle/pre/post hooks and Node path interception, direct pinned-helper execution vs self-hashed npm packet, trust upgrade process, canonical overlay and scope when future Manager task authorizes modifying validator files. Attempt adversarial cases beyond Builder synthetic tests. Verify original SHA256 alone is not interpreted as security attestation.
2. F02: Challenge unconditional original CANONICAL static validator and task-spec/root-schema validation before any task selection, including no eligible tasks, unknown dispatch ID, invalid inactive/noneligible task/role authority, malformed task files, stale canonical Manager state, multiple eligible tasks, valid zero-eligible outcome and negative-path artifact failure classification. Check direct/static validator itself is trustworthy under F01.
3. F03: Challenge clear task-owned FAIL vs real local Git/disk/process INFRA_ERROR, subprocess stdout/stderr, token/auth redaction (raw tokens, base64 credential header, bearer), retained global/per-task evidence on all negative paths and no fabricated PASS.
4. Existing controls: validate GitHub event/ref, least-privilege GitHub read token, task strings/path/command injection, branch/PR identity/head races, exact SHA and ancestor, rename/no-renames path checks, manager/Builder isolated checkout, canonical overlay/staged/untracked changes, packet/hash/schema/changed-files provenance, multiple tasks/NO_ELIGIBLE_TASK result, no writes to ESPN, no auto-freeze/audit verdict/merge, evidence artifact on failure.
5. Independently run controlled negative fixtures where feasible; record precise code path, reproduction, severity, impact and limitations. Green Builder CI, original-helper mechanical PASS or Manager source review do NOT predetermine security PASS.
6. Verify FULL #723 code AND handoff on exact `7c5bd1add860d1e8ed7bc03717451c7d88a21c50`, no later Builder branch/PR head, and original independent mechanical packet and freeze provenance; do not confuse original one-time helper with new uninstalled workflow.
7. Actual DEFAULT-BRANCH new readiness workflow master-push/dispatch/read-token/artifact execution is NOT established before Builder PR authorized installation. Document a separate bounded post-install first-party Actions exercise gate; do not claim this new automation is deployed/exercised merely because the original manual helper ran.

## Independent ownership, outcome and prohibitions

Only these TWO Auditor files may be created/modified on `auditor/tcw-049-readiness-workflow-security-reaudit`:
- `.ai/audit/TCW-049_WORKFLOW_SECURITY_REAUDIT.md`
- `.ai/auditor/TCW-049_HANDOFF.md`
No change to this frozen packet, original TCW-048 report/handoff, Manager/shared/registry, Builder source/tests/actions, original validators, package/lock, product/ESPN/field-validation/TCW-034/035, or the temporary original-helper workflow. The Manager removes that temporary workflow in canonical activation; no auditor write overlap with TCW-046 or TCW-048. Exactly ONE distinct Auditor evidence PR, exact FINAL Auditor-head CI, DRAFT/UNMERGED Builder PR #162 and product PR #147. Auditor NEVER merges.

Return PASS, PASS WITH NON-BLOCKING FINDINGS, or FAIL — REMEDIATION REQUIRED with independent reproducible evidence. Manager alone adjudicates and authorizes later Builder integration after an acceptable independent verdict, then separately scopes a real post-install Actions master-push/dispatch/auth/artifact exercise. No automatic workflow substitute for manual TCW-034 readiness. Historical TCW-034 failed product target `035c5f5112b7393f9d4f17685792548afa67dd2e` remains unchanged; TCW-035 inactive.
