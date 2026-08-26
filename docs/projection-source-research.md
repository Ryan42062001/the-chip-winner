# In-season data source research

Last reviewed: 2026-08-26

## Decision

The Chip Winner should trial **FantasyPros consensus projections** as its first independent forecast source, while keeping ESPN projections visible as the league-platform baseline. It should use **nflverse/nflfastR data for historical evaluation**, subject to the upstream data owners' terms. If the product needs a commercial, supported feed for live statistics, injuries, or broader production use, **SportsDataIO** is the leading operational alternative to evaluate.

For a user-supplied rest-of-season file, the practical first choice is the **FantasyPros ROS consensus CSV**. FantasyPros' 2025 results named Justin Boone of Yahoo the most accurate weekly in-season ranker, followed by Patrick Thorman of Establish The Run. That result measures weekly start/sit rankings—not ROS rankings or exact point projections. A downloadable Boone ROS CSV was not verified. Establish The Run advertises subscriber ROS Top 150 rankings, but its public product information does not promise CSV export. FantasyPros' ROS consensus page explicitly provides a CSV download and Standard, PPR, and Half-PPR variants.

This is a recommendation to test, not a claim that one provider is universally the most accurate. Projection accuracy varies by week, position, scoring rules, and the time at which a forecast is captured. The app must measure providers using snapshots taken before kickoff and the connected league's scoring rules.

## Shortlist

| Source | Best use | Evidence and access | Decision |
| --- | --- | --- | --- |
| ESPN | League state and baseline weekly projection | Already connected; projections use ESPN's player identities and league context. ESPN remains authoritative for this app's roster, matchup, availability, and settings. | Keep as baseline, never silently replace it. |
| FantasyPros | Consensus weekly rankings/projections | FantasyPros publishes an in-season expert accuracy methodology and accuracy results. Its developer portal exists, but production access and redistribution rights must be confirmed before integration. Consensus is attractive because it reduces dependence on one forecaster. | First external forecast trial, after API access is approved. |
| FantasyPros ROS CSV | User-imported rest-of-season consensus | The ROS rankings page explicitly offers CSV export for Standard, PPR, and Half-PPR. This is the most practical manual input, although the consensus itself was not declared the winner of the weekly expert contest. | First manual ROS import format. |
| Justin Boone / Yahoo | Weekly expert rankings and ROS trade values | Ranked first overall in FantasyPros' completed 2025 in-season accuracy contest, with nine career top-10 finishes. A downloadable unified ROS CSV was not verified. | Useful benchmark; do not scrape Yahoo pages. |
| Patrick Thorman / Establish The Run | Weekly rankings and subscriber ROS Top 150 | Ranked second in 2025 and top four for four consecutive seasons; ETR advertises ROS Top 150 rankings to subscribers. Public product information does not promise CSV export. | Strong challenger if licensed/exportable data becomes available. |
| Fantasy Points Data Suite | Rich projections and advanced football data | Commercial data product with projections and supporting football data. Useful as a challenger source, particularly if it supplies floor/ceiling or historical forecast snapshots under license. | Request sample/schema and pricing; benchmark before adoption. |
| SportsDataIO | Supported commercial NFL stats, injuries, projections, and IDs | Official developer documentation advertises scores, stats, projections, news, images, and API-key access. It offers a broader operational feed than a rankings-only source. | Best commercial fallback or complementary live-data feed. |
| nflverse / nflfastR | Historical actuals and model evaluation | Open-source tooling exposes play-by-play data back to 1999. Its documentation explicitly notes that the underlying NFL data remains governed by its owners' terms. It is not a forward-projection service. | Use for internal research/backtesting only after terms review. |
| 4for4, Establish The Run, PFF, FTN | Editorial rankings and projections | Strong fantasy brands, but a consumer subscription or web page is not permission to automate, republish, or redistribute their data. Public integration terms were not established in this review. | Do not scrape. Reconsider only with a licensed API/feed. |

## Accuracy standard

The app should select sources from measured results rather than reputation. For every source and weekly cutoff, retain the original provider value and metadata, then evaluate:

- mean absolute error and root mean squared error by position;
- start/sit decision accuracy for realistic same-position choices;
- top-12/top-24 classification precision and recall;
- calibration of supplied floor and ceiling ranges;
- coverage, identity-match rate, update latency, and stale-data rate;
- results under the exact ESPN league scoring settings.

