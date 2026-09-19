# TCW-045 — Trade Winner Engine Repaired-Target Independent Re-Audit Packet

Frozen by: Manager / Architect
Freeze date: 2026-09-19
Workflow: V3.2

## Immutable target and authority

Source task: TCW-034 — Trade Winner Engine
Builder PR: #147 (DRAFT / UNMERGED)
Builder branch: `builder/tcw-034-trade-winner-engine`
Immutable repaired target SHA: `24be4be45f7fde351c0a6e209353dd2beed8d854`
Historical failed target/remediation parent: `a40c8db8f7e6defcecdf58dc2d3ddd81ea88249a`
Authorized remediation diff baseline for this re-audit: `a40c8db8f7e6defcecdf58dc2d3ddd81ea88249a`
Original Builder PR/product diff baseline: `872aa79969743dafb3bf062a76b213c687397a6f`

The Auditor MUST verify `24be4be45f7fde351c0a6e209353dd2beed8d854` directly. Do not substitute current PR head, master or a later commit if any differs. Both historical failed target and repaired target remain immutable evidence.

## Mechanical readiness and fresh FULL validation

Builder ran the canonical task-specific readiness helper on the exact repaired head using canonical Manager state. Observed output:
- schema `TCW_AUDIT_READINESS_V1`
- task `TCW-034`
- branch `builder/tcw-034-trade-winner-engine`
- head `24be4be45f7fde351c0a6e209353dd2beed8d854`
- assignmentMasterSha `a40c8db8f7e6defcecdf58dc2d3ddd81ea88249a`
- PR `147`
- auditRequired `true`
- changedFiles (six authorized files listed below)
- blockers `[]`
- readyForManagerFreeze `true`
- packet sha256 `ae906987bfbad2bab022bd7d1afd24693b4fd047397ebe779dca101c82e7de4b`

Repaired FULL validation is on the SAME exact final head (including final Builder handoff):
- workflow #674 / run `35461527961`: SUCCESS
- test job `105946146678`: SUCCESS
- full unit/contract, dependency, model/static, browser smoke, accessibility, readiness, mobile, extension, performance, security, workflow/classifier gates: PASS
- no post-FULL handoff-only target substitution.

Manager control-plane reconciliation:
- PR #155 merged
- canonical readiness master `0476118169110c7fa10b5fda4c2b7d662fc0b3ad`
- master workflow #676 / run `35462452563`: SUCCESS
- test job `105948621656`: SUCCESS.

Green CI and audit-readiness are evidence, NOT an independent verdict.

## Exact bounded remediation diff

Compare historical failed target `a40c8db8f7e6defcecdf58dc2d3ddd81ea88249a` to repaired target `24be4be45f7fde351c0a6e209353dd2beed8d854`. Exactly six files:
- `.ai/builder/HANDOFF.md`
- `src/domain/trade-analyzer.js`
- `src/domain/trade-value-engine.js`
- `src/domain/trade-value-source.js`
- `test/trade-winner-engine.test.js`
- `test/trade-winner-integration.test.js`

For regression/context, inspect complete original authorized Builder diff from `872aa79969743dafb3bf062a76b213c687397a6f` to repaired target. No Manager/shared/auditor/provider/config/package changes are part of Builder commits.

## Prior independent audit and accepted findings

Historical audit: TCW-044 — CLOSED / FAIL — REMEDIATION REQUIRED.
Auditor report: `.ai/audit/TCW-044_TRADE_WINNER_ENGINE_AUDIT.md`
Manager finding decision: `.ai/manager/evidence/TRADE_WINNER_AUDIT_FINDING_DECISION.md`.

Review all four F01–F04 independently. Manager has inspected the repaired code for intended mechanisms but does NOT supply the Auditor's verdict.

### F01 — HIGH — material-depth evidence

Historical defect: listed position counts alone promoted a neutral RB/WR bench reshuffle to material gain/loss and could turn unknown contingency into WORSENS.

Independently verify:
- raw listed-position change stays descriptive and cannot alone change do-nothing verdict;
- unchanged lineup, legally supported contingency, and bye coverage on bench RB→bench WR yields NO_MATERIAL_CHANGE;
- unknown contingency + count loss cannot fabricate WORSENS;
- genuine supported contingency loss/gain still drives material cost/benefit;
- severe supported gaps, 2-for-1 and 1-for-2 semantics preserved;
- replacement-quality cost is not asserted from unsupported acquisition/slot data.

