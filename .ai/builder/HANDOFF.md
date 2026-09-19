# Builder Handoff — TCW-034 Bounded Audit Remediation

STATUS: FINAL REPAIRED CANDIDATE — FRESH FULL CI REQUIRED ON THIS EXACT HEAD  
TASK: TCW-034 — Trade Winner Engine  
ROLE: Implementation Engineer / Builder  
EXECUTION: STANDARD_CHAT_HIGH  
REFRESH: BOUNDED_REMEDIATION_REFRESH  
BRANCH: `builder/tcw-034-trade-winner-engine`  
PR: #147 — MUST REMAIN DRAFT / UNMERGED  
FAILED FROZEN TARGET / REMEDIATION PARENT: `a40c8db8f7e6defcecdf58dc2d3ddd81ea88249a`  
CURRENT CANONICAL MASTER OBSERVED DURING REMEDIATION: `4672d9d12cd844c97d258e664040ed683c0ccb90`  
CANONICAL ADVANCEMENT CLASSIFICATION: CONTROL_PLANE_ONLY — NOT MERGED INTO BUILDER BRANCH  
MERGE AUTHORITY: Manager / Architect only

## Accepted audit findings consumed

Manager decision: `.ai/manager/evidence/TRADE_WINNER_AUDIT_FINDING_DECISION.md`  
Independent audit evidence: `.ai/audit/TCW-044_TRADE_WINNER_ENGINE_AUDIT.md`  
Auditor PR #151 head `b30732e8f170885c309389f44657bddb3923c8b8`, workflow #659 / run `35458714753`, test job `105938554753` — PASS.

Only accepted TCW-044-F01 through F04 and directly necessary regressions are remediated.

## F01 — listed-position counts are descriptive only

Repaired:
- raw listed RB/WR/etc. count changes remain in `depth.listedPositionChanges`;
- `listedPositionChangesAreDescriptive: true`;
- raw count deltas no longer set `depthCost` / `depthGain`;
- material depth cost/gain comes from verified legal contingency change only in the depth flags;
- supported bye-gap change remains independent material evidence in the do-nothing decision;
- UNKNOWN contingency plus raw count change cannot become WORSENS/IMPROVES/MIXED solely from the count;
- when raw counts change and contingency is UNKNOWN with no other supported material effect, user decision is WITHHELD.

Regressions:
- bench RB -> bench WR with unchanged optimized lineup/contingency/bye => NO_MATERIAL_CHANGE;
- raw RB -1 / WR +1 stays descriptive;
- UNKNOWN contingency + count loss => not WORSENS, WITHHELD;
- genuine contingency loss => material cost / WORSENS;
- genuine contingency gain => material benefit / IMPROVES;
- existing 2-for-1 / 1-for-2 / dangerous-gap paths remain covered.

## F02 — replacement numeric tied to supported legal demand

Repaired `replacementScarcity`:
- derives explicit demand from supported post-trade legal contingency gaps and supported worsened bye-gap slot candidates;
- uses actual configured slot labels with `canFillSlot`, preserving ordinary FLEX and OP semantics;
- retains the full structural ESPN pool separately from presentation candidates;
- publishes `eligibleSlots` and structured `positionalAndFLEXOPDemand`;
- numeric replacement projection requires:
  - explicit affected configured-slot demand;
  - slot eligibility;
  - same captured snapshot/current-week source basis;
  - acquisition capacity status `available`;
  - a known legal roster acquisition path;
  - finite candidate projection;
- otherwise `replacementProjectionOrNull = null`;
- `marginalVorpOrNull` remains null and no replacement metric enters package market value.

Regressions:
- high-projection ineligible QB vs lower eligible RB selects the RB;
- no slot-eligible candidate => null;
- FLEX demand;
- OP demand;
- exhausted acquisition => null;
- eligible candidate with missing projection => null.

## F03 — canonical horizon completeness is authoritative

Repaired:
- canonical playoffs always derive from `snapshot.league.playoffWeeks`;
- caller `playoffWeeks` cannot shrink the canonical playoff set;
- missing any configured playoff week keeps playoff aggregate/mean/direction UNKNOWN/null;
- explicit `futureWeeks` remain a named partial future window and may be evaluated independently without relabeling playoffs;
- canonical ROS derives only from authoritative league-state `snapshot.league.restOfSeasonWeeks`;
- caller `restOfSeasonComplete: true` and caller `restOfSeasonWeeks` cannot create or shrink canonical ROS;
- no authoritative complete remaining-season week definition => ROS UNKNOWN;
- full authoritative ROS week set + complete mapped coverage => READY.

