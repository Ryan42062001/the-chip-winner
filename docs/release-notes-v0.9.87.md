# v0.9.87 — Lineup confidence metric clarity

## Summary

v0.9.87 fixes a misleading Lineup Lab confidence display found during `FV-ESPN-01` field validation.

The Start/Sit confidence model already measured two different things: field completeness for the two compared players, and the freshness of the ESPN snapshot. The prior UI combined both into one percentage and labeled that number `% complete`. With all player fields present but an aging snapshot, the result appeared as `94% complete`, even though the comparison itself was actually 100% complete.

## Changes

- Start/Sit confidence now keeps its overall confidence score and field-completeness score separate.
- The UI displays the field-completeness score after `% complete`.
- Snapshot freshness is shown explicitly as its own status instead of silently lowering the completeness percentage.
- A fully populated comparison from an aging snapshot now displays `100% complete` with `Snapshot freshness: aging.`
- Missing projection, injury, opponent, or kickoff fields still reduce completeness normally.
- Snapshot freshness still affects the High/Medium/Low data-confidence label, so stale data is not treated as equally trustworthy just because its fields are populated.

## Safety boundary

This release does not change ESPN projections, FantasyPros/DynastyProcess projections, lineup optimization, action thresholds, player eligibility, roster state, IR handling, or recommendation selection. It only corrects how existing data-quality dimensions are calculated and presented.
