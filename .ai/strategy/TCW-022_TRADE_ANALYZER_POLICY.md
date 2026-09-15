# TCW-022 — Trade Analyzer v1 Strategy Contract

Status: STRATEGY CONTRACT — MANAGER REVIEW CANDIDATE  
Role: In-Season Strategy & Decision Intelligence Analyst  
Task: `TCW-022`  
Canonical starting master: `3a4df7cf812ecdf409f6c59149aa79db169daadb`  
Branch: `strategy/tcw-022-trade-analyzer-policy`

## 1. Product question

Trade Analyzer v1 answers:

> **What happens to my fantasy team if I make this proposed trade, and why?**

It evaluates the connected user's roster before and after a user-entered hypothetical trade. It does **not** assign a universal trade-value score, predict whether the other manager will accept, or execute any ESPN action.

The primary unit of analysis is **team consequence**: legal starting-lineup strength, roster depth, replaceability, roster-space consequences, supported future/bye/playoff effects, and the quality/limits of the evidence behind those conclusions.

## 2. Evidence classification

### ESTABLISHED PROJECT POLICY

- ESPN owns connected-league roster state, lineup-slot configuration, normalized player positions/eligibility, current availability, known roster-size/position limits, bye facts when supplied, and playoff-week configuration when supplied.
- Current-week ESPN projections are the platform baseline; approved external projections remain source-separated.
- Missing projections/facts remain missing. They are not converted to zero or inferred.
- Compatible future weekly projections require identity, season, and scoring-family compatibility.
- Existing future/playoff calculations withhold aggregate conclusions when required player-week coverage is incomplete.
- FLEX eligibility is RB/WR/TE; OP eligibility is QB/RB/WR/TE where the normalized slot is supported. Ordinary FLEX remains protected product behavior. Custom OP/Superflex field certification is not claimed.
- Current player/lineup locks make affected current-week advice informational/non-actionable rather than an unqualified action recommendation.
- ESPN free-agent availability is authoritative only at the latest captured snapshot.
- The product is read-only.

### DATA-SUPPORTED CONCLUSION

The repository already provides enough bounded inputs to define Trade Analyzer v1 without a new external source:

- deterministic legal-lineup optimization;
- current ESPN player projections and availability;
- normalized roster-size and position limits where ESPN supplies them;
- roster-aware waiver/replacement context;
- deterministic bye coverage;
- compatible future weekly projections and complete-coverage gates;
- explicit playoff-week and source-separation behavior.

### STRATEGIC INFERENCE

A trade should be evaluated by the roster's **marginal consequence**, not by summing player projections or ranking positions. A nominally better player can be a poor team trade if the player remains on the bench, if the package destroys needed coverage, or if the roster cannot legally hold the incoming package without another action.

### HEURISTIC

The existing project's 1.0-point current-week lineup action threshold is reused only to distinguish a **material projected lineup change** from a projection-level tossup. It is not a probability or universal value threshold.

The existing 0.5-point waiver action threshold may be used only as an inspectable flag that an internal depth option is materially better than a currently available replacement in the same decision context. It must never be converted into a hidden trade score.

### EXPERIMENTAL IDEA

None is required for v1. Future market-value, opponent-acceptance, calibrated playoff-probability, or news-adjusted trade models require separate approval and evidence.

## 3. Definitions

### 3.1 Proposal

A `TradeProposal` consists of:

- `outgoingPlayerIds`: one or more players currently on the connected user's ESPN roster;
- `incomingPlayerIds`: one or more distinct players present in the connected ESPN snapshot and not already on the user's roster;
- optional `plannedFollowUpDropIds`: explicit user-selected players to remove **only when** the incoming package would otherwise violate a known roster-size/position constraint;
- `teamObjective`: one of `BALANCED`, `CURRENT_WEEK_STABILITY`, or `FUTURE_UPSIDE`.

`BALANCED` is the default. The analyzer must not infer a subjective team objective from standings, record, or roster strength.

A player may not appear on both sides. Duplicate identities invalidate the proposal.

### 3.2 Pre-trade roster

The latest connected user's ESPN roster before the hypothetical trade.

### 3.3 Direct post-trade roster

The pre-trade roster with all outgoing players removed and all incoming players added as active, unassigned/bench candidates. Incoming players do **not** inherit the other team's lineup slot and are never silently placed into IR.

### 3.4 Resolved post-trade roster

A direct post-trade roster that satisfies all known ESPN roster-size and position-limit facts, either immediately or after the user's explicit `plannedFollowUpDropIds` are applied.

If a required follow-up drop is not specified, the analyzer may describe the package and provisional consequences but **must not label the expanded roster or its lineup as a final legal post-trade roster**.