Evaluate regular-season weeks separately from playoffs and report sample sizes. Never use a projection updated after a player's kickoff to score that forecast. A provider can win one position without becoming the default for every position.

## Integration rules

1. ESPN continues to own league state. Projection providers cannot change roster membership, player availability, lineup eligibility, or matchup state.
2. Store each provider's values independently. A consensus value, if later introduced, is derived data and must name its inputs.
3. Join only through explicit provider IDs in the identity registry. Unresolved records cannot influence recommendations.
4. Preserve source, fetched time, provider update time, scoring format, week/season, and forecast cutoff.
5. Show missing data as unavailable. Do not infer floor, ceiling, injury status, rankings, or projections.
6. Keep API keys outside the repository and browser-delivered bundle. A production integration that requires a secret needs a server-side proxy.
7. Confirm commercial use, caching, display, and redistribution rights before enabling any third-party feed on the public site.

## Rollout

### Imported file received on 2026-08-26

`FantasyPros_2026_Draft_ALL_Rankings (1).csv` was inspected locally and was not copied into the repository. It contains 361 records with overall rank, player name, team, positional rank, season/playoff schedule-strength stars, and ECR-versus-ADP. Its filename identifies it as a Draft ALL Rankings export, and the contents do not carry an ROS marker, scoring format, selected expert names, update time, or FantasyPros player IDs. The app must therefore treat it as a preseason draft-ranking baseline—not a live ROS ranking set—and require identity reconciliation before using it in recommendations.

`FantasyPros ROS Rankings 2026.csv` was then supplied by the user with explicit provenance: **2026 rest-of-season rankings using FantasyPros' top-10 expert filter**. It contains 707 records and the same ranking columns. This file has been superseded for integration purposes by the scoring-specific export below.

`FantasyPros ROS PPR Rankings.csv` is the authoritative supplied import: **2026 rest-of-season PPR rankings using FantasyPros' top-10 expert filter**, downloaded on 2026-08-26. It contains 361 records. The CSV format itself does not embed ranking type, expert filter, scoring format, update time, or provider player IDs, so those settings are retained as user-supplied import metadata. The source file remains outside the repository and requires identity reconciliation before recommendation use.

### Stage 1 — access and schema

- Ask FantasyPros for documented API access and explicit public-display/caching terms.
- Ask Fantasy Points for a sample response, historical forecast availability, scoring-format support, and licensing terms.
- Obtain a SportsDataIO trial only if broader live stats/injuries are needed.

### Stage 2 — shadow mode

- Import pre-kickoff weekly files without changing recommendations.
- Reconcile identities and expose coverage/conflicts in the source-health view.
- Retain ESPN and candidate values side by side.

### Stage 3 — bake-off

- Score at least four representative regular-season weeks before allowing an external source to drive recommendations.
- Continue evaluation through a full season before making strong accuracy claims.
- Choose defaults by position and scoring format only when the sample supports it.

### Stage 4 — recommendation use

- Allow a qualified source to power projected-points mode.
- Enable floor/upside modes only when the provider supplies those fields.
- Fall back visibly to ESPN or “unavailable”; never synthesize missing values.

## Primary references

- [FantasyPros in-season accuracy methodology](https://www.fantasypros.com/about/faq/football-inseason-accuracy/)
- [FantasyPros NFL accuracy results](https://www.fantasypros.com/nfl/accuracy/)
- [FantasyPros 2025 most accurate in-season experts](https://www.fantasypros.com/2026/01/2025-fantasy-football-rankings-most-accurate-experts/)
- [FantasyPros downloadable PPR ROS consensus](https://www.fantasypros.com/nfl/fantasy-football-rankings/ros-ppr-overall.php)
- [Establish The Run subscription contents](https://subscribe.establishtherun.com/nfldraftkitpro/)
- [FantasyPros public API documentation](https://api.fantasypros.com/public/v2/docs/)
- [Fantasy Points Data Suite](https://www.fantasypoints.com/data-suite)
- [SportsDataIO NFL API documentation](https://sportsdata.io/developers/api-documentation/nfl)
- [nflverse documentation](https://nflverse.nflverse.com/)
