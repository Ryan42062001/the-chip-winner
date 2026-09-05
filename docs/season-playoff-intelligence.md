# Season and playoff intelligence

Release baseline: **v0.9.70**

The Chip Winner keeps season and playoff planning split into independently sourced lenses. There is no composite playoff score and no source is allowed to overwrite another source's facts.

## Source boundaries

### ESPN league facts

ESPN remains authoritative for:

- the selected fantasy roster and lineup slots;
- player position eligibility already normalized into the snapshot;
- player bye weeks when ESPN supplies them;
- fantasy-league matchups;
- fantasy playoff weeks when ESPN explicitly reports them.

When ESPN reports playoff weeks, they override any older browser-local playoff-week preference. A local league-and-season-scoped playoff selection is only a fallback when ESPN omits the playoff-week field.

The playoff-opponent card shows ESPN fantasy opponents only. It is not an NFL defensive matchup grade and is not a prediction of winning the fantasy matchup.

## Bye-week coverage

Bye coverage asks a narrow deterministic question: after removing active roster players with an explicitly reported bye in a given future week, can the remaining non-IR roster legally fill every configured starter slot?

The calculation uses the same supported slot-eligibility rules as the lineup engine. It computes the maximum number of starter slots that can be filled rather than assuming the current assignment must remain fixed.

When multiple maximum legal assignments exist, the engine does not pretend one slot is uniquely uncovered. It reports:

- the number of starter slots that cannot be filled; and
- every slot type that could be affected across equally valid maximum assignments.

For example, if a single remaining RB can occupy either an RB slot or FLEX, the app may report `1 uncovered starter slot · could affect FLEX or RB depending on legal slot assignment` instead of arbitrarily claiming that RB or FLEX alone is the problem.

A missing bye week remains unknown. It is never treated as proof that the player is available that week.

## Projection-gated playoff window

The playoff projection window uses only the currently compatible, explicitly mapped future weekly projection set. In the zero-cost browser workflow this is normally the retained DynastyProcess weekly data whose provider IDs have passed the existing identity-map rules.

For each configured playoff week, The Chip Winner reruns the legal lineup optimizer using that week's mapped projections. A weekly value is considered usable only when the entire baseline roster has complete mapped player-week coverage.

The following aggregate fields are withheld unless **every configured playoff week** is complete:

- playoff-window total;
- average projected week;
- highest projected week;
- lowest projected week;
- starters retained across every selected playoff week;
- starter turnover between adjacent playoff weeks.

Partial weeks are never summed and missing projections are never converted to zero.

Current ESPN transaction locks are not copied into future weeks as invented future kickoff facts. Explicit ESPN locked states remain respected where applicable, but the projection source does not supply authoritative future Week N kickoff timestamps.

## FantasyPros strength-of-schedule overlay

The existing user-imported FantasyPros rest-of-season CSV may contain explicit `SOS SEASON` and `SOS PLAYOFFS` star fields. v0.9.70 exposes those values as an optional advisory layer.

FantasyPros currently describes its 2026 fantasy Strength of Schedule as position-specific and based on opponents' Fantasy Points Allowed to the position, adjusted for strength of schedule. Its matchup calendar also presents 1-to-5-star matchup ratings, with more favorable matchups receiving better ratings.

Reference pages reviewed for v0.9.70:

- https://www.fantasypros.com/nfl/strength-of-schedule.php
- https://www.fantasypros.com/nfl/matchups/rb.php
- https://www.fantasypros.com/nfl/matchups/wr.php
- https://www.fantasypros.com/nfl/matchups/qb.php
- https://www.fantasypros.com/nfl/matchups/te.php

The Chip Winner does **not** scrape those pages, reproduce the underlying schedule table, recompute the FantasyPros methodology, or convert the imported star values into a hidden score.

The imported ROS CSV does not provide an explicit week range proving what `SOS PLAYOFFS` means for that export. Therefore:

- the app labels it **FantasyPros playoffs** rather than this league's playoff schedule;
- it does not claim the rating corresponds exactly to the ESPN league's configured playoff weeks;
- it does not use the value to alter ESPN facts or DynastyProcess weekly projected totals;
- missing stars remain unavailable rather than becoming neutral.

The current display-only bands are deterministic labels over the explicit imported star value:

- 4–5 stars: `favorable`
- 3 stars: `neutral`
- 1–2 stars: `difficult`
- missing/invalid: unavailable

These labels are UI interpretation of the source's explicit star scale, not a probability, point projection, or proprietary recomputation.

## What this release deliberately does not claim

v0.9.70 does not:

- predict fantasy playoff qualification or championship probability;
- infer fantasy playoff weeks from schedule length or matchup numbering;
- derive NFL defensive strength from ESPN fantasy opponents;
- sum incomplete future projection windows;
- infer missing bye weeks;
- scrape or silently refresh FantasyPros SOS data;
- claim an imported `SOS PLAYOFFS` value matches the exact ESPN playoff-week selection;
- combine ESPN schedule facts, future projections, and SOS stars into one opaque winner score.

## Validation

The deterministic regression matrix covers:

- known bye coverage with legal bench replacement;
- uncovered starter capacity after byes;
- ambiguous RB/FLEX assignment without a false unique-slot claim;
- unknown bye weeks remaining partial;
- complete and incomplete playoff projection windows;
- aggregate withholding on any blocked playoff week;
- stable-starter and adjacent-week turnover summaries only under complete coverage;
- imported SOS stars remaining separate and preserving missing values;
- ESPN fantasy matchup coverage with missing playoff weeks;
- HTML escaping and explicit source labels in the Season view;
- ESPN-reported playoff weeks taking precedence over local fallback.