### 3.5 Best legal lineup

The maximum projected complete starting lineup using supported configured ESPN starter slots, normalized position eligibility, and the relevant projection source for the evaluated horizon.

For a current-week actionable view, known ESPN/player locks and passed kickoff facts remain constraints. For future weekly projection windows, current kickoff-derived locks are not projected into future weeks.

### 3.6 Projection source

A named forecast source evaluated independently. Examples already approved by the project include ESPN current-week projections and a compatible mapped external weekly projection set.

Sources are never silently averaged.

### 3.7 Replacement context

The latest explicitly ESPN-available player pool, filtered through known identity, position/slot eligibility, current-week projection availability, and known roster rules. Replacement context is a **conditional follow-up action**, not part of the trade itself.

### 3.8 Complete horizon coverage

For a source and week, every active non-IR player who exists in either the pre-trade or resolved post-trade roster must have a uniquely mapped usable projection under the same compatible source. A numeric pre/post team delta is withheld if coverage is incomplete.

This conservative union-roster requirement prevents a missing bench projection from making one roster appear artificially stronger simply because an alternative legal starter could not be evaluated.

## 4. Analysis state versus conclusion

Trade Analyzer separates **analysis state** from **strategic conclusion**.

### Analysis states

- `READY` — a resolved post-trade roster exists and enough supported evidence exists for the stated conclusion.
- `PARTIAL_EVIDENCE` — structural conclusions are valid, but one or more projection/time-horizon conclusions are withheld.
- `ROSTER_ACTION_REQUIRED` — the direct post-trade roster violates a known roster-size or position limit and the required follow-up removal(s) have not been explicitly resolved.
- `INVALID_PROPOSAL` — proposal identities or roster membership are invalid/ambiguous.
- `INSUFFICIENT_EVIDENCE` — evidence is too incomplete or conflicting to responsibly answer the material trade question.

`ROSTER_ACTION_REQUIRED` is not equivalent to "bad trade." It means the final team consequence is not yet defined.

## 5. Deterministic evaluation order

The Builder must evaluate in this order so later reasoning never hides an earlier invalid/unknown state.

### Step 1 — Validate identities and connected-team membership

1. Verify connected user's roster exists.
2. Require at least one outgoing and one incoming player.
3. Require every outgoing player to be on the user's current roster.
4. Require every incoming player to exist in the current connected ESPN snapshot and not already be on the user's roster.
5. Reject duplicate IDs and a player appearing on both sides.
6. Preserve latest snapshot timestamp/source metadata.

If identity is ambiguous or missing, return `INVALID_PROPOSAL`; do not fuzzy-invent an identity.

### Step 2 — Build the direct post-trade roster

- Remove outgoing entries.
- Add incoming players as active bench/unassigned candidates.
- Preserve remaining IR entries as they are.
- Never auto-move an incoming player to IR merely because the player appears IR-eligible.

Record:

`netRosterCount = incomingCount - outgoingCount`

and, when ESPN roster size is known:

`postActiveCount = count(non-IR direct post-trade entries)`

`rosterSpaceDelta = rosterSizeLimit - postActiveCount`

Interpretation:

- positive = that many ordinary active roster spots are open;
- zero = active roster is full;
- negative = `abs(rosterSpaceDelta)` active-roster removals are required before a final legal roster can be represented.

Position-limit violations are reported separately even when total roster count is legal.

### Step 3 — Resolve known roster constraints

Use existing ESPN-reported roster size and position limits when available.

If the direct post-trade roster violates a known rule:

- set `analysisState = ROSTER_ACTION_REQUIRED`;
- name the violated rule and minimum count of required follow-up removals where determinable;
- do not silently choose a drop;
- do not report a provisional expanded-roster lineup as the final legal post-trade lineup.

If the user explicitly supplies follow-up drop IDs, apply them and re-run the same rules. Only a resolved roster may proceed as a legal post-trade roster.

If ESPN roster rules are unavailable, the analyzer may continue with `PARTIAL_EVIDENCE`, but it must say roster-processing legality could not be verified.

Trade deadline, veto, pending-trade processing, opponent consent, undroppable lists, and other ESPN trade-processing rules are **not inferred**.

### Step 4 — Determine current-week actionability

For every player whose presence/absence changes the current-week starting decision, inspect the existing lock semantics:

- explicit ESPN/player lock; or
- reported kickoff already passed.

If a lock affects realization of the proposed current-week change, current-week numbers may be shown as a clearly labeled counterfactual roster view, but the analyzer must not tell the user the change is currently actionable.

The analyzer does not claim whether ESPN itself would process a trade involving a locked player; that platform transaction question is outside v1.

