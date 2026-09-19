# TCW-033 — Manager Value-Source Decision

Date: 2026-09-19
Manager / Architect
Research input: `.ai/rnd/TCW-033_TRADE_INTELLIGENCE_DATA_RESEARCH.md`
R&D final head: `1f4d2f8671d60b26a873e7a11d84dc4ff6dc899c`
R&D PR: #145
R&D PR workflow #647 / run `35453462402`: PASS
R&D integration master: `2124602b0eb884fc9a6db407e4feb3b3f9afbf5a`
R&D integration workflow #648 / run `35453637719`: PASS

## Decision

R&D verdict `MANAGER_DECISION_REQUIRED` is **CONSUMED**.

### Automated provider authority

**REJECTED FOR NOW** for all researched external providers.

No researched provider currently has enough combined evidence on semantics, current package additivity, exact format conditioning, stable identity, operational contract, and production-use rights to become an automated authoritative TCW package-value dependency today.

Specific dispositions:

- **FantasyPros weekly redraft Trade Value Chart** — not approved as an automated/bundled feed. The current chart is useful and provider-authored, but the documented FantasyPros API exposes rankings/projections/players/news/injuries rather than this weekly chart, and site terms materially restrict copying/republication beyond personal use absent permission. The chart also does not currently expose a complete explicit PPR-family selector for its base values. Do not scrape, bundle, mirror, or silently ingest it.
- **FantasyCalc** — not approved for production automation. Market semantics and league-format controls are promising, but the endpoint/API contract and production-use authority remain insufficiently documented.
- **RedraftCalc** — not approved for production automation. Published semantics are unusually compatible with TCW because the provider says values add like auction budgets and supports 1QB/SF, standard/half/full PPR, TEP, and 8–16 teams, but no verified production API/identity/rights contract is established.
- **RotoTrade / dynasty-oriented alternatives** — not selected for v1 authority for the reasons documented in TCW-033.

This is a product/data-authority decision, not a legal opinion. A future provider can be reconsidered after explicit permission/licensing or a sufficiently documented stable contract.

## Approved bounded implementation path

**APPROVED: SOURCE-AGNOSTIC FAIL-CLOSED VALUE ENGINE.**

TCW-034 may implement:
- the accepted TCW-032 package-value data contract;
- a generic source adapter/contract capable of receiving a Manager-approved additive value source later;
- deterministic package summation/share/fairness behavior behind that authority gate;
- test-only synthetic approved-source fixtures to exercise `YOU_WIN / FAIR_TRADE / THEY_WIN`, 45–55 boundaries, source disagreement, missing/stale/invalid values, and unequal packages;
- all source-independent TCW-034 roster consequence behavior authorized by TCW-032.

The production approved-provider set is **EMPTY** at activation.

Therefore live production behavior MUST:
- return `packageValue.status = WITHHELD` (or mapped equivalent) when no Manager-approved provider is configured;
- return `winner = WITHHELD`;
- return no 57/43-style numeric split;
- explain that package value is unavailable because no approved value source is configured;
- continue to show independently supported roster/do-nothing/lineup/depth/horizon consequences where evidence is sufficient.

No current ranking, projection, ROS field, VORP, waiver value, ADP, or ordinal rank may be substituted for package asset value.

## Manual / local source path

A future user-supplied/manual local provider adapter is architecturally allowed, but **no named provider is approved by this decision for live package-winner authority**.

Builder may make the adapter contract capable of browser-local/manual data in the future, but TCW-034 must not add a UI that encourages copying/scraping a named provider or marks arbitrary user-entered numbers as authoritative.

Any later live manual provider requires a separate Manager-approved source contract specifying:
- provider/source identity;
- permitted acquisition mode;
- source date/week/version;
- league/scoring/mode compatibility;
- additive semantics;
- ESPN identity mapping;
- freshness policy;
- missing/zero/negative behavior;
- rights/usage boundary.

## TCW-034 activation decision

**AUTHORIZED — BOUNDED SOURCE-AGNOSTIC IMPLEMENTATION ONLY.**

TCW-034 is no longer blocked on research. It is blocked only from enabling live numeric package-value output without a separately approved provider.

Builder is authorized to implement and validate the engine contract while preserving the production fail-closed provider gate.

## Buy-low / sell-high

TCW-033's `OPPORTUNITY_UNVERIFIED` verdict is accepted.

Do not ship BUY_LOW / SELL_HIGH labels in TCW-034. A later Strategy/Manager decision must approve a market source, history window, meaningful-change thresholds, and wording.

## ESPN pending offers

TCW-033's result is accepted:
- ESPN product pending-offer behavior exists;
- automatic current-football pending-offer ingestion remains UNKNOWN / NOT ESTABLISHED;
- community `mPendingTransactions` evidence is not production authority.

TCW-034 does not implement offer ingestion. Later TCW-037 must use manual reconstruction unless a future field/research task establishes a reliable read-only current-football interface.

## Preserved boundaries

- ESPN remains read-only.
- No acceptance probability.
- No automatic trade action.
- `FV-SEASON-01` remains pending.
- Package-value fairness is separate from user-roster outcome.
- Inclusive 45–55 is TCW policy, not provider calibration.
- A test fixture proving winner math does not authorize a live provider.
