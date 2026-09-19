# TCW-045 — Trade Winner Engine Repaired-Target Independent Re-Audit

Date: 2026-09-19
Role: Independent Auditor / QA (fresh independent lane)
Workflow: V3.2; execution: STANDARD_CHAT_HIGH; refresh: FAST_REFRESH

## Immutable target and scope verification

- Canonical master independently compared identical to 02c45a1ae34551568677f724053bd0a1546154c6 at audit start and immediately before evidence write.
- Auditor branch auditor/tcw-045-trade-winner-repaired-reaudit was identical to that master before evidence write.
- Builder PR #147 was OPEN / DRAFT / UNMERGED, head exactly 24be4be45f7fde351c0a6e209353dd2beed8d854 at audit start and before evidence write.
- Frozen repaired audit target: 24be4be45f7fde351c0a6e209353dd2beed8d854. Historical failed target: a40c8db8f7e6defcecdf58dc2d3ddd81ea88249a. Original PR baseline: 872aa79969743dafb3bf062a76b213c687397a6f.
- Independently compared historical→repaired: nine forward commits, exactly six changed files: .ai/builder/HANDOFF.md, src/domain/trade-analyzer.js, src/domain/trade-value-engine.js, src/domain/trade-value-source.js, test/trade-winner-engine.test.js, test/trade-winner-integration.test.js.
- Independently compared original baseline→repaired: exactly nine original authorized product/test/handoff files (above plus scripts/smoke-trade-analyzer.js, src/ui/trade-analyzer.js, test/trade-analyzer-ui.test.js). No provider, ESPN adapter, workflow, field registry, package, or TCW-035 changes in Builder diff.
- Inspected GitHub's actual old→new file patches; read repaired production engine/source/analyzer, unit/integration test cases, trade UI, TCW-044 audit, accepted Manager F01–F04 decisions, and this task's frozen packet. Builder assertions and Manager conclusions did not determine the verdict.

## Independent methods and validation limits

Level 1: reviewed exact old→new patches and current source control/data paths, including F01–F04, identity/read-only/package-source separation and horizon composition.

