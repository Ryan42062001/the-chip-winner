# TCW-033 — Trade Intelligence Data + ESPN Offer Research

Task ID: TCW-033  
Role: Research & Development  
Research date: 2026-09-19  
Canonical task branch: rnd/tcw-033-trade-intelligence-data-research  
Verified canonical master at research start: 3c41a5caab555e7564ce3255947515415fba685e  
Accepted TCW-032 strategy integration: 6120dc027dfafc8db9240d70fb9e6c32a8cc2ebc  
Accepted deployed Trade Analyzer target: 5362e2bff143a5aef050e160ccb0706a7060fb3d

## Executive conclusion

### Blocking package-value source verdict

**MANAGER_DECISION_REQUIRED**

R&D did not find an external redraft trade-value source that simultaneously has all of the following with no unresolved policy choice:

1. current redraft asset-value semantics;
2. explicit or strongly evidenced package additivity;
3. sufficient league-format conditioning;
4. stable player identity suitable for ESPN joins;
5. current/fresh operational behavior;
6. documented production-access mechanics;
7. documented rights suitable for The Chip Winner's intended use.

There are serious candidates, but each has a different material limitation. The best bounded paths are:

- **FantasyPros weekly redraft Trade Value Chart — primary manual/local candidate.** Current, provider-authored redraft trade values with 1QB/2QB and TE-premium variants and long-standing FantasyPros football-chart precedent for summing values across trade sides. However, the current public API documentation does not expose a trade-value endpoint, the current Week 2 article does not state a general PPR/half-PPR/standard base selector, and FantasyPros site/API terms materially restrict copying, redistribution, competition, and commercial reuse. R&D therefore recommends it only as a Manager-considered **user-supplied/manual, browser-local input**, not as an automated/bundled production feed unless FantasyPros grants suitable permission or a licensed endpoint.
- **FantasyCalc redraft market values — strongest market-data candidate if rights/API authority can be confirmed.** Values are generated from 1M+ real fantasy trades with league-size, PPR, 1QB/2QB and redraft/dynasty conditioning visible on the current product. Community tooling shows ESPN IDs and an undocumented values endpoint, but FantasyCalc does not publish stable official API documentation through the current public site, and current production-use rights could not be verified from an authoritative terms page in this research session. Technical reachability is not sufficient authority.
- **RedraftCalc — strongest semantic/additivity candidate if licensed access exists.** Its current site explicitly says its redraft value scale mirrors auction budgets so player values add up, and it supports 1QB/Superflex, standard/half/full PPR, TEP and 8–16 team leagues. But the valuation model is proprietary; no documented API, ESPN-ID mapping contract, or production-use terms were established. It is not safe to depend on automatically without provider permission/contract.

Because source approval is a product/data-rights policy decision and the candidates trade off authority, rights, format fit, identity, and operational reliability, R&D cannot truthfully collapse them into one automatic production dependency.

### TCW-034 implication

**TCW-034 remains blocked until Manager explicitly chooses one of these paths:**

