# R&D Handoff — TCW-033 Trade Intelligence Data + ESPN Offer Research

Task ID: TCW-033  
Role: Research & Development  
Status: MANAGER_REVIEW_READY — research complete; PR/CI evidence to be verified at exact final head

## Verified starting state

- Repository: Ryan42062001/the-chip-winner
- Canonical master verified live at task start: 3c41a5caab555e7564ce3255947515415fba685e
- Assigned branch: rnd/tcw-033-trade-intelligence-data-research
- Branch was verified identical to canonical master before R&D writes.
- Authorized assignment master recorded by task: 6120dc027dfafc8db9240d70fb9e6c32a8cc2ebc
- Accepted deployed Trade Analyzer product target: 5362e2bff143a5aef050e160ccb0706a7060fb3d
- Accepted TCW-032 Strategy integration: 6120dc027dfafc8db9240d70fb9e6c32a8cc2ebc
- Field validation remains 10 passed / 1 pending.
- FV-SEASON-01 remains pending; TCW-033 did not alter field-validation state.

## Work completed

- Verified current repository FantasyPros ranking, manual projection, future projection, and generic projection-catalog semantics.
- Resolved the package-value source question to the required blocking taxonomy.
- Researched current FantasyPros, FantasyCalc, RedraftCalc, RotoTrade, KeepTradeCut, DynastyProcess/TradeBalancer source semantics, additivity, format conditioning, freshness, identity, operational access, and rights limitations.
- Bounded a future buy-low/sell-high evidence protocol without mixing market units with projected-point utility.
- Researched official ESPN pending-offer product behavior plus undocumented read-only pending-transaction evidence.
- Defined the minimum manual ESPN offer reconstruction fallback.
- Enumerated league-wide opportunity-matching inputs that are already available versus still missing.
- Created the complete research artifact at '.ai/rnd/TCW-033_TRADE_INTELLIGENCE_DATA_RESEARCH.md'.

## Blocking package-value source verdict

**MANAGER_DECISION_REQUIRED**

No source simultaneously cleared semantics, additivity, league conditioning, identity, freshness, stable documented access, and production rights without a Manager policy choice.

### Best bounded candidates

1. **FantasyPros weekly redraft Trade Value Chart — primary short-path candidate for manual/browser-local use only.**
   - Current redraft trade-value semantics.
   - Strong historical FantasyPros football precedent for additive package math.
   - Current chart has base, 2QB and TEP values.
   - No documented current trade-value API endpoint.
   - Current site/API terms materially constrain reuse/redistribution/competition.
   - Do not scrape or bundle data without authorization.

2. **FantasyCalc — strongest potential programmatic market candidate if current rights/API authority are confirmed.**
   - Market values derived from 1M+ real trades.
   - Redraft, league size, PPR and QB-format conditioning.
   - Community tooling indicates ESPN IDs and an undocumented values endpoint.
   - Stable official API contract and production-use rights remain unverified.

3. **RedraftCalc — strongest published semantic/additivity fit if licensed access is available.**
   - Provider explicitly says values mirror auction budgets and add like budgets.
   - Supports PPR family, 1QB/SF, TEP, and league sizes.
   - Proprietary; no verified API/ESPN-ID/rights contract.

R&D recommends Manager either approve a narrowly bounded manual/local FantasyPros source contract, seek explicit programmatic authority from FantasyCalc/RedraftCalc, or keep package winner/split withheld.

## Current rankings/projections boundary

Current TCW inputs **can** support:
- current/future roster utility;
- lineup impact;
- source-separated team needs/depth;
- connected-league replacement/VORP when explicitly derived;
- ROS/playoff context with existing completeness rules.

Current TCW inputs **cannot** by themselves support:
- additive market/package asset value;
- 57/43 relative package asset-value share;
- YOU WIN / FAIR TRADE / THEY WIN;
- offer-acceptance probability;
- buy-low/sell-high labels.

Ordinal FantasyPros rank, SOS stars, projected points, ECR-vs-ADP, and generic 'restOfSeasonValue' are not promoted to trade-value authority.

## Buy-low / sell-high verdict

**OPPORTUNITY_UNVERIFIED**

A future protocol is feasible only after:
- an approved market-value source with historical/current values exists;
- Strategy/Manager approve a market change window and threshold;
- complete forward roster-utility evidence meets confidence/coverage gates.

Recommended comparison is directional and source-separated:
- MARKET_DOWN_UTILITY_UP
- MARKET_UP_UTILITY_DOWN
- MARKET_AND_UTILITY_ALIGNED
- INSUFFICIENT_EVIDENCE

Do not subtract or ratio market-value units against projected points. Do not promise price convergence or future performance.

## ESPN offer-read classification