Regressions cover configured playoffs [15,16] with caller [15], missing canonical playoff coverage, fake one-week caller ROS, complete authoritative ROS, and a named partial future window.

`FV-SEASON-01` remains untouched and pending.

## F04 — confidence requires genuine source independence

Repaired source contract:
- trusted authority may carry `independentEvidenceApproved`;
- provenance carries `independenceGroup` and optional `derivativeOf`;
- value readiness does not become approval merely because provenance exists;
- package confidence is HIGH only when at least two explicitly Manager-authorized independent evidence groups agree on the same unit/scale;
- one source => MODERATE;
- duplicate same-source/shared-origin rows => MODERATE;
- derivative/shared-origin rows => MODERATE;
- a second row without explicit independent-evidence approval does not raise confidence;
- package source disagreement remains generic WITHHELD regardless of independence metadata.

## Preserved authority and product boundaries

- `PRODUCTION_TRADE_VALUE_SOURCES = Object.freeze([])`;
- no live FantasyPros/FantasyCalc/RedraftCalc/RotoTrade source;
- no third-party scrape/bundle/manual numeric authority;
- live package winner/split remains WITHHELD;
- no rank/projection/SOS/ADP/VORP/waiver/replacement/scarcity fallback into package market value;
- package-value absence does not suppress supported roster consequence;
- ESPN remains read-only;
- `transactionActions: []`;
- ownership/counterparty/stale-state/explicit-drop/roster legality/source separation/FLEX/OP safeguards preserved;
- `config/field-validation.json` unchanged;
- no TCW-035 or later Trade Analyzer work.

## Development validation before immutable candidate commit

Development checkpoint `58a2057ebf34d3060f7ac6a9dd9a807ba45eb7fc`:
- workflow #671 / run `35461141626`;
- test job `105945109724`;
- FULL;
- 518 / 518 Node tests PASS, 0 fail;
- F01-F04 remediation regressions PASS;
- Trade Analyzer browser smoke PASS;
- accessibility/readiness/mobile/extension/performance/security and CI guardrails PASS;
- evidence artifact `tcw-ci-evidence-35461141626-1` / ID `10589834028`.

This development run is not the Manager freeze target.

## Immutable repaired candidate rule

The exact commit containing this handoff also contains the final F04 disagreement-confidence regression so its PR synchronization is non-documentation and must classify FULL.

No Builder commit may be added after this candidate is created. The Manager must take the exact PR head produced by this commit and its fresh FULL CI as the proposed repaired checkpoint.

Task-specific `workflow:audit-readiness -- --task TCW-034` is intentionally NOT run yet. Per Manager routing, Manager first records this exact repaired SHA as `worker_checkpoint_sha` and transitions TCW-034 to `MANAGER_REVIEW_READY` without changing Builder HEAD; only then should audit-readiness run against this unchanged head.

## Remediation changed files relative to failed target

- `.ai/builder/HANDOFF.md`
- `src/domain/trade-analyzer.js`
- `src/domain/trade-value-engine.js`
- `src/domain/trade-value-source.js`
- `test/trade-analyzer.test.js`
- `test/trade-winner-engine.test.js`
- `test/trade-winner-integration.test.js`

No Manager/shared/audit/strategy/R&D/provider/workflow/package/extension/field-validation file is changed on the Builder branch.

## Next Activation

| Order | Employee / Role | Status | Current Task / Gate | Copy/paste activation prompt / next action |
| ---: | --- | --- | --- | --- |
| 1 | Manager / Architect | RECOMMEND TO MANAGER | Record exact repaired FULL head and readiness state | After exact-head FULL PASS, record that exact SHA as TCW-034 worker_checkpoint_sha and transition to MANAGER_REVIEW_READY without changing Builder HEAD; then run task-specific audit-readiness and, if PASS, freeze that same SHA for fresh independent re-audit. |
| 2 | Implementation Engineer / Builder | COMPLETE AFTER EXACT-HEAD FULL PASS | TCW-034 bounded F01-F04 remediation | Do not add another commit, merge, or activate TCW-035. Return exact FULL repaired head to Manager. |
| 3 | In-Season Strategy & Decision Intelligence Analyst | WAIT | No new policy question | No activation. |
| 4 | Research & Development (R&D) | WAIT | No new provider authority | No activation. |
| 5 | Independent Auditor / QA | WAIT | Fresh re-audit only after Manager freeze | Do not audit until Manager freezes the exact repaired FULL head. |
| 6 | Troubleshooting & Root Cause Engineer — on-demand | IDLE | No unresolved convergence blocker | No activation. |