### F02 — MEDIUM — replacement/scarcity numeric authority

Historical defect: max projection over entire full structural pool was emitted as replacement numeric value with empty slot-demand metadata.

Independently verify:
- numeric replacement requires explicit affected configured legal slot demand, matching legal FLEX/OP placement, same source and horizon, finite projection, and known feasible acquisition/roster path;
- ineligible high-projection QB cannot displace lower eligible RB for RB need;
- no slot-eligible candidate => numeric null;
- slot-eligible but acquisition-infeasible => numeric null;
- unknown roster/drop feasibility or projections => numeric null;
- full structural candidate data can remain descriptive when metric is withheld;
- no VORP/scarcity double counting into package market value.

### F03 — MEDIUM — canonical horizon authority

Historical defect: caller playoff subset and `restOfSeasonComplete:true` could define falsely complete canonical windows.

Independently verify:
- configured league playoff weeks [15,16] remain canonical even when caller supplies [15]; missing week 16 must keep canonical playoff aggregate/direction UNKNOWN/null;
- caller-supplied one-week ROS + completeness flag cannot yield ROS READY;
- canonical complete validated ROS can yield READY;
- partial named future windows remain separate and do not masquerade as ROS/playoffs;
- absent authoritative remaining-season week definition fails closed, without replacing missing values with zero;
- avoid treating caller-mutated league state as verified authority without evidence.

### F04 — LOW — genuinely independent package-value sources

Historical defect: source row count alone promoted HIGH confidence.

Independently verify:
- one approved source => at most MODERATE;
- duplicate rows or derivative/non-independent sources => at most MODERATE;
- HIGH only for two or more explicitly trusted, Manager-authorized genuinely independent agreeing sources using comparable same claim/scale;
- source disagreement still WITHHELD;
- synthetic fixture controls cannot confer live provider authority.

## Preserved invariants (mandatory)

- Production `PRODUCTION_TRADE_VALUE_SOURCES` remains EMPTY.
- No FantasyPros/FantasyCalc/RedraftCalc/RotoTrade live provider, scraping, bundled value table or arbitrary numeric import authority.
- Live package value/winner/split remain WITHHELD with truthful explanation; supported roster impact remains independently usable.
- Inclusive 45–55 applies to approved synthetic package-relative asset shares only; it is not win/acceptance probability.
- No rank, projection, SOS, ADP, waiver, VORP, replacement, scarcity or generic ROS numeric field becomes additive package market value.
- ESPN remains read-only, `transactionActions: []`, no propose/send/accept/reject/veto.
- Ownership, legal drops, FLEX/OP, current-week locks, source separation, stale-state reset, browser/UI truthfulness, and fail-closed evidence behavior must not regress.
- `FV-SEASON-01` remains pending; no field registry mutation or invented real-league UAT.
- No TCW-035 or later Trade Analyzer feature activation.

## Independence / validation levels

This is a FRESH audit lane, not a continuation or rubber stamp of TCW-044. Treat Builder tests, Manager review, and green CI as assertions/evidence to independently challenge.

Required: Level 1 static review, Level 2 independent automated/CI checks, Level 3 controlled adversarial cases as feasible. Level 4 genuine field validation is NOT established by this task.

Auditor must inspect exact old→new diff, challenge implementation under adversarial fixtures not solely paraphrase Builder regressions, and report each accepted historical finding as CLOSED, STILL OPEN, or NEW RELATED FINDING with exact evidence.

## Scope / verdict

Auditor may write ONLY:
- `.ai/audit/TCW-045_TRADE_WINNER_ENGINE_REAUDIT.md`
- `.ai/auditor/TCW-045_HANDOFF.md`

No implementation, tests, scripts, config, provider, Strategy, R&D, shared/Manager/role changes. No merge authority.

Return exactly one verdict:
- PASS
- PASS WITH NON-BLOCKING FINDINGS
- FAIL — REMEDIATION REQUIRED

For each finding: severity, violated requirement, exact evidence, impact, remediation direction, required validation, confidence.

Open exactly one Auditor evidence PR with exact final-head CI. Do not merge Auditor PR or Builder PR #147; do not activate TCW-035. Return exact audit branch/head/PR/run/job, frozen-target check, levels, verdict and findings to Manager.