### Step 5 — Evaluate current-week best legal lineups by source

For each approved compatible current-week projection source independently:

1. Require complete projection coverage for the active union of pre and resolved post rosters.
2. Optimize the pre-trade best legal lineup.
3. Optimize the post-trade best legal lineup.
4. Compare assignments and projected totals.

For source `s`:

`CurrentWeekLineupDelta[s] = PostBestLegalLineupTotal[s] - PreBestLegalLineupTotal[s]`

Round displayed source projections/deltas consistently with existing product behavior; do not imply win probability.

Materiality classification:

- `UPGRADE` when delta >= +1.0 projected point;
- `DOWNGRADE` when delta <= -1.0 projected point;
- `TOSSUP` when absolute delta < 1.0;
- `UNKNOWN` when complete source coverage is unavailable.

The 1.0 threshold is an inspectable project heuristic, not mathematical certainty.

### Step 6 — Explain starter versus bench consequence

Compare optimized assignment sets, not package totals.

Expose at minimum:

- incoming players who become starters/FLEX;
- outgoing players who leave the optimized starting lineup;
- existing roster players promoted into or displaced from the lineup;
- incoming players who remain bench depth;
- the supported lineup delta.

**Invariant:** a higher-projected incoming player who does not change the best legal starting lineup has **zero immediate starter benefit** from that source. Its value may still exist as depth, bye coverage, or future utility.

### Step 7 — Evaluate depth and fragility

Depth has two lenses; neither is a hidden score.

#### A. Listed-position depth

For each NFL position, report pre/post active non-IR roster counts and known projected-player counts. This is descriptive and must retain the existing limitation that FLEX/OP eligibility crosses listed positions.

#### B. Legal contingency coverage

For each optimized starter, test the roster with that starter removed and compute the maximum number of configured starter slots that the remaining active roster can legally fill using the same slot-eligibility matching principles as bye coverage.

Expose:

`uncoveredAfterLoss = configuredStarterSlotCount - maximumFillableStarterSlots`

A post-trade increase in `uncoveredAfterLoss` is a concrete loss of internal resilience.

When ESPN availability exists, identify the best explicit available candidate(s) that can restore the newly uncovered slot configuration, if any, and show their current-week projection separately.

Do not assume the user will make that acquisition. Respect known acquisition exhaustion and roster-space consequences where available.

#### Positional fragility labels

- `COVERED` — current internal roster can lose the tested starter and still fill all configured starter slots.
- `THIN` — at least one optimized starter has no complete internal contingency lineup.
- `SCARCE_THIN` — the trade newly creates `THIN`, and the internal cover lost in the trade was materially above the best currently known ESPN replacement context (0.5+ current-week projected point using the existing waiver action threshold), or replacement quality is unavailable.
- `DANGEROUS` — the post-trade roster creates a **known supported-horizon lineup gap** (for example a verified upcoming bye) and the latest ESPN pool supplies no verified eligible replacement path under known constraints, or known acquisition/roster constraints block that path.

`DANGEROUS` is intentionally narrow. Ordinary one-backup depth loss should be described as a depth cost, not automatically declared unacceptable.

### Step 8 — Evaluate roster-space opportunity or pressure

#### Consolidation: more outgoing than incoming

If the trade creates an open active roster slot:

- report the open slot count;
- show current ESPN replacement/free-agent context when available;
- keep any hypothetical follow-up add **separate** from `CurrentWeekLineupDelta`;
- label a replacement-assisted result as conditional on an additional acquisition.

A 2-for-1 is not analyzed as though the best free agent is automatically included in the trade.

#### Diversification: more incoming than outgoing

If the roster has sufficient open space, proceed normally.

If it does not:

- return `ROSTER_ACTION_REQUIRED` until the user specifies the needed follow-up drop(s);
- do not choose the lowest projected bench player automatically;
- do not call the expanded roster's optimizer result a legal post-trade outcome.

This prevents a 1-for-2 from hiding the real cost of the player that must ultimately be removed.

### Step 9 — Evaluate known bye effects

Build pre/post bye coverage using explicit bye weeks only.

For each supported week:

`ByeGapDelta[week] = PostUncoveredStarterSlots[week] - PreUncoveredStarterSlots[week]`

- negative = bye coverage improves;
- zero = no change in uncovered starter capacity;
- positive = bye coverage worsens.

Unknown bye weeks remain unknown. If any materially affected player has unknown bye data, the analyzer may report known-week facts but must label the overall bye comparison partial.

### Step 10 — Evaluate future/multiweek impact only with compatible complete coverage

A future projection source may contribute only after its existing compatibility gate passes for season and scoring family and identities are uniquely mapped.