Level 2: verified GitHub Actions run 35461527961 (#674) is completed SUCCESS on the exact frozen Builder SHA, test job 105946146678 SUCCESS; deployment/production jobs were skipped as expected for this PR. This is supporting Builder CI, NOT an independently executed full repository suite. Independently executed isolated functions extracted verbatim from frozen production source with controlled inputs in an isolated JavaScript runtime, as described below. The full repository npm suite/browser UAT was not independently rerun: local GitHub network resolution was unavailable. No claims of fresh independent full CI or independent browser execution are made.

Level 3: ran targeted new adversarial JavaScript cases against the actual extracted repaired functions (not only Builder test descriptions), including the two failing counterexamples detailed below. The isolated F02 test supplied the ordinary RB-only slot matcher while invoking the actual repaired roster-rule/acquisition-path/replacement-scarcity bodies; it is a controlled function-level counterexample, not a full integrated ESPN replay. Independent static code tracing establishes that the same unchecked status feeds the integrated replacement contract.

Level 4: genuine authenticated connected-ESPN field validation NOT ESTABLISHED. FV-SEASON-01 remains pending. No production integration, real trade, actual ESPN write, or real-league product-owner UAT was performed.

## F01 — material listed-position depth — CLOSED for historical raw-count defect

Exact repaired src/domain/trade-analyzer.js lines 732–755: listed position changes are retained as descriptive rows, while material depthCost/depthGain derive from supported contingency change or separate replacement-quality evidence, rather than listed counts. Lines 421–474: without material evidence, a fully supported flat scenario gives NO_MATERIAL_CHANGE, whereas raw count change plus UNKNOWN contingency yields WITHHELD, not WORSENS. Independent execution of the repaired deriveDoNothing function with (a) neutral bench RB→WR, supported TOSSUP current week and verified neutral contingency yielded NO_MATERIAL_CHANGE and no benefits/costs; (b) raw RB-count loss with UNKNOWN contingency yielded WITHHELD and no material costs; (c) explicit genuine depthCost yielded WORSENS; and (d) severe DANGEROUS gap yielded WORSENS. These complement, rather than merely adopt, Builder regressions.

Scope qualification: the separate replacement-quality evidence still inherits the unverified acquisition-path defect F02-R1 below; hence any depthCost derived from that path is not independently established. This is recorded as a related consequence of the still-open F02 finding, not a re-creation of the original raw-count bug. Preserved 2-for-1 / 1-for-2 / bye / severe-gap tests were reviewed but not independently replayed in a full integrated suite.

## F02 — replacement/scarcity numeric authority — STILL OPEN: TCW-045-F02-R1 (MEDIUM, BLOCKING)

Requirement: numeric replacement must require an eligible same-snapshot/current-week, projected, actually available candidate with a KNOWN LEGAL roster acquisition path. UNKNOWN roster/drop feasibility must yield null, and unsupported replacement quality cannot drive a material roster cost.

Exact evidence: src/domain/trade-analyzer.js lines 71–80 returns rosterRuleState.status='unverified' with an empty violations list whenever snapshot.league.rosterRules is absent. Lines 328–336 hasKnownLegalAcquisitionPath accepts a direct/add-or-drop path on the sole test !rosterRuleState(...).violations.length; it never requires status='verified'. Lines 560–605 replacementScarcityContract treats the candidate as feasible through that helper and can emit its numeric projection; lines 538–557 supportedReplacementQualityCost uses the same helper for a material cost. Thus an unknown roster rule is misclassified as known legal acquisition.

Independent controlled execution of the exact repaired rosterRuleState, hasKnownLegalAcquisitionPath and replacementScarcityContract bodies: snapshot.meta.capturedAt equals replacement.capturedAt; currentWeek=6; league.rosterRules absent; a supported uncovered RB demand; one projected RB in the current structural pool (projection 9), availability status 'available', and a one-RB post roster. Actual rosterRuleState status='unverified'; legal acquisition helper returned true; replacementProjectionOrNull returned 9. Required outcome: null until known legal roster constraints prove a valid path. This does not depend on the irrelevant high-projection QB case, which the repair otherwise fixes.

Impact: unsupported numeric replacement and potentially a false material depth-cost/do-nothing result, even though roster legality is unknown. Remediation: require verified *complete applicable* roster-size and position-limit knowledge before calling a proposed acquisition path legal; propagate UNKNOWN vs BLOCKED vs VERIFIED distinctly through feasibleCandidateIds, replacementProjectionOrNull, and replacementQualityCost. Add independent unknown/missing/partial-rule direct-add and drop-path regressions, plus known-legal positive and legally-blocked negative controls. Confirm current-week locks and explicit-drop restrictions are not bypassed. Confidence: HIGH in function-level reproduction and static integrated path; no live ESPN claim.

## F03 — canonical horizon authority — CLOSED for historical caller-option subset defect

Exact repaired src/domain/trade-analyzer.js lines 705–722: playoffs are taken from snapshot.league.playoffWeeks, not options.playoffWeeks; ROS is taken from snapshot.league.restOfSeasonWeeks, not options.restOfSeasonWeeks or options.restOfSeasonComplete. evaluateHorizon lines 225–243 requires every selected week to have complete pre/post projection coverage before READY and keeps missing totals/directions null/UNKNOWN. An explicitly named futureWeeks window is separately evaluated. The historical direct caller-option reduction path is removed. Code and Builder regressions for playoff [15,16] with caller [15], one-week caller ROS claiming completeness, canonical [6,7] and named partial future windows were independently inspected.

Boundary: this audit did not authenticate that arbitrary modified snapshot.league content is genuinely provider-authoritative; an array inserted by a caller must not gain authority solely by being placed under league. Source/provenance verification of real ESPN league-state construction remains an integration/field-validation requirement. This limitation does not reinstate the removed option-level override in the frozen code.

## F04 — genuinely independent confidence — STILL OPEN: TCW-045-F04-R1 (LOW; REMEDIATE WITH BLOCKING F02)

Requirement: a duplicate, derivative or shared-origin row cannot confer HIGH confidence even if row count >=2; two genuinely independent, explicitly approved agreeing groups on one comparable scale are required.

Exact evidence: src/domain/trade-value-source.js lines 125–133 retains provenance.derivativeOf. src/domain/trade-value-engine.js lines 223–235 computes distinct independenceGroup labels on approved rows but never checks derivativeOf or an origin relationship. Existing Builder test at test/trade-winner-engine.test.js lines 196–228 places derivative and origin in the *same* independenceGroup, so it does not challenge a falsely distinct group label.

Independent controlled execution of the exact repaired packageValueConfidence body: status READY, same units, two explicitly approved source rows with distinct groups 'group-a'/'group-b', and row B provenance.derivativeOf='origin-a' naming row A sourceId. Actual claimConfidence=HIGH, groups=['group-a','group-b']; required at most MODERATE because the source itself discloses dependence. A genuinely distinct pair without derivativeOf produced HIGH as a positive control.

Impact: overstates corroboration for a source-agnostic synthetic package claim; the production provider set is currently empty, so this is not evidence of an active live third-party provider. Remediation: resolve derivative ancestry/shared origin, reject contradictory independence claims, and count only genuinely independent approved root groups; add tests with intentionally different group labels, chains/cycles and an independent positive control. Disagreement must continue WITHHELD. Confidence: HIGH in the exact extracted function counterexample.

## Preserved authority / regression checks

- Production src/domain/trade-value-source.js line 1 fixes PRODUCTION_TRADE_VALUE_SOURCES to frozen []; independent execution of compiled frozen value-source/value-engine functions showed the default live package status/winner WITHHELD, null share and reason NO_APPROVED_COMPARABLE_VALUE_SOURCE.
- Independent source-engine scenarios: 45.00 and 55.00 incoming shares remained FAIR_TRADE; 44.00 classified THEY_WIN; disagreeing synthetic approved sources returned SOURCE_DISAGREEMENT with winner/confidence WITHHELD; incomplete mapped value returned WITHHELD rather than zero. Synthetic values are test-only, not authorization of a live source.
- src/domain/trade-analyzer.js lines 99–125 still validates a single opposing partner and current uniquely owned incoming/outgoing IDs; lines 635–653 use empty production sources by default. Lines 622–632 and 786–845 retain readOnly=true and transactionActions=[] on analyzed outputs, separate packageValue from doNothing and preserve explicit follow-up roster action before final analysis.
- UI src/ui/trade-analyzer.js lines 15–37 visibly distinguishes unavailable package value from YOUR ROSTER IMPACT and describes split as relative value, not probability. Original PR has no changed ESPN write code, field-validation registry or later Trade Analyzer feature.
- Existing full CI is successful supporting evidence only; test success does not close the two reproduced unsupported-evidence paths.

## Validation matrix and verdict

| Dimension | Outcome |
| --- | --- |
| Immutable frozen SHA, Builder PR/branch and bounded comparisons | VERIFIED |
| Level 1 exact-diff/static/adversarial review | FAIL — F02-R1 and F04-R1 |
| Level 2 supporting exact-target FULL Builder CI | PASS — #674 / 35461527961 / job 105946146678 (not independent full-suite execution) |
| Level 3 new controlled independent function-level adversaries | FAIL — two reproduced contract counterexamples; F01 neutral/unknown/severe controls pass |
| Level 4 genuine authenticated field validation | NOT CLAIMED — FV-SEASON-01 pending |
| Auditor evidence PR exact-head validation | TO BE VERIFIED FROM LIVE PR AFTER PUBLISHING |

**INDEPENDENT VERDICT: FAIL — REMEDIATION REQUIRED.**

F01 historical raw-count finding CLOSED; F02 STILL OPEN via TCW-045-F02-R1; F03 historical caller-shrink finding CLOSED within trusted league-state boundary; F04 STILL OPEN via TCW-045-F04-R1. Do not integrate Builder PR #147. Manager should independently accept/reject each new bounded finding and, if accepted, route only necessary remediation with a new exact FULL implementation checkpoint, immutable target, and fresh independent re-audit. Do not activate TCW-035. Auditor evidence PR and Builder PR must remain unmerged.
