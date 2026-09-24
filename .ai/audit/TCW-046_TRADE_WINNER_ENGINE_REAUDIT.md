# TCW-046 — Trade Winner Engine Third Repaired-Target Independent Re-Audit

Date: 2026-09-19
Role: Independent Auditor / QA, fresh task-specific independent review
Workflow: canonical V3.2; STANDARD_CHAT_HIGH; FAST_REFRESH
**INDEPENDENT VERDICT: FAIL — REMEDIATION REQUIRED**

## Exact authority and scope

- At startup, GitHub canonical master independently compared IDENTICAL to `86a7f95217e6152db397ada8039533a7f4722b3a`.
- Auditor branch `auditor/tcw-046-trade-winner-third-reaudit` independently compared IDENTICAL to its actual authorized creation baseline `7ca2953009d37a014e041cc24f4934bfe61b5cad`. This earlier branch baseline is not silently rewritten as current master.
- Builder PR #147 OPEN / DRAFT / UNMERGED at exact frozen target `035c5f5112b7393f9d4f17685792548afa67dd2e`, verified at startup and before evidence write. No target substitution.
- Exact frozen second-remediation parent: `24be4be45f7fde351c0a6e209353dd2beed8d854`. Previous historical failed target `a40c8db8f7e6defcecdf58dc2d3ddd81ea88249a`; original PR baseline `872aa79969743dafb3bf062a76b213c687397a6f`.
- Independent GitHub compare parent→target: ten forward commits, exactly FIVE authorized changed files: `.ai/builder/HANDOFF.md`, `src/domain/trade-analyzer.js`, `src/domain/trade-value-engine.js`, `test/trade-winner-engine.test.js`, `test/trade-winner-integration.test.js`. Inspected actual source patches, not merely changed-file names. Original baseline→target retains precisely the original nine-file TCW-034 code/test/UI/handoff scope; no provider, ESPN adapter, Manager/shared/audit, field registry, package, workflow or TCW-035 additions.
- Read frozen TCW-046 packet, task and role; accepted TCW-032 Strategy/source authority, TCW-033 Manager source decision, TCW-034 task, TCW-044/045 historical findings, and independent Manager second-audit decision. This review challenges code rather than adopting earlier Auditor/Builder/Manager conclusions.

## Independent validation and limits

**Level 1 — static and bounded diff: FAIL (new F02-related finding).** Directly reviewed repaired source: legal-roster tri-state, replacement-path and numeric propagation, positional demand, provenance ancestry and source confidence, separate package-value/do-nothing/horizon/read-only/UI gates. Findings are tied to the immutable target's own paths and line ranges below.

**Level 2 — automated and exact-target CI: SUPPORTING CI PASS, independent targeted code execution performed.** Independently queried GitHub Actions `#692 / 35477501875`: completed SUCCESS, exact `head_sha=035c5f5112b7393f9d4f17685792548afa67dd2e`; Builder test job `105989175098` is reported successful by frozen packet and is to be independently checked from live jobs. The exact-target FULL Builder CI is supporting evidence, not an Auditor verdict. Separately executed source-extracted repaired JavaScript functions with independently constructed adversarial vectors through connected tool JavaScript, including exact production `getLineupLockReason`. A fresh independent local full `npm`/browser test run was NOT performed in this STANDARD_CHAT_HIGH connector-only lane; do not describe Builder CI as a fresh Auditor-run suite.

**Level 3 — independent controlled synthetic adversaries: FAIL (locked-candidate counterexample).** Independently executed additional missing/partial/invalid roster-rule direct/conditional cases, positive legal-direct and legal-conditional cases, source-derivation adversaries and current-week lock-negative/positive comparison beyond Builder fixtures. Exact outputs recorded below.

**Level 4 — real authenticated ESPN field validation: NOT ESTABLISHED.** No live-league UAT, actual waiver availability/ESPN processing test, deployed verification or actual trade action; FV-SEASON-01 remains pending.

## F02-R1 — historical incomplete roster-rule path — CLOSED for the reported defect

Exact repaired `src/domain/trade-analyzer.js` lines 328–370: `verifiedAcquisitionRosterState` separately requires valid positive known size, explicitly supplied well-formed position-limit array and known player positions; known violations block; missing/incomplete evidence returns UNKNOWN. `hasKnownLegalAcquisitionPath` distinguishes KNOWN_LEGAL direct vs explicit-drop-conditional, UNKNOWN and KNOWN_BLOCKED. Lines 373–405 distinguish conditional/unknown replacement path from verified/blocked and no longer label unsupported UNKNOWN as DANGEROUS. Lines 584–650 require direct KNOWN_LEGAL, not a merely conditional drop, for `feasibleCandidateIds`, numeric replacement and material replacement-quality cost.

