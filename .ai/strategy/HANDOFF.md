# In-Season Strategy Handoff

HANDOFF

Task ID: TCW-022  
Role: In-Season Strategy & Decision Intelligence Analyst  
Status: REWORK COMPLETE / EXACT-HEAD CI PENDING

## Verified starting state

- Repository: `Ryan42062001/the-chip-winner`
- Canonical branch: `master`
- Fast Refresh master: `6cd89dd7bacf6331b55dff17f39cdc01f8e37afc`
- Existing Strategy branch: `strategy/tcw-022-trade-analyzer-policy`
- Existing Strategy PR: `#106 — TCW-022 Trade Analyzer v1 Strategy Contract`
- Workflow: canonical V3.1 overlay active.
- `.ai/shared/ACTIVE_TASKS.json` is machine-authoritative and records TCW-022 as `REWORK_REQUIRED`, owner `Strategy`, dependency `INDEPENDENT`, execution mode `STANDARD_CHAT`, merge authority `Manager`.
- Manager review comment on PR #106 was verified and contains exactly two bounded blockers: undefined future/multiweek materiality and conclusion precedence that could hide a supported cross-horizon cost.
- `master` advanced one commit from the original Strategy base. Compare evidence shows that advance changes only `.ai/manager/tasks/TCW-022.md` and `.ai/shared/ACTIVE_TASKS.json`; target advancement is therefore `CONTROL_PLANE_ONLY` and non-overlapping with Strategy-owned artifacts.

## Work completed

Bounded rework was applied only to `.ai/strategy/TCW-022_TRADE_ANALYZER_POLICY.md`.

### Finding 1 — deterministic future/multiweek materiality

Resolved with an inspectable per-week normalization rule:

- complete selected future window: `HorizonMeanWeeklyDelta = HorizonDelta / SelectedWeekCount`;
- complete playoff window: `PlayoffMeanWeeklyDelta = PlayoffWindowDelta / PlayoffWeekCount`;
- `UPGRADE` at mean `>= +1.0` projected point/week;
- `DOWNGRADE` at mean `<= -1.0` projected point/week;
- `TOSSUP` when absolute mean `< 1.0`;
- `UNKNOWN` whenever required horizon coverage is incomplete.

The raw aggregate remains visible. Direction uses the mean weekly delta so longer windows do not become material merely because they contain more weeks. This normalization occurs only within one named source and one homogeneous weekly horizon. Current week, future, playoff, and different projection sources are never averaged together.

### Finding 2 — conclusion precedence

Resolved by making horizon direction and precedence explicit:

- each horizon must be source-resolved before it can drive a generic direction conclusion;
- supported future/playoff directions reduce to `UPGRADE`, `DOWNGRADE`, `TOSSUP`, `MIXED`, or `UNKNOWN` using directions only, never numeric cross-horizon weighting;
- `DANGEROUS_POSITIONAL_FRAGILITY` remains the narrow structural top guard;
- short-term/long-term material conflict labels are evaluated before generic upgrade/depth labels;
- `CLEAR_TEAM_UPGRADE` cannot apply when current week is a material downgrade or any supported long-term state is `DOWNGRADE`/`MIXED`;
- `STARTER_UPGRADE_DEPTH_COST` cannot apply when a supported long-term `DOWNGRADE`/`MIXED` exists;
- incomplete future evidence is `UNKNOWN`, not a fabricated conflict.

Scenario E now deterministically produces `LONG_TERM_GAIN_SHORT_TERM_COST`. New inverse Scenario K deterministically produces `SHORT_TERM_GAIN_LONG_TERM_COST`. Scenario L proves that raw multiweek aggregate magnitude alone cannot manufacture materiality.

## Evidence produced

- Revised `.ai/strategy/TCW-022_TRADE_ANALYZER_POLICY.md`
- Policy rework commit: `9dcb5b4ee111afceb8050aefffb2ff2f66dd7cb9`
- Existing Manager review comment on PR #106 verified before rework.
- Existing PR #106 retained; no replacement PR created.

## Files updated

- `.ai/strategy/TCW-022_TRADE_ANALYZER_POLICY.md`
- `.ai/strategy/HANDOFF.md`

No production code, UI, data source, Manager-owned coordination file, or ESPN transaction behavior was changed.

## Open findings

- Blocking R&D dependency: **NONE** for this bounded rework.
- Existing non-blocking future R&D questions remain unchanged: ESPN trade-processing legality, opponent acceptance/market modeling, calibrated playoff probability, and new injury/news sources.

## Blocking issues

- Exact-head CI has not yet completed for the reworked PR head. Strategy must not return `MANAGER_REVIEW_READY` until the full required PR CI passes at the exact current head.

## Recommended next role

Strategy remains active only through exact-head CI validation. After a green exact-head run, Manager / Architect is next.

## Exact next action

Verify PR #106 current head, run/observe the full required CI at that exact head, then update this handoff to `MANAGER_REVIEW_READY` with the verified run evidence. Strategy must not merge PR #106.

## Checkpoint / SHA

- Current canonical master: `6cd89dd7bacf6331b55dff17f39cdc01f8e37afc`
- Original Manager-reviewed Strategy head: `a97ef2ddd74eda11494d9036180d3a89faf036bc`
- Bounded policy rework commit: `9dcb5b4ee111afceb8050aefffb2ff2f66dd7cb9`
- Current Strategy PR head: verify after this handoff commit.
