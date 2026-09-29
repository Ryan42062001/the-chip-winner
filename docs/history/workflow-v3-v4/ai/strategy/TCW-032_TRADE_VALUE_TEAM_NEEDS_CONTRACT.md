# TCW-032 — Trade Value + Team Needs Strategy Contract

Status: STRATEGY CANDIDATE — MANAGER ACCEPTANCE REQUIRED
Role: In-Season Strategy & Decision Intelligence Analyst
Workflow: V3.2 / STANDARD_CHAT_HIGH / FAST_REFRESH
Canonical starting master and branch parent: edcf670e64acfacb6148fdea231f81f2bbb609a7
Task-authorized baseline: c729753fe26a7eb074d29ffeef98d4bf591d2351
Accepted repaired/deployed product target: 5362e2bff143a5aef050e160ccb0706a7060fb3d

## 1. Authority, definitions, and epistemic boundaries

This is the **policy** for a proposed, hypothetical, read-only, single-opponent in-season player trade. It supersedes TCW-022's *blanket prohibition* on explicitly displaying a winner/relative-value result; it does **not** supersede TCW-022's identity, eligibility, roster-legality, completeness, source-separation, current/future lock, depth, bye, playoff, or read-only gates. TCW-022's earlier no-opponent-value assumption is replaced only where the opponent's roster and a complete comparable source actually support opponent analysis. The previous TCW-022 team-consequence taxonomy remains an independent diagnostic, never a substitute for this contract's trade-value result.

Project state: TCW-031/042/043 are CLOSED, the repaired baseline is accepted/deployed with product-owner UAT ACCEPT and independent TCW-043 PASS/no findings. It is an existing evaluate-a-trade workflow, **not** a completed V2 scoring engine. Real FV-SEASON-01 playoff/bye field evidence remains pending (10 passed / 1 pending); this document neither supplies nor claims it.

**Source facts** are named, time-stamped ESPN league/team/roster/ownership/lineup/roster-limit/availability/bye facts and individually identified projection or approved value-provider data. **Derived strategy** is the deterministic calculation, eligibility matching, proposed-roster counterfactual, heuristic threshold, need diagnosis, or explanation based on those facts. Do not promote strategic inference to provider fact. Player news/injury, market prices, calibrated predictions, trade-processing permissions, opponent intentions, and playoff-week evidence cannot be invented.

Three orthogonal questions must always have separate outputs:

1. **Package/asset fairness and winner:** which side receives more *comparable abstract asset value* on a named, approved valuation basis? Package labels YOU WIN, FAIR TRADE, THEY WIN (or WITHHELD) answer this question **only**. They are not projected win probabilities or a team-specific endorsement.
2. **User-team consequence vs DO NOTHING:** does the user's *resolved legal roster* improve its optimized starters, contingent depth, and supported horizon coverage relative to its actual pre-trade roster? The separate decision state is IMPROVES, WORSENS, MIXED, NO_MATERIAL_CHANGE, or WITHHELD. A package winner must never silently override a worse roster outcome.
3. **Two-manager plausibility:** can each manager receive a supported roster or value rationale? This is neither package fairness nor likelihood of acceptance. The opponent's private preferences, negotiation demands, and future actions remain UNKNOWN.

If the UI can display only one prominent headline, display the **package winner with the qualifier "package value" adjacent**, plus a separate equally visible user-roster impact and recommendation; NEVER call YOU WIN an unconditional "you should do it." In incomplete cases display WITHHELD, not a forced FAIR TRADE. The market/value comparison cannot be calculated from an arbitrary sum of ESPN one-week projections, rankings, strength-of-schedule stars, or fantasy-playoff probability.

Definitions: incoming = players received by user; outgoing = players sent by user; partner = selected uniquely identified opponent team; direct roster = outgoing removed/incoming added as active unassigned players; resolved roster = legal direct roster after any *explicit* required user-selected follow-up drops; do-nothing = pre-trade same snapshot, source, horizon, and roster rules; a hypothetical waiver addition is **not** in the direct/resolved trade roster. The user's configured teamObjective is BALANCED (default), CURRENT_WEEK_STABILITY, or FUTURE_UPSIDE. It may affect narrative/action framing, never facts, value inputs, scoring, or missing-data gates.

## 2. Deterministic evaluation order and fail-closed precedence

Evaluate sequentially. Return an explicit gate object and null derived numeric fields for every blocked branch.

