# Builder Handoff — TCW-034 F02-R1 / F04-R1 bounded remediation

STATUS: FINAL REPAIRED CANDIDATE — FRESH FULL EXACT-HEAD CI REQUIRED
TASK: TCW-034 — Trade Winner Engine
ROLE: Implementation Engineer / Builder
EXECUTION: STANDARD_CHAT_HIGH
REFRESH: BOUNDED_REMEDIATION_REFRESH
BRANCH: `builder/tcw-034-trade-winner-engine`
PR: #147 — DRAFT / UNMERGED; Builder must not merge
EXACT REPAIR PARENT: `24be4be45f7fde351c0a6e209353dd2beed8d854`
VERIFIED CANONICAL MASTER AT REMEDIATION START: `6861f1375878cd1dd2b94b87e583e66e181b8d08`
CANONICAL MASTER/AUDITOR ADVANCEMENT: CONTROL_PLANE_ONLY; not merged into this Builder branch.

## Accepted authority
Manager decision: `.ai/manager/evidence/TRADE_WINNER_SECOND_AUDIT_DECISION.md`.
Independent audit: `.ai/audit/TCW-045_TRADE_WINNER_ENGINE_REAUDIT.md`, PR #157, audit workflow #679 / `35476232619`, test job `105985840004` PASS.
Only accepted TCW-045-F02-R1 (MEDIUM/blocking) and F04-R1 (LOW/same-pass) plus directly necessary regressions are in this repair.
Prior F01 raw-count and F03 canonical-horizon fixes remain intact.

## F02-R1: complete-rule, tri-state acquisition legality
- Introduced a conservative, evidence-aware internal roster-path evaluation: `KNOWN_LEGAL`, `KNOWN_BLOCKED` and `UNKNOWN`, with an explicit `requiresExplicitDrop` conditional path.
- An absent/partial size, omitted/non-array/malformed position-limit evidence, or unknown player position cannot produce a KNOWN_LEGAL result merely because the known violation list is empty.
- An explicit array of position limits (including an explicit empty array) and a positive finite roster size are necessary for complete applicable roster-rule evidence; existing normalized unlimited -1 values are not treated as finite violations.
- Proven violations may remain KNOWN_BLOCKED, whereas incompletely verified direct-add/drop alternatives remain UNKNOWN, not BLOCKED.
- Simulated drops are conditional only. No hypothetical drop becomes an ESPN transaction or authorization. Current-week locked players are excluded from hypothetical drop paths using the analysis timestamp and existing lock predicate.
- Only a verified direct-add path contributes to `feasibleCandidateIds`, `replacementProjectionOrNull`, and `supportedReplacementQualityCost`. A legal-but-conditional drop cannot silently yield unconditional numeric replacement or material quality cost.
- Replacement-path/fragility handling distinguishes VERIFIED, CONDITIONAL, UNKNOWN, BLOCKED and NO_ELIGIBLE; an UNKNOWN path cannot be reclassified as proven blocked/dangerous merely from missing roster rules. Supported independent contingency/bye consequences remain separate.
- F02-R1 integration regressions cover missing rules, missing size, missing position-limit field, malformed limits, unknown direct-add and conditional-drop paths, verified direct addition, verified conditional drop, known position-limit block, numeric withholding, no unsupported replacement quality cost, preserved 2-for-1/1-for-2 and FLEX/OP.
- Preserved original current-week lock/read-only `transactionActions: []` and explicit-drop gates.

## F04-R1: genuinely independent source roots
- Confidence now resolves `provenance.derivativeOf` chains by exact source ID to their declared root, rather than counting unrelated-looking group labels.
- Contradictory derivative group labels, duplicate or ambiguous origins, missing origins, or cyclic ancestry cannot elevate confidence to HIGH.
- A genuinely independent root requires trusted Manager-approved, explicitly independent source authority and a nonblank root independence group.
- HIGH requires at least two verified distinct independent root groups, a common package-value unit, and agreement with the published winner claim. Any contradictory/ambiguous ancestry caps confidence at MODERATE; package source disagreement remains WITHHELD.
- Regressions include direct contradictory derivative, shared-root chain, cycle, missing/ambiguous origin, two independent same-scale roots, and a contradictory derivative alongside two independent roots.