Independent execution of these exact repaired function bodies: missing rules, size-only rules, position-only rules and a malformed position rule each produced UNKNOWN acquisition path; numeric replacement null; feasible candidate IDs empty; replacement path UNKNOWN. Complete `size:3,positionLimits:[]` with direct space yielded KNOWN_LEGAL, projected RB replacement 8 and feasible RB ID. Complete `size:1,positionLimits:[]` with one existing unlocked RB yielded only a CONDITIONAL hypothetical drop and correctly withheld numeric replacement and feasible IDs. A known RB position cap led only to a conditional path, not an unconditional replacement. These establish closure of the *specific absent/partial-roster-rules* counterexample; see NEW RELATED finding below, which blocks broad acquisition-path correctness.

Limits: independently controlled functions, not an authenticated ESPN transaction or proof of all real league roster permissions. An explicit complete empty position-limit list follows existing test/provider semantics; this audit does not invent an omitted limit.

## F04-R1 — derivative and independent evidence provenance — CLOSED for the reported defect

Exact repaired `src/domain/trade-value-engine.js` lines 209–257 resolve explicit derivative ancestry to root source/group, detect duplicate IDs, missing ancestor, conflicting group declarations and cycles. Lines 273–297 require comparable units/same claim, fully verified provenance and >=2 separately approved independent groups for HIGH.

Independent execution of exact repaired source/value engine with synthetic authorized data:
- Two agreeing rows, explicit derivative `child-b.derivativeOf=root-a`, but contrasting declared groups A/B → MODERATE, one independent group A.
- Three-row cross-group derivative chain A→B→C → MODERATE; origin cycle → MODERATE; missing ancestor → MODERATE; same source ID duplicated under two group labels → MODERATE.
- Two genuinely independent approved same-scale roots A/B → HIGH positive control.
- Two independent roots plus a third contradictory derivative group → MODERATE, rather than silently counting the conflicting row.
- Different source verdicts → generic SOURCE_DISAGREEMENT, winner/confidence WITHHELD.
- Production provider set remains EMPTY; synthetic fixture authority is not live provider approval.

No evidence found that the historical falsely distinct *explicit derivative* can still manufacture HIGH. This does not certify actual independence of future externally approved sources without source-authority verification.

## F01 / F03 / preserved behavior — maintained within tested boundaries

F01: exact repaired `src/domain/trade-analyzer.js` lines 782–805 leave raw listed-position changes descriptive; material `depthCost/depthGain` are not raw counts. Independent execution of `deriveDoNothing`: neutral bench RB→WR with supported TOSSUP and verified neutral contingency → NO_MATERIAL_CHANGE/no costs; raw RB decrease with UNKNOWN contingency → WITHHELD/no fabricated WORSENS; supported dangerous gap → WORSENS. Material replacement-quality reasoning remains subject to new locked-candidate finding.

F03: lines 754–771 still derive canonical playoff weeks exclusively from `snapshot.league.playoffWeeks`, ROS from `snapshot.league.restOfSeasonWeeks`; no `options.playoffWeeks` / `options.restOfSeasonComplete` override remains; `evaluateHorizon` demands full projected pre/post union coverage. Reviewed Builder configured [15,16] vs caller [15] partial case, one-week caller ROS, and complete canonical ROS regressions. Real ESPN league-state provenance/field UAT is not independently established.

Source/market: independent execution of frozen `trade-value-source.js` and `trade-value-engine.js` gives production provider count 0 and live package status/winner WITHHELD with null split; 45 and 55 boundary synthetic shares FAIR_TRADE; missing asset WITHHELD; disagreeing source verdict WITHHELD. No projection/rank/SOS/ADP/VORP/waiver/replacement fallback is routed into market package value.

Other preserved code: exact `trade-analyzer.js` still checks uniquely owned assets and selected opposing partner, uses separate package-value and user-roster/do-nothing outputs, retains explicit trade follow-up drops and readOnly `transactionActions: []`; UI remains separate/unavailable-value truthful in original nine-file PR diff. No ESPN write or TCW-035 modifications. Full independent end-to-end regression/UAT is NOT claimed.

## NEW RELATED FINDING — TCW-046-F02-R2 — MEDIUM / BLOCKING

**Requirement:** A claimed current-week feasible numeric waiver replacement must be actionable in the supported current-week context, with the existing kickoff/player-lock boundary respected. A known locked player may remain a descriptive structural pool member, but must not be promoted to `KNOWN_LEGAL` current-week usable replacement merely because slot, general waiver-capacity and roster-size tests pass. The frozen packet specifically requires current-week lock preservation.