For each selected week `w` and source `s`:

`WeeklyDelta[s,w] = PostBestLegalLineupTotal[s,w] - PreBestLegalLineupTotal[s,w]`

Only if **every selected week** has complete pre/post union-roster coverage may the analyzer expose:

`HorizonDelta[s] = sum(WeeklyDelta[s,w])`

If any selected week is incomplete:

- preserve complete week rows if useful;
- set aggregate horizon delta to unavailable;
- do not sum partial weeks;
- do not substitute missing values with zero;
- do not call the partial window "rest of season."

The label `REST_OF_SEASON` is allowed only when the application has an explicit supported definition of all remaining evaluated fantasy weeks and the selected projection source covers that whole window completely. Otherwise label the output `SELECTED_FUTURE_WINDOW` and name its weeks.

### Step 11 — Evaluate playoff-window effects only when the window is real and complete

Playoff analysis requires:

1. explicit configured playoff weeks from ESPN or the product's existing explicit local fallback; and
2. complete compatible weekly projection coverage for every configured playoff week for both pre and post union rosters.

Then:

`PlayoffWindowDelta[s] = sum(PostBestLegalLineupTotal[s,w] - PreBestLegalLineupTotal[s,w])`

across the configured playoff weeks.

If any playoff week is incomplete, the aggregate and any "playoff upgrade" conclusion are withheld.

FantasyPros `SOS PLAYOFFS` stars remain an independent provider-defined advisory lens. They are not assumed to map exactly to the ESPN league's playoff weeks and are never converted into projected points or combined with the weekly projection delta.

### Step 12 — Detect projection-source disagreement

Evaluate each compatible complete source independently.

For a given horizon, classify each source as `UPGRADE`, `DOWNGRADE`, `TOSSUP`, or `UNKNOWN` using the applicable supported delta and the 1.0 current-week materiality threshold for current-week analysis. For a multiweek horizon, report the actual source-specific aggregate; do not invent a universal cross-horizon threshold.

Current-week **material source disagreement** exists when:

- at least one complete source says `UPGRADE` and another says `DOWNGRADE`; or
- at least one complete source says a material change (`UPGRADE`/`DOWNGRADE`) while another complete source says `TOSSUP`.

When material disagreement exists:

- expose each source result side by side;
- set evidence state `SOURCE_DISAGREEMENT`;
- do not average the projections;
- do not produce an unqualified source-agnostic lineup winner;
- phrase the conclusion as source-sensitive unless a separate structural fact (for example illegal roster state or dangerous bye gap) independently dominates.

### Step 13 — Assign evidence state

Use inspectable evidence states, not a numeric confidence score:

- `COMPLETE_MULTI_SOURCE_AGREEMENT` — two or more compatible complete sources support the same material direction for the evaluated horizon.
- `COMPLETE_SINGLE_SOURCE` — one compatible complete source supports the numeric conclusion and no other complete source is available.
- `SOURCE_DISAGREEMENT` — compatible complete sources materially conflict.
- `PARTIAL_COVERAGE` — at least one relevant source/horizon is incomplete, so some conclusions are withheld.
- `STRUCTURAL_ONLY` — only roster/slot/depth/bye facts are responsible for the conclusion; no complete numeric projection comparison exists.

These labels describe evidence, not certainty that fantasy outcomes will occur.

### Step 14 — Apply team-objective framing without changing facts

`teamObjective` never changes projection totals, roster rules, depth facts, source agreement, or missing-data gates. It changes only the strategic interpretation of a real tradeoff.

- `CURRENT_WEEK_STABILITY` favors avoiding current-week downgrade, unresolved roster action, and dangerous thinness. It may prefer useful depth over a small consolidation edge.
- `BALANCED` gives current-week lineup, supported future horizon, and depth costs equal narrative attention without numeric weighting.
- `FUTURE_UPSIDE` may prefer a supported future/playoff improvement despite a current-week cost, but only when the future window is complete enough to support that claim.

A deep team can rationally consolidate when the incoming player materially improves the optimized lineup and the post-trade roster retains acceptable contingency coverage or clear ESPN replacement options.

A fragile/injury-hit team can rationally prefer diversification when added depth materially improves contingency/bye coverage even if the best current lineup is nearly unchanged.

The analyzer must state that this is strategic framing, not source fact.

### Step 15 — Choose conclusion taxonomy

Choose the first defensible primary conclusion below after the earlier legality/evidence gates. Attach separate reason/modifier fields for bye relief, roster-space, source disagreement, lock state, and replacement context.

#### `CLEAR_TEAM_UPGRADE`

Supported current or complete future lineup improves materially and there is no material newly created depth/fragility cost. Reason text must say whether the benefit is starter-only or starter-plus-depth.