## Preserved authority and limitations
- `PRODUCTION_TRADE_VALUE_SOURCES = Object.freeze([])`; no live value provider is authorized.
- Live `packageValue.status` / `winner` and winner split remain WITHHELD/null. No named external provider, ranking/projection/SOS/ADP/VORP/waiver/replacement fallback into market value.
- ESPN remains read-only, `transactionActions: []`. No acceptance probability, ESPN write, TCW-035 or later task.
- F01 descriptive counts, F03 canonical playoffs/ROS, explicit follow-up drops, optimized FLEX/OP, source/horizon separation, and prior tests remain in place.
- `config/field-validation.json` and `FV-SEASON-01` remain unchanged/pending. No Level-4 authenticated ESPN field UAT is claimed.

## Exact final candidate and evidence rule
The exact commit containing this completed handoff ALSO includes the final non-doc F04-R1 provenance-conflict regression, so it requires a fresh FULL workflow on the SAME final head. No later handoff-only commit may replace it.
The current handoff describes the final immutable candidate by its PR/branch and commit-containing-this-file; the exact resulting SHA, FULL run/job, test count and evidence artifact will be recorded on PR #147 and returned to Manager without changing Builder HEAD after CI.
Do NOT run task-specific `workflow:audit-readiness -- --task TCW-034` prematurely while canonical Manager state has `status: ASSIGNED` and `worker_checkpoint_sha: null`.

## Exact changed files relative to repaired parent
- `.ai/builder/HANDOFF.md`
- `src/domain/trade-analyzer.js`
- `src/domain/trade-value-engine.js`
- `test/trade-winner-engine.test.js`
- `test/trade-winner-integration.test.js`
No other Builder, Manager, Auditor, Strategy, R&D, provider, workflow, config, or package file changes are authorized.

## Next Activation
| Order | Role | Status | Next action |
| ---: | --- | --- | --- |
| 1 | Manager / Architect | RECOMMEND TO MANAGER after exact-head FULL PASS | Record the exact FULL repaired head as `worker_checkpoint_sha`, transition to MANAGER_REVIEW_READY without changing Builder HEAD, run task-specific audit-readiness, freeze unchanged SHA only after PASS, and route another fresh Independent Auditor re-audit. |
| 2 | Builder | COMPLETE after exact-head FULL PASS | No additional branch commit, no merge; respond only to newly accepted bounded findings. |
| 3 | Strategy | WAIT | No new strategy work. |
| 4 | R&D | WAIT | No new provider research or approval. |
| 5 | Independent Auditor | WAIT | Fresh re-audit only of Manager-frozen immutable repaired target. |
| 6 | Troubleshooting | IDLE | No activation unless Manager routes a genuine blocker. |


## TCW-034 — TCW-046-F02-R2 accepted third-audit bounded same-task remediation (2026-09-23)

STATUS: NEW REPAIR CANDIDATE — exact-final-head FULL CI required; original mechanical audit-readiness pending Manager checkpoint reconciliation.
Canonical Manager activation master independently verified: `95a4528dac9a983d20e6fa0d95708cfb7c7c87be`, genuine new master push FULL `35949651846` / required test `107475221798` SUCCESS. Manager canonical receipt PR #235 comment `5806707768`; exact Builder authorization PR #147 comment `5806712906`. Historical immutable failed third target and this bounded repair's direct parent: `035c5f5112b7393f9d4f17685792548afa67dd2e`. Original Auditor PR #163 exact head `af7b173865a9dcb1feb8841f9822ee6282f1229d`, independent FAIL and TCW-046-F02-R2 MEDIUM/BLOCKING accepted by Manager comment `5746618033`; retain historical failure without retargeting or rewriting it. Builder PR #147 remains DRAFT/OPEN/UNMERGED on original branch; do not integrate newer Manager control-plane files.