**Exact code:** `src/domain/trade-analyzer.js` lines 282–298 build the structural candidate pool from `snapshot.availablePlayers` without checking individual kickoff/lock. Lines 348–351 `hasKnownLegalAcquisitionPath` checks `verifiedAcquisitionRosterState` and immediately returns KNOWN_LEGAL for direct add; lines 354–356 check `getLineupLockReason` only for *existing hypothetical drop candidates*, never the *proposed acquired candidate*. Lines 373–382 then describe this acquisition as VERIFIED. Lines 593–602 permit it to supply material replacement-quality cost; lines 611–650 add its ID to feasible candidates and publish its current-week numeric projection. `getLineupLockReason` at `src/domain/lineup-optimizer.js` lines 4–8 is the existing lock/kickoff authority. The top-level current-week lock list (trade participants/drops) at `trade-analyzer.js` lines 744–751 excludes hypothetical waiver replacement candidates.

**Fresh independent adversarial reproduction:** Executed the immutable source's exact acquisition/replacement functions with exact `getLineupLockReason` and ordinary RB-only `canFillSlot` matching. Snapshot currentWeek=5, timestamp 2026-09-19T12:20Z, `now=2026-09-19T12:30Z`, complete `rosterRules={size:3,positionLimits:[]}`, one existing unlocked RB and one listed available projected RB (projection 8, gameTime 2026-09-19T11:00Z), acquisitionCapacity.status='available', explicit uncovered RB demand, same snapshot capture. Existing helper returned `The reported NFL kickoff time has passed.` But `hasKnownLegalAcquisitionPath` returned KNOWN_LEGAL/direct; `replacementScarcityContract` returned replacementProjectionOrNull=8 and feasibleCandidateIds=['lockedWaiver']; `replacementPathState` returned VERIFIED. An otherwise identical candidate with a future gameTime returned null lock reason and the same KNOWN_LEGAL/8/VERIFIED path (positive control). These test outputs are independent of Builder tests and establish that the existing lock evidence is ignored in current-week replacement path certification.

**Impact:** The user can see an unsupported executable-current-week numeric replacement / apparent roster-recovery claim for a candidate who cannot supply the intended current-week lineup coverage after kickoff. This may also influence material replacement-quality costs and fragility reasoning through the shared helper. This is distinct from historical F02-R1's missing roster-rule defect, which is closed.

**Remediation direction:** Require candidate-specific same-week lock/kickoff eligibility at the acquisition and numeric current-week replacement gates (or explicitly classify locked candidates as NOT CURRENT-WEEK USABLE / UNKNOWN if ESPN waiver processing eligibility is not proven). Keep locked candidates inspectable as structural future-context data; do not treat generic waiver-capacity 'available' as proof that a specific already-locked player's current-week points can be acquired. Apply the same conservative path state to numeric output, feasible IDs, supportedReplacementQualityCost and replacementPathState/fragility; preserve legitimate supported contingency/bye losses, direct vs conditional drops, and read-only behavior. Do not issue ESPN transactions or import a new provider.

**Required validation:** add locked flag and kickoff-before-now RB/FLEX/OP candidate regressions, with verified rules/slot/capacity/same capture and future-kickoff unlocked positive controls; assert feasible IDs empty, numeric null, no false VERIFIED recovery/material quality, and no invented blocked/DANGEROUS determination where actual ESPN acquisition status is unverified. Re-run FULL on exact repaired head; fresh independent audit.

**Confidence:** HIGH for the controlled exact-function counterexample and integrated static call path. Real ESPN transaction permissibility and deployed UAT remain untested; scope this as a current-week projection/feasibility claim, not an assertion about universal ESPN after-kickoff add/drop policy.

## Final gate

| Gate | Independent result |
| --- | --- |
| Immutable target / branch / diff scope | VERIFIED |
| Historical F02-R1 absent/partial-rule counterexamples | CLOSED (bounded) |
| Historical F04-R1 explicit derivative counterexamples | CLOSED (bounded) |
| F01 / F03 historical preservation | VERIFIED within source + synthetic level |
| Level 1 static and Level 3 independent controlled adversaries | **FAIL — TCW-046-F02-R2** |
| Level 2 frozen Builder FULL CI | SUCCESS at exact target; supporting, not correctness proof |
| Level 4 genuine ESPN/field | NOT CLAIMED — FV-SEASON-01 pending |
| Auditor evidence PR exact-final-head CI | VERIFY LIVE AFTER ONE EVIDENCE COMMIT / PR |

**Verdict: FAIL — REMEDIATION REQUIRED.** Manager must independently accept or reject F02-R2; if accepted, keep Builder PR #147 DRAFT / UNMERGED and route only bounded current-week locked-replacement remediation with fresh FULL final checkpoint, task readiness and fresh audit. Do not merge Auditor PR or activate TCW-035. TCW-047 automation is independent and neither changes nor validates this frozen product target.
