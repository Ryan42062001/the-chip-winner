# TCW-053 — Bounded material composite protected-release governance Builder handoff

STATUS: IMPLEMENTATION CANDIDATE — FULL CI AND FRESH INDEPENDENT MATERIAL WORKFLOW AUDIT NOT YET ACCEPTED
TASK: TCW-053 — Dormant composite protected-release governance implementation
ROLE: Implementation Engineer / Builder — separate governance lane
EXECUTION MODE: STANDARD_CHAT_HIGH
REFRESH MODE: FAST_REFRESH
CANONICAL MANAGER MASTER VERIFIED: eed9dbb34a03e3493c12ccb0ebaf2e5106cba5c4
ACTUAL HISTORICAL BUILDER CREATION AND AUTHORIZED SOURCE-DIFF BASELINE: 17cb363bf457d02cb0029430b110af002e43dc6a
BRANCH: builder/tcw-053-composite-release-governance
SOURCE BASELINE POLICY: no fast-forward, rebase, merge or cherry-pick of later Manager activation commits into this Builder branch.
OWNER AUTHORIZATION: governance implementation and a subsequent separately tasked fresh independent audit ONLY.

## Original authority and findings

TCW-051 design proposal (design SHA c7b0923f5dfcf0a1e7ce5ac3b7d301b4de96cd75) and independent TCW-052 design-only PASS WITH NON-BLOCKING FINDINGS were read with the Manager conditional decision. Accepted F01 requires versioned evidence/authority, independently verified off-master attestation and durable anti-replay controls; accepted F02 requires exact required-check preview and explicit two-parent merge method/ancestry/tree/protected-ref verification. A design verdict or local fixture pass cannot authorize a real stage, installed release or protected merge.

## Bounded owned implementation

- scripts/workflow-composite-release.js — dormant read-only TCW_COMPOSITE_RELEASE_ATTESTATION_V1 contract, exact source A, frozen M, separate stage S and protected integration G; four immutable source path/mode/blob tuples; explicit original A helper and audit; owner plan vs later exact-S installation approval; immutable evidence branch/commit/blob/tree; per-attempt nonce/finite expiry, protected append-only ledger transition/replay/consumed/aborted predicates; strict FULL exact-stage required GitHub test integration 15368 and required synthetic preview; read-only premerge/postmerge checks; explicit two-parent ordered protected merge validation; release HOLD when authenticated rights/protected ledger/external provenance unavailable.
- test/workflow-composite-release.test.js — synthetic positive LOCAL_CONTRACT_PASS and adversarial fail-closed controls for changed SHA/PR/branch/baseline/source blobs/stage diff/required check mode/app/context/preview/ruleset, moved actor/ref/master, invalid owner/auditor/rollback authority, nonce/replay/ledger, unauthorized squash/rebase, wrong G parent order/tree/actual merged files and no live authority.
- .ai/shared/WORKFLOW_V3_2.md — appended narrowly dormant TCW-053-only release-contract policy appendix. Ordinary TCW_TASK_V2, Builder/Auditor audit-readiness, branch protection and release governance unchanged.
- .ai/builder/TCW-053_HANDOFF.md — this scoped evidence.

No source staging PR/branch was created. The distinct source Builder PR #162 and trade PR #147 remain independently controlled; no installation, new Actions workflow, deployment, branch protection edit, approval, ref write, merge or release was performed. scripts/audit-workflow.js and test/workflow-audit.test.js were intentionally left unchanged: the opt-in protocol is inert and does not alter ordinary registry schema, avoiding a global authority bypass.

## Security and evidence boundary

The pure local predicates return LOCAL_CONTRACT_PASS or LOCAL_SNAPSHOT_CONTRACT_PASS only, never authenticated release-ready. The premerge CLI issues read-only authenticated GitHub observations when a read-only token exists, but currently does not possess independently authenticated owner/Manager/Auditor publisher rights, protected nonce/consumption ledger, real final-S FULL test/required GitHub synthetic preview evidence, exact-S off-master audit/owner installation approval, or authenticated rollback operator. Thus production premerge must return RELEASE_HOLD and cannot approve a stage or merge; postmerge likewise reports RELEASE_HOLD without actual G/ledger/CI/deploy proof. Caller-supplied JSON, local fixtures or claimed verified flags cannot supply missing external authority. Permission/ledger/evidence extensions requiring additional files, identities or credentials must be separately authorized by Manager/owner before any actual staging/release.

Exact stage test and expected_head_sha are not an atomic protected M compare-and-swap. Only separately authorized GitHub merge method with exactly two actual ordered parents M then S, G.tree == audited S.tree, actual merged file inventory and master ref == G may ever satisfy the proposed postmerge contract. Squash/rebase/unchecked GitHub merge preview/old A test never suffice. This implementation makes no GitHub write or release API calls.

