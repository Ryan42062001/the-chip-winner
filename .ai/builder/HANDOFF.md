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


## TCW-034 — bounded fourth-audit F02-R3 / F02-R4 same-task repair (2026-09-24)

STATUS: NEW CODE+REGRESSION+HANDOFF CANDIDATE; separate exact-final-head FULL CI and Manager mechanical gate required.
Protected master verified at assignment: `75ae22a7b97ee5153288f485ac3bcd065d3dc8e7`; genuine NEW master PUSH FULL `35954857358` / required test `107490895024` SUCCESS. Manager separate finding acceptance original Auditor PR #238 comment `5807445613`; Manager R3 activation receipt PR #239 comment `5807574094` and exact Builder route PR #147 comment `5807581059`. Historical immutable FAILED fourth product target and this bounded repair's direct parent `e63b198d089a7cd8259f6a30ff77236f8d68bb28` / native tree `8c9d3c0d131991a380dce08048e95648d2fee141`; original third FAILED target `035c5f5112b7393f9d4f17685792548afa67dd2e` separately preserved. Original independent Auditor evidence PRs #238/#163 retain their own immutable original FAIL and remain draft/open/unmerged.

**F02-R3:** Current-week fragility now uses the same independently checked direct candidate pool as replacement path, numeric scarcity and supported replacement-quality: complete same-snapshot/week, verified roster constraints and capacity, applicable slot/demand, candidate-specific unlock/future kickoff and no hypothetical drop. The high-ranked structural-only locked/unknown candidate never masks a materially weaker only feasible low same-position waiver candidate. Preserve descriptive structural/future waiver listing, real independent contingency and bye effects, unknown/conditional acquisition and genuine higher unlocked/direct positive.

**F02-R4:** A candidate-specific ESPN `gameTime` must establish a valid unambiguous future kickoff (full ISO date/time plus Z or explicit valid numeric offset, real calendar date) and no explicit player lock before any CURRENT-WEEK `KNOWN_LEGAL` route. Omitted/null/invalid/malformed/date-only/timezone-free/ambiguous/exact-or-past kickoff return `UNKNOWN` usability, not proof of universal ESPN add prohibition, `KNOWN_BLOCKED` or fabricated `DANGEROUS`. No alternate authoritative positive eligibility signal is approved in this bounded lane. Separate structural/future descriptions remain.

**Tests:** Full intact `analyzeTrade` integration cases on RB/FLEX/OP for mixed locked-high/verified-low vs only-low vs genuinely unlocked-high with direct/full roster conditional-drop and incomplete rules; missing/null/invalid/ambiguous/exact/past/future kickoff, explicit-lock conflict, source/market withholding and read-only `transactionActions:[]`. Earlier F01/F02-R1/F02-R2/F03/F04-R1 left intact. Only `src/domain/trade-analyzer.js`, `test/trade-winner-integration.test.js`, this final `.ai/builder/HANDOFF.md` changed from immutable fourth failed parent; original Builder branch and PR #147 preserved, NO Manager/audit/workflow/provider/config/ESPN code change.

**EVIDENCE & GATES:** Code, tests and this handoff must be included TOGETHER in a single new exact-final-head genuinely FULL PR test success; subsequent handoff-only SHA cannot substitute. Record actual SHA/tree/full run/job in Manager return and PR comment AFTER independently verifying live GitHub, without changing branch head. Canonical TCW-034 remains REWORK_REQUIRED and original failed checkpoint/target until separate Manager reconciliation; task-specific original `workflow:audit-readiness -- --task TCW-034` has NOT been run against new candidate and no new independent Auditor PASS/Level-4 ESPN UAT claimed. Manager reconciles, genuinely executes mechanical helper against unchanged new HEAD, independently freezes new target and activates DISTINCT fresh independent audit. Do not merge Builder #147, original Auditor #238/#163 or activate TCW-035. TCW-060/047 external evidence RELEASE_HOLD, source #212/#162/#220 unmerged, F02 publisher/observer/validator attribution hold and F03 custody limitation remain OPEN; production trade value source EMPTY, live winner/split WITHHELD, FV-SEASON-01 pending, no staged/release/deploy/transaction action.

### F02-R3/R4 Next Activation

| Order | Employee / Role | Status | Current Task / Next action |
| ---: | --- | --- | --- |
| 1 | Manager / Architect | RECOMMEND TO MANAGER after exact-head FULL PASS | Independently review new code/tests/handoff/SHA/tree/diff/CI and historical custody; reconcile TCW-034 checkpoint/status in Manager-only protected lane; obtain genuine same-head original mechanical PASS, freeze NEW immutable target and commission DISTINCT fresh independent audit. |
| 2 | Implementation Engineer / Builder | COMPLETE after FULL PASS | Leave existing PR #147 DRAFT/OPEN/UNMERGED and new head unchanged. |
| 3 | In-Season Strategy & Decision Intelligence Analyst | WAIT | Preserve accepted TCW-032 scope. |
| 4 | Research & Development (R&D) | WAIT | No live package-value provider approval. |
| 5 | Independent Auditor / QA | WAIT | Original TCW-068 fourth and TCW-046 third FAILs remain immutable; fresh assignment only by Manager after freeze. |
| 6 | Troubleshooting & Root Cause Engineer — on-demand | IDLE | Manager only routes a separate reproducible blocker. |


### Initial F02-R3/R4 synthetic CI correction (transparent historical run)

The FIRST new intermediate repair head `b55919498bf9b3d5d43b24a8e20edb7d600237e0` ran genuine FULL PR CI `36022858024` / required test `107711874014` and FAILED 1/550 unit tests (549 passed): a new mixed-pool FULL-roster fixture expected CONDITIONAL while the existing per-slot status gave UNKNOWN precedence over a genuinely available conditional low route. F02-R4 targeted missing/malformed kickoff regression PASSED in that run. This final bounded refinement aligns per-slot conditional-vs-unknown priority with the existing replacementPathState conditional candidate selection while preserving direct/numeric withholding, and adds same-roster only-low CONDITIONAL / only-unknown UNKNOWN controls. Do not cite the failed intermediate as a final PASS or rewrite the historical frozen fourth FAIL. A separate NEW genuinely FULL exact-final-head CI remains required; publish its observed identifiers on the PR without a post-CI handoff-only commit.