1. **Snapshot / identities.** Require fresh-enough existing source under its *documented* freshness policy; connected user's roster, uniquely owned outgoing members, distinct incoming members all uniquely owned by *one selected opposing team's* current roster, unique IDs on either side, and existing player identity/position. Invalid, self-team, free-agent, mixed-opponent, duplicate, missing, or ambiguously owned packages -> INVALID_PROPOSAL and winner WITHHELD. Never infer ESPN pending-offer access.
2. **Direct roster and constraints.** Form the user and opponent reciprocal hypotheticals; preserve existing IR and do not auto-IR incoming players. Validate known total/position limits for both rosters independently. If user's direct roster needs an explicit drop and none valid is provided -> ROSTER_ACTION_REQUIRED, final team-benefit WITHHELD, no finalized lineup/endorsement. Opponent-side illegal or unresolved space -> plausibility UNRESOLVED; do not invent an opponent drop. Unknown league constraints -> LEGALITY_UNVERIFIED, no assertion of a legal executable trade. ESPN deadline, consent, veto, processing, pending-offer rules remain unverified even when these structural checks pass.
3. **Preferences.** Attach outgoing player's DO_NOT_TRADE/PREFER_TO_KEEP/ACTIVELY_SHOP flags before any generator filtering; manually entered packages remain analyzable as clearly hypothetical. No missing preference means an inferred preference.
4. **Source admissibility.** Validate every value/provider source separately for approved scope, valuation units, league scoring/season eligibility, exact player mapping, coverage of *all incoming and outgoing assets*, timestamps and documented freshness. A complete trade-value result requires one approved common comparable nonnegative *asset-value* scale across every asset, with positive total package value. Rank ordinals, projections for different weeks, SOS stars, and incomparable providers may not be added or used to fill a missing player. Until TCW-033 establishes an accepted source/calibration and Manager authorizes it, package value and winner remain WITHHELD (section 3). Never block structural/lineup analysis solely because value is withheld.
5. **Lineup, depth, and replacement.** On each source/horizon separately, compute legal pre/post optimized user lineups, assignment changes, internal contingency, roster space, known bye gaps, and structurally available external replacements. Evaluate opponent's reciprocal resolved roster only where the same identity/legality/coverage gates pass; do not borrow user's pre/post delta for the opponent.
6. **Team needs.** Diagnose both managers' pre and resolved post rosters from actual configured slot eligibility and supported opportunities; mark partial/unknown evidence explicitly. Compute the user's do-nothing comparison and named supported benefits/costs, including potential major fragility veto.
7. **Horizons.** Evaluate current week; a specifically named complete future window; ROS only if the full explicitly defined remaining season is covered; playoffs only on explicit supported configured weeks and complete coverage. No cross-source or cross-horizon numeric aggregation. Retain known current-week locks as informational/counterfactual, not executable claims.
8. **Independent outcomes.** Determine package fairness/winner from eligible value source(s); separately determine team decision and plausibility by sections 3/5/7/9. Source conflict, unsupported opponent roster, incomplete horizon, preferences, and risk cannot be silently erased by a favorable package split.
9. **Explanation and action.** Populate ordered evidence-linked reasons: (a) validity/required roster action, (b) package split and basis or why withheld, (c) user do-nothing starter consequence, (d) depth/fragility and roster space, (e) separate supported current/ROS/playoff directions and conflicts, (f) opponent's supported reason or unknown, (g) preference, provenance, confidence, limitations. Recommendation wording only within supported horizon. No unconditional recommendation under MIXED/WORSENS/UNKNOWN or unresolved legal action.

Tie-breaking: stable source IDs/asset IDs sorted lexicographically for output; lineup optimization follows the accepted legal optimizer's deterministic matching/ties; need priority tie order is largest supported starter deficit, largest uncovered contingency count, smallest legal bench cover, then configured slot ID and player ID. Unknown is never treated as zero; absent opposing evidence is not evidence against the opposing manager.

## 3. Abstract package value, fairness band, and winner — precise semantics

### 3.1 Admissible value scale

A source must furnish a documented additive *trade-asset unit* or an explicitly validated, league/scoring-aware conversion to such units; source identity, version, valuation date/season, scoring/format compatibility, and each asset's mapped value are mandatory. An ordinal rank, a player's weekly projected points, or VORP by itself is **not** a verified market-equivalent unit. The valuation model must explicitly state whether a listed player's marginal value already embeds positional scarcity/replacement; never add a second hidden scarcity multiplier. If the source is not genuinely additive across uneven packages, withhold an aggregate package score and route this exact gap to TCW-033/Manager. All players must share one source/version/scale per result. ESPN current-week projections remain a separate on-field evidence lens, not market valuation.

For a single admissible source s, with finite nonnegative asset values v_s(p):

  incomingValue = sum(v_s(p) for all incoming players)
  outgoingValue = sum(v_s(p) for all outgoing players)
  totalValue = incomingValue + outgoingValue
  incomingShare = 100 * incomingValue / totalValue
  outgoingShare = 100 - incomingShare

If any component is unmapped, stale by approved rule, incompatible, nonfinite/negative, nonadditive, or totalValue <= 0, both shares and the winner are WITHHELD; a missing value is not zero. Package values describe the *assets* only, not the user team's optimized lineups, a replacement pickup, the opponent's acceptance, or the league's probability of a future outcome.

### 3.2 Winner and fairness

**Provisional explicit project heuristic awaiting Manager acceptance:** fairness is inclusive 45.0%–55.0% incoming share, equivalently ratio 45/55 through 55/45. This is a presentation/decision band, **not a statistical confidence interval or proof of market fairness**. Choose exactly:
- incomingShare > 55.0 -> YOU WIN **package value**;
- 45.0 <= incomingShare <= 55.0 -> FAIR TRADE **package value**;
- incomingShare < 45.0 -> THEY WIN **package value**;
- valuation gates fail or materially incompatible approved value sources disagree over the classification -> WITHHELD.

Use unrounded source-unit totals and unrounded share for classification. Display split as *nearest integer percentages summing to 100* (e.g. 57/43 received/sent), but display "near fairness boundary" if rounding appears to cross a boundary; the label follows unrounded figures. Display source, as-of and explicit "relative package asset value, not % chance to win/accept." For zero-valued side with positive other side the result is 100/0 or 0/100, not infinity; zero/zero is WITHHELD. Precisely 55.0 and 45.0 are FAIR. If a source reports only coarse categorical bands rather than comparable units, the 57/43 split and three-way winner are WITHHELD.

For multiple independently approved compatible *value* sources, publish per-source result; if all eligible sources agree on the same three-way label, a generic winner may use the **designated primary approved source's** split, explicitly attributed and never averaged. If any eligible source produces a different label, generic winner WITHHELD with SOURCE_DISAGREEMENT and source-specific labels/splits retained. Do not choose a favorable source. Comparable common-source value is required on all assets on both sides, including 2-for-1/1-for-2.

**This document does not assert such a source exists in the current app.** Until independently established by TCW-033 and separately accepted by Manager, Builder must output WITHHELD with reason NO_APPROVED_COMPARABLE_VALUE_SOURCE; it may not simulate a 57/43 number. This is a conditional dependency for a truthful production winner, not permission to replace it with a guess.