#### `STARTER_UPGRADE_DEPTH_COST`

The optimized starting lineup improves materially, but internal contingency coverage or meaningful depth worsens. The result is not automatically a rejection; objective framing and replacement context explain the tradeoff.

#### `DEPTH_GAIN_STARTERS_FLAT`

Current best legal lineup is a tossup/no material improvement, while the resolved roster gains useful legal contingency/bye depth.

#### `SHORT_TERM_GAIN_LONG_TERM_COST`

Current-week supported impact improves materially while a complete compatible future window worsens materially or creates a supported future coverage problem.

#### `LONG_TERM_GAIN_SHORT_TERM_COST`

Current-week supported impact worsens materially while a complete compatible future/playoff window improves and the future claim meets all coverage gates.

#### `DANGEROUS_POSITIONAL_FRAGILITY`

The trade creates `DANGEROUS` fragility as defined above. Explain the exact position/slot/week and replacement-path limitation; do not merely say "too thin."

#### `BALANCED_OBJECTIVE_DEPENDENT`

Supported benefits and costs are real but do not yield a dominant team consequence without the user's stated objective, including meaningful source-sensitive tradeoffs that are not otherwise blocked.

#### `NO_MEANINGFUL_SUPPORTED_CHANGE`

All complete supported lineup deltas are below material thresholds and no meaningful depth, bye, roster-space, or future effect is supported.

#### `INSUFFICIENT_EVIDENCE`

The material reason to prefer or reject the trade depends on unavailable/incomplete future data, unresolved source disagreement with no independent structural answer, or other missing inputs that prevent a responsible recommendation.

## 6. Missing-data policy

Missing data can narrow the answer; it cannot be fabricated.

### Current-week projections

If any active player in the pre/post union roster lacks a required source projection:

- the source-specific numeric team delta is withheld from the decision conclusion;
- a clearly labeled `best-known` display is optional but must never be described as a complete pre/post comparison;
- structural roster-space/depth facts may still be reported.

### ESPN availability

If `availablePlayers` is missing:

- direct trade analysis may still proceed;
- replacement context becomes `unavailable`;
- do not call the waiver pool strong, weak, deep, or scarce.

### Roster rules

If ESPN roster size/position limits are missing:

- count package imbalance;
- mark legality consequences unverified;
- do not claim the post-trade roster satisfies ESPN transaction rules.

### Bye weeks

Unknown bye remains unknown. Never treat it as "no bye conflict."

### Future projections

A partial future week may be displayed as a partial row but cannot contribute to a summed horizon conclusion.

### Playoff weeks

No inferred playoff window. No playoff conclusion without explicit configured weeks and complete compatible future coverage.

### Injury/news

Use only currently approved connected injury facts already present in the snapshot. No new injury/news facts are invented or fetched for v1.

## 7. Source-disagreement policy

1. Preserve each source's exact identity and capture/freshness metadata.
2. Apply roster/lineup optimization separately per source.
3. Never average incompatible sources.
4. Never convert ranking position, SOS stars, and projected points into one mixed numeric score.
5. If two complete sources disagree materially, present the disagreement as a first-class result.
6. A complete ESPN projection result remains the platform baseline; an external compatible source is an independent forecast, not a silent override.
7. If an external source is stale under its existing provider rules, show the staleness warning and do not increase confidence because two sources numerically agree.
8. FantasyPros ROS ordinal rankings may be shown as player-level context when available, but v1 must not sum ranks or convert them into team projected points.

## 8. Roster-space and replacement invariants

- A 2-for-1 can create an open spot; it does not automatically include a free agent.
- A 1-for-2 can create roster pressure; it does not automatically drop the user's weakest projected bench player.
- Any required follow-up drop must be explicit before the final post-trade roster is called legal.
- Any replacement/free-agent add is a separate conditional action and must name its ESPN availability snapshot.
- Acquisition-limit exhaustion or uncertainty remains visible.
- Incoming players are never silently moved to IR.
- Position limits and total active-roster size remain separate checks.
- No opponent-side strategic value is modeled beyond the user-entered package identities and connected-league facts needed to define the user's roster change.

## 9. Concrete acceptance scenarios

All projections below are synthetic test values. They define expected behavior, not claims about real NFL players.

### Scenario A — 1-for-1 clear starter upgrade

League: 10-team PPR, ordinary FLEX.  
Proposal: send WR-A; receive WR-B.  
Pre best legal lineup: 118.0 ESPN projected points.  
Post best legal lineup: 122.0.  
Coverage: complete. No new depth gap. No roster-rule issue.  

Expected:

- `CurrentWeekLineupDelta[ESPN] = +4.0`;
- WR-B appears in optimized starters/FLEX;
- `analysisState = READY`;
- conclusion `CLEAR_TEAM_UPGRADE`;
- explanation identifies the actual displaced starter and says the benefit is a lineup upgrade, not package-score arithmetic.

Wrong behavior: simply comparing WR-B's projection to WR-A without re-optimizing the full legal lineup.

### Scenario B — 2-for-1 consolidation improves starters but weakens depth

Proposal: send RB-Bench and WR-Starter; receive elite WR-X.  
Known roster size is full pre-trade. Direct post roster creates one open active spot.  
Pre best lineup: 121.0. Post direct-trade best lineup: 124.0.  
The trade removes the only internal contingency player for an RB/FLEX coverage path, but no known bye gap is immediate.  

Expected:

- current lineup delta `+3.0`;
- open roster slots = 1;
- conclusion `STARTER_UPGRADE_DEPTH_COST`;
- the lost contingency is named;
- top ESPN-available replacement context may be shown separately as a possible follow-up acquisition;
- that free agent is **not** included in the +3.0 trade delta.

Wrong behavior: treating the trade as "elite WR + best free agent for two players" without labeling the second transaction as conditional.

### Scenario C — 1-for-2 diversification with roster pressure

Known active roster is full.  
Proposal: send one WR; receive an RB and WR.  
No follow-up drop supplied.  

Expected:

- direct post active roster exceeds known size by 1;
- `analysisState = ROSTER_ACTION_REQUIRED`;
- analyzer says one additional active-roster removal is required;
- no final legal post-trade lineup total or final primary trade endorsement is emitted;
- provisional package facts may be shown only as provisional;
- analyzer asks for/accepts an explicit follow-up drop and re-runs from Step 3.

If the roster had one verified open active spot before the trade, no removal would be required and the normal comparison would proceed.

Wrong behavior: silently dropping the lowest projected bench player.

### Scenario D — little current-week change, meaningful bye relief

Proposal yields current-week delta `+0.2` (TOSSUP).  
All affected bye weeks are explicitly known.  
Pre-trade Week 9 bye coverage has one uncovered starter slot; post-trade Week 9 has zero uncovered slots.  

Expected:

- current week is not called a meaningful upgrade;
- `ByeGapDelta[9] = -1`;
- bye relief is a first-class reason;
- conclusion is `BALANCED_OBJECTIVE_DEPENDENT` unless depth analysis independently supports `DEPTH_GAIN_STARTERS_FLAT`;
- wording distinguishes deterministic bye coverage from projected points.

Wrong behavior: saying the trade "adds X ROS points" without a complete future projection window.

### Scenario E — favorable playoff window with complete data

Current-week delta: `-2.0`.  
Explicit playoff weeks: 15, 16, 17.  
Compatible external weekly source has complete pre/post union-roster coverage for all three weeks.  
Pre playoff totals: 120, 118, 123.  
Post playoff totals: 124, 122, 127.  

Expected:

- `PlayoffWindowDelta = +12.0` for that named source;
- current-week cost remains visible;
- conclusion `LONG_TERM_GAIN_SHORT_TERM_COST` under `BALANCED` or `FUTURE_UPSIDE` framing;
- no win/championship probability is claimed;
- any FantasyPros playoff SOS stars remain separate advisory context.

### Scenario F — same playoff thesis with incomplete future data

Same proposal, but Week 16 coverage is incomplete for one pre/post union-roster player.

Expected:

- Week 15 and 17 rows may be shown as complete rows;
- playoff aggregate is unavailable;
- no `+12` or extrapolated playoff total;
- no "playoff upgrade" conclusion;
- because the pro-trade case depends on missing playoff data while current week is -2.0, primary conclusion becomes `INSUFFICIENT_EVIDENCE` for the long-term thesis, with the current-week downside still stated.

Wrong behavior: sum Weeks 15 and 17 and treat Week 16 as zero or average-fill it.

### Scenario G — approved projection sources materially disagree

ESPN complete current-week analysis: `+3.0` (UPGRADE).  
Compatible external weekly source: `-2.0` (DOWNGRADE).  

Expected:

- evidence state `SOURCE_DISAGREEMENT`;
- both source results shown independently;
- no average such as `+0.5` used as truth;
- no unqualified "accept"/"reject" based on current-week projections;
- if no separate structural factor resolves the decision, conclusion `INSUFFICIENT_EVIDENCE` or `BALANCED_OBJECTIVE_DEPENDENT` with explicit source sensitivity.

### Scenario H — nominally better incoming player stays on bench