## Observed intermediate FULL CI and final commitment

Initial handoff-inclusive implementation checkpoint: c808d6b962acc638be2d19b4454f4bceb972875a, DRAFT Builder PR #182. GitHub Deploy website PR workflow # (actual run 35512391904), test job 106082449601, completed SUCCESS in FULL mode: 490/490 Node tests PASS, 0 FAIL, Workflow V3.2 state audit, dependency install/audit, model evaluation, browser/static smoke, accessibility, readiness, mobile, extension, performance, security, evidence-upload and classifier guardrails SUCCESS. Artifact tcw-ci-evidence-35512391904-1 / ID 10605448639. This is an INTERMEDIATE implementation checkpoint, not the final freeze target.

The final combined code/test/handoff commit extends immutable release-tuple binding to every source and stage file tuple, exact-stage check/preview, actor approval and rollback fields, with targeted negative regression coverage. **A fresh FULL GitHub PR run on that exact final commit is required**; no subsequent docs-only head may replace its freeze target. Manager must verify the final run/job IDs and same-SHA test status before any freeze.

## Adversarial fixture correction before final full-head validation

The first extended read-only observer FULL PR run 35512667724/test job 106083210858 correctly failed two newly added test fixtures: the fixture's protected ledger snapshot retained its old digest after a synthetic ruleset mutation, and an all-empty mocked API now fails at explicit truncated/missing Git tree observation instead of the older generic NOT VERIFIED assertion. Corrected these fixtures without weakening any security predicate; that run is FAILURE, not accepted evidence. Require a new exact-final-head FULL CI after this combined test/handoff fix.

## Authenticated read-only stage observation hardening

The bounded premerge command now also independently GETs original A and stage S Git trees, exact complete stage PR file inventory and blobs/modes, strict ruleset/digest, required actual stage-head FULL Actions run/test job/check-run/app/check-suite, and the required GitHub synthetic merge-preview commit/test and ordered M/S parents. Truncated trees, changed PR path inventory, failed or DOCS_ONLY required stages, wrong check app or changed preview fail closed as RELEASE_HOLD. These authenticated read-only observations remain insufficient to prove owner/Manager/Auditor publication rights, an external protected nonce ledger, separate exact-S owner approval or rollback availability. This still cannot authorize a merge or claim operational L4; any unavailable permission/evidence holds the release.

## Self-validation and remaining Manager gates

Required final evidence: exact final Builder HEAD containing implementation/tests/this handoff, allowed-path diff from 17cb363bf457d02cb0029430b110af002e43dc6a, targeted node --test test/workflow-composite-release.test.js, existing static workflow audit, full npm test and fresh GitHub PR FULL CI at the exact handoff-inclusive SHA. CI evidence and job/run IDs must be published separately after observed completion; no invented mechanical PASS. The original task-specific helper on Builder branch needs canonical Manager task/registry read-only overlay and eligibility reconciliation before a genuine prefreeze readiness run, without committing Manager activation files or pretending the branch was created later.

Manager independently reviews exact code/diff/CI/limitations and freezes actual final SHA; NEW separate fresh Independent Auditor/QA task audits executable implementation, negative cases and non-operativeness, not the earlier TCW-052 design target. A later distinct owner decision is needed for staged-source creation and a further exact-S owner release decision. No operational readiness or authenticated GitHub L4 is established by fixtures or Builder CI.

## Next Activation

| Order | Employee / Role | Status | Current Task / Gate | Copy/paste activation prompt / next action |
| ---: | --- | --- | --- | --- |
| 1 | Manager / Architect | RECOMMEND TO MANAGER | TCW-053 independent governance implementation review | Verify actual final Builder HEAD, creation-baseline source diff, FULL CI and security limits; review original mechanical readiness with isolated canonical overlay; freeze separately and route NEW fresh Independent Auditor/QA task. Do not stage or install. |
| 2 | Implementation Engineer / Builder | ACTIVE | TCW-053 implementation and exact-head validation | Validate target tests, full suite, read-only contract and final PR head; return complete evidence without merge or self-freeze. |
| 3 | In-Season Strategy & Decision Intelligence Analyst | WAIT | Separate Manager-owned strategy routing | No activation or trade policy authority from TCW-053. |
| 4 | Research & Development (R&D) | WAIT | Separate research routing | No TCW-053 source/approval authority. |
| 5 | Independent Auditor / QA | WAIT | NEW separately numbered TCW-053 executable control-plane audit | Manager must first freeze actual final Builder HEAD and independently assign a fresh audit; prior TCW-052 PASS is design only. |
| 6 | Troubleshooting & Root Cause Engineer — on-demand | IDLE | No separate root-cause assignment | Activate only by Manager on a reproducible blocker. |