### 3.3 Non-equivalences and precedence

A FAIR TRADE can WORSEN the user's roster; a package YOU WIN can create a dangerous gap; a package THEY WIN can be a strategically defensible *user* upgrade. Never reverse the package label to match a roster narrative, and never call a fair deal "worth doing" merely because it is fair. Neither evidence confidence nor plausibility adjusts the value share, shifts the fairness boundary, or turns it into a probability.

## 4. Do nothing, optimized lineup, and user decision

The default alternative is **NO TRADE**, not a fictitious replacement-assisted transaction. For each eligible horizon and projection source calculate pre/post on the same snapshot:

  StarterDelta_current[s] = BestLegalLineup(resolved user roster, s, current week) - BestLegalLineup(pre roster, s, current week)
  WeeklyDelta[s,w] = PostBestLegalLineup[s,w] - PreBestLegalLineup[s,w]
  WindowMeanWeeklyDelta[s,H] = sum(WeeklyDelta[s,w] for w in H) / count(H)

Require compatible complete pre/post *active union-roster* projection coverage, eligible slots, and a complete legal optimizer result. Withhold numeric delta on missing bench projection, an invalid slot, an unresolved drop, or missing eligibility. Current-week locks remain constraints; if proposed changing starters have already kicked off/are explicitly locked, label projected view COUNTERFACTUAL_NON_ACTIONABLE and do not present it as an actionable this-week gain. Future windows ignore today's kickoff locks as in TCW-022. Before display rounding, direction is UPGRADE for delta >= +1.0 pts/week, DOWNGRADE for <= -1.0, TOSSUP for absolute delta < 1.0, UNKNOWN otherwise. The 1.0 threshold is the accepted lineup heuristic, *not* a package-value threshold.

Compare the **entire** optimized assignment, including displaced/promoted incumbent starters and newly starting/bench incoming players. An incoming name remaining on the bench has zero realized current starter gain when the optimized total is unchanged, irrespective of its abstract value. Use legal FLEX (RB/WR/TE) and OP (QB/RB/WR/TE) matching simultaneously rather than assigning each listed position to one naive demand bucket. Other unsupported/custom slots -> UNKNOWN for affected metric, no fake field certification.

### 4.1 User-team decision taxonomy, independently derived

A **material cost** is any supported current/future/playoff DOWNGRADE, newly uncovered known bye/starting slot, or a verified increase in contingency uncovered-slot count; a **material benefit** is a supported UPGRADE, removal of a known uncovered slot, or a verified improvement in contingency coverage. A mere count change is descriptive until legal slot coverage or supported source-specific quality changes. A **severe gap** is the narrow TCW-022 DANGEROUS case: newly known supported-horizon lineup/bye gap with no verified legal available replacement path or known roster/acquisition limits blocking that path. SCARCE_THIN is a material *risk* even if no supported scheduled gap yet; unknown replacement quality is UNKNOWN, never "verified no replacement."

Apply the following stable decision order after legality:
- WITHHELD if invalid proposal, unresolved user roster legality, no complete current/source-resolved comparison *and* no complete alternative horizon to establish the material team claim, or a required choice depends on unavailable evidence; expose any known structural facts separately.
- WORSENS if severe gap is supported; or at least one supported material cost and no supported material benefit, with no missing selected horizon needed to adjudicate a claimed upside. Show risks and do not recommend executing.
- MIXED if both supported material benefit and supported material cost exist, including a starter gain plus worsened contingency/SCARCE_THIN, or if complete current and future/playoff directions materially oppose; report each component, no unconditional recommendation.
- IMPROVES if at least one supported material benefit, no supported material cost or severe risk, and coverage of *all horizons invoked in the positive claim* is complete/source-resolved; if ROS/playoffs are unknown label "current-week-supported improvement only", not global projected improvement.
- NO_MATERIAL_CHANGE if supported evaluated comparisons are TOSSUP, no meaningful supported bye/contingency changes and no unresolved material gating question is used to justify action. A fair/neutral roster outcome defaults to DO NOTHING rather than an invented recommendation.
- WITHHELD (source-sensitive) if same-horizon sources materially disagree and no independent supported structural finding resolves the asserted recommendation. Keep source-specific impacts visible.

Priority for severe fragility over a positive starter delta is mandatory. If one horizon is unknown, it cannot manufacture a conflicting DOWNGRADE or complete ROS/playoff endorsement; the output can be limited to an explicitly named complete horizon when that is genuinely sufficient for that bounded statement. If source-resolved current DOWNGRADE and complete future UPGRADE, decision MIXED and reason LONG_TERM_GAIN_SHORT_TERM_COST; inverse -> MIXED and SHORT_TERM_GAIN_LONG_TERM_COST. If partial future is the **only** supposed offset to a present cost, label future thesis WITHHELD, not MIXED based on imaginary upside.

Recommendation is separate: CONSIDER if IMPROVES, no DO_NOT_TRADE violation, and structurally legal; DO_NOT_PROCEED if WORSENS or hard generation preference applies; HOLD_DO_NOTHING if NO_MATERIAL_CHANGE; REVIEW_TRADEOFF if MIXED; NOT_ENOUGH_EVIDENCE if WITHHELD or unresolved legality. "CONSIDER" is not a guarantee or unconditional trade instruction; it names its supported horizon and documented limitations. An unknown execution rule or late/locked current-week state restricts actionability even when numerical comparison is valid.

## 5. Replacement, VORP, scarcity, FLEX/OP, and roster space

### 5.1 Replacement is a source-specific *counterfactual*, not an automatic add