Outgoing bench WR projection: 9.0. Incoming WR projection: 11.0.  
Existing optimized starters are all projected above 11.0 and no FLEX assignment changes.  
Pre/post best legal lineup totals are identical.

Expected:

- immediate lineup delta `0.0`;
- incoming player identified as bench depth;
- analyzer does **not** call this an immediate starting-lineup upgrade;
- conclusion depends on supported depth/bye/future effects, otherwise `NO_MEANINGFUL_SUPPORTED_CHANGE`.

Wrong behavior: `+2.0 trade value` because 11 - 9 = 2.

### Scenario I — dangerous positional thinness relative to ESPN pool

Before trade, the roster has a starting TE plus an internal TE/FLEX cover.  
Trade sends the cover as part of a package and leaves no internal legal contingency for the TE starter.  
The starter has an explicitly known upcoming bye that creates one uncovered starter slot post-trade.  
Latest ESPN availability contains no verified eligible projected replacement path (or a known acquisition/roster constraint blocks all such paths).  
Pre-trade bye coverage did not have that gap.

Expected:

- post-trade fragility = `DANGEROUS`;
- exact TE/slot/week gap and replacement limitation are shown;
- conclusion `DANGEROUS_POSITIONAL_FRAGILITY` even if another position receives a modest upgrade;
- no invented waiver candidate is supplied.

If ESPN availability is merely missing, do not claim the pool is barren; label replacement context unavailable and downgrade evidence accordingly.

### Scenario J — strong-team consolidation with a real replacement cushion

Trade creates a material starter upgrade and one open roster spot. Post-trade contingency is thinner but latest ESPN pool contains multiple explicitly available eligible projected replacements, and acquisition capacity is not known to be exhausted.

Expected:

- direct trade conclusion can remain `STARTER_UPGRADE_DEPTH_COST`;
- under `FUTURE_UPSIDE` or `BALANCED`, narrative may say consolidation is strategically defensible for a deep roster;
- replacement candidates are conditional follow-up options, not part of the trade package or score.

## 10. Builder-facing output contract

Exact implementation shape is Builder-owned, but production behavior must expose equivalent inspectable fields:

- `analysisState`;
- proposal sides and user-selected `teamObjective`;
- snapshot/source timestamp/freshness context;
- known roster-rule status;
- `rosterSpaceDelta`, open-slot count, required-drop count, position-limit findings;
- pre/post optimized starter assignments by source/horizon when complete;
- source-specific projected totals and deltas;
- starter/bench assignment changes;
- listed-position depth changes;
- legal contingency/fragility findings;
- ESPN replacement context and acquisition limitation when available;
- bye coverage changes;
- future/playoff window status and complete/incomplete weeks;
- source-agreement/evidence state;
- one primary conclusion taxonomy value;
- ordered human-readable reasons and limitations;
- explicit `readOnly: true` / no transaction execution path.

No field named or presented as a universal `tradeScore`, `winScore`, `winnerPercent`, `acceptProbability`, or equivalent hidden composite is permitted in v1.

## 11. Builder-facing acceptance criteria

Builder implementation is acceptable only if deterministic tests demonstrate all of the following:

1. A valid 1-for-1 trade compares pre/post **optimized legal lineups**, not player projection sums.
2. A nominally higher projected bench acquisition produces no immediate starter gain when optimized lineup assignments do not change.
3. A 2-for-1 reports the created roster slot and keeps any free-agent follow-up value separate from direct trade impact.
4. A 1-for-2 on a full known roster returns `ROSTER_ACTION_REQUIRED` until explicit follow-up drop(s) resolve known roster limits.
5. A 1-for-2 with verified pre-existing space can proceed without fabricating a drop.
6. Known ESPN roster-size and position limits are enforced; missing rules are labeled unverified rather than inferred.
7. Incoming players are not auto-placed into IR.
8. FLEX/OP slot eligibility uses existing supported normalized rules; unsupported/unknown slot semantics fail closed.
9. Current-week lock/kickoff facts prevent an unqualified actionable current-week recommendation when the proposed realization is locked.
10. Numeric current-week source deltas require complete active pre/post union-roster coverage; incomplete source coverage cannot silently become zero.
11. Projection sources remain separate and material disagreement produces `SOURCE_DISAGREEMENT` without averaging.
12. Future weekly deltas are computed independently per source using legal lineups.
13. Multiweek aggregate is withheld if any selected week lacks complete baseline or post-trade coverage.
14. `REST_OF_SEASON` wording is used only for a genuinely complete defined remaining-season window; partial windows name their actual weeks.
15. Playoff aggregate requires explicit playoff weeks plus complete compatible coverage for every configured playoff week.
16. FantasyPros SOS stars remain separate from projected-point calculations and are not assumed to match the exact ESPN playoff window.
17. Bye analysis preserves unknown bye facts as unknown and compares uncovered legal starter capacity pre/post.
18. Fragility analysis can distinguish ordinary depth loss from the narrow `DANGEROUS` condition.
19. ESPN free-agent replacement context is conditional, snapshot-attributed, and never treated as automatically acquired.
20. Missing ESPN availability never becomes a claim that the free-agent pool is weak/empty.
21. Team objective changes narrative preference only; it cannot alter source facts, projection totals, legality, or coverage gates.
22. Every required Manager scenario A-I above has a deterministic fixture/test with the expected state/conclusion behavior.
23. Analyzer remains read-only and contains no ESPN propose/send/accept/reject transaction action.
24. No hidden composite trade-value score exists.