Remediation code: `src/domain/trade-analyzer.js` invokes the existing `getLineupLockReason` on the proposed available waiver CANDIDATE before assessing direct or hypothetical-drop acquisition; explicit player lock or kickoff at/before analysis time returns `UNKNOWN` for **CURRENT-WEEK usable-replacement verification**, never numeric current-week projection or feasible candidate ID. This is not a blanket ESPN after-kickoff add prohibition or a definite `KNOWN_BLOCKED` status. Original structural pool and descriptive future-week possibility remain visible; complete/partial roster rules, supported bye/contingency facts and original direct/conditional-drop behavior are preserved. The shared path gates verified quality cost and fragility, without independently inventing a dangerous/safe roster outcome or hiding genuinely supported non-waiver losses.

Targeted integration tests in `test/trade-winner-integration.test.js` cover RB/FLEX/OP × explicit-lock/kickoff-passed negatives and otherwise-matched unlocked future-kickoff positives, complete direct and full-roster conditional paths, absent/partial/malformed roster rules, same snapshot/time, structural/future distinction, bye/contingency preservation, feasible IDs, numeric projection, material quality and fragility, and read-only transactionActions. Earlier F01/F02-R1/F03/F04-R1 fixes remain untouched. No source/provider installation; production trade-value provider list EMPTY, package winner/split WITHHELD, FV-SEASON-01 pending, ESPN read-only, TCW-035 inactive. TCW-060/047 external role-publisher/observer/validator RELEASE_HOLD and F03 custody limitation remain separately OPEN.

This Builder handoff is committed in the SAME NEW CODE+TEST+HANDOFF checkpoint for fresh FULL CI; the exact commit SHA/tree, run and job identifiers must be recorded **only after independent live verification**, on PR #147 and in the Manager return, without a later handoff-only change. Original task-specific `workflow:audit-readiness -- --task TCW-034` is NOT claimed PASS: current canonical registry is `REWORK_REQUIRED` with old `worker_checkpoint_sha`; Manager must reconcile the new SHA/status first, execute the genuine helper against the UNCHANGED repaired head, freeze a NEW separate target and activate a NEW fresh independent audit. No Builder/Auditor PR merge, protected release, deployment or Level-4 claim.

### TCW-034 F02-R2 Next Activation

| Order | Employee / Role | Status | Current Task / Gate | Copy/paste activation prompt / next action |
| ---: | --- | --- | --- | --- |
| 1 | Manager / Architect | RECOMMEND TO MANAGER | TCW-034 repaired-source review | Independently verify exact new Builder SHA/tree/FULL CI, historic failed parent, narrow diff; reconcile checkpoint/status, obtain genuine task-specific mechanical PASS on same head, freeze NEW audit target and separately assign NEW fresh Auditor task. No merge. |
| 2 | Implementation Engineer / Builder | COMPLETE AFTER FULL CI | Existing TCW-034 bounded F02-R2 | Preserve PR #147 draft/unmerged; no subsequent handoff-only commit; respond only to separately accepted new findings. |
| 3 | In-Season Strategy & Decision Intelligence Analyst | WAIT | No source-policy change | Preserve accepted TCW-032 strategy semantics. |
| 4 | Research & Development (R&D) | WAIT | No source-provider task | Production provider set stays EMPTY. |
| 5 | Independent Auditor / QA | WAIT | New fresh task after Manager freeze | Original TCW-046 PR #163 retains historical failed third-target audit; cannot be retargeted. |
| 6 | Troubleshooting & Root Cause Engineer — on-demand | IDLE | No separate blocker | Only Manager may route a separately scoped reproducible failure. |