Use the latest ESPN **full structurally available pool**, not the truncated UI/presentation candidate list. Candidate must have unambiguous identity, ESPN availability at recorded timestamp, supported positional/slot eligibility, same-horizon projection, and a **known feasible roster path** given size/position/acquisition constraints; if acquisition feasibility cannot be established, distinguish structurally available from legally/acquirably VERIFIED. Do not assert anyone remains available later or a waiver claim will succeed.

For a given roster R, source s, week w and player p, calculate the **marginal slot-aware lineup contribution**:

  Marginal(R,p,s,w) = BestLegalLineup(R,s,w) - BestLegalLineup(R without p,s,w)

Only produce a numeric marginal when *both* legal complete lineups exist. When removal leaves a slot unfilled, state COVERAGE_GAP and withhold numeric marginal rather than imputing a zero projection. To compare a potential replacement q, use a separately labeled conditional scenario:

  ReplacementAssistedDelta(R,p,q,s,w) = BestLegalLineup((R without p) plus q,s,w) - BestLegalLineup(R,s,w).

Use the best **verified feasible legal** candidate per slot-configuration and same named source/week, not highest raw listed-position points. Multiple FLEX/OP spots must be solved as a simultaneous matching problem, not independently selecting the same candidate for two roles. This produces a *roster-specific realized over-replacement gain*, not an independently additive player market unit.

When a conventional player VORP context is useful, define ReferenceReplacement(s,w,slot-context) from that same full feasible pool using the actual configured starter-slot counts, number of teams, FLEX/OP eligibility, league roster constraints, and on-field projections; report VORP = PlayerProjection[s,w] - ReferenceReplacementProjection[s,w,slot-context] only where the slot context and source cover both. A generic "RB12 replacement" or league-size cutoff is prohibited when FLEX/OP changes effective demand. For overlapping slots use the marginal optimal-lineup replacement calculation above as the authoritative *roster-specific* VORP analog, and expose its slot-context metadata. If no verified candidate/complete projection exists, replacement VORP numeric WITHHELD, coverage status GAP/UNKNOWN as supported; no made-up waiver quality. Do not turn such VORP directly into market value or add it to an already scarcity-adjusted market price.

### 5.2 Scarcity

Describe scarcity by (a) actual league starter demand across supported configurable slots, including FLEX/OP, (b) eligible supply/quality of *verified feasible* available candidates, (c) internal legal contingency count, and (d) supported marginal lineup loss after removing p. If an ESPN pool, projections, league settings, or acquisition path is missing, mark SCARCITY_UNKNOWN. A scarce QB in OP may be more consequential than the same QB in a league without OP; a WR eligible for ordinary FLEX cannot be treated as competing only with WR. Use slot matching or an explicit weighted starter-demand *descriptive* table, never multiply raw player value by an arbitrary "scarcity factor." VORP already captures replacement scarcity on a shared legal slot context; never count it a second time as an independent additive benefit.

### 5.3 Unequal package invariants

2-for-1: report one newly open active roster spot when the known original roster was full and no other constraints change; best legal starter change may be material even when one outgoing piece was bench-only. Explain consolidation as realized optimized starter benefit plus an **unfilled** open-spot option, not as an automatic best free agent. Show internal coverage loss and any *conditional* replacement-assistance separately.

1-for-2: if the pre-roster had an eligible open spot, include both acquired players with legal lineup/depth consequences; if full, require an explicit user-selected follow-up drop before final resolved-roster metrics. Report drop identity, its foregone starter/contingency contribution, and net roster-space consequence. Never silently drop the projected-lowest bench player or assign incoming players to IR. Opponent's reciprocal unequal-package effects receive their own roster-space gate.

Fragility is quantified at **configured slot** level: for each pre/post starter, remove that starter and recompute maximum legal fillable starter slots; uncoveredAfterLoss = configuredStarterSlotCount - maximumFillableSlots. Also recompute known-week bye gaps. Report per-slot before/after, newly created gaps and any verified replacement path. A big current-week positive StarterDelta may not erase a DANGEROUS known gap; SCARCE_THIN remains a first-class risk and therefore yields MIXED when paired with a supported gain.

## 6. Team-needs model (pre and post; TCW-035 minimum)

Needs are *roster-specific feasible improvement opportunities*, not ordinal player ranking or "you own fewer RBs than WRs." Apply the same deterministic computation separately to the pre-roster and each **resolved legal** post-roster of each manager, with source/horizon labeling. If a post-roster cannot be resolved, its needs are WITHHELD, never inferred from an illegal expanded roster.

For each configured starter slot / legal slot group:
1. Record count of configured slots, exact optimized incumbent IDs/points, count of distinct **internal legal eligible alternatives** and currently uncovered slots; mark overlapping FLEX/OP coverage by legal matching rather than double-counting players.
2. Compute legal contingency for removing each starter. Need severity tier: CRITICAL = known uncovered configured starting slot/bye gap; THIN = complete starting lineup but at least one starter-removal contingency leaves an uncovered slot; UPGRADE_OPPORTUNITY = no such gap and an actually identified feasible candidate would improve that optimized slot configuration by >= 1.0 point/week under a complete comparable source; COVERED = complete covered roster with no identified material upgrade; UNKNOWN = required slot, projection, bye, or candidate facts unavailable. CRITICAL outranks THIN outranks UPGRADE_OPPORTUNITY outranks COVERED. Distinguish scheduled verified CRITICAL from contingency-only THIN.
3. Strongest starting area = slot group with largest nonnegative supported marginal contribution over its best verified feasible replacement *under the same legal context*, among fully covered groups; weakest = CRITICAL/THIN first, then smallest supported marginal contribution, then largest supported feasible upgrade; ties sort by slot code/ID. If replacement projections are absent, return strength/weakness UNKNOWN except structural coverage facts. Never force a numeric strongest/weakest from incomparable positions or unsupported FLEX/OP slot data.
4. Expendable asset = non-DO_NOT_TRADE asset whose removal preserves complete current legal lineup and does not create a new known bye gap, worsen max contingency uncovered slots, or produce a <= -1.0 sourced starter delta for any explicitly protected/evaluated horizon. PREFER_TO_KEEP does not become expendable by default; ACTIVELY_SHOP only promotes search priority, not a fabricated surplus or objective endorsement. Any incomplete prerequisite -> EXPENDABILITY_UNKNOWN.
5. Priority upgrade area = deterministic tier order, then largest supported feasible improvement from the *same named source and horizon*; missing pool means needs may still say structurally THIN/CRITICAL but cannot claim a verified target or numeric upgrade. Compare before/after need tiers, uncovered counts, marginal replacement context and exact displaced IDs; identify resolved versus newly created needs.

