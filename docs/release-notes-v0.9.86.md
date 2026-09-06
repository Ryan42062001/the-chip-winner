# v0.9.86 — IR-aware projection coverage

## Summary

v0.9.86 makes projection readiness follow the roster state ESPN actually reports. A player already occupying an ESPN IR slot is not a legal lineup option while that state remains current, so a missing weekly projection for that IR occupant no longer makes the active roster look incomplete.

This was found during `FV-ESPN-01` on a real standard ESPN league: Isiah Pacheco was correctly rostered in IR, DynastyProcess had a stable ESPN/FantasyPros identity for him, but the current FantasyPros weekly feed did not publish a Week 1 projection for him. The previous planner therefore displayed 15/16 (94%) coverage and blocked future-only waiver discovery even though every non-IR roster player had a usable projection.

## Changes

- Projection coverage now uses the current non-IR ESPN roster as the required denominator.
- Current ESPN IR occupants are excluded from missing-mapping and missing-week coverage failures while they remain in IR.
- Season Plan can therefore report 15/15 (100%) active-roster coverage instead of 15/16 when the only missing weekly projection belongs to an IR occupant.
- Missing-input reports and the projection coverage matrix no longer flag a current IR occupant as an actionable projection gap.
- Future-only waiver discovery now requires complete selected-week projections for every current non-IR roster player rather than every player including IR.
- Scenario evaluation follows the same rule: once a validated simulated roster places a player in IR, that player is excluded from active projection coverage for that simulated state.
- Active starter and bench gaps remain fail-closed. A missing mapping or weekly projection for any non-IR roster player still blocks complete future coverage.

## Safety boundary

The app does **not** create a zero-point projection for an IR player and does **not** guess when that player will return. ESPN remains authoritative for the roster slot. If ESPN later reports the player back on the bench or in the starting lineup, the player immediately re-enters projection-coverage requirements and missing data blocks analysis again.

This release does not change ESPN transaction legality, waiver availability, acquisition limits, locks, position limits, or the 0.5-point current-week waiver action threshold.
