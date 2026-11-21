# TCW-P03 — Trade Value Source Decision

Date: 2026-09-29  
Manager / Architect  
Phase: TCW-P03 — Trade Value Source & Advantage Visualization  
Decision type: bounded product/data-authority decision; not legal advice

## Decision

**APPROVED: FantasyCalc manual/local redraft value source path.**

**NOT APPROVED: automated FantasyCalc API ingestion, scraping, bundled FantasyCalc datasets, or redistribution.**

The production provider array remains empty until the bounded manual/local adapter is implemented and validated. The approved path is user-supplied, browser-local evidence for a specific trade proposal.

The user may transcribe current FantasyCalc redraft player values from the provider's public UI into The Chip Winner for the exact players in the proposal. TCW stores the values locally only and does not commit or publish the provider dataset.

This decision does not grant or imply any broader provider license. If The Chip Winner later becomes publicly distributed, monetized, or uses an automated FantasyCalc endpoint/feed, provider terms and permission must be reviewed again before that path is enabled.

## Why FantasyCalc is the selected bounded source

Current provider evidence supports the core product semantics needed for a manual/local path:

- FantasyCalc publishes current **Redraft** trade values generated from real fantasy trades.
- Its trade-value chart supports league size, PPR level, Superflex/1QB, and TE-premium controls.
- FantasyCalc states that values update every few hours during the season.
- Its methodology derives player trade values from trade equations and recency-weighted market behavior.
- Its FAQ explicitly says tools/apps may integrate with FantasyCalc data subject to its usage policy.

The source is therefore suitable for a **user-observed/manual asset-value input** when the selected FantasyCalc profile matches the ESPN league configuration and every proposal asset is fully covered.

TCW does **not** claim that its raw-sum meter reproduces FantasyCalc's own trade-calculator verdict. FantasyCalc documents a waiver/bench adjustment for uneven packages. TCW intentionally keeps package asset value separate from roster-space, drop, lineup, and replacement consequences, which are already modeled independently by Trade Winner.

## Approved acquisition contract

Acquisition mode:

- manual/local only;
- values are entered by the owner for the players already selected in a Trade Winner proposal;
- no scraping;
- no undocumented endpoint;
- no automatic background fetch;
- no provider dataset committed to git;
- no provider values written into public fixtures except clearly synthetic test values.

Required source identity:

- `sourceId = fantasycalc-manual-redraft`
- provider label: `FantasyCalc`
- `mode = REDRAFT`
- unit: `fantasycalc-market-value`
- provenance independence group: `fantasycalc-market`
- additive: true for the bounded raw player-asset sum used by TCW;
- TCW must label the result as **package asset value**, not FantasyCalc's full calculator verdict.

Required capture metadata:

- local capture timestamp;
- source page/profile identified as FantasyCalc Redraft;
- league team count;
- PPR setting;
- QB format (1QB or Superflex);
- TE-premium setting;
- each entered asset's exact FantasyCalc value.

Freshness:

- maximum accepted age: 24 hours from local capture;
- future-dated capture timestamps beyond the existing 60-second skew allowance remain invalid;
- values from different capture sessions/vintages may not be mixed in one proposal.

## Compatibility rules

A manual source may become READY only when the chosen FantasyCalc profile matches the connected ESPN league on every supported dimension.

Required exact/bounded compatibility:

- redraft only;
- team count must match the connected league;
- reception scoring must be representable as Standard (0), Half-PPR (0.5), or PPR (1.0);
- QB profile must be explicitly resolved to 1QB or Superflex/2QB;
- TE-premium must match the provider profile when the league uses it;
- every traded asset must be a supported FantasyCalc player with a finite non-negative value.

Fail closed when:

- scoring is custom and cannot be represented by the available FantasyCalc profile;
- QB/Superflex semantics are ambiguous;
- TE-premium semantics are ambiguous or incompatible;
- an asset is a K, D/ST, pick, or other unsupported redraft asset;
- any player value is missing;
- any player mapping is ambiguous;
- values were captured under different provider profiles or vintages;
- capture metadata is incomplete or stale.

## ESPN identity boundary

ESPN stable player IDs remain authoritative.