No summed cross-position opaque "need score" is necessary or authorized. For TCW-035 emit sortable tier and evidence-bearing metric fields, not a pseudo-precise 0–100 grade. A hypothetical opponent roster uses exactly the same logic; absent/unmapped roster -> opponent needs UNKNOWN, not assumed balanced. Need strength does not alone prove a player is available, tradable, or wanted.

## 7. Horizon/source separation and evidence confidence

CURRENT_WEEK uses complete source-specific week projections and current locks; FUTURE_WINDOW includes *named explicit weeks* only, with direction based on mean weekly delta; REST_OF_SEASON label requires explicitly defined ALL remaining evaluated fantasy weeks and complete same-source identity/season/scoring-compatible pre/post union coverage; PLAYOFF requires explicitly configured league playoff weeks and complete coverage for ALL such weeks. No missing week is zero; do not cherry-pick complete weeks and relabel ROS/playoffs; no conversion of SOS/ranking stars into projection points or conflation of external source with ESPN. If current-week UPGRADE but complete ROS/playoff DOWNGRADE, show both independently and MIXED, not positive overall. If playoff evidence incomplete, playoff mean/direction/claim are null/UNKNOWN; FV-SEASON-01 remains pending.

Evidence confidence is an **independent, per-claim structured assessment**, never a value multiplier or a win probability. Fields: evidenceState (COMPLETE_MULTI_SOURCE_AGREEMENT, COMPLETE_SINGLE_SOURCE, SOURCE_DISAGREEMENT, PARTIAL_COVERAGE, STRUCTURAL_ONLY), coverage (COMPLETE/PARTIAL/NONE), freshness (WITHIN_APPROVED_POLICY/STALE/UNKNOWN), identity (EXACT/AMBIGUOUS/MISSING), comparability (COMPATIBLE/INCOMPATIBLE/UNVERIFIED), structuralLegality (VERIFIED/UNVERIFIED/UNRESOLVED), unsupportedContingencies[] and claimConfidence (HIGH/MODERATE/LOW/WITHHELD). HIGH requires complete exact compatible current relevant source(s), verified provenance/freshness and at least two genuinely independent accepted agreeing sources **for that same claim and scale**; MODERATE requires one complete compatible fresh approved source and all essential structural inputs; LOW only qualifies *bounded descriptive/counterfactual* claims with material limits and cannot support a generic winner; WITHHELD if any prerequisite for the particular numeric/result claim fails, including incompatible value-provider sources or unresolved material conflict. Two sources do not become independent by copying data, and no source is declared fresh absent an approved TTL/rule. If no approved valuation provider is established, value claimConfidence WITHHELD even if current ESPN lineup evidence is MODERATE. If no second approved source exists, single-source completeness can still support a bounded roster directional result; lack of a second source alone is not fabrication or a reason to force LOW.

Report each missing/unsupported input by claim and source with player/week IDs only as privacy-safe necessary; no private league/member identifiers in handoff artifacts. Low confidence never widens the 45–55 **numerical** band or flips winners; it limits wording or WITHHOLDS the affected label. Do not silently recast an uncertain 57/43 as FAIR. Current coverage cannot increase ROS/playoff confidence.

## 8. Two-manager plausibility, buy-low/sell-high, preferences

For each manager run a reciprocal **do-nothing** comparison with that manager's own roster, lineup/eligibility, explicit follow-up drop if required, and named horizon. Plausibility:
- PLAUSIBLE_FOR_BOTH: both rosters/legal consequences supported; each has >= one explicit supported rational benefit (current starter, named future horizon, contingency/bye coverage, or approved comparable value gain), and neither has an unresolved known required drop/severe known unfillable gap. A trade may be package FAIR but opponent-implausible if it worsens their only QB/OP path.
- USER_ONLY / OPPONENT_ONLY: supported rational benefit exists for one, but no supported rational benefit for the other and all relevant comparison facts are complete; state exact supported counterparty issue, not a prediction of rejection.
- NEITHER: both complete and no supported benefit for either.
- UNKNOWN: opponent preferences, roster/projections, legal post-roster/drop, source coverage, or claimed relevant horizon are unavailable/unresolved; do not mislabel unknown as implausible.

Plausibility is football rationale only: even PLAUSIBLE_FOR_BOTH does **not** imply offer acceptance, likelihood, or willingness. For future package generation, candidate must meet legal/structural gates and have a documented rational benefit on both sides, otherwise do not call it a "realistic match." An owner may still reject it for any undisclosed preference.

BUY_LOW / SELL_HIGH require (a) separate named, approved, fresh, compatible independent **market valuation** evidence and (b) independently supported complete named-horizon roster utility evidence for the same player(s), with an explicitly accepted common comparison protocol from TCW-033/Manager. BUY_LOW = market context discounts an acquisition relative to documented forward *utility in the user's resolved roster*; SELL_HIGH = market context values an outgoing asset above its supported marginal utility to the user's roster. Unless comparability and divergence threshold are validated and approved, use OPPORTUNITY_UNVERIFIED with explanatory source-separated evidence, **not** BUY_LOW/SELL_HIGH. Neither label predicts price convergence, breakout, decline, acceptance, or real-player future success; no recent-injury narrative without approved dated source.