- ESPN pending-offer UI/state lifecycle: **OFFICIALLY SUPPORTED**.
- Undocumented 'mPendingTransactions' fantasy view: **OBSERVED BUT FRAGILE** in community evidence.
- Pending-trade item shape: **OBSERVED AND REPRODUCIBLE in community basketball evidence; INFERRED for current 2026 football**.
- Reliable automatic current-football ingestion in TCW: **UNKNOWN / NOT ESTABLISHED**.
- Current TCW companion support for pending offers: **VERIFIED ABSENT**.

### Manual fallback

Until current football read-only ingestion is field-proven:
- select received/sent offer;
- select counterparty ESPN team;
- select outgoing/incoming players from current ESPN rosters so stable ESPN IDs are used;
- optionally record ESPN-displayed expiry/review deadline;
- require user confirmation that the offer was observed pending now;
- record observation time;
- label as MANUAL ESPN OFFER RECONSTRUCTION;
- invalidate when roster ownership no longer matches;
- expose no accept/decline/propose/write action.

## League-wide matching prerequisites

Already substantially available:
- all returned ESPN teams and rosters;
- ESPN player/team IDs and ownership;
- supported lineup settings including FLEX/OP;
- roster/position limits;
- current/future projections with compatibility and identity gates;
- available-player replacement context;
- deterministic roster consequence logic.

Still missing/insufficient:
- Manager-approved package asset-value source;
- manager preferences/untouchables;
- any acceptance-probability authority;
- reviewed trade-deadline/review rule normalization for opportunity legality;
- guaranteed complete free-agent universe;
- current automatic pending-offer contract;
- cross-source freshness alignment for value/projection/ESPN states.

## Exact unresolved Manager decisions

1. Approve or reject FantasyPros weekly redraft values as a user-supplied manual/local-only source.
2. Decide whether the provider-defined current FantasyPros base scoring assumptions are sufficient or whether exact PPR-family source conditioning is mandatory.
3. Decide whether to pursue explicit FantasyCalc or RedraftCalc programmatic licensing/access.
4. Decide whether TCW-034 must remain wholly blocked until source approval, or whether source-agnostic fail-closed plumbing may be separately activated while value output remains disabled.
5. For later work, decide whether Strategy should formalize directional market-vs-utility divergence.
6. Decide whether a future field/research task should reproduce 'mPendingTransactions' against a real current ESPN football offer.

## TCW-034 readiness

**REMAINS BLOCKED.**

TCW-033 provides enough evidence for Manager to make the source-authority decision. R&D does not make that decision and does not activate Builder.

## Evidence produced

- '.ai/rnd/TCW-033_TRADE_INTELLIGENCE_DATA_RESEARCH.md'
- Current provider/official documentation and source terms linked inside the research artifact.
- Exact repository semantic inventory.
- Manual ESPN offer reconstruction contract.
- Value-source comparison and failure rules.

## Files updated

Authorized scope only:
- '.ai/rnd/TCW-033_TRADE_INTELLIGENCE_DATA_RESEARCH.md'
- '.ai/rnd/HANDOFF.md'

No production code, tests, scripts, config, workflow, Manager/Strategy state, package files, ESPN integration, or field-validation state changed.

## Blocking issues

- No R&D research blocker remains.
- Manager source approval remains the hard gate before generic TCW-034 package winner/split behavior may activate.

## Recommended next role

Manager / Architect.

## Exact next action

Manager reviews the TCW-033 PR and exact-head CI, then selects or rejects the package-value source path. Only Manager may activate TCW-034.

## Next Activation dashboard

| Order | Employee / Role | Status | Current gate | Next action |
| ---: | --- | --- | --- | --- |
| 1 | Manager / Architect | ACTIVATE AFTER R&D CI PASS | TCW-033 source authority | Review verdict, source rights/semantics, PR scope and exact-head CI; decide TCW-034 routing. |
| 2 | Implementation Engineer / Builder | WAIT | TCW-034 blocked | Do not implement until Manager explicitly activates. |
| 3 | In-Season Strategy & Decision Intelligence Analyst | IDLE | TCW-032 closed | Re-activate only if Manager requests a new threshold/divergence policy decision. |
| 4 | Research & Development | STOP AFTER HANDOFF | TCW-033 complete | No additional work unless Manager returns a bounded research question. |
| 5 | Independent Auditor / QA | IDLE | No TCW-034 frozen target | Await downstream implementation audit routing. |
| 6 | Troubleshooting & Root Cause Engineer — on-demand | IDLE | No reproduced blocker | Activate only on Manager routing. |

## Checkpoint / SHA

- Canonical master verified: 3c41a5caab555e7564ce3255947515415fba685e
- Research artifact commit: b1c33bf3f0280397c4cb0505a8687817260d4ea9
- Exact final R&D branch head: verify live after this handoff commit.