The manual value entry UI must attach each entered value directly to the already-selected ESPN trade asset. It must not search or join by display name as the authoritative identity boundary.

The UI may show the ESPN player's display name for human confirmation, but the stored/manual source record is keyed by the selected ESPN player ID.

This avoids introducing a second cross-provider identity-join problem for the initial manual path.

## Package math

TCW may sum all source-backed player values on each side from the same compatible manual capture.

The existing TCW fairness contract remains:

- incoming share and outgoing share use exact unrounded source totals;
- inclusive 45–55 is FAIR;
- only values strictly outside the inclusive band may produce YOU_WIN or THEY_WIN;
- display rounding must never change the underlying classification.

Unequal-package roster-space / required-drop / replacement consequences stay separate. No FantasyCalc waiver adjustment is imported into the package-value number in this bounded path.

The UI must identify the meter as **FantasyCalc package asset value** and must not imply it reproduces FantasyCalc's own trade-calculator verdict.

## Withheld behavior

If the manual source fails any authority, freshness, compatibility, identity, completeness, or value rule:

- `packageValue.status = WITHHELD`;
- `winner = WITHHELD`;
- no numeric share is displayed;
- the meter remains neutral;
- the UI says `Value unavailable`;
- the specific reason remains inspectable.

Missing data never equals zero.

Roster impact, legality, depth, current/future horizon, and recommendation may still render independently when their own evidence is sufficient.

## Other researched candidates

### FantasyPros

Not selected for package-value source integration in TCW-P03.

Current FantasyPros public API officially exposes rankings, projections, player metadata, news, injuries, and related datasets, but not the current redraft Trade Value Chart / Trade Market Value dataset as a documented API endpoint.

FantasyPros also distinguishes personal/non-commercial API use from commercial access and imposes attribution/non-compete restrictions. Its current trade-value pages remain useful reference material, but TCW will not scrape or silently convert rankings/projections into package asset value.

### Stats Guy Fantasy

Strong documented API and data-use terms, including explicit redraft values, source timestamps, Sleeper IDs, and commercial use with attribution.

Not selected for the current TCW package-value authority because its public API currently exposes redraft primarily by 1QB vs Superflex format without an exact Standard/Half-PPR/PPR scoring selector. TCW will not weaken its scoring-compatibility gate to fit the source.

This source should be reconsidered if its API adds explicit reception-scoring profiles compatible with TCW's league contract.

### RedraftCalc

Semantically promising: it explicitly describes its player-value scale as auction-like and additive and supports 1QB/Superflex, Standard/Half/PPR, TEP, and 8–16 teams.

Not selected because a documented production API/access contract and sufficiently explicit integration/data-use permission were not established during this review. Do not scrape it.

### Dynasty Dealer / LeagueLogs-style redraft models

Not selected. Their redraft values are substantially projection/ADP-model-derived rather than a clean independent package trade-market source. TCW's existing contract explicitly prevents projections, ADP, ranks, or forward utility from being relabeled as package asset value.

## Builder authorization

The source gate is cleared **only for the bounded FantasyCalc manual/local path above**.

Builder may implement:

1. local manual value-entry state keyed by selected ESPN player IDs;
2. source-profile metadata controls;
3. strict compatibility/freshness/completeness validation;
4. integration through the existing `inspectTradeValueSource` / package-value engine contract;
5. the evidence-aware Trade Advantage meter;
6. synthetic and browser tests for READY, FAIR, YOU_WIN, THEY_WIN, missing, stale, incompatible, unsupported-asset, and mixed-vintage behavior.

Builder may not:

- call an undocumented FantasyCalc endpoint;
- scrape FantasyCalc;
- bundle provider values;
- persist provider values to a public backend;
- commit real provider values to repository fixtures;
- weaken source/freshness/identity/compatibility gates;
- enable a second named value provider without a new Manager source decision;
- implement ESPN writes or production deployment.

## Revisit triggers

Manager source review is required again before:

- automated provider fetching;
- public/provider-data redistribution;
- monetization/commercial use;
- a different named value source;
- provider terms materially change;
- FantasyCalc changes the relevant redraft value semantics/profile controls;
- TCW attempts to reproduce FantasyCalc's full calculator logic rather than raw package asset-value share.