Preference handling:
- DO_NOT_TRADE: hard exclusion from ALL generated outgoing packages; manually entered proposal still evaluated but result marked PREF_CONFLICT, action DO_NOT_PROCEED and never auto-submitted. Explicit user change is the only way to lift it; do not infer waiver/trade exemptions.
- PREFER_TO_KEEP: soft generator deprioritization, never auto-label expendable; user-directed/explicitly selected manual evaluation permitted with warning and documented benefit/tradeoff. This flag never changes raw valuation or do-nothing math.
- ACTIVELY_SHOP: candidate-generation search priority and explanatory tag only, not permission to recommend a roster-damaging offer, ignore legality, or force a package count. A DO_NOT_TRADE flag takes precedence if conflicting user state is provided; flag conflict is shown, not silently normalized.
- Missing/unknown preference: NONE/UNKNOWN as appropriate, not ACTIVELY_SHOP. Incoming/opponent user preferences are not assumed.

No worthwhile trade found is a valid terminal finder outcome if every examined legal proposed package fails supported user improvement, two-manager plausibility, hard preference, or evidence gates. Explain the evaluated scope and reason categories; do not fabricate a deal to satisfy an output quota.

## 9. Builder-facing semantic output contract (version 1)

TCW-034 may adapt naming to existing JS conventions **without dropping or conflating fields**. Null means WITHHELD/UNKNOWN, never numeric zero; every non-null derived metric has provenance, source, timestamp, horizon, units and coverage. This contract is normative for output semantics:

  contractVersion: TCW_032_V1
  analysisState: READY | PARTIAL_EVIDENCE | INVALID_PROPOSAL | ROSTER_ACTION_REQUIRED | INSUFFICIENT_EVIDENCE
  snapshot: {provider, capturedAt, freshness, currentWeek, leagueLineupSlots, knownRosterRules}
  proposal: {userTeamId, partnerTeamId, outgoingPlayerIds[], incomingPlayerIds[], plannedFollowUpDropIds[], teamObjective, rosterPreferences[]}
  validation: {identity, uniqueOwnership, userRosterLegality, opponentRosterLegality, unresolvedRules[], currentWeekActionability, readOnly:true, transactionActions:[]}
  packageValue: {status: READY | WITHHELD | SOURCE_DISAGREEMENT, basis: ABSTRACT_ASSET_VALUE, sourceId, sourceVersion, asOf, unit, incomingTotal, outgoingTotal, incomingShare, outgoingShare, displayedSplit, fairnessBand:{inclusiveLower:45,inclusiveUpper:55}, winner: YOU_WIN | FAIR_TRADE | THEY_WIN | WITHHELD, sourceResults[], reasons[]}
  doNothing: {preRosterSignature, postResolvedRosterSignature, userDecision: IMPROVES | WORSENS | MIXED | NO_MATERIAL_CHANGE | WITHHELD, recommendation: CONSIDER | DO_NOT_PROCEED | HOLD_DO_NOTHING | REVIEW_TRADEOFF | NOT_ENOUGH_EVIDENCE, supportedHorizonScope[], severeGap, materialBenefits[], materialCosts[]}
  lineup: {sourceResults:[{sourceId, capturedAt, horizonType, weeks[], status, preTotal, postTotal, delta, meanWeeklyDelta, direction, preAssignments[], postAssignments[], startedIncomingIds[], benchedIncomingIds[], displacedIds[], promotedIds[], missingPlayerIds[], actionability}], sameHorizonDisagreement}
  rosterSpace: {user:{preActiveCount, directActiveCount, resolvedActiveCount, netRosterCount, openActiveSlots, requiredDrops[], ruleViolations[]}, opponent:{same fields or UNKNOWN}, conditionalFollowUpAddsExcluded:true}
  depth: {listedPositionCountsBeforeAfter[], contingencyBeforeAfterBySlot[], maxUncoveredBeforeAfter, knownByeGapRows[], fragility: COVERED | THIN | SCARCE_THIN | DANGEROUS | UNKNOWN, replacementPath, consolidationOrDiversification, conditionalReplacementScenarios[]}
  replacementScarcity: {poolSnapshotAt, fullStructuralPoolUsed, acquisitionPathStatus, eligibleSlots[], candidateIds[], sameSourceWeek, positionalAndFLEXOPDemand[], replacementProjectionOrNull, marginalVorpOrNull, scarcityState, noDoubleCountAttestation}
  teamNeeds: {user:{before[],after[],priorityAreas[],expendableAssets[]}, opponent:{before[],after[],priorityAreas[],expendableAssets[]} | UNKNOWN, comparison:{resolvedNeeds[],newNeeds[],unchangedNeeds[]}}
  horizons: {currentWeek:{sourceResults[],direction,actionability}, futureWindow:{weekIds[],label,sourceResults[],status}, restOfSeason:{definedWeeks[],completeCoverage,sourceResults[],status}, playoffs:{configuredWeeks[],sourceResults[],status}, crossHorizonConflict}
  confidence: {packageValue:{claimConfidence,evidenceState,coverage,freshness,identity,comparability,limitations[]}, userDecision:{same}, horizons:{currentWeek,futureWindow,restOfSeason,playoffs}, opponentPlausibility:{same}}
  plausibility: {state: PLAUSIBLE_FOR_BOTH | USER_ONLY | OPPONENT_ONLY | NEITHER | UNKNOWN, userRationale[], opponentRationale[], observedPreferences:UNKNOWN, acceptanceProbability:null}
  framing: {buyLowSellHighStatus: BUY_LOW | SELL_HIGH | OPPORTUNITY_UNVERIFIED | NONE, approvalBasisOrNull, warnings[]}
  explanation: {sourceFacts[], derivedStrategy[], reasons[], limitations[], preferenceWarnings[], counterfactualWarnings[], doNothingRationale[]}