A. approve a bounded manual/local trade-value source contract (R&D's first candidate is FantasyPros weekly redraft trade values) with source/format/freshness limitations made explicit;  
B. obtain/confirm licensed or otherwise authorized programmatic access to a provider such as FantasyCalc, FantasyPros, RedraftCalc, or another source, then approve that source; or  
C. keep package winner/split withheld and allow TCW-034 to implement only non-value-source behavior that Manager explicitly separates from the blocked package-value output.

R&D does **not** authorize Builder activation.

## Evidence classification

General labels:
- **VERIFIED FACT** — directly supported by current repository evidence or current primary/provider documentation.
- **STRONG EVIDENCE** — supported by multiple credible signals, but one material part is not an authoritative current contract.
- **INFERENCE** — reasoned from verified evidence but not directly established.
- **SPECULATION** — plausible but weakly evidenced.
- **UNKNOWN** — insufficient evidence.

Undocumented integration labels:
- **OFFICIALLY SUPPORTED**
- **OBSERVED AND REPRODUCIBLE**
- **OBSERVED BUT FRAGILE**
- **INFERRED**
- **UNKNOWN**

## 1. Current repository source inventory

### FantasyPros ROS ranking CSV

**VERIFIED FACT.** 'src/providers/rankings/fantasypros-csv.js' imports:
- ordinal overall rank ('RK');
- ordinal position rank;
- optional ECR-vs-ADP integer context;
- season SOS stars;
- playoff SOS stars.

It does not import an additive trade-value field.

**VERIFIED FACT.** 'src/providers/rankings/ranking-provider.js' validates season/scoring-family compatibility and reconciles ranking rows to ESPN players using normalized name/team/position matching. That path is useful for advisory ranking context but is not the stable-ID standard expected for a new authoritative asset-value source.

**Boundary:** useful for ROS ordinal context, relative positional context, team-needs narrative, and possibly a separately approved market/ranking-direction comparison. It is **not** sufficient for package sums or 57/43-style asset-value shares.

### FantasyPros manual/current-week projections

**VERIFIED FACT.** 'src/providers/projections/fantasypros-manual-import.js' imports non-negative FPTS and requires explicit user approval of a FantasyPros profile URL plus ESPN player identity.

**Boundary:** supports source-specific projected-point utility after compatibility/coverage checks. It does not establish market or trade asset value.

### Future projection provider

**VERIFIED FACT.** 'src/providers/projections/future-projection-provider.js' stores source-attributed player-week points with season, scoring format, capture time, explicit provider identity mapping, completeness checks, and staleness warnings.

**Boundary:** supports current/selected-future/playoff lineup utility. It must remain in point units and cannot be promoted into a package trade-value scale.

### Projection catalog 'restOfSeasonValue'

**VERIFIED FACT.** 'src/providers/projections/projection-catalog.js' permits an optional non-negative numeric field named 'restOfSeasonValue'.

**VERIFIED FACT.** The schema alone does not define what that number means, who produced it, whether it is additive, whether it is market value, or whether it is comparable across positions/packages.

**Boundary:** the generic field is not source authority. It remains unusable for TCW-032 package winner/split until a source contract supplies explicit semantics.

## 2. Candidate additive value-source comparison

| Candidate | What value represents | Additive package evidence | Format conditioning | Identity / coverage | Freshness | Rights / access | Scarcity/VORP | 57/43 defensible? | R&D disposition |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| FantasyPros weekly redraft Trade Value Chart | Analyst-ranking-derived redraft trade asset weight | **STRONG EVIDENCE.** Current 2026 chart labels numbers trade values; older FantasyPros football charts explicitly instruct summing both sides | Current chart exposes 1QB/2QB and TEP columns. Current article does not state a base PPR family selector; historic series has often used half-PPR | Public chart covers fantasy-relevant players; article rows lack stable provider/ESPN IDs | Weekly; Week 2 article published 2026-09-15 | Official page, but no documented current trade-value API endpoint; site/API terms restrict reuse/competition/redistribution. Manual personal copy is materially different from automated integration | Cross-position ranking-derived value likely embeds provider scarcity judgment; exact method is not public enough to add another scarcity factor safely | **Yes, conditionally** if all assets come from the same current chart/format and missing values fail closed | **Primary Manager decision candidate for manual/local use only** |
| FantasyCalc redraft values | Market value inferred by convex optimization from 1M+ real completed fantasy trades | **STRONG EVIDENCE** that one latent scale is used by its trade calculator; exact package-additivity contract is not publicly documented enough here | Current UI/database supports redraft, league size, PPR 0/.5/1, 1QB/2QB; TEP exists in product UI but community API coverage is incomplete | Community clients show ESPN IDs plus broad player coverage; endpoint is undocumented | Current/continuous market updates; trade database and trends are current | Public site exposes API Docs link but no authoritative stable API/terms contract was retrievable; community endpoint is technically reachable but unofficial | Market optimization necessarily captures positional/scarcity demand to some degree; do not add TCW VORP to package score | **Potentially**, only after provider confirms value semantics/additivity and authorized access | **Best programmatic candidate pending authority/rights confirmation** |
| RedraftCalc | Proprietary redraft market/auction-like value | **VERIFIED FACT from provider page:** scale mirrors auction prices so values add like budgets; package examples add component values | 1QB/SF, standard/half/full PPR, TEP, 8–16 teams | Broad current rankings; no verified ESPN-ID or public API contract | Current pages updated daily (2026-09-18 observed) | Proprietary model; no documented production API/rights established | Provider explicitly models positional scarcity; another scarcity bonus would double count | **Yes on its own scale** if same league settings and full coverage | **Strong semantic candidate; not production-authorized without access/rights agreement** |
| RotoTrade | Proprietary player trade values plus optional package adjustment | Raw totals are additive, but provider recommends a nonlinear package adjustment for uneven packages | Redraft/dynasty, PPR/half/non-PPR, 1QB/SF, TEP, league size | Broad player/pick search; no verified stable public API/ESPN-ID contract | Current 2026 tool | No approved API/license established | Proprietary valuation likely embeds scarcity and package premium policy | Raw split possible, but omitting provider's preferred package adjustment would change its intended trade semantics | **Not preferred for TCW-032 v1 additive contract** |
| KeepTradeCut | Crowdsourced dynasty market value | Additive trade calculator exists, but source is dynasty, not redraft | Dynasty-focused; crowdsourced, 1QB/SF, TEP | Broad dynasty players/picks | Near-real-time | Current terms explicitly prohibit automated collection/scraping/extraction and redistribution | Market value embeds dynasty scarcity/preferences | Not suitable for redraft TCW package result | **Reject for TCW-033** |
| DynastyProcess / TradeBalancer | Dynasty ECR transformed through published curve | Explicit additive calculator/value scale | Dynasty 1QB/SF; default assumptions are dynasty-oriented | Broad players/picks; open data lineage | Weekly but known publication gaps | GPL-3.0 / attribution is clear through TradeBalancer/DynastyProcess | Curve intentionally encodes depth/star preference; not redraft in-season | Mathematically yes, semantically wrong product horizon | **Reject for in-season redraft source authority** |
| Existing TCW projections / VORP | Team utility in projected points / replacement context | Additivity would conflate player points with marginal roster utility and ignore lineup constraints | Excellent connected-league conditioning | Strong ESPN/provider mappings | Current + future source-dependent | Already available | VORP is derived team context | **No** — wrong semantics | **Reject as package asset value** |

## 3. Candidate details and failure policy

### 3.1 FantasyPros weekly redraft Trade Value Chart

Sources:
- Current Week 2 chart: https://www.fantasypros.com/2026/09/fantasy-football-trade-value-chart-week-2-2026/
- Current API overview: https://www.fantasypros.com/api-data/
- API access/licensing support: https://support.fantasypros.com/hc/en-us/articles/49749297704475-How-do-I-request-access-to-the-FantasyPros-API
- Site terms: https://www.fantasypros.com/about/legal/
- API terms: https://api.fantasypros.com/public/v2/terms-of-use
- Additivity precedent in football series: https://www.fantasypros.com/2020/11/week-9-fantasy-football-trade-chart-2020/

**VERIFIED FACT.** The 2026 Week 2 article states that FantasyPros analysts combine rankings to formulate trade values for redraft players and explicitly frames them as actual-value-versus-perceived-value context for buy-low/sell-high.

**VERIFIED FACT.** The current chart includes base QB values, 2QB QB values, and separate TEP TE values.

**STRONG EVIDENCE.** FantasyPros' long-running football trade-chart methodology has explicitly instructed users to add player values on both sides. The current 2026 article does not repeat that sentence, so current additivity is strong continuity evidence rather than a newly published formal contract.

**Rights/operations.** FantasyPros offers personal non-commercial API access and separate commercial terms, but the current documented API datasets are rankings/projections/players/news/injuries rather than a trade-value endpoint. Site terms allow a personal single copy but restrict reproduction/redistribution; API terms impose attribution and non-compete limitations.

**Safe TCW path if Manager approves:** user manually imports or enters a current FantasyPros trade-value table locally; TCW stores no bundled provider dataset in the public repository and performs no automated scrape. Require source date/week, value mode (base/2QB/TEP as applicable), explicit mapping to ESPN IDs, and complete coverage for every proposed asset. If any side has missing/unmapped/nonfinite value, withhold package winner/split.

**Stale policy recommendation:** fail closed if the source does not clearly correspond to the current in-season weekly publication or if its capture date is older than the newest available weekly chart. Do not silently carry an old value across a new chart publication.

**Zero/negative policy:** current chart uses positive values including a 1.0 floor for many assets. TCW must preserve provider values exactly; missing is not zero, and negative/nonfinite values would be unsupported unless provider documentation introduces them.

### 3.2 FantasyCalc

Sources:
- https://fantasycalc.com/
- https://fantasycalc.com/fantasy-football-draft-app
- https://fantasycalc.com/database
- https://fantasycalc.com/trade-targets

**VERIFIED FACT.** FantasyCalc states that trade values are generated with convex optimization from more than one million real fantasy trades. Current product controls support redraft/dynasty, league size, PPR, TEP and Superflex contexts.

**VERIFIED FACT.** Its trade database can filter real trades by redraft/dynasty, QB count, league size, PPR and TEP.

**STRONG EVIDENCE / OBSERVED BUT FRAGILE.** Community tooling currently consumes an endpoint commonly represented as 'api.fantasycalc.com/values/current' and reports ESPN IDs. That demonstrates technical feasibility, not an official stable API contract.

**UNKNOWN.** Production redistribution/use rights and endpoint SLA are not sufficiently established by authoritative current terms in this session. A May 2026 community discussion attributed to the FantasyCalc developer says there are no API docs and tells builders to inspect devtools and read terms; R&D treats that only as supporting context, not legal authority.

**Safe TCW path:** do not automate until Manager has an authoritative terms/permission basis and a provider-shape contract. If approved later, FantasyCalc is attractive because market context and platform IDs could support both package value and trend research without converting projected points into market units.

### 3.3 RedraftCalc

Sources:
- https://www.redraftcalc.com/
- https://www.redraftcalc.com/rankings/wr
- https://www.redraftcalc.com/rankings/te

**VERIFIED FACT.** Provider states its values are built from thousands of real redraft drafts, ESPN/Yahoo ADP and live auction prices.

**VERIFIED FACT.** Provider explicitly says its scale mirrors real auction prices so values add like budgets and displays additive package examples.

**VERIFIED FACT.** It supports 1QB/Superflex, TEP, standard/half/full PPR and 8–16 teams, with pages updated as recently as 2026-09-18.

**UNKNOWN.** No stable API, provider-ID/ESPN-ID contract, terms for reuse, or SLA was established. Its model is proprietary.

**Safe TCW path:** treat as research evidence only unless provider grants suitable access/rights. It is a strong candidate to contact because its semantics align unusually well with TCW-032.

### 3.4 RotoTrade

Source:
- https://www.rototrade.com/fantasy-football-trade-analyzer

**VERIFIED FACT.** Supports redraft/dynasty, scoring formats, 1QB/Superflex, TEP and league size. It exposes per-player values and package totals.

**VERIFIED FACT.** It recommends an optional package adjustment that increases the side with fewer assets to model consolidation value.

**R&D conclusion.** That package adjustment is a provider-specific nonlinear policy. TCW-032 deliberately separates package asset value from roster consequence and uses a transparent 45–55 additive-share heuristic. Importing RotoTrade's adjustment would effectively import an unreviewed hidden policy; ignoring it would no longer represent the provider's recommended trade assessment. Not the cleanest authority for v1.

### 3.5 KeepTradeCut / DynastyProcess

KeepTradeCut terms:
https://keeptradecut.com/terms-and-conditions

**VERIFIED FACT.** KeepTradeCut is dynasty-oriented and its current terms explicitly prohibit automated collection/scraping/data extraction and redistribution.

DynastyProcess / TradeBalancer:
- https://calc.dynastyprocess.com/
- https://dynastyprocess.com/values/
- https://tradebalancer.com/methodology
- https://tradebalancer.com/terms

**VERIFIED FACT.** DynastyProcess transforms FantasyPros dynasty ECR onto an explicit value curve and its ecosystem supports additive trade comparison. TradeBalancer documents GPL-3.0 lineage and attribution.

**R&D conclusion.** Rights are clearer, but the values are dynasty/long-term. Using them for an in-season redraft helper would answer the wrong product question.

## 4. What current TCW rankings/projections can and cannot support

| Input | Roster utility / lineup impact | Team needs / depth | Replacement/VORP | Market/package asset value | Buy-low/sell-high |
| --- | --- | --- | --- | --- | --- |
| ESPN current-week projections | YES, source-specific with coverage | YES, as one utility lens | YES, with connected-league context | NO | NO by itself |
| External weekly/future projected points | YES, when identity/scoring/coverage complete | YES | YES, source-bounded | NO | NO by itself |
| FantasyPros ROS ordinal rankings | Advisory YES | YES, ordinal context | Only if Strategy defines a separate rank-based method; not automatic | NO | Only as one non-market evidence stream |
| FantasyPros SOS stars | Context only | Bye/playoff schedule context | NO | NO | NO |
| ECR-vs-ADP | Context only | Limited | NO | NO | Not a live trade market; cannot by itself prove buy-low/sell-high |
| Generic 'restOfSeasonValue' schema field | UNKNOWN until source contract | UNKNOWN | UNKNOWN | NO authority from field name alone | NO authority |

## 5. Buy-low / sell-high feasibility

### Verdict

**OPPORTUNITY_UNVERIFIED**

A defensible protocol is technically possible, but current source authority is insufficient to ship the label.

### Why unit separation matters

Market/trade values and projected lineup points are different units. TCW must never compute:

'market value - projected points'

or normalize them into a hidden common score merely to manufacture a divergence number.

### Bounded protocol that could be Strategy-reviewed later

Required market evidence:
- approved provider;
- provider player ID and mapped ESPN ID;
- current asset value;
- prior asset value from the same provider and same league-format settings;
- current/prior timestamps;
- market direction: UP / FLAT / DOWN under a Strategy-approved relative/absolute change threshold;
- optional provider trend/volatility if documented.

Required forward-utility evidence:
- TCW current-week lineup delta;
- complete selected-future-window mean weekly lineup delta and direction when available;
- complete playoff-window direction when available;
- depth/bye/replacement context;
- source coverage/confidence.

Possible evidence-only divergence states:
- 'MARKET_DOWN_UTILITY_UP';
- 'MARKET_UP_UTILITY_DOWN';
- 'MARKET_AND_UTILITY_ALIGNED';
- 'INSUFFICIENT_EVIDENCE'.

These states compare **directions**, not raw units.

R&D does not recommend calling the first state 'BUY LOW' or the second 'SELL HIGH' until Strategy/Manager approve:
- the market-value source;
- the history window;
- the meaningful-change threshold;
- minimum utility confidence/coverage;
- wording that avoids predicting price convergence or future performance.

FantasyCalc is particularly interesting for this future work because it exposes market-derived current values and trends from real trades. FantasyPros weekly chart 'Change' is another possible provider-owned market/value change signal if Manager approves its source boundary.

## 6. ESPN received/pending trade-offer read-only feasibility

### Product-level ESPN behavior

Official ESPN support:
- https://support.espn.com/hc/en-us/articles/115003850391-Proposing-and-Accepting-Trade-Offers
- https://support.espn.com/hc/en-us/articles/360000094091-Trade-Review
- https://support.espn.com/hc/en-us/articles/115003850331-How-does-the-Trade-Deadline-work

**OFFICIALLY SUPPORTED / VERIFIED FACT.**
- submitted offers appear as pending moves;
- received offers can be reviewed and accepted/declined in ESPN UI;
- unanswered offers expire after the configured period;
- accepted trades may enter league review;
- trade deadline/review rules affect state.

This proves that pending-offer state exists in ESPN's product. It does not document a public read API.

### Internal read interface

Community evidence:
- 'mPendingTransactions' appears in long-running community lists of ESPN Fantasy football views;
- an espn-api project issue captured a real 'pendingTransactions' response from ESPN Fantasy basketball with transaction ID, accepted/expiration dates, pending flag, team IDs, player IDs and trade items;
- current espn-api football transaction reads use the undocumented 'mTransactions2' view for transaction history, but that is not proof that current football pending offers are reliably represented there.

Sources:
- https://github.com/cwendt94/espn-api/issues/500
- https://gist.github.com/nntrn/ee26cb2a0716de0947a0a4e9a157bc1c
- https://github.com/cwendt94/espn-api/blob/master/espn_api/football/league.py

Classification:
- ESPN product pending-offer UI: **OFFICIALLY SUPPORTED**.
- 'mPendingTransactions' view exists in community ESPN Fantasy endpoint documentation: **OBSERVED BUT FRAGILE**.
- Pending-trade shape with team/player IDs and expiry: **OBSERVED AND REPRODUCIBLE for community basketball evidence; INFERRED for current 2026 football until field-observed**.
- Reliable automatic TCW ingestion of current received football offers: **UNKNOWN / NOT ESTABLISHED**.
- Current TCW companion support: **VERIFIED ABSENT**; it requests only mTeam, mRoster, mMatchup and mSettings plus availability/scoreboard reads.

### Authentication / privacy boundary

Any future automatic read would have to remain inside the existing companion's authenticated ESPN session boundary. Cookies must remain inside extension fetch credentials and never enter page JavaScript, snapshots, logs, tests, GitHub evidence or sync payloads.

A future pending-offer capture should normalize only the minimum facts needed:
- offer/transaction identifier if ESPN supplies one;
- observed state and observed timestamp;
- expiration/review timestamp if supplied;
- proposing/receiving team IDs;
- player IDs and direction per team;
- optional pick IDs only if ESPN exposes supported redraft/keeper trade assets;
- no member names, emails, cookies, messages or raw payload storage.

### Failure/freshness behavior

- If the pending view is absent, malformed, unauthorized, or contains an unknown state, TCW must not claim 'no offers'; it should report offer ingestion unavailable/unverified.
- An offer must be re-read before analysis is represented as current; pending offers can be accepted, declined, expire, be vetoed, or advance to review.
- Historical 'mTransactions2' trade activity cannot substitute for proof that an offer is still pending.
- No read result authorizes a write action.

### Manual reconstruction fallback for TCW-037

Until current football automatic ingestion is field-proven, the minimum safe fallback is:

1. user selects **Received offer** or **Sent offer**;
2. user selects the other ESPN team from the connected league;
3. user selects outgoing ESPN player IDs from the user's current roster;
4. user selects incoming ESPN player IDs from the other team's current roster;
5. optional: user records ESPN-displayed offer expiration/review deadline if visible;
6. user confirms **I observed this offer as pending in ESPN now**;
7. TCW stores an observation timestamp and labels the proposal **MANUAL ESPN OFFER RECONSTRUCTION**;
8. if roster ownership no longer matches on refresh, analysis is stale/invalidated;
9. no accept/decline/propose button is created.

This fallback is sufficient to feed the existing read-only hypothetical Trade Analyzer without inventing endpoint stability.

## 7. League-wide opportunity matching prerequisites

### Already sufficient or substantially available

**VERIFIED FACT from current ESPN normalization:**
- all ESPN teams returned by the league response;
- every returned team's roster entries and ESPN player IDs;
- lineup settings including supported QB/RB/WR/TE/FLEX/OP/DST/K/BE/IR slots;
- roster size and supported position limits;
- current team records/acquisition context;
- current-week ESPN player projections where ESPN supplies them;
- current matchup/schedule context;
- current external weekly/future projections with explicit identity-map and coverage gates;
- current available-player replacement context from the companion's availability read.

This is enough to construct structural roster supply/need features for every team without guessing preferences.

### Missing or insufficient for a trustworthy opportunity finder

1. **Approved package asset-value source** — blocking for generic value-balanced candidate generation.
2. **Manager preferences / untouchables / positional intent** — repository search found no existing trade-preference or untouchable model. TCW must not infer willingness from roster shape.
3. **Opponent-manager acceptance model** — explicitly unauthorized; no probability model.
4. **Current trade deadline/review processing authority** — official ESPN product rules exist, but current TCW normalized snapshot does not yet carry a reviewed trade-rule contract.
5. **Complete free-agent universe guarantee** — current companion requests up to 100 available/waiver players; useful replacement context, but not proof of a complete ESPN player pool.
6. **Automatic pending-offer read contract** — not established.
7. **Source freshness alignment** — value, ESPN roster, projections and replacement context need independent timestamps and stale policies.
8. **Cross-source identity** — every value/projection asset needs explicit ESPN ID mapping; display-name matching must not become authority.

### R&D recommendation for later matching

A future matcher may identify **structural complementarity** from roster shape (for example, one roster has surplus legal WR/FLEX cover while another has an RB contingency gap), but it must keep three outputs separate:
- package asset-value balance from the approved value source;
- each team's roster consequence from TCW deterministic lineup/depth logic;
- manager-to-manager plausibility as a non-probabilistic explanation based only on observable needs/preferences.

Do not call a generated proposal 'likely to be accepted' absent a separately approved acceptance model.

## 8. Numeric package share contract if Manager approves a source

For a source that Manager explicitly approves as comparable and additive:

- map each trade asset to exactly one current source value;
- values must be finite and non-negative under that source's published semantics;
- missing/unmapped/ambiguous assets make package value unavailable;
- sum source values independently by side;
- if both side totals are zero, withhold the split;
- relative share is 'sideValue / (sideAValue + sideBValue)';
- the accepted inclusive 45–55 share band is then applied as **TCW policy**, not as provider calibration;
- outside the band, the larger source-value side may be labeled the package-value winner;
- the share is never win probability, performance probability, or acceptance probability;
- roster utility, depth, replacement, current points, future points and playoff effects remain separate outputs and must not be added to the package-value numerator/denominator.

R&D is documenting the math implied by accepted TCW-032 semantics, not inventing a new valuation model.

## 9. Stale / missing / zero / negative handling for any approved value source

Minimum source contract recommended to Manager:

- **missing/unmapped:** fail closed for package winner/split;
- **ambiguous identity:** fail closed;
- **NaN/infinite:** invalid source row, fail closed;
- **negative:** unsupported unless the provider explicitly documents negative asset value; otherwise fail closed;
- **zero:** preserve only when explicitly published by provider; do not convert missing to zero;
- **inactive/retired/out-of-league:** use provider value only when provider explicitly still publishes the asset in the selected redraft source; otherwise missing;
- **stale:** show source age and withhold winner/split once provider-specific freshness policy is breached;
- **mixed source/settings:** never add values from different providers, scoring modes, league-size modes, or capture vintages in the same package split;
- **partial package:** no split from known assets only.

## 10. Exact unresolved Manager decisions

1. Whether a **manual/browser-local FantasyPros weekly redraft trade-value import** is acceptable under the project's personal-use posture and FantasyPros terms, with no automated scrape or bundled dataset.
2. Whether the current FantasyPros chart's provider-defined base scoring assumptions are sufficient for TCW v1 or require an explicit PPR-family-specific source before approval.
3. Whether to contact/license **RedraftCalc** or **FantasyCalc** for a stable programmatic data contract; R&D ranks RedraftCalc highest on published additive semantics and FantasyCalc highest on observed market/identity potential.
4. Whether TCW-034 may be activated only after one source is approved, or whether Builder may implement the source-agnostic fail-closed plumbing while the actual source remains disabled. R&D does not activate Builder.
5. Whether later buy-low/sell-high work should use market **directional divergence** rather than cross-unit arithmetic; Strategy still needs to approve thresholds/wording.
6. Whether a future ESPN-offer research/field task should test 'mPendingTransactions' against a real 2026 football offer before any automatic ingestion task is created.

## 11. Recommendation to Manager

### Package-value source

**Verdict: MANAGER_DECISION_REQUIRED**

Preferred short path if Manager accepts the rights/format constraints:
- approve **FantasyPros weekly redraft Trade Value Chart as a user-supplied/manual local source only**;
- never bundle or scrape the chart;
- capture provider/date/week/mode metadata;
- require explicit ESPN identity mapping and complete package coverage;
- fail closed on stale/missing/mixed-format values.

Preferred longer-term path:
- obtain explicit programmatic-use authority from **FantasyCalc or RedraftCalc** and then perform a small source-contract validation before production integration.

If Manager is not comfortable with either path, retain TCW-032 winner/split as withheld; do not synthesize values from current rankings or projections.

### Buy-low / sell-high

**OPPORTUNITY_UNVERIFIED.** The architecture can compare market direction to forward roster utility as separate dimensions, but it needs an approved market source plus Strategy-defined divergence thresholds before user-facing labels.

### ESPN pending offers

**Automatic current-football ingestion: UNKNOWN / NOT ESTABLISHED.**  
Official ESPN UI behavior is supported; undocumented 'mPendingTransactions' evidence is promising but fragile and not field-verified for current football. Use manual offer reconstruction until a real read-only 2026 football observation is independently reproduced.

### TCW-034 readiness

**REMAINS BLOCKED pending Manager source-authority decision.**

TCW-033 resolves the research uncertainty enough for Manager to choose a bounded path; it does not itself grant source authority.

## 12. External source list

Primary/current provider sources reviewed:
- FantasyPros Week 2 2026 redraft values: https://www.fantasypros.com/2026/09/fantasy-football-trade-value-chart-week-2-2026/
- FantasyPros API data: https://www.fantasypros.com/api-data/
- FantasyPros API access/licensing: https://support.fantasypros.com/hc/en-us/articles/49749297704475-How-do-I-request-access-to-the-FantasyPros-API
- FantasyPros site terms: https://www.fantasypros.com/about/legal/
- FantasyPros API terms: https://api.fantasypros.com/public/v2/terms-of-use
- FantasyPros football additivity precedent: https://www.fantasypros.com/2020/11/week-9-fantasy-football-trade-chart-2020/
- FantasyCalc: https://fantasycalc.com/
- FantasyCalc trade database: https://fantasycalc.com/database
- FantasyCalc trade targets/trends: https://fantasycalc.com/trade-targets
- RedraftCalc: https://www.redraftcalc.com/
- RotoTrade: https://www.rototrade.com/fantasy-football-trade-analyzer
- KeepTradeCut terms: https://keeptradecut.com/terms-and-conditions
- DynastyProcess calculator: https://calc.dynastyprocess.com/
- DynastyProcess values methodology: https://dynastyprocess.com/values/
- TradeBalancer open-data methodology/terms: https://tradebalancer.com/methodology and https://tradebalancer.com/terms
- ESPN proposing/accepting offers: https://support.espn.com/hc/en-us/articles/115003850391-Proposing-and-Accepting-Trade-Offers
- ESPN trade review: https://support.espn.com/hc/en-us/articles/360000094091-Trade-Review
- ESPN trade deadline: https://support.espn.com/hc/en-us/articles/115003850331-How-does-the-Trade-Deadline-work
- Community pending-transaction evidence: https://github.com/cwendt94/espn-api/issues/500
- Community football view list: https://gist.github.com/nntrn/ee26cb2a0716de0947a0a4e9a157bc1c

## 13. Scope statement

This document is **research only**. It does not:
- approve a provider;
- change production code;
- pass FV-SEASON-01;
- authorize ESPN writes;
- authorize acceptance probability;
- activate TCW-034;
- claim Trade Analyzer V2 is complete.