## 12. Strategic invariants

- **Team consequence beats package arithmetic.** Player totals are not the team answer.
- **Legal lineup impact is marginal.** A bench-only improvement is not a starter upgrade.
- **Unequal-count trades must expose the missing second transaction.** No silent drop or add.
- **Depth matters without rigidly forbidding consolidation.** Elite starter upgrades can rationally justify manageable depth loss.
- **Scarcity is connected-league context.** ESPN availability can mitigate or amplify depth risk; missing availability cannot be guessed.
- **Current and future horizons stay distinct.** Short-term and long-term tradeoffs are allowed to disagree.
- **Future claims require complete compatible data.** Partial weeks never become a complete horizon.
- **Bye/playoff facts remain source-bounded.** No inferred playoff window or fabricated bye.
- **Sources stay inspectable.** Disagreement lowers the strength of wording; it is not averaged away.
- **Objective framing is subjective and explicit.** It never mutates the underlying evidence.
- **Read-only means read-only.** The analyzer explains a hypothetical; it never executes it.

## 13. Risks and tradeoffs

### Conservative completeness may withhold some intuitively obvious trades

Requiring complete union-roster projection coverage is stricter than a best-known lineup display. This is intentional: trade comparisons are especially vulnerable to asymmetric missing data. Structural conclusions may still be useful when numeric deltas are withheld.

### Depth is multi-dimensional

Raw position counts are easy to understand but can misrepresent FLEX/OP coverage. The contract therefore requires both listed-position counts and legal contingency matching rather than one synthetic depth score.

### Replacement context is volatile

The ESPN free-agent pool can change immediately after refresh. Replacement notes must carry source freshness and remain conditional.

### Objective-dependent conclusions cannot be made universally "correct"

A contending/deep roster may rationally consolidate while an unstable roster prefers diversification. The product should expose the tradeoff and let an explicit objective guide wording rather than hiding subjective weights in a score.

## 14. Explicit unresolved R&D questions

### Blocking R&D dependencies for v1

**None.** Current approved repository inputs are sufficient to define and implement the bounded v1 consequence analyzer described here.

### Non-blocking future R&D questions

These must remain outside TCW-022/Trade Analyzer v1 unless Manager separately approves them:

1. Which ESPN settings/endpoints, if any, can reliably prove trade deadlines, review/veto windows, transaction processing around locked players, undroppable lists, or other platform-level trade acceptance rules? Until verified, v1 must not claim ESPN will accept/process a proposal.
2. What licensed source/model could support opponent acceptance probability or league trade-market value? v1 makes no such prediction.
3. What calibrated distribution/model could translate a trade into playoff/championship probability? Point estimates are insufficient; v1 does not expose probabilities.
4. What approved injury/news source could materially update trade value beyond the existing connected facts? v1 adds no news ingestion.

## 15. Explicit v1 out of scope

- production implementation or UI design in this Strategy task;
- proposing, sending, accepting, rejecting, vetoing, or executing ESPN trades;
- guaranteeing ESPN transaction-processing legality;
- opponent-manager preference/acceptance modeling;
- opponent-side team optimization beyond identifying the user-entered incoming package from connected facts;
- trade-market popularity or survival estimates;
- new injury/news ingestion;
- automatic web scraping or new third-party source integration;
- a dynasty/keeper valuation system;
- draft-pick valuation;
- FAAB/waiver claim-outcome prediction;
- calibrated playoff/championship probability;
- hidden player-value, trade-value, confidence, or winner composite scores;
- converting ordinal ROS rankings or SOS stars into synthetic projected points;
- silently filling missing projections, bye weeks, playoff weeks, or roster rules.

## 16. Strategy disposition

`MANAGER_REVIEW_READY` once this Strategy-only branch/PR passes exact-head CI.

No production implementation is authorized by this artifact alone. Manager must review/accept the contract and create/route a separate Builder task before production code changes.