All ID display must use existing privacy-safe app conventions. Named value-source per-asset mappings may remain internal, but missing IDs and evidence limitation must be reportable. Deterministically sort warnings/IDs, preserve actual lineup slot order for assignments, and order reasons by section 2. If a value source is still absent, Builder must produce the complete useful roster-facing result with packageValue WITHHELD (not placeholder percentages). Do not overload legacy TCW-022 conclusion with package winner.

## 10. Synthetic acceptance scenarios — expected outcomes

All example numbers here are **test fixtures**, not current source facts, NFL player valuation, or field validation. Unless stated otherwise, fixture value units are an explicitly hypothetical *approved compatible additive* source, current/week projection/identities/roster rules are complete and fresh, and no unknown future claim is made. "57/43" always means package asset value received/sent, not probability. Each scenario must assert that package winner and user decision are distinct.

| # | Fixture | Required result / negative assertion |
|---|---|---|
| 1 | Incoming/outgoing 50/50 value; user optimized current starters 120 -> 117, no compensating supported benefit. | FAIR TRADE package; user WORSENS (-3.0); DO_NOT_PROCEED. Never recommend because fair. |
| 2 | Value 60/40 for incoming; starters +4.0 but a newly known supported bye gap has no verified legal replacement path. | YOU WIN package; DANGEROUS fragility; user WORSENS and DO_NOT_PROCEED, never unqualified winner/upgrade. |
| 3 | 2-for-1: outgoing incumbent + bench, incoming elite; 120 -> 123; full roster -> one open slot; loss of RB contingency, no known bye gap. | Source current +3.0; YOU WIN/FAIR/THEY WIN only from independent fixture asset units; user MIXED on starter gain vs confirmed material depth cost; open slot is an *option*, no free-agent projected points included. |
| 4 | 1-for-2: verified open roster spot; 120 -> 120.2, full contingency uncovered count 1 -> 0. Contrast full original roster without explicit drop. | With room: TOSSUP lineup, supported depth benefit, user IMPROVES only on bounded resilience; without room: ROSTER_ACTION_REQUIRED and user decision WITHHELD until explicit drop; no implicit bench removal. |
| 5 | Incoming valued at 70 but cannot displace any incumbent or add needed cover; outgoing valued 60 and starts. | Package YOU WIN possible while source-supported starting delta negative; user WORSENS, high abstract value is not roster improvement. |
| 6 | Incoming asset value 45, outgoing 55; changes a verified critical OP/RB/WR gap into full legal lineup and adds +4 projected pts. | FAIR at exact 45/55 band; user IMPROVES on supported horizon despite lower abstract incoming asset value; no reversal of package FAIR to YOU WIN. |
| 7 | Incoming 54.9/outgoing 45.1, or exactly 55.0/45.0. | FAIR TRADE, inclusive unrounded boundary; no winner declared from rounding. 55.01/44.99 becomes YOU WIN. |
| 8 | Incoming 60/outgoing 40, approved compatible complete fresh source(s), exact IDs, resolved both rosters, no material source disagreement. | YOU WIN package; confidence MODERATE if single accepted source, HIGH only for genuinely independent agreeing sources; no win/acceptance probability and no automatic user IMPROVES. |
| 9 | Nominal 60/40 but incoming second player has no approved mapped value, or source is stale/nonadditive. | packageValue WITHHELD; no numerical split or YOU WIN regardless of reported partial 60/40; retain independently supported lineup facts and package claimConfidence WITHHELD. |
| 10 | Current +3; complete named ROS -2/week, playoff -1.5/week. | Separate current UPGRADE and ROS/playoff DOWNGRADE; user MIXED with SHORT_TERM_GAIN_LONG_TERM_COST; no averaged overall delta. |
| 11 | Current -2; complete named future +2/week. | User MIXED with LONG_TERM_GAIN_SHORT_TERM_COST; no future value copied into current-week starter points. |
| 12 | Current +2; week 16 missing in three-week configured playoff window. | Playoff aggregate/mean/direction null/UNKNOWN, no playoff UPGRADE or FV-SEASON-01 PASS; current improvement can be claimed only for complete supported current horizon. |
| 13 | Outgoing player loss -3 before replacement; full ESPN pool contains verified available eligible q that restores all but 0.2 points, versus alternate pool with no legal eligible q. | First: low *conditional* replacement cost separately, do-nothing direct delta unchanged; second: slot coverage GAP or scarcity UNKNOWN/THIN/DANGEROUS only if narrow known criteria met; never use truncated UI list or assume a waiver add occurred. |
| 14 | 12-team lineup has one QB + one OP + ordinary FLEX; extra QB/WR can fill overlapping roles and all slot matching matters. | Optimize entire supported QB/RB/WR/TE matching, derive slot-aware replacement demand; neither single-QB baseline nor independent QB+FLEX additive VORP; unsupported custom slot -> relevant metric UNKNOWN. |
| 15 | Same outgoing player flagged DO_NOT_TRADE, PREFER_TO_KEEP, ACTIVELY_SHOP in separate fixtures. | DO_NOT_TRADE excludes all generated packages and warns on manual; PREFER_TO_KEEP is soft deprioritization/manual warning; ACTIVELY_SHOP prioritizes consideration only. None changes raw shares or roster delta. |
| 16 | User improves +4, opponent's only legal QB/OP slot becomes unfillable and no supported benefit exists for them. | Opponent-implausible USER_ONLY (or UNKNOWN if opponent-side drop/rule evidence unresolved), not PLAUSIBLE_FOR_BOTH; no acceptance percentage even if package FAIR. |
| 17 | Every enumerated legal available proposal is FAIR but user lineup/needs do not improve, or requires DO_NOT_TRADE player. | noWorthwhileTradeFound true for later finder, list scope/reasons; DO NOTHING, no quota-filled fabricated package. |
| 18 | Incoming/outgoing shares 44/56 on one compatible approved source and 57/43 on another, identical stated scope. | Per-source THEY WIN/YOU WIN retained; generic package winner WITHHELD SOURCE_DISAGREEMENT; no averaging and no source-picked global winner. |
| 19 | Apparent positive +5 current but a starter locked before proposed hypothetical; resolved roster otherwise legal. | Current impact marked COUNTERFACTUAL_NON_ACTIONABLE; no currently executable recommendation or ESPN processing claim. |
| 20 | ESPN full available pool unavailable but roster and projection complete; generic player demand rank is present. | Current lineup remains computable; replacement/scarcity numeric WITHHELD, no fabricated strong/weak waiver pool; no unsupported market split derived from ordinal rank. |
| 21 | Fair 50/50 value, user current lineup +0.2, no depth/bye gains and no future supported material improvement. | FAIR package, user NO_MATERIAL_CHANGE, HOLD_DO_NOTHING. Fairness does not imply worth trading. |
| 22 | Opponent roster not uniquely available; package identities valid and user-side trade legal. | User-only source-specific hypothetical may be shown if independently valid; opponent plausibility UNKNOWN, no PLAUSIBLE_FOR_BOTH; if incoming sole ownership cannot be proven, entire proposal INVALID. |

Boundary assertions: zero missing values must **not** equal zero asset value or projected points; exact 45/55 fairness inclusive; negative/NaN/undefined market units fail closed; source provenance per value/horizon; configured FLEX/OP coverage does not double-use player; no magic open-spot waiver pickup; no claim that pending field validation is passed.

## 11. TCW-034 Builder acceptance criteria

1. Implement this contract in bounded approved code only after Manager accepts this policy; do not treat this document as authorization to begin TCW-034. Preserve deployed baseline functionality, read-only ESPN, ownership/partner, stale-state reset, roster constraints/explicit drops and existing TCW-022 horizon/depth logic.
2. Correct named source-dependent package winner/split and inclusive fairness boundaries **only** when TCW-033/Manager provides comparable approved valuation inputs. Otherwise deterministic WITHHELD with informative UI. Do not silently implement a made-up player market number to satisfy a product checkbox.
3. Stable output fields above or a mapped equivalent; the UI displays adjacent **package value** and **your actual roster impact**, supported do-nothing comparison, separate confidence and current/ROS/playoff reasons, provenance, missing-data message and any required follow-up action. No % probability wording.
4. Re-optimize both pre/post full supported lineup configurations; test FLEX/OP simultaneous matching, active union-roster completeness, per-source disagreement, true bench-only value, current locks, latest full structural pool, replacement path and known bye gap. Preserve explicit opponent-side unknown vs invented consent/roster moves.
5. Add deterministic focused fixtures for all 22 scenarios/boundaries above; ensure one-sided source, incomplete value, illegal roster, preference conflict, scarce/strong replacement, conditional consolidation, source conflicts, and multiple horizons fail safely.
6. Run appropriate full implementation tests/browser/mobile/accessibility/readiness/security and live connected-league UAT through Manager's subsequent gates; CI green is not V2 complete and is not actual FV-SEASON-01 evidence.
7. Inspect diff/read-only mutation boundary and provide exact head, tests/CI, known data-source dependency statuses and separate product validation limitations for Manager and independent audit. No feature creep into finder/counter/pending offers.

## 12. TCW-033 R&D dependencies / Manager decision points

**Blocking for a truthful generic package-value winner and numeric split:** identify whether an actually usable, approved, fresh, identity-mapped, scoring/league-compatible **comparable additive asset-value** source exists; document valuation unit, package additivity across uneven packages, freshness/TTL, missing/zero/negative handling, license/API feasibility, per-player coverage, league-format conditioning and double-counted VORP/scarcity risks. If absent, TCW-034 may only ship roster consequence + WITHHELD package winner until Manager explicitly approves a defensible alternative. Proposed 45–55 band is a provisional strategy heuristic for Manager acceptance, not calibrated source authority.

**Conditional for buy-low/sell-high:** independently documented market-vs-forward-utility comparison basis, horizon and meaningful divergence threshold; no such label before approved evidence.

**Conditional for richer opponent matching/opportunities:** completeness of all league rosters/lineup settings/ownership, legal counterpart drops, provider identity mapping and available replacement pools; missing opponent inputs -> UNKNOWN, not an acceptance model.

**Later incoming-offer workflow, not TCW-034 blocker:** investigate documented or observed reliable read-only ESPN pending/received offer access and manual reconstruction fallback, freshness/identity/state requirements. Do not assume access or authorize write behavior.

No new source is required to define *structural* user lineup, do-nothing, and team-needs semantics already supported by accepted baseline inputs. Research dependencies should be routed/activated by Manager only; this artifact performs **no TCW-033 execution**.

## 13. Explicit non-goals and stop gate

No production implementation, source selection or market-value calibration by Strategy, hidden acceptance-probability model, automatic ESPN propose/send/accept/reject/veto, undocumented ESPN pending-offer claims, inferred injury/news/playoff facts, guaranteed acquisition, new field-validation evidence, forced trade opportunity, or Trade Analyzer V2 completion claim. No task activation or merge by Strategy. The only Strategy deliverables are this policy and .ai/strategy/HANDOFF.md; exactly one Strategy PR, exact-final-head CI, then Manager review/acceptance.
